import { useState } from "react";
import { EducationalSidebar } from "./EducationalSidebar";
import { SplitPanelContainer } from "./SplitPanelContainer";
import { AssignmentContextPanel, mockAssignmentData } from "@/components/assignment/AssignmentContextPanel";
import { VersionTimelinePanel } from "@/components/editor/VersionTimelinePanel";
import { FileText, Clock, MessageCircle, Brain } from "lucide-react";

type SplitMode = 'single' | 'editor-versions' | 'editor-feedback' | 'editor-context' | 'editor-comparison';

interface EducationalWritingLayoutProps {
    children: React.ReactNode; // Main editor content
    rightPanel?: React.ReactNode;
    splitMode?: SplitMode;
    onSplitModeChange?: (mode: SplitMode) => void;
}

// Placeholder components for future implementation
const CollaborationPanel = () => (
    <div className="p-4 text-center text-ink-600">
        <MessageCircle className="w-8 h-8 mx-auto mb-2 text-ink-400" />
        <h3 className="font-medium text-ink-900 mb-1">Comments & Feedback</h3>
        <p className="text-sm">Collaboration features coming soon...</p>
        <div className="mt-4 space-y-2">
            <div className="text-xs text-ink-500">Planned features:</div>
            <div className="text-xs text-ink-600">• Instructor feedback</div>
            <div className="text-xs text-ink-600">• Peer comments</div>
            <div className="text-xs text-ink-600">• Real-time collaboration</div>
        </div>
    </div>
);

const BoundedAIPanel = () => (
    <div className="p-4 text-center text-ink-600">
        <Brain className="w-8 h-8 mx-auto mb-2 text-ink-400" />
        <h3 className="font-medium text-ink-900 mb-1">Thinking Partner</h3>
        <p className="text-sm">AI assistance with educational boundaries...</p>
        <div className="mt-4 space-y-2">
            <div className="text-xs text-ink-500">Planned features:</div>
            <div className="text-xs text-ink-600">• Reflection prompts</div>
            <div className="text-xs text-ink-600">• Critical thinking questions</div>
            <div className="text-xs text-ink-600">• Bounded AI assistance</div>
        </div>
    </div>
);

export const EducationalWritingLayout = ({
    children,
    rightPanel,
    splitMode = 'single',
    onSplitModeChange,
}: EducationalWritingLayoutProps) => {
    const [, setActiveSidebarPanel] = useState<string | null>('assignment');

    // Define sidebar panels with actual components
    const sidebarPanels = [
        {
            id: 'assignment',
            title: 'Assignment Details',
            icon: FileText,
            component: () => (
                <AssignmentContextPanel
                    assignment={mockAssignmentData.assignment}
                    learningObjectives={mockAssignmentData.learningObjectives}
                    aiBoundaries={mockAssignmentData.aiBoundaries}
                    progress={mockAssignmentData.progress}
                />
            )
        },
        {
            id: 'journey',
            title: 'Writing Journey',
            icon: Clock,
            component: VersionTimelinePanel
        },
        {
            id: 'collaboration',
            title: 'Comments & Feedback',
            icon: MessageCircle,
            component: CollaborationPanel
        },
        {
            id: 'thinking',
            title: 'Thinking Partner',
            icon: Brain,
            component: BoundedAIPanel
        }
    ];

    const handleSidebarChange = (panelId: string | null) => {
        setActiveSidebarPanel(panelId);
        
        // Auto-adjust split mode based on sidebar selection
        if (panelId === 'journey' && splitMode === 'single') {
            onSplitModeChange?.('editor-versions');
        } else if (panelId === 'collaboration' && splitMode === 'single') {
            onSplitModeChange?.('editor-feedback');
        } else if (panelId === 'assignment' && splitMode !== 'single') {
            onSplitModeChange?.('single');
        }
    };

    return (
        <div className="h-screen flex bg-ink-50">
            {/* Left Sidebar */}
            <EducationalSidebar
                panels={sidebarPanels}
                defaultActive="assignment"
                collapsible={true}
                onActiveChange={handleSidebarChange}
            />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Content */}
                <div className="flex-1 overflow-hidden">
                    <SplitPanelContainer
                        mode={splitMode}
                        leftPanel={children}
                        rightPanel={rightPanel}
                        resizable={true}
                        defaultSplitRatio={splitMode === 'editor-comparison' ? 0.5 : 0.65}
                    />
                </div>
            </div>
        </div>
    );
};