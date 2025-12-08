'use client';

import React, { useEffect, useState } from 'react';
import { Language } from '@/types';
import { ExportDialog } from './ExportDialog';

interface Conversation {
  id: string;
  title: string | null;
  language: string;
  createdAt: string;
  updatedAt: string;
  messages: Array<{
    id: string;
    content: string;
    role: string;
  }>;
}

interface ConversationListProps {
  currentConversationId: string | null;
  onConversationSelect: (id: string) => void;
  onNewConversation: () => void;
  language: Language;
  isDarkMode: boolean;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  currentConversationId,
  onConversationSelect,
  onNewConversation,
  language,
  isDarkMode,
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    conversationId: string;
  } | null>(null);
  const [isRenaming, setIsRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [exportingConversation, setExportingConversation] = useState<string | null>(null);

  const t = {
    conversations: language === 'zh' ? '对话列表' : 'Conversations',
    newChat: language === 'zh' ? '新对话' : 'New Chat',
    today: language === 'zh' ? '今天' : 'Today',
    yesterday: language === 'zh' ? '昨天' : 'Yesterday',
    lastWeek: language === 'zh' ? '过去7天' : 'Last 7 Days',
    older: language === 'zh' ? '更早' : 'Older',
    noConversations: language === 'zh' ? '暂无对话历史' : 'No conversations yet',
    rename: language === 'zh' ? '重命名' : 'Rename',
    delete: language === 'zh' ? '删除' : 'Delete',
    export: language === 'zh' ? '导出' : 'Export',
  };

  useEffect(() => {
    setMounted(true);
    loadConversations();
  }, []);

  // Refresh when currentConversationId changes to a new value we don't have yet
  useEffect(() => {
    if (currentConversationId && !conversations.find(c => c.id === currentConversationId)) {
      // New conversation was created, reload the list
      loadConversations();
    }
  }, [currentConversationId]);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [contextMenu]);

  const loadConversations = async () => {
    try {
      const response = await fetch('/api/conversations');
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMenuToggle = (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();

    // If clicking the same menu, close it
    if (contextMenu?.conversationId === conversationId) {
      setContextMenu(null);
      return;
    }

    // Get button position for menu placement
    const button = e.currentTarget as HTMLElement;
    const rect = button.getBoundingClientRect();

    setContextMenu({
      x: rect.right - 160, // Align menu to the right of the button
      y: rect.bottom + 4,
      conversationId,
    });
  };

  const handleDelete = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setConversations((prev) => prev.filter((c) => c.id !== conversationId));
        if (currentConversationId === conversationId) {
          onNewConversation();
        }
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
    setContextMenu(null);
  };

  const handleRenameStart = (conversationId: string) => {
    const conversation = conversations.find((c) => c.id === conversationId);
    if (conversation) {
      setIsRenaming(conversationId);
      setRenameValue(getConversationTitle(conversation));
      setContextMenu(null);
    }
  };

  const handleRenameSubmit = async (conversationId: string) => {
    if (!renameValue.trim()) {
      setIsRenaming(null);
      return;
    }

    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: renameValue }),
      });

      if (response.ok) {
        const { conversation } = await response.json();
        setConversations((prev) =>
          prev.map((c) => (c.id === conversationId ? conversation : c))
        );
      }
    } catch (error) {
      console.error('Failed to rename conversation:', error);
    }
    setIsRenaming(null);
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent, conversationId: string) => {
    if (e.key === 'Enter') {
      handleRenameSubmit(conversationId);
    } else if (e.key === 'Escape') {
      setIsRenaming(null);
    }
  };

  const getConversationTitle = (conv: Conversation) => {
    if (conv.title) return conv.title;
    if (conv.messages && conv.messages.length > 0) {
      const firstMessage = conv.messages[0].content;
      return firstMessage.length > 30 ? firstMessage.slice(0, 30) + '...' : firstMessage;
    }
    return t.newChat;
  };

  const groupConversationsByDate = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    const groups: { [key: string]: Conversation[] } = {
      today: [],
      yesterday: [],
      lastWeek: [],
      older: [],
    };

    conversations.forEach((conv) => {
      const convDate = new Date(conv.updatedAt);
      if (convDate >= today) {
        groups.today.push(conv);
      } else if (convDate >= yesterday) {
        groups.yesterday.push(conv);
      } else if (convDate >= lastWeek) {
        groups.lastWeek.push(conv);
      } else {
        groups.older.push(conv);
      }
    });

    return groups;
  };

  const groupedConversations = groupConversationsByDate();

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return null;
  }

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className={`fixed top-20 left-4 z-50 md:hidden p-2 rounded-lg border transition-colors ${
          isDarkMode
            ? 'bg-[#1C1C1E] border-[#2C2C2E] text-[#EDEDED] hover:bg-[#2C2C2E]'
            : 'bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-100'
        }`}
        aria-label="Toggle sidebar"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>

      {/* Sidebar */}
      <div
        className={`fixed top-20 left-0 bottom-0 w-64 border-r transition-all duration-300 z-40 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isDarkMode ? 'bg-[#0A0A0A] border-[#2C2C2E]' : 'bg-zinc-50 border-zinc-200'}`}
      >
        <div className="flex flex-col h-full">
          {/* Header with New Chat and Hide Sidebar */}
          <div className="p-3 border-b" style={{ borderColor: isDarkMode ? '#2C2C2E' : '#e4e4e7' }}>
            <div className="flex items-center justify-between mb-3">
              <span className={`text-sm font-medium ${isDarkMode ? 'text-zinc-500' : 'text-zinc-600'}`}>
                {t.conversations}
              </span>
              {/* Hide Sidebar Button - Top Right */}
              <button
                onClick={() => setIsSidebarOpen(false)}
                className={`p-1.5 rounded-md transition-colors ${
                  isDarkMode
                    ? 'text-zinc-400 hover:bg-[#1C1C1E] hover:text-[#EDEDED]'
                    : 'text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900'
                }`}
                aria-label="Hide sidebar"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="9" y1="3" x2="9" y2="21"></line>
                </svg>
              </button>
            </div>
            <button
              onClick={onNewConversation}
              className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border transition-colors ${
                isDarkMode
                  ? 'bg-[#1C1C1E] border-[#2C2C2E] text-[#EDEDED] hover:bg-[#2C2C2E]'
                  : 'bg-white border-zinc-300 text-zinc-900 hover:bg-zinc-100'
              }`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              <span className="text-sm font-medium">{t.newChat}</span>
            </button>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto p-2">
            {isLoading ? (
              <div className={`text-center py-8 text-sm ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                Loading...
              </div>
            ) : conversations.length === 0 ? (
              <div className={`text-center py-8 text-sm ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                {t.noConversations}
              </div>
            ) : (
              <>
                {Object.entries(groupedConversations).map(
                  ([period, convs]) =>
                    convs.length > 0 && (
                      <div key={period} className="mb-4">
                        <div
                          className={`text-xs font-medium px-2 py-1 mb-1 ${
                            isDarkMode ? 'text-zinc-500' : 'text-zinc-400'
                          }`}
                        >
                          {t[period as keyof typeof t]}
                        </div>
                        {convs.map((conv) => (
                          <div key={conv.id} className="relative group">
                            {isRenaming === conv.id ? (
                              <input
                                type="text"
                                value={renameValue}
                                onChange={(e) => setRenameValue(e.target.value)}
                                onBlur={() => handleRenameSubmit(conv.id)}
                                onKeyDown={(e) => handleRenameKeyDown(e, conv.id)}
                                className={`w-full px-3 py-2 rounded-lg mb-1 text-sm border ${
                                  isDarkMode
                                    ? 'bg-zinc-800 text-zinc-100 border-zinc-600'
                                    : 'bg-white text-zinc-900 border-zinc-300'
                                }`}
                                autoFocus
                              />
                            ) : (
                              <div
                                className={`flex items-center gap-1 rounded-lg mb-1 transition-colors ${
                                  currentConversationId === conv.id
                                    ? isDarkMode
                                      ? 'bg-zinc-800'
                                      : 'bg-zinc-200'
                                    : isDarkMode
                                    ? 'hover:bg-zinc-900'
                                    : 'hover:bg-zinc-100'
                                }`}
                              >
                                <button
                                  onClick={() => onConversationSelect(conv.id)}
                                  className={`flex-1 text-left px-3 py-2 text-sm min-w-0 ${
                                    currentConversationId === conv.id
                                      ? isDarkMode
                                        ? 'text-zinc-100'
                                        : 'text-zinc-900'
                                      : isDarkMode
                                      ? 'text-zinc-300'
                                      : 'text-zinc-700'
                                  }`}
                                >
                                  <div className="truncate">{getConversationTitle(conv)}</div>
                                </button>
                                <button
                                  onClick={(e) => handleMenuToggle(e, conv.id)}
                                  className={`flex-shrink-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity ${
                                    isDarkMode
                                      ? 'text-zinc-400 hover:text-zinc-200'
                                      : 'text-zinc-500 hover:text-zinc-700'
                                  }`}
                                  aria-label="More options"
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <circle cx="12" cy="5" r="2"></circle>
                                    <circle cx="12" cy="12" r="2"></circle>
                                    <circle cx="12" cy="19" r="2"></circle>
                                  </svg>
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Show Sidebar Button - appears when sidebar is hidden */}
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className={`fixed top-24 left-4 z-50 p-2 rounded-md border transition-colors hidden md:block ${
            isDarkMode
              ? 'bg-[#1C1C1E] border-[#2C2C2E] text-zinc-400 hover:bg-[#2C2C2E] hover:text-[#EDEDED]'
              : 'bg-white border-zinc-300 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
          }`}
          aria-label="Show sidebar"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="9" y1="3" x2="9" y2="21"></line>
          </svg>
        </button>
      )}

      {/* Dropdown Menu */}
      {contextMenu && (
        <div
          className={`fixed z-50 min-w-[160px] rounded-lg border shadow-lg py-1 ${
            isDarkMode
              ? 'bg-zinc-900 border-zinc-700'
              : 'bg-white border-zinc-200'
          }`}
          style={{
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
          }}
        >
          <button
            onClick={() => handleRenameStart(contextMenu.conversationId)}
            className={`w-full flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
              isDarkMode
                ? 'text-zinc-200 hover:bg-zinc-800'
                : 'text-zinc-800 hover:bg-zinc-100'
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            {t.rename}
          </button>
          <button
            onClick={() => {
              setExportingConversation(contextMenu.conversationId);
              setContextMenu(null);
            }}
            className={`w-full flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
              isDarkMode
                ? 'text-zinc-200 hover:bg-zinc-800'
                : 'text-zinc-800 hover:bg-zinc-100'
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            {t.export}
          </button>
          <button
            onClick={() => handleDelete(contextMenu.conversationId)}
            className={`w-full flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
              isDarkMode
                ? 'text-red-400 hover:bg-zinc-800'
                : 'text-red-600 hover:bg-zinc-100'
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
            {t.delete}
          </button>
        </div>
      )}

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Export Dialog */}
      {exportingConversation && (
        <ExportDialog
          isOpen={!!exportingConversation}
          onClose={() => setExportingConversation(null)}
          conversationId={exportingConversation}
          conversationTitle={
            conversations.find(c => c.id === exportingConversation)?.title ||
            conversations.find(c => c.id === exportingConversation)?.messages[0]?.content.slice(0, 30) ||
            'conversation'
          }
          language={language}
          isDarkMode={isDarkMode}
        />
      )}
    </>
  );
};
