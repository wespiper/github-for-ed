/**
 * Writing Process Service - PostgreSQL/Prisma Version
 *
 * Analyzes and tracks writing development for educational insights
 */

import prisma from "../lib/prisma";
import { Prisma } from "@prisma/client";

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

export class WritingProcessService {
    /**
     * Track detailed writing changes during a session
     */
    static async trackWritingChanges(
        documentId: string,
        sessionId: string,
        changes: Omit<WritingChange, "id" | "timestamp">[]
    ): Promise<WritingChange[]> {
        const document = await prisma.document.findUnique({
            where: { id: documentId },
        });

        if (!document) {
            throw new Error("Document not found");
        }

        // Enhance changes with metadata
        const enhancedChanges = changes.map((change) => ({
            ...change,
            id: crypto.randomUUID(),
            timestamp: new Date(),
        }));

        // Store changes in writing session activity
        const session = await prisma.writingSession.findUnique({
            where: { id: sessionId },
        });

        if (session) {
            const activity = (session.activity as any) || {};
            activity.changes = [
                ...(activity.changes || []),
                ...enhancedChanges,
            ];

            await prisma.writingSession.update({
                where: { id: sessionId },
                data: {
                    activity,
                },
            });
        }

        // Create new document version if significant changes
        const significantChanges = enhancedChanges.filter(
            (change) =>
                change.type === "restructure" ||
                Math.abs(change.wordCountDelta) > 50
        );

        if (significantChanges.length > 0) {
            await this.createVersionSnapshot(
                documentId,
                sessionId,
                enhancedChanges
            );
        }

        return enhancedChanges;
    }

    /**
     * Analyze writing patterns for educational insights
     */
    static async analyzeWritingPatterns(
        studentId: string,
        assignmentId: string,
        timeframe?: { start: Date; end: Date }
    ): Promise<WritingPattern[]> {
        const timeQuery = timeframe
            ? {
                  startTime: { gte: timeframe.start, lte: timeframe.end },
              }
            : {};

        const writingSessions = await prisma.writingSession.findMany({
            where: {
                userId: studentId,
                document: {
                    submissionId: {
                        not: null,
                    },
                },
                ...timeQuery,
            },
            orderBy: { startTime: "asc" },
        });

        if (writingSessions.length === 0) {
            return [];
        }

        const patterns = await Promise.all(
            writingSessions.map((session) =>
                this.analyzeSessionPatterns(session)
            )
        );

        return patterns;
    }

    /**
     * Compare document versions for development tracking
     */
    static async compareVersions(
        fromVersionId: string,
        toVersionId: string,
        educationalContext: {
            assignmentId: string;
            learningObjectives: string[];
            rubricCriteria?: string[];
        }
    ): Promise<VersionComparison> {
        const [fromVersion, toVersion] = await Promise.all([
            prisma.documentVersion.findUnique({ where: { id: fromVersionId } }),
            prisma.documentVersion.findUnique({ where: { id: toVersionId } }),
        ]);

        if (!fromVersion || !toVersion) {
            throw new Error("One or both versions not found");
        }

        // Analyze textual changes
        const changes = this.detectTextualChanges(
            fromVersion.content ?? "",
            toVersion.content ?? ""
        );

        // Calculate summary metrics
        const summary = this.calculateChangeSummary(
            changes,
            fromVersion,
            toVersion
        );

        // Assess quality improvements
        const qualityMetrics = await this.assessQualityChanges(
            fromVersion,
            toVersion,
            educationalContext
        );

        // Generate educational insights
        const educationalInsights = this.generateEducationalInsights(
            changes,
            qualityMetrics,
            educationalContext
        );

        return {
            fromVersionId,
            toVersionId,
            changes,
            summary,
            qualityMetrics,
            educationalInsights,
        };
    }

