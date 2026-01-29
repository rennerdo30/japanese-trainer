// Exercise types for lessons

export type ExerciseType =
  | 'multiple_choice'
  | 'fill_blank'
  | 'matching'
  | 'translation'
  | 'listening'
  | 'word_order'
  | 'typing'
  | 'stroke_order';

// Cognitive level for exercises (Bloom's taxonomy adapted)
export type CognitiveLevel = 'recognition' | 'supported' | 'guided' | 'independent';

// Skill focus for exercises
export type SkillFocus = 'reading' | 'writing' | 'listening' | 'speaking' | 'grammar';

export interface BaseExercise {
  id: string;
  type: ExerciseType;
  difficulty?: 'easy' | 'medium' | 'hard';
  // Enhanced exercise fields
  cognitiveLevel?: CognitiveLevel;
  skillFocus?: SkillFocus;
  explanation?: string;
  wrongAnswerExplanations?: Record<string, string>;
  hint?: string;
}

export interface MultipleChoiceExercise extends BaseExercise {
  type: 'multiple_choice';
  question: string;
  questionAudio?: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

export interface FillBlankExercise extends BaseExercise {
  type: 'fill_blank';
  sentence: string;
  blankPosition: number;
  correctAnswer: string;
  acceptableAnswers?: string[];
  hint?: string;
}

export interface MatchingExercise extends BaseExercise {
  type: 'matching';
  pairs: Array<{
    left: string;
    right: string;
  }>;
}

export interface TranslationExercise extends BaseExercise {
  type: 'translation';
  sourceText: string;
  sourceLanguage: string;
  targetLanguage: string;
  correctTranslation: string;
  acceptableTranslations?: string[];
}

export interface ListeningExercise extends BaseExercise {
  type: 'listening';
  audioUrl: string;
  question: string;
  options: string[];
  correctIndex: number;
  transcript?: string;
}

export interface WordOrderExercise extends BaseExercise {
  type: 'word_order';
  words: string[];
  correctOrder: number[];
  translation?: string;
}

export interface TypingExercise extends BaseExercise {
  type: 'typing';
  prompt: string;           // What to show the user (e.g., "apple")
  correctAnswer: string;    // What they need to type (e.g., "りんご")
  acceptableAnswers?: string[];
  hint?: string;
  audioUrl?: string;
}

export interface StrokeOrderExercise extends BaseExercise {
  type: 'stroke_order';
  character: string;         // The character to practice (e.g., "あ")
  strokes: string[];         // SVG path data for each stroke
  strokeCount: number;       // Expected number of strokes
  audioUrl?: string;
  mnemonic?: string;         // Memory aid for the character
}

export type Exercise =
  | MultipleChoiceExercise
  | FillBlankExercise
  | MatchingExercise
  | TranslationExercise
  | ListeningExercise
  | WordOrderExercise
  | TypingExercise
  | StrokeOrderExercise;

// Exercise result tracking
export interface ExerciseResult {
  exerciseId: string;
  correct: boolean;
  userAnswer: string | number | number[];
  timeSpentMs: number;
}

export interface ExerciseSetResult {
  lessonId: string;
  exercises: ExerciseResult[];
  totalCorrect: number;
  totalExercises: number;
  accuracy: number;
  totalTimeMs: number;
}
