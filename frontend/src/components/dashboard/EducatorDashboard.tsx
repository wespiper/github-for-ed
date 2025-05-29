import { useState } from "react";
import { Link } from "react-router-dom";
import { useCourses } from "@/hooks/useCourses";
import { useCourseDocuments } from "@/hooks/useDocuments";
import { useAuth } from "@/hooks/useAuth";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface StudentProgress {
    studentId: string;
    studentName: string;
    documentsCount: number;
    totalWords: number;
    lastActivity: string;
    avgWordsPerSession: number;
    completedAssignments: number;
    totalAssignments: number;
}

export const EducatorDashboard = () => {
    const { user } = useAuth();
    const [selectedCourse, setSelectedCourse] = useState<string>("");
    const [selectedChapter, setSelectedChapter] = useState<string>("");

    const { data: courses, isLoading: coursesLoading } = useCourses();
    const { data: documents, isLoading: documentsLoading } = useCourseDocuments(
        selectedCourse,
        selectedChapter ? { chapter: selectedChapter } : undefined
    );

    // Get educator's courses
    const educatorCourses =
        courses?.filter((course) => course.instructor?.id === user?.id) || [];

    // Extract unique chapters from documents
    const chapters = documents
        ? (Array.from(
              new Set(documents.map((doc) => doc.chapter).filter(Boolean))
          ) as string[])
        : [];

    // Calculate student progress data
    const calculateStudentProgress = (): StudentProgress[] => {
        if (!documents) return [];

        const studentMap = new Map<string, StudentProgress>();

        documents.forEach((doc) => {
            const studentId = doc.author._id;
            const studentName = `${doc.author.firstName} ${doc.author.lastName}`;

            if (!studentMap.has(studentId)) {
                studentMap.set(studentId, {
                    studentId,
                    studentName,
                    documentsCount: 0,
                    totalWords: 0,
                    lastActivity: doc.metadata.lastEditedAt,
                    avgWordsPerSession: 0,
                    completedAssignments: 0,
                    totalAssignments: 0,
                });
            }

            const progress = studentMap.get(studentId)!;
            progress.documentsCount++;
            progress.totalWords += doc.metadata.wordCount;

            // Update last activity if this document is more recent
            if (
                new Date(doc.metadata.lastEditedAt) >
                new Date(progress.lastActivity)
            ) {
                progress.lastActivity = doc.metadata.lastEditedAt;
            }

            // Count assignments
            if (doc.type === "assignment") {
                progress.totalAssignments++;
            } else if (doc.type === "submission") {
                progress.completedAssignments++;
            }
        });

        // Calculate averages
        studentMap.forEach((progress) => {
            progress.avgWordsPerSession =
                progress.documentsCount > 0
                    ? Math.round(progress.totalWords / progress.documentsCount)
                    : 0;
        });

        return Array.from(studentMap.values()).sort(
            (a, b) => b.totalWords - a.totalWords
        );
    };

    const studentProgress = calculateStudentProgress();

    // Calculate course statistics
    const courseStats = {
        totalStudents: studentProgress.length,
        totalDocuments: documents?.length || 0,
        totalWords: studentProgress.reduce(
            (sum, student) => sum + student.totalWords,
            0
        ),
        activeStudents: studentProgress.filter((student) => {
            const lastActivity = new Date(student.lastActivity);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return lastActivity > weekAgo;
        }).length,
    };

    if (coursesLoading) {
        return (
            <div className="min-h-screen bg-ink-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-scribe-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-ink-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-ink-900">
                        Educator Dashboard
                    </h1>
                    <p className="mt-2 text-ink-600">
                        Track student progress and writing analytics
                    </p>
                </div>

                {/* Course Selection */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                    <h2 className="text-lg font-semibold text-ink-900 mb-4">
                        Select Course
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-ink-700 mb-2">
                                Course
                            </label>
                            <Select
                                value={selectedCourse}
                                onValueChange={(value) => {
                                    setSelectedCourse(value || "");
                                    setSelectedChapter(""); // Reset chapter when course changes
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a course..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {educatorCourses.map((course) => (
                                        <SelectItem
                                            key={course.id}
                                            value={course.id}
                                        >
                                            {course.title} (
                                            {course.maxStudents} max students)
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {selectedCourse && chapters.length > 0 && (
                            <div>
                                <label className="block text-sm font-medium text-ink-700 mb-2">
                                    Chapter (Optional)
                                </label>
                                <Select
                                    value={selectedChapter}
                                    onValueChange={(value) =>
                                        setSelectedChapter(value || "")
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="All chapters" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">
                                            All chapters
                                        </SelectItem>
                                        {chapters.map((chapter) => (
                                            <SelectItem
                                                key={chapter}
                                                value={chapter}
                                            >
                                                {chapter}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>
                </div>

                {selectedCourse && (
                    <>
                        {/* Course Statistics */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                            <div className="bg-white rounded-lg shadow-sm p-6">
                                <div className="flex items-center">
                                    <div className="p-2 bg-scribe-100 rounded-lg">
                                        <svg
                                            className="w-6 h-6 text-scribe-600"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-ink-500">
                                            Total Students
                                        </p>
                                        <p className="text-2xl font-semibold text-ink-900">
                                            {courseStats.totalStudents}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow-sm p-6">
                                <div className="flex items-center">
                                    <div className="p-2 bg-branch-100 rounded-lg">
                                        <svg
                                            className="w-6 h-6 text-branch-600"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-ink-500">
                                            Active This Week
                                        </p>
                                        <p className="text-2xl font-semibold text-ink-900">
                                            {courseStats.activeStudents}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow-sm p-6">
                                <div className="flex items-center">
                                    <div className="p-2 bg-highlight-100 rounded-lg">
                                        <svg
                                            className="w-6 h-6 text-highlight-600"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-ink-500">
                                            Total Documents
                                        </p>
                                        <p className="text-2xl font-semibold text-ink-900">
                                            {courseStats.totalDocuments}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow-sm p-6">
                                <div className="flex items-center">
                                    <div className="p-2 bg-highlight-100 rounded-lg">
                                        <svg
                                            className="w-6 h-6 text-highlight-600"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-ink-500">
                                            Total Words
                                        </p>
                                        <p className="text-2xl font-semibold text-ink-900">
                                            {courseStats.totalWords.toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Student Progress Table */}
                        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-ink-200">
                                <h3 className="text-lg font-semibold text-ink-900">
                                    Student Progress
                                </h3>
                            </div>

                            {documentsLoading ? (
                                <div className="p-8 text-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-scribe-600 mx-auto"></div>
                                    <p className="mt-2 text-ink-600">
                                        Loading student data...
                                    </p>
                                </div>
                            ) : studentProgress.length === 0 ? (
                                <div className="p-8 text-center">
                                    <div className="text-4xl mb-4">📝</div>
                                    <p className="text-ink-600">
                                        No student activity found for this
                                        course.
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-ink-200">
                                        <thead className="bg-ink-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-ink-500 uppercase tracking-wider">
                                                    Student
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-ink-500 uppercase tracking-wider">
                                                    Documents
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-ink-500 uppercase tracking-wider">
                                                    Total Words
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-ink-500 uppercase tracking-wider">
                                                    Avg Words/Doc
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-ink-500 uppercase tracking-wider">
                                                    Assignments
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-ink-500 uppercase tracking-wider">
                                                    Last Activity
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-ink-500 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-ink-200">
                                            {studentProgress.map((student) => (
                                                <tr
                                                    key={student.studentId}
                                                    className="hover:bg-ink-50"
                                                >
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="font-medium text-ink-900">
                                                            {
                                                                student.studentName
                                                            }
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-ink-500">
                                                        {student.documentsCount}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-ink-500">
                                                        {student.totalWords.toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-ink-500">
                                                        {
                                                            student.avgWordsPerSession
                                                        }
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-ink-500">
                                                        <span
                                                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                                student.completedAssignments ===
                                                                student.totalAssignments
                                                                    ? "bg-branch-100 text-branch-800"
                                                                    : "bg-highlight-100 text-highlight-800"
                                                            }`}
                                                        >
                                                            {
                                                                student.completedAssignments
                                                            }
                                                            /
                                                            {
                                                                student.totalAssignments
                                                            }
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-ink-500">
                                                        {new Date(
                                                            student.lastActivity
                                                        ).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        <Link
                                                            to={`/course/${selectedCourse}/student/${student.studentId}`}
                                                            className="text-scribe-600 hover:text-scribe-900"
                                                        >
                                                            View Details
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Recent Documents */}
                        {documents && documents.length > 0 && (
                            <div className="mt-8 bg-white rounded-lg shadow-sm">
                                <div className="px-6 py-4 border-b border-ink-200">
                                    <h3 className="text-lg font-semibold text-ink-900">
                                        Recent Documents
                                    </h3>
                                </div>
                                <div className="p-6">
                                    <div className="space-y-4">
                                        {documents.slice(0, 5).map((doc) => (
                                            <div
                                                key={doc._id}
                                                className="flex items-center justify-between p-4 border rounded-lg hover:bg-ink-50"
                                            >
                                                <div className="flex-1">
                                                    <h4 className="font-medium text-ink-900">
                                                        {doc.title}
                                                    </h4>
                                                    <div className="flex items-center space-x-4 text-sm text-ink-500 mt-1">
                                                        <span>
                                                            {
                                                                doc.author
                                                                    .firstName
                                                            }{" "}
                                                            {
                                                                doc.author
                                                                    .lastName
                                                            }
                                                        </span>
                                                        <span>•</span>
                                                        <span>
                                                            {
                                                                doc.metadata
                                                                    .wordCount
                                                            }{" "}
                                                            words
                                                        </span>
                                                        <span>•</span>
                                                        <span>
                                                            {new Date(
                                                                doc.metadata.lastEditedAt
                                                            ).toLocaleDateString()}
                                                        </span>
                                                        {doc.chapter && (
                                                            <>
                                                                <span>•</span>
                                                                <span>
                                                                    {
                                                                        doc.chapter
                                                                    }
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                                <Link
                                                    to={`/document/${doc._id}`}
                                                    className="px-3 py-1 text-sm bg-scribe-100 text-scribe-700 rounded-md hover:bg-scribe-200"
                                                >
                                                    View
                                                </Link>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {!selectedCourse && (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">📊</div>
                        <h3 className="text-xl font-semibold text-ink-900 mb-2">
                            Select a Course
                        </h3>
                        <p className="text-ink-600">
                            Choose a course above to view student progress and
                            analytics.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
