import prisma from '../../lib/prisma';
import { CognitiveLoadIndicators, CognitiveLoadDetector } from './CognitiveLoadDetector';
import { StudentLearningProfile } from './StudentLearningProfileService';
import { WritingStage } from '../AIBoundaryService';

export interface EducationalIntervention {
  id: string;
  type: 'gentle_prompt' | 'process_question' | 'resource_suggestion' | 'peer_example' | 'break_suggestion' | 'encouragement';
  priority: 'low' | 'medium' | 'high';
  message: string;
  detailedContent?: string;
  actionButton?: {
    text: string;
    action: string; // e.g., 'take_break', 'view_resource', 'try_technique'
  };
  dismissable: boolean;
  expiresIn?: number; // seconds until auto-dismiss
  educationalRationale: string;
}

export interface InterventionDecision {
  shouldIntervene: boolean;
  intervention?: EducationalIntervention;
  cooldownMinutes?: number;
  reason: string;
}

export interface InterventionHistory {
  studentId: string;
  assignmentId: string;
  lastInterventionTime?: Date;
  interventionCount: number;
  acceptedInterventions: number;
  dismissedInterventions: number;
  effectiveness: number; // 0-100 score
}

export class RealTimeInterventionEngine {
  private static readonly COOLDOWN_PERIODS = {
    low: 15, // 15 minutes
    medium: 10, // 10 minutes
    high: 5 // 5 minutes for urgent interventions
  };
  
  private static readonly MAX_INTERVENTIONS_PER_HOUR = 4;
  
  /**
   * Decide whether to intervene based on cognitive load and context
   */
  static async evaluateInterventionNeed(
    cognitiveLoad: CognitiveLoadIndicators,
    writingStage: WritingStage,
    studentProfile: StudentLearningProfile,
    assignmentId: string
  ): Promise<InterventionDecision> {
    // Check intervention history first
    const history = await this.getInterventionHistory(studentProfile.studentId, assignmentId);
    
    // Check if we're in cooldown
    if (history.lastInterventionTime) {
      const minutesSinceLastIntervention = 
        (Date.now() - history.lastInterventionTime.getTime()) / (1000 * 60);
      
      const requiredCooldown = this.COOLDOWN_PERIODS[
        cognitiveLoad.estimatedLoad === 'overload' ? 'high' : 
        cognitiveLoad.estimatedLoad === 'high' ? 'medium' : 'low'
      ];
      
      if (minutesSinceLastIntervention < requiredCooldown) {
        return {
          shouldIntervene: false,
          cooldownMinutes: requiredCooldown - minutesSinceLastIntervention,
          reason: `Cooldown period active (${Math.ceil(requiredCooldown - minutesSinceLastIntervention)} minutes remaining)`
        };
      }
    }
    
    // Check if we've hit intervention limit
    if (history.interventionCount >= this.MAX_INTERVENTIONS_PER_HOUR) {
      return {
        shouldIntervene: false,
        reason: 'Hourly intervention limit reached'
      };
    }
    
    // Evaluate intervention need based on cognitive load
    const interventionThreshold = this.calculateInterventionThreshold(
      studentProfile,
      history
    );
    
    // Determine if intervention is needed
    let shouldIntervene = false;
    let priority: 'low' | 'medium' | 'high' = 'low';
    
    switch (cognitiveLoad.estimatedLoad) {
      case 'overload':
        shouldIntervene = cognitiveLoad.confidence >= 0.7;
        priority = 'high';
        break;
        
      case 'high':
        shouldIntervene = cognitiveLoad.confidence >= 0.8 && 
          (cognitiveLoad.progressStagnation || cognitiveLoad.timeOnTask > 30);
        priority = 'medium';
        break;
        
      case 'low':
        // Only intervene for low load if there's stagnation
        shouldIntervene = cognitiveLoad.progressStagnation && 
          cognitiveLoad.timeOnTask > 10;
        priority = 'low';
        break;
        
      case 'optimal':
        // Generally don't intervene during optimal flow
        shouldIntervene = false;
        break;
    }
    
    // Adjust based on student autonomy preferences
    if (studentProfile.independenceMetrics.trend === 'decreasing') {
      // Student is becoming more independent - raise intervention threshold
      shouldIntervene = shouldIntervene && cognitiveLoad.confidence >= interventionThreshold;
    }
    
    if (!shouldIntervene) {
      return {
        shouldIntervene: false,
        reason: 'Cognitive load within acceptable range'
      };
    }
    
    // Generate appropriate intervention
    const intervention = await this.generateIntervention(
      cognitiveLoad,
      writingStage,
      studentProfile,
      priority
    );
    
    return {
      shouldIntervene: true,
      intervention,
      reason: `${cognitiveLoad.estimatedLoad} cognitive load detected with ${Math.round(cognitiveLoad.confidence * 100)}% confidence`
    };
  }
  
