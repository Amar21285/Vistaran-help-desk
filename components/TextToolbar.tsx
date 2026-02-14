import React from 'react';

interface TextToolbarProps {
    textareaRef: React.RefObject<HTMLTextAreaElement | null>;
    value: string;
    onChange: (newValue: string) => void;
}

const TextToolbar: React.FC<TextToolbarProps> = ({ textareaRef, value, onChange }) => {
    const applyFormat = (prefix: string, suffix: string) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = value.substring(start, end);
        const before = value.substring(0, start);
        const after = value.substring(end);

        const newValue = `${before}${prefix}${selectedText}${suffix}${after}`;
        onChange(newValue);

        // Reset focus and selection
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + prefix.length, end + prefix.length);
        }, 0);
    };

    return (
        <div className="flex items-center gap-1 mb-1 p-1 bg-slate-50 dark:bg-slate-900/50 rounded-t-lg border-x border-t border-slate-300 dark:border-slate-600">
            <button
                type="button"
                onClick={() => applyFormat('**', '**')}
                className="p-2 w-9 h-9 flex items-center justify-center rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
                title="Bold (Ctrl+B)"
            >
                <i className="fas fa-bold"></i>
            </button>
            <button
                type="button"
                onClick={() => applyFormat('_', '_')}
                className="p-2 w-9 h-9 flex items-center justify-center rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
                title="Italic (Ctrl+I)"
            >
                <i className="fas fa-italic"></i>
            </button>
            <button
                type="button"
                onClick={() => applyFormat('<u>', '</u>')}
                className="p-2 w-9 h-9 flex items-center justify-center rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
                title="Underline (Ctrl+U)"
            >
                <i className="fas fa-underline"></i>
            </button>
            <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-1"></div>
            <button
                type="button"
                onClick={() => applyFormat('- ', '')}
                className="p-2 w-9 h-9 flex items-center justify-center rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
                title="Bullet List"
            >
                <i className="fas fa-list-ul"></i>
            </button>
        </div>
    );
};

export default TextToolbar;