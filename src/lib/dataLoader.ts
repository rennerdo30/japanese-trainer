/**
 * Data Loader - Centralized module for loading language-specific data
 *
 * This module provides HTTP fetch-based loading from public/data/.
 * To add a new language:
 * 1. Create the data files in public/data/{lang}/
 * 2. Add the language to language-configs.json
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

// Languages that have vocabulary data available in public/data/
const LANGUAGES_WITH_VOCABULARY = ['ja', 'ko', 'zh', 'es', 'de', 'en', 'it'] as const;

// Cache for loaded vocabulary data
const vocabularyCache = new Map<string, VocabularyItem[]>();

// Loading state to prevent duplicate requests
const loadingPromises = new Map<string, Promise<VocabularyItem[]>>();

// Normalize a single vocabulary item to handle format differences
const normalizeVocabularyItem = (item: Record<string, unknown>): VocabularyItem => {
  // Handle audioUrl vs audio_url
  const audioUrl = (item.audioUrl as string | undefined) || (item.audio_url as string | undefined);

  // Handle examples format differences
  const rawExamples = item.examples as Array<Record<string, unknown>> | undefined;
  const examples = rawExamples?.map(ex => ({
    sentence: (ex.sentence as string) || (ex.ja as string) || (ex.example as string) || '',
    translation: (ex.translation as string) || (ex.en as string) || '',
  }));

  return {
    ...(item as unknown as VocabularyItem),
    audioUrl,
    examples,
  } as VocabularyItem;
};

// Helper to extract vocabulary array from different JSON structures
const extractVocabulary = (data: unknown): VocabularyItem[] => {
  let items: Array<Record<string, unknown>> = [];

  if (Array.isArray(data)) {
    items = data as Array<Record<string, unknown>>;
  } else if (data && typeof data === 'object' && 'vocabulary' in data) {
    items = (data as { vocabulary: Array<Record<string, unknown>> }).vocabulary;
  }

  // Normalize each item to handle format differences
  return items.map(normalizeVocabularyItem);
};

/**
 * Load vocabulary data asynchronously for a specific language.
 * Fetches from public/data/{lang}/vocabulary.json via HTTP.
 * Results are cached to avoid repeated loading.
 * Uses request deduplication to prevent concurrent duplicate requests.
 */
