import prisma from '../lib/prisma';
import { ExternalAIDetectionService } from './ai/ExternalAIDetectionService';
import { AcademicIntegrityService } from './ai/AcademicIntegrityService';
import { StudentLearningProfileService } from './ai/StudentLearningProfileService';

export interface WritingSessionUpdate {
  sessionId: string;
  documentId: string;
  userId: string;
  
  // Real-time metrics
  charactersAdded: number;
  charactersDeleted: number;
  wordsAdded: number;
  wordsDeleted: number;
  
  // Behavioral patterns
  copyPasteEvents: number;
  bulkTextAdditions: number; // Large chunks added at once
  pauseDurations: number[]; // Time between keystrokes
  
  // Session info
  duration: number; // Total minutes
  lastActivity: Date;
}

export interface WritingAnomalyAlert {
  type: 'suspicious_addition' | 'style_change' | 'ai_pattern' | 'copy_paste';
  severity: 'low' | 'medium' | 'high';
  description: string;
  timestamp: Date;
  requiresReview: boolean;
}

export class WritingMonitorService {
  private static readonly BULK_TEXT_THRESHOLD = 500; // Characters
  private static readonly SUSPICIOUS_TYPING_SPEED = 120; // WPM
  private static readonly STYLE_CHECK_INTERVAL = 300; // 5 minutes
  
  /**
   * Process real-time writing session update
   */
  static async processSessionUpdate(update: WritingSessionUpdate): Promise<void> {
    // Update session metrics
    await this.updateSessionMetrics(update);
    
    // Check for anomalies
    const anomalies = await this.detectAnomalies(update);
    
    // If suspicious activity, trigger deeper analysis
    if (anomalies.some(a => a.severity === 'high')) {
      await this.triggerDeepAnalysis(update.documentId, update.sessionId);
    }
    
    // Update student profile with real-time data
    await this.updateStudentProfile(update);
    
    // Store anomalies for educator review if needed
    if (anomalies.length > 0) {
      await this.storeAnomalies(update.sessionId, anomalies);
    }
  }

  /**
   * Detect writing anomalies in real-time
   */
  private static async detectAnomalies(
    update: WritingSessionUpdate
  ): Promise<WritingAnomalyAlert[]> {
    const anomalies: WritingAnomalyAlert[] = [];
    
    // Check for bulk text additions (potential copy-paste)
    if (update.bulkTextAdditions > 0) {
      const lastAddition = await this.getLastBulkAddition(update.sessionId);
      if (lastAddition && lastAddition.characters > this.BULK_TEXT_THRESHOLD) {
        anomalies.push({
          type: 'suspicious_addition',
          severity: 'medium',
          description: `Added ${lastAddition.characters} characters at once`,
          timestamp: new Date(),
          requiresReview: true
        });
      }
    }
    
    // Check typing speed
    const typingSpeed = this.calculateTypingSpeed(update);
    if (typingSpeed > this.SUSPICIOUS_TYPING_SPEED) {
      anomalies.push({
        type: 'ai_pattern',
        severity: 'low',
        description: `Unusually fast typing speed: ${typingSpeed} WPM`,
        timestamp: new Date(),
        requiresReview: false
      });
    }
    
    // Check copy-paste frequency
    if (update.copyPasteEvents > 5) {
      anomalies.push({
        type: 'copy_paste',
        severity: 'medium',
        description: `High copy-paste activity: ${update.copyPasteEvents} events`,
        timestamp: new Date(),
        requiresReview: true
      });
    }
    
    // Check for style changes (every 5 minutes)
    const shouldCheckStyle = await this.shouldCheckStyleChange(update.sessionId);
    if (shouldCheckStyle) {
      const styleChange = await this.detectStyleChange(update.documentId);
      if (styleChange) {
        anomalies.push({
          type: 'style_change',
          severity: styleChange.severity,
          description: styleChange.description,
          timestamp: new Date(),
          requiresReview: styleChange.severity === 'high'
        });
      }
    }
    
    return anomalies;
  }

