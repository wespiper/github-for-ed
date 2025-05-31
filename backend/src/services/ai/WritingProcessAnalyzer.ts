import prisma from '../../lib/prisma';
import { WritingSession } from '@prisma/client';
import { StudentLearningProfile } from './StudentLearningProfileService';
import { CognitiveLoadDetector, CognitiveLoadIndicators } from './CognitiveLoadDetector';

export interface WritingPattern {
  type: 'linear' | 'recursive' | 'exploratory' | 'perfectionist' | 'burst' | 'steady';
  confidence: number;
  evidence: string[];
}

export interface ProcessStage {
  stage: 'planning' | 'drafting' | 'revising' | 'editing' | 'polishing';
  duration: number; // minutes
  productivity: number; // words per minute
  revisionIntensity: number; // 0-1
  cognitiveLoad: 'low' | 'optimal' | 'high' | 'overload';
}

export interface WritingProcessInsights {
  studentId: string;
  assignmentId: string;
  
  // Overall patterns
  dominantPattern: WritingPattern;
  secondaryPatterns: WritingPattern[];
  
  // Process analysis
  processStages: ProcessStage[];
  timeDistribution: {
    planning: number;
    drafting: number;
    revising: number;
    editing: number;
    polishing: number;
  };
  
  // Quality indicators
  coherenceScore: number; // 0-100
  developmentScore: number; // 0-100
  revisionQuality: number; // 0-100
  
  // Behavioral insights
  productivePeriods: Array<{
    timeOfDay: string;
    productivityRate: number;
    cognitiveLoad: string;
  }>;
  strugglePoints: Array<{
    timestamp: Date;
    type: string;
    duration: number;
    resolved: boolean;
  }>;
  
  // Growth indicators
  improvementAreas: string[];
  strengths: string[];
  
  // Recommendations
  processRecommendations: string[];
  interventionSuggestions: string[];
}

export interface SessionPattern {
  sessionId: string;
  pattern: 'productive' | 'struggling' | 'exploratory' | 'revision-heavy' | 'stagnant';
  keyIndicators: string[];
  cognitiveLoadProfile: CognitiveLoadIndicators;
}

export class WritingProcessAnalyzer {
  /**
   * Analyze a student's writing process for an assignment
   */
  static async analyzeWritingProcess(
    studentId: string,
    assignmentId: string,
    profile?: StudentLearningProfile
  ): Promise<WritingProcessInsights> {
    // Get all writing sessions for this assignment
    const sessions = await prisma.writingSession.findMany({
      where: {
        userId: studentId,
        document: { assignmentId }
      },
      include: {
        document: true
      },
      orderBy: { startTime: 'asc' }
    });
    
    if (sessions.length === 0) {
      return this.createEmptyInsights(studentId, assignmentId);
    }
    
    // Analyze individual sessions
    const sessionPatterns = sessions.map(session => this.analyzeSession(session, profile));
    
    // Identify dominant writing pattern
    const dominantPattern = this.identifyDominantPattern(sessionPatterns);
    const secondaryPatterns = this.identifySecondaryPatterns(sessionPatterns, dominantPattern);
    
    // Analyze process stages
    const processStages = this.identifyProcessStages(sessions);
    const timeDistribution = this.calculateTimeDistribution(processStages);
    
    // Calculate quality scores
    const coherenceScore = this.calculateCoherenceScore(sessions);
    const developmentScore = this.calculateDevelopmentScore(sessions);
    const revisionQuality = this.calculateRevisionQuality(sessions);
    
    // Identify productive periods
    const productivePeriods = this.identifyProductivePeriods(sessions);
    
    // Identify struggle points
    const strugglePoints = this.identifyStrugglePoints(sessionPatterns, sessions);
    
    // Generate insights
    const { strengths, improvementAreas } = this.generateGrowthInsights(
      sessionPatterns,
      processStages,
      { coherenceScore, developmentScore, revisionQuality }
    );
    
    // Generate recommendations
    const processRecommendations = this.generateProcessRecommendations(
      dominantPattern,
      processStages,
      strugglePoints
    );
    
    const interventionSuggestions = this.generateInterventionSuggestions(
      strugglePoints,
      improvementAreas,
      profile
    );
    
    return {
      studentId,
      assignmentId,
      dominantPattern,
      secondaryPatterns,
      processStages,
      timeDistribution,
      coherenceScore,
      developmentScore,
      revisionQuality,
      productivePeriods,
      strugglePoints,
      improvementAreas,
      strengths,
      processRecommendations,
      interventionSuggestions
    };
  }
  