    /**
     * Generate comprehensive writing development timeline
     */
    static async generateDevelopmentTimeline(
        studentId: string,
        assignmentId: string
    ): Promise<WritingDevelopmentTimeline> {
        // Get submission and document versions
        const submission = await prisma.assignmentSubmission.findFirst({
            where: {
                authorId: studentId,
                assignmentId,
            },
            include: {
                documents: true,
            },
        });

        if (!submission || !submission.documents.length) {
            throw new Error(
                "No submission found for this student and assignment"
            );
        }

        const documentId = submission.documents[0].id;

        const [versions, sessions] = await Promise.all([
            prisma.documentVersion.findMany({
                where: { documentId },
                orderBy: { createdAt: "asc" },
            }),
            prisma.writingSession.findMany({
                where: {
                    userId: studentId,
                    document: {
                        submissionId: submission.id,
                    },
                },
                orderBy: { startTime: "asc" },
            }),
        ]);

        // Build timeline entries
        const timeline = await this.buildTimelineEntries(versions, sessions);

        // Calculate overall progress metrics
        const overallProgress = this.calculateOverallProgress(
            timeline,
            versions
        );

        return {
            studentId,
            assignmentId,
            timeline,
            overallProgress,
        };
    }

    /**
     * Analyze collaborative writing dynamics
     */
    static async analyzeCollaborativeWriting(
        documentId: string,
        timeframe?: { start: Date; end: Date }
    ): Promise<CollaborativeWritingInsights> {
        const timeQuery = timeframe
            ? {
                  createdAt: { gte: timeframe.start, lte: timeframe.end },
              }
            : {};

        // Get all versions and sessions for this document
        const [versions, sessions] = await Promise.all([
            prisma.documentVersion.findMany({
                where: { documentId, ...timeQuery },
                orderBy: { createdAt: "asc" },
            }),
            prisma.writingSession.findMany({
                where: { documentId, ...timeQuery },
                orderBy: { startTime: "asc" },
            }),
        ]);

        // Identify unique collaborators
        const collaborators = [
            ...new Set([
                ...versions.map((v) => v.authorId),
                ...sessions.map((s) => s.userId),
            ]),
        ];

        if (collaborators.length < 2) {
            throw new Error(
                "Document must have multiple collaborators for collaborative analysis"
            );
        }

        // Analyze collaboration patterns
        const collaborationPatterns = this.analyzeCollaborationPatterns(
            sessions,
            versions
        );

        // Analyze version history
        const versionHistory = await this.analyzeVersionHistory(versions);

        // Extract learning outcomes
        const learningOutcomes = this.extractCollaborativeLearningOutcomes(
            sessions,
            versions,
            collaborators.filter(
                (collaborator): collaborator is string => collaborator !== null
            )
        );

        return {
            documentId,
            collaborators: collaborators.filter(
                (collaborator): collaborator is string => collaborator !== null
            ),
            collaborationPatterns,
            versionHistory,
            learningOutcomes,
        };
    }

    /**
     * Identify writing breakthrough moments
     */
    static async identifyBreakthroughMoments(
        studentId: string,
        assignmentId: string
    ): Promise<{
        moments: {
            sessionId: string;
            timestamp: Date;
            type: "conceptual" | "structural" | "stylistic" | "mechanical";
            description: string;
            evidence: string[];
            impactScore: number; // 0-100
        }[];
        overallGrowthTrajectory: {
            phase: string;
            characteristics: string[];
            durationDays: number;
        }[];
    }> {
        const patterns = await this.analyzeWritingPatterns(
            studentId,
            assignmentId
        );
        const timeline = await this.generateDevelopmentTimeline(
            studentId,
            assignmentId
        );

        // Identify breakthrough moments from patterns and timeline
        const moments = this.detectBreakthroughMoments(patterns, timeline);

        // Analyze overall growth trajectory
        const growthTrajectory = this.analyzeGrowthTrajectory(timeline);

        return {
            moments,
            overallGrowthTrajectory: growthTrajectory,
        };
    }

    /**
     * Generate intervention recommendations based on writing process analysis
     */
    static async generateInterventionRecommendations(
        studentId: string,
        assignmentId: string
    ): Promise<{
        urgency: "low" | "medium" | "high";
        recommendations: {
            type: "process" | "content" | "engagement" | "support";
            priority: "high" | "medium" | "low";
            suggestion: string;
            rationale: string;
            implementation: string[];
        }[];
        supportingEvidence: string[];
    }> {
        const [patterns, timeline, breakthroughs] = await Promise.all([
            this.analyzeWritingPatterns(studentId, assignmentId),
            this.generateDevelopmentTimeline(studentId, assignmentId),
            this.identifyBreakthroughMoments(studentId, assignmentId),
        ]);

        return this.generateRecommendations(patterns, timeline, breakthroughs);
    }

