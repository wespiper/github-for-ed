import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Layout } from '@/components/layout/Layout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import SimpleErrorBoundary from '@/components/SimpleErrorBoundary';
import { Landing } from '@/pages/Landing';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { Dashboard } from '@/pages/Dashboard';
import { CreateCourse } from '@/pages/CreateCourse';
import { CreateAssignmentPage } from '@/pages/CreateAssignmentPage';
import { CreateTemplatePage } from '@/pages/CreateTemplatePage';
import { TemplateLibraryPage } from '@/pages/TemplateLibraryPage';
import { DeployTemplatePage } from '@/pages/DeployTemplatePage';
import { EditorTestPage } from '@/components/editor/EditorTestPage';
import { useAuthStore } from '@/stores/authStore';

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <SimpleErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router>
          <Layout>
          <Routes>
            <Route 
              path="/" 
              element={isAuthenticated ? <Navigate to="/dashboard" /> : <Landing />} 
            />
            <Route 
              path="/login" 
              element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginForm />} 
            />
            <Route 
              path="/register" 
              element={isAuthenticated ? <Navigate to="/dashboard" /> : <RegisterForm />} 
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/courses/create"
              element={
                <ProtectedRoute>
                  <CreateCourse />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assignments/create"
              element={
                <ProtectedRoute>
                  <CreateAssignmentPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/templates"
              element={
                <ProtectedRoute>
                  <TemplateLibraryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/templates/create"
              element={
                <ProtectedRoute>
                  <CreateTemplatePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/templates/:templateId/deploy"
              element={
                <ProtectedRoute>
                  <DeployTemplatePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/editor-test"
              element={<EditorTestPage />}
            />
            <Route path="/unauthorized" element={<div className="container mx-auto py-8"><h1 className="text-2xl font-bold">Unauthorized Access</h1><p>You don't have permission to access this page.</p></div>} />
            <Route path="*" element={<div className="container mx-auto py-8"><h1 className="text-2xl font-bold">Page Not Found</h1><p>The page you're looking for doesn't exist.</p></div>} />
          </Routes>
        </Layout>
      </Router>
    </QueryClientProvider>
    </SimpleErrorBoundary>
  );
}

export default App;