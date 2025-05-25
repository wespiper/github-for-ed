import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useMyCourses } from "@/hooks/useCourses";
import { useMyCourseAssignments } from "@/hooks/useCourseAssignments";
import { useUserSubmissions } from "@/hooks/useSubmissions";
import { BookOpen, FileText, Clock, Search, Filter, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AssignmentFilter = 'all' | 'available' | 'in-progress' | 'completed' | 'overdue';

export const StudentAssignmentBrowsePage = () => {
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState<AssignmentFilter>('available');
    
    const { data: myCourses } = useMyCourses();
    const { data: assignments, isLoading: assignmentsLoading } = useMyCourseAssignments({ status: 'published' });
    const { data: submissions } = useUserSubmissions();

    if (!user) return null;

    // Create a map of assignment IDs to submissions for quick lookup
    const submissionMap = new Map(submissions?.map(sub => [sub.assignment?._id, sub]) || []);

    // Filter assignments based on search and status
    const filteredAssignments = assignments?.filter(assignment => {
        const hasSubmission = submissionMap.has(assignment._id);
        const submission = submissionMap.get(assignment._id);
        const isOverdue = assignment.dueDate && new Date(assignment.dueDate) < new Date();
        
        // Search filter
        const matchesSearch = searchQuery === "" || 
            assignment.template?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            assignment.course?.title?.toLowerCase().includes(searchQuery.toLowerCase());
        
        if (!matchesSearch) return false;

        // Status filter
        switch (activeFilter) {
            case 'all':
                return true;
            case 'available':
                return !hasSubmission && !isOverdue;
            case 'in-progress':
                return hasSubmission && submission?.status !== 'submitted';
            case 'completed':
                return hasSubmission && submission?.status === 'submitted';
            case 'overdue':
                return isOverdue && (!hasSubmission || submission?.status !== 'submitted');
            default:
                return true;
        }
    }) || [];

    const getAssignmentStatus = (assignment: any) => {
        const submission = submissionMap.get(assignment._id);
        const isOverdue = assignment.dueDate && new Date(assignment.dueDate) < new Date();
        
        if (submission?.status === 'submitted') {
            return { type: 'completed', label: 'Completed', icon: CheckCircle, color: 'text-branch-600 bg-branch-100' };
        } else if (submission && submission.status !== 'submitted') {
            return { type: 'in-progress', label: 'In Progress', icon: FileText, color: 'text-scribe-600 bg-scribe-100' };
        } else if (isOverdue) {
            return { type: 'overdue', label: 'Overdue', icon: AlertCircle, color: 'text-ember-600 bg-ember-100' };
        } else {
            return { type: 'available', label: 'Available', icon: FileText, color: 'text-forest-600 bg-forest-100' };
        }
    };

    const filterCounts = {
        all: assignments?.length || 0,
        available: assignments?.filter(a => !submissionMap.has(a._id) && !(a.dueDate && new Date(a.dueDate) < new Date())).length || 0,
        'in-progress': assignments?.filter(a => submissionMap.has(a._id) && submissionMap.get(a._id)?.status !== 'submitted').length || 0,
        completed: assignments?.filter(a => submissionMap.has(a._id) && submissionMap.get(a._id)?.status === 'submitted').length || 0,
        overdue: assignments?.filter(a => (a.dueDate && new Date(a.dueDate) < new Date()) && (!submissionMap.has(a._id) || submissionMap.get(a._id)?.status !== 'submitted')).length || 0,
    };

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-ink-900">
                    My Assignments
                </h1>
                <p className="text-ink-600 mt-2">
                    Manage your assignments across all enrolled courses.
                </p>
            </div>

            {/* Search and Filters */}
            <div className="mb-8 bg-white p-6 rounded-xl shadow-sm border border-ink-200">
                <div className="flex flex-col lg:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-ink-400" />
                        <Input
                            type="text"
                            placeholder="Search assignments by title or course..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    
                    {/* Filter Buttons */}
                    <div className="flex flex-wrap gap-2">
                        {([
                            { key: 'available', label: 'Available', count: filterCounts.available },
                            { key: 'in-progress', label: 'In Progress', count: filterCounts['in-progress'] },
                            { key: 'completed', label: 'Completed', count: filterCounts.completed },
                            { key: 'overdue', label: 'Overdue', count: filterCounts.overdue },
                            { key: 'all', label: 'All', count: filterCounts.all },
                        ] as const).map(filter => (
                            <Button
                                key={filter.key}
                                variant={activeFilter === filter.key ? "default" : "outline"}
                                onClick={() => setActiveFilter(filter.key)}
                                className="flex items-center space-x-2"
                                size="sm"
                            >
                                <span>{filter.label}</span>
                                <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                                    activeFilter === filter.key 
                                        ? 'bg-white bg-opacity-20 text-white' 
                                        : 'bg-ink-100 text-ink-600'
                                }`}>
                                    {filter.count}
                                </span>
                            </Button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Assignment List */}
            <div className="space-y-6">
                {assignmentsLoading ? (
                    <div className="text-center py-12">
                        <div className="text-ink-500">Loading assignments...</div>
                    </div>
                ) : filteredAssignments.length > 0 ? (
                    <>
                        <div className="text-sm text-ink-600 mb-4">
                            Showing {filteredAssignments.length} of {assignments?.length || 0} assignments
                        </div>
                        {filteredAssignments.map((assignment) => {
                            const status = getAssignmentStatus(assignment);
                            const submission = submissionMap.get(assignment._id);
                            const StatusIcon = status.icon;
                            
                            return (
                                <div
                                    key={assignment._id}
                                    className="bg-white rounded-xl shadow-sm border border-ink-200 hover:shadow-md transition-shadow p-6"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start space-x-4 flex-1">
                                            <div className="p-3 bg-scribe-50 rounded-lg">
                                                <FileText className="h-6 w-6 text-scribe-600" />
                                            </div>
                                            
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-3 mb-2">
                                                    <h3 className="text-lg font-semibold text-ink-900">
                                                        {assignment.template?.title || assignment.title}
                                                    </h3>
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                                                        <StatusIcon className="h-3 w-3 mr-1" />
                                                        {status.label}
                                                    </span>
                                                </div>
                                                
                                                <div className="flex items-center space-x-4 text-sm text-ink-600 mb-3">
                                                    <div className="flex items-center space-x-1">
                                                        <BookOpen className="h-3 w-3" />
                                                        <span>{assignment.course?.title}</span>
                                                    </div>
                                                    {assignment.dueDate && (
                                                        <div className="flex items-center space-x-1">
                                                            <Clock className="h-3 w-3" />
                                                            <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                                                        </div>
                                                    )}
                                                    {submission && (
                                                        <div className="text-scribe-600">
                                                            {submission.wordCount || 0} words written
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                <p className="text-sm text-ink-600 line-clamp-2">
                                                    {assignment.customInstructions || assignment.template?.description || 'No description available.'}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex space-x-3 ml-4">
                                            <Button variant="outline" size="sm" asChild>
                                                <Link to={`/assignments/${assignment._id}`}>
                                                    View Details
                                                </Link>
                                            </Button>
                                            
                                            {submission ? (
                                                <Button size="sm" asChild>
                                                    <Link to={`/writing/assignment/${assignment._id}/submission/${submission._id}`}>
                                                        Continue Writing
                                                    </Link>
                                                </Button>
                                            ) : status.type !== 'overdue' && (
                                                <Button size="sm" asChild>
                                                    <Link to={`/assignments/${assignment._id}`}>
                                                        Start Assignment
                                                    </Link>
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </>
                ) : (
                    <div className="text-center py-12 bg-ink-50 rounded-xl">
                        <FileText className="h-12 w-12 text-ink-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-ink-900 mb-2">
                            {searchQuery ? 'No matching assignments' : `No ${activeFilter} assignments`}
                        </h3>
                        <p className="text-ink-600 mb-4">
                            {searchQuery 
                                ? 'Try adjusting your search terms or filters.'
                                : activeFilter === 'available' 
                                    ? 'Check back later for new assignments or browse courses to find more.'
                                    : `You have no ${activeFilter} assignments at the moment.`
                            }
                        </p>
                        {searchQuery ? (
                            <Button variant="outline" onClick={() => setSearchQuery("")}>
                                Clear Search
                            </Button>
                        ) : activeFilter === 'available' && (
                            <Button asChild>
                                <Link to="/courses/browse">Browse Courses</Link>
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {/* Course Summary */}
            {myCourses && myCourses.length > 0 && (
                <div className="mt-12 bg-white rounded-xl shadow-sm border border-ink-200 p-6">
                    <h2 className="text-lg font-semibold text-ink-900 mb-4">Enrolled Courses</h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {myCourses.map((course) => (
                            <div key={course._id} className="border border-ink-200 rounded-lg p-4">
                                <div className="flex items-center space-x-3 mb-2">
                                    <BookOpen className="h-5 w-5 text-forest-600" />
                                    <h3 className="font-medium text-ink-900">{course.title}</h3>
                                </div>
                                <p className="text-sm text-ink-600 mb-3">{course.instructor?.firstName} {course.instructor?.lastName}</p>
                                <Button variant="outline" size="sm" className="w-full" asChild>
                                    <Link to={`/courses/${course._id}/assignments`}>
                                        View Course Assignments
                                    </Link>
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};