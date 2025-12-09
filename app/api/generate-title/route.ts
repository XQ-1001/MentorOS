import { NextRequest, NextResponse } from 'next/server';

const OPENROUTER_TITLE_API_KEY = process.env.OPENROUTER_TITLE_API_KEY || '';
// Use Gemini 2.0 Flash for title generation - stable production model
const TITLE_MODEL = process.env.OPENROUTER_TITLE_MODEL || 'google/gemini-2.0-flash-001';
const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';

export async function POST(req: NextRequest) {
  try {
    const { userMessage, language } = await req.json();

    if (!userMessage) {
      return NextResponse.json({ error: 'User message is required' }, { status: 400 });
    }

    // Optimized prompt for Gemini 2.0 Flash - clear, direct instructions
    const systemPrompt = language === 'zh'
      ? `从用户输入中提取核心主题，生成10字以内的简短标题。

要求：
- 只输出标题，不要解释、标点、前缀
- 抓住核心关键词
- 简洁凝练

示例：
输入："现在很多小朋友沉迷于手机、iPad中的游戏、短视频，甚至新加坡开始禁止学生在学校使用手机。这个问题你怎么看？"
输出：青少年手机成瘾

输入："如何提升产品的用户体验？"
输出：产品体验优化

输入："我想学习Python编程，应该从哪里开始？"
输出：Python入门

输入："帮我分析一下这个商业模式是否可行"
输出：商业模式分析`
      : `Extract the core topic from user input and generate a brief title (max 10 chars).

Requirements:
- Output ONLY the title, no explanation, punctuation, or prefix
- Capture key keywords
- Be concise

Examples:
Input: "Many kids are addicted to phone games and videos. What do you think?"
Output: Kids Screen

Input: "How to improve product UX?"
Output: Improve UX

Input: "I want to learn Python, where to start?"
Output: Learn Python

Input: "Analyze this business model for me"
Output: Model Check`;

    console.log('[Generate Title] Calling OpenRouter API:', {
      model: TITLE_MODEL,
      language,
      messageLength: userMessage.length,
    });

    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_TITLE_API_KEY}`,
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
              ? `输入：${userMessage}\n输出：`
              : `Input: ${userMessage}\nOutput:`
          }
        ],
        temperature: 0.1,  // Low temperature for more deterministic title generation
        max_tokens: 50,    // Short response needed, 10 chars is ~15-20 tokens max
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
      const words = userMessage.split(/[，。？！、；\s,\.?!;]+/).filter((w: string) => w.length > 0);
      const fallbackTitle = words[0] && words[0].length <= 10
        ? words[0]
        : userMessage.substring(0, 10);

      return NextResponse.json({ title: fallbackTitle });
    }

    const data = await response.json();
    console.log('[Generate Title] Raw API response:', JSON.stringify(data, null, 2));

    // Extract title from content or reasoning field (some models use reasoning)
    const message = data.choices?.[0]?.message;
    let generatedTitle = (message?.content || message?.reasoning || '').trim();
    console.log('[Generate Title] Extracted title (raw):', generatedTitle);

    // If content came from reasoning field, try to extract the actual title
    // Reasoning often contains thought process + final answer
    if (!message?.content && message?.reasoning) {
      // Look for common patterns: "标题：xxx", "标题是xxx", or the last line
      const reasoningLines = generatedTitle.split('\n').filter((l: string) => l.trim());
      const titleMatch = generatedTitle.match(/(?:标题[:：是]?|Title[:：]?)\s*["']?([^"'\n]{1,10})["']?/i);
      if (titleMatch && titleMatch[1]) {
        generatedTitle = titleMatch[1].trim();
      } else if (reasoningLines.length > 0) {
        // Use the last non-empty line as fallback
        generatedTitle = reasoningLines[reasoningLines.length - 1].trim();
      }
      console.log('[Generate Title] Extracted from reasoning:', generatedTitle);
    }

    // Clean up the title - remove common prefixes and formatting
    generatedTitle = generatedTitle
      .replace(/^(输出[:：]?|标题[:：是]?|Title[:：]?|title[:：]?|Output[:：]?)\s*/i, '')  // Remove common prefixes
      .replace(/^["'「」『』]|["'「」『』]$/g, '')  // Remove quotes
      .replace(/[。！？，、；：,.!?;:]+$/g, '')  // Remove trailing punctuation
      .split('\n')[0]  // Take only first line if multi-line response
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
      const words = userMessage.split(/[，。？！、；\s,\.?!;]+/).filter((w: string) => w.length > 0);
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