  /**
   * Trigger comprehensive AI detection analysis
   */
  private static async triggerDeepAnalysis(
    documentId: string,
    sessionId: string
  ): Promise<void> {
    try {
      // Get document content
      const document = await prisma.document.findUnique({
        where: { id: documentId },
        select: { content: true, authorId: true }
      });
      
      if (!document?.content) return;
      
      // Run AI detection
      const detectionResult = await ExternalAIDetectionService.detectExternalAI(
        documentId,
        document.content,
        sessionId
      );
      
      // Store results
      await ExternalAIDetectionService.storeDetectionResult(documentId, detectionResult);
      
      // Handle based on risk level
      if (detectionResult.overallRiskScore > 50) {
        await AcademicIntegrityService.handleDetectedAIUsage(documentId, detectionResult);
      }
      
      // Log the analysis
      console.log(`AI detection completed for document ${documentId}: Risk score ${detectionResult.overallRiskScore}`);
      
    } catch (error) {
      console.error('Error in deep analysis:', error);
    }
  }

  /**
   * Update session metrics in database
   */
  private static async updateSessionMetrics(update: WritingSessionUpdate): Promise<void> {
    await prisma.writingSession.update({
      where: { id: update.sessionId },
      data: {
        duration: update.duration,
        activity: {
          charactersAdded: update.charactersAdded,
          charactersDeleted: update.charactersDeleted,
          wordsAdded: update.wordsAdded,
          wordsDeleted: update.wordsDeleted,
          copyPasteCount: update.copyPasteEvents,
          bulkAdditions: update.bulkTextAdditions,
          pauses: update.pauseDurations,
          lastUpdate: update.lastActivity
        }
      }
    });
  }

  /**
   * Update student profile with real-time cognitive load
   */
  private static async updateStudentProfile(update: WritingSessionUpdate): Promise<void> {
    const metrics = {
      duration: update.duration,
      wordsWritten: update.wordsAdded,
      deletionRatio: update.charactersDeleted / Math.max(1, update.charactersAdded),
      pauseCount: update.pauseDurations.length,
      revisionCycles: Math.floor(update.charactersDeleted / 100), // Estimate
      aiInteractionCount: 0 // Would come from AI service
    };
    
    await StudentLearningProfileService.updateRealTimeState(update.userId, metrics);
  }

  /**
   * Helper methods
   */
  
  private static calculateTypingSpeed(update: WritingSessionUpdate): number {
    if (update.duration === 0) return 0;
    return (update.wordsAdded / update.duration) * 60; // WPM
  }

  private static async getLastBulkAddition(sessionId: string): Promise<any> {
    const session = await prisma.writingSession.findUnique({
      where: { id: sessionId },
      select: { activity: true }
    });
    
    const activity = session?.activity as any;
    if (!activity?.bulkAdditionHistory) return null;
    
    const history = activity.bulkAdditionHistory;
    return history[history.length - 1];
  }

  private static async shouldCheckStyleChange(sessionId: string): Promise<boolean> {
    const session = await prisma.writingSession.findUnique({
      where: { id: sessionId },
      select: { activity: true }
    });
    
    const lastCheck = (session?.activity as any)?.lastStyleCheck;
    if (!lastCheck) return true;
    
    const timeSinceCheck = Date.now() - new Date(lastCheck).getTime();
    return timeSinceCheck > this.STYLE_CHECK_INTERVAL * 1000;
  }

  private static async detectStyleChange(documentId: string): Promise<any> {
    // Get recent versions
    const versions = await prisma.documentVersion.findMany({
      where: { documentId },
      orderBy: { createdAt: 'desc' },
      take: 2
    });
    
    if (versions.length < 2) return null;
    
    const current = versions[0].content || '';
    const previous = versions[1].content || '';
    
    // Simple style change detection
    const currentComplexity = this.calculateTextComplexity(current);
    const previousComplexity = this.calculateTextComplexity(previous);
    
    const complexityChange = Math.abs(currentComplexity - previousComplexity);
    
    if (complexityChange > 30) {
      return {
        severity: complexityChange > 50 ? 'high' : 'medium',
        description: `Significant style change detected (${Math.round(complexityChange)}% difference)`
      };
    }
    
    return null;
  }

