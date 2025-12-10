import { NextRequest } from 'next/server';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
// Priority: CHAT_MODEL_ID (recommended) > OPENROUTER_MODEL (backward compatibility) > default
const CHAT_MODEL_ID = process.env.CHAT_MODEL_ID || process.env.OPENROUTER_MODEL || 'google/gemini-3-pro-preview';
const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';

export async function POST(req: NextRequest) {
  try {
    const { messages, systemInstruction } = await req.json();

    console.log('API Route - OpenRouter Config:', {
      url: `${OPENROUTER_BASE_URL}/chat/completions`,
      model: CHAT_MODEL_ID,
      hasApiKey: !!OPENROUTER_API_KEY,
      apiKeyLength: OPENROUTER_API_KEY.length,
    });

    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Resonance - Jobs Edition',
      },
      body: JSON.stringify({
        model: CHAT_MODEL_ID,
        messages: [
          {
            role: 'system',
            content: [
              {
                type: 'text',
                text: systemInstruction,
                cache_control: { type: 'ephemeral' }
              }
            ]
          },
          ...messages
        ],
        temperature: 0.7,
        top_p: 0.95,
        max_tokens: 4096,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API Error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });

      return new Response(
        JSON.stringify({
          error: `OpenRouter API error: ${response.status} - ${errorText}`
        }),
        {
          status: response.status,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Return the streaming response
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Chat API Route Error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
