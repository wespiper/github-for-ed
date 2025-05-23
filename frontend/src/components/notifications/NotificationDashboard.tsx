import { useState, useEffect } from 'react';
import { 
  Bell, 
  AlertTriangle, 
  TrendingUp, 
  Filter,
  Search,
  RefreshCw,
  BarChart3,
  Users
} from 'lucide-react';
import { useNotifications, type InterventionSummary } from '@/hooks/useNotifications';
import { useCourses } from '@/hooks/useCourses';
import { NotificationCard } from './NotificationCard';

export const NotificationDashboard = () => {
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterPriority, setFilterPriority] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [interventionSummary, setInterventionSummary] = useState<InterventionSummary | null>(null);

  const { data: courses } = useCourses();
  
  const {
    notifications,
    loading,
    unreadCount,
    pagination,
    fetchNotifications,
    markAsRead,
    deleteNotification,
    resolveIntervention,
    fetchInterventionSummary,
    analyzeCourse,
    clearError,
    error
  } = useNotifications();

  // Load notifications with filters
  useEffect(() => {
    const params: any = {
      page: currentPage,
      limit: 20
    };

    if (filterStatus) params.status = filterStatus;
    if (filterCategory) params.category = filterCategory;
    if (filterPriority) params.priority = filterPriority;
    if (searchTerm) params.search = searchTerm;

    fetchNotifications(params);
  }, [currentPage, filterStatus, filterCategory, filterPriority, searchTerm, fetchNotifications]);

  // Load intervention summary
  useEffect(() => {
    const loadSummary = async () => {
      const summary = await fetchInterventionSummary(selectedCourse || undefined);
      setInterventionSummary(summary);
    };
    loadSummary();
  }, [selectedCourse, fetchInterventionSummary]);

  const handleRunCourseAnalysis = async () => {
    if (selectedCourse) {
      await analyzeCourse(selectedCourse);
    }
  };

  const handleRefresh = () => {
    fetchNotifications({
      page: currentPage,
      limit: 20,
      status: filterStatus || undefined,
      category: filterCategory || undefined,
      priority: filterPriority || undefined
    });
  };

  const clearFilters = () => {
    setFilterStatus('');
    setFilterCategory('');
    setFilterPriority('');
    setSearchTerm('');
    setCurrentPage(1);
  };

  const filteredNotifications = notifications.filter(notification =>
    searchTerm === '' || 
    notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    notification.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Notification Dashboard</h1>
              <p className="mt-2 text-gray-600">Monitor student interventions and educational alerts</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                <span>Refresh</span>
              </button>
              {unreadCount > 0 && (
                <div className="flex items-center space-x-2 px-3 py-2 bg-red-100 text-red-800 rounded-md">
                  <Bell size={16} />
                  <span>{unreadCount} unread</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center space-x-2">
              <AlertTriangle size={16} className="text-red-600" />
              <span className="text-red-800">{error}</span>
              <button
                onClick={clearError}
                className="ml-auto text-red-600 hover:text-red-800"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Course Selection & Analysis */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Course Analysis</h2>
            {selectedCourse && (
              <button
                onClick={handleRunCourseAnalysis}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                <BarChart3 size={16} />
                <span>Run Analysis</span>
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Course for Analysis
              </label>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Courses</option>
                {courses?.map(course => (
                  <option key={course._id} value={course._id}>
                    {course.title} ({course.students.length} students)
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Intervention Summary */}
        {interventionSummary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Critical Interventions</p>
                  <p className="text-2xl font-semibold text-gray-900">{interventionSummary.criticalInterventions}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Bell className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Interventions</p>
                  <p className="text-2xl font-semibold text-gray-900">{interventionSummary.totalInterventions}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Users className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Students at Risk</p>
                  <p className="text-2xl font-semibold text-gray-900">{interventionSummary.studentsAtRisk}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Improving Trends</p>
                  <p className="text-2xl font-semibold text-gray-900">{interventionSummary.recentTrends.improving}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Common Issues */}
        {interventionSummary?.commonIssues.length && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Common Issues</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {interventionSummary.commonIssues.map((issue) => (
                <div key={issue.type} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {issue.type.replace(/_/g, ' ')}
                    </span>
                    <span className="text-lg font-semibold text-blue-600">{issue.count}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ 
                        width: `${(issue.count / interventionSummary.totalInterventions) * 100}%` 
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Filter size={20} className="text-gray-500" />
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
            <button
              onClick={clearFilters}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              Clear all
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search notifications..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="unread">Unread</option>
                <option value="read">Read</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                <option value="educational_intervention">Educational Intervention</option>
                <option value="assignment_management">Assignment Management</option>
                <option value="collaboration">Collaboration</option>
                <option value="general">General</option>
                <option value="system">System</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Notifications ({pagination.total})
              </h3>
              {filteredNotifications.length !== notifications.length && (
                <span className="text-sm text-gray-500">
                  Showing {filteredNotifications.length} of {notifications.length}
                </span>
              )}
            </div>
          </div>
          
          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading notifications...</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell size={48} className="mx-auto mb-4 text-gray-300" />
                <p className="text-gray-600">
                  {searchTerm || filterStatus || filterCategory || filterPriority 
                    ? 'No notifications match your filters'
                    : 'No notifications found'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredNotifications.map((notification) => (
                  <NotificationCard
                    key={notification._id}
                    notification={notification}
                    onMarkAsRead={markAsRead}
                    onDelete={deleteNotification}
                    onResolve={resolveIntervention}
                    expanded={false}
                    showActions={true}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {((currentPage - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(currentPage * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} notifications
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(pagination.pages, prev + 1))}
                    disabled={currentPage === pagination.pages}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};