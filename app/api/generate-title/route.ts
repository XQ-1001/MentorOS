import { NextRequest, NextResponse } from 'next/server';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
// Use Claude Haiku for title generation - fast, reliable, no reasoning mode issues
const TITLE_MODEL = process.env.OPENROUTER_TITLE_MODEL || 'anthropic/claude-3.5-haiku';
const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';

export async function POST(req: NextRequest) {
  try {
    const { userMessage, language } = await req.json();

    if (!userMessage) {
      return NextResponse.json({ error: 'User message is required' }, { status: 400 });
    }

    // Enhanced prompt focusing on topic extraction
    const systemPrompt = language === 'zh'
      ? `你是标题总结专家。你的任务是从用户的问题或陈述中，提取最核心的主题，生成简洁标题。

核心原则：
1. 识别用户真正关心的核心问题或主题
2. 使用最关键的名词概括，10字以内
3. 只输出标题本身，不要任何标点符号或解释

示例：
用户："现在很多小朋友沉迷于手机、iPad中的游戏、短视频，甚至新加坡开始禁止学生在学校使用手机。这个问题你怎么看？"
标题：青少年手机成瘾

用户："如何提升产品的用户体验？"
标题：产品体验优化

用户："我想学习Python编程，应该从哪里开始？"
标题：Python入门

用户："帮我分析一下这个商业模式是否可行"
标题：商业模式分析`
      : `You are a title summarization expert. Your task is to extract the core topic from user questions or statements and create a concise title.

Core principles:
1. Identify the real issue or topic the user cares about
2. Use key nouns to summarize, max 10 characters
3. Output only the title itself, no punctuation or explanation

Examples:
User: "Many kids are addicted to phone games and videos. What do you think?"
Title: Kids Screen

User: "How to improve product UX?"
Title: Improve UX

User: "I want to learn Python, where to start?"
Title: Learn Python

User: "Analyze this business model for me"
Title: Model Check`;

    console.log('[Generate Title] Calling OpenRouter API:', {
      model: TITLE_MODEL,
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
        model: TITLE_MODEL,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: language === 'zh'
              ? `请为这段话生成10字以内的标题：${userMessage}`
              : `Generate a title (max 10 chars) for: ${userMessage}`
          }
        ],
        temperature: 0.3,
        max_tokens: 30,
        stream: false
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Generate Title] OpenRouter API Error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });

      // Fallback with keyword extraction if API fails
      const words = userMessage.split(/[，。？！、；\s,\.?!;]+/).filter(w => w.length > 0);
      const fallbackTitle = words[0] && words[0].length <= 10
        ? words[0]
        : userMessage.substring(0, 10);

      return NextResponse.json({ title: fallbackTitle });
    }

    const data = await response.json();
    console.log('[Generate Title] Raw API response:', JSON.stringify(data, null, 2));

    // Extract title from content field
    let generatedTitle = data.choices?.[0]?.message?.content?.trim() || '';
    console.log('[Generate Title] Extracted title:', generatedTitle);

    // Clean up the title
    // Remove common prefixes like "标题：", "Title:", "标题:" etc.
    generatedTitle = generatedTitle
      .replace(/^(标题[:：]|Title[:：]?|title[:：]?)\s*/i, '')
      .replace(/^["'「」『』]|["'「」『』]$/g, '')  // Remove quotes
      .replace(/[。！？，、；：,.!?;:]+$/g, '')  // Remove trailing punctuation
      .trim();

    console.log('[Generate Title] Cleaned title:', generatedTitle);

    // Ensure the title doesn't exceed 10 characters (for Chinese and English)
    if (generatedTitle.length > 10) {
      generatedTitle = generatedTitle.substring(0, 10);
      console.log('[Generate Title] Truncated to 10 chars:', generatedTitle);
    }

    // Fallback if generation failed - extract keywords instead of simple truncation
    if (!generatedTitle) {
      // Try to extract meaningful keywords
      const words = userMessage.split(/[，。？！、；\s,\.?!;]+/).filter(w => w.length > 0);
      // Take first meaningful segment, prefer nouns/key phrases
      generatedTitle = words[0] && words[0].length <= 10
        ? words[0]
        : userMessage.substring(0, 10);
    }

    return NextResponse.json({ title: generatedTitle });

  } catch (error) {
    console.error('[Generate Title] Error:', error);

    // Fallback with keyword extraction on error
    try {
      const body = await req.json();
      const msg = body.userMessage || '';
      const words = msg.split(/[，。？！、；\s,\.?!;]+/).filter((w: string) => w.length > 0);
      const fallbackTitle = words[0] && words[0].length <= 10
        ? words[0]
        : msg.substring(0, 10) || 'New Chat';

      return NextResponse.json({ title: fallbackTitle });
    } catch {
      return NextResponse.json({ title: 'New Chat' });
    }
  }
}
