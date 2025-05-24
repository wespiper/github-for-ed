import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_BASE = 'http://localhost:5001/api/assignments';

// Types
export interface Assignment {
  _id: string;
  title: string;
  description: string;
  instructions: string;
  course: {
    _id: string;
    title: string;
  };
  instructor: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  type: 'individual' | 'collaborative' | 'peer-review';
  dueDate?: string;
  allowLateSubmissions: boolean;
  maxCollaborators?: number;
  requirements: {
    minWords?: number;
    maxWords?: number;
    requiredSections?: string[];
    citationStyle?: 'APA' | 'MLA' | 'Chicago' | 'IEEE';
    allowedResources?: string[];
  };
  collaboration: {
    enabled: boolean;
    allowRealTimeEditing: boolean;
    allowComments: boolean;
    allowSuggestions: boolean;
    requireApprovalForChanges: boolean;
  };
  versionControl: {
    autoSaveInterval: number;
    createVersionOnSubmit: boolean;
    allowVersionRevert: boolean;
    trackAllChanges: boolean;
  };
  learningObjectives: {
    id: string;
    description: string;
    category: 'knowledge' | 'comprehension' | 'application' | 'analysis' | 'synthesis' | 'evaluation';
    bloomsLevel: 1 | 2 | 3 | 4 | 5 | 6;
    assessmentCriteria: string[];
    weight: number;
  }[];
  writingStages: {
    id: string;
    name: string;
    description: string;
    order: number;
    required: boolean;
    minWords?: number;
    maxWords?: number;
    durationDays?: number;
    allowAI: boolean;
    aiAssistanceLevel: 'none' | 'minimal' | 'moderate' | 'comprehensive';
  }[];
  aiSettings: {
    enabled: boolean;
    globalBoundary: 'strict' | 'moderate' | 'permissive';
    allowedAssistanceTypes: ('grammar' | 'style' | 'structure' | 'research' | 'citations' | 'brainstorming' | 'outlining')[];
    requireReflection: boolean;
    reflectionPrompts: string[];
    stageSpecificSettings: {
      stageId: string;
      allowedTypes: string[];
      boundaryLevel: 'strict' | 'moderate' | 'permissive';
      customPrompts: string[];
    }[];
  };
  status: 'draft' | 'published' | 'in_progress' | 'completed' | 'archived';
  publishedAt?: string;
  grading: {
    enabled: boolean;
    totalPoints?: number;
    rubric?: {
      criteria: string;
      points: number;
      description: string;
    }[];
    allowPeerReview: boolean;
  };
  submissionCount: number;
  isOverdue: boolean;
  daysRemaining: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAssignmentData {
  title: string;
  description: string;
  instructions: string;
  courseId: string;
  type?: 'individual' | 'collaborative' | 'peer-review';
  dueDate?: string;
  requirements?: {
    minWords?: number;
    maxWords?: number;
    requiredSections?: string[];
    citationStyle?: 'APA' | 'MLA' | 'Chicago' | 'IEEE';
    allowedResources?: string[];
  };
  collaboration?: {
    enabled?: boolean;
    allowRealTimeEditing?: boolean;
    allowComments?: boolean;
    allowSuggestions?: boolean;
    requireApprovalForChanges?: boolean;
  };
  versionControl?: {
    autoSaveInterval?: number;
    createVersionOnSubmit?: boolean;
    allowVersionRevert?: boolean;
    trackAllChanges?: boolean;
  };
  learningObjectives?: {
    id: string;
    description: string;
    category: 'knowledge' | 'comprehension' | 'application' | 'analysis' | 'synthesis' | 'evaluation';
    bloomsLevel: 1 | 2 | 3 | 4 | 5 | 6;
    assessmentCriteria: string[];
    weight: number;
  }[];
  writingStages?: {
    id: string;
    name: string;
    description: string;
    order: number;
    required: boolean;
    minWords?: number;
    maxWords?: number;
    durationDays?: number;
    allowAI: boolean;
    aiAssistanceLevel: 'none' | 'minimal' | 'moderate' | 'comprehensive';
  }[];
  aiSettings?: {
    enabled?: boolean;
    globalBoundary?: 'strict' | 'moderate' | 'permissive';
    allowedAssistanceTypes?: ('grammar' | 'style' | 'structure' | 'research' | 'citations' | 'brainstorming' | 'outlining')[];
    requireReflection?: boolean;
    reflectionPrompts?: string[];
    stageSpecificSettings?: {
      stageId: string;
      allowedTypes: string[];
      boundaryLevel: 'strict' | 'moderate' | 'permissive';
      customPrompts: string[];
    }[];
  };
  grading?: {
    enabled?: boolean;
    totalPoints?: number;
    rubric?: {
      criteria: string;
      points: number;
      description: string;
    }[];
    allowPeerReview?: boolean;
  };
}

// API functions
const assignmentsAPI = {
  create: async (data: CreateAssignmentData): Promise<Assignment> => {
    const response = await axios.post(API_BASE, data);
    return response.data.data;
  },

  getByInstructor: async (): Promise<Assignment[]> => {
    const response = await axios.get(`${API_BASE}/my-assignments`);
    return response.data.data;
  },

  getByCourse: async (courseId: string, filters?: {
    status?: string;
    type?: string;
  }): Promise<Assignment[]> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.type) params.append('type', filters.type);
    
