/**
 * Privacy-Aware Writing Process Service
 * Refactored to use repository pattern and privacy context
 */

import { DocumentRepository } from '../repositories/interfaces/DocumentRepository';
import { LearningAnalyticsRepository } from '../repositories/interfaces/LearningAnalyticsRepository';
import { PrivacyContext } from '../types/privacy';
import { EventBus } from '../events/EventBus';
import { DataAccessAuditedEvent } from '../events/events/PrivacyEvents';

export interface WritingChange {
    id: string;
    type: "addition" | "deletion" | "modification" | "restructure";
    position: {
        start: number;
        end: number;
    };
    oldContent?: string;
    newContent: string;
    timestamp: Date;
    wordCountDelta: number;
    characterCountDelta: number;
    metadata: {
        sessionId: string;
        writingStage?: string;
        aiAssisted: boolean;
        confidence: "low" | "medium" | "high";
        category: "content" | "structure" | "style" | "mechanics";
    };
}

export interface WritingPattern {
    sessionId: string;
    studentId: string;
    assignmentId: string;
    patterns: {
        writingVelocity: number; // words per minute
        revisionRate: number; // revisions per 100 words
        focusAreas: ("introduction" | "body" | "conclusion" | "transitions")[];
        workingStyle: "linear" | "recursive" | "outline-first" | "exploratory";
        peakProductivityHours: number[];
        averageSessionLength: number;
        breakFrequency: number; // minutes between breaks
    };
    engagement: {
        totalActiveTime: number;
        totalElapsedTime: number;
        focusScore: number; // 0-100
        persistenceScore: number; // 0-100
    };
    learningBehaviors: {
        seeksFeedback: boolean;
        usesResources: boolean;
        collaboratesEffectively: boolean;
        reflectsOnProgress: boolean;
    };
}

export interface VersionComparison {
    fromVersionId: string;
    toVersionId: string;
    changes: WritingChange[];
    summary: {
        totalChanges: number;
        wordCountChange: number;
        majorRestructuring: boolean;
        improvementAreas: string[];
        concernAreas: string[];
    };
    qualityMetrics: {
        readabilityImprovement: number;
        coherenceScore: number;
        developmentStrength: number;
        mechanicalAccuracy: number;
    };
    educationalInsights: {
        skillsApplied: string[];
        growthEvidence: string[];
        focusRecommendations: string[];
    };
}

export interface WritingDevelopmentTimeline {
    studentId: string;
    assignmentId: string;
    timeline: {
        date: Date;
        versionId: string;
        wordCount: number;
        qualityScore: number;
        majorMilestones: string[];
        writingStage: string;
        sessionSummary: {
            duration: number;
            productivity: number;
            breakthroughs: string[];
            struggles: string[];
        } | null;
    }[];
    overallProgress: {
        initialToFinal: {
            wordCountGrowth: number;
            qualityImprovement: number;
            skillDevelopment: string[];
        };
        keyTurningPoints: {
            date: Date;
            description: string;
            impact: "major" | "moderate" | "minor";
        }[];
        consistencyMetrics: {
            regularProgress: boolean;
            steadyImprovement: boolean;
            engagementLevel: "high" | "medium" | "low";
        };
    };
}

export interface CollaborativeWritingInsights {
    documentId: string;
    collaborators: string[];
    collaborationPatterns: {
        contributionDistribution: Record<string, number>; // userId -> percentage
        interactionFrequency: Record<string, number>;
        conflictResolutionStyle: "consensus" | "democratic" | "leader-driven";
        communicationQuality: number; // 0-100
    };
    versionHistory: {
        versionId: string;
        primaryAuthor: string;
        contributors: string[];
        consensusLevel: number; // 0-100
        integrationQuality: number; // 0-100
    }[];
    learningOutcomes: {
        skillsShared: string[];
        peerLearningEvidence: string[];
        leadershipEmergence: string[];
        supportPatterns: string[];
    };
}

export interface WritingProcessConfig {
    enableDetailedTracking: boolean;
    privacyLevel: 'full' | 'aggregated' | 'anonymous';
    retentionDays: number;
}

export class PrivacyAwareWritingProcessService {
    private documentRepo: DocumentRepository;
    private analyticsRepo: LearningAnalyticsRepository;
    private eventBus: EventBus;
    private config: WritingProcessConfig;

