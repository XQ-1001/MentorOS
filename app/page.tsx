'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Header } from '@/components/Header';
import { MessageBubble } from '@/components/MessageBubble';
import { InputArea } from '@/components/InputArea';
import { ConversationList } from '@/components/ConversationList';
import { sendMessageStream, initializeChat } from '@/services/geminiService';
import { Message, Role, Language } from '@/types';
import { SYSTEM_PROMPTS } from '@/constants';
import { v4 as uuidv4 } from 'uuid';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [conversationListKey, setConversationListKey] = useState(0);

  // --- Effect: Theme Application ---
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  // --- Effect: Initialize/Re-initialize Chat on Language Change ---
  useEffect(() => {
    // Select the prompt based on current language
    const prompt = SYSTEM_PROMPTS[language];
    initializeChat(prompt);

    // If it's the very first load, or if we switched languages, we might want to reset the view.
    // For a cleaner UX when switching language, we reset the messages to a new greeting in that language.
    const greeting = language === 'zh'
      ? "那些疯狂到以为自己能够改变世界的人，正是那些真正改变世界的人。\n\n你准备好不再对平庸妥协了吗？\n\n以此为起点，告诉我你现在的困惑。"
      : "The people who are crazy enough to think they can change the world are the ones who do.\n\nAre you ready to stop compromising with mediocrity?\n\nStarting from there, tell me what you are wrestling with.";

    setMessages([{
        id: uuidv4(),
        role: Role.MODEL,
        content: greeting
    }]);

    setHasInitialized(true);
  }, [language]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
        // Refresh conversation list
        setConversationListKey(prev => prev + 1);
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
    const userMessage: Message = {
      id: uuidv4(),
      role: Role.USER,
      content: text,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // Create conversation with first user message as title if this is the first message
    const isFirstMessage = !currentConversationId;
    let conversationId = currentConversationId;

    if (isFirstMessage) {
      const title = text.length > 50 ? text.substring(0, 50) + '...' : text;
      conversationId = await ensureConversation(title);
    }

    // Save user message to database - pass conversationId to prevent race condition
    if (conversationId) {
      await saveMessage(conversationId, Role.USER, text);
    }

    const modelMessageId = uuidv4();
    const modelMessage: Message = {
        id: modelMessageId,
        role: Role.MODEL,
        content: '',
        isStreaming: true
    };

    setMessages((prev) => [...prev, modelMessage]);

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
      });

      // Save model response to database after streaming completes
      if (fullResponse && conversationId) {
        saveMessage(conversationId, Role.MODEL, fullResponse);
      }
    } catch (error) {
      console.error("Failed to generate response", error);
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
        setMessages((prev) =>
            prev.map((msg) =>
                msg.id === modelMessageId
                ? { ...msg, isStreaming: false }
                : msg
            )
        );
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

  const handleConversationSelect = async (id: string) => {
    try {
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

        setMessages(loadedMessages);

        // Re-initialize chat with current language prompt
        const prompt = SYSTEM_PROMPTS[language];
        initializeChat(prompt);
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  };

  const handleNewConversation = () => {
    // Reset conversation
    setCurrentConversationId(null);

    // Reset messages to greeting
    const greeting = language === 'zh'
      ? "那些疯狂到以为自己能够改变世界的人，正是那些真正改变世界的人。\n\n你准备好不再对平庸妥协了吗？\n\n以此为起点，告诉我你现在的困惑。"
      : "The people who are crazy enough to think they can change the world are the ones who do.\n\nAre you ready to stop compromising with mediocrity?\n\nStarting from there, tell me what you are wrestling with.";

    setMessages([{
      id: uuidv4(),
      role: Role.MODEL,
      content: greeting
    }]);

    // Re-initialize chat
    const prompt = SYSTEM_PROMPTS[language];
    initializeChat(prompt);
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans selection:bg-white/20 ${isDarkMode ? 'bg-zinc-950 text-zinc-50' : 'bg-zinc-50 text-zinc-900'}`}>
      <Header
        language={language}
        onLanguageChange={handleLanguageChange}
        isDarkMode={isDarkMode}
        onThemeToggle={handleThemeToggle}
      />

      <ConversationList
        key={conversationListKey}
        currentConversationId={currentConversationId}
        onConversationSelect={handleConversationSelect}
        onNewConversation={handleNewConversation}
        language={language}
        isDarkMode={isDarkMode}
      />

      <div className="flex-1 lg:ml-64">
        <main className="w-full max-w-5xl mx-auto px-4 pt-24 pb-32">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} isDarkMode={isDarkMode} />
          ))}
          <div ref={messagesEndRef} />
        </main>

        <InputArea onSend={handleSendMessage} isLoading={isLoading} isDarkMode={isDarkMode} />
      </div>
    </div>
  );
}