    // Private helper methods

    private static async createVersionSnapshot(
        documentId: string,
        sessionId: string,
        changes: WritingChange[]
    ): Promise<void> {
        const document = await prisma.document.findUnique({
            where: { id: documentId },
        });
        if (!document) return;

        const session = await prisma.writingSession.findUnique({
            where: { id: sessionId },
        });
        if (!session) return;

        // Create new version with current content
        await prisma.documentVersion.create({
            data: {
                documentId,
                authorId: session.userId || "",
                version: await this.getNextVersionNumber(documentId),
                content: document.content || "",
                changes: {
                    summary: changes.map((c) => c.type).join(", "),
                    count: changes.length,
                    types: changes.map((c) => c.type),
                } as any,
                metadata: {
                    wordCount: this.calculateWordCount(document.content || ""),
                    changes: changes.length,
                    sessionContext: sessionId,
                },
            },
        });
    }

    private static async getNextVersionNumber(
        documentId: string
    ): Promise<number> {
        const latestVersion = await prisma.documentVersion.findFirst({
            where: { documentId },
            orderBy: { version: "desc" },
        });

        return (latestVersion?.version || 0) + 1;
    }

    private static calculateWordCount(content: string): number {
        return content
            .trim()
            .split(/\s+/)
            .filter((word) => word.length > 0).length;
    }

    private static async analyzeSessionPatterns(
        session: any
    ): Promise<WritingPattern> {
        const patterns = {
            writingVelocity: session.wordCount / (session.duration || 1),
            revisionRate:
                ((session.changes as any[])?.length || 0) /
                Math.max(1, session.wordCount / 100),
            focusAreas: this.identifyFocusAreas(session.changes || []),
            workingStyle: this.identifyWorkingStyle(session.changes || []),
            peakProductivityHours: [new Date(session.startTime).getHours()],
            averageSessionLength: session.duration || 0,
            breakFrequency: (session.breaks as any[])?.length || 0,
        };

        const engagement = {
            totalActiveTime: session.duration || 0,
            totalElapsedTime: session.endTime
                ? (new Date(session.endTime).getTime() -
                      new Date(session.startTime).getTime()) /
                  60000
                : 0,
            focusScore: this.calculateFocusScore(session),
            persistenceScore: this.calculatePersistenceScore(session),
        };

        const learningBehaviors = {
            seeksFeedback: session.feedbackRequests > 0,
            usesResources: session.resourcesAccessed > 0,
            collaboratesEffectively: session.collaborations > 0,
            reflectsOnProgress: (session.reflectionNotes as any[])?.length > 0,
        };

        return {
            sessionId: session.id,
            studentId: session.userId || "",
            assignmentId: "",
            patterns,
            engagement,
            learningBehaviors,
        };
    }

    private static identifyFocusAreas(
        changes: any[]
    ): ("introduction" | "body" | "conclusion" | "transitions")[] {
        // Simplified implementation - analyze change positions to identify focus areas
        const areas = [];

        if (!changes || changes.length === 0) return [];

        const totalLength = Math.max(
            ...changes.map((c: any) => c.position?.end || 0),
            1000
        );
        const introChanges = changes.filter(
            (c: any) => c.position?.start < totalLength * 0.2
        );
        const bodyChanges = changes.filter(
            (c: any) =>
                c.position?.start >= totalLength * 0.2 &&
                c.position?.start < totalLength * 0.8
        );
        const conclusionChanges = changes.filter(
            (c: any) => c.position?.start >= totalLength * 0.8
        );

        if (introChanges.length > 0) areas.push("introduction");
        if (bodyChanges.length > 0) areas.push("body");
        if (conclusionChanges.length > 0) areas.push("conclusion");

        return areas as (
            | "introduction"
            | "body"
            | "conclusion"
            | "transitions"
        )[];
    }

