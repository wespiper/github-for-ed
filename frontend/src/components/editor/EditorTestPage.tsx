import { useState } from "react";
import { WritingEditor } from "./WritingEditor";
import { VersionTimeline } from "./VersionTimeline";
import { WritingAnalytics } from "@/components/analytics/WritingAnalytics";

// Mock data for testing
const mockVersions = [
    {
        id: "1",
        version: 3,
        title: "Test Document v3",
        author: { firstName: "John", lastName: "Doe" },
        changes: {
            type: "manual" as const,
            addedWords: 25,
            deletedWords: 5,
            addedChars: 150,
            deletedChars: 30,
        },
        metadata: {
            wordCount: 450,
            readingTime: 3,
        },
        changeSummary: "+25 words, -5 words",
        createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    },
    {
        id: "2",
        version: 2,
        title: "Test Document v2",
        author: { firstName: "John", lastName: "Doe" },
        changes: {
            type: "auto" as const,
            addedWords: 40,
            deletedWords: 0,
            addedChars: 240,
            deletedChars: 0,
        },
        metadata: {
            wordCount: 425,
            readingTime: 2,
        },
        changeSummary: "+40 words",
        createdAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    },
    {
        id: "3",
        version: 1,
        title: "Test Document v1",
        author: { firstName: "John", lastName: "Doe" },
        changes: {
            type: "manual" as const,
            addedWords: 385,
            deletedWords: 0,
            addedChars: 2310,
            deletedChars: 0,
        },
        metadata: {
            wordCount: 385,
            readingTime: 2,
        },
        changeSummary: "+385 words (initial)",
        createdAt: new Date(Date.now() - 14400000).toISOString(), // 4 hours ago
    },
];

