import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_BASE = 'http://localhost:5001/api/submissions';

// Types
export interface AssignmentSubmission {
  _id: string;
  assignment: {
    _id: string;
    title: string;
    dueDate?: string;
    requirements: Record<string, unknown>;
    collaboration: Record<string, unknown>;
    instructor: string;
    course: string;
  };
  author: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  collaborators: Array<{
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  }>;
  title: string;
  content: string;
  wordCount: number;
  characterCount: number;
  status: 'draft' | 'in_progress' | 'submitted' | 'returned' | 'graded';
  submittedAt?: string;
  lastSavedAt: string;
  collaboration: {
    isCollaborative: boolean;
    activeUsers: string[];
    lastActiveAt: string;
    conflictResolution: 'auto' | 'manual';
  };
  currentVersion: number;
  majorMilestones: Array<{
    version: number;
    timestamp: string;
    description: string;
    wordCount: number;
    author: { _id: string; firstName: string; lastName: string; email: string };
  }>;
  comments: Array<{
    id: string;
    author: {
      firstName: string;
      lastName: string;
      email: string;
    };
    content: string;
    position?: {
      start: number;
      end: number;
    };
    type: 'comment' | 'suggestion' | 'question' | 'approval';
    resolved: boolean;
    createdAt: string;
    replies?: Array<{
      author: { _id: string; firstName: string; lastName: string; email: string };
      content: string;
      createdAt: string;
    }>;
  }>;
  analytics: {
    writingSessions: number;
    totalWritingTime: number;
    averageSessionLength: number;
    writingPattern: Array<{
      date: string;
      wordsWritten: number;
      timeSpent: number;
      revisionsCount: number;
    }>;
    collaborationMetrics: {
      contributorStats: Array<{
        user: { _id: string; firstName: string; lastName: string; email: string };
        wordsContributed: number;
        editsCount: number;
        commentsCount: number;
      }>;
      conflictsResolved: number;
      realTimeMinutes: number;
    };
  };
  grade?: {
    score?: number;
    maxScore?: number;
    rubricScores: Array<{
      criteria: string;
      score: number;
      maxScore: number;
      feedback: string;
    }>;
    overallFeedback: string;
    gradedBy: { _id: string; firstName: string; lastName: string; email: string } | null;
    gradedAt: string;
  };
  aiInteractions: Array<{
    sessionId: string;
    type: 'grammar' | 'style' | 'structure' | 'research' | 'citations';
    prompt: string;
    response: string;
    accepted: boolean;
    reflection?: string;
    timestamp: string;
  }>;
  estimatedReadingTime: number;
  isActivelyCollaborating: boolean;
  gradePercentage: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateSubmissionData {
  content?: string;
  title?: string;
  saveType?: 'auto' | 'manual';
  sessionDuration?: number;
}

export interface CreateCommentData {
  content: string;
  position?: {
    start: number;
    end: number;
  };
  type?: 'comment' | 'suggestion' | 'question' | 'approval';
}

// API functions
const submissionsAPI = {
  getUserSubmissions: async (filters?: { status?: string; assignment?: string }): Promise<AssignmentSubmission[]> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.assignment) params.append('assignment', filters.assignment);
    
