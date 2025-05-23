import { useState } from "react";
import { formatDistanceToNow } from "date-fns";

interface Version {
    id: string;
    version: number;
    title: string;
    author: {
        firstName: string;
        lastName: string;
    };
    changes: {
        type: "auto" | "manual" | "collaboration";
        addedWords: number;
        deletedWords: number;
        addedChars: number;
        deletedChars: number;
    };
    metadata: {
        wordCount: number;
        readingTime: number;
    };
    changeSummary: string;
    createdAt: string;
}

interface VersionTimelineProps {
    versions: Version[];
    currentVersion: number;
    onVersionSelect: (version: number) => void;
    onCompareVersions: (version1: number, version2: number) => void;
    loading?: boolean;
}

export const VersionTimeline = ({
    versions,
    currentVersion,
    onVersionSelect,
    onCompareVersions,
    loading = false,
}: VersionTimelineProps) => {
    const [selectedVersions, setSelectedVersions] = useState<number[]>([]);
    const [compareMode, setCompareMode] = useState(false);

    const handleVersionClick = (version: number) => {
        if (compareMode) {
            if (selectedVersions.includes(version)) {
                setSelectedVersions(
                    selectedVersions.filter((v) => v !== version)
                );
            } else if (selectedVersions.length < 2) {
                setSelectedVersions([...selectedVersions, version]);
            }
        } else {
            onVersionSelect(version);
        }
    };

    const handleCompare = () => {
        if (selectedVersions.length === 2) {
            onCompareVersions(selectedVersions[0], selectedVersions[1]);
            setSelectedVersions([]);
            setCompareMode(false);
        }
    };

    const getVersionIcon = (type: string, changes: { addedWords: number; deletedWords: number }) => {
        // More intuitive, writer-friendly icons based on activity
        if (type === "collaboration") return "👥";
        if (changes.addedWords > changes.deletedWords * 2) return "✍️"; // Major writing
        if (changes.deletedWords > changes.addedWords) return "✂️"; // Heavy editing
        if (type === "auto") return "💫"; // Auto-save sparkle
        return "📝"; // General writing
    };

    if (loading) {
        return (
            <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                        <div className="h-20 bg-ink-200 rounded-lg"></div>
                    </div>
                ))}
            </div>
        );
    }

    // Calculate writing journey progress
    const totalWords = versions.length > 0 ? versions[0].metadata.wordCount : 0;
    const initialWords = versions.length > 0 ? versions[versions.length - 1].metadata.wordCount : 0;
    const journeyProgress = initialWords > 0 ? ((totalWords - initialWords) / Math.max(totalWords, 1000)) * 100 : 0;

    const getActivityDescription = (type: string, changes: { addedWords: number; deletedWords: number }) => {
        if (type === "collaboration") return "Collaborated";
        if (changes.addedWords > changes.deletedWords * 2) return "Major writing session";
        if (changes.deletedWords > changes.addedWords) return "Editing & refining";
        if (changes.addedWords > 50) return "Productive writing";
        if (type === "auto") return "Quick thoughts";
        return "Writing session";
    };

    return (
        <div className="space-y-4">
            {/* Writing Journey Progress */}
            {versions.length > 1 && (
                <div className="bg-gradient-to-r from-scribe-50 to-branch-50 rounded-lg p-4 border border-scribe-200">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-scribe-900">Writing Journey</h4>
                        <span className="text-xs text-scribe-600">
                            {totalWords - initialWords > 0 ? '+' : ''}{totalWords - initialWords} words
                        </span>
                    </div>
                    <div className="flex items-center space-x-3">
                        <span className="text-xs text-scribe-600">📖 Draft</span>
                        <div className="flex-1 bg-scribe-200 rounded-full h-2">
                            <div 
                                className="bg-gradient-to-r from-scribe-500 to-branch-500 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(100, Math.max(10, journeyProgress))}%` }}
                            />
                        </div>
                        <span className="text-xs text-scribe-600">🎯 Goal</span>
                    </div>
                    <div className="mt-2 text-xs text-scribe-600">
                        {versions.length} version{versions.length !== 1 ? 's' : ''} • 
                        Started {formatDistanceToNow(new Date(versions[versions.length - 1]?.createdAt || Date.now()))} ago
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-ink-900">
                    Your Writing Story
                </h3>
                <div className="flex items-center space-x-2">
                    {compareMode ? (
                        <>
                            <button
                                onClick={handleCompare}
                                disabled={selectedVersions.length !== 2}
                                className="px-3 py-1 bg-scribe-600 text-white text-sm rounded-md hover:bg-scribe-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                See Changes ({selectedVersions.length}/2)
                            </button>
                            <button
                                onClick={() => {
                                    setCompareMode(false);
                                    setSelectedVersions([]);
                                }}
                                className="px-3 py-1 bg-ink-600 text-white text-sm rounded-md hover:bg-ink-700"
                            >
                                Cancel
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => setCompareMode(true)}
                            className="px-3 py-1 bg-ink-100 text-ink-700 text-sm rounded-md hover:bg-ink-200"
                        >
                            🔍 Compare Drafts
                        </button>
                    )}
                </div>
            </div>

            {/* Timeline */}
            <div className="space-y-2">
                {versions.map((version, index) => (
                    <div
                        key={version.id}
                        className={`relative border rounded-lg transition-all ${
                            version.version === currentVersion
                                ? "border-scribe-500 bg-scribe-50"
                                : compareMode &&
                                  selectedVersions.includes(version.version)
                                ? "border-branch-500 bg-branch-50"
                                : "border-ink-200 hover:border-ink-300 hover:bg-ink-50"
                        }`}
                    >
                        {/* Timeline connector */}
                        {index < versions.length - 1 && (
                            <div className="absolute left-6 top-16 w-0.5 h-6 bg-ink-200"></div>
                        )}

                        {/* Compact version row */}
                        <div 
                            className="p-3 cursor-pointer hover:bg-ink-25 transition-colors"
                            onClick={() => handleVersionClick(version.version)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    handleVersionClick(version.version);
                                }
                            }}
                            aria-label={`Version ${version.version}: ${getActivityDescription(version.changes.type, version.changes)}`}
                        >
                            <div className="flex items-center space-x-3">
                                {/* Version indicator - more subtle */}
                                <div
                                    className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                                        version.version === currentVersion
                                            ? "bg-scribe-500 text-white"
                                            : "bg-ink-200 text-ink-500"
                                    }`}
                                >
                                    {version.version === currentVersion ? "●" : "○"}
                                </div>

                                {/* Version details */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <span className="text-lg">
                                                {getVersionIcon(
                                                    version.changes.type,
                                                    version.changes
                                                )}
                                            </span>
                                            <div>
                                                <h4 className="text-sm font-medium text-ink-900">
                                                    {getActivityDescription(version.changes.type, version.changes)}
                                                </h4>
                                                <div className="flex items-center space-x-2 text-xs text-ink-500">
                                                    <span>{formatDistanceToNow(new Date(version.createdAt))} ago</span>
                                                    <span>•</span>
                                                    <span>{version.metadata.wordCount} words</span>
                                                </div>
                                            </div>
                                            {version.version === currentVersion && (
                                                <span className="px-2 py-1 bg-scribe-100 text-scribe-800 text-xs font-medium rounded-full">
                                                    Current
                                                </span>
                                            )}
                                        </div>
                                        
                                        {/* Simple activity indicator */}
                                        <span className="text-xs text-ink-400 italic">
                                            {version.changes.addedWords > version.changes.deletedWords * 2 
                                                ? "✍️ Writing flow" 
                                                : version.changes.deletedWords > version.changes.addedWords 
                                                ? "✂️ Refining ideas"
                                                : version.changes.type === "collaboration"
                                                ? "👥 Collaborative"
                                                : "📝 Progress"
                                            }
                                        </span>
                                    </div>
                                </div>

                                {/* Selection indicator for compare mode */}
                                {compareMode && (
                                    <div
                                        className={`flex-shrink-0 w-4 h-4 rounded border-2 ${
                                            selectedVersions.includes(
                                                version.version
                                            )
                                                ? "bg-branch-500 border-branch-500"
                                                : "border-ink-300"
                                        }`}
                                    >
                                        {selectedVersions.includes(
                                            version.version
                                        ) && (
                                            <svg
                                                className="w-3 h-3 text-white"
                                                fill="currentColor"
                                                viewBox="0 0 20 20"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty state */}
            {versions.length === 0 && (
                <div className="text-center py-12 px-6">
                    <div className="text-6xl mb-4">✨</div>
                    <h3 className="text-lg font-semibold text-ink-900 mb-2">Your Writing Journey Starts Here</h3>
                    <p className="text-ink-600 mb-1">Every great story begins with a single word.</p>
                    <p className="text-sm text-ink-500">
                        Start writing and watch your ideas grow—we'll track every step of your creative process.
                    </p>
                    <div className="mt-6 flex justify-center space-x-6 text-xs text-ink-400">
                        <div className="flex items-center space-x-1">
                            <span>💫</span>
                            <span>Auto-saves</span>
                        </div>
                        <div className="flex items-center space-x-1">
                            <span>📊</span>
                            <span>Progress tracking</span>
                        </div>
                        <div className="flex items-center space-x-1">
                            <span>🔄</span>
                            <span>Version history</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