  /**
   * Analyze patterns across multiple assignments
   */
  static async analyzeCrossAssignmentPatterns(
    studentId: string,
    courseId?: string,
    timeframeDays: number = 30
  ): Promise<{
    consistentPatterns: string[];
    evolution: Array<{ date: Date; pattern: string; confidence: number }>;
    recommendations: string[];
  }> {
    const startDate = new Date(Date.now() - timeframeDays * 24 * 60 * 60 * 1000);
    
    // Get all assignments and their sessions
    const whereClause: any = {
      userId: studentId,
      startTime: { gte: startDate }
    };
    
    if (courseId) {
      whereClause.document = {
        assignment: { courseId }
      };
    }
    
    const sessions = await prisma.writingSession.findMany({
      where: whereClause,
      include: {
        document: {
          include: {
            assignment: true
          }
        }
      },
      orderBy: { startTime: 'asc' }
    });
    
    // Group by assignment
    const assignmentGroups = this.groupSessionsByAssignment(sessions);
    
    // Analyze each assignment
    const assignmentPatterns: Array<{ 
      assignmentId: string; 
      date: Date; 
      pattern: WritingPattern 
    }> = [];
    
    for (const [assignmentId, assignmentSessions] of Object.entries(assignmentGroups)) {
      const sessionPatterns = assignmentSessions.map(session => 
        this.analyzeSession(session as any)
      );
      const pattern = this.identifyDominantPattern(sessionPatterns);
      
      assignmentPatterns.push({
        assignmentId,
        date: assignmentSessions[0].startTime,
        pattern
      });
    }
    
    // Identify consistent patterns
    const patternCounts = new Map<string, number>();
    assignmentPatterns.forEach(ap => {
      const count = patternCounts.get(ap.pattern.type) || 0;
      patternCounts.set(ap.pattern.type, count + 1);
    });
    
    const consistentPatterns = Array.from(patternCounts.entries())
      .filter(([_, count]) => count >= assignmentPatterns.length * 0.6)
      .map(([pattern, _]) => pattern);
    
    // Track evolution
    const evolution = assignmentPatterns.map(ap => ({
      date: ap.date,
      pattern: ap.pattern.type,
      confidence: ap.pattern.confidence
    }));
    
    // Generate recommendations
    const recommendations = this.generateCrossAssignmentRecommendations(
      consistentPatterns,
      evolution
    );
    
    return {
      consistentPatterns,
      evolution,
      recommendations
    };
  }
  
