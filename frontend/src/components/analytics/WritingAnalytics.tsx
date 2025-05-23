import { useState } from "react";
import { useDocumentVersions } from "@/hooks/useDocuments";

interface AnalyticsProps {
    documentId: string;
    currentWordCount: number;
    totalVersions: number;
}

interface WritingPattern {
    date: string;
    wordsAdded: number;
    wordsDeleted: number;
    netChange: number;
    sessionDuration: number;
}

export const WritingAnalytics = ({
    documentId,
    currentWordCount,
    totalVersions,
}: AnalyticsProps) => {
    const [timeRange, setTimeRange] = useState<"week" | "month" | "all">(
        "week"
    );
    const { data: versions, isLoading } = useDocumentVersions(documentId, 50);

    if (isLoading) {
        return (
            <div className="animate-pulse space-y-4">
                <div className="h-4 bg-ink-200 rounded w-1/3"></div>
                <div className="h-32 bg-ink-200 rounded"></div>
            </div>
        );
    }

    if (!versions || versions.length === 0) {
        return (
            <div className="text-center py-8">
                <div className="text-4xl mb-2">📊</div>
                <p className="text-ink-600">No analytics data available yet.</p>
                <p className="text-sm text-ink-500">
                    Start writing to see your progress!
                </p>
            </div>
        );
    }

    // Calculate writing patterns
    const calculateWritingPatterns = (): WritingPattern[] => {
        const patterns: WritingPattern[] = [];
        const now = new Date();
        let cutoffDate: Date;

        switch (timeRange) {
            case "week":
                cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case "month":
                cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            default:
                cutoffDate = new Date(0); // All time
        }

        const filteredVersions = versions.filter(
            (v) => new Date(v.createdAt) >= cutoffDate
        );

        // Group by date
        const dateGroups = new Map<string, typeof filteredVersions>();

        filteredVersions.forEach((version) => {
            const date = new Date(version.createdAt).toDateString();
            if (!dateGroups.has(date)) {
                dateGroups.set(date, []);
            }
            dateGroups.get(date)!.push(version);
        });

        // Calculate daily patterns
        dateGroups.forEach((dayVersions, date) => {
            const totalAdded = dayVersions.reduce(
                (sum, v) => sum + v.changes.addedWords,
                0
            );
            const totalDeleted = dayVersions.reduce(
                (sum, v) => sum + v.changes.deletedWords,
                0
            );
            const netChange = totalAdded - totalDeleted;

            // Estimate session duration (time between first and last version of the day)
            const times = dayVersions
                .map((v) => new Date(v.createdAt).getTime())
                .sort();
            const sessionDuration =
                times.length > 1
                    ? (times[times.length - 1] - times[0]) / 1000 / 60
                    : 0;

            patterns.push({
                date,
                wordsAdded: totalAdded,
                wordsDeleted: totalDeleted,
                netChange,
                sessionDuration,
            });
        });

        return patterns.sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
    };

    const writingPatterns = calculateWritingPatterns();

    // Calculate summary statistics
    const totalWordsAdded = writingPatterns.reduce(
        (sum, p) => sum + p.wordsAdded,
        0
    );
    const totalWordsDeleted = writingPatterns.reduce(
        (sum, p) => sum + p.wordsDeleted,
        0
    );
    const totalNetChange = writingPatterns.reduce(
        (sum, p) => sum + p.netChange,
        0
    );
    const averageSessionDuration =
        writingPatterns.length > 0
            ? writingPatterns.reduce((sum, p) => sum + p.sessionDuration, 0) /
              writingPatterns.length
            : 0;

    const mostProductiveDay = writingPatterns.reduce(
        (max, current) => (current.wordsAdded > max.wordsAdded ? current : max),
        writingPatterns[0] || {
            date: "",
            wordsAdded: 0,
            wordsDeleted: 0,
            netChange: 0,
            sessionDuration: 0,
        }
    );

    // Calculate writing consistency
    const activeDays = writingPatterns.filter((p) => p.wordsAdded > 0).length;
    const totalDays = Math.max(
        1,
        Math.ceil(
            (new Date().getTime() -
                new Date(
                    versions[versions.length - 1]?.createdAt || 0
                ).getTime()) /
                (24 * 60 * 60 * 1000)
        )
    );
    const consistencyScore = Math.round((activeDays / totalDays) * 100);

    return (
        <div className="space-y-6">
            {/* Header with time range selector */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-ink-900">
                    Writing Analytics
                </h3>
                <div className="flex space-x-2">
                    {(["week", "month", "all"] as const).map((range) => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`px-3 py-1 text-sm rounded-md ${
                                timeRange === range
                                    ? "bg-scribe-100 text-scribe-700"
                                    : "text-ink-600 hover:bg-ink-100"
                            }`}
                        >
                            {range === "all" ? "All Time" : `Past ${range}`}
                        </button>
                    ))}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-branch-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-branch-600">
                        Words Added
                    </div>
                    <div className="text-2xl font-bold text-branch-900">
                        {totalWordsAdded}
                    </div>
                </div>
                <div className="bg-ember-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-ember-600">
                        Words Deleted
                    </div>
                    <div className="text-2xl font-bold text-ember-900">
                        {totalWordsDeleted}
                    </div>
                </div>
                <div className="bg-scribe-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-scribe-600">
                        Net Change
                    </div>
                    <div
                        className={`text-2xl font-bold ${
                            totalNetChange >= 0
                                ? "text-scribe-900"
                                : "text-ember-900"
                        }`}
                    >
                        {totalNetChange >= 0 ? "+" : ""}
                        {totalNetChange}
                    </div>
                </div>
                <div className="bg-highlight-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-highlight-600">
                        Avg Session
                    </div>
                    <div className="text-2xl font-bold text-highlight-900">
                        {Math.round(averageSessionDuration)}m
                    </div>
                </div>
            </div>

            {/* Writing Patterns Chart */}
            <div className="bg-white border rounded-lg p-6">
                <h4 className="text-md font-semibold text-ink-900 mb-4">
                    Daily Writing Activity
                </h4>

                {writingPatterns.length === 0 ? (
                    <div className="text-center py-8 text-ink-500">
                        No writing activity in the selected time range.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {writingPatterns.map((pattern, index) => (
                            <div
                                key={index}
                                className="flex items-center space-x-4"
                            >
                                <div className="w-24 text-sm text-ink-600">
                                    {new Date(pattern.date).toLocaleDateString(
                                        "en-US",
                                        {
                                            month: "short",
                                            day: "numeric",
                                        }
                                    )}
                                </div>

                                {/* Words added bar */}
                                <div className="flex-1">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-20 text-xs text-branch-600">
                                            +{pattern.wordsAdded}
                                        </div>
                                        <div className="flex-1 bg-ink-100 rounded-full h-2">
                                            <div
                                                className="bg-branch-500 h-2 rounded-full transition-all duration-300"
                                                style={{
                                                    width: `${Math.min(
                                                        100,
                                                        (pattern.wordsAdded /
                                                            Math.max(
                                                                ...writingPatterns.map(
                                                                    (p) =>
                                                                        p.wordsAdded
                                                                )
                                                            )) *
                                                            100
                                                    )}%`,
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Words deleted bar */}
                                    {pattern.wordsDeleted > 0 && (
                                        <div className="flex items-center space-x-2 mt-1">
                                            <div className="w-20 text-xs text-ember-600">
                                                -{pattern.wordsDeleted}
                                            </div>
                                            <div className="flex-1 bg-ink-100 rounded-full h-2">
                                                <div
                                                    className="bg-ember-500 h-2 rounded-full transition-all duration-300"
                                                    style={{
                                                        width: `${Math.min(
                                                            100,
                                                            (pattern.wordsDeleted /
                                                                Math.max(
                                                                    ...writingPatterns.map(
                                                                        (p) =>
                                                                            p.wordsDeleted
                                                                    )
                                                                )) *
                                                                100
                                                        )}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="w-16 text-xs text-ink-500 text-right">
                                    {pattern.sessionDuration > 0
                                        ? `${Math.round(
                                              pattern.sessionDuration
                                          )}m`
                                        : ""}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Insights */}
            <div className="bg-white border rounded-lg p-6">
                <h4 className="text-md font-semibold text-ink-900 mb-4">
                    Writing Insights
                </h4>
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-ink-600">
                            Writing Consistency
                        </span>
                        <div className="flex items-center space-x-2">
                            <div className="w-20 bg-ink-200 rounded-full h-2">
                                <div
                                    className={`h-2 rounded-full ${
                                        consistencyScore >= 70
                                            ? "bg-branch-500"
                                            : consistencyScore >= 40
                                            ? "bg-highlight-500"
                                            : "bg-ember-500"
                                    }`}
                                    style={{ width: `${consistencyScore}%` }}
                                />
                            </div>
                            <span className="text-sm font-medium">
                                {consistencyScore}%
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-sm text-ink-600">
                            Total Versions
                        </span>
                        <span className="text-sm font-medium">
                            {totalVersions}
                        </span>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-sm text-ink-600">
                            Current Word Count
                        </span>
                        <span className="text-sm font-medium">
                            {currentWordCount}
                        </span>
                    </div>

                    {mostProductiveDay.wordsAdded > 0 && (
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-ink-600">
                                Most Productive Day
                            </span>
                            <span className="text-sm font-medium">
                                {new Date(
                                    mostProductiveDay.date
                                ).toLocaleDateString()}
                                <span className="text-branch-600 ml-1">
                                    ({mostProductiveDay.wordsAdded} words)
                                </span>
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Writing Journey Insights */}
            <div className="bg-gradient-to-r from-scribe-50 to-highlight-50 border border-scribe-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-scribe-900 mb-4 flex items-center">
                    <span className="mr-2">🚀</span>
                    Your Writing Journey
                </h4>
                
                {/* Achievement badges */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                    {totalWordsAdded >= 1000 && (
                        <div className="bg-white rounded-lg p-3 text-center border border-branch-200">
                            <div className="text-2xl mb-1">🏆</div>
                            <div className="text-xs font-medium text-branch-700">Milestone Writer</div>
                            <div className="text-xs text-branch-600">1,000+ words</div>
                        </div>
                    )}
                    {consistencyScore >= 70 && (
                        <div className="bg-white rounded-lg p-3 text-center border border-scribe-200">
                            <div className="text-2xl mb-1">🔥</div>
                            <div className="text-xs font-medium text-scribe-700">Consistent Writer</div>
                            <div className="text-xs text-scribe-600">{consistencyScore}% consistency</div>
                        </div>
                    )}
                    {averageSessionDuration >= 30 && (
                        <div className="bg-white rounded-lg p-3 text-center border border-highlight-200">
                            <div className="text-2xl mb-1">⏰</div>
                            <div className="text-xs font-medium text-highlight-700">Deep Writer</div>
                            <div className="text-xs text-highlight-600">{Math.round(averageSessionDuration)}min sessions</div>
                        </div>
                    )}
                    {totalWordsDeleted > totalWordsAdded * 0.2 && (
                        <div className="bg-white rounded-lg p-3 text-center border border-ember-200">
                            <div className="text-2xl mb-1">✂️</div>
                            <div className="text-xs font-medium text-ember-700">Thoughtful Editor</div>
                            <div className="text-xs text-ember-600">Careful revision</div>
                        </div>
                    )}
                </div>

                {/* Personalized writing tips */}
                <div className="bg-white rounded-lg p-4 border border-scribe-200">
                    <h5 className="text-sm font-semibold text-scribe-900 mb-2">
                        💡 Personalized Writing Insights
                    </h5>
                    <div className="text-sm text-scribe-800 space-y-2">
                        {consistencyScore < 40 && (
                            <div className="flex items-start space-x-2">
                                <span className="text-highlight-500 mt-0.5">📅</span>
                                <div>
                                    <strong>Build a routine:</strong> Try writing for just 10 minutes each day. 
                                    Small, consistent efforts lead to big improvements over time.
                                </div>
                            </div>
                        )}
                        {averageSessionDuration < 15 && totalWordsAdded > 100 && (
                            <div className="flex items-start space-x-2">
                                <span className="text-branch-500 mt-0.5">⏱️</span>
                                <div>
                                    <strong>Try longer sessions:</strong> You're making good progress! 
                                    Consider 20-30 minute writing sessions to get into a deeper flow state.
                                </div>
                            </div>
                        )}
                        {totalWordsDeleted > totalWordsAdded * 0.3 && (
                            <div className="flex items-start space-x-2">
                                <span className="text-scribe-500 mt-0.5">✨</span>
                                <div>
                                    <strong>Great revision skills:</strong> You're thoughtfully editing your work. 
                                    This shows you're developing as a writer!
                                </div>
                            </div>
                        )}
                        {mostProductiveDay.wordsAdded > 200 && (
                            <div className="flex items-start space-x-2">
                                <span className="text-branch-500 mt-0.5">🎯</span>
                                <div>
                                    <strong>Peak performance:</strong> Your best day was {new Date(mostProductiveDay.date).toLocaleDateString()} 
                                    with {mostProductiveDay.wordsAdded} words. What made that day special?
                                </div>
                            </div>
                        )}
                        {totalWordsAdded === 0 && (
                            <div className="flex items-start space-x-2">
                                <span className="text-highlight-500 mt-0.5">🌟</span>
                                <div>
                                    <strong>Ready to begin:</strong> Every great writer started with a blank page. 
                                    Start writing and watch your ideas come to life!
                                </div>
                            </div>
                        )}
                        {totalWordsAdded >= 500 && consistencyScore >= 50 && (
                            <div className="flex items-start space-x-2">
                                <span className="text-branch-500 mt-0.5">🚀</span>
                                <div>
                                    <strong>You're on fire:</strong> Great consistency and word count! 
                                    You're developing strong writing habits that will serve you well.
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Writing growth visualization */}
                {writingPatterns.length > 2 && (
                    <div className="mt-4 bg-white rounded-lg p-4 border border-scribe-200">
                        <h5 className="text-sm font-semibold text-scribe-900 mb-3">
                            📈 Your Writing Growth
                        </h5>
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                                <div className="text-2xl font-bold text-branch-600">
                                    {Math.round((totalWordsAdded / writingPatterns.length) * 10) / 10}
                                </div>
                                <div className="text-xs text-ink-600">Avg words/day</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-highlight-600">
                                    {Math.round(averageSessionDuration)}m
                                </div>
                                <div className="text-xs text-ink-600">Avg session</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-scribe-600">
                                    {activeDays}
                                </div>
                                <div className="text-xs text-ink-600">Active days</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
