import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { WritingEditor } from "./WritingEditor";
import { VersionTimeline } from "./VersionTimeline";
import {
    useDocument,
    useUpdateDocument,
    useDocumentVersions,
} from "@/hooks/useDocuments";
import { useAuth } from "@/hooks/useAuth";

export const DocumentEditor = () => {
    const { documentId } = useParams<{ documentId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [showVersions, setShowVersions] = useState(false);
    const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);

    const {
        data: document,
        isLoading: documentLoading,
        error: documentError,
    } = useDocument(documentId!);
    const { data: versions, isLoading: versionsLoading } = useDocumentVersions(
        documentId!
    );
    const updateDocument = useUpdateDocument();

    // Auto-save function
    const handleContentUpdate = useCallback(
        async (content: string) => {
            if (!documentId || !document) return;

            try {
                await updateDocument.mutateAsync({
                    documentId,
                    data: {
                        content,
                        saveType: "auto",
                    },
                });
                setLastSaveTime(new Date());
            } catch (error) {
                console.error("Auto-save failed:", error);
            }
        },
        [documentId, document, updateDocument]
    );

    // Manual save function
    const handleManualSave = useCallback(async () => {
        if (!documentId || !document) return;

        try {
            await updateDocument.mutateAsync({
                documentId,
                data: {
                    content: document.content,
                    saveType: "manual",
                },
            });
            setLastSaveTime(new Date());
        } catch (error) {
            console.error("Manual save failed:", error);
        }
    }, [documentId, document, updateDocument]);

    // Version selection handler
    const handleVersionSelect = (version: number) => {
        // In a real implementation, you would load the specific version content
        console.log("Selected version:", version);
    };

    // Version comparison handler
    const handleCompareVersions = (version1: number, version2: number) => {
        // Navigate to comparison view or open modal
        console.log("Compare versions:", version1, "vs", version2);
    };

    if (documentLoading) {
        return (
            <div className="min-h-screen bg-ink-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-scribe-600 mx-auto mb-4"></div>
                    <p className="text-ink-600">Loading document...</p>
                </div>
            </div>
        );
    }

    if (documentError || !document) {
        return (
            <div className="min-h-screen bg-ink-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4">📄</div>
                    <h2 className="text-2xl font-bold text-ink-900 mb-2">
                        Document not found
                    </h2>
                    <p className="text-ink-600 mb-4">
                        The document you're looking for doesn't exist or you
                        don't have access to it.
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
        document.author._id === user?.id ||
        document.collaborators.some((collab) => collab._id === user?.id) ||
        document.settings.allowCollaboration ||
        user?.role === "admin";

    return (
        <div className="min-h-screen bg-ink-50">
            {/* Header */}
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
                                    {document.title}
                                </h1>
                                <div className="flex items-center space-x-2 text-sm text-ink-500">
                                    <span>{document.course.title}</span>
                                    {document.chapter && (
                                        <>
                                            <span>•</span>
                                            <span>
                                                Chapter: {document.chapter}
                                            </span>
                                        </>
                                    )}
                                    {document.lesson && (
                                        <>
                                            <span>•</span>
                                            <span>
                                                Lesson: {document.lesson}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            {versions && versions.length > 0 && (
                                <button
                                    onClick={() =>
                                        setShowVersions(!showVersions)
                                    }
                                    className="px-3 py-2 text-sm bg-ink-100 text-ink-700 rounded-md hover:bg-ink-200"
                                >
                                    {showVersions ? "Hide" : "Show"} Versions (
                                    {versions.length})
                                </button>
                            )}

                            {canEdit && (
                                <button
                                    onClick={handleManualSave}
                                    disabled={updateDocument.isPending}
                                    className="px-4 py-2 bg-scribe-600 text-white text-sm rounded-md hover:bg-scribe-700 disabled:opacity-50"
                                >
                                    {updateDocument.isPending
                                        ? "Saving..."
                                        : "Save"}
                                </button>
                            )}

                            <div className="text-sm text-ink-500">
                                <div className="flex items-center space-x-2">
                                    <span>
                                        {document.metadata.wordCount} words
                                    </span>
                                    <span>•</span>
                                    <span>
                                        {document.metadata.readingTime} min read
                                    </span>
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

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Editor */}
                    <div
                        className={`${
                            showVersions ? "lg:col-span-3" : "lg:col-span-4"
                        }`}
                    >
                        <div className="bg-white rounded-lg shadow-sm">
                            <div className="p-6">
                                <WritingEditor
                                    content={document.content}
                                    onUpdate={handleContentUpdate}
                                    onSave={handleManualSave}
                                    placeholder="Start writing your story..."
                                    autoSave={document.settings.autoSave}
                                    autoSaveInterval={
                                        document.settings.autoSaveInterval *
                                        1000
                                    }
                                    editable={canEdit}
                                />
                            </div>
                        </div>

                        {/* Document Info */}
                        <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
                            <h3 className="text-lg font-medium text-ink-900 mb-4">
                                Document Information
                            </h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="font-medium text-ink-500">
                                        Author:
                                    </span>
                                    <span className="ml-2">
                                        {document.author.firstName}{" "}
                                        {document.author.lastName}
                                    </span>
                                </div>
                                <div>
                                    <span className="font-medium text-ink-500">
                                        Type:
                                    </span>
                                    <span className="ml-2 capitalize">
                                        {document.type}
                                    </span>
                                </div>
                                <div>
                                    <span className="font-medium text-ink-500">
                                        Created:
                                    </span>
                                    <span className="ml-2">
                                        {new Date(
                                            document.createdAt
                                        ).toLocaleDateString()}
                                    </span>
                                </div>
                                <div>
                                    <span className="font-medium text-ink-500">
                                        Last Updated:
                                    </span>
                                    <span className="ml-2">
                                        {new Date(
                                            document.metadata.lastEditedAt
                                        ).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>

                            {document.collaborators.length > 0 && (
                                <div className="mt-4">
                                    <span className="font-medium text-ink-500">
                                        Collaborators:
                                    </span>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {document.collaborators.map(
                                            (collab) => (
                                                <span
                                                    key={collab._id}
                                                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-scribe-100 text-scribe-800"
                                                >
                                                    {collab.firstName}{" "}
                                                    {collab.lastName}
                                                </span>
                                            )
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Version Timeline */}
                    {showVersions && (
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
                                <VersionTimeline
                                    versions={(versions || []).map((v) => ({
                                        id: v._id,
                                        version: v.version,
                                        title: v.title,
                                        author: v.author,
                                        changes: v.changes,
                                        metadata: v.metadata,
                                        changeSummary: v.changeSummary,
                                        createdAt: v.createdAt,
                                    }))}
                                    currentVersion={versions?.[0]?.version || 1}
                                    onVersionSelect={handleVersionSelect}
                                    onCompareVersions={handleCompareVersions}
                                    loading={versionsLoading}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
