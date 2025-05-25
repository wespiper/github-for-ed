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
import { AssignmentWorkspace } from '@/components/assignments/AssignmentWorkspace';
import { ContinueWritingPage } from '@/pages/ContinueWritingPage';
import { CourseBrowsePage } from '@/pages/CourseBrowsePage';
import { CourseDetailPage } from '@/pages/CourseDetailPage';
import { CourseAssignmentsPage } from '@/pages/CourseAssignmentsPage';
import { AssignmentDetailPage } from '@/pages/AssignmentDetailPage';
import { TemplateDetailPage } from '@/pages/TemplateDetailPage';
import { EditTemplatePage } from '@/pages/EditTemplatePage';
import { MyCoursesPage } from '@/pages/MyCoursesPage';
import { AdminDashboard } from '@/pages/AdminDashboard';
import { StudentAssignmentBrowsePage } from '@/pages/StudentAssignmentBrowsePage';
import { useAuthStore } from '@/stores/authStore';

function App() {
  const { isAuthenticated, isHydrated } = useAuthStore();

  // Show loading screen until auth state is hydrated
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-ink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-scribe-600 mx-auto mb-4"></div>
          <p className="text-ink-600">Loading...</p>
        </div>
      </div>
    );
  }

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
                <ProtectedRoute requiredRole="educator">
                  <CreateCourse />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assignments/create"
              element={
                <ProtectedRoute requiredRole="educator">
                  <CreateAssignmentPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/templates"
              element={
                <ProtectedRoute requiredRole="educator">
                  <TemplateLibraryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/templates/create"
              element={
                <ProtectedRoute requiredRole="educator">
                  <CreateTemplatePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/templates/:templateId/deploy"
              element={
                <ProtectedRoute requiredRole="educator">
                  <DeployTemplatePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/writing/assignment/:assignmentId/submission/:submissionId"
              element={
                <ProtectedRoute requiredRole="student">
                  <AssignmentWorkspace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/writing/continue"
              element={
                <ProtectedRoute requiredRole="student">
                  <ContinueWritingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/courses/browse"
              element={
                <ProtectedRoute requiredRole="student">
                  <CourseBrowsePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/courses/:courseId"
              element={
                <ProtectedRoute allowedRoles={['student', 'educator']}>
                  <CourseDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/courses/:courseId/assignments"
              element={
                <ProtectedRoute allowedRoles={['student', 'educator']}>
                  <CourseAssignmentsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assignments/:assignmentId"
              element={
                <ProtectedRoute allowedRoles={['student', 'educator']}>
                  <AssignmentDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/templates/:templateId"
              element={
                <ProtectedRoute>
                  <TemplateDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/templates/:templateId/edit"
              element={
                <ProtectedRoute requiredRole="educator">
                  <EditTemplatePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-courses"
              element={
                <ProtectedRoute>
                  <MyCoursesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assignments"
              element={
                <ProtectedRoute requiredRole="student">
                  <StudentAssignmentBrowsePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
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