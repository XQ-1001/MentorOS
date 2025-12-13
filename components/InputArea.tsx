
import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';

interface InputAreaProps {
  onSend: (message: string) => void;
  onAbort: () => void;
  isLoading: boolean;
  isDarkMode?: boolean;
}

export interface InputAreaRef {
  restoreInput: (text: string) => void;
}

export const InputArea = forwardRef<InputAreaRef, InputAreaProps>(({ onSend, onAbort, isLoading, isDarkMode = true }, ref) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Expose restoreInput method to parent component
  useImperativeHandle(ref, () => ({
    restoreInput: (text: string) => {
      setInput(text);
      // Focus and adjust height after state update
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          adjustHeight();
        }
      }, 0);
    }
  }));

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Check if desktop (lg breakpoint)
      const isDesktop = window.innerWidth >= 1024;

      if (isDesktop) {
        // Desktop: normal auto-resize
        textarea.style.height = 'auto';
        const newHeight = Math.min(textarea.scrollHeight, 150);
        textarea.style.height = `${newHeight}px`;
      } else {
        // Mobile: fixed 32px for single line, expand for multiple lines
        textarea.style.height = '32px';
        if (textarea.scrollHeight > 32) {
          textarea.style.lineHeight = '1.4';
          const newHeight = Math.min(textarea.scrollHeight, 150);
          textarea.style.height = `${newHeight}px`;
        } else {
          textarea.style.lineHeight = '32px';
        }
      }
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
    <div className={`fixed bottom-0 left-0 right-0 backdrop-blur-lg py-1.5 lg:pt-4 lg:pb-2 transition-all duration-300 lg:left-64 ${isDarkMode ? 'bg-[#0A0A0A]/90' : 'bg-zinc-50/90'}`}>
      <style>{`
        @keyframes placeholderPulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        .input-with-pulse-dark::placeholder {
          color: rgb(113, 113, 122);
          animation: placeholderPulse 2.5s ease-in-out infinite;
        }
        .input-with-pulse-light::placeholder {
          color: rgb(161, 161, 170);
          animation: placeholderPulse 2.5s ease-in-out infinite;
        }
      `}</style>
      <div className="max-w-5xl mx-auto px-4 relative">
        <div className={`relative flex items-end gap-1.5 lg:gap-2 border rounded-3xl p-1.5 lg:p-2 focus-within:ring-1 transition-all duration-300 ${isDarkMode ? 'bg-[#1C1C1E]/50 border-[#D4B483]/70 focus-within:ring-[#D4B483]/70' : 'bg-zinc-100 border-[#854D0E]/70 focus-within:ring-[#854D0E]/70'}`}>
            <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Awaiting your signal..."
                className={`w-full bg-transparent resize-none outline-none py-0 lg:py-3 px-3 lg:px-4 max-h-[150px] h-[32px] lg:min-h-[52px] leading-[32px] lg:leading-[1.75] text-sm lg:text-base ${isDarkMode ? 'text-[#C5C6C7] input-with-pulse-dark' : 'text-zinc-900 input-with-pulse-light'}`}
                rows={1}
                disabled={isLoading}
            />
            <button
                onClick={isLoading ? onAbort : handleSubmit}
                disabled={!isLoading && !input.trim()}
                className={`mb-0.5 lg:mb-1.5 mr-0.5 lg:mr-1.5 p-1.5 lg:p-2 rounded-full transition-all duration-200 flex-shrink-0 ${
                    isLoading
                        ? isDarkMode ? 'bg-[#D4B483] text-[#0A0A0A] hover:bg-[#FCD34D]' : 'bg-[#854D0E] text-white hover:bg-[#B45309]'
                        : !input.trim()
                        ? isDarkMode ? 'bg-[#D4B483]/20 text-[#D4B483]/40 cursor-not-allowed' : 'bg-[#854D0E]/20 text-[#854D0E]/40 cursor-not-allowed'
                        : isDarkMode ? 'bg-[#D4B483] text-[#0A0A0A] hover:bg-[#FCD34D]' : 'bg-[#854D0E] text-white hover:bg-[#B45309]'
                }`}
                title={isLoading ? '中止 / Abort' : '发送 / Send'}
            >
                {isLoading ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="6" y="6" width="12" height="12" rx="1"></rect>
                    </svg>
                ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="19" x2="12" y2="5"></line>
                        <polyline points="5 12 12 5 19 12"></polyline>
                    </svg>
                )}
            </button>
        </div>
        {/* Hide decorative text on mobile, show only on desktop */}
        <p className="hidden lg:block text-center text-xs uppercase tracking-[0.2em] mt-8 mb-1 transition-colors" style={{ color: 'rgba(113, 113, 122, 0.5)' }}>
            RESONANCE LAB // MODEL: VISIONARY // V1.0
        </p>
      </div>
    </div>
  );
});

InputArea.displayName = 'InputArea';
