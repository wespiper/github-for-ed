import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import Typography from '@tiptap/extension-typography';
import Focus from '@tiptap/extension-focus';
import { useCallback, useEffect, useState } from 'react';

interface WritingEditorProps {
  content: string;
  onUpdate: (content: string) => void;
  onSave?: () => void;
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
  placeholder = "Start writing your story...",
  autoSave = true,
  autoSaveInterval = 30000, // 30 seconds
  maxCharacters = 500000,
  className = "",
  editable = true
}: WritingEditorProps) => {
  const [lastSaved, setLastSaved] = useState<Date>(new Date());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [wordCount, setWordCount] = useState(0);

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
        className: 'has-focus',
        mode: 'all',
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
      setWordCount(words);
    },
    editorProps: {
      attributes: {
        class: `prose prose-lg max-w-none focus:outline-none ${className}`,
      },
    },
  });

  // Auto-save functionality
  const handleAutoSave = useCallback(() => {
    if (hasUnsavedChanges && onSave) {
      onSave();
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
    }
  }, [hasUnsavedChanges, onSave]);

  // Set up auto-save interval
  useEffect(() => {
    if (!autoSave) return;

    const interval = setInterval(handleAutoSave, autoSaveInterval);
    return () => clearInterval(interval);
  }, [autoSave, autoSaveInterval, handleAutoSave]);

  // Manual save on Ctrl+S
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        handleAutoSave();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleAutoSave]);

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
      <div className="min-h-[500px] bg-gray-50 animate-pulse rounded-lg flex items-center justify-center">
        <div className="text-gray-500">Loading editor...</div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Editor Toolbar */}
      <div className="border-b border-gray-200 pb-3 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`px-3 py-1 rounded text-sm font-medium ${
                editor.isActive('bold')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Bold
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`px-3 py-1 rounded text-sm font-medium ${
                editor.isActive('italic')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Italic
            </button>
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={`px-3 py-1 rounded text-sm font-medium ${
                editor.isActive('heading', { level: 2 })
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Heading
            </button>
            <button
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={`px-3 py-1 rounded text-sm font-medium ${
                editor.isActive('bulletList')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              List
            </button>
          </div>

          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span>
              {wordCount} words • {readingTime} min read
            </span>
            <span>
              {editor.storage.characterCount.characters()}/{maxCharacters} characters
            </span>
            {autoSave && (
              <span className="flex items-center space-x-1">
                <div
                  className={`w-2 h-2 rounded-full ${
                    hasUnsavedChanges ? 'bg-yellow-400' : 'bg-green-400'
                  }`}
                />
                <span>
                  {hasUnsavedChanges
                    ? 'Unsaved changes'
                    : `Saved ${lastSaved.toLocaleTimeString()}`}
                </span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Editor Content */}
      <div className="min-h-[500px] bg-white border border-gray-200 rounded-lg p-6 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
        <EditorContent editor={editor} />
      </div>

      {/* Character limit warning */}
      {editor.storage.characterCount.characters() > maxCharacters * 0.9 && (
        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
          Warning: You're approaching the character limit. 
          {maxCharacters - editor.storage.characterCount.characters()} characters remaining.
        </div>
      )}

      {/* Save button for manual saves */}
      {!autoSave && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleAutoSave}
            disabled={!hasUnsavedChanges}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Changes
          </button>
        </div>
      )}
    </div>
  );
};