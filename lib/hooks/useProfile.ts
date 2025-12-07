import { useState, useEffect, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

export interface Profile {
  name?: string;
  avatar_url?: string;
}

/**
 * Custom hook to manage user profile data from the profiles table.
 * Provides automatic syncing with database and event-based updates.
 *
 * @param user - The authenticated user object
 * @returns Profile data with name and avatar_url
 */
export function useProfile(user: User | null) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  // Fetch profile from database
  const fetchProfile = useCallback(async (userId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('[useProfile] Error fetching profile:', error);
        setProfile(null);
        return;
      }

      if (data) {
        setProfile({
          name: data.display_name,
          avatar_url: data.avatar_url
        });
      } else {
        setProfile(null);
      }
    } catch (err) {
      console.error('[useProfile] Exception in fetchProfile:', err);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  // Fetch profile when user changes
  useEffect(() => {
    if (user) {
      fetchProfile(user.id);
    } else {
      setProfile(null);
    }
  }, [user, fetchProfile]);

  // Listen for profile update events
  useEffect(() => {
    const handleProfileUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      const eventData = customEvent.detail;

      if (eventData && eventData.display_name !== undefined) {
        // Use data from event directly
        setProfile({
          name: eventData.display_name,
          avatar_url: eventData.avatar_url
        });
      } else if (user) {
        // Fallback: fetch from database if no data in event
        fetchProfile(user.id);
      }
    };

    window.addEventListener('profileUpdated', handleProfileUpdate);

    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, [user, fetchProfile]);

  return { profile, isLoading, refetch: fetchProfile };
}
