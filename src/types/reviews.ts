// Review queue types for cross-module spaced repetition

// Types of items that can be reviewed
export type ReviewItemType =
  | 'vocabulary'
  | 'kanji'
  | 'hanzi'
  | 'grammar'
  | 'character'
  | 'reading';

// A single item in the review queue
export interface ReviewQueueItem {
  id: string;                    // Unique queue entry ID
  itemId: string;                // Reference to the actual item
  itemType: ReviewItemType;
  lessonId: string;              // Source lesson
  pathId?: string;               // Source path
  languageCode: string;

  // SRS data
  dueAt: number;                 // When this item is due for review
  interval: number;              // Current interval in days
  easeFactor: number;            // SM-2 ease factor
  repetitions: number;           // Number of successful repetitions
  lastReview?: number;           // Last review timestamp
  lastQuality?: number;          // Last quality rating (0-5)

  // Item preview data for quick display
  preview: ReviewItemPreview;
}

// Preview data for quick display without loading full item
export interface ReviewItemPreview {
  front: string;                 // What to show (word, kanji, etc.)
  back: string;                  // Answer (meaning, reading, etc.)
  reading?: string;              // Optional reading
  audioUrl?: string;             // Optional audio
}

// Quality rating for SRS (SM-2 algorithm)
export type ReviewQuality = 0 | 1 | 2 | 3 | 4 | 5;
// 0: Complete blackout
// 1: Incorrect, remembered upon seeing answer
// 2: Incorrect, but answer seemed easy
// 3: Correct with difficulty
// 4: Correct after hesitation
// 5: Perfect recall

// Result of a single review
export interface ReviewResult {
  itemId: string;
  itemType: ReviewItemType;
  quality: ReviewQuality;
  correct: boolean;
  timeSpentSeconds: number;
  reviewedAt: number;

  // Updated SRS data after review
  newInterval: number;
  newEaseFactor: number;
  newDueAt: number;
}

// Review session configuration
export interface ReviewSessionConfig {
  mode: ReviewMode;
  maxItems?: number;             // Limit number of items (default: all due)
  moduleFilter?: ReviewItemType[]; // Filter by module
  lessonFilter?: string[];       // Filter by lesson IDs
  languageCode: string;

  // Session options
  showHints: boolean;
  shuffleItems: boolean;
  reviewNew: boolean;            // Include items not yet reviewed
}

export type ReviewMode =
  | 'smart_mix'                  // AI-selected mix of due items
  | 'module_specific'            // Only items from specific module(s)
  | 'lesson_review'              // Review items from specific lesson(s)
  | 'struggling'                 // Focus on items with low ease factor
  | 'quick';                     // Quick 5-10 item review

// Active review session state
export interface ReviewSession {
  sessionId: string;
  config: ReviewSessionConfig;
  items: ReviewQueueItem[];
  currentIndex: number;
  results: ReviewResult[];
  startedAt: number;
  completedAt?: number;

  // Session stats
  correctCount: number;
  incorrectCount: number;
  totalTimeSeconds: number;
}

// Review session summary
export interface ReviewSessionSummary {
  sessionId: string;
  totalItems: number;
  correctCount: number;
  incorrectCount: number;
  accuracy: number;              // 0-100
  xpEarned: number;
  timeSpentMinutes: number;
  completedAt: number;

  // Breakdown by module
  moduleBreakdown: ReviewModuleBreakdown[];

  // Items that need more practice
  strugglingItems: string[];     // Item IDs with quality < 3
}

export interface ReviewModuleBreakdown {
  module: ReviewItemType;
  total: number;
  correct: number;
  accuracy: number;
}

// Review queue stats
export interface ReviewQueueStats {
  totalItems: number;
  dueNow: number;
  dueToday: number;
  dueThisWeek: number;
  averageEaseFactor: number;

  // Breakdown by module
  byModule: Record<ReviewItemType, {
    total: number;
    dueNow: number;
    averageEaseFactor: number;
  }>;

  // Breakdown by status
  newItems: number;              // Never reviewed
  learningItems: number;         // interval < 1 day
  reviewItems: number;           // interval >= 1 day
  masteredItems: number;         // interval >= 21 days
}

// Review history entry
export interface ReviewHistoryEntry {
  date: string;                  // YYYY-MM-DD
  itemsReviewed: number;
  correctCount: number;
  accuracy: number;
  xpEarned: number;
  timeSpentMinutes: number;
}

// Bulk update for review items
export interface ReviewBulkUpdate {
  itemIds: string[];
  updates: Partial<{
    dueAt: number;
    interval: number;
    easeFactor: number;
    repetitions: number;
  }>;
}
