import { useState } from "react";
import { WritingEditor } from "./WritingEditor";
import { VersionTimeline } from "./VersionTimeline";
import { VersionComparison } from "./VersionComparison";
import { EducationalWritingLayout } from "@/components/layout/EducationalWritingLayout";

// Mock data for testing
const mockVersions = [
    {
        id: "1",
        version: 3,
        title: "Test Document v3",
        content: `<h2>The Magic of Writing</h2><p>Writing is more than just putting words on paper—it's about capturing thoughts, sharing ideas, and connecting with others through the power of language. Every writer begins with a blank page and the courage to fill it with their unique voice.</p><p>The writing process is a journey of discovery. As we write, we often discover what we truly think about a subject. Ideas that seemed clear in our minds become clearer—or sometimes completely change—when we put them into words.</p><p>Good writing takes practice, patience, and persistence. But most importantly, it takes the willingness to be vulnerable and share our authentic selves with the world.</p>`,
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
        content: `<h2>Writing Journey</h2><p>Writing is about capturing thoughts and sharing ideas through language. Every writer begins with a blank page and fills it with their unique voice.</p><p>The writing process is a journey of discovery. As we write, we often discover what we truly think about a subject. Ideas become clearer when we put them into words.</p><p>Good writing takes practice and patience.</p>`,
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
        content: `<h2>First Draft</h2><p>Writing is about capturing thoughts and sharing ideas. Every writer begins with a blank page.</p><p>The writing process is discovery. As we write, we discover what we think.</p>`,
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

type SplitMode = 'single' | 'editor-versions' | 'editor-feedback' | 'editor-context' | 'editor-comparison';

export const EditorTestPage = () => {
    const [content, setContent] = useState(`
    <h2>Welcome to the New Educational Writing Interface</h2>
    <p>This is your personal writing space with a completely redesigned interface architecture:</p>
    <ul>
      <li><strong>Left Sidebar</strong> - Navigate between Assignment Details, Writing Journey, Feedback, and AI Partner</li>
      <li><strong>Split Panels</strong> - Work with multiple contexts side-by-side when needed</li>
      <li><strong>Assignment Context</strong> - See due dates, learning objectives, and AI boundaries</li>
      <li><strong>Flexible Layout</strong> - Interface adapts to your current writing needs</li>
      <li><strong>Educational Focus</strong> - Every feature designed for learning and growth</li>
    </ul>
    <p>This new architecture follows the design principle:</p>
    <blockquote>
      Sophisticated functionality with intuitive interface - like Claude's web interface 
      but designed specifically for educational writing.
    </blockquote>
    <p>Explore the left sidebar panels to see the new flexible layout system in action!</p>
  `);

    const [splitMode, setSplitMode] = useState<SplitMode>('single');
    const [compareVersions, setCompareVersions] = useState<{version1: typeof mockVersions[0], version2: typeof mockVersions[0]} | null>(null);

    const handleContentUpdate = (newContent: string) => {
        setContent(newContent);
    };

    const handleSave = () => {
        console.log("Manual save triggered");
        alert(
            "Document saved! (This is just a test - no actual save occurred)"
        );
    };

    const handleVersionCreate = (newContent: string, metadata: {
        wordCount: number;
        changeType: 'auto' | 'manual' | 'milestone';
        changeSummary: string;
    }) => {
        console.log("Version created:", metadata);
        console.log("Content length:", newContent.length);
        alert(
            `Version created: ${metadata.changeSummary} (This is just a test)`
        );
    };

    const handleVersionSelect = (version: number) => {
        console.log("Selected version:", version);
        const selectedVersion = mockVersions.find(v => v.version === version);
        if (selectedVersion) {
            setContent(selectedVersion.content);
            alert(`Loaded version ${version}: ${selectedVersion.title}`);
        }
    };

    const handleCompareVersions = (version1: number, version2: number) => {
        console.log("Compare versions:", version1, "vs", version2);
        const v1 = mockVersions.find(v => v.version === version1);
        const v2 = mockVersions.find(v => v.version === version2);
        
        if (v1 && v2) {
            setCompareVersions({ version1: v1, version2: v2 });
            setSplitMode('editor-comparison');
        }
    };

    const handleSplitModeChange = (mode: SplitMode) => {
        setSplitMode(mode);
    };

    // Right panel content based on split mode
    const getRightPanel = () => {
        switch (splitMode) {
            case 'editor-versions':
                return (
                    <div className="h-full bg-white border-l border-ink-200">
                        <div className="p-4 border-b border-ink-200">
                            <h3 className="text-sm font-semibold text-ink-900">Version Timeline</h3>
                        </div>
                        <div className="flex-1 overflow-auto">
                            <VersionTimeline
                                versions={mockVersions}
                                currentVersion={3}
                                onVersionSelect={handleVersionSelect}
                                onCompareVersions={handleCompareVersions}
                                loading={false}
                            />
                        </div>
                    </div>
                );
            case 'editor-feedback':
                return (
                    <div className="h-full bg-white border-l border-ink-200 p-4">
                        <h3 className="text-sm font-semibold text-ink-900 mb-4">Comments & Feedback</h3>
                        <p className="text-sm text-ink-600">Collaboration panel coming soon...</p>
                    </div>
                );
            case 'editor-comparison':
                if (compareVersions) {
                    return (
                        <VersionComparison
                            version1={compareVersions.version1}
                            version2={compareVersions.version2}
                            onClose={() => {
                                setCompareVersions(null);
                                setSplitMode('single');
                            }}
                        />
                    );
                }
                return null;
            default:
                return null;
        }
    };

    return (
        <EducationalWritingLayout
            splitMode={splitMode}
            onSplitModeChange={handleSplitModeChange}
            rightPanel={getRightPanel()}
        >
                {/* Main Editor Content */}
                <div className="flex-1 p-6">
                    {/* Instructions for new layout */}
                    <div className="mb-6 bg-gradient-to-r from-scribe-50 to-branch-50 border border-scribe-200 rounded-lg p-4 text-sm">
                        <h2 className="font-semibold text-scribe-900 mb-2">🎉 New Architecture Implemented!</h2>
                        <div className="text-scribe-800 space-y-1">
                            <p><strong>Left Sidebar:</strong> Click the icons to explore Assignment Details, Writing Journey, Comments, and AI Partner</p>
                            <p><strong>Split Panels:</strong> Panels will automatically open in split view when relevant</p>
                            <p><strong>Resizable:</strong> Drag the divider between panels to resize</p>
                            <p><strong>Like Claude's Interface:</strong> Flexible, sophisticated, but intuitive</p>
                        </div>
                    </div>

                    <WritingEditor
                        content={content}
                        onUpdate={handleContentUpdate}
                        onSave={handleSave}
                        onVersionCreate={handleVersionCreate}
                        placeholder="Start writing to test the new educational interface architecture..."
                        autoSave={true}
                        autoSaveInterval={3000}
                        maxCharacters={50000}
                        className=""
                        editable={true}
                    />
                </div>
        </EducationalWritingLayout>
    );
};
