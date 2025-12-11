'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { MessageBubble } from '@/components/MessageBubble';
import { InputArea } from '@/components/InputArea';
import { ConversationList } from '@/components/ConversationList';
import { ResonanceWave } from '@/components/ResonanceWave';
import { sendMessageStream, initializeChat, setConversationHistory } from '@/services/geminiService';
import { Message, Role, Language } from '@/types';
import { SYSTEM_PROMPTS } from '@/constants';
import { v4 as uuidv4 } from 'uuid';
import { determineOutputLanguage } from '@/lib/languageDetection';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { useProfile } from '@/lib/hooks/useProfile';
import { Virtuoso } from 'react-virtuoso';

export default function Home() {
  // --- State: Theme ---
  // Default to true (Dark mode)
  const [isDarkMode, setIsDarkMode] = useState(true);

  // --- State: Language ---
  // Default based on browser, fallback to 'en' if not Chinese
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window !== 'undefined' && navigator.language) {
      return navigator.language.startsWith('zh') ? 'zh' : 'en';
    }
    return 'en';
  });

  // --- State: Chat ---
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  // Client-side cache to avoid re-fetching already loaded conversations
  const conversationCache = React.useRef<Map<string, Message[]>>(new Map());
  // AbortController for canceling ongoing requests
  const abortControllerRef = React.useRef<AbortController | null>(null);
  // Search preview state
  const [previewConversationId, setPreviewConversationId] = useState<string | null>(null);
  const [previewMessages, setPreviewMessages] = useState<Message[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const previewTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // --- State: User ---
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);

  // Use custom hook to manage profile data
  const { profile } = useProfile(user);

  // --- Effect: Fetch User ---
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  // --- Effect: Theme Application ---
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  // --- Effect: Initialize Chat with Bilingual System Prompt ---
  useEffect(() => {
    // Use the bilingual system prompt that handles both languages
    const prompt = SYSTEM_PROMPTS[language]; // Both zh and en now use the same bilingual prompt
    initializeChat(prompt);

    // Initial greeting in user's browser language
    const greeting = language === 'zh'
      ? "简洁比复杂更难。你必须付出巨大的努力，才能让思绪变得清晰。\n\n但这很值得。因为一旦你做到了，你就可以以此撼动山岳。\n\n无论是关于一个 **产品**、一种 **困惑**，还是一个 **未成形的梦**...\n\n我们可以从哪里开始？"
      : "Simple can be harder than complex. You have to work hard to get your thinking clean to make it simple.\n\nBut it's worth it in the end because once you get there, you can move mountains.\n\nWhether it is about a **product**, a **dilemma**, or an **unformed dream**...\n\nWhere shall we begin?";

    setMessages([{
        id: uuidv4(),
        role: Role.MODEL,
        content: greeting
    }]);

    setHasInitialized(true);
  }, []);

  // Create new conversation if needed
  const ensureConversation = async (title?: string) => {
    if (currentConversationId) return currentConversationId;

    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language,
          title: title || undefined
        }),
      });

      if (res.ok) {
        const { conversation } = await res.json();
        setCurrentConversationId(conversation.id);
        return conversation.id;
      }
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
    return null;
  };

  // Save message to database
  const saveMessage = async (conversationId: string, role: string, content: string) => {
    if (!conversationId) return;

    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          role,
          content,
        }),
      });
    } catch (error) {
      console.error('Failed to save message:', error);
    }
  };

  const handleSendMessage = async (text: string) => {
    // Create AbortController for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const userMessage: Message = {
      id: uuidv4(),
      role: Role.USER,
      content: text,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // Immediately add empty AI message to show loading state
    const modelMessageId = uuidv4();
    const modelMessage: Message = {
        id: modelMessageId,
        role: Role.MODEL,
        content: '',
        isStreaming: true
    };
    setMessages((prev) => [...prev, modelMessage]);

    // Detect language from user input and conversation history
    const conversationHistory = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    const detectedLanguage = determineOutputLanguage(text, language, conversationHistory);

    // Update language preference if it changed
    if (detectedLanguage !== language) {
      setLanguage(detectedLanguage);
    }

    // Create conversation with first user message as title if this is the first message
    const isFirstMessage = !currentConversationId;
    let conversationId = currentConversationId;

    if (isFirstMessage) {
      // Generate AI-powered title based on user message
      let title = text.length > 10 ? text.substring(0, 10) : text; // Fallback

      try {
        const titleResponse = await fetch('/api/generate-title', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userMessage: text,
            language: detectedLanguage
          }),
        });

        if (titleResponse.ok) {
          const { title: generatedTitle } = await titleResponse.json();
          if (generatedTitle) {
            title = generatedTitle;
          }
        }
      } catch (error) {
        console.error('Failed to generate title:', error);
        // Use fallback title
      }

      conversationId = await ensureConversation(title);

      // Update conversation language to detected language
      if (conversationId && detectedLanguage) {
        try {
          await fetch(`/api/conversations/${conversationId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ language: detectedLanguage }),
          });
        } catch (error) {
          console.error('Failed to update conversation language:', error);
        }
      }
    }

    // Save user message to database - pass conversationId to prevent race condition
    if (conversationId) {
      await saveMessage(conversationId, Role.USER, text);
    }

    let fullResponse = '';

    try {
      await sendMessageStream(text, (streamedText) => {
        fullResponse = streamedText;
        setMessages((prev) =>
            prev.map((msg) =>
                msg.id === modelMessageId
                ? { ...msg, content: streamedText }
                : msg
            )
        );
      }, abortController.signal);

      // Save model response to database after streaming completes
      if (fullResponse && conversationId) {
        saveMessage(conversationId, Role.MODEL, fullResponse);
      }
    } catch (error) {
      console.error("Failed to generate response", error);

      // Check if it was aborted by user
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Request aborted by user');
        // Don't show error message for user-initiated abort
        return;
      }

      const errorMsg = language === 'zh'
        ? "连接断了。去修好它。"
        : "The connection is broken. Fix it.";

      setMessages((prev) => [
        ...prev,
        {
          id: uuidv4(),
          role: Role.MODEL,
          content: errorMsg,
        },
      ]);

      // Save error message too
      if (conversationId) {
        saveMessage(conversationId, Role.MODEL, errorMsg);
      }
    } finally {
        setIsLoading(false);
        abortControllerRef.current = null; // Clear the ref
        setMessages((prev) => {
          const updatedMessages = prev.map((msg) =>
            msg.id === modelMessageId
              ? { ...msg, isStreaming: false }
              : msg
          );

          // Update cache with latest messages after sending
          if (conversationId) {
            conversationCache.current.set(conversationId, updatedMessages);
          }

          return updatedMessages;
        });
    }
  };

  const handleAbortMessage = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();

      // Remove the last two messages (user message and empty AI message)
      setMessages((prev) => prev.slice(0, -2));

      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleLanguageChange = (newLang: Language) => {
    if (newLang !== language) {
        setLanguage(newLang);
    }
  };

  const handleThemeToggle = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleConversationSelect = async (id: string, keepSearchQuery?: string) => {
    // Clear preview state
    setPreviewConversationId(null);
    setPreviewMessages([]);
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
      previewTimeoutRef.current = null;
    }

    // Manage search query: keep it if passed from search results, otherwise clear when switching conversations
    if (keepSearchQuery) {
      setSearchQuery(keepSearchQuery);
    } else if (id !== currentConversationId) {
      setSearchQuery('');
    }

    try {
      // Check cache first - instant load for already-viewed conversations
      const cachedMessages = conversationCache.current.get(id);

      if (cachedMessages) {
        console.log(`[CACHE HIT] Loading conversation ${id} from cache (${cachedMessages.length} messages)`);

        // Update current conversation ID
        setCurrentConversationId(id);
        setMessages(cachedMessages);

        // Re-initialize chat with bilingual prompt
        const prompt = SYSTEM_PROMPTS.zh;
        initializeChat(prompt);

        // Restore conversation history
        const conversationHistory = cachedMessages.map(msg => ({
          role: msg.role,
          content: msg.content
        }));
        setConversationHistory(conversationHistory);
        return; // Early return - no API call needed
      }

      // Cache miss - fetch from API
      console.log(`[CACHE MISS] Fetching conversation ${id} from API`);
      const res = await fetch(`/api/conversations/${id}`);
      if (res.ok) {
        const { conversation } = await res.json();

        // Update current conversation ID
        setCurrentConversationId(id);

        // Load messages from conversation
        const loadedMessages: Message[] = conversation.messages.map((msg: any) => ({
          id: msg.id,
          role: msg.role as Role,
          content: msg.content,
        }));

        // Store in cache for instant future access
        conversationCache.current.set(id, loadedMessages);

        setMessages(loadedMessages);

        // Re-initialize chat with bilingual prompt
        const prompt = SYSTEM_PROMPTS.zh;
        initializeChat(prompt);

        // Restore conversation history
        const conversationHistory = loadedMessages.map(msg => ({
          role: msg.role,
          content: msg.content
        }));
        setConversationHistory(conversationHistory);
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  };

  const handleNewConversation = () => {
    // Clear preview state immediately to exit preview mode
    setPreviewConversationId(null);
    setPreviewMessages([]);
    setSearchQuery('');
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
      previewTimeoutRef.current = null;
    }

    // Reset conversation
    setCurrentConversationId(null);

    // Reset messages to greeting in user's preferred language
    const greeting = language === 'zh'
      ? "简洁比复杂更难。你必须付出巨大的努力，才能让思绪变得清晰。\n\n但这很值得。因为一旦你做到了，你就可以以此撼动山岳。\n\n无论是关于一个 **产品**、一种 **困惑**，还是一个 **未成形的梦**...\n\n我们可以从哪里开始？"
      : "Simple can be harder than complex. You have to work hard to get your thinking clean to make it simple.\n\nBut it's worth it in the end because once you get there, you can move mountains.\n\nWhether it is about a **product**, a **dilemma**, or an **unformed dream**...\n\nWhere shall we begin?";

    setMessages([{
      id: uuidv4(),
      role: Role.MODEL,
      content: greeting
    }]);

    // Re-initialize chat with bilingual prompt
    const prompt = SYSTEM_PROMPTS.zh; // Use the same bilingual prompt
    initializeChat(prompt);
  };

  const handleSearchPreviewHover = async (conversationId: string | null, query: string) => {
    // Clear any existing timeout
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
      previewTimeoutRef.current = null;
    }

    if (!conversationId) {
      setPreviewConversationId(null);
      setPreviewMessages([]);
      // Only clear searchQuery if query parameter is empty
      if (!query) {
        setSearchQuery('');
      } else {
        // Keep the query for highlighting in normal view
        setSearchQuery(query);
      }
      return;
    }

    // Add delay before showing preview to avoid excessive API calls
    previewTimeoutRef.current = setTimeout(async () => {
      try {
        setSearchQuery(query);

        // Check cache first
        const cachedMessages = conversationCache.current.get(conversationId);

        if (cachedMessages) {
          setPreviewConversationId(conversationId);
          setPreviewMessages(cachedMessages);
          return;
        }

        // Fetch from API
        const res = await fetch(`/api/conversations/${conversationId}`);
        if (res.ok) {
          const { conversation } = await res.json();

          const loadedMessages: Message[] = conversation.messages.map((msg: any) => ({
            id: msg.id,
            role: msg.role as Role,
            content: msg.content,
          }));

          setPreviewConversationId(conversationId);
          setPreviewMessages(loadedMessages);
        }
      } catch (error) {
        console.error('Failed to load preview:', error);
      }
    }, 500); // 500ms delay to reduce API load
  };

  // Helper function to highlight search query in text
  const highlightText = (text: string, query: string, isDarkMode: boolean) => {
    if (!query.trim()) return text;

    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, index) => {
      if (part.toLowerCase() === query.toLowerCase()) {
        return (
          <span
            key={index}
            className={`${
              isDarkMode
                ? 'bg-[#D4B483]/30 text-[#FCD34D]'
                : 'bg-[#854D0E]/20 text-[#854D0E] font-medium'
            } px-0.5 rounded`}
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans selection:bg-white/20 ${isDarkMode ? 'bg-[#0A0A0A] text-[#EDEDED]' : 'bg-zinc-50 text-zinc-900'}`}>
      <Header
        isDarkMode={isDarkMode}
        onThemeToggle={handleThemeToggle}
        language={language}
      />

      <ConversationList
        currentConversationId={currentConversationId}
        onConversationSelect={handleConversationSelect}
        onNewConversation={handleNewConversation}
        onSearchPreviewHover={handleSearchPreviewHover}
        language={language}
        isDarkMode={isDarkMode}
      />

      <div className="flex-1 lg:ml-64">
        <main className="w-full max-w-5xl mx-auto px-4 pt-28 pb-1" style={{ height: 'calc(100vh - 7rem - 5rem)' }}>
          {(previewConversationId || searchQuery) ? (
            // Highlight mode - show preview or current conversation with search highlights
            <div className="h-full overflow-y-auto">
              {(previewConversationId ? previewMessages : messages).map((msg) => {
                const isUser = msg.role === Role.USER;
                return (
                  <div key={msg.id} className="flex flex-col gap-2 mb-8 w-full">
                    {/* Name label - matching MessageBubble style */}
                    <div className={`flex items-center gap-2 text-base uppercase tracking-wider font-semibold font-serif ${
                      isUser
                        ? isDarkMode ? 'text-zinc-500' : 'text-zinc-600'
                        : isDarkMode ? 'text-[#D4B483]' : 'text-[#854D0E]'
                    }`}>
                      {!isUser ? (
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 20 20"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          className={`flex-shrink-0 ${isDarkMode ? 'opacity-80' : ''}`}
                        >
                          <circle cx="10" cy="10" r="8.5" stroke={isDarkMode ? "#D4B483" : "#854D0E"} strokeWidth="1.5" fill="none" strokeDasharray="1.5 2.5" />
                          <circle cx="10" cy="10" r="5.5" stroke={isDarkMode ? "#D4B483" : "#854D0E"} strokeWidth="1.5" fill="none" strokeDasharray="1.5 2.5" />
                          <circle cx="10" cy="10" r="2.5" stroke={isDarkMode ? "#D4B483" : "#854D0E"} strokeWidth="1.5" fill="none" strokeDasharray="1.5 2" />
                          <circle cx="10" cy="10" r="1" fill={isDarkMode ? "#D4B483" : "#854D0E"} />
                        </svg>
                      ) : (
                        profile?.avatar_url ? (
                          <img src={profile.avatar_url} alt={profile?.name || 'User'} className="w-4 h-4 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] ${isDarkMode ? 'bg-[#1C1C1E] text-[#EDEDED]' : 'bg-zinc-200 text-zinc-700'}`}>
                            {profile?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                          </div>
                        )
                      )}
                      {isUser ? (profile?.name || user?.email || 'You') : 'Resonance'}
                    </div>

                    {/* Message content - matching MessageBubble style */}
                    <div className={`
                      max-w-none
                      ml-6
                      ${isUser
                        ? isDarkMode
                          ? 'text-zinc-400 font-normal'
                          : 'text-zinc-600 font-normal'
                        : isDarkMode
                          ? 'text-[#C5C6C7] font-medium'
                          : 'text-zinc-900 font-medium'
                      }
                    `}>
                      <div className="whitespace-pre-wrap leading-[1.75] text-base">
                        {highlightText(msg.content, searchQuery, isDarkMode)}
                      </div>
                    </div>

                    {/* Divider line */}
                    <div className={`h-px w-full mt-2 ${
                      isDarkMode ? 'bg-[#0A0A0A]' : 'bg-white'
                    }`} />
                  </div>
                );
              })}
              {/* Show loading animation at the end if needed */}
              {!previewConversationId && isLoading && messages.length > 0 && messages[messages.length - 1].content === '' && (
                <ResonanceWave isDarkMode={isDarkMode} language={language} />
              )}
              <div style={{ height: '20px' }} />
            </div>
          ) : (
            // Normal mode - show current conversation
            <Virtuoso
              data={messages}
              followOutput="smooth"
              alignToBottom={messages.length > 1}
              itemContent={(index, msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isDarkMode={isDarkMode}
                  userName={profile?.name || user?.email}
                  userAvatar={profile?.avatar_url}
                  userEmail={user?.email}
                />
              )}
              components={{
                Footer: () => (
                  <div>
                    {isLoading && messages.length > 0 && messages[messages.length - 1].content === '' ? (
                      <ResonanceWave isDarkMode={isDarkMode} language={language} />
                    ) : null}
                    <div style={{ height: '20px' }} />
                  </div>
                ),
              }}
            />
          )}
        </main>

        <InputArea onSend={handleSendMessage} onAbort={handleAbortMessage} isLoading={isLoading} isDarkMode={isDarkMode} />
      </div>
    </div>
  );
}
