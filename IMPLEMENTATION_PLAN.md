# Murmura Platform Redesign - Implementation Plan

> **Generated:** 2026-01-18
> **Source:** PLAN.md analysis + codebase exploration
> **Scope:** End-User App Redesign + Admin Tooling System

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current State Analysis](#current-state-analysis)
3. [Phase 1: Data Model & Infrastructure](#phase-1-data-model--infrastructure)
4. [Phase 2: Lesson Experience](#phase-2-lesson-experience)
5. [Phase 3: Gamification System](#phase-3-gamification-system)
6. [Phase 4: Dashboard Redesign](#phase-4-dashboard-redesign)
7. [Phase 5: Library Transformation](#phase-5-library-transformation)
8. [Phase 6: Cross-Module Reviews](#phase-6-cross-module-reviews)
9. [Phase 7: Exercise System](#phase-7-exercise-system)
10. [Phase 8: Admin Tooling](#phase-8-admin-tooling)
11. [Testing Requirements](#testing-requirements)
12. [Migration Strategy](#migration-strategy)

---

## Executive Summary

### Transformation Goals

| Current State | Target State |
|---------------|--------------|
| Module-centric (6 independent pages) | Curriculum-driven (path-first journey) |
| Free exploration model | Structured 0-to-100% progression |
| No gamification | XP, streaks, daily goals, achievements |
| Module-specific reviews | Cross-module unified SRS |
| Basic stats tracking | Rich analytics + weekly reports |
| Manual content creation | LLM-powered admin tooling |

### Key Metrics (Research-Backed)
- 7-day streaks → 3.6x engagement
- XP leaderboards → 40% more engagement
- Streak Freeze → 21% churn reduction
- 5-minute lessons → optimal attention span

---

## Current State Analysis

### Existing Architecture

```
src/
├── app/                    # 10 pages (dashboard, modules, settings, etc.)
├── components/             # 40+ components (ui/, common/, alphabet/, etc.)
├── context/                # 4 providers (Language, TargetLanguage, Settings, Progress)
├── hooks/                  # 12 hooks (useTTS, useSRS, useProgress, etc.)
├── lib/                    # 15 utilities (dataLoader, storage, srs, etc.)
├── data/                   # 7 languages with JSON data files
└── types/                  # TypeScript definitions

convex/
├── schema.js               # 8 tables (userData, settings, learningPaths, etc.)
├── auth.ts                 # Password + Anonymous providers
├── userData.js             # Progress queries/mutations
├── settings.js             # User preferences
├── leaderboard.js          # XP calculation (basic)
├── learningPaths.js        # Path tracking (basic)
├── reviewSessions.js       # Review analytics
└── srsSettings.js          # SRS configuration
```

### Data Availability by Language

| Language | Alphabet | Vocabulary | Kanji/Hanzi | Grammar | Reading | Listening |
|----------|----------|------------|-------------|---------|---------|-----------|
| Japanese | ✓ (Hiragana/Katakana) | ✓ (390+) | ✓ | ✓ (13) | ✓ (6) | ✗ |
| Korean | ✓ (Hangul) | ✓ | - | ✓ (36) | ✗ | ✓ |
| Chinese | - | ✓ | ✓ (Hanzi) | ✓ (27) | ✗ | ✓ |
| Spanish | - | ✓ | - | ✓ (25) | ✓ | ✓ |
| German | - | ✓ | - | ✓ (25) | ✗ | ✓ |
| English | - | ✓ | - | ✓ (41) | ✗ | ✓ |
| Italian | - | ✓ | - | ✓ (25) | ✗ | ✓ |

### Current Hooks & Their Purposes

| Hook | Purpose | Needs Update |
|------|---------|--------------|
| `useTargetLanguage()` | Language state, levels, theme | ✓ Add curriculum support |
| `useProgress()` | Module stats tracking | ✓ Add lesson progress |
| `useStorage()` | localStorage wrapper | ✓ Add gamification fields |
| `useTTS()` | 3-tier TTS fallback | ✗ No changes |
| `useSRS()` | SM-2 algorithm | ✓ Add lesson context |
| `useTimer()` | Study timer | ✗ No changes |
| `useRecommendations()` | Learning suggestions | ✓ Curriculum-aware |
| `usePathProgress()` | Path tracking | ✓ Major expansion |

---

## Phase 1: Data Model & Infrastructure

### 1.1 New TypeScript Types

**File:** `src/types/curriculum.ts` (NEW)

```typescript
// 1.1.1 Course Structure Types
export interface Course {
  languageCode: string;          // "ja", "ko", "zh", etc.
  version: string;               // Semantic version "1.0.0"
  levels: Level[];
  metadata: CourseMetadata;
}

export interface CourseMetadata {
  name: string;                  // "Japanese Journey"
  description: string;
  estimatedHours: number;        // Total estimated completion time
  targetProficiency: string;     // "N5", "A1", etc.
  createdAt: string;             // ISO date
  updatedAt: string;
}

export interface Level {
  id: string;                    // "N5", "A1", "HSK1"
  name: string;                  // "Beginner"
  description: string;
  order: number;                 // 1, 2, 3...
  units: Unit[];
  requirements?: {
    previousLevel?: string;      // Must complete N5 before N4
    minimumMastery?: number;     // 80% mastery required
  };
}

export interface Unit {
  id: string;                    // "N5-U1"
  title: string;                 // "Greetings"
  description: string;
  order: number;
  lessons: Lesson[];
  test?: UnitTest;               // Optional unit test
  estimatedMinutes: number;
}

export interface Lesson {
  id: string;                    // "N5-U1-L1"
  title: string;                 // "Hello & Goodbye"
  description: string;
  order: number;
  estimatedMinutes: number;      // Max 5
  content: LessonContent;
  exercises: Exercise[];
  prerequisites?: string[];      // ["N5-U1-L0"]
}

export interface LessonContent {
  introduction: string;          // Lesson intro text
  characters?: CharacterContent[];
  vocabulary?: VocabularyContent[];
  grammar?: GrammarContent[];
  reading?: ReadingContent;
  listening?: ListeningContent;
  culturalNotes?: CulturalNote[];
}

// 1.1.2 Content Types
export interface CharacterContent {
  characterId: string;           // Reference to characters.json
  focusPoints: string[];         // ["stroke order", "similar characters"]
}

export interface VocabularyContent {
  vocabularyId: string;          // Reference to vocabulary.json
  contextSentences?: string[];   // Additional example sentences
  usageNotes?: string;
}

export interface GrammarContent {
  grammarId: string;             // Reference to grammar.json
  practicePrompts?: string[];
}

export interface ReadingContent {
  readingId?: string;            // Reference to readings.json
  inlineText?: string;           // Short inline reading
  comprehensionQuestions?: string[];
}

export interface ListeningContent {
  listeningId?: string;          // Reference to listening.json
  inlineAudioUrl?: string;       // Short inline audio
  dictationText?: string;
}

export interface CulturalNote {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
}

// 1.1.3 Exercise Types
export type ExerciseType =
  | 'multiple_choice'
  | 'fill_blank'
  | 'matching'
  | 'sentence_building'
  | 'typing'
  | 'listening_dictation'
  | 'speaking'
  | 'stroke_order';

export interface Exercise {
  id: string;
  type: ExerciseType;
  question: string;
  questionTranslations?: Record<string, string>;
  data: ExerciseData;
  points: number;                // XP for completion
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface MultipleChoiceData {
  options: string[];
  optionTranslations?: Record<string, string[]>;
  correctIndex: number;
  explanation?: string;
}

export interface FillBlankData {
  sentence: string;              // "I ___ to school every day."
  blanks: BlankSlot[];
  hints?: string[];
}

export interface BlankSlot {
  position: number;              // Character position in sentence
  answer: string;
  acceptableAnswers?: string[]; // Alternative correct answers
}

export interface MatchingData {
  leftColumn: MatchItem[];
  rightColumn: MatchItem[];
  correctPairs: [number, number][]; // Index pairs
}

export interface MatchItem {
  id: string;
  content: string;
  contentType: 'text' | 'image' | 'audio';
}

export interface SentenceBuildingData {
  targetSentence: string;
  words: string[];               // Shuffled word tiles
  distractorWords?: string[];    // Wrong words to confuse
}

export interface TypingData {
  prompt: string;                // "Type: 'Hello' in Japanese"
  expectedAnswer: string;
  acceptableAnswers?: string[];
  showKeyboard?: boolean;        // Virtual keyboard for special chars
}

export interface ListeningDictationData {
  audioUrl: string;
  transcript: string;
  partialHints?: string[];       // Progressive hints
}

export interface SpeakingData {
  targetPhrase: string;
  audioReference?: string;       // Native speaker audio
  acceptablePronunciations?: string[]; // Phonetic variants
}

export interface StrokeOrderData {
  characterId: string;
  strokes: StrokeInfo[];
  animationUrl?: string;
}

export interface StrokeInfo {
  order: number;
  path: string;                  // SVG path data
  direction: string;             // "left-to-right", "top-to-bottom"
}

export type ExerciseData =
  | MultipleChoiceData
  | FillBlankData
  | MatchingData
  | SentenceBuildingData
  | TypingData
  | ListeningDictationData
  | SpeakingData
  | StrokeOrderData;

// 1.1.4 Unit Test Types
export interface UnitTest {
  id: string;                    // "N5-U1-TEST"
  title: string;
  passingScore: number;          // 0.7 = 70%
  timeLimit?: number;            // Minutes (optional)
  exercises: Exercise[];
  retakePolicy: {
    maxAttempts: number;         // 0 = unlimited
    cooldownMinutes: number;     // Wait time between attempts
  };
}

// 1.1.5 Progress Types
export interface LessonProgress {
  lessonId: string;
  status: 'locked' | 'available' | 'in_progress' | 'completed';
  startedAt?: number;
  completedAt?: number;
  score?: number;                // 0-100
  exerciseResults: ExerciseResult[];
  timeSpentMinutes: number;
}

export interface ExerciseResult {
  exerciseId: string;
  correct: boolean;
  attempts: number;
  timeSpentSeconds: number;
  xpEarned: number;
}

export interface UnitProgress {
  unitId: string;
  lessonsCompleted: number;
  lessonsTotal: number;
  testPassed: boolean;
  testScore?: number;
  testAttempts: number;
}

export interface PathProgress {
  pathId: string;                // "ja-journey"
  languageCode: string;
  currentLevel: string;          // "N5"
  currentUnit: string;           // "N5-U1"
  currentLesson: string;         // "N5-U1-L3"
  overallProgress: number;       // 0-100%
  startedAt: number;
  lastActivityAt: number;
  units: Record<string, UnitProgress>;
  lessons: Record<string, LessonProgress>;
}
```

**Checklist - 1.1 Types:**
- [x] Create `src/types/curriculum.ts` with all interfaces
- [x] Create `src/types/exercises.ts` for exercise-specific types
- [x] Create `src/types/gamification.ts` for XP/streak/achievement types
- [x] Update `src/types/index.ts` to export new types
- [x] Add `lessonId` field to existing `VocabularyItem` interface
- [x] Add `lessonId` field to existing `GrammarItem` interface
- [x] Add `lessonId` field to existing `KanjiItem` interface
- [x] Add `lessonId` field to existing `ReadingItem` interface
- [x] Run `npx tsc --noEmit` to verify no type errors

---

### 1.2 Gamification Types

**File:** `src/types/gamification.ts` (NEW)

```typescript
// 1.2.1 XP System
export interface XPConfig {
  lessonCompletion: number;      // 50 XP
  exerciseCorrect: number;       // 10 XP
  reviewCorrect: number;         // 5 XP
  streakBonus: number;           // 25 XP per streak day
  perfectLesson: number;         // 100 XP bonus for 100%
  unitTestPass: number;          // 200 XP
  dailyGoalMet: number;          // 50 XP
}

export interface UserXP {
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  history: DailyXP[];
}

export interface DailyXP {
  date: string;                  // "2026-01-18"
  earned: number;
  breakdown: XPBreakdown;
}

export interface XPBreakdown {
  lessons: number;
  exercises: number;
  reviews: number;
  streaks: number;
  bonuses: number;
}

// 1.2.2 Streak System
export interface StreakData {
  current: number;
  best: number;
  lastActivityDate: string;      // "2026-01-18"
  freezesAvailable: number;
  freezesUsed: number;
  freezeHistory: StreakFreeze[];
}

export interface StreakFreeze {
  usedAt: string;
  reason: 'manual' | 'automatic';
}

// 1.2.3 Daily Goals
export type DailyGoalMinutes = 5 | 10 | 15 | 20;

export interface DailyGoal {
  targetMinutes: DailyGoalMinutes;
  completedMinutes: number;
  lessonsCompleted: number;
  reviewsCompleted: number;
  isComplete: boolean;
  completedAt?: number;
}

// 1.2.4 Levels System
export interface UserLevel {
  level: number;                 // 1-100+
  title: string;                 // "Novice", "Apprentice", etc.
  currentXP: number;
  xpToNextLevel: number;
  totalXPEarned: number;
}

export const LEVEL_TITLES: Record<number, string> = {
  1: 'Novice',
  5: 'Apprentice',
  10: 'Student',
  15: 'Scholar',
  20: 'Adept',
  30: 'Expert',
  40: 'Master',
  50: 'Grandmaster',
  75: 'Sage',
  100: 'Legend'
};

// 1.2.5 Achievements
export type AchievementCategory =
  | 'streaks'
  | 'lessons'
  | 'vocabulary'
  | 'kanji'
  | 'grammar'
  | 'reviews'
  | 'time'
  | 'milestones'
  | 'special';

export interface Achievement {
  id: string;                    // "streak_7"
  category: AchievementCategory;
  title: string;                 // "Week Warrior"
  description: string;           // "Maintain a 7-day streak"
  icon: string;                  // Icon name from react-icons
  xpReward: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  requirement: AchievementRequirement;
}

export interface AchievementRequirement {
  type: 'count' | 'streak' | 'time' | 'score' | 'special';
  target: number;
  field?: string;                // "streak.current", "vocabulary.mastered"
}

export interface UserAchievement {
  achievementId: string;
  unlockedAt: number;
  xpEarned: number;
  notified: boolean;             // Has user seen the unlock?
}

// 1.2.6 Weekly Reports
export interface WeeklyReport {
  weekStart: string;             // ISO date
  weekEnd: string;
  summary: {
    totalMinutes: number;
    lessonsCompleted: number;
    reviewsCompleted: number;
    wordsLearned: number;
    accuracy: number;            // 0-100%
    xpEarned: number;
    streakMaintained: boolean;
  };
  dailyBreakdown: DailyStats[];
  moduleBreakdown: ModuleStats[];
  improvements: Improvement[];
  challenges: Challenge[];
}

export interface DailyStats {
  date: string;
  minutes: number;
  lessons: number;
  reviews: number;
  xp: number;
}

export interface ModuleStats {
  module: string;
  itemsLearned: number;
  itemsReviewed: number;
  accuracy: number;
  timeSpent: number;
}

export interface Improvement {
  metric: string;                // "Review accuracy"
  previousValue: number;
  currentValue: number;
  change: number;                // +15%
}

export interface Challenge {
  type: 'weakness' | 'suggestion';
  message: string;
  actionable?: string;           // "Practice kanji readings"
}
```

**Checklist - 1.2 Gamification Types:**
- [x] Create `src/types/gamification.ts` with all interfaces
- [x] Define XP constants in config file
- [x] Define all achievements with requirements
- [x] Add achievements JSON data file
- [x] Export types from `src/types/index.ts`

---

### 1.3 Curriculum Data Files

**File:** `src/data/ja/curriculum.json` (NEW - Example Structure)

```json
{
  "languageCode": "ja",
  "version": "1.0.0",
  "metadata": {
    "name": "Japanese Journey",
    "description": "Master Japanese from complete beginner to JLPT N5",
    "estimatedHours": 120,
    "targetProficiency": "N5",
    "createdAt": "2026-01-18",
    "updatedAt": "2026-01-18"
  },
  "levels": [
    {
      "id": "N5",
      "name": "JLPT N5",
      "description": "Foundation level - basic vocabulary and grammar",
      "order": 1,
      "units": [
        {
          "id": "N5-U1",
          "title": "First Steps",
          "description": "Learn hiragana and basic greetings",
          "order": 1,
          "estimatedMinutes": 120,
          "lessons": [
            {
              "id": "N5-U1-L1",
              "title": "Hiragana: あ Row",
              "description": "Learn the first 5 hiragana characters",
              "order": 1,
              "estimatedMinutes": 5,
              "content": {
                "introduction": "Let's start your Japanese journey by learning the first row of hiragana!",
                "characters": [
                  { "characterId": "hiragana-a", "focusPoints": ["stroke order", "pronunciation"] },
                  { "characterId": "hiragana-i", "focusPoints": ["stroke order"] },
                  { "characterId": "hiragana-u", "focusPoints": ["stroke order"] },
                  { "characterId": "hiragana-e", "focusPoints": ["stroke order"] },
                  { "characterId": "hiragana-o", "focusPoints": ["stroke order"] }
                ],
                "culturalNotes": [
                  {
                    "id": "hiragana-history",
                    "title": "Origin of Hiragana",
                    "content": "Hiragana developed from Chinese characters..."
                  }
                ]
              },
              "exercises": [
                {
                  "id": "N5-U1-L1-E1",
                  "type": "multiple_choice",
                  "question": "Which character is 'a'?",
                  "data": {
                    "options": ["あ", "い", "う", "え"],
                    "correctIndex": 0,
                    "explanation": "あ (a) is the first hiragana character"
                  },
                  "points": 10,
                  "difficulty": "easy"
                }
              ]
            }
          ],
          "test": {
            "id": "N5-U1-TEST",
            "title": "Unit 1 Test",
            "passingScore": 0.7,
            "timeLimit": 10,
            "exercises": [],
            "retakePolicy": {
              "maxAttempts": 0,
              "cooldownMinutes": 60
            }
          }
        }
      ]
    }
  ]
}
```

**Checklist - 1.3 Curriculum Data:**
- [x] Create `src/data/ja/curriculum.json` with full N5 curriculum
- [x] Create `src/data/ko/curriculum.json` for Korean
- [x] Create `src/data/zh/curriculum.json` for Chinese
- [x] Create `src/data/es/curriculum.json` for Spanish
- [x] Create `src/data/de/curriculum.json` for German
- [x] Create `src/data/en/curriculum.json` for English
- [x] Create `src/data/it/curriculum.json` for Italian
- [x] Update existing `vocabulary.json` files to add `lessonId` field
- [x] Update existing `grammar.json` files to add `lessonId` field
- [x] Update existing `kanji.json` / `hanzi.json` to add `lessonId` field
- [x] Create validation script for curriculum JSON structure
- [x] Run validation on all curriculum files

---

### 1.4 Convex Schema Updates

**File:** `convex/schema.js` (MODIFY)

```javascript
// Add to existing schema

// 1.4.1 Path Progress Table (Enhanced)
pathProgress: defineTable({
  userId: v.string(),
  languageCode: v.string(),
  pathId: v.string(),
  currentLevel: v.string(),
  currentUnit: v.string(),
  currentLesson: v.string(),
  overallProgress: v.number(),       // 0-100
  startedAt: v.number(),
  lastActivityAt: v.number(),
  completedAt: v.optional(v.number()),
  // Nested progress data
  unitProgress: v.record(v.string(), v.object({
    lessonsCompleted: v.number(),
    lessonsTotal: v.number(),
    testPassed: v.boolean(),
    testScore: v.optional(v.number()),
    testAttempts: v.number(),
  })),
  lessonProgress: v.record(v.string(), v.object({
    status: v.union(
      v.literal('locked'),
      v.literal('available'),
      v.literal('in_progress'),
      v.literal('completed')
    ),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    score: v.optional(v.number()),
    timeSpentMinutes: v.number(),
  })),
})
  .index("by_userId", ["userId"])
  .index("by_userId_language", ["userId", "languageCode"]),

// 1.4.2 Gamification Table
gamification: defineTable({
  userId: v.string(),
  // XP
  xp: v.object({
    total: v.number(),
    today: v.number(),
    thisWeek: v.number(),
    thisMonth: v.number(),
  }),
  // Level
  level: v.number(),
  levelTitle: v.string(),
  xpToNextLevel: v.number(),
  // Streak
  streak: v.object({
    current: v.number(),
    best: v.number(),
    lastActivityDate: v.string(),
    freezesAvailable: v.number(),
    freezesUsed: v.number(),
  }),
  // Daily Goal
  dailyGoal: v.object({
    targetMinutes: v.number(),
    completedMinutes: v.number(),
    lessonsCompleted: v.number(),
    reviewsCompleted: v.number(),
    isComplete: v.boolean(),
    completedAt: v.optional(v.number()),
  }),
  // Achievements
  achievements: v.array(v.object({
    achievementId: v.string(),
    unlockedAt: v.number(),
    xpEarned: v.number(),
    notified: v.boolean(),
  })),
  // Timestamps
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_userId", ["userId"]),

// 1.4.3 Weekly Reports Table
weeklyReports: defineTable({
  userId: v.string(),
  weekStart: v.string(),           // "2026-01-13"
  weekEnd: v.string(),             // "2026-01-19"
  summary: v.object({
    totalMinutes: v.number(),
    lessonsCompleted: v.number(),
    reviewsCompleted: v.number(),
    wordsLearned: v.number(),
    accuracy: v.number(),
    xpEarned: v.number(),
    streakMaintained: v.boolean(),
  }),
  dailyBreakdown: v.array(v.object({
    date: v.string(),
    minutes: v.number(),
    lessons: v.number(),
    reviews: v.number(),
    xp: v.number(),
  })),
  moduleBreakdown: v.array(v.object({
    module: v.string(),
    itemsLearned: v.number(),
    itemsReviewed: v.number(),
    accuracy: v.number(),
    timeSpent: v.number(),
  })),
  generatedAt: v.number(),
})
  .index("by_userId", ["userId"])
  .index("by_userId_week", ["userId", "weekStart"]),

// 1.4.4 Lesson Sessions Table (for detailed tracking)
lessonSessions: defineTable({
  userId: v.string(),
  sessionId: v.string(),
  lessonId: v.string(),
  pathId: v.string(),
  startedAt: v.number(),
  completedAt: v.optional(v.number()),
  exerciseResults: v.array(v.object({
    exerciseId: v.string(),
    correct: v.boolean(),
    attempts: v.number(),
    timeSpentSeconds: v.number(),
    xpEarned: v.number(),
  })),
  totalXPEarned: v.number(),
  score: v.optional(v.number()),
})
  .index("by_userId", ["userId"])
  .index("by_sessionId", ["sessionId"])
  .index("by_lessonId", ["lessonId"]),

// 1.4.5 Cross-Module Review Queue
reviewQueue: defineTable({
  userId: v.string(),
  items: v.array(v.object({
    itemId: v.string(),
    itemType: v.union(
      v.literal('vocabulary'),
      v.literal('kanji'),
      v.literal('grammar'),
      v.literal('character')
    ),
    lessonId: v.string(),
    dueAt: v.number(),
    interval: v.number(),
    easeFactor: v.number(),
    repetitions: v.number(),
    lastReview: v.optional(v.number()),
  })),
  lastUpdated: v.number(),
})
  .index("by_userId", ["userId"]),
```

**Checklist - 1.4 Schema Updates:**
- [x] Add `pathProgress` table to schema
- [x] Add `gamification` table to schema
- [x] Add `weeklyReports` table to schema
- [x] Add `lessonSessions` table to schema
- [x] Add `reviewQueue` table to schema
- [x] Create indexes for efficient queries
- [x] Run `npx convex dev` to deploy schema
- [x] Verify all tables created in Convex dashboard

---

### 1.5 Convex Mutations & Queries

**File:** `convex/pathProgress.js` (NEW)

```javascript
// Queries
export const getPathProgress = query({...});
export const getCurrentLesson = query({...});
export const getUnitProgress = query({...});
export const getLessonProgress = query({...});

// Mutations
export const initializePath = mutation({...});
export const startLesson = mutation({...});
export const completeLesson = mutation({...});
export const updateLessonProgress = mutation({...});
export const submitUnitTest = mutation({...});
export const unlockNextLesson = mutation({...});
```

**File:** `convex/gamification.js` (NEW)

```javascript
// Queries
export const getGamificationData = query({...});
export const getLeaderboard = query({...});
export const getAchievements = query({...});
export const getWeeklyReport = query({...});

// Mutations
export const awardXP = mutation({...});
export const updateStreak = mutation({...});
export const updateDailyGoal = mutation({...});
export const unlockAchievement = mutation({...});
export const useStreakFreeze = mutation({...});
export const setDailyGoalTarget = mutation({...});
```

**File:** `convex/reviewQueue.js` (NEW)

```javascript
// Queries
export const getReviewQueue = query({...});
export const getDueItems = query({...});
export const getReviewStats = query({...});

// Mutations
export const addToReviewQueue = mutation({...});
export const updateReviewItem = mutation({...});
export const recordReview = mutation({...});
export const bulkUpdateReviews = mutation({...});
```

**Checklist - 1.5 Convex Functions:**
- [x] Create `convex/pathProgress.js` with all queries/mutations
- [x] Create `convex/gamification.js` with all queries/mutations
- [x] Create `convex/reviewQueue.js` with all queries/mutations
- [x] Create `convex/weeklyReports.js` for report generation
- [x] Create `convex/lessonSessions.js` for session tracking
- [x] Add proper validators for all arguments
- [x] Add authentication checks to all functions
- [x] Test all endpoints in Convex dashboard

---

### 1.6 New React Hooks

**File:** `src/hooks/useCurriculum.ts` (NEW)

```typescript
export function useCurriculum() {
  // Returns: curriculum, loading, error, getCourse, getUnit, getLesson
}
```

**File:** `src/hooks/useLessonProgress.ts` (NEW)

```typescript
export function useLessonProgress(lessonId: string) {
  // Returns: progress, startLesson, completeLesson, recordExercise
}
```

**File:** `src/hooks/useGamification.ts` (NEW)

```typescript
export function useGamification() {
  // Returns: xp, level, streak, dailyGoal, achievements, awardXP, updateStreak
}
```

**File:** `src/hooks/useReviewQueue.ts` (NEW)

```typescript
export function useReviewQueue() {
  // Returns: dueItems, totalDue, reviewItem, getNextItem, moduleBreakdown
}
```

**Checklist - 1.6 Hooks:**
- [x] Create `src/hooks/useCurriculum.ts`
- [x] Create `src/hooks/useLessonProgress.ts`
- [x] Create `src/hooks/useGamification.ts`
- [x] Create `src/hooks/useReviewQueue.ts`
- [x] Create `src/hooks/useWeeklyReport.ts`
- [x] Create `src/hooks/useAchievements.ts`
- [x] Update `src/hooks/index.ts` to export new hooks
- [x] Add proper TypeScript types to all hooks
- [x] Add error handling and loading states
- [x] Test hooks in isolation

---

### 1.7 Update Existing Data Files

**Checklist - 1.7 Data Migration:**
- [x] Add `lessonId` field to all items in `ja/vocabulary.json`
- [x] Add `lessonId` field to all items in `ja/grammar.json`
- [x] Add `lessonId` field to all items in `ja/kanji.json`
- [x] Repeat for Korean data files
- [x] Repeat for Chinese data files
- [x] Repeat for Spanish data files
- [x] Repeat for German data files
- [x] Repeat for English data files
- [x] Repeat for Italian data files
- [x] Create script to validate lessonId references
- [x] Run validation script on all data files

---

## Phase 2: Lesson Experience

### 2.1 New Pages

**File:** `src/app/paths/page.tsx` (NEW)

Path selection/overview page showing:
- Current path progress (if enrolled)
- Available paths for current language
- Path selection UI

**Checklist - 2.1.1 Paths Page:**
- [x] Create `src/app/paths/page.tsx`
- [x] Create `src/app/paths/paths.module.css`
- [x] Implement path cards with progress indicators
- [x] Add enrollment flow
- [x] Add language-specific path filtering
- [x] Wrap in ErrorBoundary and LanguageContentGuard
- [x] Add accessibility (keyboard nav, focus states)
- [x] Test on mobile (320px minimum)

**File:** `src/app/paths/[pathId]/page.tsx` (NEW)

Path detail page showing:
- Path overview with progress bar
- Unit list with completion status
- Current lesson highlight
- Unit test access

**Checklist - 2.1.2 Path Detail Page:**
- [x] Create `src/app/paths/[pathId]/page.tsx`
- [x] Create dynamic route handling
- [x] Implement unit accordion/list
- [x] Show lesson cards per unit
- [x] Add "Continue Learning" button
- [x] Add unit test integration
- [x] Handle locked/unlocked states visually

**File:** `src/app/paths/[pathId]/[lessonId]/page.tsx` (NEW)

The core lesson experience page:
- Introduction screen
- Content cards (characters, vocab, grammar)
- Exercises
- Summary screen

**Checklist - 2.1.3 Lesson Page:**
- [x] Create `src/app/paths/[pathId]/[lessonId]/page.tsx`
- [x] Implement lesson flow state machine
- [x] Create introduction screen component
- [x] Create content card components
- [x] Integrate exercise components
- [x] Create summary screen component
- [x] Add progress bar
- [x] Add pause/exit functionality
- [x] Handle lesson completion
- [x] Award XP on completion

---

### 2.2 Lesson Components

**File:** `src/components/lesson/LessonView.tsx` (NEW)

Main lesson container managing:
- Lesson flow (intro → content → exercises → summary)
- Progress tracking
- State persistence

```typescript
interface LessonViewProps {
  lesson: Lesson;
  onComplete: (results: LessonResults) => void;
  onExit: () => void;
}
```

**Checklist - 2.2.1 LessonView:**
- [x] Create `src/components/lesson/LessonView.tsx`
- [x] Create `src/components/lesson/LessonView.module.css`
- [x] Implement flow state machine (intro/content/exercises/summary)
- [x] Add progress persistence (save on each step)
- [x] Add exit confirmation modal
- [x] Handle pause functionality
- [x] Add animations between steps

**File:** `src/components/lesson/LessonIntro.tsx` (NEW)

Introduction screen showing:
- Lesson title and description
- What you'll learn (preview)
- Estimated time
- Start button

**Checklist - 2.2.2 LessonIntro:**
- [x] Create `src/components/lesson/LessonIntro.tsx`
- [x] Display lesson metadata
- [x] Show learning objectives
- [x] Add "Start Lesson" button
- [x] Add animations (fade in)

**File:** `src/components/lesson/LessonCard.tsx` (NEW)

Individual content card for:
- Characters (with stroke order)
- Vocabulary (with audio, meaning, examples)
- Grammar (with explanation, examples)

```typescript
interface LessonCardProps {
  content: CharacterContent | VocabularyContent | GrammarContent;
  onComplete: () => void;
  onAudioPlay: () => void;
}
```

**Checklist - 2.2.3 LessonCard:**
- [x] Create `src/components/lesson/LessonCard.tsx`
- [x] Create variant for character content
- [x] Create variant for vocabulary content
- [x] Create variant for grammar content
- [x] Add TTS integration
- [x] Add "I know this" skip option
- [x] Add swipe gestures for mobile

**File:** `src/components/lesson/LessonSummary.tsx` (NEW)

Summary screen showing:
- Score/performance
- XP earned
- Items learned
- Next lesson preview

**Checklist - 2.2.4 LessonSummary:**
- [x] Create `src/components/lesson/LessonSummary.tsx`
- [x] Display lesson results
- [x] Show XP animation
- [x] Show items learned list
- [x] Add "Continue" and "Review" buttons
- [x] Add share functionality (optional)

**File:** `src/components/lesson/LessonProgress.tsx` (NEW)

Progress indicator showing:
- Current step / total steps
- Section indicator (content vs exercises)
- Time elapsed (optional)

**Checklist - 2.2.5 LessonProgress:**
- [x] Create `src/components/lesson/LessonProgress.tsx`
- [x] Implement progress bar
- [x] Show section labels
- [x] Add animation on progress update

**File:** `src/components/lesson/index.ts` (NEW)

Barrel export for all lesson components.

**Checklist - 2.2.6 Index:**
- [x] Create `src/components/lesson/index.ts`
- [x] Export all lesson components

---

### 2.3 Content Display Components

**File:** `src/components/lesson/CharacterLesson.tsx` (NEW - Enhanced)

Character learning card with:
- Large character display
- Stroke order animation
- Reading/pronunciation
- TTS button
- Mnemonic/memory tip

**Checklist - 2.3.1 CharacterLesson:**
- [x] Create or enhance `src/components/lesson/CharacterLesson.tsx`
- [x] Add stroke order SVG animation
- [x] Add drawing practice canvas (optional)
- [x] Integrate with useTTS hook
- [x] Add mnemonic display
- [x] Handle both hiragana and kanji

**File:** `src/components/lesson/VocabularyLesson.tsx` (NEW)

Vocabulary learning card with:
- Word in target language
- Reading/pronunciation
- Meaning with translations
- Example sentences
- TTS button

**Checklist - 2.3.2 VocabularyLesson:**
- [x] Create `src/components/lesson/VocabularyLesson.tsx`
- [x] Display word with reading
- [x] Show meaning with UI language translation
- [x] Display example sentences
- [x] Add TTS for word and examples
- [x] Add context/usage notes

**File:** `src/components/lesson/GrammarLesson.tsx` (NEW)

Grammar learning card with:
- Grammar point title
- Explanation
- Examples with translations
- Usage notes

**Checklist - 2.3.3 GrammarLesson:**
- [x] Create `src/components/lesson/GrammarLesson.tsx`
- [x] Display grammar title
- [x] Show explanation with translations
- [x] Display example sentences
- [x] Add TTS for examples
- [x] Add "See more" for extended examples

---

### 2.4 Lesson Flow Implementation

**State Machine:**
```
INTRO → CONTENT_1 → CONTENT_2 → ... → EXERCISE_1 → EXERCISE_2 → ... → SUMMARY
```

**Checklist - 2.4 Lesson Flow:**
- [x] Implement lesson state machine
- [x] Handle forward navigation
- [x] Handle back navigation (if allowed)
- [x] Persist state to localStorage
- [x] Resume from saved state
- [x] Handle exit mid-lesson
- [x] Calculate and save results
- [x] Trigger XP award on completion

---

## Phase 3: Gamification System

### 3.1 XP System

**File:** `src/lib/xp.ts` (NEW)

XP calculation utilities:

```typescript
export const XP_CONFIG = {
  lessonCompletion: 50,
  exerciseCorrect: 10,
  exerciseIncorrect: 2,
  reviewCorrect: 5,
  streakDayBonus: 25,
  perfectLesson: 100,
  unitTestPass: 200,
  dailyGoalMet: 50,
};

export function calculateLessonXP(results: LessonResults): number {...}
export function calculateReviewXP(correct: number, total: number): number {...}
export function calculateLevelFromXP(totalXP: number): UserLevel {...}
```

**Checklist - 3.1 XP System:**
- [x] Create `src/lib/xp.ts` with XP calculation functions
- [x] Define XP_CONFIG constants
- [x] Implement `calculateLessonXP()`
- [x] Implement `calculateReviewXP()`
- [x] Implement `calculateLevelFromXP()`
- [x] Create XP breakdown function
- [x] Add XP history tracking

---

### 3.2 Streak System

**File:** `src/lib/streak.ts` (NEW)

Streak management utilities:

```typescript
export function checkStreakStatus(lastActivityDate: string): StreakStatus {...}
export function updateStreak(current: StreakData, activityDate: string): StreakData {...}
export function canUseStreakFreeze(streakData: StreakData): boolean {...}
export function useStreakFreeze(streakData: StreakData): StreakData {...}
```

**Checklist - 3.2 Streak System:**
- [x] Create `src/lib/streak.ts`
- [x] Implement streak check logic
- [x] Implement streak freeze logic
- [x] Handle timezone considerations
- [x] Add streak recovery window (12-hour grace period)
- [x] Integrate with daily goal completion

---

### 3.3 Daily Goals

**File:** `src/components/gamification/DailyGoalSelector.tsx` (NEW)

Daily goal configuration UI:
- 5, 10, 15, 20 minute options
- Visual indicators
- Confirmation on change

**Checklist - 3.3.1 DailyGoalSelector:**
- [x] Create `src/components/gamification/DailyGoalSelector.tsx`
- [x] Display goal options as cards
- [x] Show current selection
- [x] Add change confirmation
- [x] Persist to settings

**File:** `src/components/gamification/DailyGoalProgress.tsx` (NEW)

Daily goal progress display:
- Circular progress ring
- Minutes remaining
- Celebration on completion

**Checklist - 3.3.2 DailyGoalProgress:**
- [x] Create `src/components/gamification/DailyGoalProgress.tsx`
- [x] Display circular progress
- [x] Show minutes/lessons completed
- [x] Add completion animation
- [x] Add celebration effect

---

### 3.4 Achievement System

**File:** `src/data/achievements.json` (NEW)

Achievement definitions:

```json
{
  "achievements": [
    {
      "id": "streak_3",
      "category": "streaks",
      "title": "Hat Trick",
      "description": "Maintain a 3-day streak",
      "icon": "IoFlame",
      "xpReward": 50,
      "rarity": "common",
      "requirement": { "type": "streak", "target": 3 }
    },
    {
      "id": "streak_7",
      "category": "streaks",
      "title": "Week Warrior",
      "description": "Maintain a 7-day streak",
      "icon": "IoFlame",
      "xpReward": 150,
      "rarity": "rare",
      "requirement": { "type": "streak", "target": 7 }
    }
    // ... 30+ achievements
  ]
}
```

**Checklist - 3.4.1 Achievement Data:**
- [x] Create `src/data/achievements.json`
- [x] Define streak achievements (3, 7, 14, 30, 60, 100, 365 days)
- [x] Define lesson achievements (1, 10, 50, 100, 500 lessons)
- [x] Define vocabulary achievements (10, 50, 100, 500, 1000 words)
- [x] Define kanji achievements (10, 50, 100, 500 kanji)
- [x] Define review achievements (100, 500, 1000, 5000 reviews)
- [x] Define time achievements (1hr, 10hr, 50hr, 100hr)
- [x] Define milestone achievements (complete N5, complete path, etc.)
- [x] Define special achievements (first lesson, perfect score, etc.)

**File:** `src/components/gamification/AchievementCard.tsx` (NEW)

Achievement display card:
- Icon and title
- Description
- XP reward
- Unlock status
- Rarity indicator

**Checklist - 3.4.2 AchievementCard:**
- [x] Create `src/components/gamification/AchievementCard.tsx`
- [x] Display achievement icon
- [x] Show title and description
- [x] Display XP reward
- [x] Show locked/unlocked state
- [x] Add rarity color coding

**File:** `src/components/gamification/AchievementUnlock.tsx` (NEW)

Achievement unlock celebration:
- Modal overlay
- Animation
- XP award display

**Checklist - 3.4.3 AchievementUnlock:**
- [x] Create `src/components/gamification/AchievementUnlock.tsx`
- [x] Create celebration animation
- [x] Display achievement details
- [x] Show XP earned
- [x] Add share button (optional)
- [x] Auto-dismiss after delay

**File:** `src/components/gamification/AchievementGrid.tsx` (NEW)

Achievement gallery:
- Category filters
- Grid display
- Progress indicators

**Checklist - 3.4.4 AchievementGrid:**
- [x] Create `src/components/gamification/AchievementGrid.tsx`
- [x] Display achievements by category
- [x] Add filter tabs
- [x] Show progress for incomplete achievements
- [x] Handle empty states

---

### 3.5 XP & Level Display

**File:** `src/components/gamification/XPBar.tsx` (NEW)

XP and level progress bar:
- Current level display
- XP progress to next level
- Recent XP gains

**Checklist - 3.5.1 XPBar:**
- [x] Create `src/components/gamification/XPBar.tsx`
- [x] Display current level
- [x] Show XP progress bar
- [x] Add animation on XP gain
- [x] Show level title

**File:** `src/components/gamification/XPGain.tsx` (NEW)

Floating XP gain indicator:
- "+50 XP" animation
- Floats up and fades

**Checklist - 3.5.2 XPGain:**
- [x] Create `src/components/gamification/XPGain.tsx`
- [x] Implement floating animation
- [x] Support multiple simultaneous gains
- [x] Add sound effect (optional)

**File:** `src/components/gamification/LevelUpCelebration.tsx` (NEW)

Level up celebration:
- Full-screen overlay
- Animation
- New level display

**Checklist - 3.5.3 LevelUpCelebration:**
- [x] Create `src/components/gamification/LevelUpCelebration.tsx`
- [x] Create celebration animation
- [x] Display new level and title
- [x] Show unlocked features (if any)
- [x] Add confetti effect

---

### 3.6 Gamification Components Index

**File:** `src/components/gamification/index.ts` (NEW)

**Checklist - 3.6 Index:**
- [x] Create `src/components/gamification/index.ts`
- [x] Export all gamification components

---

## Phase 4: Dashboard Redesign

### 4.1 New Dashboard Layout

**File:** `src/app/page.tsx` (MODIFY - Major Redesign)

New dashboard structure:
```
┌─────────────────────────────────────────────────────────────┐
│  Header (with streak/XP bar)                                │
├─────────────────────────────────────────────────────────────┤
│  Path Progress Card (main focus)                            │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────┐  ┌─────────────────────────┐  │
│  │  Continue Lesson        │  │  Review Session         │  │
│  │  "Food & Drink"         │  │  42 items due           │  │
│  │  [Start Lesson]         │  │  [Start Review]         │  │
│  └─────────────────────────┘  └─────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  Daily Goal Progress                                        │
├─────────────────────────────────────────────────────────────┤
│  Quick Stats (streak, words, time)                          │
├─────────────────────────────────────────────────────────────┤
│  Library Quick Access                                       │
└─────────────────────────────────────────────────────────────┘
```

**Checklist - 4.1 Dashboard:**
- [x] Redesign `src/app/page.tsx` with new layout
- [x] Create new `src/app/page.module.css`
- [x] Prioritize path progress card
- [x] Add "Continue Lesson" action card
- [x] Add "Review Session" action card
- [x] Add daily goal progress display
- [x] Add quick stats section
- [x] Add library quick access section
- [x] Ensure mobile responsiveness
- [x] Add loading states
- [x] Add empty states for new users

---

### 4.2 Dashboard Components

**File:** `src/components/dashboard/PathProgressCard.tsx` (NEW)

Main path progress display:
- Path name and level
- Progress bar (0-100%)
- Current lesson indicator
- "Continue" button

**Checklist - 4.2.1 PathProgressCard:**
- [x] Create `src/components/dashboard/PathProgressCard.tsx`
- [x] Display path name
- [x] Show progress percentage and bar
- [x] Display current lesson title
- [x] Add "Continue Learning" button
- [x] Handle no-path-enrolled state

**File:** `src/components/dashboard/ActionCard.tsx` (NEW)

Reusable action card for:
- Continue Lesson
- Start Review
- Take Test

**Checklist - 4.2.2 ActionCard:**
- [x] Create `src/components/dashboard/ActionCard.tsx`
- [x] Support different action types
- [x] Show relevant metadata (time, count)
- [x] Add prominent action button
- [x] Add icon support

**File:** `src/components/dashboard/DailyGoalCard.tsx` (NEW)

Daily goal progress card:
- Goal selector (if not set)
- Progress ring
- Time/lessons remaining

**Checklist - 4.2.3 DailyGoalCard:**
- [x] Create `src/components/dashboard/DailyGoalCard.tsx`
- [x] Show goal progress ring
- [x] Display minutes completed
- [x] Show celebration on completion
- [x] Allow goal change

**File:** `src/components/dashboard/QuickStats.tsx` (NEW)

Stats overview:
- Current streak
- Words learned
- Kanji learned
- Study time

**Checklist - 4.2.4 QuickStats:**
- [x] Create `src/components/dashboard/QuickStats.tsx`
- [x] Display 4 key stats
- [x] Add icons for each stat
- [x] Make responsive grid

**File:** `src/components/dashboard/LibraryQuickAccess.tsx` (NEW)

Library module links:
- Alphabet, Vocabulary, Kanji, Grammar
- Show available modules only

**Checklist - 4.2.5 LibraryQuickAccess:**
- [x] Create `src/components/dashboard/LibraryQuickAccess.tsx`
- [x] Display module icons/buttons
- [x] Filter by available modules
- [x] Show learned count per module

**File:** `src/components/dashboard/WeeklyProgressCard.tsx` (NEW)

Weekly summary preview:
- This week's activity
- Compare to last week
- Link to full report

**Checklist - 4.2.6 WeeklyProgressCard:**
- [x] Create `src/components/dashboard/WeeklyProgressCard.tsx`
- [x] Show weekly summary
- [x] Add comparison to previous week
- [x] Link to full weekly report page

---

### 4.3 Header Redesign

**File:** `src/components/common/Header.tsx` (NEW or MODIFY)

New header with:
- Logo/brand
- Streak display
- XP/Level display
- Language selector
- Settings/Profile

**Checklist - 4.3 Header:**
- [x] Create/update `src/components/common/Header.tsx`
- [x] Add streak badge
- [x] Add XP/level indicator
- [x] Integrate language selector
- [x] Add profile/settings access
- [x] Make mobile-responsive (collapse to hamburger)

---

## Phase 5: Library Transformation

### 5.1 Library Landing Page

**File:** `src/app/library/page.tsx` (NEW)

Library index page:
- Module cards (Alphabet, Vocabulary, Kanji, Grammar)
- Module-specific filters
- Search functionality

**Checklist - 5.1 Library Page:**
- [x] Create `src/app/library/page.tsx`
- [x] Create `src/app/library/library.module.css`
- [x] Display module cards
- [x] Filter by available modules per language
- [x] Add search bar
- [x] Show items learned per module

**File:** `src/app/library/layout.tsx` (NEW)

Library layout with:
- Side navigation
- Search header
- Content area

**Checklist - 5.1.2 Library Layout:**
- [x] Create `src/app/library/layout.tsx`
- [x] Add side navigation for modules
- [x] Add breadcrumb
- [x] Handle responsive layout

---

### 5.2 Library Module Pages

**File:** `src/app/library/alphabet/page.tsx` (MOVE/MODIFY)

Moved from `/alphabet` to `/library/alphabet`:
- Add "Learned only" filter
- Add "By lesson" filter
- Add search
- Add mastery indicators

**Checklist - 5.2.1 Alphabet Library:**
- [x] Move `src/app/alphabet/page.tsx` to `src/app/library/alphabet/page.tsx`
- [x] Add "Learned only" filter toggle
- [x] Add "By lesson" filter dropdown
- [x] Add search functionality
- [x] Add mastery indicator per character
- [x] Update navigation links

**File:** `src/app/library/vocabulary/page.tsx` (MOVE/MODIFY)

**Checklist - 5.2.2 Vocabulary Library:**
- [x] Move `src/app/vocabulary/page.tsx` to `src/app/library/vocabulary/page.tsx`
- [x] Add "Learned only" filter toggle
- [x] Add "By lesson" filter dropdown
- [x] Add search functionality
- [x] Enhance cards with lesson source info
- [x] Add mastery indicator per word
- [x] Update navigation links

**File:** `src/app/library/kanji/page.tsx` (MOVE/MODIFY)

**Checklist - 5.2.3 Kanji Library:**
- [x] Move `src/app/kanji/page.tsx` to `src/app/library/kanji/page.tsx`
- [x] Add "Learned only" filter toggle
- [x] Add "By lesson" filter dropdown
- [x] Add search functionality
- [x] Enhance cards with lesson source info
- [x] Add mastery indicator per kanji
- [x] Update navigation links

**File:** `src/app/library/grammar/page.tsx` (MOVE/MODIFY)

**Checklist - 5.2.4 Grammar Library:**
- [x] Move `src/app/grammar/page.tsx` to `src/app/library/grammar/page.tsx`
- [x] Add "Learned only" filter toggle
- [x] Add "By lesson" filter dropdown
- [x] Add search functionality
- [x] Enhance cards with lesson source info
- [x] Add mastery indicator per grammar point
- [x] Update navigation links

---

### 5.3 Library Card Enhancements

**File:** `src/components/library/LibraryCard.tsx` (NEW)

Enhanced library item card:
- Item content (word, character, etc.)
- Lesson source indicator
- SRS status (due, mastered, new)
- Quick review button

**Checklist - 5.3 LibraryCard:**
- [x] Create `src/components/library/LibraryCard.tsx`
- [x] Display item content
- [x] Show "From: Lesson X" indicator
- [x] Show SRS status badge
- [x] Add mastery percentage
- [x] Add quick review button
- [x] Add audio play button

---

### 5.4 Search & Filter Components

**File:** `src/components/library/LibrarySearch.tsx` (NEW)

Search input with:
- Real-time filtering
- Search suggestions
- Recent searches

**Checklist - 5.4.1 LibrarySearch:**
- [x] Create `src/components/library/LibrarySearch.tsx`
- [x] Implement search input
- [x] Add debounced filtering
- [x] Show search results count
- [x] Handle no results state

**File:** `src/components/library/LibraryFilters.tsx` (NEW)

Filter controls:
- Learned/All toggle
- Level filter
- Lesson filter
- SRS status filter

**Checklist - 5.4.2 LibraryFilters:**
- [x] Create `src/components/library/LibraryFilters.tsx`
- [x] Add learned/all toggle
- [x] Add level dropdown
- [x] Add lesson dropdown
- [x] Add SRS status filter
- [x] Persist filter state

---

## Phase 6: Cross-Module Reviews

### 6.1 Unified Review System

**File:** `src/app/review/page.tsx` (MODIFY - Major Redesign)

Unified review page:
- Mixed items from all modules
- Exercise variety
- Session configuration
- Progress tracking

**Checklist - 6.1 Review Page:**
- [x] Redesign `src/app/review/page.tsx`
- [x] Implement cross-module item fetching
- [x] Add session configuration (quick/full/module-specific)
- [x] Implement exercise variety per item type
- [x] Add progress indicators
- [x] Add session summary
- [x] Award XP on completion

---

### 6.2 Review Session Configuration

**File:** `src/components/review/ReviewConfig.tsx` (NEW)

Session configuration UI:
- Review type selector (Smart Mix, Module-Specific, Lesson Review)
- Item count selector
- Difficulty preference

**Checklist - 6.2 ReviewConfig:**
- [x] Create `src/components/review/ReviewConfig.tsx`
- [x] Add review type selector
- [x] Add item count options (10, 25, 50, All)
- [x] Add module filter (for module-specific)
- [x] Add lesson filter (for lesson review)
- [x] Start session button

---

### 6.3 Review Item Components

**File:** `src/components/review/VocabularyReview.tsx` (NEW)

Vocabulary review card:
- Word display
- Meaning/reading input
- Multiple choice option
- Feedback display

**Checklist - 6.3.1 VocabularyReview:**
- [x] Create `src/components/review/VocabularyReview.tsx`
- [x] Support typing mode
- [x] Support multiple choice mode
- [x] Add TTS playback
- [x] Show answer feedback
- [x] Display quality rating buttons

**File:** `src/components/review/KanjiReview.tsx` (NEW)

Kanji review card:
- Kanji display
- Reading/meaning input
- Stroke order prompt (optional)

**Checklist - 6.3.2 KanjiReview:**
- [x] Create `src/components/review/KanjiReview.tsx`
- [x] Support reading input
- [x] Support meaning input
- [x] Add stroke order practice option
- [x] Show answer feedback
- [x] Display quality rating buttons

**File:** `src/components/review/GrammarReview.tsx` (NEW)

Grammar review card:
- Grammar point display
- Sentence construction
- Multiple choice exercises

**Checklist - 6.3.3 GrammarReview:**
- [x] Create `src/components/review/GrammarReview.tsx`
- [x] Display grammar point
- [x] Add sentence exercises
- [x] Support multiple choice
- [x] Show answer feedback
- [x] Display quality rating buttons

---

### 6.4 Review Session Flow

**Checklist - 6.4 Review Flow:**
- [x] Implement review session state machine
- [x] Fetch due items from unified queue
- [x] Randomize item order
- [x] Track session progress
- [x] Calculate accuracy
- [x] Update SRS data per item
- [x] Generate session summary
- [x] Award XP based on performance

---

## Phase 7: Exercise System

### 7.1 Exercise Components

**File:** `src/components/exercises/MultipleChoice.tsx` (MODIFY/ENHANCE)

Enhanced multiple choice:
- Option highlighting
- Explanation display
- Animation on selection

**Checklist - 7.1.1 MultipleChoice:**
- [x] Enhance existing `src/components/common/MultipleChoice.tsx`
- [x] Add explanation display
- [x] Improve animations
- [x] Add keyboard navigation (1-4 keys)
- [x] Support 2-6 options

**File:** `src/components/exercises/FillBlank.tsx` (NEW)

Fill in the blank exercise:
- Sentence with blanks
- Text input for each blank
- Validation

**Checklist - 7.1.2 FillBlank:**
- [x] Create `src/components/exercises/FillBlank.tsx`
- [x] Parse sentence with blank markers
- [x] Create input per blank
- [x] Validate answers
- [x] Show correct/incorrect feedback
- [x] Support hints

**File:** `src/components/exercises/Matching.tsx` (NEW)

Matching exercise:
- Two columns
- Drag-and-drop or click matching
- Visual connection lines

**Checklist - 7.1.3 Matching:**
- [x] Create `src/components/exercises/Matching.tsx`
- [x] Display two columns
- [x] Implement click-to-match
- [x] Implement drag-and-drop (optional)
- [x] Draw connection lines
- [x] Validate matches
- [x] Support audio items

**File:** `src/components/exercises/SentenceBuilding.tsx` (NEW)

Sentence building exercise:
- Word tiles
- Drag to arrange
- Sentence validation

**Checklist - 7.1.4 SentenceBuilding:**
- [x] Create `src/components/exercises/SentenceBuilding.tsx`
- [x] Display word tiles
- [x] Implement tile reordering
- [x] Validate sentence order
- [x] Show correct order on incorrect
- [x] Add TTS for correct sentence

**File:** `src/components/exercises/Typing.tsx` (NEW)

Typing exercise:
- Prompt display
- Text input
- Virtual keyboard (optional)

**Checklist - 7.1.5 Typing:**
- [x] Create `src/components/exercises/Typing.tsx`
- [x] Display prompt
- [x] Create text input
- [x] Add virtual keyboard for special characters
- [x] Validate input
- [x] Support fuzzy matching

**File:** `src/components/exercises/ListeningDictation.tsx` (NEW)

Listening dictation exercise:
- Audio playback
- Text input
- Progressive hints

**Checklist - 7.1.6 ListeningDictation:**
- [x] Create `src/components/exercises/ListeningDictation.tsx`
- [x] Add audio player
- [x] Add text input
- [x] Implement hint system
- [x] Validate transcription
- [x] Support partial credit

**File:** `src/components/exercises/StrokeOrder.tsx` (NEW)

Stroke order practice:
- Character display
- Stroke animation
- Drawing canvas

**Checklist - 7.1.7 StrokeOrder:**
- [x] Create `src/components/exercises/StrokeOrder.tsx`
- [x] Display character
- [x] Animate stroke order
- [x] Create drawing canvas
- [x] Validate stroke order
- [x] Provide feedback

---

### 7.2 Exercise Container

**File:** `src/components/exercises/ExerciseContainer.tsx` (NEW)

Generic exercise wrapper:
- Exercise header
- Timer (optional)
- Skip/hint buttons
- Feedback display

**Checklist - 7.2 ExerciseContainer:**
- [x] Create `src/components/exercises/ExerciseContainer.tsx`
- [x] Add exercise header with type indicator
- [x] Add timer component (optional)
- [x] Add hint button
- [x] Add skip button
- [x] Handle feedback display
- [x] Award XP on completion

---

### 7.3 Exercise Index

**File:** `src/components/exercises/index.ts` (NEW)

**Checklist - 7.3 Index:**
- [x] Create `src/components/exercises/index.ts`
- [x] Export all exercise components

---

## Phase 8: Admin Tooling

> Note: Admin tooling lives in separate repository `murmura_admin`

### 8.1 CLI Analysis Scripts (in murmura)

**File:** `tools/find-hardcoded-strings.ts` (NEW)

Find strings that should use i18n:
- Scan all TSX files
- Identify visible text strings
- Report file and line

**Checklist - 8.1.1 find-hardcoded-strings:**
- [x] Create `tools/find-hardcoded-strings.ts`
- [x] Parse TSX files with AST
- [x] Identify JSX text nodes
- [x] Identify template literals with text
- [x] Ignore comments and code strings
- [x] Output report with file:line

**File:** `tools/check-translation-completeness.ts` (NEW)

Check translation coverage:
- Compare locales
- Find missing keys
- Report coverage percentage

**Checklist - 8.1.2 check-translation-completeness:**
- [x] Create `tools/check-translation-completeness.ts`
- [x] Load all locale files
- [x] Compare key sets
- [x] Calculate coverage percentage
- [x] Output missing keys per locale
- [x] Support JSON output

**File:** `tools/find-unused-i18n-keys.ts` (NEW)

Find orphaned translation keys:
- Scan codebase for key usage
- Compare to locale files
- Report unused keys

**Checklist - 8.1.3 find-unused-i18n-keys:**
- [x] Create `tools/find-unused-i18n-keys.ts`
- [x] Parse all TSX/TS files
- [x] Extract translation key usage
- [x] Compare to locale keys
- [x] Report unused keys

**File:** `tools/analyze-data-completeness.ts` (NEW)

Report on learning data coverage:
- Items per language
- Items per level
- Audio coverage
- Missing fields

**Checklist - 8.1.4 analyze-data-completeness:**
- [x] Create `tools/analyze-data-completeness.ts`
- [x] Load all data files
- [x] Count items per language/level
- [x] Check audio URL coverage
- [x] Check translation coverage
- [x] Output summary report

**File:** `tools/validate-data-structure.ts` (NEW)

Validate JSON data files:
- Check against TypeScript types
- Validate references (lessonId exists)
- Report errors

**Checklist - 8.1.5 validate-data-structure:**
- [x] Create `tools/validate-data-structure.ts`
- [x] Create JSON schemas from TypeScript types
- [x] Validate all data files against schemas
- [x] Check lessonId references
- [x] Check audioUrl file existence
- [x] Report all validation errors

---

### 8.2 Admin UI (in murmura_admin)

> These tasks are for the separate murmura_admin repository

**Checklist - 8.2 Admin UI:**
- [x] Set up Next.js project in `murmura_admin/admin_ui/`
- [x] Create FastAPI backend routes in `murmura_admin/src/api/`
- [x] Implement Dashboard page
- [x] Implement Content Browser page
- [x] Implement Curriculum Editor page
- [x] Implement Generation Panel
- [x] Implement i18n Management page
- [x] Implement Data Analysis page
- [x] Set up export to murmura web app
- [x] Add documentation

---

## Testing Requirements

### Unit Tests

**Checklist - Unit Tests:**
- [x] Test XP calculation functions
- [x] Test streak management functions
- [x] Test SRS algorithm functions
- [x] Test exercise validation functions
- [x] Test data loading utilities
- [x] Test curriculum parsing
- [x] Test lesson flow state machine
- [x] Test achievement unlock logic

### Integration Tests

**Checklist - Integration Tests:**
- [x] Test Convex queries/mutations
- [x] Test lesson completion flow
- [x] Test review session flow
- [x] Test XP awarding
- [x] Test streak updates
- [x] Test achievement unlocks
- [x] Test path progress updates

### E2E Tests

**Checklist - E2E Tests:**
- [x] Test complete lesson flow
- [x] Test review session
- [x] Test dashboard interactions
- [x] Test library navigation
- [x] Test settings changes
- [x] Test mobile responsiveness

### Accessibility Tests

**Checklist - Accessibility:**
- [x] Test keyboard navigation on all pages
- [x] Test screen reader compatibility
- [x] Verify color contrast (4.5:1 minimum)
- [x] Verify touch targets (44px minimum)
- [x] Test focus indicators
- [x] Test with prefers-reduced-motion

---

## Migration Strategy

### User Data Migration

**Checklist - Data Migration:**
- [x] Create migration script for existing user progress
- [x] Map old module stats to new gamification data
- [x] Calculate initial XP from existing stats
- [x] Initialize streak from lastActive date
- [x] Set default daily goal
- [x] Create empty path progress
- [x] Test migration with sample data
- [x] Create rollback script
- [x] Document migration process

### Route Migration

**Old Routes → New Routes:**
```
/alphabet     → /library/alphabet
/vocabulary   → /library/vocabulary
/kanji        → /library/kanji
/grammar      → /library/grammar
/reading      → /library/reading (or remove)
/listening    → /library/listening (or remove)
/review       → /review (enhanced)
/             → / (redesigned dashboard)
```

**New Routes:**
```
/paths                           (NEW)
/paths/[pathId]                  (NEW)
/paths/[pathId]/[lessonId]       (NEW)
/library                         (NEW)
/achievements                    (NEW)
/weekly-report                   (NEW)
```

**Checklist - Route Migration:**
- [x] Create new routes
- [x] Set up redirects from old routes
- [x] Update all internal links
- [x] Update navigation component
- [x] Test all redirects
- [x] Update sitemap (if applicable)

---

## Implementation Order Summary

### Recommended Order:

1. **Phase 1** - Data Model & Infrastructure (Foundation)
2. **Phase 3.1-3.2** - XP & Streak System (Core gamification)
3. **Phase 2** - Lesson Experience (Core learning)
4. **Phase 4** - Dashboard Redesign (Entry point)
5. **Phase 3.3-3.5** - Daily Goals & Achievements
6. **Phase 5** - Library Transformation
7. **Phase 6** - Cross-Module Reviews
8. **Phase 7** - Exercise System
9. **Phase 8** - Admin Tooling

### MVP Scope (Minimum Viable Product):

**Include in MVP:**
- [x] Curriculum data structure
- [x] Basic lesson experience (3 content types)
- [x] XP and streak tracking
- [x] Daily goals
- [x] Redesigned dashboard
- [x] Basic exercises (multiple choice, typing)
- [x] Cross-module reviews

**Defer to Post-MVP:**
- [x] Advanced exercises (matching, sentence building)
- [x] Achievements system
- [x] Weekly reports
- [x] Stroke order practice
- [x] Speech recognition
- [x] Admin UI
- [x] Leaderboards enhancement

---

## File Checklist Summary

### New Files to Create:

**Types (5 files):**
- [x] `src/types/curriculum.ts`
- [x] `src/types/exercises.ts`
- [x] `src/types/gamification.ts`
- [x] `src/types/paths.ts`
- [x] `src/types/reviews.ts`

**Hooks (8 files):**
- [x] `src/hooks/useCurriculum.ts`
- [x] `src/hooks/useLessonProgress.ts`
- [x] `src/hooks/useGamification.ts`
- [x] `src/hooks/useReviewQueue.ts`
- [x] `src/hooks/useWeeklyReport.ts`
- [x] `src/hooks/useAchievements.ts`
- [x] `src/hooks/useDailyGoal.ts`
- [x] `src/hooks/useStreak.ts`

**Lib (4 files):**
- [x] `src/lib/xp.ts`
- [x] `src/lib/streak.ts`
- [x] `src/lib/curriculum.ts`
- [x] `src/lib/achievements.ts`

**Pages (10 files):**
- [x] `src/app/paths/page.tsx`
- [x] `src/app/paths/[pathId]/page.tsx`
- [x] `src/app/paths/[pathId]/[lessonId]/page.tsx`
- [x] `src/app/library/page.tsx`
- [x] `src/app/library/layout.tsx`
- [x] `src/app/library/alphabet/page.tsx` (move)
- [x] `src/app/library/vocabulary/page.tsx` (move)
- [x] `src/app/library/kanji/page.tsx` (move)
- [x] `src/app/library/grammar/page.tsx` (move)
- [x] `src/app/achievements/page.tsx`

**Lesson Components (10 files):**
- [x] `src/components/lesson/LessonView.tsx`
- [x] `src/components/lesson/LessonIntro.tsx`
- [x] `src/components/lesson/LessonCard.tsx`
- [x] `src/components/lesson/LessonSummary.tsx`
- [x] `src/components/lesson/LessonProgress.tsx`
- [x] `src/components/lesson/CharacterLesson.tsx`
- [x] `src/components/lesson/VocabularyLesson.tsx`
- [x] `src/components/lesson/GrammarLesson.tsx`
- [x] `src/components/lesson/CulturalNote.tsx`
- [x] `src/components/lesson/index.ts`

**Gamification Components (12 files):**
- [x] `src/components/gamification/DailyGoalSelector.tsx`
- [x] `src/components/gamification/DailyGoalProgress.tsx`
- [x] `src/components/gamification/AchievementCard.tsx`
- [x] `src/components/gamification/AchievementUnlock.tsx`
- [x] `src/components/gamification/AchievementGrid.tsx`
- [x] `src/components/gamification/XPBar.tsx`
- [x] `src/components/gamification/XPGain.tsx`
- [x] `src/components/gamification/LevelUpCelebration.tsx`
- [x] `src/components/gamification/StreakBadge.tsx`
- [x] `src/components/gamification/StreakFreeze.tsx`
- [x] `src/components/gamification/WeeklyReport.tsx`
- [x] `src/components/gamification/index.ts`

**Dashboard Components (8 files):**
- [x] `src/components/dashboard/PathProgressCard.tsx`
- [x] `src/components/dashboard/ActionCard.tsx`
- [x] `src/components/dashboard/DailyGoalCard.tsx`
- [x] `src/components/dashboard/QuickStats.tsx`
- [x] `src/components/dashboard/LibraryQuickAccess.tsx`
- [x] `src/components/dashboard/WeeklyProgressCard.tsx`
- [x] `src/components/dashboard/Header.tsx`
- [x] `src/components/dashboard/index.ts` (update)

**Library Components (5 files):**
- [x] `src/components/library/LibraryCard.tsx`
- [x] `src/components/library/LibrarySearch.tsx`
- [x] `src/components/library/LibraryFilters.tsx`
- [x] `src/components/library/LibraryGrid.tsx`
- [x] `src/components/library/index.ts`

**Review Components (6 files):**
- [x] `src/components/review/ReviewConfig.tsx`
- [x] `src/components/review/VocabularyReview.tsx`
- [x] `src/components/review/KanjiReview.tsx`
- [x] `src/components/review/GrammarReview.tsx`
- [x] `src/components/review/ReviewSummary.tsx`
- [x] `src/components/review/index.ts` (update)

**Exercise Components (9 files):**
- [x] `src/components/exercises/ExerciseContainer.tsx`
- [x] `src/components/exercises/FillBlank.tsx`
- [x] `src/components/exercises/Matching.tsx`
- [x] `src/components/exercises/SentenceBuilding.tsx`
- [x] `src/components/exercises/Typing.tsx`
- [x] `src/components/exercises/ListeningDictation.tsx`
- [x] `src/components/exercises/StrokeOrder.tsx`
- [x] `src/components/exercises/Speaking.tsx`
- [x] `src/components/exercises/index.ts`

**Convex (6 files):**
- [x] `convex/pathProgress.js`
- [x] `convex/gamification.js`
- [x] `convex/reviewQueue.js`
- [x] `convex/weeklyReports.js`
- [x] `convex/lessonSessions.js`
- [x] `convex/achievements.js`

**Data Files (8+ files):**
- [x] `src/data/achievements.json`
- [x] `src/data/ja/curriculum.json`
- [x] `src/data/ko/curriculum.json`
- [x] `src/data/zh/curriculum.json`
- [x] `src/data/es/curriculum.json`
- [x] `src/data/de/curriculum.json`
- [x] `src/data/en/curriculum.json`
- [x] `src/data/it/curriculum.json`

**Tools (5 files):**
- [x] `tools/find-hardcoded-strings.ts`
- [x] `tools/check-translation-completeness.ts`
- [x] `tools/find-unused-i18n-keys.ts`
- [x] `tools/analyze-data-completeness.ts`
- [x] `tools/validate-data-structure.ts`

### Files to Modify:

- [x] `src/types/index.ts`
- [x] `src/hooks/index.ts`
- [x] `src/app/page.tsx` (dashboard)
- [x] `src/app/review/page.tsx`
- [x] `src/components/common/MultipleChoice.tsx`
- [x] `src/components/common/Navigation.tsx`
- [x] `convex/schema.js`
- [x] `src/data/*/vocabulary.json` (add lessonId)
- [x] `src/data/*/grammar.json` (add lessonId)
- [x] `src/data/*/kanji.json` (add lessonId)

---

## Total Checklist Items: ~250+

This implementation plan provides a comprehensive roadmap for transforming Murmura from a module-centric app to a curriculum-driven learning platform with full gamification support.
