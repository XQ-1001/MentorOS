'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { APP_SUBTITLE } from '@/constants';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { UserSettingsModal } from './UserSettingsModal';

interface HeaderProps {
  isDarkMode: boolean;
  onThemeToggle: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isDarkMode,
  onThemeToggle
}) => {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<{ name?: string; avatar_url?: string } | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Fetch user profile from profiles table
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      console.log('[Header] fetchProfile called for user:', userId);
      console.log('[Header] Starting Supabase query...');

      const { data, error } = await supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('id', userId)
        .single();

      console.log('[Header] Query completed');
      console.log('[Header] Data:', data);
      console.log('[Header] Error:', error);

      if (error) {
        console.error('[Header] Error fetching profile:', error);
        return;
      }

      console.log('[Header] Profile data received:', data);
      if (data) {
        // Map display_name to name for consistency
        const newProfile = {
          name: data.display_name,
          avatar_url: data.avatar_url
        };
        console.log('[Header] Setting profile to:', newProfile);
        setProfile(newProfile);
      } else {
        console.warn('[Header] No profile data returned');
      }
    } catch (err) {
      console.error('[Header] Exception in fetchProfile:', err);
    }
  }, [supabase]);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        await fetchProfile(user.id);
      }
    };
    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const sessionUser = session?.user ?? null;
      setUser(sessionUser);

      if (sessionUser) {
        await fetchProfile(sessionUser.id);
      } else {
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, fetchProfile]);

  // Separate effect for profile update listener that depends on user
  useEffect(() => {
    const handleProfileUpdate = (event: Event) => {
      console.log('[Header] profileUpdated event received');
      const customEvent = event as CustomEvent;
      const eventData = customEvent.detail;
      console.log('[Header] Event data:', eventData);

      if (eventData && eventData.display_name !== undefined) {
        // Use data from event directly instead of fetching
        console.log('[Header] Using data from event');
        const newProfile = {
          name: eventData.display_name,
          avatar_url: eventData.avatar_url
        };
        console.log('[Header] Setting profile to:', newProfile);
        setProfile(newProfile);
      } else if (user) {
        // Fallback: fetch from database if no data in event
        console.log('[Header] No data in event, fetching from database...');
        fetchProfile(user.id);
      }
    };

    console.log('[Header] Adding profileUpdated event listener');
    window.addEventListener('profileUpdated', handleProfileUpdate);

    return () => {
      console.log('[Header] Removing profileUpdated event listener');
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, [user, fetchProfile]);

  const handleSignOut = async () => {
    console.log('[Header] Sign out initiated');

    // Fire and forget - don't wait for the API response
    supabase.auth.signOut().catch(err => {
      console.error('[Header] Sign out API error (ignored):', err);
    });

    // Immediately redirect without waiting
    console.log('[Header] Redirecting to sign in...');
    router.push('/auth/signin');
    router.refresh();
  };

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b h-20 flex items-center justify-between px-2 md:px-3 transition-all duration-300 ${isDarkMode ? 'bg-[#0A0A0A]/90 border-[#2C2C2E]' : 'bg-zinc-50/90 border-zinc-200'}`}>
        {/* App Title - Left */}
        <div className="flex items-center gap-2">
            {/* Dotted concentric circles icon - static */}
            <svg
                width="18"
                height="18"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                {/* Outer circle - dotted */}
                <circle cx="10" cy="10" r="8.5" stroke={isDarkMode ? "#FCD34D" : "#B45309"} strokeWidth="1.5" fill="none" strokeDasharray="1.5 2.5" />
                {/* Middle circle - dotted */}
                <circle cx="10" cy="10" r="5.5" stroke={isDarkMode ? "#FCD34D" : "#B45309"} strokeWidth="1.5" fill="none" strokeDasharray="1.5 2.5" />
                {/* Inner circle - dotted */}
                <circle cx="10" cy="10" r="2.5" stroke={isDarkMode ? "#FCD34D" : "#B45309"} strokeWidth="1.5" fill="none" strokeDasharray="1.5 2" />
                {/* Center dot - solid */}
                <circle cx="10" cy="10" r="1" fill={isDarkMode ? "#FCD34D" : "#B45309"} />
            </svg>

            {/* Brand name with gradient */}
            <div className="flex items-center text-[18px] leading-none">
                <span className={`font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-br ${
                    isDarkMode
                        ? 'from-[#FCD34D] via-[#EDEDED] to-[#999999]'
                        : 'from-[#B45309] via-[#4B5563] to-[#1F2937]'
                }`}>
                    Resonance
                </span>
                <span className={`ml-1 font-serif italic ${
                    isDarkMode
                        ? 'text-zinc-300 font-light'
                        : 'text-gray-800 font-medium'
                }`}>
                    Lab.
                </span>
            </div>
        </div>

        {/* Subtitle - Center */}
        <div className="absolute left-1/2 transform -translate-x-1/2">
            <span className={`text-xs uppercase tracking-[0.2em] !leading-none !m-0 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>{APP_SUBTITLE}</span>
        </div>

        <div className="flex items-center gap-3 md:gap-4 z-10">
            {/* Theme Toggle */}
            <button
                onClick={onThemeToggle}
                className={`p-2 rounded-full transition-colors border border-transparent ${isDarkMode ? 'hover:bg-[#1C1C1E] text-zinc-500 hover:text-[#EDEDED] hover:border-[#2C2C2E]' : 'hover:bg-zinc-200 text-zinc-600 hover:text-zinc-900 hover:border-zinc-300'}`}
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
            {user && (
                <button
                    onClick={handleSignOut}
                    className={`px-3 py-1.5 text-xs md:text-sm rounded-lg border transition-colors ${isDarkMode ? 'bg-[#1C1C1E]/50 hover:bg-[#1C1C1E] border-[#2C2C2E] text-[#EDEDED]' : 'bg-zinc-100 hover:bg-zinc-200 border-zinc-300 text-zinc-700'}`}
                >
                    Sign Out
                </button>
            )}

            {/* User Info - Avatar and Name (Right) */}
            {user && (
                <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="flex items-center gap-2 transition-opacity hover:opacity-80"
                    aria-label="User Settings"
                >
                    {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt={profile?.name || 'User'} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-[#1C1C1E] text-[#EDEDED]' : 'bg-zinc-200 text-zinc-700'}`}>
                            <span className="text-sm font-medium">
                                {profile?.name?.[0]?.toUpperCase() || user.email?.[0].toUpperCase()}
                            </span>
                        </div>
                    )}
                    <span className={`text-sm hidden md:block ${isDarkMode ? 'text-[#EDEDED]' : 'text-zinc-700'}`}>
                        {profile?.name || user.email}
                    </span>
                </button>
            )}
        </div>
    </header>

    {/* Settings Modal */}
    {user && (
        <UserSettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            user={user}
            isDarkMode={isDarkMode}
        />
    )}
    </>
  );
};
