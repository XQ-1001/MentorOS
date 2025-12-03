
import React, { useState, useRef, useEffect } from 'react';
import { MENTOR_NAME } from '@/constants';

interface InputAreaProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  isDarkMode?: boolean;
}

export const InputArea: React.FC<InputAreaProps> = ({ onSend, isLoading, isDarkMode = true }) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (!input.trim() || isLoading) return;
    onSend(input);
    setInput('');
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.focus();
    }
  };

  return (
    <div className={`fixed bottom-0 left-0 right-0 backdrop-blur-lg pt-4 pb-8 border-t transition-colors duration-300 ${isDarkMode ? 'bg-zinc-950/90 border-zinc-800' : 'bg-zinc-50/90 border-zinc-200'}`}>
      <div className="max-w-5xl mx-auto px-4 relative">
        <div className={`relative flex items-end gap-2 border rounded-3xl p-2 focus-within:ring-1 transition-all duration-300 ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800 focus-within:ring-zinc-600' : 'bg-zinc-100 border-zinc-200 focus-within:ring-zinc-400'}`}>
            <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Ask ${MENTOR_NAME}...`}
                className={`w-full bg-transparent resize-none outline-none py-3 px-4 max-h-[150px] min-h-[52px] leading-relaxed transition-colors ${isDarkMode ? 'text-zinc-100 placeholder-zinc-500' : 'text-zinc-900 placeholder-zinc-400'}`}
                rows={1}
                disabled={isLoading}
            />
            <button
                onClick={handleSubmit}
                disabled={!input.trim() || isLoading}
                className={`mb-1.5 mr-1.5 p-2 rounded-full transition-all duration-200 flex-shrink-0 ${
                    !input.trim() || isLoading
                        ? isDarkMode ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed' : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                        : isDarkMode ? 'bg-white text-black hover:bg-zinc-200' : 'bg-black text-white hover:bg-zinc-800'
                }`}
            >
                {isLoading ? (
                     <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="19" x2="12" y2="5"></line>
                        <polyline points="5 12 12 5 19 12"></polyline>
                    </svg>
                )}
            </button>
        </div>
        <p className="text-center text-[10px] text-zinc-500 mt-3 font-mono transition-colors">
            RESONANCE // JOBS MODEL // V1.0
        </p>
      </div>
    </div>
  );
};