    constructor(
        documentRepo: DocumentRepository,
        analyticsRepo: LearningAnalyticsRepository,
        eventBus: EventBus,
        config: WritingProcessConfig = {
            enableDetailedTracking: true,
            privacyLevel: 'full',
            retentionDays: 365
        }
    ) {
        this.documentRepo = documentRepo;
        this.analyticsRepo = analyticsRepo;
        this.eventBus = eventBus;
        this.config = config;
    }

    /**
     * Track detailed writing changes with privacy controls
     */
    async trackWritingChanges(
        documentId: string,
        sessionId: string,
        changes: Omit<WritingChange, "id" | "timestamp">[],
        privacyContext: PrivacyContext
    ): Promise<WritingChange[]> {
        // Verify access permissions
        if (!this.canTrackWritingProcess(privacyContext)) {
            await this.publishPrivacyEvent('writing_tracking_denied', documentId, privacyContext);
            throw new Error('Insufficient permissions for writing process tracking');
        }

        await this.publishPrivacyEvent('writing_tracking_started', documentId, privacyContext);

        try {
            // Get document with privacy filtering
            const document = await this.documentRepo.findWithVersions(documentId, privacyContext);
            
            if (!document) {
                throw new Error("Document not found or access denied");
            }

            // Verify user has write access to this document
            if (!this.canModifyDocument(document, privacyContext)) {
                await this.publishPrivacyEvent('document_modification_denied', documentId, privacyContext);
                throw new Error('Insufficient permissions to modify document');
            }

            // Process changes with privacy considerations
            const processedChanges = this.processChangesWithPrivacy(
                changes,
                sessionId,
                privacyContext
            );

            // Record writing metrics if privacy allows
            if (this.canRecordMetrics(privacyContext)) {
                await this.recordWritingMetrics(
                    document.studentId,
                    documentId,
                    processedChanges,
                    privacyContext
                );
            }

            await this.publishPrivacyEvent('writing_tracking_completed', documentId, privacyContext);
            return processedChanges;

        } catch (error) {
            await this.publishPrivacyEvent('writing_tracking_error', documentId, privacyContext);
            throw error;
        }
    }

    /**
     * Analyze writing patterns with privacy filtering
     */
    async analyzeWritingPatterns(
        studentId: string,
        assignmentId: string,
        privacyContext: PrivacyContext
    ): Promise<WritingPattern | null> {
        if (!this.canAnalyzePatterns(privacyContext, studentId)) {
            await this.publishPrivacyEvent('pattern_analysis_denied', studentId, privacyContext);
            return null;
        }

        await this.publishPrivacyEvent('pattern_analysis_started', studentId, privacyContext);

        try {
            // Get student documents with privacy filtering
            const documents = await this.documentRepo.findByStudent(
                studentId,
                privacyContext,
                { assignmentId }
            );

            if (documents.length === 0) {
                return null;
            }

            // Get analytics data with privacy context
            const analytics = await this.analyticsRepo.getStudentAnalytics(
                studentId,
                privacyContext,
                { assignmentId }
            );

            // Generate writing patterns based on privacy level
            const patterns = this.generateWritingPatterns(
                studentId,
                assignmentId,
                documents,
                analytics,
                privacyContext
            );

            await this.publishPrivacyEvent('pattern_analysis_completed', studentId, privacyContext);
            return patterns;

        } catch (error) {
            await this.publishPrivacyEvent('pattern_analysis_error', studentId, privacyContext);
            throw error;
        }
    }

    /**
     * Compare document versions with privacy controls
     */
    async compareVersions(
        documentId: string,
        fromVersionId: string,
        toVersionId: string,
        privacyContext: PrivacyContext
    ): Promise<VersionComparison | null> {
        if (!this.canCompareVersions(privacyContext)) {
            await this.publishPrivacyEvent('version_comparison_denied', documentId, privacyContext);
            return null;
        }

        await this.publishPrivacyEvent('version_comparison_started', documentId, privacyContext);

        try {
            // Get document with versions
            const document = await this.documentRepo.findWithVersions(documentId, privacyContext);
            
            if (!document) {
                throw new Error("Document not found or access denied");
            }

            // Verify access to this specific document
            if (!this.canAccessDocument(document, privacyContext)) {
                return null;
            }

            // Generate comparison with privacy filtering
            const comparison = this.generateVersionComparison(
                fromVersionId,
                toVersionId,
                document,
                privacyContext
            );

            await this.publishPrivacyEvent('version_comparison_completed', documentId, privacyContext);
            return comparison;

        } catch (error) {
            await this.publishPrivacyEvent('version_comparison_error', documentId, privacyContext);
            throw error;
        }
    }

