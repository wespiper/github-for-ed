import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { RoleToggle } from '@/components/admin/RoleToggle';
import { NotificationBell } from '@/components/notifications/NotificationBell';

export const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();

  const getInitials = (firstName: string, lastName: string) => {
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
      <div className="container mx-auto flex h-14 items-center px-4">
        <div className="mr-4 flex">
          <Link to="/" className="mr-6 flex items-center space-x-2">
            <div className="h-6 w-6 bg-blue-600 rounded"></div>
            <span className="font-bold">GitHub for Writers</span>
          </Link>
        </div>
        
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          {isAuthenticated && user ? (
            <div className="flex items-center space-x-4">
              <nav className="flex items-center space-x-6">
                <Link
                  to="/dashboard"
                  className="text-sm font-medium transition-colors hover:text-blue-600"
                >
                  Dashboard
                </Link>
                {user.role === 'educator' && (
                  <Link
                    to="/courses"
                    className="text-sm font-medium transition-colors hover:text-blue-600"
                  >
                    Courses
                  </Link>
                )}
                {user.role === 'student' && (
                  <Link
                    to="/my-courses"
                    className="text-sm font-medium transition-colors hover:text-blue-600"
                  >
                    My Courses
                  </Link>
                )}
                {user.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="text-sm font-medium transition-colors hover:text-blue-600"
                  >
                    Admin
                  </Link>
                )}
              </nav>
              
              {/* Notifications */}
              <NotificationBell />
              
              {/* Admin Role Toggle */}
              <RoleToggle />
              
              <div className="relative">
                <button
                  onClick={logout}
                  className="flex items-center space-x-2 text-sm p-2 rounded-md hover:bg-gray-100"
                >
                  <div className="h-8 w-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium">
                    {getInitials(user.firstName, user.lastName)}
                  </div>
                  <span className="hidden md:block">
                    {user.firstName} {user.lastName}
                  </span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};