import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
    BookOpen,
    FileText,
    Users,
    AlertCircle,
    TrendingUp,
    Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Dashboard = () => {
    const { user } = useAuth();

    if (!user) return null;

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-ink-900">
                    {user.role === "educator"
                        ? `Welcome back, ${user.firstName}!`
                        : `Welcome back, ${user.firstName}!`}
                </h1>
                <p className="text-ink-600 mt-2">
                    {user.role === "educator"
                        ? "Watch your writers grow and help their words find power through thoughtful guidance."
                        : "Continue branching your ideas and growing as a writer through meaningful practice."}
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {user.role === "educator" ? (
                    <>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-ink-200 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-forest-50 rounded-lg">
                                        <BookOpen className="h-5 w-5 text-forest-600" />
                                    </div>
                                    <h3 className="text-sm font-medium text-ink-900">
                                        Active Courses
                                    </h3>
                                </div>
                            </div>
                            <div className="text-3xl font-bold text-ink-900 mb-1">
                                3
                            </div>
                            <p className="text-sm text-ink-600">
                                <span className="text-branch-600 font-medium">
                                    +1
                                </span>{" "}
                                flourishing this semester
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-ink-200 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-branch-50 rounded-lg">
                                        <TrendingUp className="h-5 w-5 text-branch-600" />
                                    </div>
                                    <h3 className="text-sm font-medium text-ink-900">
                                        Student Progress
                                    </h3>
                                </div>
                            </div>
                            <div className="text-3xl font-bold text-ink-900 mb-1">
                                42
                            </div>
                            <p className="text-sm text-ink-600">
                                <span className="text-branch-600 font-medium">
                                    78%
                                </span>{" "}
                                branching beautifully
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-ink-200 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-highlight-50 rounded-lg">
                                        <AlertCircle className="h-5 w-5 text-highlight-600" />
                                    </div>
                                    <h3 className="text-sm font-medium text-ink-900">
                                        Need Support
                                    </h3>
                                </div>
                            </div>
                            <div className="text-3xl font-bold text-ink-900 mb-1">
                                3
                            </div>
                            <p className="text-sm text-ink-600">
                                Writers ready for{" "}
                                <span className="text-highlight-600 font-medium">
                                    gentle guidance
                                </span>
                            </p>
                        </div>
                    </>
                ) : (
                    <>
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
                                2
                            </div>
                            <p className="text-sm text-ink-600">
                                Writing &{" "}
                                <span className="text-forest-600 font-medium">
                                    Research Methods
                                </span>
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
                                1
                            </div>
                            <p className="text-sm text-ink-600">
                                <span className="text-scribe-600 font-medium">
                                    Research Paper
                                </span>{" "}
                                ready Friday
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
                                B+
                            </div>
                            <p className="text-sm text-ink-600">
                                <span className="text-branch-600 font-medium">
                                    Branching beautifully
                                </span>{" "}
                                each day
                            </p>
                        </div>
                    </>
                )}
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
                {/* Quick Actions */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-ink-200">
                    <h2 className="text-xl font-semibold text-ink-900 mb-2">
                        {user.role === "educator"
                            ? "Quick Actions"
                            : "Quick Actions"}
                    </h2>
                    <p className="text-ink-600 mb-6">
                        {user.role === "educator"
                            ? "Plant seeds of learning that will help your writers branch into their best selves."
                            : "Continue growing your voice and letting your words find their natural shape."}
                    </p>
                    <div className="space-y-3">
                        {user.role === "educator" ? (
                            <>
                                <Button
                                    asChild
                                    className="w-full h-auto p-6 justify-start bg-forest-600 hover:bg-forest-700"
                                    size="lg"
                                >
                                    <Link to="/courses/create">
                                        <BookOpen size={20} />
                                        <div className="text-left ml-3">
                                            <div className="font-medium">
                                                Create Course
                                            </div>
                                            <div className="text-sm opacity-90">
                                                Cultivate a learning community
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
                                    <Link to="/assignments/create">
                                        <FileText size={20} />
                                        <div className="text-left ml-3">
                                            <div className="font-medium">
                                                Create Assignment
                                            </div>
                                            <div className="text-sm text-forest-600">
                                                Help words find their purpose
                                            </div>
                                        </div>
                                    </Link>
                                </Button>
                            </>
                        ) : (
                            <>
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
                            </>
                        )}
                    </div>
                </div>

                {/* Recent Activity or Writing Insights */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-ink-200">
                    <h2 className="text-xl font-semibold text-ink-900 mb-2">
                        {user.role === "educator"
                            ? "Student Insights"
                            : "Writing Progress"}
                    </h2>
                    <p className="text-ink-600 mb-6">
                        {user.role === "educator"
                            ? "Watch how your writers are branching into their potential."
                            : "Beautiful moments from your recent writing adventures."}
                    </p>
                    <div className="space-y-4">
                        {user.role === "educator" ? (
                            <>
                                <div className="flex items-start space-x-3">
                                    <div className="p-2 bg-branch-50 rounded-lg">
                                        <TrendingUp className="h-4 w-4 text-branch-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-ink-900">
                                            3 writers found their thesis voice
                                        </p>
                                        <p className="text-xs text-ink-500">
                                            arguments branching beautifully in
                                            Workshop
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-3">
                                    <div className="p-2 bg-scribe-50 rounded-lg">
                                        <Users className="h-4 w-4 text-scribe-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-ink-900">
                                            Words shared in community
                                        </p>
                                        <p className="text-xs text-ink-500">
                                            peer feedback helping papers grow
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-3">
                                    <div className="p-2 bg-highlight-50 rounded-lg">
                                        <AlertCircle className="h-4 w-4 text-highlight-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-ink-900">
                                            2 writers ready for gentle guidance
                                        </p>
                                        <p className="text-xs text-ink-500">
                                            perfect time for nurturing
                                            conversation
                                        </p>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="flex items-start space-x-3">
                                    <div className="p-2 bg-branch-50 rounded-lg">
                                        <TrendingUp className="h-4 w-4 text-branch-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-ink-900">
                                            Your argument found its power ✨
                                        </p>
                                        <p className="text-xs text-ink-500">
                                            B+ with beautiful branching ideas
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-3">
                                    <div className="p-2 bg-scribe-50 rounded-lg">
                                        <FileText className="h-4 w-4 text-scribe-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-ink-900">
                                            Words flowing into research
                                        </p>
                                        <p className="text-xs text-ink-500">
                                            1,247 words growing naturally
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-3">
                                    <div className="p-2 bg-highlight-50 rounded-lg">
                                        <Users className="h-4 w-4 text-highlight-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-ink-900">
                                            Community reading awaits
                                        </p>
                                        <p className="text-xs text-ink-500">
                                            help Sarah's narrative bloom
                                        </p>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
