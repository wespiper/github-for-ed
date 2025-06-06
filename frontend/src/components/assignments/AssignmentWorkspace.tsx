import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
// Temporarily disabled - will be replaced in Phase 5
// import { WritingEditor } from "@/components/editor/WritingEditor";
// import { VersionTimeline } from "@/components/editor/VersionTimeline";
// import { WritingAnalytics } from "@/components/analytics/WritingAnalytics";
import { EducationalAICoach } from "@/components/ai/EducationalAICoach";
import { useAssignment } from "@/hooks/useAssignments";
import {
    useSubmission,
    useUpdateSubmission,
    useSubmissionVersions,
} from "@/hooks/useSubmissions";
import { useAuth } from "@/hooks/useAuth";

export const AssignmentWorkspace = () => {
    const { assignmentId, submissionId } = useParams<{
        assignmentId: string;
        submissionId: string;
    }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [showVersions, setShowVersions] = useState(false);
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [showAICoach, setShowAICoach] = useState(false);
    const [activeCollaborators, setActiveCollaborators] = useState<{ id: string; firstName: string; lastName: string; email: string }[]>([]);
    const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);

    const { data: assignment, isLoading: assignmentLoading } = useAssignment(
        assignmentId!
    );
    const { data: submission, isLoading: submissionLoading } = useSubmission(
        submissionId!
    );
    const { data: versions } = useSubmissionVersions(submissionId!);
    const updateSubmission = useUpdateSubmission();

    // Real-time collaboration simulation (would integrate with WebSocket in production)
    useEffect(() => {
        if (submission?.collaborationSettings.isCollaborative) {
            // Simulate active collaborators
            setActiveCollaborators(
                submission.collaborators?.filter((c: { id: string }) => c.id !== user?.id) || []
            );
        }
    }, [submission, user]);

    // Auto-save function for collaborative writing
    const handleContentUpdate = useCallback(
        async (content: string) => {
            if (!submissionId || !submission) return;

            try {
                await updateSubmission.mutateAsync({
                    submissionId,
                    content,
                });
                setLastSaveTime(new Date());
            } catch (error) {
                console.error("Auto-save failed:", error);
            }
        },
        [submissionId, submission, updateSubmission]
    );

    // Manual save function
    const handleManualSave = useCallback(async () => {
        if (!submissionId || !submission) return;

        try {
            await updateSubmission.mutateAsync({
                submissionId,
                content: submission.content || '',
            });
            setLastSaveTime(new Date());
        } catch (error) {
            console.error("Manual save failed:", error);
        }
    }, [submissionId, submission, updateSubmission]);

    // Determine current writing stage based on word count and content
    const getCurrentWritingStage = () => {
        if (!submission) return 'brainstorming';
        
        const wordCount = submission.wordCount || 0;
        const hasStructure = submission.content?.includes('<h') || submission.content?.includes('<p');
        
        if (wordCount < 100) return 'brainstorming';
        if (wordCount < 500 && !hasStructure) return 'drafting';
        if (wordCount >= 500 && hasStructure) return 'revising';
        return 'editing';
    };

    // Handle AI reflection submissions
    const handleAIReflection = useCallback((reflection: { prompt: string; response: string }) => {
        // In production, this would be saved to the backend
        console.log('AI Reflection recorded:', reflection);
        // Could update submission with reflection metadata here
    }, []);

    if (assignmentLoading || submissionLoading) {
        return (
            <div className="min-h-screen bg-ink-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-scribe-600 mx-auto mb-4"></div>
                    <p className="text-ink-600">
                        Loading assignment workspace...
                    </p>
                </div>
            </div>
        );
    }

    if (!assignment || !submission) {
        return (
            <div className="min-h-screen bg-ink-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4">📝</div>
                    <h2 className="text-2xl font-bold text-ink-900 mb-2">
                        Assignment not found
                    </h2>
                    <p className="text-ink-600 mb-4">
                        The assignment or submission you're looking for doesn't
                        exist.
                    </p>
                    <button
                        onClick={() => navigate("/dashboard")}
                        className="px-4 py-2 bg-scribe-600 text-white rounded-md hover:bg-scribe-700"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    // Check if user can edit
    const canEdit =
        submission.author?.id === user?.id ||
        submission.collaborators?.some(
            (collab: { id: string }) => collab.id === user?.id
        ) ||
        user?.role === "admin";

    // Check if submission is submitted
    const isSubmitted = submission.status === "submitted";

    return (
        <div className="min-h-screen bg-ink-50">
            {/* Header - Assignment Workspace Style */}
            <div className="bg-white border-b border-ink-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => navigate(-1)}
                                className="text-ink-500 hover:text-ink-700"
                            >
                                ← Back
                            </button>
                            <div>
                                <h1 className="text-xl font-semibold text-ink-900">
                                    {submission.title}
                                </h1>
                                <div className="flex items-center space-x-2 text-sm text-ink-500">
                                    <span>{assignment.title}</span>
                                    {assignment.dueDate && (
                                        <>
                                            <span>•</span>
                                            <span>
                                                Due:{" "}
                                                {new Date(
                                                    assignment.dueDate
                                                ).toLocaleDateString()}
                                            </span>
                                        </>
                                    )}
                                    {assignment.isOverdue && (
                                        <span className="px-2 py-1 bg-ember-100 text-ember-800 text-xs font-medium rounded-full">
                                            Overdue
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            {/* Collaboration Indicators */}
                            {submission.collaborationSettings.isCollaborative && (
                                <div className="flex items-center space-x-2">
                                    <div className="flex -space-x-2">
                                        {activeCollaborators
                                            .slice(0, 3)
                                            .map((collaborator) => (
                                                <div
                                                    key={collaborator.id}
                                                    className="relative w-8 h-8 bg-scribe-500 text-white rounded-full flex items-center justify-center text-xs font-medium border-2 border-white"
                                                    title={`${collaborator.firstName} ${collaborator.lastName}`}
                                                >
                                                    {collaborator.firstName[0]}
                                                    {collaborator.lastName[0]}
                                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-branch-400 rounded-full border border-white"></div>
                                                </div>
                                            ))}
                                    </div>
                                    <span className="text-sm text-branch-600 font-medium">
                                        Live
                                    </span>
                                </div>
                            )}

                            {/* View toggles */}
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() =>
                                        setShowVersions(!showVersions)
                                    }
                                    className={`px-3 py-1 text-sm rounded-md ${
                                        showVersions
                                            ? "bg-scribe-100 text-scribe-700"
                                            : "bg-ink-100 text-ink-700 hover:bg-ink-200"
                                    }`}
                                >
                                    Versions ({versions?.length || 0})
                                </button>
                                <button
                                    onClick={() =>
                                        setShowAnalytics(!showAnalytics)
                                    }
                                    className={`px-3 py-1 text-sm rounded-md ${
                                        showAnalytics
                                            ? "bg-highlight-200 text-highlight-700"
                                            : "bg-ink-100 text-ink-700 hover:bg-ink-200"
                                    }`}
                                >
                                    Analytics
                                </button>
                                {canEdit && !isSubmitted && (
                                    <button
                                        onClick={() =>
                                            setShowAICoach(!showAICoach)
                                        }
                                        className={`px-3 py-1 text-sm rounded-md ${
                                            showAICoach
                                                ? "bg-scribe-200 text-scribe-700"
                                                : "bg-ink-100 text-ink-700 hover:bg-ink-200"
                                        }`}
                                    >
                                        🎯 AI Coach
                                    </button>
                                )}
                            </div>

                            {/* Save button */}
                            {canEdit && !isSubmitted && (
                                <button
                                    onClick={handleManualSave}
                                    disabled={updateSubmission.isPending}
                                    className="px-4 py-2 bg-scribe-600 text-white text-sm rounded-md hover:bg-scribe-700 disabled:opacity-50"
                                >
                                    {updateSubmission.isPending
                                        ? "Saving..."
                                        : "Save"}
                                </button>
                            )}

                            {/* Status and stats */}
                            <div className="text-sm text-ink-500">
                                <div className="flex items-center space-x-2">
                                    <span>{submission.wordCount} words</span>
                                    <span>•</span>
                                    <span>
                                        {submission.estimatedReadingTime || Math.ceil((submission.wordCount || 0) / 200)} min
                                        read
                                    </span>
                                    {isSubmitted && (
                                        <>
                                            <span>•</span>
                                            <span className="px-2 py-1 bg-branch-100 text-branch-800 text-xs font-medium rounded-full">
                                                Submitted
                                            </span>
                                        </>
                                    )}
                                </div>
                                {lastSaveTime && (
                                    <div className="text-xs">
                                        Last saved:{" "}
                                        {lastSaveTime.toLocaleTimeString()}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Workspace - "Google Docs meets GitHub" Layout */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Main Editor Area */}
                    <div
                        className={`${
                            showVersions || showAnalytics || showAICoach
                                ? "lg:col-span-8"
                                : "lg:col-span-12"
                        }`}
                    >
                        <div className="bg-white rounded-lg shadow-sm">
                            {/* Assignment Instructions (Collapsible) */}
                            <div className="border-b border-ink-200 p-6">
                                <details className="group">
                                    <summary className="cursor-pointer text-lg font-medium text-ink-900 mb-2 list-none">
                                        📋 Assignment Instructions
                                        <span className="float-right text-sm text-ink-500 group-open:hidden">
                                            Click to expand
                                        </span>
                                    </summary>
                                    <div className="mt-4 prose prose-sm max-w-none">
                                        <div className="text-ink-700 whitespace-pre-wrap">
                                            {assignment.instructions}
                                        </div>

                                        {assignment.requirements && (
                                            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                {assignment.requirements
                                                    .minWords && (
                                                    <div>
                                                        <span className="font-medium">
                                                            Min Words:
                                                        </span>{" "}
                                                        {
                                                            assignment
                                                                .requirements
                                                                .minWords
                                                        }
                                                    </div>
                                                )}
                                                {assignment.requirements
                                                    .maxWords && (
                                                    <div>
                                                        <span className="font-medium">
                                                            Max Words:
                                                        </span>{" "}
                                                        {
                                                            assignment
                                                                .requirements
                                                                .maxWords
                                                        }
                                                    </div>
                                                )}
                                                {assignment.requirements
                                                    .citationStyle && (
                                                    <div>
                                                        <span className="font-medium">
                                                            Citation Style:
                                                        </span>{" "}
                                                        {
                                                            assignment
                                                                .requirements
                                                                .citationStyle
                                                        }
                                                    </div>
                                                )}
                                                {assignment.type ===
                                                    "collaborative" && (
                                                    <div>
                                                        <span className="font-medium">
                                                            Type:
                                                        </span>{" "}
                                                        Collaborative Writing
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </details>
                            </div>

                            {/* Writing Editor - Phase 5 Implementation */}
                            <div className="p-6">
                                <div className="min-h-[400px] border rounded-lg p-4 bg-gray-50">
                                    <textarea
                                        className="w-full h-full min-h-[350px] p-4 border-0 bg-transparent resize-none focus:outline-none"
                                        value={submission.content || ''}
                                        onChange={(e) => handleContentUpdate(e.target.value)}
                                        placeholder="Start writing your assignment..."
                                        disabled={!canEdit || isSubmitted}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Comments Section */}
                        {submission.comments &&
                            submission.comments.length > 0 && (
                                <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
                                    <h3 className="text-lg font-medium text-ink-900 mb-4">
                                        Comments & Feedback
                                    </h3>
                                    <div className="space-y-4">
                                        {submission.comments.map(
                                            (comment: { id: string; author: { firstName: string; lastName: string }; content: string; createdAt: string; type?: string; resolved?: boolean }) => (
                                                <div
                                                    key={comment.id}
                                                    className="border-l-4 border-scribe-200 pl-4"
                                                >
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center space-x-2">
                                                            <span className="font-medium text-sm">
                                                                {
                                                                    comment
                                                                        .author
                                                                        .firstName
                                                                }{" "}
                                                                {
                                                                    comment
                                                                        .author
                                                                        .lastName
                                                                }
                                                            </span>
                                                            <span
                                                                className={`px-2 py-1 text-xs rounded-full ${
                                                                    comment.type ===
                                                                    "suggestion"
                                                                        ? "bg-highlight-100 text-highlight-800"
                                                                        : comment.type ===
                                                                          "question"
                                                                        ? "bg-scribe-100 text-scribe-800"
                                                                        : comment.type ===
                                                                          "approval"
                                                                        ? "bg-branch-100 text-branch-800"
                                                                        : "bg-ink-100 text-ink-800"
                                                                }`}
                                                            >
                                                                {comment.type}
                                                            </span>
                                                        </div>
                                                        <span className="text-xs text-ink-500">
                                                            {new Date(
                                                                comment.createdAt
                                                            ).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <p className="text-ink-700 text-sm">
                                                        {comment.content}
                                                    </p>
                                                    {comment.resolved && (
                                                        <span className="inline-block mt-2 px-2 py-1 bg-branch-100 text-branch-800 text-xs rounded-full">
                                                            Resolved
                                                        </span>
                                                    )}
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            )}
                    </div>

                    {/* Sidebar - Versions, Analytics & AI Coach */}
                    {(showVersions || showAnalytics || showAICoach) && (
                        <div className="lg:col-span-4">
                            <div className="sticky top-24 space-y-6">
                                {/* Version Timeline - Phase 5 Implementation */}
                                {showVersions && (
                                    <div className="bg-white rounded-lg shadow-sm p-6">
                                        <div className="text-center text-gray-500">
                                            <p>Version Timeline</p>
                                            <p className="text-sm">Coming in Phase 5</p>
                                        </div>
                                    </div>
                                )}

                                {/* Writing Analytics - Phase 5 Implementation */}
                                {showAnalytics && (
                                    <div className="bg-white rounded-lg shadow-sm p-6">
                                        <div className="text-center text-gray-500">
                                            <p>Writing Analytics</p>
                                            <p className="text-sm">Coming in Phase 5</p>
                                        </div>
                                    </div>
                                )}

                                {showAICoach && canEdit && !isSubmitted && (
                                    <div className="bg-white rounded-lg shadow-sm p-6">
                                        <EducationalAICoach
                                            studentId={user?.id || ''}
                                            assignmentId={assignmentId!}
                                            currentStage={getCurrentWritingStage() as 'brainstorming' | 'drafting' | 'revising' | 'editing'}
                                            contentSample={submission.content?.substring(0, 500) || ''}
                                            onReflectionRequired={handleAIReflection}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
