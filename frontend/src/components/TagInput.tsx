import { X } from 'lucide-react';
import { useState, useRef } from 'react';

interface TagInputProps {
    value: string[];
    onChange: (tags: string[]) => void;
    placeholder?: string;
}

export function TagInput({ value = [], onChange, placeholder = 'Add tags...' }: TagInputProps) {
    const [input, setInput] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const addTag = (tag: string) => {
        const trimmed = tag.trim();
        if (trimmed && !value.includes(trimmed)) {
            onChange([...value, trimmed]);
        }
        setInput('');
    };

    const removeTag = (tagToRemove: string) => {
        onChange(value.filter(t => t !== tagToRemove));
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addTag(input);
        } else if (e.key === 'Backspace' && !input && value.length > 0) {
            removeTag(value[value.length - 1]);
        }
    };

    return (
        <div className="w-full">
            <div className="flex flex-wrap gap-2 p-2 border rounded-lg bg-white dark:bg-gray-800 min-h-[42px]">
                {value.map((tag, index) => (
                    <span
                        key={index}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded text-sm"
                    >
                        {tag}
                        <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </span>
                ))}
                <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={() => input && addTag(input)}
                    placeholder={value.length === 0 ? placeholder : ''}
                    className="flex-1 min-w-[120px] outline-none bg-transparent"
                />
            </div>
            <p className="text-xs text-gray-500 mt-1">Press Enter or comma to add a tag</p>
        </div>
    );
}