    const response = await axios.get(`${API_BASE}/course/${courseId}?${params}`);
    return response.data.data;
  },

  getById: async (assignmentId: string): Promise<Assignment> => {
    const response = await axios.get(`${API_BASE}/${assignmentId}`);
    return response.data.data;
  },

  update: async (assignmentId: string, data: Partial<CreateAssignmentData>): Promise<Assignment> => {
    const response = await axios.put(`${API_BASE}/${assignmentId}`, data);
    return response.data.data;
  },

  publish: async (assignmentId: string): Promise<Assignment> => {
    const response = await axios.patch(`${API_BASE}/${assignmentId}/publish`);
    return response.data.data;
  },

  createSubmission: async (assignmentId: string, data: { title?: string; isCollaborative?: boolean }) => {
    const response = await axios.post(`${API_BASE}/${assignmentId}/submit`, data);
    return response.data.data;
  },

  getSubmissions: async (assignmentId: string, filters?: { status?: string }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    
    const response = await axios.get(`${API_BASE}/${assignmentId}/submissions?${params}`);
    return response.data.data;
  },

  delete: async (assignmentId: string): Promise<void> => {
    await axios.delete(`${API_BASE}/${assignmentId}`);
  }
};

// Custom hooks
export const useCreateAssignment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: assignmentsAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['instructorAssignments'] });
    }
  });
};

export const useInstructorAssignments = (filters?: { status?: string; course?: string }) => {
  return useQuery({
    queryKey: ['instructorAssignments', filters],
    queryFn: assignmentsAPI.getByInstructor,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCourseAssignments = (courseId: string, filters?: {
  status?: string;
  type?: string;
}) => {
  return useQuery({
    queryKey: ['courseAssignments', courseId, filters],
    queryFn: () => assignmentsAPI.getByCourse(courseId, filters),
    enabled: !!courseId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useAssignment = (assignmentId: string) => {
  return useQuery({
    queryKey: ['assignment', assignmentId],
    queryFn: () => assignmentsAPI.getById(assignmentId),
    enabled: !!assignmentId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

export const useUpdateAssignment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ assignmentId, data }: { assignmentId: string; data: Partial<CreateAssignmentData> }) =>
      assignmentsAPI.update(assignmentId, data),
    onSuccess: (_, { assignmentId }) => {
      queryClient.invalidateQueries({ queryKey: ['assignment', assignmentId] });
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['instructorAssignments'] });
    }
  });
};

export const usePublishAssignment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: assignmentsAPI.publish,
    onSuccess: (_, assignmentId) => {
      queryClient.invalidateQueries({ queryKey: ['assignment', assignmentId] });
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['instructorAssignments'] });
    }
  });
};

export const useCreateSubmission = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ assignmentId, data }: { 
      assignmentId: string; 
      data: { title?: string; isCollaborative?: boolean } 
    }) => assignmentsAPI.createSubmission(assignmentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      queryClient.invalidateQueries({ queryKey: ['userSubmissions'] });
    }
  });
};

export const useAssignmentSubmissions = (assignmentId: string, filters?: { status?: string }) => {
  return useQuery({
    queryKey: ['assignmentSubmissions', assignmentId, filters],
    queryFn: () => assignmentsAPI.getSubmissions(assignmentId, filters),
    enabled: !!assignmentId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

export const useDeleteAssignment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: assignmentsAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['instructorAssignments'] });
    }
  });
};