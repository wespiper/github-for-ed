import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { CreateCourseModal } from '@/components/courses/CreateCourseModal';
import { CreateAssignmentModal } from '@/components/assignments/CreateAssignmentModal';

export const Dashboard = () => {
  const { user } = useAuth();
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [showCreateAssignment, setShowCreateAssignment] = useState(false);

  if (!user) return null;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {user.firstName}!
        </h1>
        <p className="text-gray-600 mt-2">
          {user.role === 'educator' 
            ? 'Manage your courses and track student progress.' 
            : 'Continue your writing journey and explore new courses.'}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {user.role === 'educator' ? (
          <>
            <div className="bg-white p-6 rounded-lg shadow border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-700">Total Courses</h3>
                <div className="h-4 w-4 bg-blue-100 rounded"></div>
              </div>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-gray-500 mt-1">
                No courses created yet
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-700">Active Students</h3>
                <div className="h-4 w-4 bg-green-100 rounded"></div>
              </div>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-gray-500 mt-1">
                Students enrolled
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-700">Pending Reviews</h3>
                <div className="h-4 w-4 bg-orange-100 rounded"></div>
              </div>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-gray-500 mt-1">
                Assignments to review
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="bg-white p-6 rounded-lg shadow border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-700">Enrolled Courses</h3>
                <div className="h-4 w-4 bg-blue-100 rounded"></div>
              </div>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-gray-500 mt-1">
                Active enrollments
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-700">Assignments</h3>
                <div className="h-4 w-4 bg-orange-100 rounded"></div>
              </div>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-gray-500 mt-1">
                Due this week
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-700">Writing Score</h3>
                <div className="h-4 w-4 bg-purple-100 rounded"></div>
              </div>
              <div className="text-2xl font-bold">--</div>
              <p className="text-xs text-gray-500 mt-1">
                Complete assignments to see score
              </p>
            </div>
          </>
        )}
      </div>

      <div className="mt-8">
        <div className="bg-white p-6 rounded-lg shadow border">
          <h2 className="text-xl font-semibold mb-2">Quick Actions</h2>
          <p className="text-gray-600 mb-4">
            {user.role === 'educator' 
              ? 'Get started by creating your first course or assignment.'
              : 'Explore available courses or continue working on your assignments.'}
          </p>
          <div className="flex gap-4">
            {user.role === 'educator' ? (
              <>
                <button 
                  onClick={() => setShowCreateCourse(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                >
                  <span>+</span>
                  Create Course
                </button>
                <button 
                  onClick={() => setShowCreateAssignment(true)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex items-center gap-2"
                >
                  <span>📝</span>
                  Create Assignment
                </button>
              </>
            ) : (
              <>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2">
                  <span>📚</span>
                  Browse Courses
                </button>
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex items-center gap-2">
                  <span>✏️</span>
                  Continue Writing
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateCourseModal 
        isOpen={showCreateCourse} 
        onClose={() => setShowCreateCourse(false)} 
      />
      <CreateAssignmentModal 
        isOpen={showCreateAssignment} 
        onClose={() => setShowCreateAssignment(false)} 
      />
    </div>
  );
};