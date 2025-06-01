import { AIInteractionLog, ReflectionAnalysis, User, Assignment } from '@prisma/client';
import { AIInteractionRepository, AIInteractionWithRelations } from '../interfaces/AIInteractionRepository';
import { FindManyOptions, CountOptions, CreateData, UpdateData } from '../interfaces/BaseRepository';

/**
 * Mock implementation of AIInteractionRepository for testing
 */
export class MockAIInteractionRepository implements AIInteractionRepository {
  private interactions: Map<string, AIInteractionLog> = new Map();
  private students: Map<string, User> = new Map();
  private assignments: Map<string, Assignment> = new Map();

  constructor() {
    this.seedTestData();
  }

  async findById(id: string): Promise<AIInteractionLog | null> {
    return this.interactions.get(id) || null;
  }

  async findMany(options: FindManyOptions<AIInteractionLog> = {}): Promise<AIInteractionLog[]> {
    const { where, orderBy, skip = 0, take } = options;
    let results = Array.from(this.interactions.values());

    // Apply where filtering
    if (where) {
      results = results.filter(interaction => {
        return Object.entries(where).every(([key, value]) => {
          return (interaction as any)[key] === value;
        });
      });
    }

    // Apply ordering
    if (orderBy) {
      const [field, direction] = Object.entries(orderBy)[0];
      results.sort((a, b) => {
        const aVal = (a as any)[field];
        const bVal = (b as any)[field];
        if (direction === 'desc') return bVal > aVal ? 1 : -1;
        return aVal > bVal ? 1 : -1;
      });
    }

    // Apply pagination
    if (take) {
      results = results.slice(skip, skip + take);
    } else if (skip > 0) {
      results = results.slice(skip);
    }

    return results;
  }

  async create(data: CreateData<AIInteractionLog>): Promise<AIInteractionLog> {
    const interaction: AIInteractionLog = {
      id: `interaction-${Date.now()}`,
      createdAt: new Date(),
      ...data
    } as AIInteractionLog;

    this.interactions.set(interaction.id, interaction);
    return interaction;
  }

  async update(id: string, data: UpdateData<AIInteractionLog>): Promise<AIInteractionLog> {
    const existing = this.interactions.get(id);
    if (!existing) {
      throw new Error(`AI Interaction not found: ${id}`);
    }

    const updated = {
      ...existing,
      ...data
    };

    this.interactions.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    if (!this.interactions.has(id)) {
      throw new Error(`AI Interaction not found: ${id}`);
    }
    this.interactions.delete(id);
  }

  async count(options: CountOptions<AIInteractionLog> = {}): Promise<number> {
    const { where } = options;
    let results = Array.from(this.interactions.values());

    if (where) {
      results = results.filter(interaction => {
        return Object.entries(where).every(([key, value]) => {
          return (interaction as any)[key] === value;
        });
      });
    }

    return results.length;
  }

