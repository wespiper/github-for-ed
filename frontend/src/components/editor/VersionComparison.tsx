import { useState } from "react";
import { format } from "date-fns";

interface Version {
    id: string;
    version: number;
    title: string;
    content: string;
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

interface VersionComparisonProps {
    version1: Version;
    version2: Version;
    onClose: () => void;
}

export const VersionComparison = ({
    version1,
    version2,
    onClose,
}: VersionComparisonProps) => {
    const [viewMode, setViewMode] = useState<'side-by-side' | 'unified'>('side-by-side');
    
    // Determine which is older/newer
    const olderVersion = version1.version < version2.version ? version1 : version2;
    const newerVersion = version1.version > version2.version ? version1 : version2;
    
    // Simple word-level diff (in a real app, use a proper diff library)
    const getWordDiff = () => {
        const oldWords = olderVersion.content.replace(/<[^>]*>/g, '').split(/\s+/).filter(w => w);
        const newWords = newerVersion.content.replace(/<[^>]*>/g, '').split(/\s+/).filter(w => w);
        
        const diff = [];
        let oldIndex = 0;
        let newIndex = 0;
        
        while (oldIndex < oldWords.length || newIndex < newWords.length) {
            if (oldIndex >= oldWords.length) {
                // Remaining words are additions
                diff.push({ type: 'added', word: newWords[newIndex] });
                newIndex++;
            } else if (newIndex >= newWords.length) {
                // Remaining words are deletions
                diff.push({ type: 'removed', word: oldWords[oldIndex] });
                oldIndex++;
            } else if (oldWords[oldIndex] === newWords[newIndex]) {
                // Words match
                diff.push({ type: 'unchanged', word: oldWords[oldIndex] });
                oldIndex++;
                newIndex++;
            } else {
                // Look ahead to see if this is an insertion or deletion
                const oldWordInNew = newWords.slice(newIndex, newIndex + 3).indexOf(oldWords[oldIndex]);
                const newWordInOld = oldWords.slice(oldIndex, oldIndex + 3).indexOf(newWords[newIndex]);
                
                if (oldWordInNew !== -1 && (newWordInOld === -1 || oldWordInNew < newWordInOld)) {
                    // Likely an insertion
                    diff.push({ type: 'added', word: newWords[newIndex] });
                    newIndex++;
                } else if (newWordInOld !== -1) {
                    // Likely a deletion
                    diff.push({ type: 'removed', word: oldWords[oldIndex] });
                    oldIndex++;
                } else {
                    // Changed word
                    diff.push({ type: 'removed', word: oldWords[oldIndex] });
                    diff.push({ type: 'added', word: newWords[newIndex] });
                    oldIndex++;
                    newIndex++;
                }
            }
        }
        
        return diff;
    };
    
    const wordDiff = getWordDiff();
    const addedWords = wordDiff.filter(d => d.type === 'added').length;
    const removedWords = wordDiff.filter(d => d.type === 'removed').length;
    const netChange = addedWords - removedWords;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="border-b border-ink-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-semibold text-ink-900">
                                Comparing Versions
                            </h2>
                            <p className="text-sm text-ink-600 mt-1">
                                See how your writing evolved between these two versions
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-ink-400 hover:text-ink-600 text-2xl"
                        >
                            ×
                        </button>
                    </div>

                    {/* Version info */}
                    <div className="mt-4 grid grid-cols-2 gap-6">
                        <div className="bg-ember-50 rounded-lg p-4">
                            <div className="flex items-center space-x-2 mb-2">
                                <span className="text-lg">📝</span>
                                <span className="font-medium text-ember-900">
                                    Version {olderVersion.version}
                                </span>
                                <span className="text-xs text-ember-600 bg-ember-200 px-2 py-1 rounded">
                                    Earlier
                                </span>
                            </div>
                            <p className="text-sm text-ember-800">{olderVersion.title}</p>
                            <p className="text-xs text-ember-600 mt-1">
                                {format(new Date(olderVersion.createdAt), "MMM d, h:mm a")} • {olderVersion.metadata.wordCount} words
                            </p>
                        </div>
                        
                        <div className="bg-branch-50 rounded-lg p-4">
                            <div className="flex items-center space-x-2 mb-2">
                                <span className="text-lg">✨</span>
                                <span className="font-medium text-branch-900">
                                    Version {newerVersion.version}
                                </span>
                                <span className="text-xs text-branch-600 bg-branch-200 px-2 py-1 rounded">
                                    Later
                                </span>
                            </div>
                            <p className="text-sm text-branch-800">{newerVersion.title}</p>
                            <p className="text-xs text-branch-600 mt-1">
                                {format(new Date(newerVersion.createdAt), "MMM d, h:mm a")} • {newerVersion.metadata.wordCount} words
                            </p>
                        </div>
                    </div>

                    {/* Change summary */}
                    <div className="mt-4 flex items-center justify-center space-x-6 text-sm">
                        <div className="flex items-center space-x-2">
                            <span className="w-3 h-3 bg-branch-500 rounded"></span>
                            <span className="text-branch-700">+{addedWords} words added</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className="w-3 h-3 bg-ember-500 rounded"></span>
                            <span className="text-ember-700">-{removedWords} words removed</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className="text-ink-600">
                                Net change: {netChange >= 0 ? '+' : ''}{netChange} words
                            </span>
                        </div>
                    </div>

                    {/* View mode toggle */}
                    <div className="mt-4 flex justify-center">
                        <div className="flex bg-ink-100 rounded-lg p-1">
                            <button
                                onClick={() => setViewMode('side-by-side')}
                                className={`px-3 py-2 text-sm rounded-md transition-all ${
                                    viewMode === 'side-by-side'
                                        ? 'bg-white text-ink-900 shadow-sm'
                                        : 'text-ink-600 hover:text-ink-900'
                                }`}
                            >
                                Side by Side
                            </button>
                            <button
                                onClick={() => setViewMode('unified')}
                                className={`px-3 py-2 text-sm rounded-md transition-all ${
                                    viewMode === 'unified'
                                        ? 'bg-white text-ink-900 shadow-sm'
                                        : 'text-ink-600 hover:text-ink-900'
                                }`}
                            >
                                Unified View
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content comparison */}
                <div className="overflow-auto max-h-[60vh]">
                    {viewMode === 'side-by-side' ? (
                        <div className="grid grid-cols-2 h-full">
                            {/* Older version */}
                            <div className="p-6 border-r border-ink-200">
                                <h3 className="text-sm font-medium text-ember-700 mb-4">
                                    Version {olderVersion.version} (Earlier)
                                </h3>
                                <div 
                                    className="prose prose-sm max-w-none text-ink-800"
                                    dangerouslySetInnerHTML={{ __html: olderVersion.content }}
                                />
                            </div>
                            
                            {/* Newer version */}
                            <div className="p-6">
                                <h3 className="text-sm font-medium text-branch-700 mb-4">
                                    Version {newerVersion.version} (Later)
                                </h3>
                                <div 
                                    className="prose prose-sm max-w-none text-ink-800"
                                    dangerouslySetInnerHTML={{ __html: newerVersion.content }}
                                />
                            </div>
                        </div>
                    ) : (
                        /* Unified diff view */
                        <div className="p-6">
                            <h3 className="text-sm font-medium text-ink-700 mb-4">
                                Changes from Version {olderVersion.version} to {newerVersion.version}
                            </h3>
                            <div className="prose prose-sm max-w-none leading-relaxed">
                                {wordDiff.map((item, index) => (
                                    <span
                                        key={index}
                                        className={`${
                                            item.type === 'added'
                                                ? 'bg-branch-100 text-branch-900 px-1 rounded'
                                                : item.type === 'removed'
                                                ? 'bg-ember-100 text-ember-900 line-through px-1 rounded'
                                                : ''
                                        }`}
                                    >
                                        {item.word}{' '}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-ink-200 p-4 bg-ink-50">
                    <div className="text-center">
                        <p className="text-xs text-ink-500">
                            💡 <strong>Tip:</strong> Use version comparisons to understand your writing process and see how your ideas develop over time.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};