import React from 'react';
import { APP_NAME, APP_SUBTITLE } from '@/constants';
import { Language } from '@/types';
import { useSession, signOut } from 'next-auth/react';

interface HeaderProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  isDarkMode: boolean;
  onThemeToggle: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  language,
  onLanguageChange,
  isDarkMode,
  onThemeToggle
}) => {
  const { data: session } = useSession();

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b h-16 flex items-center justify-between px-4 md:px-8 transition-colors duration-300 ${isDarkMode ? 'bg-zinc-950/90 border-zinc-800' : 'bg-zinc-50/90 border-zinc-200'}`}>
        {/* User Info */}
        <div className="flex items-center gap-2">
            {session?.user && (
                <>
                    {session.user.image ? (
                        <img src={session.user.image} alt={session.user.name || 'User'} className="w-8 h-8 rounded-full" />
                    ) : (
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-200 text-zinc-700'}`}>
                            <span className="text-sm font-medium">
                                {session.user.email?.[0].toUpperCase()}
                            </span>
                        </div>
                    )}
                    <span className={`text-sm hidden md:block ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>
                        {session.user.name || session.user.email}
                    </span>
                </>
            )}
        </div>

        <div className="flex flex-col items-center absolute left-1/2 transform -translate-x-1/2">
            <h1 className={`text-xl font-semibold tracking-tighter transition-colors ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>{APP_NAME}</h1>
            <span className={`text-xs uppercase tracking-[0.2em] ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>{APP_SUBTITLE}</span>
        </div>

        <div className="flex items-center gap-3 md:gap-4 z-10 ml-auto">
            {/* Language Selector */}
            <div className="relative group">
                <select
                    value={language}
                    onChange={(e) => onLanguageChange(e.target.value as Language)}
                    className={`appearance-none border text-xs md:text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-zinc-500 cursor-pointer transition-colors ${isDarkMode ? 'bg-zinc-900/50 hover:bg-zinc-800 border-zinc-700 text-zinc-300' : 'bg-zinc-100 hover:bg-zinc-200 border-zinc-300 text-zinc-700'}`}
                >
                    <option value="zh">中文</option>
                    <option value="en">English</option>
                </select>
            </div>

            {/* Theme Toggle */}
            <button
                onClick={onThemeToggle}
                className={`p-2 rounded-full transition-colors border border-transparent ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700' : 'hover:bg-zinc-200 text-zinc-600 hover:text-zinc-900 hover:border-zinc-300'}`}
                aria-label="Toggle Theme"
            >
                {isDarkMode ? (
                    // Moon Icon (Night)
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                    </svg>
                ) : (
                    // Sun Icon (Day)
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

            {/* Sign Out Button */}
            {session && (
                <button
                    onClick={() => signOut()}
                    className={`px-3 py-1.5 text-xs md:text-sm rounded-lg border transition-colors ${isDarkMode ? 'bg-zinc-900/50 hover:bg-zinc-800 border-zinc-700 text-zinc-300' : 'bg-zinc-100 hover:bg-zinc-200 border-zinc-300 text-zinc-700'}`}
                >
                    Sign Out
                </button>
            )}
        </div>
    </header>
  );
};
