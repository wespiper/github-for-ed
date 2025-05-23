import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { type User } from '@/types/auth';
import { useAuthStore } from '@/stores/authStore';

const adminApi = {
  toggleMyRole: async (): Promise<{ user: User; message: string }> => {
    const response = await api.post('/admin/toggle-my-role');
    return response.data;
  },
  
  getAllUsers: async (): Promise<{ users: User[] }> => {
    const response = await api.get('/admin/users');
    return response.data;
  },
  
  switchUserRole: async (userId: string, newRole: 'student' | 'educator'): Promise<{ user: User; message: string }> => {
    const response = await api.post('/admin/switch-role', { userId, newRole });
    return response.data;
  },
};

export const useAdmin = () => {
  const { user, updateUser } = useAuthStore();
  const queryClient = useQueryClient();

  const toggleRoleMutation = useMutation({
    mutationFn: adminApi.toggleMyRole,
    onSuccess: (data) => {
      // Update the user in the auth store
      updateUser(data.user);
      // Invalidate queries that depend on user role
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });

  const getAllUsersQuery = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: adminApi.getAllUsers,
    enabled: user?.role === 'admin',
  });

  const switchUserRoleMutation = useMutation({
    mutationFn: ({ userId, newRole }: { userId: string; newRole: 'student' | 'educator' }) =>
      adminApi.switchUserRole(userId, newRole),
    onSuccess: () => {
      // Refetch the users list
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });

  return {
    // State
    isAdmin: user?.role === 'admin',
    
    // Toggle current user's role
    toggleMyRole: toggleRoleMutation.mutateAsync,
    isTogglingRole: toggleRoleMutation.isPending,
    toggleError: toggleRoleMutation.error,
    
    // Get all users (admin only)
    users: getAllUsersQuery.data?.users || [],
    isLoadingUsers: getAllUsersQuery.isLoading,
    usersError: getAllUsersQuery.error,
    
    // Switch other user's role (admin only)
    switchUserRole: switchUserRoleMutation.mutateAsync,
    isSwitchingRole: switchUserRoleMutation.isPending,
    switchError: switchUserRoleMutation.error,
  };
};