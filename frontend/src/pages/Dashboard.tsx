import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAssignmentsDueSoon } from "@/hooks/useCourseAssignments";
import { useMyCourses } from "@/hooks/useCourses";
import { EducatorDashboard } from "@/components/dashboard/EducatorDashboard";
import { StudentWritingDashboard } from "@/components/analytics/StudentWritingDashboard";
import {
    BookOpen,
    FileText,
    TrendingUp,
    Clock,
    Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Dashboard = () => {
    const { user } = useAuth();
    
    // Fetch user-specific data
    const { data: myCourses, isLoading: coursesLoading } = useMyCourses();
    const { data: assignmentsDueSoon } = useAssignmentsDueSoon(7);

    if (!user) return null;

    // For educators, use the sophisticated EducatorDashboard
    if (user.role === 'educator') {
        return <EducatorDashboard />;
    }

    // For students, show the analytical writing dashboard along with simple overview
    if (user.role === 'student') {
        return (
            <div className="space-y-8">
                {/* Student Overview Section */}
                <div className="container mx-auto py-8 px-4">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold tracking-tight text-ink-900">
                            Welcome back, {user.firstName}!
                        </h1>
                        <p className="text-ink-600 mt-2">
                            Continue branching your ideas and growing as a writer through meaningful practice.
                        </p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {/* Student Dashboard Cards */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-ink-200 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-forest-50 rounded-lg">
                                        <BookOpen className="h-5 w-5 text-forest-600" />
                                    </div>
                                    <h3 className="text-sm font-medium text-ink-900">
                                        Enrolled Courses
                                    </h3>
                                </div>
                            </div>
                            <div className="text-3xl font-bold text-ink-900 mb-1">
                                {coursesLoading ? "..." : myCourses?.length || 0}
                            </div>
                            <p className="text-sm text-ink-600">
                                {myCourses?.length ? (
                                    <>
                                        {myCourses.slice(0, 2).map((course, i) => (
                                            <span key={course.id}>
                                                {i > 0 && " & "}
                                                <span className="text-forest-600 font-medium">
                                                    {course.title}
                                                </span>
                                            </span>
                                        ))}
                                        {myCourses.length > 2 && ` & ${myCourses.length - 2} more`}
                                    </>
                                ) : (
                                    "No enrolled courses"
                                )}
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-ink-200 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-scribe-50 rounded-lg">
                                        <Clock className="h-5 w-5 text-scribe-600" />
                                    </div>
                                    <h3 className="text-sm font-medium text-ink-900">
                                        Assignments Due
                                    </h3>
                                </div>
                            </div>
                            <div className="text-3xl font-bold text-ink-900 mb-1">
                                {assignmentsDueSoon?.length || 0}
                            </div>
                            <p className="text-sm text-ink-600">
                                {assignmentsDueSoon?.length ? (
                                    <>
                                        <span className="text-scribe-600 font-medium">
                                            {assignmentsDueSoon[0].template?.title || "Assignment"}
                                        </span>{" "}
                                        due soon
                                    </>
                                ) : (
                                    "No assignments due"
                                )}
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-ink-200 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-branch-50 rounded-lg">
                                        <TrendingUp className="h-5 w-5 text-branch-600" />
                                    </div>
                                    <h3 className="text-sm font-medium text-ink-900">
                                        Writing Progress
                                    </h3>
                                </div>
                            </div>
                            <div className="text-3xl font-bold text-ink-900 mb-1">
                                {assignmentsDueSoon?.length ? `${assignmentsDueSoon.length}` : "0"}
                            </div>
                            <p className="text-sm text-ink-600">
                                <span className="text-branch-600 font-medium">
                                    {assignmentsDueSoon?.length ? "Active assignments" : "All caught up"}
                                </span>{" "}
                                this week
                            </p>
                        </div>
                    </div>

                    {/* Quick Actions for Students */}
                    <div className="mt-8">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-ink-200">
                            <h2 className="text-xl font-semibold text-ink-900 mb-2">Quick Actions</h2>
                            <p className="text-ink-600 mb-6">
                                Continue growing your voice and letting your words find their natural shape.
                            </p>
                            <div className="space-y-3">
                                <Button
                                    asChild
                                    className="w-full h-auto p-6 justify-start bg-forest-600 hover:bg-forest-700"
                                    size="lg"
                                >
                                    <Link to="/courses/browse">
                                        <BookOpen size={20} />
                                        <div className="text-left ml-3">
                                            <div className="font-medium">
                                                Browse Courses
                                            </div>
                                            <div className="text-sm opacity-90">
                                                Find your learning community
                                            </div>
                                        </div>
                                    </Link>
                                </Button>
                                <Button
                                    asChild
                                    variant="outline"
                                    className="w-full h-auto p-6 justify-start border-forest-200 text-forest-700 hover:bg-forest-50"
                                    size="lg"
                                >
                                    <Link to="/writing/continue">
                                        <FileText size={20} />
                                        <div className="text-left ml-3">
                                            <div className="font-medium">
                                                Continue Writing
                                            </div>
                                            <div className="text-sm opacity-90">
                                                Let your words grow naturally
                                            </div>
                                        </div>
                                    </Link>
                                </Button>
                                <Button
                                    asChild
                                    variant="outline"
                                    className="w-full h-auto p-6 justify-start border-gray-200 text-gray-700 hover:bg-gray-50"
                                    size="lg"
                                >
                                    <Link to="/assignments">
                                        <Layers size={20} />
                                        <div className="text-left ml-3">
                                            <div className="font-medium">
                                                Browse All Assignments
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                See all assignments across courses
                                            </div>
                                        </div>
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Advanced Analytics Dashboard for Students */}
                <div className="bg-ink-50 py-8">
                    <div className="container mx-auto px-4">
                        <StudentWritingDashboard studentId={user.id} />
                    </div>
                </div>
            </div>
        );
    }

    // Fallback for admin or other roles - show basic dashboard
    return (
        <div className="container mx-auto py-8 px-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-ink-900">
                    Welcome back, {user.firstName}!
                </h1>
                <p className="text-ink-600 mt-2">
                    Admin dashboard with system overview and management tools.
                </p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-sm border border-ink-200">
                <h2 className="text-xl font-semibold text-ink-900 mb-4">System Overview</h2>
                <p className="text-ink-600 mb-4">
                    Role: <span className="font-medium">{user.role}</span>
                </p>
                <p className="text-ink-500">
                    Advanced admin functionality is under development.
                </p>
            </div>
        </div>
    );
};
