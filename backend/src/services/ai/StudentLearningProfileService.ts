import prisma from '../../lib/prisma';
import { AIInteractionLog, ReflectionAnalysis } from '@prisma/client';
import { CacheService, CacheKeys, CacheTTL } from '../CacheService';

export interface StudentLearningProfile {
  studentId: string;
  
  // Cognitive preferences from interaction history
  preferences: {
    questionComplexity: 'concrete' | 'mixed' | 'abstract';
    bestRespondsTo: string[]; // Types of questions that generate engagement
    strugglesWithTopics: string[]; // Topics that cause difficulty
    averageReflectionDepth: number;
    preferredLearningStyle: 'visual' | 'verbal' | 'kinesthetic' | 'mixed';
  };
  
  // Demonstrated capabilities
  strengths: {
    evidenceAnalysis: number; // 0-100
    perspectiveTaking: number;
    logicalReasoning: number;
    creativeThinking: number;
    organizationalSkills: number;
    metacognition: number;
  };
  
  // Current state (updates in real-time)
  currentState: {
    cognitiveLoad: 'low' | 'optimal' | 'high' | 'overload';
    recentBreakthrough: boolean;
    strugglingDuration: number; // minutes in current struggle
    lastSuccessfulInteraction: Date | null;
    currentFocus: string | null; // What they're working on
    emotionalState: 'frustrated' | 'neutral' | 'engaged' | 'confident';
  };
  
  // Independence trajectory
  independenceMetrics: {
    aiRequestFrequency: number; // requests per hour
    independentWorkStreak: number; // minutes without AI
    qualityWithoutAI: number; // performance in AI-free work
    trend: 'increasing' | 'stable' | 'decreasing';
    lastMilestone: string | null;
  };
  
  // Learning patterns
  learningPatterns: {
    bestTimeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
    averageSessionLength: number; // minutes
    breakFrequency: number; // breaks per hour
    productivityPattern: 'steady' | 'burst' | 'gradual';
  };
}

export interface WritingSessionMetrics {
  duration: number;
  wordsWritten: number;
  deletionRatio: number;
  pauseCount: number;
  revisionCycles: number;
  aiInteractionCount: number;
}

export class StudentLearningProfileService {
  /**
   * Build comprehensive profile from multiple data sources
   */
  static async buildProfile(studentId: string): Promise<StudentLearningProfile> {
    // Check cache first
    const cacheKey = CacheKeys.studentProfile(studentId);
    const cached = CacheService.get<StudentLearningProfile>(cacheKey);
    if (cached) {
      return cached;
    }

    // Aggregate data from multiple sources
    const [interactions, reflections, sessions, submissions] = await Promise.all([
      prisma.aIInteractionLog.findMany({
        where: { studentId },
        orderBy: { createdAt: 'desc' },
        take: 50 // Last 50 interactions
      }),
      prisma.reflectionAnalysis.findMany({
        where: { studentId },
        orderBy: { createdAt: 'desc' },
        take: 20
      }),
      prisma.writingSession.findMany({
        where: { userId: studentId },
        orderBy: { startTime: 'desc' },
        take: 10,
        include: {
          document: {
            include: {
              versions: true
            }
          }
        }
      }),
      prisma.assignmentSubmission.findMany({
        where: { authorId: studentId },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        include: {
          assignment: true
        }
      })
    ]);
    
    const profile = {
      studentId,
      preferences: await this.analyzePreferences(interactions, reflections),
      strengths: await this.assessStrengths(submissions, reflections),
      currentState: await this.assessCurrentState(sessions, interactions),
      independenceMetrics: await this.calculateIndependence(sessions, interactions),
      learningPatterns: await this.analyzeLearningPatterns(sessions, interactions)
    };

    // Cache the profile
    CacheService.set(cacheKey, profile, CacheTTL.studentProfile);

    return profile;
  }

