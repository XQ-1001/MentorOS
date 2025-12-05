'use client';

import React from 'react';

interface ResonanceWaveProps {
  isDarkMode?: boolean;
}

export const ResonanceWave: React.FC<ResonanceWaveProps> = ({ isDarkMode = true }) => {
  return (
    <div className="flex flex-col gap-2 mb-8 w-full">
      {/* Name label - script style */}
      <div className={`text-xs uppercase tracking-wider font-semibold ${
        isDarkMode ? 'text-[#FFBF00]' : 'text-amber-600'
      }`}>
        Resonance
      </div>

      {/* Wave content */}
      <div className="flex flex-col gap-3">
        {/* Wave bars */}
        <div className="flex items-center gap-2.5 h-12">
          {[0, 1, 2, 3, 4, 5, 6].map((index) => (
            <div
              key={index}
              className="bar w-1 rounded-full bg-[#FFBF00]"
              style={{
                animationDelay: `${index * 0.15}s`
              }}
            />
          ))}
        </div>

        {/* Resonating text */}
        <div className="status-text text-[#FFBF00] text-xs tracking-[0.2em] uppercase">
          Resonating...
        </div>
      </div>

      {/* Divider line */}
      <div className={`h-px w-full mt-2 ${
        isDarkMode ? 'bg-zinc-800' : 'bg-zinc-200'
      }`} />

      <style jsx>{`
        .bar {
          height: 10px;
          opacity: 0.4;
          animation: resonate 1.2s infinite alternate ease-in-out;
        }

        @keyframes resonate {
          0% {
            height: 10px;
            opacity: 0.4;
            box-shadow: 0 0 0px rgba(255, 191, 0, 0);
          }
          100% {
            height: 40px;
            opacity: 1;
            box-shadow: 0 0 15px rgba(255, 191, 0, 0.8);
          }
        }

        .status-text {
          opacity: 0.4;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 0.4;
          }
          50% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};
