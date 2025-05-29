import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCourses } from "@/hooks/useCourses";
import { useCourseAssignments } from "@/hooks/useCourseAssignments";
import { BookOpen, Users, Calendar, ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export const CourseDetailPage = () => {
    const { courseId } = useParams<{ courseId: string }>();
    const { user } = useAuth();
    const { data: allCourses, isLoading: coursesLoading } = useCourses();
    const { data: assignments, isLoading: assignmentsLoading } = useCourseAssignments(courseId!, { status: 'published' });

    const course = allCourses?.find(c => c.id === courseId);

    if (coursesLoading) {
        return (
            <div className="container mx-auto py-8 px-4">
                <div className="text-ink-500">Loading course...</div>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="container mx-auto py-8 px-4">
                <div className="text-center py-12">
                    <BookOpen className="h-12 w-12 text-ink-400 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-ink-900 mb-2">Course not found</h2>
                    <p className="text-ink-600 mb-4">The course you're looking for doesn't exist.</p>
                    <Button asChild>
                        <Link to="/courses/browse">Browse Courses</Link>
                    </Button>
                </div>
            </div>
        );
    }

    const isInstructor = course.instructor?.id === user?.id;
    // Note: Students are handled via enrollments, not direct course.students property
    const isEnrolled = false; // TODO: Implement enrollment check via separate API

    return (
        <div className="container mx-auto py-8 px-4">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center space-x-4 mb-4">
                    <Button variant="outline" size="sm" asChild>
                        <Link to="/courses/browse">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Courses
                        </Link>
                    </Button>
                </div>
                
                <div className="bg-white rounded-xl shadow-sm border border-ink-200 p-8">
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-forest-50 rounded-lg">
                                <BookOpen className="h-8 w-8 text-forest-600" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-ink-900 mb-2">
                                    {course.title}
                                </h1>
                                <p className="text-ink-600 mb-4">
                                    {course.description}
                                </p>
                                <div className="flex items-center space-x-6 text-sm text-ink-500">
                                    <div className="flex items-center space-x-2">
                                        <Users className="h-4 w-4" />
                                        <span>{course.maxStudents} max students</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Calendar className="h-4 w-4" />
                                        <span>Created {new Date(course.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex space-x-3">
                            {isInstructor && (
                                <Button variant="outline">
                                    Edit Course
                                </Button>
                            )}
                            {!isEnrolled && !isInstructor && course.enrollmentCode && (
                                <Button>
                                    Enroll in Course
                                </Button>
                            )}
                            {(isEnrolled || isInstructor) && (
                                <Button asChild>
                                    <Link to={`/courses/${courseId}/assignments`}>
                                        View Assignments
                                    </Link>
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Instructor Info */}
                    <div className="border-t border-ink-200 pt-6">
                        <h3 className="text-lg font-semibold text-ink-900 mb-3">Instructor</h3>
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-scribe-500 text-white rounded-full flex items-center justify-center font-medium">
                                {course.instructor?.firstName?.[0]}{course.instructor?.lastName?.[0]}
                            </div>
                            <div>
                                <p className="font-medium text-ink-900">
                                    {course.instructor?.firstName} {course.instructor?.lastName}
                                </p>
                                <p className="text-sm text-ink-600">
                                    {course.instructor?.email}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Assignments Overview */}
            <div className="bg-white rounded-xl shadow-sm border border-ink-200 p-8">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-ink-900">Course Assignments</h2>
                    <Button variant="outline" asChild>
                        <Link to={`/courses/${courseId}/assignments`}>
                            View All Assignments
                        </Link>
                    </Button>
                </div>

                {assignmentsLoading ? (
                    <div className="text-ink-500">Loading assignments...</div>
                ) : assignments && assignments.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {assignments.slice(0, 6).map((assignment) => (
                            <div
                                key={assignment.id}
                                className="border border-ink-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                            >
                                <div className="flex items-center space-x-3 mb-3">
                                    <FileText className="h-5 w-5 text-scribe-600" />
                                    <h3 className="font-medium text-ink-900">
                                        {assignment.template?.title || assignment.title}
                                    </h3>
                                </div>
                                
                                {assignment.dueDate && (
                                    <p className="text-sm text-ink-500 mb-3">
                                        Due: {new Date(assignment.dueDate).toLocaleDateString()}
                                    </p>
                                )}
                                
                                <Button variant="outline" size="sm" asChild className="w-full">
                                    <Link to={`/assignments/${assignment.id}`}>
                                        View Assignment
                                    </Link>
                                </Button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 bg-ink-50 rounded-lg">
                        <FileText className="h-12 w-12 text-ink-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-ink-900 mb-2">No assignments yet</h3>
                        <p className="text-ink-600">
                            {isInstructor 
                                ? "Create your first assignment to get started."
                                : "Check back later for new assignments."
                            }
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};