  /**
   * Analyze cognitive preferences from interaction history
   */
  private static async analyzePreferences(
    interactions: AIInteractionLog[],
    reflections: ReflectionAnalysis[]
  ): Promise<StudentLearningProfile['preferences']> {
    // Analyze question complexity preferences
    let concreteCount = 0;
    let abstractCount = 0;
    
    reflections.forEach(reflection => {
      if (reflection.abstractionLevel <= 2) concreteCount++;
      else if (reflection.abstractionLevel >= 4) abstractCount++;
    });
    
    const totalCount = concreteCount + abstractCount;
    let questionComplexity: 'concrete' | 'mixed' | 'abstract' = 'mixed';
    if (totalCount > 5) {
      if (concreteCount / totalCount > 0.7) questionComplexity = 'concrete';
      else if (abstractCount / totalCount > 0.7) questionComplexity = 'abstract';
    }
    
    // Analyze what types of questions generate best responses
    const highQualityReflections = reflections.filter(r => r.overallQualityScore > 70);
    const bestRespondsTo: string[] = [];
    
    if (highQualityReflections.some(r => r.criticalThinkingScore > 80)) {
      bestRespondsTo.push('analytical_questions');
    }
    if (highQualityReflections.some(r => r.selfAwarenessScore > 80)) {
      bestRespondsTo.push('metacognitive_questions');
    }
    if (highQualityReflections.some(r => r.growthMindsetScore > 80)) {
      bestRespondsTo.push('growth_oriented_questions');
    }
    
    // Identify struggle topics from low-quality reflections
    const strugglesWithTopics: string[] = [];
    const lowQualityReflections = reflections.filter(r => r.overallQualityScore < 40);
    
    // In a real implementation, we'd analyze the content of interactions
    // For now, we'll use reflection patterns
    if (lowQualityReflections.some(r => r.depthScore < 30)) {
      strugglesWithTopics.push('complex_analysis');
    }
    if (lowQualityReflections.some(r => r.criticalThinkingScore < 30)) {
      strugglesWithTopics.push('critical_evaluation');
    }
    
    // Calculate average reflection depth
    const averageReflectionDepth = reflections.length > 0
      ? Math.round(reflections.reduce((sum, r) => sum + r.depthScore, 0) / reflections.length)
      : 50;
    
    // Determine learning style preference
    // This is simplified - in reality, we'd analyze content patterns
    const preferredLearningStyle = 'mixed'; // Default for now
    
    return {
      questionComplexity,
      bestRespondsTo,
      strugglesWithTopics,
      averageReflectionDepth,
      preferredLearningStyle
    };
  }

  /**
   * Assess student strengths from submissions and reflections
   */
  private static async assessStrengths(
    submissions: any[],
    reflections: ReflectionAnalysis[]
  ): Promise<StudentLearningProfile['strengths']> {
    // Calculate strength scores based on reflection patterns
    const evidenceAnalysis = this.calculateStrengthScore(reflections, 'depthScore', 'reasoningChains');
    const perspectiveTaking = this.calculateStrengthScore(reflections, 'evaluatesPerspectives');
    const logicalReasoning = this.calculateStrengthScore(reflections, 'criticalThinkingScore', 'synthesizesIdeas');
    const creativeThinking = this.calculateStrengthScore(reflections, 'offersAlternatives');
    const organizationalSkills = this.calculateSubmissionScore(submissions);
    const metacognition = this.calculateStrengthScore(reflections, 'selfAwarenessScore', 'identifiesLearningProcess');
    
    return {
      evidenceAnalysis,
      perspectiveTaking,
      logicalReasoning,
      creativeThinking,
      organizationalSkills,
      metacognition
    };
  }

  /**
   * Calculate strength score from reflection data
   */
  private static calculateStrengthScore(
    reflections: ReflectionAnalysis[],
    ...fields: string[]
  ): number {
    if (reflections.length === 0) return 50; // Default middle score
    
    let totalScore = 0;
    let count = 0;
    
    reflections.forEach(reflection => {
      fields.forEach(field => {
        const value = (reflection as any)[field];
        if (typeof value === 'number') {
          totalScore += value;
          count++;
        } else if (typeof value === 'boolean' && value) {
          totalScore += 100;
          count++;
        }
      });
    });
    
    return count > 0 ? Math.round(totalScore / count) : 50;
  }