    private static identifyWorkingStyle(
        changes: any[]
    ): "linear" | "recursive" | "outline-first" | "exploratory" {
        if (!changes || changes.length === 0) return "linear";

        const positions = changes
            .map((c: any) => c.position?.start || 0)
            .sort((a, b) => a - b);
        const chronologicalPositions = changes.map(
            (c: any) => c.position?.start || 0
        );

        // Check if changes follow document order (linear)
        const isLinear =
            JSON.stringify(positions) ===
            JSON.stringify(chronologicalPositions);

        if (isLinear) return "linear";

        // Check for recursive pattern (returning to earlier sections)
        const hasRecursion = chronologicalPositions.some(
            (pos, i) => i > 0 && pos < chronologicalPositions[i - 1]
        );

        if (hasRecursion) return "recursive";

        // Simple heuristics for other styles
        const structureChanges = changes.filter(
            (c: any) => c.type === "restructure"
        );
        if (structureChanges.length > changes.length * 0.3)
            return "outline-first";

        return "exploratory";
    }

    private static calculateFocusScore(session: any): number {
        // Simplified focus score based on session continuity
        const totalTime = session.duration || 0;
        const breakTime = ((session.breaks as any[])?.length || 0) * 5; // Assume 5-min breaks
        const activeTime = Math.max(0, totalTime - breakTime);

        return Math.min(100, (activeTime / totalTime) * 100);
    }

    private static calculatePersistenceScore(session: any): number {
        // Simplified persistence score based on session length and productivity
        const basePersistence = Math.min(
            100,
            ((session.duration || 0) / 60) * 20
        ); // 20 points per hour
        const productivityBonus = Math.min(50, (session.wordCount || 0) / 10); // Bonus for word count

        return Math.min(100, basePersistence + productivityBonus);
    }

    private static detectTextualChanges(
        fromContent: string,
        toContent: string
    ): WritingChange[] {
        // Simplified diff implementation - in production, use sophisticated diff algorithm
        const changes: WritingChange[] = [];

        const fromWords = fromContent.split(/\s+/);
        const toWords = toContent.split(/\s+/);

        const wordCountDelta = toWords.length - fromWords.length;

        if (wordCountDelta !== 0) {
            changes.push({
                id: crypto.randomUUID(),
                type: wordCountDelta > 0 ? "addition" : "deletion",
                position: { start: 0, end: toContent.length },
                newContent: toContent,
                oldContent: fromContent,
                timestamp: new Date(),
                wordCountDelta,
                characterCountDelta: toContent.length - fromContent.length,
                metadata: {
                    sessionId: crypto.randomUUID(),
                    aiAssisted: false,
                    confidence: "medium",
                    category: "content",
                },
            });
        }

        return changes;
    }

    private static calculateChangeSummary(
        changes: WritingChange[],
        fromVersion: any,
        toVersion: any
    ): any {
        const totalChanges = changes.length;
        const wordCountChange =
            (toVersion.wordCount || 0) - (fromVersion.wordCount || 0);
        const majorRestructuring = changes.some(
            (c) => c.type === "restructure"
        );

        const improvementAreas = [];
        const concernAreas = [];

        if (wordCountChange > 0) {
            improvementAreas.push("Content development");
        } else if (wordCountChange < -50) {
            concernAreas.push("Significant content reduction");
        }

        return {
            totalChanges,
            wordCountChange,
            majorRestructuring,
            improvementAreas,
            concernAreas,
        };
    }

    private static async assessQualityChanges(
        fromVersion: any,
        toVersion: any,
        context: any
    ): Promise<any> {
        // Simplified quality assessment - in production, use NLP analysis
        return {
            readabilityImprovement: Math.random() * 20 - 10, // -10 to +10
            coherenceScore: 75 + Math.random() * 20, // 75-95
            developmentStrength: 80 + Math.random() * 15, // 80-95
            mechanicalAccuracy: 85 + Math.random() * 10, // 85-95
        };
    }

