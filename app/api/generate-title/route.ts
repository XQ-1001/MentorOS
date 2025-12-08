import { NextRequest, NextResponse } from 'next/server';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'google/gemini-3-pro-preview';
const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';

export async function POST(req: NextRequest) {
  try {
    const { userMessage, language } = await req.json();

    if (!userMessage) {
      return NextResponse.json({ error: 'User message is required' }, { status: 400 });
    }

    // Prompt to generate a concise title
    const systemPrompt = language === 'zh'
      ? '你是一个标题生成助手。根据用户的聊天内容，生成一个简洁的标题来概括对话主题。标题必须不超过15个字，直接输出标题文本，不要有任何额外的解释或标点符号。'
      : 'You are a title generation assistant. Based on the user\'s chat content, generate a concise title that summarizes the conversation topic. The title must not exceed 15 characters, output the title text directly without any additional explanation or punctuation.';

    console.log('[Generate Title] Calling OpenRouter API:', {
      model: OPENROUTER_MODEL,
      language,
      messageLength: userMessage.length,
    });

    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Resonance - Title Generation',
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userMessage
          }
        ],
        temperature: 0.3,
        max_tokens: 50,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Generate Title] OpenRouter API Error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });

      // Fallback to simple truncation if API fails
      const fallbackTitle = userMessage.length > 15
        ? userMessage.substring(0, 15) + '...'
        : userMessage;

      return NextResponse.json({ title: fallbackTitle });
    }

    const data = await response.json();
    let generatedTitle = data.choices?.[0]?.message?.content?.trim() || '';

    console.log('[Generate Title] Generated title:', generatedTitle);

    // Clean up the title (remove quotes, extra punctuation)
    generatedTitle = generatedTitle.replace(/^["']|["']$/g, '').trim();

    // Ensure the title doesn't exceed 15 characters (for Chinese and English)
    if (generatedTitle.length > 15) {
      generatedTitle = generatedTitle.substring(0, 15);
    }

    // Fallback if generation failed
    if (!generatedTitle) {
      generatedTitle = userMessage.length > 15
        ? userMessage.substring(0, 15) + '...'
        : userMessage;
    }

    return NextResponse.json({ title: generatedTitle });

  } catch (error) {
    console.error('[Generate Title] Error:', error);

    // Fallback to simple truncation on error
    const { userMessage } = await req.json();
    const fallbackTitle = userMessage?.length > 15
      ? userMessage.substring(0, 15) + '...'
      : userMessage || 'New Chat';

    return NextResponse.json({ title: fallbackTitle });
  }
}
