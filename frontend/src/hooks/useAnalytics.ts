import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// Types for analytics data
export interface WritingProgress {
  assignmentId: string;
  assignmentTitle: string;
  learningObjectives: Array<{
    id: string;
    title: string;
    description: string;
    category: string;
    progress: number;
    mastery: 'not_started' | 'developing' | 'proficient' | 'advanced';
  }>;
  writingPatterns: Array<{
    date: string;
    wordsWritten: number;
    revisionsCount: number;
    timeSpent: number;
    engagementScore: number;
  }>;
  breakthroughMoments: Array<{
    timestamp: string;
    type: 'clarity' | 'structure' | 'voice' | 'evidence';
    description: string;
    context: string;
  }>;
  reflectionPrompts: Array<{
    id: string;
    prompt: string;
    category: 'process' | 'learning' | 'growth';
    priority: 'high' | 'medium' | 'low';
  }>;
  developmentTimeline: Array<{
    date: string;
    milestone: string;
    description: string;
    evidence: string;
  }>;
}

export interface ClassAnalytics {
  classId: string;
  className: string;
  totalStudents: number;
  assignmentId: string;
  assignmentTitle: string;
  overallProgress: {
    averageCompletion: number;
    onTrack: number;
    needsSupport: number;
    excelling: number;
  };
  learningObjectivesMastery: Array<{
    objectiveId: string;
    objectiveTitle: string;
    averageMastery: number;
    studentsStrugglingCount: number;
    studentsExcellingCount: number;
  }>;
  commonChallenges: Array<{
    challenge: string;
    affectedStudents: number;
    suggestedIntervention: string;
  }>;
  teachingOpportunities: Array<{
    opportunity: string;
    description: string;
    suggestedTiming: string;
    affectedStudents: string[];
  }>;
}

export interface WritingJourney {
  assignmentId: string;
  studentId: string;
  startDate: string;
  currentDate: string;
  totalEvents: number;
  milestones: Array<{
    date: string;
    type: 'first_draft' | 'major_revision' | 'peer_feedback' | 'instructor_feedback' | 'final_draft';
    title: string;
    description: string;
    significance: 'minor' | 'moderate' | 'major';
  }>;
  events: Array<{
    timestamp: string;
    type: 'draft' | 'revision' | 'feedback' | 'reflection' | 'breakthrough';
    description: string;
    wordCount: number;
    changes: {
      added: number;
      deleted: number;
      modified: number;
    };
    metadata: {
      sessionDuration?: number;
      focusAreas?: string[];
      emotionalState?: 'confident' | 'uncertain' | 'frustrated' | 'breakthrough';
      cognitiveLoad?: 'low' | 'medium' | 'high';
    };
  }>;
  patterns: {
    mostProductiveTime: string;
    averageSessionLength: number;
    revisionHabits: string;
    learningMoments: number;
  };
}