  async findByStudentId(
    studentId: string,
    timeframe?: { start: Date; end: Date }
  ): Promise<AIInteractionLog[]> {
    let results = Array.from(this.interactions.values())
      .filter(interaction => interaction.studentId === studentId);

    if (timeframe) {
      results = results.filter(interaction => 
        interaction.createdAt >= timeframe.start && interaction.createdAt <= timeframe.end
      );
    }

    return results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async findByAssignmentId(
    assignmentId: string,
    timeframe?: { start: Date; end: Date }
  ): Promise<AIInteractionLog[]> {
    let results = Array.from(this.interactions.values())
      .filter(interaction => interaction.assignmentId === assignmentId);

    if (timeframe) {
      results = results.filter(interaction => 
        interaction.createdAt >= timeframe.start && interaction.createdAt <= timeframe.end
      );
    }

    return results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async findByAssistanceType(
    assistanceType: string,
    courseId?: string,
    timeframe?: { start: Date; end: Date }
  ): Promise<AIInteractionLog[]> {
    let results = Array.from(this.interactions.values())
      .filter(interaction => interaction.assistanceType === assistanceType);

    if (timeframe) {
      results = results.filter(interaction => 
        interaction.createdAt >= timeframe.start && interaction.createdAt <= timeframe.end
      );
    }

    // Course filtering would require assignment data
    if (courseId) {
      results = results.filter(interaction => {
        const assignment = this.assignments.get(interaction.assignmentId || '');
        return assignment?.courseId === courseId;
      });
    }

    return results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getStudentUsagePattern(
    studentId: string,
    timeframe: { start: Date; end: Date }
  ): Promise<{
    totalInteractions: number;
    assistanceTypes: Record<string, number>;
    writingStages: Record<string, number>;
    reflectionCompletion: {
      completed: number;
      pending: number;
      averageQuality: number;
    };
    usageByDay: Array<{
      date: Date;
      interactionCount: number;
      averageQuality: number;
    }>;
    dependencyIndicators: {
      frequencyScore: number;
      qualityScore: number;
      independenceScore: number;
    };
  } | null> {
    const interactions = await this.findByStudentId(studentId, timeframe);
    
    if (interactions.length === 0) return null;

    const totalInteractions = interactions.length;
    
    // Count assistance types
    const assistanceTypes = interactions.reduce((acc, log) => {
      acc[log.assistanceType] = (acc[log.assistanceType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Count writing stages
    const writingStages = interactions.reduce((acc, log) => {
      acc[log.writingStage] = (acc[log.writingStage] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Analyze reflections
    const completedReflections = interactions.filter(log => log.reflectionCompleted);
    const pendingReflections = interactions.filter(log => !log.reflectionCompleted);
    const qualityScores = completedReflections
      .map(log => log.reflectionQualityScore)
      .filter(score => score !== null) as number[];
    
    const averageQuality = qualityScores.length > 0 
      ? qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length
      : 0;

    // Group by day
    const dayGroups = new Map<string, { count: number; qualities: number[] }>();
    interactions.forEach(log => {
      const dayKey = log.createdAt.toISOString().split('T')[0];
      const dayData = dayGroups.get(dayKey) || { count: 0, qualities: [] };
      dayData.count++;
      
      if (log.reflectionQualityScore) {
        dayData.qualities.push(log.reflectionQualityScore);
      }
      
      dayGroups.set(dayKey, dayData);
    });

    const usageByDay = Array.from(dayGroups.entries()).map(([dateStr, data]) => ({
      date: new Date(dateStr),
      interactionCount: data.count,
      averageQuality: data.qualities.length > 0 
        ? data.qualities.reduce((sum, q) => sum + q, 0) / data.qualities.length 
        : 0
    }));

    // Calculate dependency indicators
    const daysInTimeframe = Math.ceil((timeframe.end.getTime() - timeframe.start.getTime()) / (1000 * 60 * 60 * 24));
    const frequencyScore = Math.min(100, (totalInteractions / daysInTimeframe) * 10);
    const qualityScore = averageQuality;
    const independenceScore = Math.max(0, 100 - frequencyScore);

    return {
      totalInteractions,
      assistanceTypes,
      writingStages,
      reflectionCompletion: {
        completed: completedReflections.length,
        pending: pendingReflections.length,
        averageQuality
      },
      usageByDay,
      dependencyIndicators: {
        frequencyScore,
        qualityScore,
        independenceScore
      }
    };
  }

  async findPendingReflections(
    assignmentId?: string,
    studentId?: string
  ): Promise<(AIInteractionLog & {
    student: User;
    assignment: Assignment;
  })[]> {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    
    let results = Array.from(this.interactions.values())
      .filter(interaction => 
        !interaction.reflectionCompleted && 
        interaction.createdAt < twoHoursAgo
      );

    if (assignmentId) {
      results = results.filter(i => i.assignmentId === assignmentId);
    }

    if (studentId) {
      results = results.filter(i => i.studentId === studentId);
    }

    return results.map(interaction => ({
      ...interaction,
      student: this.students.get(interaction.studentId)!,
      assignment: this.assignments.get(interaction.assignmentId || '')!
    })).filter(item => item.student && item.assignment);
  }

  async findHighFrequencyUsers(
    courseId: string,
    threshold: number = 10,
    timeframe: { start: Date; end: Date }
  ): Promise<Array<{
    studentId: string;
    student: User;
    interactionCount: number;
    averageQuality: number;
    lastInteraction: Date;
  }>> {
    // Get interactions in timeframe for course
    const allInteractions = Array.from(this.interactions.values())
      .filter(interaction => 
        interaction.createdAt >= timeframe.start && 
        interaction.createdAt <= timeframe.end
      );

    // Filter by course (through assignments)
    const courseInteractions = allInteractions.filter(interaction => {
      const assignment = this.assignments.get(interaction.assignmentId || '');
      return assignment?.courseId === courseId;
    });

    // Group by student
    const studentStats = new Map<string, {
      student: User;
      count: number;
      qualityScores: number[];
      lastInteraction: Date;
    }>();

    courseInteractions.forEach(log => {
      const student = this.students.get(log.studentId);
      if (!student) return;

      const stats = studentStats.get(log.studentId) || {
        student,
        count: 0,
        qualityScores: [],
        lastInteraction: log.createdAt
      };
      
      stats.count++;
      if (log.reflectionQualityScore) {
        stats.qualityScores.push(log.reflectionQualityScore);
      }
      if (log.createdAt > stats.lastInteraction) {
        stats.lastInteraction = log.createdAt;
      }
      
      studentStats.set(log.studentId, stats);
    });

    // Filter by threshold and format results
    return Array.from(studentStats.entries())
      .filter(([_, stats]) => stats.count >= threshold)
      .map(([studentId, stats]) => ({
        studentId,
        student: stats.student,
        interactionCount: stats.count,
        averageQuality: stats.qualityScores.length > 0 
          ? stats.qualityScores.reduce((sum, score) => sum + score, 0) / stats.qualityScores.length
          : 0,
        lastInteraction: stats.lastInteraction
      }))
      .sort((a, b) => b.interactionCount - a.interactionCount);
  }

  async getAssignmentAnalytics(assignmentId: string): Promise<{
    totalInteractions: number;
    uniqueStudents: number;
    assistanceTypeDistribution: Record<string, number>;
    writingStageDistribution: Record<string, number>;
    reflectionMetrics: {
      completionRate: number;
      averageQuality: number;
      qualityDistribution: Record<string, number>;
    };
    timePatterns: {
      hourlyDistribution: number[];
      dailyDistribution: number[];
      peakUsageTimes: string[];
    };
    educationalEffectiveness: {
      studentsShowingImprovement: number;
      averageIndependenceGrowth: number;
      successfulInterventions: number;
    };
  } | null> {
    const interactions = await this.findByAssignmentId(assignmentId);
    
    if (interactions.length === 0) return null;

    const totalInteractions = interactions.length;
    const uniqueStudents = new Set(interactions.map(log => log.studentId)).size;

    // Distribution analysis
    const assistanceTypeDistribution = interactions.reduce((acc, log) => {
      acc[log.assistanceType] = (acc[log.assistanceType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const writingStageDistribution = interactions.reduce((acc, log) => {
      acc[log.writingStage] = (acc[log.writingStage] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Reflection metrics
    const completedReflections = interactions.filter(log => log.reflectionCompleted);
    const completionRate = interactions.length > 0 ? completedReflections.length / interactions.length : 0;
    
    const qualityScores = completedReflections
      .map(log => log.reflectionQualityScore)
      .filter(score => score !== null) as number[];
    
    const averageQuality = qualityScores.length > 0 
      ? qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length
      : 0;

    const qualityDistribution = qualityScores.reduce((acc, score) => {
      const bucket = score >= 80 ? 'high' : score >= 60 ? 'medium' : 'low';
      acc[bucket] = (acc[bucket] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Time patterns
    const hourlyDistribution = new Array(24).fill(0);
    const dailyDistribution = new Array(7).fill(0);
    
    interactions.forEach(log => {
      hourlyDistribution[log.createdAt.getHours()]++;
      dailyDistribution[log.createdAt.getDay()]++;
    });

    const peakHours = hourlyDistribution
      .map((count, hour) => ({ hour, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(item => `${item.hour}:00`);

    return {
      totalInteractions,
      uniqueStudents,
      assistanceTypeDistribution,
      writingStageDistribution,
      reflectionMetrics: {
        completionRate,
        averageQuality,
        qualityDistribution
      },
      timePatterns: {
        hourlyDistribution,
        dailyDistribution,
        peakUsageTimes: peakHours
      },
      educationalEffectiveness: {
        studentsShowingImprovement: 0, // Mock values
        averageIndependenceGrowth: 0,
        successfulInterventions: 0
      }
    };
  }

  async logInteraction(data: {
    studentId: string;
    assignmentId: string;
    assistanceType: string;
    writingStage: string;
    questionText: string;
    questionsGenerated?: number;
    educationallySound: boolean;
    metadata?: any;
  }): Promise<AIInteractionLog> {
    return await this.create({
      studentId: data.studentId,
      assignmentId: data.assignmentId,
      assistanceType: data.assistanceType,
      writingStage: data.writingStage,
      questionText: data.questionText,
      questionsGenerated: data.questionsGenerated ?? 0,
      educationallySound: data.educationallySound,
      responseId: `response-${Date.now()}`,
      reflectionCompleted: false,
      reflectionQualityScore: null,
      reflectionSubmittedAt: null,
      metadata: data.metadata || {}
    });
  }

  async markReflectionCompleted(
    interactionId: string,
    reflectionData: {
      qualityScore: number;
      submittedAt: Date;
      analysisId?: string;
    }
  ): Promise<AIInteractionLog> {
    return await this.update(interactionId, {
      reflectionCompleted: true,
      reflectionQualityScore: reflectionData.qualityScore,
      reflectionSubmittedAt: reflectionData.submittedAt,
      metadata: {
        ...(typeof this.interactions.get(interactionId)?.metadata === 'object' && this.interactions.get(interactionId)?.metadata !== null 
          ? this.interactions.get(interactionId)!.metadata as object
          : {}),
        reflectionAnalysisId: reflectionData.analysisId
      }
    });
  }

  async findByEducationalEffectiveness(
    effectiveness: 'high' | 'medium' | 'low',
    timeframe?: { start: Date; end: Date }
  ): Promise<AIInteractionLog[]> {
    let qualityRange: { min: number; max: number };
    
    switch (effectiveness) {
      case 'high':
        qualityRange = { min: 80, max: 100 };
        break;
      case 'medium':
        qualityRange = { min: 60, max: 79 };
        break;
      case 'low':
        qualityRange = { min: 0, max: 59 };
        break;
    }

    let results = Array.from(this.interactions.values())
      .filter(interaction => 
        interaction.reflectionCompleted && 
        interaction.reflectionQualityScore !== null &&
        interaction.reflectionQualityScore >= qualityRange.min &&
        interaction.reflectionQualityScore <= qualityRange.max
      );

    if (timeframe) {
      results = results.filter(interaction => 
        interaction.createdAt >= timeframe.start && interaction.createdAt <= timeframe.end
      );
    }

    return results.sort((a, b) => (b.reflectionQualityScore || 0) - (a.reflectionQualityScore || 0));
  }

  async getCourseUsageTrends(
    courseId: string,
    timeframe: { start: Date; end: Date }
  ): Promise<{
    totalInteractions: number;
    trendsOverTime: Array<{
      date: Date;
      interactionCount: number;
      reflectionQuality: number;
      educationalSoundness: number;
    }>;
    studentEngagement: {
      activeStudents: number;
      averageInteractionsPerStudent: number;
      highQualityReflectors: number;
    };
    concerningPatterns: Array<{
      type: 'high_frequency' | 'low_quality_reflections' | 'gaming_system';
      affectedStudents: string[];
      description: string;
      severity: 'low' | 'medium' | 'high';
    }>;
  }> {
    // Get course interactions through assignments
    const courseInteractions = Array.from(this.interactions.values())
      .filter(interaction => {
        const assignment = this.assignments.get(interaction.assignmentId || '');
        return assignment?.courseId === courseId &&
               interaction.createdAt >= timeframe.start &&
               interaction.createdAt <= timeframe.end;
      });

    const totalInteractions = courseInteractions.length;

    // Group by date for trends
    const dateGroups = new Map<string, {
      interactions: AIInteractionLog[];
      reflectionQualities: number[];
      educationallySound: number;
    }>();

    courseInteractions.forEach(log => {
      const dateKey = log.createdAt.toISOString().split('T')[0];
      const group = dateGroups.get(dateKey) || {
        interactions: [],
        reflectionQualities: [],
        educationallySound: 0
      };
      
      group.interactions.push(log);
      if (log.reflectionQualityScore) {
        group.reflectionQualities.push(log.reflectionQualityScore);
      }
      if (log.educationallySound) {
        group.educationallySound++;
      }
      
      dateGroups.set(dateKey, group);
    });

    const trendsOverTime = Array.from(dateGroups.entries()).map(([dateStr, group]) => ({
      date: new Date(dateStr),
      interactionCount: group.interactions.length,
      reflectionQuality: group.reflectionQualities.length > 0 
        ? group.reflectionQualities.reduce((sum, q) => sum + q, 0) / group.reflectionQualities.length
        : 0,
      educationalSoundness: group.interactions.length > 0 
        ? group.educationallySound / group.interactions.length
        : 0
    }));

    // Student engagement metrics
    const studentStats = new Map<string, { count: number; avgQuality: number }>();
    courseInteractions.forEach(log => {
      const stats = studentStats.get(log.studentId) || { count: 0, avgQuality: 0 };
      stats.count++;
      if (log.reflectionQualityScore) {
        stats.avgQuality = (stats.avgQuality + log.reflectionQualityScore) / 2;
      }
      studentStats.set(log.studentId, stats);
    });

    const activeStudents = studentStats.size;
    const averageInteractionsPerStudent = activeStudents > 0 ? totalInteractions / activeStudents : 0;
    const highQualityReflectors = Array.from(studentStats.values()).filter(stats => stats.avgQuality >= 80).length;

    // Identify concerning patterns
    const concerningPatterns = [];
    
    const highFrequencyUsers = Array.from(studentStats.entries())
      .filter(([_, stats]) => stats.count > 15)
      .map(([studentId]) => studentId);
    
    if (highFrequencyUsers.length > 0) {
      concerningPatterns.push({
        type: 'high_frequency' as const,
        affectedStudents: highFrequencyUsers,
        description: `${highFrequencyUsers.length} students showing high AI dependency`,
        severity: highFrequencyUsers.length > activeStudents * 0.2 ? 'high' as const : 'medium' as const
      });
    }

    return {
      totalInteractions,
      trendsOverTime,
      studentEngagement: {
        activeStudents,
        averageInteractionsPerStudent,
        highQualityReflectors
      },
      concerningPatterns
    };
  }

  async findStudentsShowingIndependence(
    courseId: string,
    timeframe: { start: Date; end: Date }
  ): Promise<Array<{
    studentId: string;
    student: User;
    improvementMetrics: {
      frequencyReduction: number;
      qualityIncrease: number;
      independenceScore: number;
    };
    timeline: Array<{
      date: Date;
      interactionCount: number;
      averageQuality: number;
    }>;
  }>> {
    // Mock implementation - return empty array for now
    return [];
  }

  async getEducatorInsights(
    instructorId: string,
    courseId?: string
  ): Promise<{
    overview: {
      totalStudents: number;
      aiActiveStudents: number;
      averageUsageRate: number;
      concerningStudents: number;
    };
    recommendations: Array<{
      type: 'boundary_adjustment' | 'student_intervention' | 'assignment_modification';
      priority: 'low' | 'medium' | 'high';
      description: string;
      affectedEntities: string[];
      actionItems: string[];
    }>;
    successStories: Array<{
      studentId: string;
      improvement: string;
      timeframe: string;
    }>;
    trendsAndPatterns: {
      usageGrowth: number;
      qualityImprovement: number;
      independenceGrowth: number;
      mostEffectiveStrategies: string[];
    };
  }> {
    // Mock implementation
    return {
      overview: {
        totalStudents: 25,
        aiActiveStudents: 20,
        averageUsageRate: 0.8,
        concerningStudents: 3
      },
      recommendations: [],
      successStories: [],
      trendsAndPatterns: {
        usageGrowth: 5,
        qualityImprovement: 10,
        independenceGrowth: 8,
        mostEffectiveStrategies: ['Reflection requirements', 'Progressive access']
      }
    };
  }

  async generateComplianceReport(
    timeframe: { start: Date; end: Date },
    courseId?: string
  ): Promise<{
    period: { start: Date; end: Date };
    summary: {
      totalInteractions: number;
      totalStudents: number;
      educationallySoundPercentage: number;
      reflectionCompletionRate: number;
    };
    breakdown: {
      byAssistanceType: Record<string, number>;
      byWritingStage: Record<string, number>;
      byEducationalSoundness: Record<string, number>;
    };
    qualityMetrics: {
      averageReflectionQuality: number;
      highQualityInteractions: number;
      interventionsTriggered: number;
    };
    studentOutcomes: {
      studentsShowingIndependence: number;
      studentsNeedingSupport: number;
      improvementTrends: string[];
    };
  }> {
    let interactions = Array.from(this.interactions.values())
      .filter(interaction => 
        interaction.createdAt >= timeframe.start && interaction.createdAt <= timeframe.end
      );

    if (courseId) {
      interactions = interactions.filter(interaction => {
        const assignment = this.assignments.get(interaction.assignmentId || '');
        return assignment?.courseId === courseId;
      });
    }

    const totalInteractions = interactions.length;
    const totalStudents = new Set(interactions.map(log => log.studentId)).size;
    const educationallySoundCount = interactions.filter(log => log.educationallySound).length;
    const educationallySoundPercentage = totalInteractions > 0 
      ? (educationallySoundCount / totalInteractions) * 100
      : 0;

    const reflectionCompletedCount = interactions.filter(log => log.reflectionCompleted).length;
    const reflectionCompletionRate = totalInteractions > 0 
      ? (reflectionCompletedCount / totalInteractions) * 100
      : 0;

    // Breakdown analysis
    const byAssistanceType = interactions.reduce((acc, log) => {
      acc[log.assistanceType] = (acc[log.assistanceType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byWritingStage = interactions.reduce((acc, log) => {
      acc[log.writingStage] = (acc[log.writingStage] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byEducationalSoundness = {
      'educationally_sound': educationallySoundCount,
      'not_educationally_sound': totalInteractions - educationallySoundCount
    };

    // Quality metrics
    const qualityScores = interactions
      .map(log => log.reflectionQualityScore)
      .filter(score => score !== null) as number[];
    
    const averageReflectionQuality = qualityScores.length > 0 
      ? qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length
      : 0;

    const highQualityInteractions = qualityScores.filter(score => score >= 80).length;

    return {
      period: timeframe,
      summary: {
        totalInteractions,
        totalStudents,
        educationallySoundPercentage,
        reflectionCompletionRate
      },
      breakdown: {
        byAssistanceType,
        byWritingStage,
        byEducationalSoundness
      },
      qualityMetrics: {
        averageReflectionQuality,
        highQualityInteractions,
        interventionsTriggered: 0
      },
      studentOutcomes: {
        studentsShowingIndependence: 0,
        studentsNeedingSupport: 0,
        improvementTrends: ['Overall reflection quality improving']
      }
    };
  }

  // Helper methods for testing

  addMockInteraction(interaction: Partial<AIInteractionLog>): AIInteractionLog {
    const mockInteraction: AIInteractionLog = {
      id: `interaction-${Date.now()}`,
      studentId: 'test-student',
      assignmentId: 'test-assignment',
      assistanceType: 'grammar',
      questionsGenerated: 1,
      educationallySound: true,
      writingStage: 'drafting',
      questionText: 'Test question',
      responseId: 'test-response',
      reflectionCompleted: false,
      reflectionQualityScore: null,
      reflectionSubmittedAt: null,
      metadata: {},
      createdAt: new Date(),
      ...interaction
    };

    this.interactions.set(mockInteraction.id, mockInteraction);
    return mockInteraction;
  }

  clearMockData(): void {
    this.interactions.clear();
    this.students.clear();
    this.assignments.clear();
  }

  private seedTestData(): void {
    // Add mock student
    const mockStudent: User = {
      id: 'student-1',
      email: 'student@test.com',
      passwordHash: 'hashed',
      firstName: 'Test',
      lastName: 'Student',
      role: 'student',
      profilePicture: null,
      bio: null,
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.students.set(mockStudent.id, mockStudent);

    // Add mock assignment
    const mockAssignment: Assignment = {
      id: 'assignment-1',
      templateId: null,
      courseId: 'course-1',
      instructorId: 'instructor-1',
      title: 'Test Assignment',
      instructions: 'Test instructions',
      requirements: {},
      writingStages: [],
      learningObjectives: [],
      aiSettings: {},
      aiBoundarySettings: {},
      gradingCriteria: null,
      dueDate: null,
      stageDueDates: null,
      status: 'published',
      type: 'individual',
      collaborationSettings: {},
      versionControlSettings: {},
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.assignments.set(mockAssignment.id, mockAssignment);

    // Add mock interactions
    this.addMockInteraction({
      id: 'interaction-1',
      studentId: 'student-1',
      assignmentId: 'assignment-1',
      assistanceType: 'grammar',
      reflectionCompleted: true,
      reflectionQualityScore: 85,
      reflectionSubmittedAt: new Date()
    });

    this.addMockInteraction({
      id: 'interaction-2',
      studentId: 'student-1',
      assignmentId: 'assignment-1',
      assistanceType: 'structure',
      reflectionCompleted: false
    });
  }
}