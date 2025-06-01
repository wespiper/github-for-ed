import { Reflection, ReflectionAnalysis, Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { 
  ReflectionRepository as IReflectionRepository,
  ReflectionAnalysisRepository as IReflectionAnalysisRepository 
} from './interfaces';

/**
 * Prisma implementation of ReflectionRepository
 */
export class PrismaReflectionRepository implements IReflectionRepository {
  async findById(id: string): Promise<Reflection | null> {
    return await prisma.reflection.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        assignment: {
          select: { id: true, title: true }
        },
        document: {
          select: { id: true, title: true }
        }
      }
    });
  }

  async findByUser(userId: string, options?: {
    assignmentId?: string;
    documentId?: string;
    type?: string;
    limit?: number;
  }): Promise<Reflection[]> {
    const where: any = { userId };

    if (options?.assignmentId) {
      where.assignmentId = options.assignmentId;
    }
    if (options?.documentId) {
      where.documentId = options.documentId;
    }
    if (options?.type) {
      where.type = options.type;
    }

    return await prisma.reflection.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 50,
      include: {
        assignment: {
          select: { id: true, title: true }
        },
        document: {
          select: { id: true, title: true }
        }
      }
    });
  }

  async findByAssignment(assignmentId: string, userId?: string): Promise<Reflection[]> {
    const where: any = { assignmentId };
    
    if (userId) {
      where.userId = userId;
    }

    return await prisma.reflection.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true }
        }
      }
    });
  }

  async create(data: {
    userId: string;
    assignmentId?: string;
    documentId?: string;
    type: string;
    content: string;
    metadata?: any;
    stage?: string;
  }): Promise<Reflection> {
    const wordCount = data.content.split(/\s+/).filter(word => word.length > 0).length;
    
    return await prisma.reflection.create({
      data: {
        ...data,
        wordCount,
        metadata: data.metadata || {}
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true }
        },
        assignment: {
          select: { id: true, title: true }
        }
      }
    });
  }

  async update(id: string, data: Prisma.ReflectionUpdateInput): Promise<Reflection> {
    // If content is being updated, recalculate word count
    if (data.content && typeof data.content === 'string') {
      const wordCount = data.content.split(/\s+/).filter(word => word.length > 0).length;
      data.wordCount = wordCount;
    }

    return await prisma.reflection.update({
      where: { id },
      data,
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true }
        },
        assignment: {
          select: { id: true, title: true }
        }
      }
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.reflection.delete({
      where: { id }
    });
  }

  async getReflectionStats(userId: string, assignmentId?: string): Promise<{
    totalReflections: number;
    averageWordCount: number;
    reflectionsByType: Record<string, number>;
  }> {
    const where: any = { userId };
    if (assignmentId) {
      where.assignmentId = assignmentId;
    }

    const reflections = await prisma.reflection.findMany({
      where,
      select: {
        type: true,
        wordCount: true
      }
    });

    const totalReflections = reflections.length;
    const averageWordCount = totalReflections > 0 
      ? Math.round(reflections.reduce((sum, r) => sum + r.wordCount, 0) / totalReflections)
      : 0;

    const reflectionsByType: Record<string, number> = {};
    reflections.forEach(reflection => {
      reflectionsByType[reflection.type] = (reflectionsByType[reflection.type] || 0) + 1;
    });

    return {
      totalReflections,
      averageWordCount,
      reflectionsByType
    };
  }
}

/**
 * Prisma implementation of ReflectionAnalysisRepository
 */