  /**
   * Generate an appropriate educational intervention
   */
  private static async generateIntervention(
    cognitiveLoad: CognitiveLoadIndicators,
    writingStage: WritingStage,
    studentProfile: StudentLearningProfile,
    priority: 'low' | 'medium' | 'high'
  ): Promise<EducationalIntervention> {
    // Select intervention type based on cognitive load factors
    let type: EducationalIntervention['type'];
    let message: string;
    let detailedContent: string | undefined;
    let actionButton: EducationalIntervention['actionButton'] | undefined;
    let educationalRationale: string;
    
    // Overload interventions - focus on immediate relief
    if (cognitiveLoad.estimatedLoad === 'overload') {
      if (cognitiveLoad.cursorThrashing) {
        type = 'process_question';
        message = "It looks like you're jumping between sections. What's your main focus right now?";
        detailedContent = "Sometimes when we're overwhelmed, it helps to identify one specific point to work on. Which section feels most important to complete first?";
        educationalRationale = "Helps student prioritize and reduce cognitive scatter";
      } else if (cognitiveLoad.deletionRatio > 2) {
        type = 'gentle_prompt';
        message = "You're working hard on getting this just right. Remember, first drafts don't need to be perfect.";
        detailedContent = "Try writing your ideas without editing for the next 5 minutes. You can always revise later!";
        actionButton = { text: "Try freewriting", action: "start_freewrite" };
        educationalRationale = "Reduces perfectionism paralysis";
      } else {
        type = 'break_suggestion';
        message = "You've been working intensely. A short break can help refresh your thinking.";
        actionButton = { text: "Take 5-minute break", action: "take_break" };
        educationalRationale = "Cognitive rest improves subsequent performance";
      }
    }
    
    // High load interventions - provide structured support
    else if (cognitiveLoad.estimatedLoad === 'high') {
      if (cognitiveLoad.progressStagnation) {
        type = 'process_question';
        message = "Let's take a step back. What's the main point you want to make in this section?";
        detailedContent = "Sometimes explaining your ideas out loud (or writing them informally) can help clarify your thoughts.";
        educationalRationale = "Metacognitive reflection breaks through stagnation";
      } else if (studentProfile.currentState.emotionalState === 'frustrated') {
        type = 'encouragement';
        message = "Writing can be challenging, and that's okay. You're making progress, even if it doesn't feel like it.";
        detailedContent = "Every writer faces moments like this. What you're experiencing is part of the creative process.";
        educationalRationale = "Emotional support maintains engagement";
      } else {
        type = 'resource_suggestion';
        message = "Would you like to see how other students approached similar challenges?";
        actionButton = { text: "View examples", action: "view_peer_examples" };
        educationalRationale = "Peer modeling provides concrete strategies";
      }
    }
    
    // Low load interventions - encourage engagement
    else {
      if (cognitiveLoad.progressStagnation) {
        type = 'gentle_prompt';
        message = "Starting can be the hardest part. What's one idea you'd like to explore?";
        detailedContent = "Try writing just one sentence about your topic. Don't worry about making it perfect!";
        educationalRationale = "Reduces activation energy for writing";
      } else {
        type = 'process_question';
        message = "You have a good flow starting. What connections are you seeing in your ideas?";
        educationalRationale = "Encourages deeper thinking during low-stress periods";
      }
    }
    
    // Adjust message tone based on student preferences
    if (studentProfile.preferences.bestRespondsTo.includes('supportive')) {
      message = this.addSupportiveTone(message);
    }
    
    // Adjust for writing stage
    message = this.adjustForWritingStage(message, writingStage);
    
    return {
      id: `intervention_${Date.now()}`,
      type,
      priority,
      message,
      detailedContent,
      actionButton,
      dismissable: true,
      expiresIn: priority === 'high' ? undefined : 300, // 5 minutes for non-urgent
      educationalRationale
    };
  }
  
