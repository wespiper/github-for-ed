import { useState, useRef, useCallback } from "react";

type SplitMode = 'single' | 'editor-versions' | 'editor-feedback' | 'editor-context' | 'editor-comparison';

interface SplitPanelContainerProps {
    mode: SplitMode;
    leftPanel: React.ReactNode;
    rightPanel?: React.ReactNode;
    resizable?: boolean;
    defaultSplitRatio?: number; // 0-1, default 0.6
    minLeftWidth?: number;
    minRightWidth?: number;
    className?: string;
}

export const SplitPanelContainer = ({
    mode,
    leftPanel,
    rightPanel,
    resizable = true,
    defaultSplitRatio = 0.6,
    minLeftWidth = 300,
    minRightWidth = 300,
    className = "",
}: SplitPanelContainerProps) => {
    const [splitRatio, setSplitRatio] = useState(defaultSplitRatio);
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (!resizable || mode === 'single') return;
        
        e.preventDefault();
        setIsDragging(true);
        
        const handleMouseMove = (e: MouseEvent) => {
            if (!containerRef.current) return;
            
            const containerRect = containerRef.current.getBoundingClientRect();
            const newRatio = (e.clientX - containerRect.left) / containerRect.width;
            
            // Apply constraints
            const containerWidth = containerRect.width;
            const minLeftRatio = minLeftWidth / containerWidth;
            const maxLeftRatio = (containerWidth - minRightWidth) / containerWidth;
            
            const constrainedRatio = Math.max(minLeftRatio, Math.min(maxLeftRatio, newRatio));
            setSplitRatio(constrainedRatio);
        };
        
        const handleMouseUp = () => {
            setIsDragging(false);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }, [resizable, mode, minLeftWidth, minRightWidth]);

    // Single panel mode
    if (mode === 'single' || !rightPanel) {
        return (
            <div className={`flex-1 h-full ${className}`}>
                {leftPanel}
            </div>
        );
    }

    // Split panel mode
    return (
        <div 
            ref={containerRef}
            className={`flex h-full ${className} ${isDragging ? 'select-none' : ''}`}
        >
            {/* Left Panel */}
            <div 
                className="h-full overflow-hidden"
                style={{ width: `${splitRatio * 100}%` }}
            >
                {leftPanel}
            </div>

            {/* Resizer */}
            {resizable && (
                <div
                    className={`w-1 bg-ink-200 hover:bg-scribe-400 cursor-col-resize transition-colors group relative ${
                        isDragging ? 'bg-scribe-500' : ''
                    }`}
                    onMouseDown={handleMouseDown}
                >
                    {/* Visual indicator */}
                    <div className="absolute inset-y-0 -left-1 -right-1 group-hover:bg-scribe-400/20 transition-colors" />
                    
                    {/* Resize handle dots */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex flex-col space-y-1">
                            <div className="w-1 h-1 bg-scribe-600 rounded-full" />
                            <div className="w-1 h-1 bg-scribe-600 rounded-full" />
                            <div className="w-1 h-1 bg-scribe-600 rounded-full" />
                        </div>
                    </div>
                </div>
            )}

            {/* Right Panel */}
            <div 
                className="h-full overflow-hidden"
                style={{ width: `${(1 - splitRatio) * 100}%` }}
            >
                {rightPanel}
            </div>
        </div>
    );
};

// Layout mode helpers
export const splitModeConfigs = {
    single: {
        description: "Single editor view",
        showRightPanel: false,
    },
    'editor-versions': {
        description: "Editor with version comparison",
        showRightPanel: true,
        defaultRatio: 0.6,
    },
    'editor-feedback': {
        description: "Editor with feedback panel",
        showRightPanel: true,
        defaultRatio: 0.7,
    },
    'editor-context': {
        description: "Editor with context information",
        showRightPanel: true,
        defaultRatio: 0.65,
    },
    'editor-comparison': {
        description: "Side-by-side version comparison",
        showRightPanel: true,
        defaultRatio: 0.5,
    },
} as const;