  private static calculateTextComplexity(text: string): number {
    const words = text.split(/\s+/);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim());
    
    if (words.length === 0 || sentences.length === 0) return 0;
    
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
    const avgSentenceLength = words.length / sentences.length;
    
    // Simple complexity score
    return (avgWordLength * 10) + (avgSentenceLength * 2);
  }

  private static async storeAnomalies(
    sessionId: string,
    anomalies: WritingAnomalyAlert[]
  ): Promise<void> {
    await prisma.writingSession.update({
      where: { id: sessionId },
      data: {
        activity: {
          anomalies: anomalies.map(a => ({
            ...a,
            id: `anomaly-${Date.now()}-${Math.random()}`
          }))
        }
      }
    });
  }

  /**
   * Provide real-time feedback to student (non-accusatory)
   */
  static async provideGentleFeedback(
    userId: string,
    documentId: string,
    feedbackType: 'pace' | 'revision' | 'style'
  ): Promise<void> {
    const messages = {
      pace: {
        title: 'Take Your Time',
        message: 'Remember, good writing often comes from thoughtful reflection. Take breaks when needed!'
      },
      revision: {
        title: 'Revision is Part of Writing',
        message: 'Great writers revise often. Your editing shows careful thinking!'
      },
      style: {
        title: 'Finding Your Voice',
        message: 'Your writing style is evolving. Keep developing your unique perspective!'
      }
    };
    
    const feedback = messages[feedbackType];
    
    await prisma.notification.create({
      data: {
        recipientId: userId,
        type: 'writing_feedback',
        category: 'supportive',
        priority: 'low',
        title: feedback.title,
        message: feedback.message,
        context: {
          documentId,
          feedbackType,
          supportive: true
        }
      }
    });
  }

  /**
   * Generate session summary for educator dashboard
   */
  static async generateSessionSummary(sessionId: string): Promise<{
    writingBehavior: string;
    anomalyCount: number;
    aiRiskIndicators: string[];
    recommendedActions: string[];
  }> {
    const session = await prisma.writingSession.findUnique({
      where: { id: sessionId },
      include: {
        document: true,
        user: true
      }
    });
    
    if (!session) {
      throw new Error('Session not found');
    }
    
    const activity = session.activity as any;
    const anomalies = activity?.anomalies || [];
    
    // Analyze writing behavior
    const deletionRatio = activity.charactersDeleted / Math.max(1, activity.charactersAdded);
    const writingBehavior = deletionRatio > 0.5 ? 'heavy-revision' : 
                           deletionRatio > 0.2 ? 'moderate-revision' : 'linear-writing';
    
    // Identify AI risk indicators
    const aiRiskIndicators: string[] = [];
    if (activity.copyPasteCount > 5) aiRiskIndicators.push('frequent-copy-paste');
    if (activity.bulkAdditions > 2) aiRiskIndicators.push('bulk-text-additions');
    if (anomalies.some((a: any) => a.type === 'style_change')) aiRiskIndicators.push('style-inconsistency');
    
    // Generate recommendations
    const recommendedActions: string[] = [];
    if (aiRiskIndicators.length > 2) {
      recommendedActions.push('Review submission for authenticity');
      recommendedActions.push('Consider one-on-one discussion about writing process');
    } else if (deletionRatio > 0.7) {
      recommendedActions.push('Check in with student about assignment clarity');
      recommendedActions.push('Offer additional writing support');
    }
    
    return {
      writingBehavior,
      anomalyCount: anomalies.length,
      aiRiskIndicators,
      recommendedActions
    };
  }
}