  /**
   * Analyze a single writing session
   */
  private static analyzeSession(
    session: WritingSession & { document?: any },
    profile?: StudentLearningProfile
  ): SessionPattern {
    // Get cognitive load indicators
    const cognitiveLoadProfile = CognitiveLoadDetector.detectFromSession(session, profile);
    
    // Determine session pattern
    let pattern: SessionPattern['pattern'];
    const keyIndicators: string[] = [];
    
    const activity = session.activity as any;
    if (!activity) {
      pattern = 'stagnant';
      keyIndicators.push('No activity data');
    } else {
      const wordsPerMinute = activity.wordsAdded / ((session.duration || 0) / 60);
      const deletionRatio = activity.wordsDeleted / Math.max(1, activity.wordsAdded);
      
      if (wordsPerMinute < 5 && cognitiveLoadProfile.progressStagnation) {
        pattern = 'stagnant';
        keyIndicators.push('Low word production', 'Progress stagnation');
      } else if (deletionRatio > 0.7) {
        pattern = 'revision-heavy';
        keyIndicators.push(`High deletion ratio: ${(deletionRatio * 100).toFixed(0)}%`);
      } else if (cognitiveLoadProfile.estimatedLoad === 'high' || 
                 cognitiveLoadProfile.estimatedLoad === 'overload') {
        pattern = 'struggling';
        keyIndicators.push(`${cognitiveLoadProfile.estimatedLoad} cognitive load`);
        keyIndicators.push(...cognitiveLoadProfile.factors.slice(0, 2));
      } else if (activity.wordsAdded > 200 && deletionRatio < 0.3) {
        pattern = 'productive';
        keyIndicators.push(`High productivity: ${wordsPerMinute.toFixed(0)} wpm`);
      } else {
        pattern = 'exploratory';
        keyIndicators.push('Balanced writing and revision');
      }
    }
    
    return {
      sessionId: session.id,
      pattern,
      keyIndicators,
      cognitiveLoadProfile
    };
  }
  
  /**
   * Identify dominant writing pattern
   */
  private static identifyDominantPattern(sessionPatterns: SessionPattern[]): WritingPattern {
    const patternScores = new Map<WritingPattern['type'], number>();
    
    sessionPatterns.forEach(sp => {
      // Map session patterns to writing patterns
      if (sp.pattern === 'productive' && sp.cognitiveLoadProfile.wordProductionRate > 20) {
        this.incrementScore(patternScores, 'linear', 1);
      }
      if (sp.pattern === 'revision-heavy') {
        this.incrementScore(patternScores, 'recursive', 1);
        if (sp.cognitiveLoadProfile.deletionRatio > 2) {
          this.incrementScore(patternScores, 'perfectionist', 0.5);
        }
      }
      if (sp.pattern === 'exploratory') {
        this.incrementScore(patternScores, 'exploratory', 1);
      }
      if (sp.pattern === 'productive' && sp.cognitiveLoadProfile.timeOnTask < 30) {
        this.incrementScore(patternScores, 'burst', 0.7);
      }
      if (sp.pattern === 'productive' && sp.cognitiveLoadProfile.timeOnTask > 60) {
        this.incrementScore(patternScores, 'steady', 0.7);
      }
    });
    
    // Find dominant pattern
    let dominantType: WritingPattern['type'] = 'exploratory';
    let maxScore = 0;
    
    patternScores.forEach((score, type) => {
      if (score > maxScore) {
        maxScore = score;
        dominantType = type;
      }
    });
    
    const confidence = Math.min(0.95, maxScore / sessionPatterns.length);
    const evidence = this.getPatternEvidence(dominantType);
    
    return { type: dominantType, confidence, evidence };
  }
  
  /**
   * Identify secondary patterns
   */
  private static identifySecondaryPatterns(
    sessionPatterns: SessionPattern[],
    dominant: WritingPattern
  ): WritingPattern[] {
    const patterns: WritingPattern[] = [];
    
    // Look for patterns that appear in at least 30% of sessions
    const threshold = sessionPatterns.length * 0.3;
    
    // Check for perfectionist tendencies
    const perfectionistSessions = sessionPatterns.filter(sp => 
      sp.cognitiveLoadProfile.deletionRatio > 1.5 ||
      sp.cognitiveLoadProfile.revisionCycles > 5
    );
    
    if (perfectionistSessions.length >= threshold && dominant.type !== 'perfectionist') {
      patterns.push({
        type: 'perfectionist',
        confidence: perfectionistSessions.length / sessionPatterns.length,
        evidence: ['High deletion ratios', 'Multiple revision cycles']
      });
    }
    
    // Check for burst writing
    const burstSessions = sessionPatterns.filter(sp =>
      sp.pattern === 'productive' &&
      sp.cognitiveLoadProfile.timeOnTask < 30 &&
      sp.cognitiveLoadProfile.wordProductionRate > 25
    );
    
    if (burstSessions.length >= threshold && dominant.type !== 'burst') {
      patterns.push({
        type: 'burst',
        confidence: burstSessions.length / sessionPatterns.length,
        evidence: ['Short productive sessions', 'High word production rate']
      });
    }
    
    return patterns;
  }
  
