import { v4 as uuidv4 } from 'uuid';
import { StudentLearningProfile, StudentLearningProfileService } from './StudentLearningProfileService';
import { WritingSession } from '@prisma/client';
import { ServiceFactory } from '../../container/ServiceFactory';
import { CacheKeyBuilder, CacheTTL } from '../../cache/CacheService';
import { 
  StudentStruggleDetectedEvent,
  InterventionTriggeredEvent,
  EventTypes 
} from '../../events/events';

export interface CognitiveLoadIndicators {
  // Behavioral patterns
  deletionRatio: number; // Deletes vs. additions
  pausePatterns: number[]; // Duration of pauses in seconds
  revisionCycles: number; // Write-delete-rewrite count
  cursorThrashing: boolean; // Rapid position changes
  
  // Progress indicators
  wordProductionRate: number; // Words per minute
  timeOnTask: number; // Minutes in current session
  progressStagnation: boolean; // No progress for >5 minutes
  
  // Calculated load
  estimatedLoad: 'low' | 'optimal' | 'high' | 'overload';
  confidence: number; // 0-1, confidence in estimation
  
  // Contributing factors
  factors: string[]; // Human-readable factors contributing to load
}

export interface WritingSessionActivity {
  charactersAdded: number;
  charactersDeleted: number;
  wordsAdded: number;
  wordsDeleted: number;
  pauseCount: number;
  copyPasteEvents: number;
  timestamps: number[]; // Millisecond timestamps of actions
  edits: Array<{
    timestamp: number;
    type: 'add' | 'delete';
    length: number;
    position: number;
  }>;
  cursorPositions?: number[]; // Optional cursor position tracking
}

export class CognitiveLoadDetector {
  private static readonly PAUSE_THRESHOLD = 3000; // 3 seconds = pause
  private static readonly THRASHING_THRESHOLD = 10; // Position changes in 30 seconds
  private static readonly STAGNATION_THRESHOLD = 300; // 5 minutes
  private static readonly OPTIMAL_WPM = 20; // Optimal words per minute
  
  private static serviceFactory = ServiceFactory.getInstance();
  
  /**
   * Real-time cognitive load assessment from writing behavior
   */
  static async detectFromSession(
    sessionData: WritingSession & { activity?: any },
    studentProfile?: StudentLearningProfile,
    context?: {
      studentId: string;
      courseId?: string;
      assignmentId?: string;
    }
  ): Promise<CognitiveLoadIndicators> {
    const activity = sessionData.activity as WritingSessionActivity;
    
    if (!activity) {
      return this.createDefaultIndicators();
    }
    
    // Calculate behavioral indicators
    const deletionRatio = this.calculateDeletionRatio(activity);
    const pausePatterns = this.analyzePauses(activity.timestamps);
    const revisionCycles = this.countRevisionCycles(activity.edits);
    const cursorThrashing = this.detectCursorThrashing(activity.cursorPositions);
    
    // Calculate progress indicators
    const wordProductionRate = this.calculateWordProductionRate(
      activity.wordsAdded,
      sessionData.duration || 0
    );
    const timeOnTask = (sessionData.duration || 0); // Keep in seconds for now
    const progressStagnation = this.detectStagnation(
      wordProductionRate,
      timeOnTask,
      activity.wordsAdded
    );
    
    // Estimate cognitive load with factors
    const { load, confidence, factors } = this.calculateLoadScore({
      deletionRatio,
      pausePatterns,
      revisionCycles,
      cursorThrashing,
      wordProductionRate,
      timeOnTask,
      progressStagnation,
      studentProfile
    });
    
    const indicators: CognitiveLoadIndicators = {
      deletionRatio,
      pausePatterns,
      revisionCycles,
      cursorThrashing,
      wordProductionRate,
      timeOnTask: timeOnTask / 60, // Convert to minutes for display
      progressStagnation,
      estimatedLoad: load,
      confidence,
      factors
    };
    
    // Publish events for high cognitive load or struggles
    if (context) {
      await this.publishCognitiveLoadEvents(indicators, context);
    }
    
    return indicators;
  }
  
