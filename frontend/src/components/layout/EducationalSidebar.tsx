import { useState } from "react";
import { ChevronLeft, ChevronRight, FileText, Clock, MessageCircle, Brain } from "lucide-react";

interface SidebarPanel {
    id: string;
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    component: React.ComponentType<Record<string, unknown>>;
}

interface EducationalSidebarProps {
    panels: SidebarPanel[];
    defaultActive?: string;
    collapsible?: boolean;
    onActiveChange?: (panelId: string | null) => void;
}

export const EducationalSidebar = ({
    panels,
    defaultActive,
    collapsible = true,
    onActiveChange,
}: EducationalSidebarProps) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [activePanel, setActivePanel] = useState<string | null>(defaultActive || panels[0]?.id || null);

    const handlePanelClick = (panelId: string) => {
        const newActivePanel = activePanel === panelId ? null : panelId;
        setActivePanel(newActivePanel);
        onActiveChange?.(newActivePanel);
    };

    const handleToggleCollapse = () => {
        const newCollapsed = !isCollapsed;
        setIsCollapsed(newCollapsed);
        if (newCollapsed) {
            setActivePanel(null);
            onActiveChange?.(null);
        }
    };

    const activePanelData = panels.find(panel => panel.id === activePanel);

    return (
        <div className={`flex h-full transition-all duration-300 ${
            isCollapsed ? 'w-12' : 'w-80'
        }`}>
            {/* Panel Tabs */}
            <div className="flex flex-col w-12 bg-ink-100 border-r border-ink-200">
                {/* Panel Navigation */}
                <div className="flex-1 py-2">
                    {panels.map((panel) => {
                        const Icon = panel.icon;
                        const isActive = activePanel === panel.id;
                        
                        return (
                            <button
                                key={panel.id}
                                onClick={() => handlePanelClick(panel.id)}
                                className={`w-full h-12 flex items-center justify-center group relative transition-colors ${
                                    isActive
                                        ? 'bg-scribe-100 text-scribe-700'
                                        : 'text-ink-600 hover:bg-ink-200 hover:text-ink-800'
                                }`}
                                title={panel.title}
                            >
                                <Icon className="w-5 h-5" />
                                
                                {/* Active indicator */}
                                {isActive && (
                                    <div className="absolute right-0 top-0 bottom-0 w-1 bg-scribe-600" />
                                )}
                                
                                {/* Tooltip for collapsed state */}
                                {isCollapsed && (
                                    <div className="absolute left-full ml-2 px-2 py-1 bg-ink-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                                        {panel.title}
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Collapse Toggle */}
                {collapsible && (
                    <button
                        onClick={handleToggleCollapse}
                        className="h-12 flex items-center justify-center text-ink-600 hover:bg-ink-200 hover:text-ink-800 transition-colors border-t border-ink-200"
                        title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                        {isCollapsed ? (
                            <ChevronRight className="w-4 h-4" />
                        ) : (
                            <ChevronLeft className="w-4 h-4" />
                        )}
                    </button>
                )}
            </div>

            {/* Panel Content */}
            {!isCollapsed && activePanel && activePanelData && (
                <div className="flex-1 bg-white border-r border-ink-200 overflow-hidden">
                    {/* Panel Header */}
                    <div className="h-12 px-4 border-b border-ink-200 flex items-center">
                        <h2 className="text-sm font-semibold text-ink-900">
                            {activePanelData.title}
                        </h2>
                    </div>

                    {/* Panel Content */}
                    <div className="flex-1 overflow-auto">
                        <activePanelData.component />
                    </div>
                </div>
            )}
        </div>
    );
};

// Default panel configurations
export const defaultEducationalPanels: SidebarPanel[] = [
    {
        id: 'assignment',
        title: 'Assignment Details',
        icon: FileText,
        component: () => <div className="p-4 text-sm text-ink-600">Assignment panel coming soon...</div>
    },
    {
        id: 'journey',
        title: 'Writing Journey',
        icon: Clock,
        component: () => <div className="p-4 text-sm text-ink-600">Version timeline will be moved here...</div>
    },
    {
        id: 'collaboration',
        title: 'Comments & Feedback',
        icon: MessageCircle,
        component: () => <div className="p-4 text-sm text-ink-600">Collaboration panel coming soon...</div>
    },
    {
        id: 'thinking',
        title: 'Thinking Partner',
        icon: Brain,
        component: () => <div className="p-4 text-sm text-ink-600">Bounded AI panel coming soon...</div>
    }
];