  /**
   * Identify process stages from sessions
   */
  private static identifyProcessStages(sessions: WritingSession[]): ProcessStage[] {
    const stages: ProcessStage[] = [];
    
    sessions.forEach((session, index) => {
      const activity = session.activity as any || {};
      const duration = (session.duration || 0) / 60; // Convert to minutes
      
      // Determine stage based on session characteristics
      let stage: ProcessStage['stage'];
      let revisionIntensity = 0;
      
      if (index === 0 && activity.wordsAdded < 100) {
        stage = 'planning';
      } else if (activity.wordsDeleted > activity.wordsAdded * 0.5) {
        stage = 'revising';
        revisionIntensity = Math.min(1, activity.wordsDeleted / activity.wordsAdded);
      } else if (activity.wordsAdded > 100 && activity.wordsDeleted < activity.wordsAdded * 0.2) {
        stage = 'drafting';
      } else if (index >= sessions.length - 2 && activity.wordsAdded < 50) {
        stage = 'polishing';
      } else {
        stage = 'editing';
        revisionIntensity = 0.3;
      }
      
      const cognitiveLoad = CognitiveLoadDetector.detectFromSession(session);
      
      stages.push({
        stage,
        duration,
        productivity: activity.wordsAdded / Math.max(1, duration),
        revisionIntensity,
        cognitiveLoad: cognitiveLoad.estimatedLoad
      });
    });
    
    return stages;
  }
  
  /**
   * Calculate time distribution across stages
   */
  private static calculateTimeDistribution(stages: ProcessStage[]): WritingProcessInsights['timeDistribution'] {
    const distribution = {
      planning: 0,
      drafting: 0,
      revising: 0,
      editing: 0,
      polishing: 0
    };
    
    const totalTime = stages.reduce((sum, stage) => sum + stage.duration, 0);
    
    stages.forEach(stage => {
      distribution[stage.stage] += stage.duration;
    });
    
    // Convert to percentages
    Object.keys(distribution).forEach(key => {
      distribution[key as keyof typeof distribution] = 
        Math.round((distribution[key as keyof typeof distribution] / totalTime) * 100);
    });
    
    return distribution;
  }
  
  /**
   * Calculate coherence score based on writing flow
   */
  private static calculateCoherenceScore(sessions: WritingSession[]): number {
    let score = 70; // Base score
    
    // Check for consistent progress
    let lastWordCount = 0;
    let progressiveGrowth = 0;
    
    sessions.forEach(session => {
      const activity = session.activity as any;
      if (activity) {
        const currentWordCount = lastWordCount + activity.wordsAdded - activity.wordsDeleted;
        if (currentWordCount > lastWordCount) {
          progressiveGrowth++;
        }
        lastWordCount = currentWordCount;
      }
    });
    
    // Reward consistent progress
    const progressRate = progressiveGrowth / sessions.length;
    score += progressRate * 20;
    
    // Penalize excessive jumping (would need cursor position data)
    const jumpingSessions = sessions.filter(s => {
      const activity = s.activity as any;
      return activity?.cursorPositions?.length > 50;
    });
    
    score -= (jumpingSessions.length / sessions.length) * 10;
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }
  
  /**
   * Calculate development score
   */
  private static calculateDevelopmentScore(sessions: WritingSession[]): number {
    let score = 60; // Base score
    
    // Check for substantive additions
    const totalWordsAdded = sessions.reduce((sum, s) => {
      const activity = s.activity as any;
      return sum + (activity?.wordsAdded || 0);
    }, 0);
    
    // Reward substantial content
    if (totalWordsAdded > 1000) score += 20;
    else if (totalWordsAdded > 500) score += 10;
    
    // Check for development over time
    const sessionProgress = sessions.map(s => {
      const activity = s.activity as any;
      return activity?.wordsAdded || 0;
    });
    
    // Reward consistent development
    const consistentSessions = sessionProgress.filter(words => words > 50).length;
    score += (consistentSessions / sessions.length) * 20;
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }
  