  /**
   * Calculate organizational skills from submission patterns
   */
  private static calculateSubmissionScore(submissions: any[]): number {
    if (submissions.length === 0) return 50;
    
    // Check for on-time submissions, revision patterns, etc.
    let score = 50;
    
    // Boost score for on-time submissions
    const onTimeSubmissions = submissions.filter(s => 
      s.submittedAt && s.assignment?.dueDate && 
      new Date(s.submittedAt) <= new Date(s.assignment.dueDate)
    );
    
    if (onTimeSubmissions.length > submissions.length * 0.8) {
      score += 20;
    }
    
    // Boost for multiple drafts (shows revision)
    const multiDraftSubmissions = submissions.filter(s => 
      s.versions && s.versions.length > 2
    );
    
    if (multiDraftSubmissions.length > submissions.length * 0.5) {
      score += 15;
    }
    
    return Math.min(score, 100);
  }

  /**
   * Assess current cognitive and emotional state
   */
  private static async assessCurrentState(
    sessions: any[],
    interactions: AIInteractionLog[]
  ): Promise<StudentLearningProfile['currentState']> {
    // Get most recent session
    const currentSession = sessions[0];
    const recentInteractions = interactions.slice(0, 5);
    
    // Default state
    let cognitiveLoad: StudentLearningProfile['currentState']['cognitiveLoad'] = 'optimal';
    let emotionalState: StudentLearningProfile['currentState']['emotionalState'] = 'neutral';
    let strugglingDuration = 0;
    let recentBreakthrough = false;
    
    if (currentSession && currentSession.activity) {
      const activity = currentSession.activity as any;
      
      // Analyze cognitive load from session metrics
      const deletionRatio = activity.charactersDeleted / Math.max(1, activity.charactersAdded);
      const sessionDuration = currentSession.duration || 0;
      
      if (deletionRatio > 0.8 && sessionDuration > 10) {
        cognitiveLoad = 'high';
        if (deletionRatio > 1.2) cognitiveLoad = 'overload';
      } else if (deletionRatio < 0.2 && activity.charactersAdded > 500) {
        cognitiveLoad = 'low';
      }
      
      // Check for struggling patterns
      if (activity.pauseCount > 10 && deletionRatio > 0.6) {
        strugglingDuration = sessionDuration;
        emotionalState = 'frustrated';
      }
    }
    
    // Check for recent breakthroughs
    const recentHighQualityReflection = interactions.some(i => 
      i.reflectionQualityScore && i.reflectionQualityScore > 80 &&
      i.createdAt > new Date(Date.now() - 24 * 60 * 60 * 1000)
    );
    
    if (recentHighQualityReflection) {
      recentBreakthrough = true;
      emotionalState = 'confident';
    }
    
    // Check engagement level
    if (recentInteractions.length >= 3) {
      const avgQuality = recentInteractions.reduce((sum, i) => 
        sum + (i.reflectionQualityScore || 0), 0
      ) / recentInteractions.length;
      
      if (avgQuality > 70) emotionalState = 'engaged';
    }
    
    return {
      cognitiveLoad,
      recentBreakthrough,
      strugglingDuration,
      lastSuccessfulInteraction: recentInteractions.find(i => 
        i.reflectionQualityScore && i.reflectionQualityScore > 60
      )?.createdAt || null,
      currentFocus: currentSession?.document?.title || null,
      emotionalState
    };
  }

  /**
   * Calculate independence metrics
   */
  private static async calculateIndependence(
    sessions: any[],
    interactions: AIInteractionLog[]
  ): Promise<StudentLearningProfile['independenceMetrics']> {
    // Calculate AI request frequency
    const hoursSinceFirstInteraction = interactions.length > 0
      ? (Date.now() - new Date(interactions[interactions.length - 1].createdAt).getTime()) / (1000 * 60 * 60)
      : 1;
    
    const aiRequestFrequency = interactions.length / Math.max(1, hoursSinceFirstInteraction);
    
    // Calculate independent work streak
    let independentWorkStreak = 0;
    if (sessions.length > 0 && interactions.length > 0) {
      const lastSession = sessions[0];
      const lastInteraction = interactions[0];
      
      if (lastSession.startTime > lastInteraction.createdAt) {
        independentWorkStreak = lastSession.duration || 0;
      }
    }
    
    // Analyze trend
    let trend: 'increasing' | 'stable' | 'decreasing' = 'stable';
    if (interactions.length >= 10) {
      const recentRequests = interactions.slice(0, 5).length;
      const olderRequests = interactions.slice(5, 10).length;
      
      if (recentRequests < olderRequests * 0.7) trend = 'decreasing';
      else if (recentRequests > olderRequests * 1.3) trend = 'increasing';
    }
    
    // Calculate quality without AI
    const sessionsWithoutAI = sessions.filter(session => {
      const sessionStart = new Date(session.startTime);
      const sessionEnd = new Date(session.endTime || sessionStart.getTime() + (session.duration || 0) * 60 * 1000);
      
      return !interactions.some(i => {
        const interactionTime = new Date(i.createdAt);
        return interactionTime >= sessionStart && interactionTime <= sessionEnd;
      });
    });
    
    // For now, estimate quality based on session productivity
    const qualityWithoutAI = sessionsWithoutAI.length > 0 ? 70 : 50;
    
    return {
      aiRequestFrequency: Math.round(aiRequestFrequency * 10) / 10,
      independentWorkStreak,
      qualityWithoutAI,
      trend,
      lastMilestone: trend === 'decreasing' ? 'Reduced AI dependency by 30%' : null
    };
  }

