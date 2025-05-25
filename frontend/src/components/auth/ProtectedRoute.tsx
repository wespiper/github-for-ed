import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'student' | 'educator' | 'admin';
  allowedRoles?: ('student' | 'educator' | 'admin')[];
}

export const ProtectedRoute = ({ children, requiredRole, allowedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Admin users can access everything unless explicitly restricted
  const isAdmin = user?.role === 'admin';
  
  // Check role requirements
  if (requiredRole || allowedRoles) {
    const hasRequiredRole = requiredRole ? user?.role === requiredRole : false;
    const hasAllowedRole = allowedRoles ? allowedRoles.includes(user?.role as 'student' | 'educator' | 'admin') : false;
    
    if (!hasRequiredRole && !hasAllowedRole && !isAdmin) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
};