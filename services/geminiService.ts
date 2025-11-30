// Client-side service that calls our Next.js API route
let conversationHistory: Array<{ role: string; content: string }> = [];
let systemInstruction: string = '';

export const initializeChat = (instruction: string): void => {
  systemInstruction = instruction;
  conversationHistory = []; // Reset conversation history
};

export const sendMessageStream = async (
  message: string,
  onChunk: (text: string) => void
): Promise<string> => {
  if (!systemInstruction) {
    throw new Error("Chat session not initialized. Call initializeChat first.");
  }

  // Add user message to history
  conversationHistory.push({
    role: 'user',
    content: message
  });

  let fullResponse = "";

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: conversationHistory,
        systemInstruction: systemInstruction,
      }),
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

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim() !== '');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullResponse += content;
              onChunk(fullResponse);
            }
          } catch (e) {
            // Skip invalid JSON
            console.warn('Failed to parse SSE data:', e);
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