// Hook for student writing progress
export const useWritingProgress = (studentId: string, assignmentId: string) => {
  return useQuery({
    queryKey: ['writingProgress', studentId, assignmentId],
    queryFn: async () => {
      if (!studentId || !assignmentId) return null;
      const response = await api.get<WritingProgress>(
        `/analytics/writing-progress/${studentId}/${assignmentId}`
      );
      return response.data;
    },
    enabled: !!studentId && !!assignmentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for class analytics
export const useClassAnalytics = (classId: string, assignmentId: string) => {
  return useQuery({
    queryKey: ['classAnalytics', classId, assignmentId],
    queryFn: async () => {
      if (!classId || !assignmentId) return null;
      const response = await api.get<ClassAnalytics>(
        `/analytics/class-insights/${classId}/${assignmentId}`
      );
      return response.data;
    },
    enabled: !!classId && !!assignmentId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook for writing journey visualization
export const useWritingJourney = (studentId: string, assignmentId: string) => {
  return useQuery({
    queryKey: ['writingJourney', studentId, assignmentId],
    queryFn: async () => {
      if (!studentId || !assignmentId) return null;
      const response = await api.get<WritingJourney>(
        `/analytics/writing-journey/${studentId}/${assignmentId}`
      );
      return response.data;
    },
    enabled: !!studentId && !!assignmentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for student insights (for educators)
export const useStudentInsights = (classId: string, assignmentId: string) => {
  return useQuery({
    queryKey: ['studentInsights', classId, assignmentId],
    queryFn: async () => {
      if (!classId || !assignmentId) return [];
      const response = await api.get(
        `/analytics/student-insights/${classId}/${assignmentId}`
      );
      return response.data;
    },
    enabled: !!classId && !!assignmentId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook for learning objective progress
export const useLearningObjectiveProgress = (studentId: string, objectiveId?: string) => {
  return useQuery({
    queryKey: ['learningObjectiveProgress', studentId, objectiveId],
    queryFn: async () => {
      const endpoint = objectiveId 
        ? `/analytics/learning-objectives/${studentId}/${objectiveId}`
        : `/analytics/learning-objectives/${studentId}`;
      const response = await api.get(endpoint);
      return response.data;
    },
    enabled: !!studentId,
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
};

// Hook for writing analytics summary
export const useWritingAnalyticsSummary = (userId: string, timeRange: 'week' | 'month' | 'semester' = 'month') => {
  return useQuery({
    queryKey: ['writingAnalyticsSummary', userId, timeRange],
    queryFn: async () => {
      const response = await api.get(`/analytics/summary/${userId}?range=${timeRange}`);
      return response.data;
    },
    enabled: !!userId,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};

// Hook for reflection submission
export const useSubmitReflection = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (reflection: {
      studentId: string;
      assignmentId: string;
      promptId: string;
      content: string;
      metadata?: Record<string, unknown>;
    }) => {
      const response = await api.post('/analytics/reflections', reflection);
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate related queries to refresh data
      queryClient.invalidateQueries({
        queryKey: ['writingProgress', variables.studentId, variables.assignmentId]
      });
      queryClient.invalidateQueries({
        queryKey: ['writingJourney', variables.studentId, variables.assignmentId]
      });
    },
  });
};

// Hook for breakthrough moment recording
export const useRecordBreakthrough = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (breakthrough: {
      studentId: string;
      assignmentId: string;
      type: 'clarity' | 'structure' | 'voice' | 'evidence';
      description: string;
      context: string;
      timestamp?: string;
    }) => {
      const response = await api.post('/analytics/breakthroughs', {
        ...breakthrough,
        timestamp: breakthrough.timestamp || new Date().toISOString(),
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: ['writingProgress', variables.studentId, variables.assignmentId]
      });
      queryClient.invalidateQueries({
        queryKey: ['writingJourney', variables.studentId, variables.assignmentId]
      });
    },
  });
};

// Hook for intervention tracking
export const useTrackIntervention = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (intervention: {
      studentId: string;
      assignmentId: string;
      educatorId: string;
      type: 'immediate' | 'soon' | 'watch';
      category: 'writing_skill' | 'engagement' | 'process' | 'motivation';
      description: string;
      action: string;
      status: 'planned' | 'in_progress' | 'completed';
    }) => {
      const response = await api.post('/analytics/interventions', intervention);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate educator dashboard queries
      queryClient.invalidateQueries({
        queryKey: ['studentInsights']
      });
      queryClient.invalidateQueries({
        queryKey: ['classAnalytics']
      });
    },
  });
};

// Hook for real-time analytics updates
export const useRealTimeAnalytics = (studentId: string, assignmentId: string) => {
  
  // This would typically use WebSocket or Server-Sent Events
  // For now, we'll use polling as a placeholder
  return useQuery({
    queryKey: ['realTimeAnalytics', studentId, assignmentId],
    queryFn: async () => {
      const response = await api.get(`/analytics/real-time/${studentId}/${assignmentId}`);
      return response.data;
    },
    enabled: !!studentId && !!assignmentId,
    refetchInterval: 30000, // Poll every 30 seconds
    staleTime: 0, // Always consider stale to enable polling
  });
};

// Hook for analytics preferences
export const useAnalyticsPreferences = (userId: string) => {
  return useQuery({
    queryKey: ['analyticsPreferences', userId],
    queryFn: async () => {
      const response = await api.get(`/analytics/preferences/${userId}`);
      return response.data;
    },
    enabled: !!userId,
    staleTime: 60 * 60 * 1000, // 1 hour
  });
};

// Hook for updating analytics preferences
export const useUpdateAnalyticsPreferences = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (preferences: {
      userId: string;
      settings: {
        showEmotionalJourney?: boolean;
        enableRealTimeUpdates?: boolean;
        defaultTimeRange?: 'week' | 'month' | 'semester';
        notificationThresholds?: {
          inactivity?: number;
          strugglingMetric?: number;
        };
        privacySettings?: {
          shareWithInstructors?: boolean;
          shareWithPeers?: boolean;
        };
      };
    }) => {
      const response = await api.put(`/analytics/preferences/${preferences.userId}`, preferences.settings);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['analyticsPreferences', variables.userId]
      });
    },
  });
};

// Utility hook for common analytics operations
export const useAnalyticsHelpers = () => {
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  const calculateTrend = (data: number[]): 'improving' | 'stable' | 'declining' => {
    if (data.length < 2) return 'stable';
    const recent = data.slice(-3);
    const earlier = data.slice(-6, -3);
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const earlierAvg = earlier.reduce((a, b) => a + b, 0) / earlier.length;
    
    if (recentAvg > earlierAvg * 1.1) return 'improving';
    if (recentAvg < earlierAvg * 0.9) return 'declining';
    return 'stable';
  };

  const getMasteryLevel = (progress: number): 'not_started' | 'developing' | 'proficient' | 'advanced' => {
    if (progress === 0) return 'not_started';
    if (progress < 50) return 'developing';
    if (progress < 80) return 'proficient';
    return 'advanced';
  };

  const getPriorityColor = (priority: 'high' | 'medium' | 'low'): string => {
    switch (priority) {
      case 'high': return 'bg-ember-100 text-ember-800';
      case 'medium': return 'bg-highlight-100 text-highlight-800';
      default: return 'bg-ink-100 text-ink-600';
    }
  };

  return {
    formatDuration,
    calculateTrend,
    getMasteryLevel,
    getPriorityColor,
  };
};