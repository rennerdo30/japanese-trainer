/**
 * Helper functions for getting language-specific translations from data items
 */

/**
 * Get the meaning for a vocabulary/kanji item in the specified language
 * Falls back to English, then the legacy 'meaning' field
 */
export function getMeaning(
  item: { meaning?: string; meanings?: Record<string, string> },
  language: string
): string {
  // Try to get translation for current language
  if (item.meanings && item.meanings[language]) {
    return item.meanings[language];
  }
  
  // Fallback to English
  if (item.meanings && item.meanings['en']) {
    return item.meanings['en'];
  }
  
  // Fallback to legacy meaning field
  if (item.meaning) {
    return item.meaning;
  }
  
  return '';
}

/**
 * Get a translation from a translations object
 * Falls back to English, then the provided default
 */
export function getTranslation(
  translations: Record<string, string> | undefined,
  language: string,
  fallback: string = ''
): string {
  if (!translations) return fallback;
  
  // Try current language
  if (translations[language]) {
    return translations[language];
  }
  
  // Fallback to English
  if (translations['en']) {
    return translations['en'];
  }
  
  // Return first available translation or fallback
  const firstKey = Object.keys(translations)[0];
  return firstKey ? translations[firstKey] : fallback;
}

/**
 * Get an array of translations (for options, etc.)
 * Falls back to English, then the provided default array
 */
export function getTranslations(
  translations: Record<string, string[]> | undefined,
  language: string,
  fallback: string[] = []
): string[] {
  if (!translations) return fallback;
  
  // Try current language
  if (translations[language]) {
    return translations[language];
  }
  
  // Fallback to English
  if (translations['en']) {
    return translations['en'];
  }
  
  // Return first available translation or fallback
  const firstKey = Object.keys(translations)[0];
  return firstKey ? translations[firstKey] : fallback;
}
