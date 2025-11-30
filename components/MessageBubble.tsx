import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Role, Message } from '@/types';

interface MessageBubbleProps {
  message: Message;
  isDarkMode?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isDarkMode = true }) => {
  const isUser = message.role === Role.USER;

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-8 animate-fade-in`}>
      <div
        className={`
          max-w-[85%] md:max-w-[75%] lg:max-w-[70%]
          rounded-2xl px-6 py-4
          leading-relaxed text-base md:text-lg tracking-wide
          ${isUser
            ? isDarkMode
              ? 'bg-zinc-800 text-zinc-100 border border-zinc-700'
              : 'bg-zinc-100 text-zinc-900 border border-zinc-200'
            : isDarkMode
              ? 'bg-transparent text-zinc-200 border-l-2 border-white pl-6'
              : 'bg-transparent text-zinc-900 border-l-2 border-zinc-900 pl-6'
          }
        `}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className={`
            prose ${isDarkMode ? 'prose-invert' : ''}
            prose-p:my-3
            prose-headings:font-semibold prose-headings:tracking-tight
            ${isDarkMode ? 'prose-headings:text-white' : 'prose-headings:text-zinc-900'}
            ${isDarkMode ? 'prose-strong:text-white' : 'prose-strong:text-zinc-900'}
            ${isDarkMode ? 'prose-blockquote:border-l-white' : 'prose-blockquote:border-l-zinc-900'}
            ${isDarkMode ? 'prose-blockquote:text-zinc-400' : 'prose-blockquote:text-zinc-600'}
            prose-ul:list-disc
            prose-li:marker:text-zinc-500
          `}>
            <ReactMarkdown>
              {message.content}
            </ReactMarkdown>
            {message.isStreaming && (
              <span className="inline-block w-2 h-4 ml-1 bg-zinc-500 animate-pulse align-middle" />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
