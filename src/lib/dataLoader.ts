/**
 * Data Loader - Centralized module for loading language-specific data
 *
 * This module provides a registry-based approach to loading data for different languages.
 * To add a new language:
 * 1. Create the data files in src/data/{lang}/
 * 2. Import the data files below
 * 3. Add entries to the DATA_REGISTRY
 * 4. Add the language to language-configs.json
 *
 * No other code changes should be needed!
 */

import { VocabularyItem } from '@/types';

// Import vocabulary data for all languages
import jaVocabJson from '@/data/ja/vocabulary.json';
import koVocabJson from '@/data/ko/vocabulary.json';
import zhVocabJson from '@/data/zh/vocabulary.json';
import esVocabJson from '@/data/es/vocabulary.json';
import deVocabJson from '@/data/de/vocabulary.json';
import enVocabJson from '@/data/en/vocabulary.json';
import itVocabJson from '@/data/it/vocabulary.json';

// Type for the data registry
interface DataRegistry {
  vocabulary: Record<string, VocabularyItem[]>;
  // Add other data types as needed:
  // grammar: Record<string, GrammarItem[]>;
  // characters: Record<string, CharacterItem[]>;
}

/**
 * DATA_REGISTRY - Central registry for all language data
 *
 * To add a new language, simply:
 * 1. Import the JSON file above
 * 2. Add an entry here with the language code as key
 */
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

const DATA_REGISTRY: DataRegistry = {
  vocabulary: {
    ja: extractVocabulary(jaVocabJson),
    ko: extractVocabulary(koVocabJson),
    zh: extractVocabulary(zhVocabJson),
    es: extractVocabulary(esVocabJson),
    de: extractVocabulary(deVocabJson),
    en: extractVocabulary(enVocabJson),
    it: extractVocabulary(itVocabJson),
  },
};

/**
 * Get vocabulary data for a specific language
 * Falls back to Japanese if the language is not found
 */
export function getVocabularyData(lang: string): VocabularyItem[] {
  return DATA_REGISTRY.vocabulary[lang] || DATA_REGISTRY.vocabulary['ja'] || [];
}

/**
 * Check if vocabulary data exists for a language
 */
export function hasVocabularyData(lang: string): boolean {
  return lang in DATA_REGISTRY.vocabulary;
}

/**
 * Get all available languages for vocabulary
 */
export function getVocabularyLanguages(): string[] {
  return Object.keys(DATA_REGISTRY.vocabulary);
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
