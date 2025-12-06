'use client';

import React from 'react';

interface ResonanceWaveProps {
  isDarkMode?: boolean;
}

export const ResonanceWave: React.FC<ResonanceWaveProps> = ({ isDarkMode = true }) => {
  return (
    <div className="relative py-8 mb-8 w-full h-0">
      <div className="fixed inset-0 lg:left-64 flex items-center justify-center pointer-events-none z-40">
        {/* Concentric circles animation - centered in conversation area */}
        <svg
          width="48"
          height="48"
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="concentric-circles"
        >
        {/* Outer circle - dotted */}
        <circle cx="24" cy="24" r="20" className="circle-outer" stroke={isDarkMode ? "#FCD34D" : "#B45309"} strokeWidth="2" fill="none" strokeDasharray="2 3" />
        {/* Middle circle - dotted */}
        <circle cx="24" cy="24" r="13" className="circle-middle" stroke={isDarkMode ? "#FCD34D" : "#B45309"} strokeWidth="2" fill="none" strokeDasharray="2 3" />
        {/* Inner circle - dotted */}
        <circle cx="24" cy="24" r="6" className="circle-inner" stroke={isDarkMode ? "#FCD34D" : "#B45309"} strokeWidth="2" fill="none" strokeDasharray="1.5 2.5" />
        {/* Center dot - solid */}
        <circle cx="24" cy="24" r="2" fill={isDarkMode ? "#FCD34D" : "#B45309"} className="center-dot" />
      </svg>
      </div>

      <style jsx>{`
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
