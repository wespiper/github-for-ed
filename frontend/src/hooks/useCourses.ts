import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { type Course, type CreateCourseInput } from '@shared/types';

// Re-export for backward compatibility
export type CreateCourseData = CreateCourseInput;

export const useCourses = () => {
  return useQuery({
    queryKey: ['courses'],
    queryFn: async (): Promise<Course[]> => {
      const response = await api.get('/courses');
      return response.data.data || response.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get courses for current user (based on role)
export const useMyCourses = () => {
  return useQuery({
    queryKey: ['courses', 'my-courses'],
    queryFn: async (): Promise<Course[]> => {
      const response = await api.get('/courses/my-courses');
      return response.data.data || response.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreateCourse = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (courseData: CreateCourseData): Promise<Course> => {
      const response = await api.post('/courses', courseData);
      return response.data.data || response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    }
  });
};

export const useUpdateCourse = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ courseId, ...courseData }: { courseId: string } & Partial<CreateCourseData>): Promise<Course> => {
      const response = await api.put(`/courses/${courseId}`, courseData);
      return response.data.data || response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    }
  });
};

export const useDeleteCourse = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (courseId: string): Promise<void> => {
      await api.delete(`/courses/${courseId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    }
  });
};

export const useCourse = (courseId?: string) => {
  return useQuery({
    queryKey: ['courses', courseId],
    queryFn: async (): Promise<Course> => {
      const response = await api.get(`/courses/${courseId}`);
      return response.data.data || response.data;
    },
    enabled: !!courseId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};