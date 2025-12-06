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

  // Custom renderers for ReactMarkdown
  const renderers = {
    strong: ({ children, ...props }: any) => (
      <strong {...props} className={`font-bold tracking-wide ${
        isDarkMode
          ? 'text-white'
          : 'text-black'
      }`}>
        {children}
      </strong>
    ),
    p: ({ children, ...props }: any) => (
      <p {...props} className="my-3 leading-[1.75] last:mb-0">
        {children}
      </p>
    ),
    h1: ({ children, ...props }: any) => (
      <h1 {...props} className={`text-2xl font-semibold tracking-tight mb-4 ${isDarkMode ? 'text-[#EDEDED]' : 'text-zinc-900'}`}>
        {children}
      </h1>
    ),
    h2: ({ children, ...props }: any) => (
      <h2 {...props} className={`text-xl font-semibold tracking-tight mb-3 ${isDarkMode ? 'text-[#EDEDED]' : 'text-zinc-900'}`}>
        {children}
      </h2>
    ),
    h3: ({ children, ...props }: any) => (
      <h3 {...props} className={`text-lg font-semibold tracking-tight mb-3 ${isDarkMode ? 'text-[#EDEDED]' : 'text-zinc-900'}`}>
        {children}
      </h3>
    ),
    blockquote: ({ children, ...props }: any) => (
      <blockquote {...props} className={`border-l-4 pl-4 my-4 ${isDarkMode ? 'border-l-[#FCD34D] text-zinc-400' : 'border-l-[#B45309] text-zinc-600'}`}>
        {children}
      </blockquote>
    ),
    ul: ({ children, ...props }: any) => (
      <ul {...props} className="list-disc pl-6 my-3">
        {children}
      </ul>
    ),
    ol: ({ children, ...props }: any) => (
      <ol {...props} className="list-decimal pl-6 my-3">
        {children}
      </ol>
    ),
    li: ({ children, ...props }: any) => (
      <li {...props} className="marker:text-zinc-500">
        {children}
      </li>
    ),
  };

  return (
    <div className="flex flex-col gap-2 mb-8 w-full">
      {/* Name label - script style */}
      <div className={`flex items-center gap-2 text-base uppercase tracking-wider font-semibold ${
        isUser
          ? isDarkMode ? 'text-zinc-500' : 'text-zinc-600'
          : isDarkMode ? 'text-[#FCD34D]' : 'text-[#B45309]'
      }`}>
        {!isUser ? (
          <svg
            width="16"
            height="16"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`concentric-icon flex-shrink-0 ${isDarkMode ? 'opacity-80' : ''}`}
          >
            {/* Outer circle - dotted */}
            <circle cx="10" cy="10" r="8.5" className="circle-outer" stroke={isDarkMode ? "#FCD34D" : "#B45309"} strokeWidth="1.5" fill="none" strokeDasharray="1.5 2.5" />
            {/* Middle circle - dotted */}
            <circle cx="10" cy="10" r="5.5" className="circle-middle" stroke={isDarkMode ? "#FCD34D" : "#B45309"} strokeWidth="1.5" fill="none" strokeDasharray="1.5 2.5" />
            {/* Inner circle - dotted */}
            <circle cx="10" cy="10" r="2.5" className="circle-inner" stroke={isDarkMode ? "#FCD34D" : "#B45309"} strokeWidth="1.5" fill="none" strokeDasharray="1.5 2" />
            {/* Center dot - solid */}
            <circle cx="10" cy="10" r="1" fill={isDarkMode ? "#FCD34D" : "#B45309"} className="center-dot" />
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
          <div className={`text-lg max-w-none ${
            isDarkMode
              ? 'text-white/85'
              : 'text-black/80'
          }`}>
            <ReactMarkdown components={renderers}>
              {message.content}
            </ReactMarkdown>
            {message.isStreaming && (
              <span className={`inline-block w-2 h-4 ml-1 animate-pulse align-middle ${isDarkMode ? 'bg-[#0A0A0A]' : 'bg-white'}`} />
            )}
          </div>
        )}
      </div>

      {/* Divider line */}
      <div className={`h-px w-full mt-2 ${
        isDarkMode ? 'bg-[#0A0A0A]' : 'bg-white'
      }`} />
    </div>
  );
};