    private static generateEducationalInsights(
        changes: WritingChange[],
        qualityMetrics: any,
        context: any
    ): any {
        const skillsApplied = [];
        const growthEvidence = [];
        const focusRecommendations = [];

        if (changes.some((c) => c.type === "restructure")) {
            skillsApplied.push("Organizational planning");
            growthEvidence.push("Demonstrates understanding of text structure");
        }

        if (qualityMetrics.readabilityImprovement > 5) {
            skillsApplied.push("Clarity enhancement");
            growthEvidence.push("Shows improvement in expression");
        }

        if (qualityMetrics.developmentStrength < 70) {
            focusRecommendations.push("Focus on idea development and support");
        }

        return {
            skillsApplied,
            growthEvidence,
            focusRecommendations,
        };
    }

    private static async buildTimelineEntries(
        versions: any[],
        sessions: any[]
    ): Promise<any[]> {
        const timeline = [];

        for (const version of versions) {
            const relatedSession = sessions.find(
                (s) =>
                    Math.abs(
                        new Date(s.startTime).getTime() -
                            new Date(version.createdAt).getTime()
                    ) < 3600000 // Within 1 hour
            );

            timeline.push({
                date: version.createdAt,
                versionId: version.id,
                wordCount: version.wordCount || 0,
                qualityScore: 75 + Math.random() * 20, // Simplified
                majorMilestones: this.identifyMilestones(version),
                writingStage: this.identifyWritingStage(version),
                sessionSummary: relatedSession
                    ? {
                          duration: relatedSession.duration || 0,
                          productivity:
                              (relatedSession.wordCount || 0) /
                              Math.max(1, relatedSession.duration || 1),
                          breakthroughs: [],
                          struggles: [],
                      }
                    : null,
            });
        }

        return timeline.sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
    }

    private static identifyMilestones(version: any): string[] {
        const milestones = [];

        if (version.wordCount >= 500) milestones.push("Substantial draft");
        if (version.wordCount >= 1000) milestones.push("Full-length draft");
        if (version.changesSummary?.includes("restructure"))
            milestones.push("Major revision");

        return milestones;
    }

    private static identifyWritingStage(version: any): string {
        // Simplified stage identification
        if (version.wordCount < 200) return "planning";
        if (version.wordCount < 800) return "drafting";
        return "revision";
    }

    private static calculateOverallProgress(
        timeline: any[],
        versions: any[]
    ): any {
        if (timeline.length === 0) {
            return {
                initialToFinal: {
                    wordCountGrowth: 0,
                    qualityImprovement: 0,
                    skillDevelopment: [],
                },
                keyTurningPoints: [],
                consistencyMetrics: {
                    regularProgress: false,
                    steadyImprovement: false,
                    engagementLevel: "low",
                },
            };
        }

        const first = timeline[0];
        const last = timeline[timeline.length - 1];

        return {
            initialToFinal: {
                wordCountGrowth: last.wordCount - first.wordCount,
                qualityImprovement: last.qualityScore - first.qualityScore,
                skillDevelopment: ["Organization", "Development", "Expression"],
            },
            keyTurningPoints: timeline
                .filter((entry) => entry.majorMilestones.length > 0)
                .map((entry) => ({
                    date: entry.date,
                    description: entry.majorMilestones.join(", "),
                    impact: "moderate" as const,
                })),
            consistencyMetrics: {
                regularProgress: timeline.length >= 3,
                steadyImprovement: last.qualityScore > first.qualityScore,
                engagementLevel:
                    timeline.length >= 5
                        ? "high"
                        : timeline.length >= 3
                        ? "medium"
                        : "low",
            },
        };
    }