export class PrismaReflectionAnalysisRepository implements IReflectionAnalysisRepository {
  async findById(id: string): Promise<ReflectionAnalysis | null> {
    return await prisma.reflectionAnalysis.findUnique({
      where: { id },
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true }
        },
        assignment: {
          select: { id: true, title: true }
        },
        aiInteraction: {
          select: { id: true, assistanceType: true, writingStage: true }
        }
      }
    });
  }

  async findByStudent(studentId: string, options?: {
    assignmentId?: string;
    limit?: number;
    minQualityScore?: number;
  }): Promise<ReflectionAnalysis[]> {
    const where: any = { studentId };
    
    if (options?.assignmentId) {
      where.assignmentId = options.assignmentId;
    }
    if (options?.minQualityScore) {
      where.overallQualityScore = { gte: options.minQualityScore };
    }
    
    return await prisma.reflectionAnalysis.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 20,
      include: {
        assignment: {
          select: { id: true, title: true }
        },
        aiInteraction: {
          select: { id: true, assistanceType: true, writingStage: true }
        }
      }
    });
  }

  async findByAssignment(assignmentId: string, options?: {
    minQualityScore?: number;
    limit?: number;
  }): Promise<ReflectionAnalysis[]> {
    const where: any = { assignmentId };
    
    if (options?.minQualityScore) {
      where.overallQualityScore = { gte: options.minQualityScore };
    }
    
    return await prisma.reflectionAnalysis.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 50,
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true }
        },
        aiInteraction: {
          select: { id: true, assistanceType: true, writingStage: true }
        }
      }
    });
  }

  async create(data: {
    studentId: string;
    assignmentId: string;
    aiInteractionId: string;
    reflectionText: string;
    depthScore: number;
    reasoningChains: number;
    abstractionLevel: number;
    evidenceOfThinking: string[];
    selfAwarenessScore: number;
    recognizesGaps: boolean;
    questionsAssumptions: boolean;
    identifiesLearningProcess: boolean;
    articulatesStruggle: boolean;
    criticalThinkingScore: number;
    challengesAIPrompts: boolean;
    offersAlternatives: boolean;
    evaluatesPerspectives: boolean;
    synthesizesIdeas: boolean;
    growthMindsetScore: number;
    focusOnLearning: boolean;
    embracesChallenge: boolean;
    seeksImprovement: boolean;
    overallQualityScore: number;
    authenticityScore: number;
    progressiveAccessLevel: string;
    recommendations: string[];
  }): Promise<ReflectionAnalysis> {
    return await prisma.reflectionAnalysis.create({
      data,
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true }
        },
        assignment: {
          select: { id: true, title: true }
        },
        aiInteraction: {
          select: { id: true, assistanceType: true, writingStage: true }
        }
      }
    });
  }

  async update(id: string, data: Prisma.ReflectionAnalysisUpdateInput): Promise<ReflectionAnalysis> {
    return await prisma.reflectionAnalysis.update({
      where: { id },
      data,
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true }
        },
        assignment: {
          select: { id: true, title: true }
        }
      }
    });
  }

  async getLatestAnalysis(studentId: string, assignmentId?: string): Promise<ReflectionAnalysis | null> {
    const where: any = { studentId };
    
    if (assignmentId) {
      where.assignmentId = assignmentId;
    }
    
    return await prisma.reflectionAnalysis.findFirst({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        assignment: {
          select: { id: true, title: true }
        },
        aiInteraction: {
          select: { id: true, assistanceType: true, writingStage: true }
        }
      }
    });
  }

  async getQualityTrends(studentId: string, assignmentId?: string): Promise<{
    trend: 'improving' | 'stable' | 'declining';
    averageQuality: number;
    dataPoints: Array<{
      date: Date;
      qualityScore: number;
      authenticityScore: number;
    }>;
  }> {
    const where: any = { studentId };
    if (assignmentId) {
      where.assignmentId = assignmentId;
    }

    const analyses = await prisma.reflectionAnalysis.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 10, // Last 10 analyses for trend calculation
      select: {
        overallQualityScore: true,
        authenticityScore: true,
        createdAt: true
      }
    });

    if (analyses.length === 0) {
      return {
        trend: 'stable',
        averageQuality: 0,
        dataPoints: []
      };
    }

    const averageQuality = Math.round(
      analyses.reduce((sum, a) => sum + a.overallQualityScore, 0) / analyses.length
    );

    const dataPoints = analyses.reverse().map(a => ({
      date: a.createdAt,
      qualityScore: a.overallQualityScore,
      authenticityScore: a.authenticityScore
    }));

    // Calculate trend based on linear regression of quality scores
    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (analyses.length >= 3) {
      const recent = analyses.slice(0, 3).reduce((sum, a) => sum + a.overallQualityScore, 0) / 3;
      const older = analyses.slice(-3).reduce((sum, a) => sum + a.overallQualityScore, 0) / 3;
      
      if (recent > older + 10) trend = 'improving';
      else if (recent < older - 10) trend = 'declining';
    }

    return {
      trend,
      averageQuality,
      dataPoints
    };
  }

  async getClassAnalytics(assignmentId: string): Promise<{
    averageQuality: number;
    qualityDistribution: Record<string, number>;
    accessLevelDistribution: Record<string, number>;
    topStrengths: string[];
    commonGrowthAreas: string[];
  }> {
    const analyses = await prisma.reflectionAnalysis.findMany({
      where: { assignmentId },
      select: {
        overallQualityScore: true,
        progressiveAccessLevel: true,
        depthScore: true,
        selfAwarenessScore: true,
        criticalThinkingScore: true,
        growthMindsetScore: true,
        recommendations: true
      }
    });

    if (analyses.length === 0) {
      return {
        averageQuality: 0,
        qualityDistribution: {},
        accessLevelDistribution: {},
        topStrengths: [],
        commonGrowthAreas: []
      };
    }

    const averageQuality = Math.round(
      analyses.reduce((sum, a) => sum + a.overallQualityScore, 0) / analyses.length
    );

    // Quality distribution (by ranges)
    const qualityDistribution: Record<string, number> = {
      'Excellent (80-100)': 0,
      'Good (60-79)': 0,
      'Developing (40-59)': 0,
      'Needs Support (0-39)': 0
    };

    // Access level distribution
    const accessLevelDistribution: Record<string, number> = {};

    analyses.forEach(analysis => {
      // Quality distribution
      if (analysis.overallQualityScore >= 80) qualityDistribution['Excellent (80-100)']++;
      else if (analysis.overallQualityScore >= 60) qualityDistribution['Good (60-79)']++;
      else if (analysis.overallQualityScore >= 40) qualityDistribution['Developing (40-59)']++;
      else qualityDistribution['Needs Support (0-39)']++;

      // Access level distribution
      accessLevelDistribution[analysis.progressiveAccessLevel] = 
        (accessLevelDistribution[analysis.progressiveAccessLevel] || 0) + 1;
    });

    // Calculate average scores for strengths identification
    const avgDepth = analyses.reduce((sum, a) => sum + a.depthScore, 0) / analyses.length;
    const avgSelfAwareness = analyses.reduce((sum, a) => sum + a.selfAwarenessScore, 0) / analyses.length;
    const avgCriticalThinking = analyses.reduce((sum, a) => sum + a.criticalThinkingScore, 0) / analyses.length;
    const avgGrowthMindset = analyses.reduce((sum, a) => sum + a.growthMindsetScore, 0) / analyses.length;

    const strengthAreas = [
      { name: 'Deep Analysis', score: avgDepth },
      { name: 'Self-Awareness', score: avgSelfAwareness },
      { name: 'Critical Thinking', score: avgCriticalThinking },
      { name: 'Growth Mindset', score: avgGrowthMindset }
    ];

    const topStrengths = strengthAreas
      .filter(area => area.score >= 70)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(area => area.name);

    // Extract common growth recommendations
    const allRecommendations = analyses.flatMap(a => a.recommendations);
    const recommendationCounts: Record<string, number> = {};
    allRecommendations.forEach(rec => {
      if (typeof rec === 'string') {
        recommendationCounts[rec] = (recommendationCounts[rec] || 0) + 1;
      }
    });

    const commonGrowthAreas = Object.entries(recommendationCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([rec]) => rec);

    return {
      averageQuality,
      qualityDistribution,
      accessLevelDistribution,
      topStrengths,
      commonGrowthAreas
    };
  }
}