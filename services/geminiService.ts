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
