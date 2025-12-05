import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Role, Message } from '@/types';

interface MessageBubbleProps {
  message: Message;
  isDarkMode?: boolean;
  userName?: string;
  userAvatar?: string;
  userEmail?: string;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isDarkMode = true, userName, userAvatar, userEmail }) => {
  const isUser = message.role === Role.USER;

  return (
    <div className="flex flex-col gap-2 mb-8 w-full">
      {/* Name label - script style */}
      <div className={`flex items-center gap-2 text-base uppercase tracking-wider font-semibold ${
        isUser
          ? isDarkMode ? 'text-zinc-500' : 'text-zinc-600'
          : isDarkMode ? 'text-[#FFBF00]' : 'text-amber-600'
      }`}>
        {!isUser ? (
          <svg
            width="16"
            height="16"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="concentric-icon flex-shrink-0"
          >
            {/* Outer circle - dotted */}
            <circle cx="10" cy="10" r="8.5" className="circle-outer" stroke="#FFBF00" strokeWidth="1.5" fill="none" strokeDasharray="1.5 2.5" />
            {/* Middle circle - dotted */}
            <circle cx="10" cy="10" r="5.5" className="circle-middle" stroke="#FFBF00" strokeWidth="1.5" fill="none" strokeDasharray="1.5 2.5" />
            {/* Inner circle - dotted */}
            <circle cx="10" cy="10" r="2.5" className="circle-inner" stroke="#FFBF00" strokeWidth="1.5" fill="none" strokeDasharray="1.5 2" />
            {/* Center dot - solid */}
            <circle cx="10" cy="10" r="1" fill="#FFBF00" className="center-dot" />
          </svg>
        ) : (
          userAvatar ? (
            <img src={userAvatar} alt={userName || 'User'} className="w-4 h-4 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] ${isDarkMode ? 'bg-[#1C1C1E] text-[#EDEDED]' : 'bg-zinc-200 text-zinc-700'}`}>
              {userName?.[0]?.toUpperCase() || userEmail?.[0]?.toUpperCase() || 'U'}
            </div>
          )
        )}
        {isUser ? (userName || 'You') : 'Resonance'}
      </div>

      <style jsx>{`
        .concentric-icon {
          animation: rotate-icon 8s linear infinite;
        }

        .concentric-icon .circle-outer {
          animation: pulse-circle 2s ease-in-out infinite;
        }

        .concentric-icon .circle-middle {
          animation: pulse-circle 2s ease-in-out infinite 0.3s;
        }

        .concentric-icon .circle-inner {
          animation: pulse-circle 2s ease-in-out infinite 0.6s;
        }

        .concentric-icon .center-dot {
          animation: pulse-dot 2s ease-in-out infinite;
        }

        @keyframes rotate-icon {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes pulse-circle {
          0%, 100% {
            opacity: 0.3;
            stroke-width: 1;
          }
          50% {
            opacity: 1;
            stroke-width: 2;
          }
        }

        @keyframes pulse-dot {
          0%, 100% {
            opacity: 0.6;
          }
          50% {
            opacity: 1;
          }
        }
      `}</style>

      {/* Message content - indented to align with name text (after icon) */}
      <div className={`
        max-w-none
        ml-6
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
              <span className="inline-block w-2 h-4 ml-1 bg-[#0A0A0A] animate-pulse align-middle" />
            )}
          </div>
        )}
      </div>

      {/* Divider line */}
      <div className={`h-px w-full mt-2 ${
        isDarkMode ? 'bg-[#0A0A0A]' : 'bg-zinc-200'
      }`} />
    </div>
  );
};