export async function loadVocabularyData(lang: string): Promise<VocabularyItem[]> {
  // Validate language code
  if (!isValidLanguageCode(lang)) {
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

  // Check if language has vocabulary data
  if (!LANGUAGES_WITH_VOCABULARY.includes(lang as typeof LANGUAGES_WITH_VOCABULARY[number])) {
    console.warn(`No vocabulary data for language: ${lang}, falling back to 'ja'`);
    return loadVocabularyData('ja');
  }

  // Create loading promise - fetch from public/data/
  const loadPromise = (async () => {
    try {
      const response = await fetch(`/data/${lang}/vocabulary.json`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
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
  return LANGUAGES_WITH_VOCABULARY.includes(lang as typeof LANGUAGES_WITH_VOCABULARY[number]);
}

/**
 * Get all available languages for vocabulary
 */
export function getVocabularyLanguages(): string[] {
  return [...LANGUAGES_WITH_VOCABULARY];
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

// ============================================================================
// LESSON DATA LOADING
// ============================================================================

export interface LessonData {
  id: number;
  slug: string;
  name: string;
  type: 'alphabet' | 'vocabulary' | 'grammar' | 'reading' | 'listening' | 'mixed';
  content: {
    characters?: string[];
    vocabularyIds?: string[];
    grammarIds?: string[];
    readingIds?: string[];
    listeningIds?: string[];
  };
  prerequisite_slug: string | null;
  estimated_minutes: number;
  language_id: number;
  level?: string;
  description?: string;
}

export interface CurriculumPath {
  path: {
    id: number;
    slug: string;
    name: string;
    description: string;
    type: 'linear' | 'flexible';
    estimated_hours: number;
    difficulty: string;
    language_id: number;
  };
  milestones: Array<{
    id: number;
    slug: string;
    level: string;
    name: string;
    description: string;
    module: string;
    requirement: {
      type: string;
      value?: number;
    };
    estimated_hours: number;
    path_id: number;
  }>;
}

// Cache for lessons and curriculum data
const lessonsCache = new Map<string, LessonData[]>();
const curriculumCache = new Map<string, CurriculumPath[]>();
const lessonsLoadingPromises = new Map<string, Promise<LessonData[]>>();
const curriculumLoadingPromises = new Map<string, Promise<CurriculumPath[]>>();

/**
 * Load lessons data for a specific language.
 * Fetches from public/data/{lang}/lessons.json via HTTP.
 */
export async function loadLessonsData(lang: string): Promise<LessonData[]> {
  if (!isValidLanguageCode(lang)) {
    console.warn(`Unknown language code: ${lang}, falling back to 'ja'`);
    lang = 'ja';
  }

  if (lessonsCache.has(lang)) {
    return lessonsCache.get(lang)!;
  }

  if (lessonsLoadingPromises.has(lang)) {
    return lessonsLoadingPromises.get(lang)!;
  }

  const loadPromise = (async () => {
    try {
      const response = await fetch(`/data/${lang}/lessons.json`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      const lessons = Array.isArray(data) ? data : [];
      lessonsCache.set(lang, lessons);
      return lessons;
    } catch (error) {
      console.error(`Failed to load lessons for ${lang}:`, error);
      return [];
    } finally {
      lessonsLoadingPromises.delete(lang);
    }
  })();

  lessonsLoadingPromises.set(lang, loadPromise);
  return loadPromise;
}

/**
 * Load curriculum/learning paths for a specific language.
 * Fetches from public/data/{lang}/curriculum.json via HTTP.
 */
export async function loadCurriculumData(lang: string): Promise<CurriculumPath[]> {
  if (!isValidLanguageCode(lang)) {
    console.warn(`Unknown language code: ${lang}, falling back to 'ja'`);
    lang = 'ja';
  }

  if (curriculumCache.has(lang)) {
    return curriculumCache.get(lang)!;
  }

  if (curriculumLoadingPromises.has(lang)) {
    return curriculumLoadingPromises.get(lang)!;
  }

  const loadPromise = (async () => {
    try {
      const response = await fetch(`/data/${lang}/curriculum.json`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      const curriculum = Array.isArray(data) ? data : [];
      curriculumCache.set(lang, curriculum);
      return curriculum;
    } catch (error) {
      console.error(`Failed to load curriculum for ${lang}:`, error);
      return [];
    } finally {
      curriculumLoadingPromises.delete(lang);
    }
  })();

  curriculumLoadingPromises.set(lang, loadPromise);
  return loadPromise;
}

/**
 * Get lessons ordered by prerequisites (topological sort).
 * Returns lessons in the order they should be completed.
 */
export function getOrderedLessons(lessons: LessonData[]): LessonData[] {
  const slugToLesson = new Map(lessons.map(l => [l.slug, l]));
  const ordered: LessonData[] = [];
  const visited = new Set<string>();

  function visit(lesson: LessonData) {
    if (visited.has(lesson.slug)) return;

    // Visit prerequisite first
    if (lesson.prerequisite_slug) {
      const prereq = slugToLesson.get(lesson.prerequisite_slug);
      if (prereq) visit(prereq);
    }

    visited.add(lesson.slug);
    ordered.push(lesson);
  }

  // Find root lessons (no prerequisite) and process from there
  const roots = lessons.filter(l => !l.prerequisite_slug);
  roots.forEach(visit);

  // Process any remaining lessons (in case of disconnected graphs)
  lessons.forEach(visit);

  return ordered;
}

/**
 * Get a single lesson by slug.
 */
export function getLessonBySlug(lessons: LessonData[], slug: string): LessonData | undefined {
  return lessons.find(l => l.slug === slug);
}

/**
 * Get lessons filtered by type.
 */
export function getLessonsByType(lessons: LessonData[], type: LessonData['type']): LessonData[] {
  return lessons.filter(l => l.type === type);
}

/**
 * Check if lessons data is loaded for a language.
 */
export function isLessonsLoaded(lang: string): boolean {
  return lessonsCache.has(lang);
}

/**
 * Preload lessons data for a language.
 */
export function preloadLessonsData(lang: string): void {
  if (!lessonsCache.has(lang) && !lessonsLoadingPromises.has(lang)) {
    loadLessonsData(lang).catch(() => {
      // Error already logged
    });
  }
}

/**
 * Clear all data caches.
 */
export function clearAllCaches(): void {
  vocabularyCache.clear();
  lessonsCache.clear();
  curriculumCache.clear();
  learningPathsCache.clear();
}

// ============================================================================
// LEARNING PATHS DATA LOADING (AI-generated curriculum)
// ============================================================================

export interface LearningPathMilestone {
  id: string;
  level: string;
  name: string;
  description: string;
  module: string;
  requirement: {
    type: 'complete-all' | 'master-percentage';
    value?: number;
  };
  estimatedHours: number;
  lessons?: string[];
}

export interface LearningPath {
  id: string;
  type: 'linear' | 'topic';
  name: string;
  description: string;
  icon: string;
  language: string;
  estimatedHours: number;
  difficulty: string;
  milestones: LearningPathMilestone[];
  tags?: string[];
  prerequisites?: string[];
  items?: {
    vocabulary?: string[];
    grammar?: string[];
    reading?: string[];
    kanji?: string[];
  };
}

export interface LearningPathsData {
  paths: Record<string, LearningPath>;
  pathOrder: string[];
}

// Cache for learning paths data
const learningPathsCache = new Map<string, LearningPathsData>();
const learningPathsLoadingPromises = new Map<string, Promise<LearningPathsData | null>>();

/**
 * Load learning paths data for a specific language.
 * Fetches from public/data/{lang}/learning-paths.json via HTTP.
 * This is the AI-generated curriculum data.
 */
export async function loadLearningPathsData(lang: string): Promise<LearningPathsData | null> {
  if (!isValidLanguageCode(lang)) {
    console.warn(`Unknown language code: ${lang}, falling back to 'ja'`);
    lang = 'ja';
  }

  if (learningPathsCache.has(lang)) {
    return learningPathsCache.get(lang)!;
  }

  if (learningPathsLoadingPromises.has(lang)) {
    return learningPathsLoadingPromises.get(lang)!;
  }

  const loadPromise = (async () => {
    try {
      const response = await fetch(`/data/${lang}/learning-paths.json`);
      if (!response.ok) {
        // No AI-generated paths for this language yet
        console.log(`No learning paths data for ${lang} (HTTP ${response.status})`);
        return null;
      }
      const data = await response.json();

      // Validate structure
      if (data && typeof data === 'object' && 'paths' in data) {
        learningPathsCache.set(lang, data as LearningPathsData);
        return data as LearningPathsData;
      }

      console.warn(`Invalid learning paths format for ${lang}`);
      return null;
    } catch (error) {
      console.log(`Failed to load learning paths for ${lang}:`, error);
      return null;
    } finally {
      learningPathsLoadingPromises.delete(lang);
    }
  })();

  learningPathsLoadingPromises.set(lang, loadPromise);
  return loadPromise;
}

/**
 * Check if learning paths data is loaded for a language.
 */
export function isLearningPathsLoaded(lang: string): boolean {
  return learningPathsCache.has(lang);
}

/**
 * Preload learning paths data for a language.
 */
export function preloadLearningPathsData(lang: string): void {
  if (!learningPathsCache.has(lang) && !learningPathsLoadingPromises.has(lang)) {
    loadLearningPathsData(lang).catch(() => {
      // Error already logged
    });
  }
}
