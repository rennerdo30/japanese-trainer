// Shared type definitions

// Japanese character types
export type JapaneseCharacterType = 'gojuon' | 'yoon' | 'dakuten' | 'handakuten';
// Korean character types
export type KoreanCharacterType = 'consonant' | 'vowel' | 'double_consonant' | 'compound_vowel';
// Combined character type for multi-language support
export type CharacterType = JapaneseCharacterType | KoreanCharacterType;

export interface Character {
  romaji: string;
  hiragana: string;
  type: CharacterType;
  audioUrl?: string;
  // Learn mode extensions
  group?: string;
  order?: number;
  name?: string;
  mnemonic?: {
    en: string;
    es?: string;
    [key: string]: string | undefined;
  };
}

// Extended character type for Korean with native field name
export interface KoreanCharacter {
  romaji: string;
  character: string;
  type: KoreanCharacterType;
  name?: string;
  group?: string;
  order?: number;
  mnemonic?: {
    en: string;
    es?: string;
    [key: string]: string | undefined;
  };
  audioUrl?: string;
}

// Lesson structure for alphabet learning
export interface AlphabetLesson {
  id: string;
  name: string;
  nameKey?: string;
  characters: string[];
  prerequisite: string | null;
  estimatedMinutes: number;
}

// Alphabet lesson path configuration
export interface AlphabetLessonPath {
  name: string;
  nameKey?: string;
  description: string;
  descriptionKey?: string;
  lessons: AlphabetLesson[];
}

export interface Filter {
  id: string;
  label: string;
  checked: boolean;
  type: 'checkbox' | 'radio';
  name?: string;
}

export interface VocabularyItem {
  id: string;
  word: string;
  reading: string;
  meaning: string; // Legacy: kept for backward compatibility, use meanings instead
  meanings?: Record<string, string | string[]>; // Language code -> meaning translation (string or array)
  romaji: string;
  jlpt?: string;
  level?: string; // Generic level field for non-Japanese languages (CEFR, TOPIK, HSK, etc.)
  audioUrl?: string;
  [key: string]: unknown; // Allow additional properties for type checking
}

export interface KanjiItem {
  id: string;
  kanji: string;
  meaning: string; // Legacy: kept for backward compatibility, use meanings instead
  meanings?: Record<string, string>; // Language code -> meaning translation
  onyomi: string[];
  kunyomi: string[];
  strokes?: number;
  jlpt?: string;
  radicals?: string[];
  audioUrl?: string;
  examples?: Array<{
    word: string;
    reading: string;
    meaning: string; // Legacy
    meanings?: Record<string, string>; // Language code -> meaning translation
    audioUrl?: string;
  }>;
}

export interface GrammarItem {
  id: string;
  title: string;
  titleTranslations?: Record<string, string>; // Language code -> title translation
  explanation: string; // Legacy: English explanation
  explanations?: Record<string, string>; // Language code -> explanation translation
  examples: Array<{
    japanese: string;
    english: string; // Legacy
    translations?: Record<string, string>; // Language code -> translation
    audioUrl?: string;
  }>;
  exercises?: Array<{
    question: string;
    questionTranslations?: Record<string, string>; // Language code -> question translation
    options: string[];
    optionTranslations?: Record<string, string[]>; // Language code -> options translations
    correct: number;
  }>;
  jlpt?: string;
}

export interface ReadingItem {
  id: string;
  title: string;
  titleTranslations?: Record<string, string>; // Language code -> title translation
  text: string;
  level: string;
  audioUrl?: string;
  vocabulary?: Array<{
    word: string;
    reading: string;
    meaning: string; // Legacy
    meanings?: Record<string, string>; // Language code -> meaning translation
  }>;
  questions?: Array<{
    question: string;
    questionTranslations?: Record<string, string>; // Language code -> question translation
    options: string[];
    optionTranslations?: Record<string, string[]>; // Language code -> options translations
    correct: number;
  }>;
}

export interface ListeningExercise {
  id: string;
  title: string;
  level: string;
  text: string;
  transcript: string;
  audioUrl?: string;
}

export interface ModuleStats {
  correct: number;
  total: number;
  streak: number;
  bestStreak?: number;
  wordsMastered?: number;
  kanjiMastered?: number;
  pointsMastered?: number;
  comprehensionScore?: number;
  comprehensionTotal?: number;
  comprehensionCorrect?: number;
  totalAttempts?: number;
  exercisesCompleted?: number;
  textsRead?: number;
  accuracy?: number;
}

// SRS Review data for spaced repetition
export interface ReviewData {
  interval: number;
  easeFactor: number;
  nextReview: string; // ISO date string
  repetitions: number;
  lastReview?: string;
}

export interface ModuleData {
  learned?: string[];
  reviews?: Record<string, ReviewData>;
  stats: ModuleStats;
  completed?: string[];
}

// Storage data structure for progress tracking
export interface StorageData {
  alphabet?: ModuleData;
  vocabulary?: ModuleData;
  kanji?: ModuleData;
  grammar?: ModuleData;
  reading?: ModuleData;
  listening?: ModuleData;
  globalStats?: {
    streak: number;
    bestStreak: number;
    totalStudyTime: number;
    lastActive: string;
  };
}
