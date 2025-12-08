'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { USER_SETTINGS_LOCALE } from '@/constants';
import type { Language } from '@/types';

interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  isDarkMode?: boolean;
  language?: Language;
}

export const UserSettingsModal: React.FC<UserSettingsModalProps> = ({
  isOpen,
  onClose,
  user,
  isDarkMode = true,
  language = 'en'
}) => {
  const router = useRouter();
  const supabase = createClient();
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Get localized text based on language
  const t = USER_SETTINGS_LOCALE[language];

  // Fetch profile data from profiles table when modal opens
  React.useEffect(() => {
    if (isOpen && user) {
      const fetchProfile = async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('display_name, avatar_url')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          return;
        }

        if (data) {
          setDisplayName(data.display_name || '');
          setAvatarUrl(data.avatar_url || '');
        }
      };

      fetchProfile();
    }
  }, [isOpen, user, supabase]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('[Upload] Starting file upload...');
    const file = e.target.files?.[0];
    if (!file) {
      console.log('[Upload] No file selected');
      return;
    }

    console.log('[Upload] File selected:', file.name, file.type, file.size);

    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.log('[Upload] Invalid file type');
      setMessage(t.uploadFailed);
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      console.log('[Upload] File too large');
      setMessage(t.fileTooLarge);
      return;
    }

    console.log('[Upload] Setting isUploading to true');
    setIsUploading(true);
    setMessage(t.uploading);

    try {
      // Upload via API route instead of direct client upload
      console.log('[Upload] Uploading via API route...');

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/user/avatar', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      console.log('[Upload] API response:', result);

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      console.log('[Upload] ✅ Upload successful!');
      console.log('[Upload] 🔗 Public URL:', result.url);

      // Set avatar URL immediately
      setAvatarUrl(result.url);
      setMessage(t.uploadSuccess);

    } catch (error: any) {
      console.error('[Upload] Error uploading image:', error);
      setMessage(error.message || t.uploadError);
    } finally {
      console.log('[Upload] Setting isUploading to false');
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    console.log('[UserSettingsModal] handleSave called', {
      displayName,
      avatarUrl,
      userId: user.id,
      isUploading
    });

    setIsLoading(true);
    setMessage('');

    try {
      console.log('[UserSettingsModal] Calling API to update profile...');
      console.log('[UserSettingsModal] Update payload:', {
        display_name: displayName,
        avatar_url: avatarUrl
      });

      // Call API route to update profile
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          display_name: displayName,
          avatar_url: avatarUrl
        })
      });

      console.log('[UserSettingsModal] API response status:', response.status);

      const result = await response.json();
      console.log('[UserSettingsModal] API response data:', result);

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update profile');
      }

      console.log('[UserSettingsModal] Save successful!');
      setMessage(t.saveSuccess);

      // Dispatch event to notify other components with the updated data
      console.log('[UserSettingsModal] Dispatching profileUpdated event with data:', {
        display_name: displayName,
        avatar_url: avatarUrl
      });
      window.dispatchEvent(new CustomEvent('profileUpdated', {
        detail: {
          display_name: displayName,
          avatar_url: avatarUrl
        }
      }));

      setTimeout(() => {
        console.log('[UserSettingsModal] Closing modal');
        onClose();
      }, 1000);
    } catch (error) {
      console.error('[UserSettingsModal] Error updating profile:', error);
      setMessage(t.saveFailed);
    } finally {
      console.log('[UserSettingsModal] Setting isLoading to false');
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    console.log('[UserSettingsModal] Sign out initiated');

    // Fire and forget - don't wait for the API response
    supabase.auth.signOut().catch(err => {
      console.error('[UserSettingsModal] Sign out API error (ignored):', err);
    });

    // Close modal and redirect
    onClose();
    console.log('[UserSettingsModal] Redirecting to sign in...');
    router.push('/auth/signin');
    router.refresh();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 ${isDarkMode ? 'bg-black/80' : 'bg-black/50'}`}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative w-full max-w-md rounded-2xl p-6 ${
          isDarkMode
            ? 'bg-[#1C1C1E] border border-[#2C2C2E]'
            : 'bg-white border border-zinc-200'
        }`}
      >
        {/* Header */}
        <div className="relative flex items-center justify-center mb-6">
          <h2
            className={`font-bold ${
              isDarkMode ? 'text-[#EDEDED]' : 'text-zinc-900'
            }`}
            style={{ fontSize: '14px', letterSpacing: '0.25em' }}
          >
            {t.title}
          </h2>
          <button
            onClick={onClose}
            className={`absolute right-0 p-2 rounded-full transition-colors ${
              isDarkMode
                ? 'hover:bg-[#2C2C2E] text-zinc-500'
                : 'hover:bg-zinc-100 text-zinc-600'
            }`}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Email (Read-only) */}
          <div>
            <label
              className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-zinc-400' : 'text-zinc-600'
              }`}
            >
              {t.email}
            </label>
            <div
              className={`w-full px-4 py-2 rounded-lg border text-sm ${
                isDarkMode
                  ? 'bg-[#0A0A0A] border-[#2C2C2E] text-zinc-500'
                  : 'bg-zinc-50 border-zinc-300 text-zinc-500'
              }`}
            >
              {user.email}
            </div>
          </div>

          {/* Display Name */}
          <div>
            <label
              className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-zinc-400' : 'text-zinc-600'
              }`}
            >
              {t.displayName}
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={t.displayNamePlaceholder}
              className={`w-full px-4 py-2 rounded-lg border outline-none transition-colors text-sm ${
                isDarkMode
                  ? 'bg-[#0A0A0A] border-[#2C2C2E] text-[#EDEDED] placeholder-zinc-600 focus:border-[#FCD34D]'
                  : 'bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-[#B45309]'
              }`}
            />
          </div>

          {/* Avatar Section */}
          <div>
            <label
              className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-zinc-400' : 'text-zinc-600'
              }`}
            >
              {t.avatar}
            </label>

            {/* Upload Button */}
            <div className="flex gap-2 mb-2">
              <input
                type="file"
                id="avatar-upload"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <label
                htmlFor="avatar-upload"
                className={`flex-1 px-4 py-2 rounded-lg border text-center cursor-pointer transition-colors text-sm ${
                  isUploading ? 'opacity-50 cursor-not-allowed' : ''
                } ${
                  isDarkMode
                    ? 'bg-[#FCD34D]/20 border-[#FCD34D]/30 text-[#FCD34D] hover:bg-[#FCD34D]/30'
                    : 'bg-[#B45309]/20 border-[#B45309]/30 text-[#B45309] hover:bg-[#B45309]/30'
                }`}
              >
                {isUploading ? t.uploading : t.uploadImage}
              </label>
            </div>

            {/* Avatar URL Input */}
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => {
                setAvatarUrl(e.target.value);
                // Reset uploading state when user manually enters URL
                if (isUploading) {
                  setIsUploading(false);
                  setMessage('');
                }
              }}
              placeholder={t.pasteUrlPlaceholder}
              className={`w-full px-4 py-2 rounded-lg border outline-none transition-colors text-sm ${
                isDarkMode
                  ? 'bg-[#0A0A0A] border-[#2C2C2E] text-[#EDEDED] placeholder-zinc-600 focus:border-[#FCD34D]'
                  : 'bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-[#B45309]'
              }`}
            />
            <p
              className={`text-sm mt-1 ${
                isDarkMode ? 'text-zinc-500' : 'text-zinc-500'
              }`}
            >
              {t.uploadHint}
            </p>
          </div>

          {/* Preview */}
          {(displayName || avatarUrl) && (
            <div
              className={`p-4 rounded-lg border ${
                isDarkMode ? 'bg-[#0A0A0A] border-[#2C2C2E]' : 'bg-zinc-50 border-zinc-200'
              }`}
            >
              <p
                className={`text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-zinc-400' : 'text-zinc-600'
                }`}
              >
                {t.preview}
              </p>
              <div className="flex items-center gap-3">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar preview"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isDarkMode ? 'bg-[#1C1C1E] text-[#EDEDED]' : 'bg-zinc-200 text-zinc-700'
                    }`}
                  >
                    <span className="text-sm font-medium">
                      {displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                    </span>
                  </div>
                )}
                <span
                  className={`text-sm ${
                    isDarkMode ? 'text-[#EDEDED]' : 'text-zinc-900'
                  }`}
                >
                  {displayName || user.email}
                </span>
              </div>
            </div>
          )}

          {/* Message */}
          {message && (
            <p
              className={`text-sm text-center ${
                message.includes('success')
                  ? 'text-green-500'
                  : isDarkMode
                  ? 'text-red-400'
                  : 'text-red-600'
              }`}
            >
              {message}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className={`flex-1 px-4 py-2 rounded-lg border transition-colors text-sm ${
                isDarkMode
                  ? 'bg-transparent border-[#2C2C2E] text-[#EDEDED] hover:bg-[#1C1C1E]'
                  : 'bg-zinc-100 border-zinc-300 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              {t.cancel}
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading || isUploading}
              className={`flex-1 px-4 py-2 rounded-lg transition-colors text-sm ${
                (isLoading || isUploading)
                  ? 'opacity-50 cursor-not-allowed'
                  : ''
              } ${
                isDarkMode
                  ? 'bg-[#FCD34D]/20 border border-[#FCD34D]/30 text-[#FCD34D] hover:bg-[#FCD34D]/30'
                  : 'bg-[#B45309]/20 border border-[#B45309]/30 text-[#B45309] hover:bg-[#B45309]/30'
              }`}
            >
              {isLoading ? t.saving : isUploading ? t.uploading : t.save}
            </button>
          </div>

          {/* Sign Out Button */}
          <div className="pt-4 mt-4 border-t border-opacity-20" style={{ borderColor: isDarkMode ? '#2C2C2E' : '#E5E7EB' }}>
            <button
              onClick={handleSignOut}
              className={`w-full px-4 py-2 rounded-lg border transition-colors text-sm ${
                isDarkMode
                  ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
                  : 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
              }`}
            >
              {t.signOut}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