  /**
   * Analyze learning patterns from session data
   */
  private static async analyzeLearningPatterns(
    sessions: any[],
    interactions: AIInteractionLog[]
  ): Promise<StudentLearningProfile['learningPatterns']> {
    // Analyze time of day preferences
    const timeDistribution = {
      morning: 0,
      afternoon: 0,
      evening: 0,
      night: 0
    };
    
    sessions.forEach(session => {
      const hour = new Date(session.startTime).getHours();
      if (hour >= 6 && hour < 12) timeDistribution.morning++;
      else if (hour >= 12 && hour < 17) timeDistribution.afternoon++;
      else if (hour >= 17 && hour < 22) timeDistribution.evening++;
      else timeDistribution.night++;
    });
    
    const bestTimeOfDay = Object.entries(timeDistribution)
      .sort(([, a], [, b]) => b - a)[0][0] as any;
    
    // Calculate average session length
    const totalDuration = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    const averageSessionLength = sessions.length > 0 
      ? Math.round(totalDuration / sessions.length)
      : 30;
    
    // Analyze break patterns
    let breakFrequency = 0;
    sessions.forEach(session => {
      if (session.activity && (session.activity as any).pauseCount) {
        const pausesPerHour = (session.activity as any).pauseCount / Math.max(1, (session.duration || 60) / 60);
        breakFrequency += pausesPerHour;
      }
    });
    breakFrequency = sessions.length > 0 ? breakFrequency / sessions.length : 2;
    
    // Determine productivity pattern
    let productivityPattern: 'steady' | 'burst' | 'gradual' = 'steady';
    if (sessions.length >= 3) {
      const sessionProductivity = sessions.slice(0, 3).map(s => {
        const activity = s.activity as any;
        return activity ? activity.charactersAdded / Math.max(1, s.duration || 60) : 0;
      });
      
      const avgProductivity = sessionProductivity.reduce((a, b) => a + b, 0) / 3;
      const variance = sessionProductivity.reduce((sum, p) => 
        sum + Math.pow(p - avgProductivity, 2), 0
      ) / 3;
      
      if (variance > avgProductivity * 0.5) productivityPattern = 'burst';
      else if (sessionProductivity[0] < sessionProductivity[2] * 0.7) productivityPattern = 'gradual';
    }
    
    return {
      bestTimeOfDay,
      averageSessionLength,
      breakFrequency: Math.round(breakFrequency * 10) / 10,
      productivityPattern
    };
  }

  /**
   * Update profile with real-time session data
   */
  static async updateRealTimeState(
    studentId: string,
    sessionData: WritingSessionMetrics
  ): Promise<void> {
    const profile = await this.buildProfile(studentId);
    
    // Detect cognitive load from behavior patterns
    const cognitiveLoad = this.detectCognitiveLoad(sessionData, profile);
    
    // Check if we need to update the database
    const existingProfile = await prisma.studentProfile.findUnique({
      where: { studentId }
    });
    
    if (existingProfile) {
      await prisma.studentProfile.update({
        where: { studentId },
        data: {
          currentCognitiveLoad: cognitiveLoad,
          lastActivityTime: new Date(),
          currentFocus: profile.currentState.currentFocus,
          emotionalState: profile.currentState.emotionalState,
          strugglingDuration: profile.currentState.strugglingDuration,
          updatedAt: new Date()
        }
      });
    } else {
      await prisma.studentProfile.create({
        data: {
          studentId,
          questionComplexity: profile.preferences.questionComplexity,
          preferredLearningStyle: profile.preferences.preferredLearningStyle,
          currentCognitiveLoad: cognitiveLoad,
          lastActivityTime: new Date(),
          currentFocus: profile.currentState.currentFocus,
          emotionalState: profile.currentState.emotionalState,
          strugglingDuration: profile.currentState.strugglingDuration
        }
      });
    }
  }

