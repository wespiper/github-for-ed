import { VersionTimeline } from "./VersionTimeline";

// This is a wrapper component specifically for the sidebar panel
interface VersionTimelinePanelProps {
    versions?: any[];
    currentVersion?: number;
    onVersionSelect?: (version: number) => void;
    onCompareVersions?: (version1: number, version2: number) => void;
    loading?: boolean;
}

export const VersionTimelinePanel = ({
    versions = [],
    currentVersion = 1,
    onVersionSelect = () => {},
    onCompareVersions = () => {},
    loading = false,
}: VersionTimelinePanelProps) => {
    // If no versions provided, use mock data for demonstration
    const mockVersions = [
        {
            id: "1",
            version: 3,
            title: "Latest Draft",
            content: `Recent writing session with expanded ideas and better flow.`,
            author: { firstName: "Student", lastName: "Writer" },
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
            changeSummary: "+25 words, refined ideas",
            createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
        {
            id: "2",
            version: 2,
            title: "Second Draft",
            content: `Expanded version with more detailed examples and better structure.`,
            author: { firstName: "Student", lastName: "Writer" },
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
            changeSummary: "+40 words added",
            createdAt: new Date(Date.now() - 7200000).toISOString(),
        },
        {
            id: "3",
            version: 1,
            title: "Initial Draft",
            content: `First attempt at the assignment with basic ideas outlined.`,
            author: { firstName: "Student", lastName: "Writer" },
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
            changeSummary: "Initial draft created",
            createdAt: new Date(Date.now() - 14400000).toISOString(),
        },
    ];

    const displayVersions = versions.length > 0 ? versions : mockVersions;

    return (
        <div className="h-full flex flex-col">
            <div className="flex-1 overflow-auto p-4">
                <VersionTimeline
                    versions={displayVersions}
                    currentVersion={currentVersion}
                    onVersionSelect={onVersionSelect}
                    onCompareVersions={onCompareVersions}
                    loading={loading}
                />
            </div>
        </div>
    );
};