export const EditorTestPage = () => {
    const [content, setContent] = useState(`
    <h2>Welcome to the Writing Editor Test</h2>
    <p>This is a test document to explore the writing editor features. You can:</p>
    <ul>
      <li><strong>Edit this text</strong> - Try typing and formatting</li>
      <li><strong>Use the toolbar</strong> - Bold, italic, headers, lists</li>
      <li><strong>See auto-save</strong> - Changes save automatically</li>
      <li><strong>View analytics</strong> - Check the analytics panel</li>
      <li><strong>Check versions</strong> - See the version timeline</li>
    </ul>
    <p>The editor supports:</p>
    <blockquote>
      Rich text formatting, version control, real-time collaboration features, 
      and comprehensive writing analytics.
    </blockquote>
    <p>Start writing to see the word count and analytics update in real-time!</p>
  `);

    const [showVersions, setShowVersions] = useState(false);
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [saveCount, setSaveCount] = useState(0);

    const handleContentUpdate = (newContent: string) => {
        setContent(newContent);
        setSaveCount((prev) => prev + 1);
    };

    const handleSave = () => {
        console.log("Manual save triggered");
        alert(
            "Document saved! (This is just a test - no actual save occurred)"
        );
    };

    const handleVersionSelect = (version: number) => {
        console.log("Selected version:", version);
        alert(`Version ${version} selected! (This is just a test)`);
    };

    const handleCompareVersions = (version1: number, version2: number) => {
        console.log("Compare versions:", version1, "vs", version2);
        alert(
            `Comparing versions ${version1} and ${version2}! (This is just a test)`
        );
    };

    return (
        <div className="min-h-screen bg-ink-50">
            {/* Header */}
            <div className="bg-white border-b border-ink-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div>
                            <h1 className="text-xl font-semibold text-ink-900">
                                Writing Editor Test
                            </h1>
                            <p className="text-sm text-ink-500">
                                Test all the editor features and UI components
                            </p>
                        </div>

                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => setShowVersions(!showVersions)}
                                className={`px-3 py-1 text-sm rounded-md ${
                                    showVersions
                                        ? "bg-scribe-100 text-scribe-700"
                                        : "bg-ink-100 text-ink-700 hover:bg-ink-200"
                                }`}
                            >
                                Versions ({mockVersions.length})
                            </button>

                            <button
                                onClick={() => setShowAnalytics(!showAnalytics)}
                                className={`px-3 py-1 text-sm rounded-md ${
                                    showAnalytics
                                        ? "bg-highlight-200 text-highlight-700"
                                        : "bg-ink-100 text-ink-700 hover:bg-ink-200"
                                }`}
                            >
                                Analytics
                            </button>

                            <button
                                onClick={handleSave}
                                className="px-4 py-2 bg-scribe-600 text-white text-sm rounded-md hover:bg-scribe-700"
                            >
                                Save
                            </button>

                            <div className="text-sm text-ink-500">
                                Auto-saves: {saveCount}
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
                            showVersions || showAnalytics
                                ? "lg:col-span-3"
                                : "lg:col-span-4"
                        }`}
                    >
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <div className="mb-4">
                                <h2 className="text-lg font-medium text-ink-900 mb-2">
                                    Test Instructions
                                </h2>
                                <div className="bg-scribe-50 border border-scribe-200 rounded-lg p-4 text-sm text-scribe-800">
                                    <p>
                                        <strong>Try these features:</strong>
                                    </p>
                                    <ul className="mt-2 space-y-1 list-disc list-inside">
                                        <li>
                                            Type and see auto-save in action
                                        </li>
                                        <li>
                                            Use Bold, Italic, Headers from the
                                            toolbar
                                        </li>
                                        <li>
                                            Watch word count update in real-time
                                        </li>
                                        <li>
                                            Toggle Versions panel to see
                                            timeline
                                        </li>
                                        <li>
                                            Toggle Analytics to see writing
                                            insights
                                        </li>
                                        <li>Try Ctrl+S for manual save</li>
                                    </ul>
                                </div>
                            </div>

                            <WritingEditor
                                content={content}
                                onUpdate={handleContentUpdate}
                                onSave={handleSave}
                                placeholder="Start writing to test the editor..."
                                autoSave={true}
                                autoSaveInterval={3000} // 3 seconds for testing
                                maxCharacters={50000}
                                className=""
                                editable={true}
                            />
                        </div>
                    </div>

                    {/* Sidebar */}
                    {(showVersions || showAnalytics) && (
                        <div className="lg:col-span-1">
                            <div className="sticky top-24 space-y-6">
                                {showVersions && (
                                    <div className="bg-white rounded-lg shadow-sm p-6">
                                        <VersionTimeline
                                            versions={mockVersions}
                                            currentVersion={3}
                                            onVersionSelect={
                                                handleVersionSelect
                                            }
                                            onCompareVersions={
                                                handleCompareVersions
                                            }
                                            loading={false}
                                        />
                                    </div>
                                )}

                                {showAnalytics && (
                                    <div className="bg-white rounded-lg shadow-sm p-6">
                                        <WritingAnalytics
                                            documentId="test-document"
                                            currentWordCount={450}
                                            totalVersions={3}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Feature Demo Cards */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h3 className="text-lg font-medium text-ink-900 mb-2">
                            ✍️ Rich Text Editor
                        </h3>
                        <p className="text-ink-600 text-sm">
                            TipTap-powered editor with formatting, auto-save,
                            and collaborative features ready.
                        </p>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h3 className="text-lg font-medium text-ink-900 mb-2">
                            🕐 Version Timeline
                        </h3>
                        <p className="text-ink-600 text-sm">
                            Track writing progress with automatic versioning and
                            change visualization.
                        </p>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h3 className="text-lg font-medium text-ink-900 mb-2">
                            📊 Writing Analytics
                        </h3>
                        <p className="text-ink-600 text-sm">
                            Educational insights into writing patterns,
                            consistency, and development.
                        </p>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h3 className="text-lg font-medium text-ink-900 mb-2">
                            👥 Collaboration
                        </h3>
                        <p className="text-ink-600 text-sm">
                            Real-time editing, comments, and collaborative
                            features (UI ready).
                        </p>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h3 className="text-lg font-medium text-ink-900 mb-2">
                            💾 Auto-Save
                        </h3>
                        <p className="text-ink-600 text-sm">
                            Intelligent auto-saving with configurable intervals
                            and manual save options.
                        </p>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h3 className="text-lg font-medium text-ink-900 mb-2">
                            🎯 Educational Focus
                        </h3>
                        <p className="text-ink-600 text-sm">
                            Built for learning with instructor oversight and
                            writing development tracking.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