  /**
   * Detect cognitive load from session metrics
   */
  private static detectCognitiveLoad(
    sessionData: WritingSessionMetrics,
    profile: StudentLearningProfile
  ): StudentLearningProfile['currentState']['cognitiveLoad'] {
    const { deletionRatio, pauseCount, revisionCycles, duration } = sessionData;
    
    // Calculate load indicators
    let loadScore = 50; // Start neutral
    
    // High deletion ratio indicates struggle
    if (deletionRatio > 0.8) loadScore += 20;
    else if (deletionRatio > 0.5) loadScore += 10;
    else if (deletionRatio < 0.2) loadScore -= 10;
    
    // Many pauses indicate processing difficulty
    const pausesPerMinute = pauseCount / Math.max(1, duration);
    if (pausesPerMinute > 2) loadScore += 15;
    else if (pausesPerMinute < 0.5) loadScore -= 10;
    
    // Revision cycles indicate iterative thinking
    if (revisionCycles > 5) loadScore += 15;
    else if (revisionCycles < 2) loadScore -= 5;
    
    // Adjust based on student baseline
    if (profile.preferences.averageReflectionDepth < 50) {
      loadScore *= 1.2; // Students who struggle need more support
    } else if (profile.preferences.averageReflectionDepth > 80) {
      loadScore *= 0.8; // High performers can handle more
    }
    
    // Categorize load
    if (loadScore >= 80) return 'overload';
    if (loadScore >= 65) return 'high';
    if (loadScore <= 35) return 'low';
    return 'optimal';
  }

  /**
   * Get recommendations for educators based on profile
   */
  static async getEducatorRecommendations(
    studentId: string
  ): Promise<{
    immediateActions: string[];
    longTermStrategies: string[];
    strengthsToLeverage: string[];
    areasForSupport: string[];
  }> {
    const profile = await this.buildProfile(studentId);
    
    const immediateActions: string[] = [];
    const longTermStrategies: string[] = [];
    const strengthsToLeverage: string[] = [];
    const areasForSupport: string[] = [];
    
    // Immediate actions based on current state
    if (profile.currentState.cognitiveLoad === 'overload') {
      immediateActions.push('Consider breaking down the current assignment into smaller tasks');
      immediateActions.push('Provide additional scaffolding or examples');
    }
    
    if (profile.currentState.emotionalState === 'frustrated') {
      immediateActions.push('Schedule a one-on-one check-in');
      immediateActions.push('Offer alternative approaches to the current task');
    }
    
    // Long-term strategies based on patterns
    if (profile.independenceMetrics.trend === 'increasing') {
      longTermStrategies.push('Gradually reduce AI access to build independence');
      longTermStrategies.push('Introduce peer collaboration opportunities');
    }
    
    if (profile.preferences.questionComplexity === 'concrete') {
      longTermStrategies.push('Progressively introduce more abstract concepts');
      longTermStrategies.push('Use concrete examples as bridges to abstract thinking');
    }
    
    // Identify strengths to leverage
    Object.entries(profile.strengths).forEach(([skill, score]) => {
      if (score > 70) {
        strengthsToLeverage.push(`Strong ${skill.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
      }
    });
    
    // Identify areas needing support
    Object.entries(profile.strengths).forEach(([skill, score]) => {
      if (score < 40) {
        areasForSupport.push(`Develop ${skill.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
      }
    });
    
    profile.preferences.strugglesWithTopics.forEach(topic => {
      areasForSupport.push(`Provide additional support for ${topic.replace(/_/g, ' ')}`);
    });
    
    return {
      immediateActions,
      longTermStrategies,
      strengthsToLeverage,
      areasForSupport
    };
  }
}