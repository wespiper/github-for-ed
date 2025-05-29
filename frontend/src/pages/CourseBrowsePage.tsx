import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useMyCourses, useCourses } from "@/hooks/useCourses";
import { BookOpen, Users, Calendar, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const CourseBrowsePage = () => {
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState("");
    const [filterActive, setFilterActive] = useState(true);
    
    const { data: myCourses, isLoading: myCoursesLoading } = useMyCourses();
    const { data: allCourses, isLoading: allCoursesLoading } = useCourses();

    if (!user) return null;

    // Filter courses based on search and enrollment status
    const enrolledCourseIds = new Set(myCourses?.map(course => course.id) || []);
    
    const availableCourses = allCourses?.filter(course => 
        !enrolledCourseIds.has(course.id) &&
        (filterActive ? course.isActive !== false : true) &&
        (searchQuery ? 
            course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            course.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            course.subject?.toLowerCase().includes(searchQuery.toLowerCase())
            : true
        )
    ) || [];

    const myEnrolledCourses = myCourses || [];

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-ink-900">
                    Browse Courses
                </h1>
                <p className="text-ink-600 mt-2">
                    Discover new learning communities and expand your writing journey.
                </p>
            </div>

            {/* Search and Filter */}
            <div className="mb-8 bg-white p-6 rounded-xl shadow-sm border border-ink-200">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-ink-400" />
                        <Input
                            type="text"
                            placeholder="Search courses by title, description, or subject..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Button
                        variant={filterActive ? "default" : "outline"}
                        onClick={() => setFilterActive(!filterActive)}
                        className="flex items-center space-x-2"
                    >
                        <Filter className="h-4 w-4" />
                        <span>Active Only</span>
                    </Button>
                </div>
            </div>

            {/* My Enrolled Courses */}
            <div className="mb-8">
                <h2 className="text-xl font-semibold text-ink-900 mb-4">
                    My Courses ({myEnrolledCourses.length})
                </h2>
                
                {myCoursesLoading ? (
                    <div className="text-ink-500">Loading your courses...</div>
                ) : myEnrolledCourses.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {myEnrolledCourses.map((course) => (
                            <div
                                key={course.id}
                                className="bg-white p-6 rounded-xl shadow-sm border border-forest-200 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-center space-x-3 mb-3">
                                    <div className="p-2 bg-forest-50 rounded-lg">
                                        <BookOpen className="h-5 w-5 text-forest-600" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-ink-900">
                                            {course.title}
                                        </h3>
                                        <p className="text-sm text-ink-600">
                                            {course.instructor?.firstName} {course.instructor?.lastName}
                                        </p>
                                    </div>
                                </div>
                                
                                <p className="text-sm text-ink-600 mb-4 line-clamp-2">
                                    {course.description}
                                </p>
                                
                                <div className="flex items-center justify-between text-sm text-ink-500 mb-4">
                                    <div className="flex items-center space-x-1">
                                        <Users className="h-3 w-3" />
                                        <span>0 students</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                        <Calendar className="h-3 w-3" />
                                        <span>
                                            {new Date(course.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="flex space-x-2">
                                    <Button 
                                        asChild 
                                        className="flex-1"
                                        size="sm"
                                    >
                                        <Link to={`/courses/${course.id}`}>
                                            View Course
                                        </Link>
                                    </Button>
                                    <Button 
                                        asChild 
                                        variant="outline"
                                        size="sm"
                                    >
                                        <Link to={`/courses/${course.id}/assignments`}>
                                            Assignments
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 bg-forest-50 rounded-xl">
                        <BookOpen className="h-12 w-12 text-forest-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-ink-900 mb-2">
                            No enrolled courses
                        </h3>
                        <p className="text-ink-600">
                            Browse available courses below to get started.
                        </p>
                    </div>
                )}
            </div>

            {/* Available Courses */}
            <div>
                <h2 className="text-xl font-semibold text-ink-900 mb-4">
                    Available Courses ({availableCourses.length})
                </h2>
                
                {allCoursesLoading ? (
                    <div className="text-ink-500">Loading available courses...</div>
                ) : availableCourses.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {availableCourses.map((course) => (
                            <div
                                key={course.id}
                                className="bg-white p-6 rounded-xl shadow-sm border border-ink-200 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-center space-x-3 mb-3">
                                    <div className="p-2 bg-scribe-50 rounded-lg">
                                        <BookOpen className="h-5 w-5 text-scribe-600" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-ink-900">
                                            {course.title}
                                        </h3>
                                        <p className="text-sm text-ink-600">
                                            {course.instructor?.firstName} {course.instructor?.lastName}
                                        </p>
                                    </div>
                                </div>
                                
                                {course.subject && (
                                    <div className="mb-3">
                                        <span className="px-2 py-1 bg-ink-100 text-ink-700 text-xs font-medium rounded-full">
                                            {course.subject}
                                        </span>
                                    </div>
                                )}
                                
                                <p className="text-sm text-ink-600 mb-4 line-clamp-3">
                                    {course.description}
                                </p>
                                
                                <div className="flex items-center justify-between text-sm text-ink-500 mb-4">
                                    <div className="flex items-center space-x-1">
                                        <Users className="h-3 w-3" />
                                        <span>
                                            0
                                            {course.maxStudents ? `/${course.maxStudents}` : ''} students
                                        </span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                        <Calendar className="h-3 w-3" />
                                        <span>
                                            {new Date(course.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                                
                                {course.tags && course.tags.length > 0 && (
                                    <div className="mb-4">
                                        <div className="flex flex-wrap gap-1">
                                            {course.tags.slice(0, 3).map((tag) => (
                                                <span 
                                                    key={tag}
                                                    className="px-2 py-1 bg-highlight-100 text-highlight-700 text-xs rounded-full"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                            {course.tags.length > 3 && (
                                                <span className="px-2 py-1 bg-ink-100 text-ink-600 text-xs rounded-full">
                                                    +{course.tags.length - 3} more
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}
                                
                                <div className="flex space-x-2">
                                    <Button 
                                        asChild 
                                        variant="outline"
                                        className="flex-1"
                                        size="sm"
                                    >
                                        <Link to={`/courses/${course.id}`}>
                                            View Details
                                        </Link>
                                    </Button>
                                    {course.enrollmentCode && (
                                        <Button 
                                            className="flex-1"
                                            size="sm"
                                            onClick={() => {
                                                // TODO: Implement enrollment logic
                                                alert(`Enrollment with code: ${course.enrollmentCode}`);
                                            }}
                                        >
                                            Enroll
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-ink-50 rounded-xl">
                        <Search className="h-12 w-12 text-ink-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-ink-900 mb-2">
                            {searchQuery ? 'No courses found' : 'No available courses'}
                        </h3>
                        <p className="text-ink-600 mb-4">
                            {searchQuery 
                                ? 'Try adjusting your search terms or filters.'
                                : 'Check back later for new course offerings.'
                            }
                        </p>
                        {searchQuery && (
                            <Button 
                                variant="outline"
                                onClick={() => setSearchQuery("")}
                            >
                                Clear Search
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};