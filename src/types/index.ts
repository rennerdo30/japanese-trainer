// Shared type definitions

export interface Character {
  romaji: string;
  hiragana: string;
  type: 'gojuon' | 'yoon' | 'dakuten' | 'handakuten';
  audioUrl?: string;
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
  meanings?: Record<string, string>; // Language code -> meaning translation
  romaji: string;
  jlpt?: string;
  audioUrl?: string;
}

export interface KanjiItem {
  id: string;
  kanji: string;
  meaning: string; // Legacy: kept for backward compatibility, use meanings instead
  meanings?: Record<string, string>; // Language code -> meaning translation
  onyomi: string[];
  kunyomi: string[];
  jlpt?: string;
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
  totalAttempts?: number;
  exercisesCompleted?: number;
  textsRead?: number;
  accuracy?: number;
}

export interface ModuleData {
  learned?: string[];
  reviews?: Record<string, any>;
  stats: ModuleStats;
  completed?: string[];
}
