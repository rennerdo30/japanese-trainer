/**
 * Data Loader - Centralized module for loading language-specific data
 *
 * This module provides a registry-based approach to loading data for different languages.
 * To add a new language:
 * 1. Create the data files in src/data/{lang}/
 * 2. Add the language to the VOCABULARY_LOADERS map
 * 3. Add the language to language-configs.json
 *
 * No other code changes should be needed!
 */

import { VocabularyItem } from '@/types';

// Valid language codes for vocabulary data
const VALID_LANGUAGE_CODES = ['ja', 'ko', 'zh', 'es', 'de', 'en', 'it', 'fr', 'pt', 'ar', 'ru', 'hi'] as const;
type LanguageCode = typeof VALID_LANGUAGE_CODES[number];

function isValidLanguageCode(code: string): code is LanguageCode {
  return VALID_LANGUAGE_CODES.includes(code as LanguageCode);
}

// Cache for loaded vocabulary data
const vocabularyCache = new Map<string, VocabularyItem[]>();

// Loading state to prevent duplicate requests
const loadingPromises = new Map<string, Promise<VocabularyItem[]>>();

// Helper to extract vocabulary array from different JSON structures
const extractVocabulary = (data: unknown): VocabularyItem[] => {
  if (Array.isArray(data)) {
    return data as VocabularyItem[];
  }
  if (data && typeof data === 'object' && 'vocabulary' in data) {
    return (data as { vocabulary: VocabularyItem[] }).vocabulary;
  }
  return [];
};

/**
 * Dynamic import loaders for vocabulary data
 * Each language has a dynamic import function
 */
const VOCABULARY_LOADERS: Record<string, () => Promise<unknown>> = {
  ja: () => import('@/data/ja/vocabulary.json').then(m => m.default),
  ko: () => import('@/data/ko/vocabulary.json').then(m => m.default),
  zh: () => import('@/data/zh/vocabulary.json').then(m => m.default),
  es: () => import('@/data/es/vocabulary.json').then(m => m.default),
  de: () => import('@/data/de/vocabulary.json').then(m => m.default),
  en: () => import('@/data/en/vocabulary.json').then(m => m.default),
  it: () => import('@/data/it/vocabulary.json').then(m => m.default),
};

/**
 * Load vocabulary data asynchronously for a specific language.
 * Results are cached to avoid repeated loading.
 * Uses request deduplication to prevent concurrent duplicate requests.
 */
export async function loadVocabularyData(lang: string): Promise<VocabularyItem[]> {
  // Validate language code
  if (!isValidLanguageCode(lang) && !VOCABULARY_LOADERS[lang]) {
    console.warn(`Unknown language code: ${lang}, falling back to 'ja'`);
    lang = 'ja';
  }

  // Return cached data if available
  if (vocabularyCache.has(lang)) {
    return vocabularyCache.get(lang)!;
  }

  // Check if already loading - deduplicate concurrent requests
  if (loadingPromises.has(lang)) {
    return loadingPromises.get(lang)!;
  }

  // Get loader for language
  const loader = VOCABULARY_LOADERS[lang];
  if (!loader) {
    console.warn(`No vocabulary data for language: ${lang}, falling back to 'ja'`);
    return loadVocabularyData('ja');
  }

  // Create loading promise
  const loadPromise = (async () => {
    try {
      const data = await loader();
      const vocabulary = extractVocabulary(data);
      vocabularyCache.set(lang, vocabulary);
      return vocabulary;
    } catch (error) {
      console.error(`Failed to load vocabulary for ${lang}:`, error);
      // Fall back to Japanese if available
      if (lang !== 'ja' && vocabularyCache.has('ja')) {
        return vocabularyCache.get('ja')!;
      }
      return [];
    } finally {
      loadingPromises.delete(lang);
    }
  })();

  loadingPromises.set(lang, loadPromise);
  return loadPromise;
}

/**
 * Get vocabulary data synchronously from cache.
 * Returns empty array if not loaded yet.
 * Use loadVocabularyData() to ensure data is loaded first.
 *
 * @deprecated Use loadVocabularyData() for async loading instead
 */
export function getVocabularyData(lang: string): VocabularyItem[] {
  // Check cache first
  if (vocabularyCache.has(lang)) {
    return vocabularyCache.get(lang)!;
  }

  // Trigger async load for future use
  loadVocabularyData(lang).catch(() => {
    // Error already logged in loadVocabularyData
  });

  // Return empty array synchronously - data will be available on next render
  return [];
}

/**
 * Check if vocabulary data is loaded for a language
 */
export function isVocabularyLoaded(lang: string): boolean {
  return vocabularyCache.has(lang);
}

/**
 * Check if vocabulary data exists for a language
 */
export function hasVocabularyData(lang: string): boolean {
  return lang in VOCABULARY_LOADERS;
}

/**
 * Get all available languages for vocabulary
 */
export function getVocabularyLanguages(): string[] {
  return Object.keys(VOCABULARY_LOADERS);
}

/**
 * Preload vocabulary data for a language (doesn't block)
 */
export function preloadVocabularyData(lang: string): void {
  if (!vocabularyCache.has(lang) && !loadingPromises.has(lang)) {
    loadVocabularyData(lang).catch(() => {
      // Error already logged in loadVocabularyData
    });
  }
}

/**
 * Get the level field name for a vocabulary item
 * Different languages may use different field names:
 * - Japanese: jlpt
 * - Korean: level (with TOPIK values)
 * - Chinese: level (with HSK values)
 * - European languages: level (with CEFR values)
 */
export function getItemLevel(item: VocabularyItem): string {
  // Check various level field names that different language data might use
  return item.jlpt || item.level || '';
}

/**
 * Filter vocabulary items by level IDs
 * Uses the levels array from language-configs.json
 */
export function filterVocabularyByLevels(
  items: VocabularyItem[],
  activeLevelIds: string[]
): VocabularyItem[] {
  if (activeLevelIds.length === 0) return [];

  return items.filter(item => {
    const itemLevel = getItemLevel(item);
    return activeLevelIds.includes(itemLevel);
  });
}

/**
 * Clear vocabulary cache (useful for testing or memory management)
 */
export function clearVocabularyCache(): void {
  vocabularyCache.clear();
}