  /**
   * Synchronous version for compatibility
   */
  static detectFromSessionSync(
    sessionData: WritingSession & { activity?: any },
    studentProfile?: StudentLearningProfile
  ): CognitiveLoadIndicators {
    const activity = sessionData.activity as WritingSessionActivity;
    
    if (!activity) {
      return this.createDefaultIndicators();
    }
    
    // Calculate behavioral indicators
    const deletionRatio = this.calculateDeletionRatio(activity);
    const pausePatterns = this.analyzePauses(activity.timestamps);
    const revisionCycles = this.countRevisionCycles(activity.edits);
    const cursorThrashing = this.detectCursorThrashing(activity.cursorPositions);
    
    // Calculate progress indicators
    const wordProductionRate = this.calculateWordProductionRate(
      activity.wordsAdded,
      sessionData.duration || 0
    );
    const timeOnTask = (sessionData.duration || 0); // Keep in seconds for now
    const progressStagnation = this.detectStagnation(
      wordProductionRate,
      timeOnTask,
      activity.wordsAdded
    );
    
    // Estimate cognitive load with factors
    const { load, confidence, factors } = this.calculateLoadScore({
      deletionRatio,
      pausePatterns,
      revisionCycles,
      cursorThrashing,
      wordProductionRate,
      timeOnTask,
      progressStagnation,
      studentProfile
    });
    
    return {
      deletionRatio,
      pausePatterns,
      revisionCycles,
      cursorThrashing,
      wordProductionRate,
      timeOnTask: timeOnTask / 60, // Convert to minutes for display
      progressStagnation,
      estimatedLoad: load,
      confidence,
      factors
    };
  }
  
  /**
   * Publish events based on cognitive load indicators
   */
  private static async publishCognitiveLoadEvents(
    indicators: CognitiveLoadIndicators,
    context: {
      studentId: string;
      courseId?: string;
      assignmentId?: string;
    }
  ): Promise<void> {
    const eventBus = this.serviceFactory.getEventBus();
    const cache = this.serviceFactory.getCache();
    const correlationId = uuidv4();
    
    // Check if we've recently sent an event for this student to avoid spam
    const cacheKey = CacheKeyBuilder.monitoringMetric('cognitive_load_event', context.studentId);
    const recentEvent = await cache.get<boolean>(cacheKey);
    if (recentEvent) {
      return; // Don't spam events
    }
    
    // Detect struggle conditions
    if (indicators.estimatedLoad === 'overload' || 
        (indicators.estimatedLoad === 'high' && indicators.confidence > 0.7)) {
      
      // Determine struggle type
      let struggleType: 'cognitive_overload' | 'writing_block' | 'concept_confusion' | 'time_management' = 'cognitive_overload';
      
      if (indicators.progressStagnation && indicators.wordProductionRate < 2) {
        struggleType = 'writing_block';
      } else if (indicators.revisionCycles > 5 && indicators.deletionRatio > 2) {
        struggleType = 'concept_confusion';
      }
      
      // Publish struggle detected event
      await eventBus.publish<StudentStruggleDetectedEvent>({
        type: EventTypes.STUDENT_STRUGGLE_DETECTED,
        correlationId,
        timestamp: new Date(),
        payload: {
          studentId: context.studentId,
          courseId: context.courseId || '',
          assignmentId: context.assignmentId,
          struggleType,
          severity: indicators.estimatedLoad === 'overload' ? 'high' : 'medium',
          indicators: indicators.factors,
          recommendedInterventions: this.getRecommendations(indicators)
        },
        metadata: { userId: context.studentId }
      });
      
      // Cache to prevent spam (5 minute cooldown)
      await cache.set(cacheKey, true, { ttl: 300 });
      
      // Trigger intervention for severe cases
      if (indicators.estimatedLoad === 'overload' && indicators.confidence > 0.8) {
        await this.triggerIntervention(indicators, context, correlationId);
      }
    }
  }
  
