import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Role, Message } from '@/types';

interface MessageBubbleProps {
  message: Message;
  isDarkMode?: boolean;
  userName?: string;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isDarkMode = true, userName }) => {
  const isUser = message.role === Role.USER;

  return (
    <div className="flex flex-col gap-2 mb-8 w-full">
      {/* Name label - script style */}
      <div className={`text-xs uppercase tracking-wider font-semibold ${
        isUser
          ? isDarkMode ? 'text-zinc-500' : 'text-zinc-600'
          : isDarkMode ? 'text-[#FFBF00]' : 'text-amber-600'
      }`}>
        {isUser ? (userName || 'You') : 'Resonance'}
      </div>

      {/* Message content */}
      <div className={`
        max-w-none
        ${isUser
          ? isDarkMode
            ? 'text-zinc-400 font-normal'
            : 'text-zinc-600 font-normal'
          : isDarkMode
            ? 'text-[#EDEDED] font-medium'
            : 'text-zinc-900 font-medium'
        }
      `}>
        {isUser ? (
          <p className="whitespace-pre-wrap leading-[1.75] text-base">{message.content}</p>
        ) : (
          <div className={`
            prose prose-lg max-w-none
            ${isDarkMode ? 'prose-invert' : ''}
            prose-p:my-3 prose-p:leading-[1.75]
            prose-headings:font-semibold prose-headings:tracking-tight
            ${isDarkMode ? 'prose-headings:text-[#EDEDED]' : 'prose-headings:text-zinc-900'}
            ${isDarkMode ? 'prose-strong:text-[#EDEDED]' : 'prose-strong:text-zinc-900'}
            ${isDarkMode ? 'prose-blockquote:border-l-[#FFBF00]' : 'prose-blockquote:border-l-amber-600'}
            ${isDarkMode ? 'prose-blockquote:text-zinc-400' : 'prose-blockquote:text-zinc-600'}
            prose-ul:list-disc
            prose-li:marker:text-zinc-500
          `}>
            <ReactMarkdown>
              {message.content}
            </ReactMarkdown>
            {message.isStreaming && (
              <span className="inline-block w-2 h-4 ml-1 bg-[#FFBF00] animate-pulse align-middle" />
            )}
          </div>
        )}
      </div>

      {/* Divider line */}
      <div className={`h-px w-full mt-2 ${
        isDarkMode ? 'bg-zinc-800' : 'bg-zinc-200'
      }`} />
    </div>
  );
};
