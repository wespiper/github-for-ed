import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { type Assignment, type CreateAssignmentInput } from '@shared/types';

const API_BASE = 'http://localhost:5001/api/assignments';

// API functions
const assignmentsAPI = {
  create: async (data: CreateAssignmentInput): Promise<Assignment> => {
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

  update: async (assignmentId: string, data: Partial<CreateAssignmentInput>): Promise<Assignment> => {
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
    mutationFn: ({ assignmentId, data }: { assignmentId: string; data: Partial<CreateAssignmentInput> }) =>
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