  /**
   * Calculate revision quality score
   */
  private static calculateRevisionQuality(sessions: WritingSession[]): number {
    let score = 50; // Base score
    
    const revisionSessions = sessions.filter(s => {
      const activity = s.activity as any;
      return activity && activity.wordsDeleted > 0;
    });
    
    if (revisionSessions.length === 0) return score;
    
    // Check revision patterns
    revisionSessions.forEach(session => {
      const activity = session.activity as any;
      const deletionRatio = activity.wordsDeleted / Math.max(1, activity.wordsAdded);
      
      // Moderate revision is good
      if (deletionRatio > 0.2 && deletionRatio < 0.8) {
        score += 5;
      }
      // Excessive revision might indicate struggle
      else if (deletionRatio > 2) {
        score -= 5;
      }
    });
    
    // Reward revision spread across sessions
    const revisionRate = revisionSessions.length / sessions.length;
    if (revisionRate > 0.3 && revisionRate < 0.7) {
      score += 20;
    }
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }
  
  /**
   * Identify productive periods
   */
  private static identifyProductivePeriods(sessions: WritingSession[]): WritingProcessInsights['productivePeriods'] {
    const periodMap = new Map<string, { 
      totalWords: number; 
      totalTime: number; 
      loadSum: number;
      count: number;
    }>();
    
    sessions.forEach(session => {
      const hour = session.startTime.getHours();
      const timeOfDay = this.getTimeOfDay(hour);
      const activity = session.activity as any;
      
      if (activity) {
        const current = periodMap.get(timeOfDay) || {
          totalWords: 0,
          totalTime: 0,
          loadSum: 0,
          count: 0
        };
        
        const cognitiveLoad = CognitiveLoadDetector.detectFromSession(session);
        
        current.totalWords += activity.wordsAdded;
        current.totalTime += (session.duration || 0) / 60;
        current.loadSum += this.loadToNumber(cognitiveLoad.estimatedLoad);
        current.count++;
        
        periodMap.set(timeOfDay, current);
      }
    });
    
    return Array.from(periodMap.entries()).map(([timeOfDay, data]) => ({
      timeOfDay,
      productivityRate: data.totalWords / Math.max(1, data.totalTime),
      cognitiveLoad: this.numberToLoad(data.loadSum / data.count)
    })).sort((a, b) => b.productivityRate - a.productivityRate);
  }
  
  /**
   * Identify struggle points
   */
  private static identifyStrugglePoints(
    sessionPatterns: SessionPattern[],
    sessions: WritingSession[]
  ): WritingProcessInsights['strugglePoints'] {
    const strugglePoints: WritingProcessInsights['strugglePoints'] = [];
    
    sessionPatterns.forEach((pattern, index) => {
      if (pattern.pattern === 'struggling' || pattern.pattern === 'stagnant') {
        const session = sessions[index];
        const duration = (session.duration || 0) / 60;
        
        // Check if resolved in next session
        const resolved = index < sessionPatterns.length - 1 &&
          sessionPatterns[index + 1].pattern === 'productive';
        
        strugglePoints.push({
          timestamp: session.startTime,
          type: pattern.pattern,
          duration,
          resolved
        });
      }
    });
    
    return strugglePoints;
  }
  