  /**
   * Trigger an intervention for high cognitive load
   */
  private static async triggerIntervention(
    indicators: CognitiveLoadIndicators,
    context: {
      studentId: string;
      courseId?: string;
      assignmentId?: string;
    },
    correlationId: string
  ): Promise<void> {
    const eventBus = this.serviceFactory.getEventBus();
    
    // Determine intervention type based on indicators
    const interventionActions = [];
    
    if (indicators.progressStagnation) {
      interventionActions.push({
        type: 'ui_prompt' as const,
        target: 'student' as const,
        content: 'It looks like you might be stuck. Would you like some help brainstorming ideas?'
      });
    }
    
    if (indicators.deletionRatio > 3) {
      interventionActions.push({
        type: 'ui_prompt' as const,
        target: 'student' as const,
        content: 'Perfectionism can slow progress. Try moving forward with a rough draft first.'
      });
    }
    
    if (indicators.timeOnTask > 60) {
      interventionActions.push({
        type: 'notification' as const,
        target: 'student' as const,
        content: 'You\'ve been working hard! Consider taking a 5-minute break to refresh.'
      });
    }
    
    // Always notify educator for high severity
    interventionActions.push({
      type: 'notification' as const,
      target: 'educator' as const,
      content: `Student ${context.studentId} is experiencing cognitive overload while writing.`
    });
    
    await eventBus.publish<InterventionTriggeredEvent>({
      type: EventTypes.INTERVENTION_TRIGGERED,
      correlationId,
      timestamp: new Date(),
      payload: {
        studentId: context.studentId,
        courseId: context.courseId || '',
        assignmentId: context.assignmentId,
        interventionType: 'automated',
        triggerReason: {
          type: 'cognitive_overload',
          severity: 'high',
          indicators: indicators.factors
        },
        intervention: {
          id: uuidv4(),
          title: 'Cognitive Load Support',
          description: 'Automated support for detected cognitive overload',
          actions: interventionActions
        },
        expectedOutcome: 'Reduce cognitive load and help student progress'
      },
      metadata: { userId: context.studentId }
    });
  }
  
  /**
   * Calculate deletion ratio with safety checks
   */
  private static calculateDeletionRatio(activity: WritingSessionActivity): number {
    const totalAdded = Math.max(1, activity.charactersAdded);
    return Math.min(activity.charactersDeleted / totalAdded, 5); // Cap at 5x
  }
  
  /**
   * Analyze pause patterns in writing
   */
  private static analyzePauses(timestamps: number[]): number[] {
    if (!timestamps || timestamps.length < 2) return [];
    
    const pauses: number[] = [];
    
    for (let i = 1; i < timestamps.length; i++) {
      const gap = timestamps[i] - timestamps[i - 1];
      if (gap >= this.PAUSE_THRESHOLD) {
        pauses.push(gap / 1000); // Convert to seconds
      }
    }
    
    return pauses;
  }
  
  /**
   * Count revision cycles (write-delete-rewrite patterns)
   */
  private static countRevisionCycles(edits?: WritingSessionActivity['edits']): number {
    if (!edits || edits.length < 3) return 0;
    
    let cycles = 0;
    let i = 0;
    
    while (i < edits.length - 2) {
      // Look for add-delete-add pattern in similar positions
      if (edits[i].type === 'add' && 
          edits[i + 1].type === 'delete' &&
          edits[i + 2].type === 'add' &&
          Math.abs(edits[i].position - edits[i + 2].position) < 50) {
        cycles++;
        i += 3; // Skip this cycle
      } else {
        i++;
      }
    }
    
    return cycles;
  }
  
