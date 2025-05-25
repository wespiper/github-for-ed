import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Course {
  _id: string;
  title: string;
  description?: string;
  instructor: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  students: Array<{
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCourseData {
  title: string;
  description: string;
  subject?: string;
}

export const useCourses = () => {
  return useQuery({
    queryKey: ['courses'],
    queryFn: async (): Promise<Course[]> => {
      const response = await api.get('/courses');
      return response.data.data || [];
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
      return response.data.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreateCourse = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (courseData: CreateCourseData) => {
      const response = await api.post('/courses', courseData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    }
  });
};