import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { type AuthResponse, type LoginInput, type RegisterInput, type User } from '@shared/types';
import { useAuthStore } from '@/stores/authStore';

const authApi = {
  register: async (data: RegisterInput): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },
  
  login: async (data: LoginInput): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },
  
  getProfile: async (): Promise<{ user: User }> => {
    const response = await api.get('/auth/profile');
    return response.data;
  },
  
  updateProfile: async (data: Partial<User>): Promise<{ user: User }> => {
    const response = await api.put('/auth/profile', data);
    return response.data;
  },
};

export const useAuth = () => {
  const { login: setAuth, logout: clearAuth, user, isAuthenticated, isHydrated } = useAuthStore();
  const queryClient = useQueryClient();

  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      setAuth(data.user, data.token);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setAuth(data.user, data.token);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: authApi.getProfile,
    enabled: isAuthenticated && isHydrated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Don't retry on auth errors
  });

  // Handle profile query errors
  if (profileQuery.error && isAuthenticated) {
    clearAuth();
  }

  const updateProfileMutation = useMutation({
    mutationFn: authApi.updateProfile,
    onSuccess: (data) => {
      queryClient.setQueryData(['profile'], data);
    },
  });

  const logout = () => {
    clearAuth();
    queryClient.removeQueries({ queryKey: ['profile'] });
    queryClient.clear();
  };

  return {
    // State
    user,
    isAuthenticated,
    isLoading: registerMutation.isPending || loginMutation.isPending,
    profileLoading: profileQuery.isLoading,
    
    // Mutations
    register: registerMutation.mutateAsync,
    login: loginMutation.mutateAsync,
    updateProfile: updateProfileMutation.mutateAsync,
    logout,
    
    // Errors
    registerError: registerMutation.error,
    loginError: loginMutation.error,
    profileError: profileQuery.error,
    updateError: updateProfileMutation.error,
  };
};