  /**
   * Generate growth insights
   */
  private static generateGrowthInsights(
    sessionPatterns: SessionPattern[],
    processStages: ProcessStage[],
    qualityScores: { coherenceScore: number; developmentScore: number; revisionQuality: number }
  ): { strengths: string[]; improvementAreas: string[] } {
    const strengths: string[] = [];
    const improvementAreas: string[] = [];
    
    // Analyze strengths
    if (qualityScores.coherenceScore > 80) {
      strengths.push('Maintains strong coherence throughout writing');
    }
    if (qualityScores.developmentScore > 80) {
      strengths.push('Demonstrates robust content development');
    }
    if (qualityScores.revisionQuality > 70) {
      strengths.push('Shows effective revision practices');
    }
    
    const productiveSessions = sessionPatterns.filter(sp => sp.pattern === 'productive');
    if (productiveSessions.length > sessionPatterns.length * 0.6) {
      strengths.push('Consistently maintains productive writing sessions');
    }
    
    // Analyze improvement areas
    if (qualityScores.coherenceScore < 50) {
      improvementAreas.push('Work on maintaining focus and coherence');
    }
    if (qualityScores.developmentScore < 50) {
      improvementAreas.push('Focus on developing ideas more fully');
    }
    
    const strugglingSessions = sessionPatterns.filter(sp => 
      sp.pattern === 'struggling' || sp.pattern === 'stagnant'
    );
    if (strugglingSessions.length > sessionPatterns.length * 0.3) {
      improvementAreas.push('Develop strategies for overcoming writing blocks');
    }
    
    const highLoadStages = processStages.filter(ps => 
      ps.cognitiveLoad === 'high' || ps.cognitiveLoad === 'overload'
    );
    if (highLoadStages.length > processStages.length * 0.4) {
      improvementAreas.push('Practice stress management during writing');
    }
    
    return { strengths, improvementAreas };
  }
  
  /**
   * Generate process recommendations
   */
  private static generateProcessRecommendations(
    dominantPattern: WritingPattern,
    processStages: ProcessStage[],
    strugglePoints: WritingProcessInsights['strugglePoints']
  ): string[] {
    const recommendations: string[] = [];
    
    // Pattern-specific recommendations
    switch (dominantPattern.type) {
      case 'perfectionist':
        recommendations.push('Try timed freewriting to reduce over-editing');
        recommendations.push('Set revision limits for each session');
        break;
      case 'linear':
        recommendations.push('Consider adding reflection breaks to deepen thinking');
        break;
      case 'recursive':
        recommendations.push('Create an outline to guide your revision process');
        break;
      case 'burst':
        recommendations.push('Plan regular short writing sessions');
        recommendations.push('Use timers to maintain focus during bursts');
        break;
    }
    
    // Stage-specific recommendations
    const planningTime = processStages.filter(ps => ps.stage === 'planning')
      .reduce((sum, ps) => sum + ps.duration, 0);
    
    if (planningTime < 10) {
      recommendations.push('Spend more time planning before drafting');
    }
    
    // Struggle-based recommendations
    if (strugglePoints.length > 3) {
      recommendations.push('Break assignments into smaller, manageable chunks');
      recommendations.push('Identify your peak writing times and schedule accordingly');
    }
    
    return recommendations;
  }
  
  /**
   * Generate intervention suggestions
   */
  private static generateInterventionSuggestions(
    strugglePoints: WritingProcessInsights['strugglePoints'],
    improvementAreas: string[],
    profile?: StudentLearningProfile
  ): string[] {
    const suggestions: string[] = [];
    
    // Struggle-based interventions
    if (strugglePoints.filter(sp => !sp.resolved).length > 2) {
      suggestions.push('Provide scaffolding questions during stagnant periods');
      suggestions.push('Offer brainstorming techniques when stuck');
    }
    
    // Improvement-based interventions
    if (improvementAreas.includes('Work on maintaining focus and coherence')) {
      suggestions.push('Use focusing questions to maintain thread');
      suggestions.push('Provide organizational templates');
    }
    
    // Profile-based interventions
    if (profile?.currentState.emotionalState === 'frustrated') {
      suggestions.push('Include more encouragement and emotional support');
    }
    
    if (profile?.preferences.preferredLearningStyle === 'visual') {
      suggestions.push('Offer visual organizers and concept maps');
    }
    
    return suggestions;
  }
  
