// Client-side service that calls our Next.js API route
let conversationHistory: Array<{ role: string; content: string }> = [];
let systemInstruction: string = '';

// Sliding window configuration
const WINDOW_CONFIG = {
  RECENT_MESSAGES: 30,        // Keep last 15 rounds (30 messages: 15 user + 15 assistant)
  IMPORTANT_THRESHOLD: 500,   // Messages longer than 500 chars are considered important
  MAX_IMPORTANT: 10,          // Maximum number of important messages to keep
};

export const initializeChat = (instruction: string): void => {
  systemInstruction = instruction;
  conversationHistory = []; // Reset conversation history
};

export const setConversationHistory = (messages: Array<{ role: string; content: string }>): void => {
  conversationHistory = [...messages];
};

/**
 * Apply sliding window optimization to conversation history
 * Strategy: Keep recent messages + important messages
 */
const getWindowedHistory = (
  history: Array<{ role: string; content: string }>
): Array<{ role: string; content: string }> => {
  // If history is short, return as-is
  if (history.length <= WINDOW_CONFIG.RECENT_MESSAGES) {
    return history;
  }

  // 1. Get recent messages (last N messages)
  const recentMessages = history.slice(-WINDOW_CONFIG.RECENT_MESSAGES);

  // 2. Get important messages from older history
  const olderMessages = history.slice(0, -WINDOW_CONFIG.RECENT_MESSAGES);
  const importantMessages = olderMessages
    .filter(msg => msg.content.length >= WINDOW_CONFIG.IMPORTANT_THRESHOLD)
    .slice(-WINDOW_CONFIG.MAX_IMPORTANT);  // Keep last N important messages

  // 3. Merge and deduplicate (using Set to track content)
  const seen = new Set<string>();
  const combined = [...importantMessages, ...recentMessages];
  const deduplicated = combined.filter(msg => {
    const key = `${msg.role}:${msg.content}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // 4. Log optimization stats
  const saved = history.length - deduplicated.length;
  const savingsPercent = Math.round((saved / history.length) * 100);

  if (saved > 0) {
    console.log(`[Sliding Window] Optimized: ${history.length} → ${deduplicated.length} messages (-${savingsPercent}%)`);
    console.log(`[Sliding Window] Kept: ${recentMessages.length} recent + ${importantMessages.length} important`);
  }

  return deduplicated;
};

export const sendMessageStream = async (
  message: string,
  onChunk: (text: string) => void,
  abortSignal?: AbortSignal
): Promise<string> => {
  if (!systemInstruction) {
    throw new Error("Chat session not initialized. Call initializeChat first.");
  }

  // Add user message to history
  conversationHistory.push({
    role: 'user',
    content: message
  });

  // Apply sliding window optimization
  const windowedHistory = getWindowedHistory(conversationHistory);

  let fullResponse = "";

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: windowedHistory,  // Use windowed history instead of full history
        systemInstruction: systemInstruction,
      }),
      signal: abortSignal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Failed to get response reader');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        console.log('Stream ended. Total response length:', fullResponse.length);
        break;
      }

      // Decode chunk with stream: true to handle multi-byte characters properly
      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk;

      // Process complete lines
      const lines = buffer.split('\n');
      // Keep the last incomplete line in the buffer
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) continue;

        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') {
            console.log('Received [DONE] signal');
            continue;
          }

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            const finishReason = parsed.choices?.[0]?.finish_reason;

            if (content) {
              fullResponse += content;
              onChunk(fullResponse);
            }

            if (finishReason) {
              console.log('Stream finished with reason:', finishReason);
            }
          } catch (e) {
            console.warn('Failed to parse SSE data:', data.substring(0, 100), e);
          }
        }
      }
    }

    // Add assistant response to history
    conversationHistory.push({
      role: 'assistant',
      content: fullResponse
    });

  } catch (error) {
    console.error("Error in chat stream:", error);

    if (error instanceof Error) {
      if (error.message.includes("API key") || error.message.includes("401")) {
        throw new Error("Invalid or missing API Key. Please check your configuration.");
      }
    }
    throw error;
  }

  return fullResponse;
};
