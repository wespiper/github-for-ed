import { useState, useEffect } from "react";
import {
    Bell,
    AlertTriangle,
    TrendingUp,
    Filter,
    Search,
    RefreshCw,
    BarChart3,
    Users,
} from "lucide-react";
import {
    useNotifications,
    type InterventionSummary,
} from "@/hooks/useNotifications";
import { useCourses } from "@/hooks/useCourses";
import { NotificationCard } from "./NotificationCard";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export const NotificationDashboard = () => {
    const [selectedCourse, setSelectedCourse] = useState<string>("");
    const [filterStatus, setFilterStatus] = useState<string>("");
    const [filterCategory, setFilterCategory] = useState<string>("");
    const [filterPriority, setFilterPriority] = useState<string>("");
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [interventionSummary, setInterventionSummary] =
        useState<InterventionSummary | null>(null);

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
        error,
    } = useNotifications();

    // Load notifications with filters
    useEffect(() => {
        const params: Record<string, string | number> = {
            page: currentPage,
            limit: 20,
        };

        if (filterStatus) params.status = filterStatus;
        if (filterCategory) params.category = filterCategory;
        if (filterPriority) params.priority = filterPriority;
        if (searchTerm) params.search = searchTerm;

        fetchNotifications(params);
    }, [
        currentPage,
        filterStatus,
        filterCategory,
        filterPriority,
        searchTerm,
        fetchNotifications,
    ]);

    // Load intervention summary
    useEffect(() => {
        const loadSummary = async () => {
            const summary = await fetchInterventionSummary(
                selectedCourse || undefined
            );
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
            priority: filterPriority || undefined,
        });
    };

    const clearFilters = () => {
        setFilterStatus("");
        setFilterCategory("");
        setFilterPriority("");
        setSearchTerm("");
        setCurrentPage(1);
    };

    const filteredNotifications = notifications.filter(
        (notification) =>
            searchTerm === "" ||
            notification.title
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            notification.message
                .toLowerCase()
                .includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-ink-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-ink-900">
                                Notification Dashboard
                            </h1>
                            <p className="mt-2 text-ink-600">
                                Monitor student interventions and educational
                                alerts
                            </p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={handleRefresh}
                                disabled={loading}
                                className="flex items-center space-x-2 px-4 py-2 bg-scribe-600 text-white rounded-md hover:bg-scribe-700 disabled:opacity-50"
                            >
                                <RefreshCw
                                    size={16}
                                    className={loading ? "animate-spin" : ""}
                                />
                                <span>Refresh</span>
                            </button>
                            {unreadCount > 0 && (
                                <div className="flex items-center space-x-2 px-3 py-2 bg-ember-100 text-ember-800 rounded-md">
                                    <Bell size={16} />
                                    <span>{unreadCount} unread</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-ember-50 border border-ember-200 rounded-md">
                        <div className="flex items-center space-x-2">
                            <AlertTriangle
                                size={16}
                                className="text-ember-600"
                            />
                            <span className="text-ember-800">{error}</span>
                            <button
                                onClick={clearError}
                                className="ml-auto text-ember-600 hover:text-ember-800"
                            >
                                ×
                            </button>
                        </div>
                    </div>
                )}

                {/* Course Selection & Analysis */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-ink-900">
                            Course Analysis
                        </h2>
                        {selectedCourse && (
                            <button
                                onClick={handleRunCourseAnalysis}
                                className="flex items-center space-x-2 px-4 py-2 bg-branch-600 text-white rounded-md hover:bg-branch-700"
                            >
                                <BarChart3 size={16} />
                                <span>Run Analysis</span>
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-ink-700 mb-2">
                                Select Course for Analysis
                            </label>
                            <Select
                                value={selectedCourse}
                                onValueChange={setSelectedCourse}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All Courses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">
                                        All Courses
                                    </SelectItem>
                                    {courses?.map((course) => (
                                        <SelectItem
                                            key={course._id}
                                            value={course._id}
                                        >
                                            {course.title} (
                                            {course.students.length} students)
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* Intervention Summary */}
                {interventionSummary && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <div className="flex items-center">
                                <div className="p-2 bg-ember-100 rounded-lg">
                                    <AlertTriangle className="w-6 h-6 text-ember-600" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-ink-500">
                                        Critical Interventions
                                    </p>
                                    <p className="text-2xl font-semibold text-ink-900">
                                        {
                                            interventionSummary.criticalInterventions
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <div className="flex items-center">
                                <div className="p-2 bg-orange-100 rounded-lg">
                                    <Bell className="w-6 h-6 text-orange-600" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-ink-500">
                                        Total Interventions
                                    </p>
                                    <p className="text-2xl font-semibold text-ink-900">
                                        {interventionSummary.totalInterventions}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <div className="flex items-center">
                                <div className="p-2 bg-highlight-100 rounded-lg">
                                    <Users className="w-6 h-6 text-highlight-600" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-ink-500">
                                        Students at Risk
                                    </p>
                                    <p className="text-2xl font-semibold text-ink-900">
                                        {interventionSummary.studentsAtRisk}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <div className="flex items-center">
                                <div className="p-2 bg-scribe-100 rounded-lg">
                                    <TrendingUp className="w-6 h-6 text-scribe-600" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-ink-500">
                                        Improving Trends
                                    </p>
                                    <p className="text-2xl font-semibold text-ink-900">
                                        {
                                            interventionSummary.recentTrends
                                                .improving
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Common Issues */}
                {interventionSummary?.commonIssues.length && (
                    <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                        <h3 className="text-lg font-semibold text-ink-900 mb-4">
                            Most Common Issues
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {interventionSummary.commonIssues.map((issue) => (
                                <div
                                    key={issue.type}
                                    className="border rounded-lg p-4"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-ink-900 capitalize">
                                            {issue.type.replace(/_/g, " ")}
                                        </span>
                                        <span className="text-lg font-semibold text-scribe-600">
                                            {issue.count}
                                        </span>
                                    </div>
                                    <div className="w-full bg-ink-200 rounded-full h-2">
                                        <div
                                            className="bg-scribe-600 h-2 rounded-full"
                                            style={{
                                                width: `${
                                                    (issue.count /
                                                        interventionSummary.totalInterventions) *
                                                    100
                                                }%`,
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
                        <Filter size={20} className="text-ink-500" />
                        <h3 className="text-lg font-semibold text-ink-900">
                            Filters
                        </h3>
                        <button
                            onClick={clearFilters}
                            className="text-scribe-600 hover:text-scribe-800 text-sm"
                        >
                            Clear all
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-ink-700 mb-1">
                                Search
                            </label>
                            <div className="relative">
                                <Search
                                    size={16}
                                    className="absolute left-3 top-3 text-ink-400"
                                />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) =>
                                        setSearchTerm(e.target.value)
                                    }
                                    placeholder="Search notifications..."
                                    className="w-full pl-10 pr-3 py-2 border border-ink-300 rounded-md focus:outline-none focus:ring-2 focus:ring-scribe-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-ink-700 mb-1">
                                Status
                            </label>
                            <Select
                                value={filterStatus}
                                onValueChange={setFilterStatus}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">All Status</SelectItem>
                                    <SelectItem value="unread">
                                        Unread
                                    </SelectItem>
                                    <SelectItem value="read">Read</SelectItem>
                                    <SelectItem value="resolved">
                                        Resolved
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-ink-700 mb-1">
                                Category
                            </label>
                            <Select
                                value={filterCategory}
                                onValueChange={setFilterCategory}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All Categories" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">
                                        All Categories
                                    </SelectItem>
                                    <SelectItem value="educational_intervention">
                                        Educational Intervention
                                    </SelectItem>
                                    <SelectItem value="assignment_management">
                                        Assignment Management
                                    </SelectItem>
                                    <SelectItem value="collaboration">
                                        Collaboration
                                    </SelectItem>
                                    <SelectItem value="general">
                                        General
                                    </SelectItem>
                                    <SelectItem value="system">
                                        System
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-ink-700 mb-1">
                                Priority
                            </label>
                            <Select
                                value={filterPriority}
                                onValueChange={setFilterPriority}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All Priorities" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">
                                        All Priorities
                                    </SelectItem>
                                    <SelectItem value="urgent">
                                        Urgent
                                    </SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="medium">
                                        Medium
                                    </SelectItem>
                                    <SelectItem value="low">Low</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* Notifications List */}
                <div className="bg-white rounded-lg shadow-sm">
                    <div className="px-6 py-4 border-b border-ink-200">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-ink-900">
                                Notifications ({pagination.total})
                            </h3>
                            {filteredNotifications.length !==
                                notifications.length && (
                                <span className="text-sm text-ink-500">
                                    Showing {filteredNotifications.length} of{" "}
                                    {notifications.length}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="p-6">
                        {loading ? (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-scribe-600 mx-auto"></div>
                                <p className="mt-2 text-ink-600">
                                    Loading notifications...
                                </p>
                            </div>
                        ) : filteredNotifications.length === 0 ? (
                            <div className="text-center py-8">
                                <Bell
                                    size={48}
                                    className="mx-auto mb-4 text-ink-300"
                                />
                                <p className="text-ink-600">
                                    {searchTerm ||
                                    filterStatus ||
                                    filterCategory ||
                                    filterPriority
                                        ? "No notifications match your filters"
                                        : "No notifications found"}
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
                        <div className="px-6 py-4 border-t border-ink-200">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-ink-700">
                                    Showing{" "}
                                    {(currentPage - 1) * pagination.limit + 1}{" "}
                                    to{" "}
                                    {Math.min(
                                        currentPage * pagination.limit,
                                        pagination.total
                                    )}{" "}
                                    of {pagination.total} notifications
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() =>
                                            setCurrentPage((prev) =>
                                                Math.max(1, prev - 1)
                                            )
                                        }
                                        disabled={currentPage === 1}
                                        className="px-3 py-2 border border-ink-300 rounded-md text-sm font-medium text-ink-700 hover:bg-ink-50 disabled:opacity-50"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() =>
                                            setCurrentPage((prev) =>
                                                Math.min(
                                                    pagination.pages,
                                                    prev + 1
                                                )
                                            )
                                        }
                                        disabled={
                                            currentPage === pagination.pages
                                        }
                                        className="px-3 py-2 border border-ink-300 rounded-md text-sm font-medium text-ink-700 hover:bg-ink-50 disabled:opacity-50"
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