  /**
   * Detect cursor thrashing (rapid position changes)
   */
  private static detectCursorThrashing(positions?: number[]): boolean {
    if (!positions || positions.length < this.THRASHING_THRESHOLD) return false;
    
    // Check last 30 seconds of cursor positions
    const recentPositions = positions.slice(-this.THRASHING_THRESHOLD);
    let changes = 0;
    
    for (let i = 1; i < recentPositions.length; i++) {
      if (Math.abs(recentPositions[i] - recentPositions[i - 1]) > 100) {
        changes++;
      }
    }
    
    return changes >= this.THRASHING_THRESHOLD * 0.7; // 70% are large jumps
  }
  
  /**
   * Calculate word production rate
   */
  private static calculateWordProductionRate(wordsAdded: number, durationSeconds: number): number {
    const durationMinutes = durationSeconds / 60;
    if (durationMinutes === 0) return 0;
    return wordsAdded / Math.max(1, durationMinutes);
  }
  
  /**
   * Detect writing stagnation
   */
  private static detectStagnation(
    wpm: number,
    timeOnTaskSeconds: number,
    totalWords: number
  ): boolean {
    const timeOnTaskMinutes = timeOnTaskSeconds / 60;
    // Stagnation if: low production rate AND sufficient time spent AND low total output
    return wpm < 2 && timeOnTaskMinutes > 5 && totalWords < 50;
  }
  
  /**
   * Calculate cognitive load score with contributing factors
   */
  private static calculateLoadScore(params: {
    deletionRatio: number;
    pausePatterns: number[];
    revisionCycles: number;
    cursorThrashing: boolean;
    wordProductionRate: number;
    timeOnTask: number;
    progressStagnation: boolean;
    studentProfile?: StudentLearningProfile;
  }): { load: 'low' | 'optimal' | 'high' | 'overload'; confidence: number; factors: string[] } {
    let score = 50; // Start neutral
    const factors: string[] = [];
    let confidence = 0.7; // Default confidence
    
    // Deletion ratio impact (0-30 points)
    if (params.deletionRatio > 2) {
      score += 20;
      factors.push('High deletion rate indicates struggle');
      if (params.deletionRatio > 3) {
        score += 10;
        factors.push('Excessive rewriting detected');
      }
    } else if (params.deletionRatio < 0.3) {
      score -= 10;
      factors.push('Smooth writing flow');
    }
    
    // Pause pattern impact (0-20 points)
    const avgPause = params.pausePatterns.length > 0
      ? params.pausePatterns.reduce((a, b) => a + b, 0) / params.pausePatterns.length
      : 0;
    
    if (avgPause > 10) {
      score += 15;
      factors.push('Long thinking pauses detected');
    } else if (avgPause > 5) {
      score += 5;
      factors.push('Moderate pauses for reflection');
    }
    
    // Revision cycles impact (0-15 points)
    if (params.revisionCycles > 5) {
      score += 15;
      factors.push('Frequent revision cycles');
    } else if (params.revisionCycles > 2) {
      score += 5;
      factors.push('Some revision activity');
    }
    
    // Cursor thrashing (0-10 points)
    if (params.cursorThrashing) {
      score += 10;
      factors.push('Jumping between sections frequently');
    }
    
    // Word production rate impact (0-20 points)
    if (params.wordProductionRate < 5) {
      score += 15;
      factors.push('Very slow writing pace');
    } else if (params.wordProductionRate < 10) {
      score += 5;
      factors.push('Below average writing pace');
    } else if (params.wordProductionRate > 30) {
      score -= 10;
      factors.push('Good writing flow');
    }
    
    // Progress stagnation (0-15 points)
    if (params.progressStagnation) {
      score += 15;
      factors.push('Writing progress has stalled');
      confidence += 0.1; // More confident when clear stagnation
    }
    
    // Time on task fatigue (0-10 points)
    const timeOnTaskMinutes = params.timeOnTask / 60;
    if (timeOnTaskMinutes > 60) {
      score += 10;
      factors.push('Extended session may cause fatigue');
    } else if (timeOnTaskMinutes > 30) {
      score += 5;
      factors.push('Moderate session length');
    }
    
    // Adjust based on student profile
    if (params.studentProfile) {
      // Students with lower reflection depth may struggle more
      if (params.studentProfile.preferences.averageReflectionDepth < 50) {
        score *= 1.1;
        factors.push('Student typically struggles with complex tasks');
      }
      
      // Current emotional state affects load
      if (params.studentProfile.currentState.emotionalState === 'frustrated') {
        score *= 1.2;
        factors.push('Already showing frustration');
        confidence += 0.1;
      } else if (params.studentProfile.currentState.emotionalState === 'confident') {
        score *= 0.9;
        factors.push('Student feeling confident');
      }
      
      // Use baseline patterns
      if (params.studentProfile.learningPatterns?.productivityPattern === 'burst' &&
          timeOnTaskMinutes < 15) {
        score *= 0.8; // Burst writers need less concern early
        factors.push('Normal pattern for burst writer');
      }
    }
    
    // Ensure score is within bounds
    score = Math.max(0, Math.min(100, score));
    confidence = Math.max(0.5, Math.min(1, confidence));
    
    // Determine load level
    let load: 'low' | 'optimal' | 'high' | 'overload';
    if (score >= 80) {
      load = 'overload';
      if (factors.length === 0) factors.push('Multiple stress indicators present');
    } else if (score >= 65) {
      load = 'high';
      if (factors.length === 0) factors.push('Showing signs of cognitive strain');
    } else if (score <= 35) {
      load = 'low';
      if (factors.length === 0) factors.push('Minimal cognitive demand');
    } else {
      load = 'optimal';
      if (factors.length === 0) factors.push('Healthy challenge level');
    }
    
    return { load, confidence, factors };
  }
  
