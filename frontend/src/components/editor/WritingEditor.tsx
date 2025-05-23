import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import Typography from "@tiptap/extension-typography";
import Focus from "@tiptap/extension-focus";
import { useCallback, useEffect, useState } from "react";

interface WritingEditorProps {
    content: string;
    onUpdate: (content: string) => void;
    onSave?: () => void;
    onVersionCreate?: (content: string, metadata: {
        wordCount: number;
        changeType: 'auto' | 'manual' | 'milestone';
        changeSummary: string;
    }) => void;
    placeholder?: string;
    autoSave?: boolean;
    autoSaveInterval?: number; // in milliseconds
    maxCharacters?: number;
    className?: string;
    editable?: boolean;
}

export const WritingEditor = ({
    content,
    onUpdate,
    onSave,
    onVersionCreate,
    placeholder = "Start writing your story...",
    autoSave = true,
    autoSaveInterval = 30000, // 30 seconds
    maxCharacters = 500000,
    className = "",
    editable = true,
}: WritingEditorProps) => {
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [wordCount, setWordCount] = useState(0);
    const [focusMode, setFocusMode] = useState(false);
    const [writingSession, setWritingSession] = useState({
        startTime: Date.now(),
        lastActivity: Date.now(),
        totalChanges: 0,
    });

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                history: {
                    depth: 100,
                    newGroupDelay: 500,
                },
            }),
            Placeholder.configure({
                placeholder,
                considerAnyAsEmpty: true,
            }),
            CharacterCount.configure({
                limit: maxCharacters,
            }),
            Typography,
            Focus.configure({
                className: "has-focus",
                mode: "all",
            }),
        ],
        content,
        editable,
        onUpdate: ({ editor }) => {
            const newContent = editor.getHTML();
            onUpdate(newContent);
            setHasUnsavedChanges(true);

            // Update word count
            const text = editor.getText();
            const words = text.trim() ? text.trim().split(/\s+/).length : 0;
            const previousWordCount = wordCount;
            setWordCount(words);

            // Update writing session
            setWritingSession(prev => ({
                ...prev,
                lastActivity: Date.now(),
                totalChanges: prev.totalChanges + 1,
            }));

            // Check for milestone version creation
            checkForMilestoneVersion(newContent, words, previousWordCount);
        },
        editorProps: {
            attributes: {
                class: `prose prose-lg max-w-none focus:outline-none ${className}`,
            },
        },
    });

    // Intelligent version creation
    const checkForMilestoneVersion = useCallback((newContent: string, words: number, previousWords: number) => {
        if (!onVersionCreate) return;

        const wordDiff = words - previousWords;
        const sessionDuration = Date.now() - writingSession.startTime;
        
        // Create milestone versions based on writing activity
        let shouldCreateVersion = false;
        let changeType: 'auto' | 'manual' | 'milestone' = 'auto';
        let changeSummary = '';

        // Major writing milestones
        if (wordDiff >= 100) {
            shouldCreateVersion = true;
            changeType = 'milestone';
            changeSummary = `Major writing session: +${wordDiff} words`;
        }
        // Regular milestone every 250 words
        else if (words > 0 && words % 250 === 0 && wordDiff > 0) {
            shouldCreateVersion = true;
            changeType = 'milestone';
            changeSummary = `Writing milestone: ${words} words reached`;
        }
        // Session-based versions (after 15+ minutes of writing)
        else if (sessionDuration > 15 * 60 * 1000 && writingSession.totalChanges > 20) {
            shouldCreateVersion = true;
            changeType = 'auto';
            changeSummary = `Writing session: ${Math.round(sessionDuration / 60000)}min, ${writingSession.totalChanges} changes`;
        }

        if (shouldCreateVersion) {
            onVersionCreate(newContent, {
                wordCount: words,
                changeType,
                changeSummary,
            });
            
            // Reset session tracking
            setWritingSession({
                startTime: Date.now(),
                lastActivity: Date.now(),
                totalChanges: 0,
            });

            // Subtle positive feedback for milestone achievements
            if (changeType === 'milestone') {
                // Could trigger a subtle animation or toast notification
                console.log(`✨ Writing milestone achieved: ${changeSummary}`);
            }
        }
    }, [onVersionCreate, writingSession]);

    // Auto-save functionality
    const handleAutoSave = useCallback(() => {
        if (hasUnsavedChanges && onSave) {
            onSave();
            setHasUnsavedChanges(false);
        }
    }, [hasUnsavedChanges, onSave]);

    // Set up auto-save interval
    useEffect(() => {
        if (!autoSave) return;

        const interval = setInterval(handleAutoSave, autoSaveInterval);
        return () => clearInterval(interval);
    }, [autoSave, autoSaveInterval, handleAutoSave]);

    // Enhanced keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Ctrl/Cmd + S for save
            if ((event.ctrlKey || event.metaKey) && event.key === "s") {
                event.preventDefault();
                handleAutoSave();
            }
            
            // Ctrl/Cmd + Shift + F for focus mode
            if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === "F") {
                event.preventDefault();
                setFocusMode(!focusMode);
            }

            // Ctrl/Cmd + Shift + V for version save
            if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === "V" && onVersionCreate) {
                event.preventDefault();
                onVersionCreate(editor?.getHTML() || '', {
                    wordCount,
                    changeType: 'manual',
                    changeSummary: `Manual save: ${wordCount} words`
                });
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [handleAutoSave, focusMode, onVersionCreate, editor, wordCount]);

    // Update editor content when prop changes
    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            editor.commands.setContent(content, false);
        }
    }, [editor, content]);

    // Calculate reading time (average 200 words per minute)
    const readingTime = Math.ceil(wordCount / 200);

    if (!editor) {
        return (
            <div className="min-h-[500px] bg-ink-50 animate-pulse rounded-lg flex items-center justify-center">
                <div className="text-ink-500">Loading editor...</div>
            </div>
        );
    }

    return (
        <div className="w-full">
            {/* Editor Toolbar */}
            <div className={`border-b border-ink-200 pb-3 mb-4 transition-all duration-300 ${
                focusMode ? "opacity-50 hover:opacity-100" : ""
            }`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() =>
                                editor.chain().focus().toggleBold().run()
                            }
                            className={`px-3 py-1 rounded text-sm font-medium ${
                                editor.isActive("bold")
                                    ? "bg-scribe-100 text-scribe-700"
                                    : "text-ink-700 hover:bg-ink-100"
                            }`}
                        >
                            Bold
                        </button>
                        <button
                            onClick={() =>
                                editor.chain().focus().toggleItalic().run()
                            }
                            className={`px-3 py-1 rounded text-sm font-medium ${
                                editor.isActive("italic")
                                    ? "bg-scribe-100 text-scribe-700"
                                    : "text-ink-700 hover:bg-ink-100"
                            }`}
                        >
                            Italic
                        </button>
                        <button
                            onClick={() =>
                                editor
                                    .chain()
                                    .focus()
                                    .toggleHeading({ level: 2 })
                                    .run()
                            }
                            className={`px-3 py-1 rounded text-sm font-medium ${
                                editor.isActive("heading", { level: 2 })
                                    ? "bg-scribe-100 text-scribe-700"
                                    : "text-ink-700 hover:bg-ink-100"
                            }`}
                        >
                            Heading
                        </button>
                        <button
                            onClick={() =>
                                editor.chain().focus().toggleBulletList().run()
                            }
                            className={`px-3 py-1 rounded text-sm font-medium ${
                                editor.isActive("bulletList")
                                    ? "bg-scribe-100 text-scribe-700"
                                    : "text-ink-700 hover:bg-ink-100"
                            }`}
                        >
                            List
                        </button>
                    </div>

                    <div className="flex items-center flex-wrap gap-2 text-sm text-ink-500">
                        <span>
                            {wordCount} words • {readingTime} min read
                        </span>
                        <span className="hidden sm:block">
                            {editor.storage.characterCount.characters()}/
                            {maxCharacters} characters
                        </span>
                        {writingSession.totalChanges > 0 && (
                            <span className="text-scribe-600 hidden md:block">
                                Session: {Math.round((Date.now() - writingSession.startTime) / 60000)}min
                            </span>
                        )}
                        {autoSave && (
                            <span className="flex items-center space-x-1 text-xs">
                                <div
                                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                                        hasUnsavedChanges
                                            ? "bg-highlight-400 animate-pulse"
                                            : "bg-branch-400"
                                    }`}
                                />
                                <span className="opacity-70">
                                    {hasUnsavedChanges
                                        ? "Saving..."
                                        : "Saved"}
                                </span>
                            </span>
                        )}
                        <button
                            onClick={() => setFocusMode(!focusMode)}
                            className={`px-2 py-1 text-xs rounded transition-colors ${
                                focusMode 
                                    ? "bg-highlight-100 text-highlight-700" 
                                    : "bg-ink-100 text-ink-700 hover:bg-ink-200"
                            }`}
                            title="Toggle focus mode"
                        >
                            {focusMode ? "🎯 Focus" : "👁️ Normal"}
                        </button>
                        {onVersionCreate && (
                            <button
                                onClick={() => onVersionCreate(editor?.getHTML() || '', {
                                    wordCount,
                                    changeType: 'manual',
                                    changeSummary: `Manual save: ${wordCount} words`
                                })}
                                className="px-2 py-1 text-xs bg-scribe-100 text-scribe-700 rounded hover:bg-scribe-200 transition-colors"
                                title="Create version checkpoint"
                            >
                                📌 Save Version
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Editor Content */}
            <div className="min-h-[500px] bg-white border border-ink-200 rounded-lg p-6 focus-within:ring-2 focus-within:ring-scribe-500 focus-within:border-scribe-500">
                <EditorContent editor={editor} />
            </div>

            {/* Character limit warning */}
            {editor.storage.characterCount.characters() >
                maxCharacters * 0.9 && (
                <div className="mt-2 p-2 bg-highlight-50 border border-highlight-200 rounded text-sm text-highlight-800">
                    Warning: You're approaching the character limit.
                    {maxCharacters -
                        editor.storage.characterCount.characters()}{" "}
                    characters remaining.
                </div>
            )}

            {/* Save button for manual saves */}
            {!autoSave && (
                <div className="mt-4 flex justify-end">
                    <button
                        onClick={handleAutoSave}
                        disabled={!hasUnsavedChanges}
                        className="px-4 py-2 bg-scribe-600 text-white rounded-md hover:bg-scribe-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Save Changes
                    </button>
                </div>
            )}
        </div>
    );
};
