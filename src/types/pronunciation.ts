/**
 * Pronunciation Practice Types
 *
 * Types for shadowing, minimal pairs, and listen-repeat exercises.
 */

export type DrillType = 'shadowing' | 'minimal_pair' | 'listen_repeat' | 'pitch_accent';
export type Difficulty = 'easy' | 'medium' | 'hard';

// Shadowing content
export interface ShadowingSegment {
  start: number; // milliseconds
  end: number;
  text: string;
  reading?: string;
  translation?: string;
}

export interface ShadowingContent {
  text: string;
  reading?: string;
  translation: string;
  audioUrl: string;
  segments: ShadowingSegment[];
  speed: 'slow' | 'normal' | 'fast';
}

// Minimal pair content
export interface MinimalPairItem {
  word1: string;
  word1Meaning?: string;
  word1Audio?: string;
  word2: string;
  word2Meaning?: string;
  word2Audio?: string;
  distinction: string;
  explanation?: string;
}

export interface MinimalPairContent {
  pairs: MinimalPairItem[];
  category: string;
}

// Listen-repeat content
export interface ListenRepeatPhrase {
  text: string;
  reading?: string;
  translation: string;
  audioUrl: string;
  pauseDuration: number; // milliseconds
}

export interface ListenRepeatContent {
  phrases: ListenRepeatPhrase[];
  repeatCount: number;
}

// Pitch accent content (for Japanese)
export interface PitchAccentItem {
  word: string;
  reading: string;
  meaning: string;
  pitchPattern: string;
  audioUrl?: string;
}

export interface PitchAccentContent {
  items: PitchAccentItem[];
}

export type DrillContent = ShadowingContent | MinimalPairContent | ListenRepeatContent | PitchAccentContent;

export interface PronunciationDrill {
  id: string;
  type: DrillType;
  level: string;
  title: string;
  description?: string;
  content: DrillContent;
  audioUrl?: string;
  difficulty: Difficulty;
}

// Exercise state
export interface ShadowingState {
  currentSegmentIndex: number;
  isPlaying: boolean;
  isPaused: boolean;
  speed: 'slow' | 'normal' | 'fast';
  completedSegments: number[];
}

export interface MinimalPairState {
  currentPairIndex: number;
  playedWord: 1 | 2 | null;
  userGuess: 1 | 2 | null;
  isCorrect: boolean | null;
  score: number;
  totalAttempts: number;
}

export interface ListenRepeatState {
  currentPhraseIndex: number;
  phase: 'listening' | 'repeating' | 'complete';
  repeatCount: number;
  completedPhrases: number[];
}

// Progress tracking
export interface PronunciationProgress {
  drillId: string;
  drillType: DrillType;
  completed: boolean;
  score?: number;
  completedAt?: string;
  timeSpent: number; // seconds
}
