import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { type CollaborationSettings as BaseCollaborationSettings, type SubmissionStatus } from '@shared/types';

// Extended collaboration settings with UI-specific properties
interface ExtendedCollaborationSettings extends BaseCollaborationSettings {
  isCollaborative?: boolean; // UI helper for quick collaborative check
}

// Submission-specific types
interface SubmissionAnalytics {
  timeSpent?: number; // in minutes
  wordsAdded?: number;
  wordsDeleted?: number;
  revisionsCount?: number;
  lastActiveAt?: string;
  productivityMetrics?: {
    averageWordsPerMinute?: number;
    peakProductivityTime?: string;
    sessionsCount?: number;
  };
}

interface GradeData {
  score?: number;
  maxScore?: number;
  percentage?: number;
  letterGrade?: string;
  rubricScores?: Array<{
    criteriaId: string;
    score: number;
    maxScore: number;
    feedback?: string;
  }>;
  overallFeedback?: string;
  gradedAt?: string;
  gradedBy?: string;
}

interface AIInteraction {
  id: string;
  type: 'grammar' | 'style' | 'structure' | 'research' | 'citations' | 'brainstorming' | 'outlining';
  prompt: string;
  response: string;
  timestamp: string;
  stage?: string; // writing stage when interaction occurred
  approved?: boolean; // whether educator approved this interaction
}

// Extended submission interface for detailed views with additional UI fields
export interface ExtendedAssignmentSubmission {
  id: string;
  assignmentId: string;
  authorId: string;
  title?: string;
  content?: string;
  wordCount: number;
  status: SubmissionStatus;
  submittedAt?: string;
  lastSavedAt?: string;
  collaborationSettings: ExtendedCollaborationSettings;
  majorMilestones?: {
    version: number;
    timestamp: string;
    description: string;
    wordCount: number;
    author: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  }[];
  analytics: SubmissionAnalytics;
  grade?: GradeData;
  aiInteractions: AIInteraction[];
  createdAt: string;
  updatedAt: string;
  
  // UI-specific computed properties
  estimatedReadingTime?: number;
  comments?: Array<{
    id: string;
    content: string;
    author: {
      id: string;
      firstName: string;
      lastName: string;
    };
    createdAt: string;
  }>;
  currentVersion?: number;
  
  // Relations when populated
  assignment?: {
    id: string;
    title: string;
    dueDate?: string;
    requirements: Record<string, unknown>;
    collaboration: Record<string, unknown>;
    instructor: string;
    course: string;
  };
  author?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  collaborators?: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    joinedAt: string;
  }>;
}

const submissionsApi = {
  getUserSubmissions: async (): Promise<ExtendedAssignmentSubmission[]> => {
    const response = await api.get('/submissions/my-submissions');
    return response.data.data;
  },

  getSubmissionById: async (submissionId: string): Promise<ExtendedAssignmentSubmission> => {
    const response = await api.get(`/submissions/${submissionId}`);
    return response.data;
  },

  getAssignmentSubmissions: async (assignmentId: string): Promise<ExtendedAssignmentSubmission[]> => {
    const response = await api.get(`/assignments/${assignmentId}/submissions`);
    return response.data;
  },

  createSubmission: async (data: { 
    assignmentId: string; 
    title?: string; 
    content?: string 
  }): Promise<ExtendedAssignmentSubmission> => {
    const response = await api.post('/submissions', data);
    return response.data;
  },

  updateSubmission: async ({ 
    submissionId, 
    ...data 
  }: { 
    submissionId: string;
    title?: string;
    content?: string;
    status?: string;
  }): Promise<ExtendedAssignmentSubmission> => {
    const response = await api.put(`/submissions/${submissionId}`, data);
    return response.data;
  },

  submitForGrading: async (submissionId: string): Promise<ExtendedAssignmentSubmission> => {
    const response = await api.post(`/submissions/${submissionId}/submit`);
    return response.data;
  },

  deleteSubmission: async (submissionId: string): Promise<void> => {
    await api.delete(`/submissions/${submissionId}`);
  }
};

// Hook for getting current user's submissions
export const useUserSubmissions = () => {
  return useQuery({
    queryKey: ['submissions', 'my-submissions'],
    queryFn: submissionsApi.getUserSubmissions,
  });
};

// Hook for getting a specific submission by ID
export const useSubmission = (submissionId?: string) => {
  return useQuery({
    queryKey: ['submissions', submissionId],
    queryFn: () => submissionsApi.getSubmissionById(submissionId!),
    enabled: !!submissionId,
  });
};

// Hook for getting all submissions for a specific assignment
export const useAssignmentSubmissions = (assignmentId?: string) => {
  return useQuery({
    queryKey: ['submissions', 'assignment', assignmentId],
    queryFn: () => submissionsApi.getAssignmentSubmissions(assignmentId!),
    enabled: !!assignmentId,
  });
};

// Hook for creating a new submission
export const useCreateSubmission = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: submissionsApi.createSubmission,
    onSuccess: (newSubmission) => {
      // Invalidate and refetch user submissions
      queryClient.invalidateQueries({ queryKey: ['submissions', 'my-submissions'] });
      // Invalidate assignment submissions
      queryClient.invalidateQueries({ 
        queryKey: ['submissions', 'assignment', newSubmission.assignmentId] 
      });
    },
  });
};

// Hook for updating a submission
export const useUpdateSubmission = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: submissionsApi.updateSubmission,
    onSuccess: (updatedSubmission) => {
      // Update the specific submission in cache
      queryClient.setQueryData(
        ['submissions', updatedSubmission.id],
        updatedSubmission
      );
      // Invalidate user submissions list
      queryClient.invalidateQueries({ queryKey: ['submissions', 'my-submissions'] });
      // Invalidate assignment submissions
      queryClient.invalidateQueries({ 
        queryKey: ['submissions', 'assignment', updatedSubmission.assignmentId] 
      });
    },
  });
};

// Hook for submitting for grading
export const useSubmitForGrading = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: submissionsApi.submitForGrading,
    onSuccess: (updatedSubmission) => {
      // Update the specific submission in cache
      queryClient.setQueryData(
        ['submissions', updatedSubmission.id],
        updatedSubmission
      );
      // Invalidate user submissions list
      queryClient.invalidateQueries({ queryKey: ['submissions', 'my-submissions'] });
      // Invalidate assignment submissions
      queryClient.invalidateQueries({ 
        queryKey: ['submissions', 'assignment', updatedSubmission.assignmentId] 
      });
    },
  });
};

// Hook for deleting a submission
export const useDeleteSubmission = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: submissionsApi.deleteSubmission,
    onSuccess: (_, submissionId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: ['submissions', submissionId] });
      // Invalidate user submissions list
      queryClient.invalidateQueries({ queryKey: ['submissions', 'my-submissions'] });
      // Note: We can't easily invalidate assignment submissions without knowing the assignmentId
      // This is a trade-off - the list will be refetched when needed
    },
  });
};

// Hook for getting submission versions (placeholder for now)
export const useSubmissionVersions = (submissionId?: string) => {
  return useQuery({
    queryKey: ['submissions', submissionId, 'versions'],
    queryFn: async () => {
      const response = await api.get(`/submissions/${submissionId}/versions`);
      return response.data;
    },
    enabled: !!submissionId,
  });
};