  /**
   * Helper methods
   */
  private static incrementScore(map: Map<WritingPattern['type'], number>, type: WritingPattern['type'], score: number): void {
    const current = map.get(type) || 0;
    map.set(type, current + score);
  }
  
  private static getPatternEvidence(type: WritingPattern['type']): string[] {
    const evidence: string[] = [];
    
    switch (type) {
      case 'linear':
        evidence.push('Consistent forward progress');
        evidence.push('Low deletion ratios');
        break;
      case 'recursive':
        evidence.push('Multiple revision cycles');
        evidence.push('Iterative development');
        break;
      case 'perfectionist':
        evidence.push('High deletion-to-addition ratio');
        evidence.push('Extended revision periods');
        break;
      case 'burst':
        evidence.push('Short, highly productive sessions');
        evidence.push('High words-per-minute rate');
        break;
      case 'steady':
        evidence.push('Consistent productivity');
        evidence.push('Sustained focus periods');
        break;
      case 'exploratory':
        evidence.push('Balanced writing and thinking');
        evidence.push('Varied session patterns');
        break;
    }
    
    return evidence;
  }
  
  private static getTimeOfDay(hour: number): string {
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }
  
  private static loadToNumber(load: string): number {
    switch (load) {
      case 'low': return 1;
      case 'optimal': return 2;
      case 'high': return 3;
      case 'overload': return 4;
      default: return 2;
    }
  }
  
  private static numberToLoad(num: number): string {
    if (num <= 1.5) return 'low';
    if (num <= 2.5) return 'optimal';
    if (num <= 3.5) return 'high';
    return 'overload';
  }
  
  private static groupSessionsByAssignment(sessions: any[]): Record<string, any[]> {
    const groups: Record<string, any[]> = {};
    
    sessions.forEach(session => {
      const assignmentId = session.document?.assignmentId || 'unknown';
      if (!groups[assignmentId]) {
        groups[assignmentId] = [];
      }
      groups[assignmentId].push(session);
    });
    
    return groups;
  }
  
  private static generateCrossAssignmentRecommendations(
    consistentPatterns: string[],
    evolution: Array<{ date: Date; pattern: string; confidence: number }>
  ): string[] {
    const recommendations: string[] = [];
    
    // Consistent pattern recommendations
    if (consistentPatterns.includes('perfectionist')) {
      recommendations.push('Student consistently shows perfectionist tendencies - introduce structured revision strategies');
    }
    if (consistentPatterns.includes('burst')) {
      recommendations.push('Student prefers burst writing - design assignments that accommodate this style');
    }
    
    // Evolution-based recommendations
    const recentPatterns = evolution.slice(-3).map(e => e.pattern);
    const uniqueRecent = new Set(recentPatterns);
    
    if (uniqueRecent.size === 3) {
      recommendations.push('Writing patterns are highly variable - help student find their optimal approach');
    }
    
    // Check for improvement
    const earlyConfidence = evolution.slice(0, 3).reduce((sum, e) => sum + e.confidence, 0) / 3;
    const recentConfidence = evolution.slice(-3).reduce((sum, e) => sum + e.confidence, 0) / 3;
    
    if (recentConfidence > earlyConfidence * 1.2) {
      recommendations.push('Student is developing more consistent writing patterns - reinforce current strategies');
    }
    
    return recommendations;
  }
  
  private static createEmptyInsights(studentId: string, assignmentId: string): WritingProcessInsights {
    return {
      studentId,
      assignmentId,
      dominantPattern: { type: 'exploratory', confidence: 0, evidence: [] },
      secondaryPatterns: [],
      processStages: [],
      timeDistribution: {
        planning: 0,
        drafting: 0,
        revising: 0,
        editing: 0,
        polishing: 0
      },
      coherenceScore: 0,
      developmentScore: 0,
      revisionQuality: 0,
      productivePeriods: [],
      strugglePoints: [],
      improvementAreas: ['No data available for analysis'],
      strengths: [],
      processRecommendations: ['Encourage student to begin writing'],
      interventionSuggestions: ['Provide initial writing support']
    };
  }
}