    private static analyzeCollaborationPatterns(
        sessions: any[],
        versions: any[]
    ): any {
        const contributors = [
            ...new Set([
                ...sessions.map((s) => s.userId || "").filter((id) => id),
                ...versions.map((v) => v.authorId),
            ]),
        ];

        const contributionDistribution: Record<string, number> = {};
        contributors.forEach((id) => {
            const userSessions = sessions.filter((s) => s.userId === id);
            const totalDuration = userSessions.reduce(
                (sum, s) => sum + (s.duration || 0),
                0
            );
            contributionDistribution[id] = totalDuration;
        });

        // Normalize to percentages
        const totalDuration = Object.values(contributionDistribution).reduce(
            (sum, val) => sum + val,
            0
        );
        Object.keys(contributionDistribution).forEach((id) => {
            contributionDistribution[id] =
                (contributionDistribution[id] / totalDuration) * 100;
        });

        return {
            contributionDistribution,
            interactionFrequency: {}, // Simplified
            conflictResolutionStyle: "consensus",
            communicationQuality: 75,
        };
    }

    private static async analyzeVersionHistory(
        versions: any[]
    ): Promise<any[]> {
        return versions.map((version) => ({
            versionId: version.id,
            primaryAuthor: version.authorId,
            contributors: [version.authorId], // Simplified
            consensusLevel: 80 + Math.random() * 20,
            integrationQuality: 75 + Math.random() * 20,
        }));
    }

    private static extractCollaborativeLearningOutcomes(
        sessions: any[],
        versions: any[],
        collaborators: string[]
    ): any {
        return {
            skillsShared: ["Peer feedback", "Collaborative editing"],
            peerLearningEvidence: ["Evidence of knowledge exchange"],
            leadershipEmergence: ["Natural facilitation patterns"],
            supportPatterns: ["Mutual assistance patterns"],
        };
    }

    private static detectBreakthroughMoments(
        patterns: WritingPattern[],
        timeline: any
    ): any[] {
        const moments: any[] = [];

        // Look for significant productivity increases
        patterns.forEach((pattern, index) => {
            if (index > 0) {
                const previousPattern = patterns[index - 1];
                if (
                    pattern.patterns.writingVelocity >
                    previousPattern.patterns.writingVelocity * 1.5
                ) {
                    moments.push({
                        sessionId: pattern.sessionId,
                        timestamp: new Date(),
                        type: "conceptual",
                        description: "Significant increase in writing velocity",
                        evidence: ["Productivity spike detected"],
                        impactScore: 75,
                    });
                }
            }
        });

        return moments;
    }

    private static analyzeGrowthTrajectory(timeline: any): any[] {
        if (timeline.timeline.length === 0) return [];

        return [
            {
                phase: "Initial Development",
                characteristics: ["Getting started", "Basic structure"],
                durationDays: 7,
            },
            {
                phase: "Content Expansion",
                characteristics: ["Adding details", "Developing ideas"],
                durationDays: 10,
            },
            {
                phase: "Refinement",
                characteristics: ["Polishing", "Final revisions"],
                durationDays: 5,
            },
        ];
    }

    private static generateRecommendations(
        patterns: WritingPattern[],
        timeline: any,
        breakthroughs: any
    ): any {
        const recommendations = [];
        let urgency: "low" | "medium" | "high" = "low";

        // Analyze engagement levels
        const avgEngagement =
            patterns.reduce((sum, p) => sum + p.engagement.focusScore, 0) /
            Math.max(1, patterns.length);

        if (avgEngagement < 50) {
            urgency = "high";
            recommendations.push({
                type: "engagement",
                priority: "high",
                suggestion: "Implement engagement strategies",
                rationale: "Low focus scores indicate engagement challenges",
                implementation: [
                    "Break tasks into smaller chunks",
                    "Use writing sprints",
                    "Add variety to activities",
                ],
            });
        }

        // Analyze productivity patterns
        const avgVelocity =
            patterns.reduce((sum, p) => sum + p.patterns.writingVelocity, 0) /
            Math.max(1, patterns.length);

        if (avgVelocity < 5) {
            // Less than 5 words per minute
            if (urgency === "low") urgency = "medium";
            recommendations.push({
                type: "process",
                priority: "medium",
                suggestion: "Focus on writing fluency development",
                rationale:
                    "Writing velocity indicates need for fluency practice",
                implementation: [
                    "Free writing exercises",
                    "Timed writing practice",
                    "Reduce self-editing during drafting",
                ],
            });
        }

        return {
            urgency,
            recommendations,
            supportingEvidence: ["Analysis of writing sessions and patterns"],
        };
    }
}