  /**
   * Calculate dynamic intervention threshold based on student history
   */
  private static calculateInterventionThreshold(
    studentProfile: StudentLearningProfile,
    history: InterventionHistory
  ): number {
    let threshold = 0.75; // Base threshold
    
    // Adjust based on intervention effectiveness
    if (history.effectiveness < 50 && history.interventionCount > 5) {
      // Interventions haven't been helpful - raise threshold
      threshold += 0.1;
    } else if (history.effectiveness > 80) {
      // Interventions have been helpful - lower threshold slightly
      threshold -= 0.05;
    }
    
    // Adjust based on student independence
    if (studentProfile.independenceMetrics.aiRequestFrequency < 2) {
      // Very independent student - raise threshold
      threshold += 0.1;
    }
    
    // Adjust based on acceptance rate
    const acceptanceRate = history.interventionCount > 0
      ? history.acceptedInterventions / history.interventionCount
      : 0.5;
    
    if (acceptanceRate < 0.3) {
      // Student dismisses most interventions - raise threshold
      threshold += 0.15;
    }
    
    return Math.min(0.95, Math.max(0.6, threshold));
  }
  
  /**
   * Get intervention history for a student
   */
  private static async getInterventionHistory(
    studentId: string,
    assignmentId: string
  ): Promise<InterventionHistory> {
    // Get interventions from the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const logs = await prisma.aIInteractionLog.findMany({
      where: {
        studentId,
        assignmentId,
        assistanceType: 'intervention',
        createdAt: { gte: oneHourAgo }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    const lastIntervention = logs[0];
    const interventionCount = logs.length;
    
    // Count accepted vs dismissed (would need to track this in metadata)
    let acceptedCount = 0;
    let dismissedCount = 0;
    
    logs.forEach(log => {
      const metadata = log.metadata as any;
      if (metadata?.accepted) acceptedCount++;
      else if (metadata?.dismissed) dismissedCount++;
    });
    
    // Calculate effectiveness based on subsequent behavior
    const effectiveness = await this.calculateInterventionEffectiveness(
      studentId,
      assignmentId,
      logs
    );
    
    return {
      studentId,
      assignmentId,
      lastInterventionTime: lastIntervention?.createdAt,
      interventionCount,
      acceptedInterventions: acceptedCount,
      dismissedInterventions: dismissedCount,
      effectiveness
    };
  }
  
  /**
   * Calculate how effective interventions have been
   */
  private static async calculateInterventionEffectiveness(
    studentId: string,
    assignmentId: string,
    interventionLogs: any[]
  ): Promise<number> {
    if (interventionLogs.length === 0) return 50; // Default neutral effectiveness
    
    let totalEffectiveness = 0;
    let measurableInterventions = 0;
    
    for (const log of interventionLogs) {
      // Look for behavior change after intervention
      const interventionTime = new Date(log.createdAt);
      const checkTime = new Date(interventionTime.getTime() + 10 * 60 * 1000); // 10 minutes later
      
      // Check if cognitive load improved
      const subsequentSession = await prisma.writingSession.findFirst({
        where: {
          userId: studentId,
          document: { assignmentId },
          startTime: { gte: interventionTime },
          endTime: { lte: checkTime }
        }
      });
      
      if (subsequentSession) {
        // Simple effectiveness: did they continue writing?
        const sessionActivity = subsequentSession.activity as any;
        if (sessionActivity?.wordsAdded > 50) {
          totalEffectiveness += 80; // Good outcome
        } else if (sessionActivity?.wordsAdded > 20) {
          totalEffectiveness += 60; // Moderate outcome
        } else {
          totalEffectiveness += 30; // Poor outcome
        }
        measurableInterventions++;
      }
    }
    
    return measurableInterventions > 0
      ? Math.round(totalEffectiveness / measurableInterventions)
      : 50;
  }
  
  /**
   * Add supportive tone to messages
   */
  private static addSupportiveTone(message: string): string {
    const supportivePrefixes = [
      "You're doing great. ",
      "Keep going! ",
      "You've got this. ",
      "Good effort so far. "
    ];
    
    const randomPrefix = supportivePrefixes[
      Math.floor(Math.random() * supportivePrefixes.length)
    ];
    
    return randomPrefix + message;
  }
  
  /**
   * Adjust message for writing stage
   */
  private static adjustForWritingStage(message: string, stage: WritingStage): string {
    const stageContext = {
      brainstorming: "During brainstorming, ",
      drafting: "While drafting, ",
      revising: "In revision, ",
      editing: "During editing, "
    };
    
    const context = stageContext[stage as keyof typeof stageContext];
    if (context && !message.toLowerCase().includes(stage)) {
      return context.toLowerCase() + message[0].toLowerCase() + message.slice(1);
    }
    
    return message;
  }
  
  /**
   * Log intervention delivery
   */
  static async logInterventionDelivery(
    intervention: EducationalIntervention,
    studentId: string,
    assignmentId: string,
    documentId: string
  ): Promise<void> {
    await prisma.aIInteractionLog.create({
      data: {
        studentId,
        assignmentId,
        assistanceType: 'intervention',
        questionsGenerated: 1,
        educationallySound: true,
        writingStage: 'drafting',
        questionText: intervention.message,
        responseId: intervention.id,
        metadata: {
          documentId,
          interventionType: intervention.type,
          priority: intervention.priority,
          rationale: intervention.educationalRationale,
          educationalContent: {
            interventionId: intervention.id,
            type: intervention.type,
            message: intervention.message,
            priority: intervention.priority
          }
        }
      }
    });
  }
  
  /**
   * Log intervention response (accepted/dismissed)
   */
  static async logInterventionResponse(
    interventionId: string,
    studentId: string,
    assignmentId: string,
    accepted: boolean,
    actionTaken?: string
  ): Promise<void> {
    await prisma.aIInteractionLog.create({
      data: {
        studentId,
        assignmentId,
        assistanceType: 'intervention_response',
        questionsGenerated: 0,
        educationallySound: true,
        writingStage: 'drafting',
        responseId: interventionId,
        metadata: {
          interventionId,
          accepted,
          actionTaken,
          responseTime: new Date(),
          action: accepted ? 'intervention_accepted' : 'intervention_dismissed'
        }
      }
    });
  }
  
  /**
   * Get intervention recommendations for educators
   */
  static async getEducatorInsights(
    studentId: string,
    courseId: string
  ): Promise<{
    recentInterventions: any[];
    effectivenessScore: number;
    recommendations: string[];
    patterns: string[];
  }> {
    // Get recent interventions across all assignments in course
    const recentInterventions = await prisma.aIInteractionLog.findMany({
      where: {
        studentId,
        assistanceType: 'intervention',
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last week
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    
    // Calculate overall effectiveness
    const effectivenessScore = await this.calculateInterventionEffectiveness(
      studentId,
      '', // All assignments
      recentInterventions
    );
    
    // Generate recommendations
    const recommendations: string[] = [];
    const patterns: string[] = [];
    
    // Analyze intervention patterns
    const typeCount: Record<string, number> = {};
    recentInterventions.forEach(log => {
      const metadata = log.metadata as any;
      const type = metadata?.interventionType || 'unknown';
      typeCount[type] = (typeCount[type] || 0) + 1;
    });
    
    // Identify patterns
    const mostCommonType = Object.entries(typeCount)
      .sort(([, a], [, b]) => b - a)[0];
    
    if (mostCommonType) {
      patterns.push(`Student frequently receives ${mostCommonType[0].replace('_', ' ')} interventions`);
      
      // Type-specific recommendations
      if (mostCommonType[0] === 'break_suggestion') {
        recommendations.push('Consider shorter assignment sessions with planned breaks');
      } else if (mostCommonType[0] === 'process_question') {
        recommendations.push('Student may benefit from additional scaffolding on planning');
      } else if (mostCommonType[0] === 'encouragement') {
        recommendations.push('Student may need confidence-building activities');
      }
    }
    
    if (effectivenessScore < 50) {
      recommendations.push('Current interventions show limited effectiveness');
      recommendations.push('Consider one-on-one check-in to understand student needs');
    } else if (effectivenessScore > 80) {
      patterns.push('Student responds well to automated interventions');
    }
    
    return {
      recentInterventions: recentInterventions.map(log => ({
        timestamp: log.createdAt,
        type: (log.metadata as any)?.interventionType,
        priority: (log.metadata as any)?.priority,
        content: log.questionText || (log.metadata as any)?.educationalContent?.message
      })),
      effectivenessScore,
      recommendations,
      patterns
    };
  }
}