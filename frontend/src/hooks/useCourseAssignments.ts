import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { type CourseAssignment } from '@shared/types';

export interface DeployTemplateData {
  templateId: string;
  courseId: string;
  dueDate?: string;
  customInstructions?: string;
  courseSpecificRequirements?: {
    minWords?: number;
    maxWords?: number;
    requiredSections?: string[];
    citationStyle?: 'APA' | 'MLA' | 'Chicago' | 'IEEE';
    allowedResources?: string[];
  };
  stageDueDates?: {
    stageId: string;
    dueDate: string;
  }[];
  allowLateSubmissions?: boolean;
  maxCollaborators?: number;
}

export interface UpdateCourseAssignmentData {
  dueDate?: string;
  customInstructions?: string;
  customNotes?: string;
  courseSpecificRequirements?: {
    minWords?: number;
    maxWords?: number;
    requiredSections?: string[];
    citationStyle?: 'APA' | 'MLA' | 'Chicago' | 'IEEE';
    allowedResources?: string[];
  };
  stageDueDates?: {
    stageId: string;
    dueDate: string;
  }[];
  allowLateSubmissions?: boolean;
  maxCollaborators?: number;
}

// API functions
const courseAssignmentsAPI = {
  // Deploy template to course
  deploy: async (data: DeployTemplateData): Promise<CourseAssignment> => {
    const response = await api.post('/course-assignments/deploy', data);
    return response.data.data;
  },

  // Get my course assignments
  getMyAssignments: async (filters?: { 
    status?: string; 
    course?: string; 
  }): Promise<CourseAssignment[]> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.course) params.append('course', filters.course);
    
    const response = await api.get(`/course-assignments/my-assignments?${params}`);
    return response.data.data;
  },

  // Get assignments for a specific course
  getByCourse: async (courseId: string, filters?: { 
    status?: string; 
  }): Promise<CourseAssignment[]> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    
    const response = await api.get(`/course-assignments/course/${courseId}?${params}`);
    return response.data.data;
  },

  // Get assignment by ID
  getById: async (assignmentId: string): Promise<CourseAssignment> => {
    const response = await api.get(`/course-assignments/${assignmentId}`);
    return response.data.data;
  },

  // Update course assignment
  update: async (assignmentId: string, data: UpdateCourseAssignmentData): Promise<CourseAssignment> => {
    const response = await api.put(`/course-assignments/${assignmentId}`, data);
    return response.data.data;
  },

  // Publish assignment
  publish: async (assignmentId: string): Promise<CourseAssignment> => {
    const response = await api.patch(`/course-assignments/${assignmentId}/publish`);
    return response.data.data;
  },

  // Get upcoming assignments
  getUpcoming: async (courseId?: string): Promise<CourseAssignment[]> => {
    const params = new URLSearchParams();
    if (courseId) params.append('course', courseId);
    
    const response = await api.get(`/course-assignments/upcoming/all?${params}`);
    return response.data.data;
  },

  // Get assignments due soon
  getDueSoon: async (days?: number, courseId?: string): Promise<CourseAssignment[]> => {
    const params = new URLSearchParams();
    if (days) params.append('days', days.toString());
    if (courseId) params.append('course', courseId);
    
    const response = await api.get(`/course-assignments/due-soon/all?${params}`);
    return response.data.data;
  },

  // Create submission
  createSubmission: async (assignmentId: string, data: { 
    title?: string; 
    isCollaborative?: boolean; 
  }) => {
    const response = await api.post(`/course-assignments/${assignmentId}/submit`, data);
    return response.data.data;
  },

  // Archive assignment
  archive: async (assignmentId: string): Promise<CourseAssignment> => {
    const response = await api.patch(`/course-assignments/${assignmentId}/archive`);
    return response.data.data;
  },

  // Delete assignment
  delete: async (assignmentId: string): Promise<void> => {
    await api.delete(`/course-assignments/${assignmentId}`);
  }
};

// Custom hooks

// Deploy template to course
export const useDeployTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: courseAssignmentsAPI.deploy,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['assignment-templates'] }); // Update usage counts
    }
  });
};

// Get my course assignments
export const useMyCourseAssignments = (filters?: { 
  status?: string; 
  course?: string; 
}) => {
  return useQuery({
    queryKey: ['course-assignments', 'my-assignments', filters],
    queryFn: () => courseAssignmentsAPI.getMyAssignments(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get assignments for a specific course
export const useCourseAssignments = (courseId: string, filters?: { 
  status?: string; 
}) => {
  return useQuery({
    queryKey: ['course-assignments', 'course', courseId, filters],
    queryFn: () => courseAssignmentsAPI.getByCourse(courseId, filters),
    enabled: !!courseId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get course assignment by ID
export const useCourseAssignment = (assignmentId: string) => {
  return useQuery({
    queryKey: ['course-assignments', assignmentId],
    queryFn: () => courseAssignmentsAPI.getById(assignmentId),
    enabled: !!assignmentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Update course assignment
export const useUpdateCourseAssignment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ assignmentId, data }: { assignmentId: string; data: UpdateCourseAssignmentData }) =>
      courseAssignmentsAPI.update(assignmentId, data),
    onSuccess: (updatedAssignment) => {
      queryClient.invalidateQueries({ queryKey: ['course-assignments'] });
      queryClient.setQueryData(['course-assignments', updatedAssignment.id], updatedAssignment);
    }
  });
};

// Publish course assignment
export const usePublishCourseAssignment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: courseAssignmentsAPI.publish,
    onSuccess: (publishedAssignment) => {
      queryClient.invalidateQueries({ queryKey: ['course-assignments'] });
      queryClient.setQueryData(['course-assignments', publishedAssignment.id], publishedAssignment);
    }
  });
};

// Get upcoming assignments
export const useUpcomingAssignments = (courseId?: string) => {
  return useQuery({
    queryKey: ['course-assignments', 'upcoming', courseId],
    queryFn: () => courseAssignmentsAPI.getUpcoming(courseId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get assignments due soon
export const useAssignmentsDueSoon = (days: number = 7, courseId?: string) => {
  return useQuery({
    queryKey: ['course-assignments', 'due-soon', days, courseId],
    queryFn: () => courseAssignmentsAPI.getDueSoon(days, courseId),
    staleTime: 2 * 60 * 1000, // 2 minutes (more frequent for due dates)
  });
};

// Create submission
export const useCreateSubmission = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ assignmentId, data }: { 
      assignmentId: string; 
      data: { title?: string; isCollaborative?: boolean } 
    }) => courseAssignmentsAPI.createSubmission(assignmentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      queryClient.invalidateQueries({ queryKey: ['course-assignments'] }); // Update submission counts
    }
  });
};

// Archive course assignment
export const useArchiveCourseAssignment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: courseAssignmentsAPI.archive,
    onSuccess: (archivedAssignment) => {
      queryClient.invalidateQueries({ queryKey: ['course-assignments'] });
      queryClient.setQueryData(['course-assignments', archivedAssignment.id], archivedAssignment);
    }
  });
};

// Delete course assignment
export const useDeleteCourseAssignment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: courseAssignmentsAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-assignments'] });
    }
  });
};