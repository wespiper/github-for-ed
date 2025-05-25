import { useParams, Link } from "react-router-dom";
import { useCourseAssignments } from "@/hooks/useCourseAssignments";
import { ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export const CourseAssignmentsPage = () => {
    const { courseId } = useParams<{ courseId: string }>();
    const { data: assignments, isLoading } = useCourseAssignments(courseId!, { status: 'published' });

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="flex items-center space-x-4 mb-8">
                <Button variant="outline" size="sm" asChild>
                    <Link to={`/courses/${courseId}`}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Course
                    </Link>
                </Button>
                <h1 className="text-3xl font-bold text-ink-900">Course Assignments</h1>
            </div>

            {isLoading ? (
                <div className="text-ink-500">Loading assignments...</div>
            ) : assignments && assignments.length > 0 ? (
                <div className="grid gap-6">
                    {assignments.map((assignment) => (
                        <div key={assignment._id} className="bg-white rounded-xl shadow-sm border border-ink-200 p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <FileText className="h-6 w-6 text-scribe-600" />
                                    <div>
                                        <h3 className="text-lg font-semibold text-ink-900">
                                            {assignment.template?.title || assignment.title}
                                        </h3>
                                        {assignment.dueDate && (
                                            <p className="text-sm text-ink-600">
                                                Due: {new Date(assignment.dueDate).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <Button asChild>
                                    <Link to={`/assignments/${assignment._id}`}>
                                        View Assignment
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-ink-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-ink-900 mb-2">No assignments available</h3>
                    <p className="text-ink-600">Check back later for new assignments.</p>
                </div>
            )}
        </div>
    );
};