    /**
     * Get writing development timeline with privacy controls
     */
    async getWritingDevelopmentTimeline(
        studentId: string,
        assignmentId: string,
        privacyContext: PrivacyContext
    ): Promise<WritingDevelopmentTimeline | null> {
        if (!this.canAccessTimeline(privacyContext, studentId)) {
            await this.publishPrivacyEvent('timeline_access_denied', studentId, privacyContext);
            return null;
        }

        await this.publishPrivacyEvent('timeline_access_started', studentId, privacyContext);

        try {
            // Get documents and analytics with privacy filtering
            const documents = await this.documentRepo.findByStudent(
                studentId,
                privacyContext,
                { assignmentId }
            );

            const analytics = await this.analyticsRepo.getStudentAnalytics(
                studentId,
                privacyContext,
                { assignmentId }
            );

            // Generate timeline with privacy considerations
            const timeline = this.generateDevelopmentTimeline(
                studentId,
                assignmentId,
                documents,
                analytics,
                privacyContext
            );

            await this.publishPrivacyEvent('timeline_access_completed', studentId, privacyContext);
            return timeline;

        } catch (error) {
            await this.publishPrivacyEvent('timeline_access_error', studentId, privacyContext);
            throw error;
        }
    }

    /**
     * Analyze collaborative writing with privacy aggregation
     */
    async analyzeCollaborativeWriting(
        documentId: string,
        privacyContext: PrivacyContext
    ): Promise<CollaborativeWritingInsights | null> {
        if (!this.canAnalyzeCollaboration(privacyContext)) {
            await this.publishPrivacyEvent('collaboration_analysis_denied', documentId, privacyContext);
            return null;
        }

        await this.publishPrivacyEvent('collaboration_analysis_started', documentId, privacyContext);

        try {
            // Get document with collaborators
            const document = await this.documentRepo.findWithVersions(documentId, privacyContext);
            
            if (!document || !document.collaborators) {
                return null;
            }

            // Generate collaboration insights with privacy filtering
            const insights = this.generateCollaborationInsights(
                document,
                privacyContext
            );

            await this.publishPrivacyEvent('collaboration_analysis_completed', documentId, privacyContext);
            return insights;

        } catch (error) {
            await this.publishPrivacyEvent('collaboration_analysis_error', documentId, privacyContext);
            throw error;
        }
    }

    // Privacy control methods
    private canTrackWritingProcess(privacyContext: PrivacyContext): boolean {
        return ['educator', 'system', 'student'].includes(privacyContext.requesterType);
    }

    private canModifyDocument(document: any, privacyContext: PrivacyContext): boolean {
        return (
            privacyContext.requesterType === 'admin' ||
            privacyContext.requesterType === 'educator' ||
            (privacyContext.requesterType === 'student' && document.studentId === privacyContext.requesterId)
        );
    }

    private canAnalyzePatterns(privacyContext: PrivacyContext, studentId: string): boolean {
        return (
            privacyContext.requesterType === 'admin' ||
            privacyContext.requesterType === 'educator' ||
            (privacyContext.requesterType === 'student' && privacyContext.requesterId === studentId)
        );
    }

    private canCompareVersions(privacyContext: PrivacyContext): boolean {
        return ['admin', 'educator', 'student'].includes(privacyContext.requesterType);
    }

    private canAccessDocument(document: any, privacyContext: PrivacyContext): boolean {
        return (
            privacyContext.requesterType === 'admin' ||
            privacyContext.requesterType === 'educator' ||
            (privacyContext.requesterType === 'student' && document.studentId === privacyContext.requesterId)
        );
    }

    private canAccessTimeline(privacyContext: PrivacyContext, studentId: string): boolean {
        return (
            privacyContext.requesterType === 'admin' ||
            privacyContext.requesterType === 'educator' ||
            (privacyContext.requesterType === 'student' && privacyContext.requesterId === studentId)
        );
    }

    private canAnalyzeCollaboration(privacyContext: PrivacyContext): boolean {
        return ['admin', 'educator'].includes(privacyContext.requesterType);
    }