  /**
   * Create default indicators when no activity data available
   */
  private static createDefaultIndicators(): CognitiveLoadIndicators {
    return {
      deletionRatio: 0,
      pausePatterns: [],
      revisionCycles: 0,
      cursorThrashing: false,
      wordProductionRate: 0,
      timeOnTask: 0,
      progressStagnation: false,
      estimatedLoad: 'optimal',
      confidence: 0.3,
      factors: ['Insufficient data for analysis']
    };
  }
  
  /**
   * Get recommendations based on cognitive load
   */
  static getRecommendations(indicators: CognitiveLoadIndicators): string[] {
    const recommendations: string[] = [];
    
    switch (indicators.estimatedLoad) {
      case 'overload':
        recommendations.push('Consider taking a 5-minute break');
        recommendations.push('Try breaking down your current paragraph into smaller points');
        recommendations.push('Focus on getting ideas down without worrying about perfection');
        break;
        
      case 'high':
        recommendations.push('You\'re working hard - remember to breathe');
        recommendations.push('Consider outlining your next few points');
        recommendations.push('It\'s okay to write a rough draft first');
        break;
        
      case 'optimal':
        recommendations.push('You\'re in a good flow - keep going!');
        recommendations.push('Your pace is sustainable');
        break;
        
      case 'low':
        if (indicators.timeOnTask < 5) {
          recommendations.push('Take a moment to gather your thoughts');
          recommendations.push('Review your assignment goals');
        } else {
          recommendations.push('Try freewriting for 5 minutes without stopping');
          recommendations.push('Consider changing your environment');
        }
        break;
    }
    
    // Specific recommendations based on indicators
    if (indicators.deletionRatio > 2) {
      recommendations.push('Perfectionism can slow progress - try moving forward');
    }
    
    if (indicators.cursorThrashing) {
      recommendations.push('Focus on one section at a time');
    }
    
    if (indicators.progressStagnation) {
      recommendations.push('Stuck? Try explaining your ideas out loud');
    }
    
    return recommendations;
  }
}