    const response = await axios.get(`${API_BASE}/my-submissions?${params}`);
    return response.data.data;
  },

  getById: async (submissionId: string): Promise<AssignmentSubmission> => {
    const response = await axios.get(`${API_BASE}/${submissionId}`);
    return response.data.data;
  },

  updateContent: async (submissionId: string, data: UpdateSubmissionData): Promise<{
    submission: AssignmentSubmission;
    versionCreated: boolean;
    currentVersion: number;
    diff: Record<string, unknown>;
  }> => {
    const response = await axios.put(`${API_BASE}/${submissionId}/content`, data);
    return response.data.data;
  },

  addComment: async (submissionId: string, data: CreateCommentData): Promise<AssignmentSubmission> => {
    const response = await axios.post(`${API_BASE}/${submissionId}/comments`, data);
    return response.data.data;
  },

  replyToComment: async (submissionId: string, commentId: string, content: string): Promise<AssignmentSubmission> => {
    const response = await axios.post(`${API_BASE}/${submissionId}/comments/${commentId}/reply`, { content });
    return response.data.data;
  },

  resolveComment: async (submissionId: string, commentId: string): Promise<AssignmentSubmission> => {
    const response = await axios.patch(`${API_BASE}/${submissionId}/comments/${commentId}/resolve`);
    return response.data.data;
  },

  addCollaborator: async (submissionId: string, collaboratorId: string): Promise<AssignmentSubmission> => {
    const response = await axios.post(`${API_BASE}/${submissionId}/collaborators`, { collaboratorId });
    return response.data.data;
  },

  submitForGrading: async (submissionId: string): Promise<AssignmentSubmission> => {
    const response = await axios.patch(`${API_BASE}/${submissionId}/submit`);
    return response.data.data;
  },

  getVersions: async (submissionId: string, limit?: number) => {
    const params = limit ? `?limit=${limit}` : '';
    const response = await axios.get(`http://localhost:5001/api/documents/${submissionId}/versions${params}`);
    return response.data.data;
  }
};

// Custom hooks
export const useUserSubmissions = (filters?: { status?: string; assignment?: string }) => {
  return useQuery({
    queryKey: ['userSubmissions', filters],
    queryFn: () => submissionsAPI.getUserSubmissions(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useSubmission = (submissionId: string) => {
  return useQuery({
    queryKey: ['submission', submissionId],
    queryFn: () => submissionsAPI.getById(submissionId),
    enabled: !!submissionId,
    staleTime: 30 * 1000, // 30 seconds for real-time collaboration
  });
};

export const useUpdateSubmission = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ submissionId, data }: { submissionId: string; data: UpdateSubmissionData }) =>
      submissionsAPI.updateContent(submissionId, data),
    onSuccess: (_, { submissionId }) => {
      queryClient.invalidateQueries({ queryKey: ['submission', submissionId] });
      queryClient.invalidateQueries({ queryKey: ['userSubmissions'] });
    }
  });
};

export const useAddComment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ submissionId, data }: { submissionId: string; data: CreateCommentData }) =>
      submissionsAPI.addComment(submissionId, data),
    onSuccess: (_, { submissionId }) => {
      queryClient.invalidateQueries({ queryKey: ['submission', submissionId] });
    }
  });
};

export const useReplyToComment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ submissionId, commentId, content }: { 
      submissionId: string; 
      commentId: string; 
      content: string 
    }) => submissionsAPI.replyToComment(submissionId, commentId, content),
    onSuccess: (_, { submissionId }) => {
      queryClient.invalidateQueries({ queryKey: ['submission', submissionId] });
    }
  });
};

export const useResolveComment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ submissionId, commentId }: { submissionId: string; commentId: string }) =>
      submissionsAPI.resolveComment(submissionId, commentId),
    onSuccess: (_, { submissionId }) => {
      queryClient.invalidateQueries({ queryKey: ['submission', submissionId] });
    }
  });
};

export const useAddCollaborator = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ submissionId, collaboratorId }: { submissionId: string; collaboratorId: string }) =>
      submissionsAPI.addCollaborator(submissionId, collaboratorId),
    onSuccess: (_, { submissionId }) => {
      queryClient.invalidateQueries({ queryKey: ['submission', submissionId] });
    }
  });
};

export const useSubmitForGrading = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: submissionsAPI.submitForGrading,
    onSuccess: (_, submissionId) => {
      queryClient.invalidateQueries({ queryKey: ['submission', submissionId] });
      queryClient.invalidateQueries({ queryKey: ['userSubmissions'] });
    }
  });
};

export const useSubmissionVersions = (submissionId: string, limit?: number) => {
  return useQuery({
    queryKey: ['submissionVersions', submissionId, limit],
    queryFn: () => submissionsAPI.getVersions(submissionId, limit),
    enabled: !!submissionId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};