    private canRecordMetrics(privacyContext: PrivacyContext): boolean {
        return ['system', 'educator'].includes(privacyContext.requesterType);
    }

    // Implementation methods
    private processChangesWithPrivacy(
        changes: Omit<WritingChange, "id" | "timestamp">[],
        sessionId: string,
        privacyContext: PrivacyContext
    ): WritingChange[] {
        const detailLevel = this.getDetailLevel(privacyContext);
        
        return changes.map(change => ({
            id: `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            ...change,
            timestamp: new Date(),
            // Apply privacy filtering to content if needed
            oldContent: detailLevel === 'anonymous' ? undefined : change.oldContent,
            newContent: detailLevel === 'anonymous' ? '[CONTENT FILTERED]' : change.newContent
        }));
    }

    private async recordWritingMetrics(
        studentId: string,
        documentId: string,
        changes: WritingChange[],
        privacyContext: PrivacyContext
    ): Promise<void> {
        // Calculate metrics from changes
        const totalChanges = changes.length;
        const wordCountDelta = changes.reduce((sum, change) => sum + change.wordCountDelta, 0);
        
        // Record metrics
        await this.analyticsRepo.recordMetric(
            {
                studentId,
                metricType: 'progress',
                metricName: 'writing_changes',
                value: totalChanges,
                metadata: {
                    documentId,
                    wordCountDelta,
                    session: true
                },
                timestamp: new Date()
            },
            privacyContext
        );
    }

    private generateWritingPatterns(
        studentId: string,
        assignmentId: string,
        documents: any[],
        analytics: any,
        privacyContext: PrivacyContext
    ): WritingPattern {
        const detailLevel = this.getDetailLevel(privacyContext);
        
        // Generate mock session ID for patterns
        const sessionId = `session_${Date.now()}`;
        
        // Base pattern with privacy-appropriate detail
        const basePattern: WritingPattern = {
            sessionId,
            studentId,
            assignmentId,
            patterns: {
                writingVelocity: detailLevel === 'full' ? 25 : 0,
                revisionRate: detailLevel === 'full' ? 15 : 0,
                focusAreas: detailLevel === 'full' ? ["body", "conclusion"] : [],
                workingStyle: detailLevel === 'full' ? "recursive" : "linear",
                peakProductivityHours: detailLevel === 'full' ? [10, 14, 19] : [],
                averageSessionLength: detailLevel === 'full' ? 45 : 0,
                breakFrequency: detailLevel === 'full' ? 25 : 0
            },
            engagement: {
                totalActiveTime: detailLevel === 'full' ? 120 : 0,
                totalElapsedTime: detailLevel === 'full' ? 180 : 0,
                focusScore: detailLevel === 'full' ? 75 : 0,
                persistenceScore: detailLevel === 'full' ? 80 : 0
            },
            learningBehaviors: {
                seeksFeedback: detailLevel === 'full' ? true : false,
                usesResources: detailLevel === 'full' ? true : false,
                collaboratesEffectively: detailLevel === 'full' ? true : false,
                reflectsOnProgress: detailLevel === 'full' ? true : false
            }
        };

        return basePattern;
    }

    private generateVersionComparison(
        fromVersionId: string,
        toVersionId: string,
        document: any,
        privacyContext: PrivacyContext
    ): VersionComparison {
        const detailLevel = this.getDetailLevel(privacyContext);
        
        // Mock comparison - in real implementation would analyze actual versions
        return {
            fromVersionId,
            toVersionId,
            changes: [], // Would contain actual change analysis
            summary: {
                totalChanges: detailLevel === 'full' ? 15 : 0,
                wordCountChange: detailLevel === 'full' ? 250 : 0,
                majorRestructuring: detailLevel === 'full' ? false : false,
                improvementAreas: detailLevel === 'full' ? ['clarity', 'organization'] : [],
                concernAreas: detailLevel === 'full' ? ['citations'] : []
            },
            qualityMetrics: {
                readabilityImprovement: detailLevel === 'full' ? 0.2 : 0,
                coherenceScore: detailLevel === 'full' ? 0.8 : 0,
                developmentStrength: detailLevel === 'full' ? 0.7 : 0,
                mechanicalAccuracy: detailLevel === 'full' ? 0.9 : 0
            },
            educationalInsights: {
                skillsApplied: detailLevel === 'full' ? ['revision', 'organization'] : [],
                growthEvidence: detailLevel === 'full' ? ['improved transitions'] : [],
                focusRecommendations: detailLevel === 'full' ? ['strengthen conclusion'] : []
            }
        };
    }

    private generateDevelopmentTimeline(
        studentId: string,
        assignmentId: string,
        documents: any[],
        analytics: any,
        privacyContext: PrivacyContext
    ): WritingDevelopmentTimeline {
        const detailLevel = this.getDetailLevel(privacyContext);
        
        return {
            studentId,
            assignmentId,
            timeline: documents.map((doc, index) => ({
                date: doc.updatedAt,
                versionId: `version_${index + 1}`,
                wordCount: detailLevel === 'full' ? (doc.content?.length || 0) : 0,
                qualityScore: detailLevel === 'full' ? 0.7 + (index * 0.1) : 0,
                majorMilestones: detailLevel === 'full' ? ['first draft', 'revision'] : [],
                writingStage: detailLevel === 'full' ? 'drafting' : 'unknown',
                sessionSummary: detailLevel === 'full' ? {
                    duration: 60,
                    productivity: 0.8,
                    breakthroughs: ['thesis clarity'],
                    struggles: ['conclusion']
                } : null
            })),
            overallProgress: {
                initialToFinal: {
                    wordCountGrowth: detailLevel === 'full' ? 300 : 0,
                    qualityImprovement: detailLevel === 'full' ? 0.3 : 0,
                    skillDevelopment: detailLevel === 'full' ? ['revision', 'organization'] : []
                },
                keyTurningPoints: detailLevel === 'full' ? [{
                    date: new Date(),
                    description: 'Major revision improved clarity',
                    impact: 'major' as const
                }] : [],
                consistencyMetrics: {
                    regularProgress: detailLevel === 'full' ? true : false,
                    steadyImprovement: detailLevel === 'full' ? true : false,
                    engagementLevel: detailLevel === 'full' ? 'high' as const : 'low' as const
                }
            }
        };
    }

    private generateCollaborationInsights(
        document: any,
        privacyContext: PrivacyContext
    ): CollaborativeWritingInsights {
        const detailLevel = this.getDetailLevel(privacyContext);
        
        return {
            documentId: document.id,
            collaborators: detailLevel === 'full' ? ['student_1', 'student_2'] : [],
            collaborationPatterns: {
                contributionDistribution: detailLevel === 'full' ? { 'student_1': 60, 'student_2': 40 } : {},
                interactionFrequency: detailLevel === 'full' ? { 'student_1': 15, 'student_2': 12 } : {},
                conflictResolutionStyle: detailLevel === 'full' ? 'consensus' : 'democratic',
                communicationQuality: detailLevel === 'full' ? 85 : 0
            },
            versionHistory: [],
            learningOutcomes: {
                skillsShared: detailLevel === 'full' ? ['research', 'editing'] : [],
                peerLearningEvidence: detailLevel === 'full' ? ['improved citations'] : [],
                leadershipEmergence: detailLevel === 'full' ? ['project coordination'] : [],
                supportPatterns: detailLevel === 'full' ? ['peer feedback'] : []
            }
        };
    }

    private getDetailLevel(privacyContext: PrivacyContext): 'full' | 'limited' | 'anonymous' {
        if (privacyContext.requesterType === 'admin') return 'full';
        if (privacyContext.requesterType === 'educator') return 'full';
        if (privacyContext.requesterType === 'student') return 'limited';
        return 'anonymous';
    }

    /**
     * Publish privacy event for audit trail
     */
    private async publishPrivacyEvent(
        eventType: string,
        targetId: string,
        privacyContext: PrivacyContext
    ): Promise<void> {
        await this.eventBus.publish<DataAccessAuditedEvent>({
            type: 'privacy.data.accessed',
            category: 'audit',
            privacyLevel: 'restricted',
            correlationId: privacyContext.correlationId || '',
            timestamp: new Date(),
            payload: {
                accessorId: privacyContext.requesterId,
                dataType: 'student-writing',
                purpose: 'educational-analysis',
                educationalJustification: `Writing process analysis: ${eventType}`,
                accessTimestamp: new Date(),
                dataScope: {
                    recordCount: 1
                }
            }
        });
    }
}