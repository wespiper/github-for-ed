import { useState } from "react";
import { format } from "date-fns";

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

    const getVersionIcon = (type: string) => {
        switch (type) {
            case "auto":
                return "🤖";
            case "manual":
                return "💾";
            case "collaboration":
                return "👥";
            default:
                return "📝";
        }
    };

    const getChangeColor = (addedWords: number, deletedWords: number) => {
        if (addedWords > deletedWords) return "text-branch-600";
        if (deletedWords > addedWords) return "text-ember-600";
        return "text-ink-600";
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

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-ink-900">
                    Version History
                </h3>
                <div className="flex items-center space-x-2">
                    {compareMode ? (
                        <>
                            <button
                                onClick={handleCompare}
                                disabled={selectedVersions.length !== 2}
                                className="px-3 py-1 bg-scribe-600 text-white text-sm rounded-md hover:bg-scribe-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Compare ({selectedVersions.length}/2)
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
                            Compare Versions
                        </button>
                    )}
                </div>
            </div>

            {/* Timeline */}
            <div className="space-y-3">
                {versions.map((version, index) => (
                    <div
                        key={version.id}
                        onClick={() => handleVersionClick(version.version)}
                        className={`relative p-4 border rounded-lg cursor-pointer transition-all ${
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

                        <div className="flex items-start space-x-3">
                            {/* Version indicator */}
                            <div
                                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                    version.version === currentVersion
                                        ? "bg-scribe-500 text-white"
                                        : "bg-ink-100 text-ink-600"
                                }`}
                            >
                                v{version.version}
                            </div>

                            {/* Version details */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <span className="text-lg">
                                            {getVersionIcon(
                                                version.changes.type
                                            )}
                                        </span>
                                        <h4 className="text-sm font-medium text-ink-900 truncate">
                                            {version.title}
                                        </h4>
                                        {version.version === currentVersion && (
                                            <span className="px-2 py-1 bg-scribe-100 text-scribe-800 text-xs font-medium rounded-full">
                                                Current
                                            </span>
                                        )}
                                    </div>
                                    <time className="text-xs text-ink-500">
                                        {format(
                                            new Date(version.createdAt),
                                            "MMM d, h:mm a"
                                        )}
                                    </time>
                                </div>

                                <div className="mt-1 flex items-center space-x-4 text-xs text-ink-500">
                                    <span>
                                        {version.author.firstName}{" "}
                                        {version.author.lastName}
                                    </span>
                                    <span>
                                        {version.metadata.wordCount} words
                                    </span>
                                    <span>
                                        {version.metadata.readingTime} min read
                                    </span>
                                    <span
                                        className={getChangeColor(
                                            version.changes.addedWords,
                                            version.changes.deletedWords
                                        )}
                                    >
                                        {version.changeSummary}
                                    </span>
                                </div>

                                {/* Change details */}
                                {(version.changes.addedWords > 0 ||
                                    version.changes.deletedWords > 0) && (
                                    <div className="mt-2 flex items-center space-x-3 text-xs">
                                        {version.changes.addedWords > 0 && (
                                            <span className="flex items-center space-x-1 text-branch-600">
                                                <span>
                                                    +
                                                    {version.changes.addedWords}{" "}
                                                    words
                                                </span>
                                            </span>
                                        )}
                                        {version.changes.deletedWords > 0 && (
                                            <span className="flex items-center space-x-1 text-ember-600">
                                                <span>
                                                    -
                                                    {
                                                        version.changes
                                                            .deletedWords
                                                    }{" "}
                                                    words
                                                </span>
                                            </span>
                                        )}
                                        {version.changes.type ===
                                            "collaboration" && (
                                            <span className="flex items-center space-x-1 text-highlight-600">
                                                <span>Collaborative edit</span>
                                            </span>
                                        )}
                                    </div>
                                )}
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
                ))}
            </div>

            {/* Empty state */}
            {versions.length === 0 && (
                <div className="text-center py-8 text-ink-500">
                    <div className="text-4xl mb-2">📝</div>
                    <p>No versions available yet.</p>
                    <p className="text-sm">
                        Start writing to create your first version!
                    </p>
                </div>
            )}
        </div>
    );
};
