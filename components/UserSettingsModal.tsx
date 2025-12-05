'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  isDarkMode?: boolean;
}

export const UserSettingsModal: React.FC<UserSettingsModalProps> = ({
  isOpen,
  onClose,
  user,
  isDarkMode = true
}) => {
  const supabase = createClient();
  const [displayName, setDisplayName] = useState(user.user_metadata?.name || '');
  const [avatarUrl, setAvatarUrl] = useState(user.user_metadata?.avatar_url || '');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsLoading(true);
    setMessage('');

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          name: displayName,
          avatar_url: avatarUrl
        }
      });

      if (error) throw error;

      setMessage('Settings saved successfully!');
      setTimeout(() => {
        onClose();
        window.location.reload(); // Refresh to update UI
      }, 1000);
    } catch (error) {
      console.error('Error updating user:', error);
      setMessage('Failed to update settings. Please try again.');
    } finally {
      setIsLoading(false);
    }
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
        <div className="flex items-center justify-between mb-6">
          <h2
            className={`text-xl font-semibold ${
              isDarkMode ? 'text-[#EDEDED]' : 'text-zinc-900'
            }`}
          >
            User Settings
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${
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
          {/* Display Name */}
          <div>
            <label
              className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-zinc-400' : 'text-zinc-600'
              }`}
            >
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your name"
              className={`w-full px-4 py-2 rounded-lg border outline-none transition-colors ${
                isDarkMode
                  ? 'bg-[#0A0A0A] border-[#2C2C2E] text-[#EDEDED] placeholder-zinc-600 focus:border-[#FFBF00]'
                  : 'bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-amber-600'
              }`}
            />
          </div>

          {/* Avatar URL */}
          <div>
            <label
              className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-zinc-400' : 'text-zinc-600'
              }`}
            >
              Avatar URL
            </label>
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/avatar.jpg"
              className={`w-full px-4 py-2 rounded-lg border outline-none transition-colors ${
                isDarkMode
                  ? 'bg-[#0A0A0A] border-[#2C2C2E] text-[#EDEDED] placeholder-zinc-600 focus:border-[#FFBF00]'
                  : 'bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-amber-600'
              }`}
            />
            <p
              className={`text-xs mt-1 ${
                isDarkMode ? 'text-zinc-500' : 'text-zinc-500'
              }`}
            >
              Enter a URL to an image for your avatar
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
                className={`text-xs font-medium mb-2 ${
                  isDarkMode ? 'text-zinc-400' : 'text-zinc-600'
                }`}
              >
                Preview:
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
              className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                isDarkMode
                  ? 'bg-transparent border-[#2C2C2E] text-[#EDEDED] hover:bg-[#1C1C1E]'
                  : 'bg-zinc-100 border-zinc-300 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                isLoading
                  ? 'opacity-50 cursor-not-allowed'
                  : ''
              } ${
                isDarkMode
                  ? 'bg-[#FFBF00] text-black hover:bg-[#FFA500]'
                  : 'bg-amber-600 text-white hover:bg-amber-700'
              }`}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
