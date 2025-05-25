import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useMyCourseAssignments } from "@/hooks/useCourseAssignments";
import { useUserSubmissions } from "@/hooks/useSubmissions";
import { BookOpen, FileText, Clock, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export const ContinueWritingPage = () => {
    const { user } = useAuth();
    const { data: myCourseAssignments, isLoading: assignmentsLoading } = useMyCourseAssignments({ status: 'published' });
    const { data: mySubmissions, isLoading: submissionsLoading } = useUserSubmissions();

    if (!user) return null;

    const inProgressSubmissions = mySubmissions?.filter(sub => 
        sub.status === 'draft' || sub.status === 'in_progress'
    ) || [];

    const recentSubmissions = mySubmissions?.slice(0, 5) || [];

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-ink-900">
                    Continue Writing
                </h1>
                <p className="text-ink-600 mt-2">
                    Pick up where you left off and let your words grow naturally.
                </p>
            </div>

            {/* In Progress Assignments */}
            <div className="mb-8">
                <h2 className="text-xl font-semibold text-ink-900 mb-4">
                    Work in Progress
                </h2>
                
                {submissionsLoading ? (
                    <div className="text-ink-500">Loading your writing...</div>
                ) : inProgressSubmissions.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {inProgressSubmissions.map((submission) => (
                            <div
                                key={submission._id}
                                className="bg-white p-6 rounded-xl shadow-sm border border-ink-200 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center space-x-2">
                                        <FileText className="h-4 w-4 text-scribe-600" />
                                        <span className="text-sm font-medium text-ink-900">
                                            {submission.title}
                                        </span>
                                    </div>
                                    <span className={`px-2 py-1 text-xs rounded-full ${
                                        submission.status === 'draft'
                                            ? 'bg-highlight-100 text-highlight-800'
                                            : submission.status === 'in_progress'
                                            ? 'bg-scribe-100 text-scribe-800'
                                            : submission.status === 'returned'
                                            ? 'bg-branch-100 text-branch-800'
                                            : 'bg-ink-100 text-ink-800'
                                    }`}>
                                        {submission.status}
                                    </span>
                                </div>
                                
                                <p className="text-sm text-ink-600 mb-4">
                                    {submission.assignment?.title || 'Assignment'}
                                </p>
                                
                                <div className="flex items-center justify-between text-sm text-ink-500 mb-4">
                                    <span>{submission.wordCount || 0} words</span>
                                    <span>
                                        {submission.lastSavedAt 
                                            ? `${Math.floor((Date.now() - new Date(submission.lastSavedAt).getTime()) / (1000 * 60 * 60 * 24))} days ago`
                                            : 'Recently'
                                        }
                                    </span>
                                </div>
                                
                                <Button 
                                    asChild 
                                    className="w-full"
                                    size="sm"
                                >
                                    <Link to={`/writing/assignment/${submission.assignment?._id}/submission/${submission._id}`}>
                                        Continue Writing
                                    </Link>
                                </Button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-ink-50 rounded-xl">
                        <FileText className="h-12 w-12 text-ink-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-ink-900 mb-2">
                            No writing in progress
                        </h3>
                        <p className="text-ink-600 mb-4">
                            Start a new assignment or browse available courses.
                        </p>
                        <Button asChild>
                            <Link to="/courses/browse">
                                Browse Courses
                            </Link>
                        </Button>
                    </div>
                )}
            </div>

            {/* Available Assignments */}
            <div className="mb-8">
                <h2 className="text-xl font-semibold text-ink-900 mb-4">
                    Available Assignments
                </h2>
                
                {assignmentsLoading ? (
                    <div className="text-ink-500">Loading assignments...</div>
                ) : myCourseAssignments && myCourseAssignments.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {myCourseAssignments.slice(0, 6).map((assignment) => (
                            <div
                                key={assignment._id}
                                className="bg-white p-6 rounded-xl shadow-sm border border-ink-200 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-center space-x-3 mb-3">
                                    <div className="p-2 bg-forest-50 rounded-lg">
                                        <BookOpen className="h-4 w-4 text-forest-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-ink-900">
                                            {assignment.template?.title || 'Assignment'}
                                        </h3>
                                        <p className="text-sm text-ink-600">
                                            {assignment.course?.title}
                                        </p>
                                    </div>
                                </div>
                                
                                {assignment.dueDate && (
                                    <div className="flex items-center space-x-2 text-sm text-ink-500 mb-4">
                                        <Clock className="h-3 w-3" />
                                        <span>
                                            Due: {new Date(assignment.dueDate).toLocaleDateString()}
                                        </span>
                                    </div>
                                )}
                                
                                <p className="text-sm text-ink-600 mb-4 line-clamp-2">
                                    {assignment.template?.description || 'No description available'}
                                </p>
                                
                                <Button 
                                    asChild 
                                    variant="outline" 
                                    className="w-full"
                                    size="sm"
                                >
                                    <Link to={`/assignments/${assignment._id}`}>
                                        Start Assignment
                                    </Link>
                                </Button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-ink-50 rounded-xl">
                        <BookOpen className="h-12 w-12 text-ink-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-ink-900 mb-2">
                            No assignments available
                        </h3>
                        <p className="text-ink-600 mb-4">
                            Check back later or browse courses to find new assignments.
                        </p>
                    </div>
                )}
            </div>

            {/* Recent Activity */}
            <div>
                <h2 className="text-xl font-semibold text-ink-900 mb-4">
                    Recent Writing Activity
                </h2>
                
                {submissionsLoading ? (
                    <div className="text-ink-500">Loading recent activity...</div>
                ) : recentSubmissions.length > 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-ink-200 divide-y divide-ink-100">
                        {recentSubmissions.map((submission) => (
                            <div key={submission._id} className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="p-2 bg-scribe-50 rounded-lg">
                                            <TrendingUp className="h-4 w-4 text-scribe-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-ink-900">
                                                {submission.title}
                                            </h3>
                                            <p className="text-sm text-ink-600">
                                                {submission.assignment?.title} • {submission.wordCount || 0} words
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm text-ink-500">
                                            {submission.lastSavedAt 
                                                ? new Date(submission.lastSavedAt).toLocaleDateString()
                                                : 'Recently'
                                            }
                                        </div>
                                        <div className={`text-xs px-2 py-1 rounded-full inline-block ${
                                            submission.status === 'submitted' 
                                                ? 'bg-branch-100 text-branch-800'
                                                : submission.status === 'in_progress'
                                                ? 'bg-scribe-100 text-scribe-800'
                                                : 'bg-ink-100 text-ink-800'
                                        }`}>
                                            {submission.status}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 bg-ink-50 rounded-xl">
                        <p className="text-ink-600">No recent writing activity</p>
                    </div>
                )}
            </div>
        </div>
    );
};