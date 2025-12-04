'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { APP_NAME } from '@/constants';

export default function AuthCodeError() {
  const [isDarkMode, setIsDarkMode] = useState(true);

  return (
    <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-zinc-950' : 'bg-zinc-50'}`}>
      <div className={`w-full max-w-md p-8 rounded-2xl border transition-colors ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mb-4 flex justify-center">
            <div className={`p-3 rounded-full ${isDarkMode ? 'bg-red-500/10' : 'bg-red-100'}`}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-red-500"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
          </div>
          <h1 className={`text-2xl font-semibold mb-2 ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>
            Authentication Failed
          </h1>
          <p className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
            {APP_NAME}
          </p>
        </div>

        {/* Error Message */}
        <div className={`mb-6 p-4 rounded-lg border ${isDarkMode ? 'bg-zinc-800/50 border-zinc-700' : 'bg-zinc-50 border-zinc-200'}`}>
          <p className={`text-sm mb-3 ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>
            We couldn't complete your authentication. This could happen if:
          </p>
          <ul className={`text-sm space-y-2 list-disc list-inside ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
            <li>The confirmation link has expired</li>
            <li>The link has already been used</li>
            <li>There was an issue with the OAuth provider</li>
            <li>The authentication code is invalid</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Link href="/auth/signin">
            <button
              className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                isDarkMode
                  ? 'bg-white text-black hover:bg-zinc-200'
                  : 'bg-black text-white hover:bg-zinc-800'
              }`}
            >
              Back to Sign In
            </button>
          </Link>

          <Link href="/">
            <button
              className={`w-full py-2 px-4 rounded-lg border font-medium transition-colors ${
                isDarkMode
                  ? 'bg-zinc-800 border-zinc-700 text-zinc-100 hover:bg-zinc-750'
                  : 'bg-zinc-100 border-zinc-300 text-zinc-900 hover:bg-zinc-200'
              }`}
            >
              Go to Home
            </button>
          </Link>
        </div>

        {/* Help Text */}
        <div className={`mt-6 p-3 rounded-lg ${isDarkMode ? 'bg-zinc-800/30' : 'bg-zinc-100/50'}`}>
          <p className={`text-xs text-center ${isDarkMode ? 'text-zinc-500' : 'text-zinc-600'}`}>
            If you continue to experience issues, please try registering again or contact support.
          </p>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className={`mt-6 mx-auto block p-2 rounded-full transition-colors ${
            isDarkMode ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-200 text-zinc-600'
          }`}
        >
          {isDarkMode ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5"></circle>
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
