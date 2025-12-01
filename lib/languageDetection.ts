import { Language } from '@/types';

/**
 * Detects the language of the input text based on character patterns
 * @param text - The text to analyze
 * @returns 'zh' for Chinese, 'en' for English
 */
export function detectLanguage(text: string): Language {
  if (!text || text.trim().length === 0) {
    return 'en'; // Default to English for empty input
  }

  // Remove whitespace and punctuation for analysis
  const cleanedText = text.replace(/[\s\p{P}]/gu, '');

  if (cleanedText.length === 0) {
    return 'en';
  }

  // Count Chinese characters (CJK Unified Ideographs)
  const chineseCharCount = (cleanedText.match(/[\u4e00-\u9fff]/g) || []).length;

  // Count English letters
  const englishCharCount = (cleanedText.match(/[a-zA-Z]/g) || []).length;

  // Calculate percentages
  const totalChars = cleanedText.length;
  const chinesePercentage = chineseCharCount / totalChars;
  const englishPercentage = englishCharCount / totalChars;

  // If Chinese characters make up more than 30% of the text, consider it Chinese
  if (chinesePercentage > 0.3) {
    return 'zh';
  }

  // If English characters make up more than 50% of the text, consider it English
  if (englishPercentage > 0.5) {
    return 'en';
  }

  // Default to English for ambiguous cases
  return 'en';
}

/**
 * Determines the output language based on:
 * 1. User input language
 * 2. Content context (previous messages)
 * 3. User's previous language preference
 */
export function determineOutputLanguage(
  userInput: string,
  previousLanguagePreference?: Language,
  conversationHistory?: Array<{ role: string; content: string }>
): Language {
  // First, detect the language of the current user input
  const inputLanguage = detectLanguage(userInput);

  // If no previous preference or history, use the input language
  if (!previousLanguagePreference && (!conversationHistory || conversationHistory.length === 0)) {
    return inputLanguage;
  }

  // Analyze recent conversation context (last 3 messages)
  let contextLanguage: Language | null = null;
  if (conversationHistory && conversationHistory.length > 0) {
    const recentMessages = conversationHistory.slice(-3);
    const languageCounts = { zh: 0, en: 0 };

    recentMessages.forEach(msg => {
      const lang = detectLanguage(msg.content);
      languageCounts[lang]++;
    });

    contextLanguage = languageCounts.zh > languageCounts.en ? 'zh' : 'en';
  }

  // Decision logic:
  // 1. If user explicitly switches language (input differs from context), follow the input
  if (contextLanguage && inputLanguage !== contextLanguage) {
    return inputLanguage;
  }

  // 2. Otherwise, use the input language (which may match context)
  return inputLanguage;
}
