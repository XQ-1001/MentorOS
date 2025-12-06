'use client';

import React from 'react';

interface ResonanceWaveProps {
  isDarkMode?: boolean;
}

export const ResonanceWave: React.FC<ResonanceWaveProps> = ({ isDarkMode = true }) => {
  return (
    <div className="flex flex-col gap-2 mb-8 w-full">
      {/* RESONANCE label */}
      <div className={`flex items-center gap-2 text-base uppercase tracking-wider font-semibold font-serif ${isDarkMode ? 'text-[#D4B483]' : 'text-[#854D0E]'}`}>
        <svg
          width="16"
          height="16"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`concentric-icon-small flex-shrink-0 ${isDarkMode ? 'opacity-80' : ''}`}
        >
          {/* Outer circle - dotted */}
          <circle cx="10" cy="10" r="8.5" className="circle-outer-small" stroke={isDarkMode ? "#D4B483" : "#854D0E"} strokeWidth="1.5" fill="none" strokeDasharray="1.5 2.5" />
          {/* Middle circle - dotted */}
          <circle cx="10" cy="10" r="5.5" className="circle-middle-small" stroke={isDarkMode ? "#D4B483" : "#854D0E"} strokeWidth="1.5" fill="none" strokeDasharray="1.5 2.5" />
          {/* Inner circle - dotted */}
          <circle cx="10" cy="10" r="2.5" className="circle-inner-small" stroke={isDarkMode ? "#D4B483" : "#854D0E"} strokeWidth="1.5" fill="none" strokeDasharray="1.5 2" />
          {/* Center dot - solid */}
          <circle cx="10" cy="10" r="1" fill={isDarkMode ? "#D4B483" : "#854D0E"} className="center-dot-small" />
        </svg>
        Resonance
      </div>

      {/* Loading animation - larger concentric circles below the label */}
      <div className="ml-6 py-2">
        <svg
          width="48"
          height="48"
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="concentric-circles"
        >
          {/* Outer circle - dotted */}
          <circle cx="24" cy="24" r="20" className="circle-outer" stroke={isDarkMode ? "#D4B483" : "#854D0E"} strokeWidth="2" fill="none" strokeDasharray="2 3" />
          {/* Middle circle - dotted */}
          <circle cx="24" cy="24" r="13" className="circle-middle" stroke={isDarkMode ? "#D4B483" : "#854D0E"} strokeWidth="2" fill="none" strokeDasharray="2 3" />
          {/* Inner circle - dotted */}
          <circle cx="24" cy="24" r="6" className="circle-inner" stroke={isDarkMode ? "#D4B483" : "#854D0E"} strokeWidth="2" fill="none" strokeDasharray="1.5 2.5" />
          {/* Center dot - solid */}
          <circle cx="24" cy="24" r="2" fill={isDarkMode ? "#D4B483" : "#854D0E"} className="center-dot" />
        </svg>
      </div>

      {/* Divider line */}
      <div className={`h-px w-full mt-2 ${
        isDarkMode ? 'bg-[#0A0A0A]' : 'bg-white'
      }`} />

      <style jsx>{`
        /* Small icon in label */}
        .concentric-icon-small {
          animation: rotate-icon-small 8s linear infinite;
        }

        .circle-outer-small {
          animation: pulse-circle-small 2s ease-in-out infinite;
        }

        .circle-middle-small {
          animation: pulse-circle-small 2s ease-in-out infinite 0.3s;
        }

        .circle-inner-small {
          animation: pulse-circle-small 2s ease-in-out infinite 0.6s;
        }

        .center-dot-small {
          animation: pulse-dot-small 2s ease-in-out infinite;
        }

        @keyframes rotate-icon-small {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes pulse-circle-small {
          0%, 100% {
            opacity: 0.3;
            stroke-width: 1;
          }
          50% {
            opacity: 1;
            stroke-width: 2;
          }
        }

        @keyframes pulse-dot-small {
          0%, 100% {
            opacity: 0.6;
          }
          50% {
            opacity: 1;
          }
        }

        /* Large loading animation */
        .concentric-circles {
          animation: rotate 8s linear infinite;
        }

        .circle-outer {
          animation: pulse-circle 2s ease-in-out infinite;
          transform-origin: center;
        }

        .circle-middle {
          animation: pulse-circle 2s ease-in-out infinite 0.3s;
          transform-origin: center;
        }

        .circle-inner {
          animation: pulse-circle 2s ease-in-out infinite 0.6s;
          transform-origin: center;
        }

        .center-dot {
          animation: pulse-dot 2s ease-in-out infinite;
        }

        @keyframes rotate {
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
            stroke-width: 1.5;
          }
          50% {
            opacity: 1;
            stroke-width: 2.5;
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
    </div>
  );
};
