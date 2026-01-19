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
- [ ] Create `src/types/curriculum.ts` with all interfaces
- [ ] Create `src/types/exercises.ts` for exercise-specific types
- [ ] Create `src/types/gamification.ts` for XP/streak/achievement types
- [ ] Update `src/types/index.ts` to export new types
- [ ] Add `lessonId` field to existing `VocabularyItem` interface
- [ ] Add `lessonId` field to existing `GrammarItem` interface
- [ ] Add `lessonId` field to existing `KanjiItem` interface
- [ ] Add `lessonId` field to existing `ReadingItem` interface
- [ ] Run `npx tsc --noEmit` to verify no type errors

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
- [ ] Create `src/types/gamification.ts` with all interfaces
- [ ] Define XP constants in config file
- [ ] Define all achievements with requirements
- [ ] Add achievements JSON data file
- [ ] Export types from `src/types/index.ts`

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
- [ ] Create `src/data/ja/curriculum.json` with full N5 curriculum
- [ ] Create `src/data/ko/curriculum.json` for Korean
- [ ] Create `src/data/zh/curriculum.json` for Chinese
- [ ] Create `src/data/es/curriculum.json` for Spanish
- [ ] Create `src/data/de/curriculum.json` for German
- [ ] Create `src/data/en/curriculum.json` for English
- [ ] Create `src/data/it/curriculum.json` for Italian
- [ ] Update existing `vocabulary.json` files to add `lessonId` field
- [ ] Update existing `grammar.json` files to add `lessonId` field
- [ ] Update existing `kanji.json` / `hanzi.json` to add `lessonId` field
- [ ] Create validation script for curriculum JSON structure
- [ ] Run validation on all curriculum files

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
- [ ] Add `pathProgress` table to schema
- [ ] Add `gamification` table to schema
- [ ] Add `weeklyReports` table to schema
- [ ] Add `lessonSessions` table to schema
- [ ] Add `reviewQueue` table to schema
- [ ] Create indexes for efficient queries
- [ ] Run `npx convex dev` to deploy schema
- [ ] Verify all tables created in Convex dashboard

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
- [ ] Create `convex/pathProgress.js` with all queries/mutations
- [ ] Create `convex/gamification.js` with all queries/mutations
- [ ] Create `convex/reviewQueue.js` with all queries/mutations
- [ ] Create `convex/weeklyReports.js` for report generation
- [ ] Create `convex/lessonSessions.js` for session tracking
- [ ] Add proper validators for all arguments
- [ ] Add authentication checks to all functions
- [ ] Test all endpoints in Convex dashboard

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
- [ ] Create `src/hooks/useCurriculum.ts`
- [ ] Create `src/hooks/useLessonProgress.ts`
- [ ] Create `src/hooks/useGamification.ts`
- [ ] Create `src/hooks/useReviewQueue.ts`
- [ ] Create `src/hooks/useWeeklyReport.ts`
- [ ] Create `src/hooks/useAchievements.ts`
- [ ] Update `src/hooks/index.ts` to export new hooks
- [ ] Add proper TypeScript types to all hooks
- [ ] Add error handling and loading states
- [ ] Test hooks in isolation

---

### 1.7 Update Existing Data Files

**Checklist - 1.7 Data Migration:**
- [ ] Add `lessonId` field to all items in `ja/vocabulary.json`
- [ ] Add `lessonId` field to all items in `ja/grammar.json`
- [ ] Add `lessonId` field to all items in `ja/kanji.json`
- [ ] Repeat for Korean data files
- [ ] Repeat for Chinese data files
- [ ] Repeat for Spanish data files
- [ ] Repeat for German data files
- [ ] Repeat for English data files
- [ ] Repeat for Italian data files
- [ ] Create script to validate lessonId references
- [ ] Run validation script on all data files

---

## Phase 2: Lesson Experience

### 2.1 New Pages

**File:** `src/app/paths/page.tsx` (NEW)

Path selection/overview page showing:
- Current path progress (if enrolled)
- Available paths for current language
- Path selection UI

**Checklist - 2.1.1 Paths Page:**
- [ ] Create `src/app/paths/page.tsx`
- [ ] Create `src/app/paths/paths.module.css`
- [ ] Implement path cards with progress indicators
- [ ] Add enrollment flow
- [ ] Add language-specific path filtering
- [ ] Wrap in ErrorBoundary and LanguageContentGuard
- [ ] Add accessibility (keyboard nav, focus states)
- [ ] Test on mobile (320px minimum)

**File:** `src/app/paths/[pathId]/page.tsx` (NEW)

Path detail page showing:
- Path overview with progress bar
- Unit list with completion status
- Current lesson highlight
- Unit test access

**Checklist - 2.1.2 Path Detail Page:**
- [ ] Create `src/app/paths/[pathId]/page.tsx`
- [ ] Create dynamic route handling
- [ ] Implement unit accordion/list
- [ ] Show lesson cards per unit
- [ ] Add "Continue Learning" button
- [ ] Add unit test integration
- [ ] Handle locked/unlocked states visually

**File:** `src/app/paths/[pathId]/[lessonId]/page.tsx` (NEW)

The core lesson experience page:
- Introduction screen
- Content cards (characters, vocab, grammar)
- Exercises
- Summary screen

**Checklist - 2.1.3 Lesson Page:**
- [ ] Create `src/app/paths/[pathId]/[lessonId]/page.tsx`
- [ ] Implement lesson flow state machine
- [ ] Create introduction screen component
- [ ] Create content card components
- [ ] Integrate exercise components
- [ ] Create summary screen component
- [ ] Add progress bar
- [ ] Add pause/exit functionality
- [ ] Handle lesson completion
- [ ] Award XP on completion

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
- [ ] Create `src/components/lesson/LessonView.tsx`
- [ ] Create `src/components/lesson/LessonView.module.css`
- [ ] Implement flow state machine (intro/content/exercises/summary)
- [ ] Add progress persistence (save on each step)
- [ ] Add exit confirmation modal
- [ ] Handle pause functionality
- [ ] Add animations between steps

**File:** `src/components/lesson/LessonIntro.tsx` (NEW)

Introduction screen showing:
- Lesson title and description
- What you'll learn (preview)
- Estimated time
- Start button

**Checklist - 2.2.2 LessonIntro:**
- [ ] Create `src/components/lesson/LessonIntro.tsx`
- [ ] Display lesson metadata
- [ ] Show learning objectives
- [ ] Add "Start Lesson" button
- [ ] Add animations (fade in)

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
- [ ] Create `src/components/lesson/LessonCard.tsx`
- [ ] Create variant for character content
- [ ] Create variant for vocabulary content
- [ ] Create variant for grammar content
- [ ] Add TTS integration
- [ ] Add "I know this" skip option
- [ ] Add swipe gestures for mobile

**File:** `src/components/lesson/LessonSummary.tsx` (NEW)

Summary screen showing:
- Score/performance
- XP earned
- Items learned
- Next lesson preview

**Checklist - 2.2.4 LessonSummary:**
- [ ] Create `src/components/lesson/LessonSummary.tsx`
- [ ] Display lesson results
- [ ] Show XP animation
- [ ] Show items learned list
- [ ] Add "Continue" and "Review" buttons
- [ ] Add share functionality (optional)

**File:** `src/components/lesson/LessonProgress.tsx` (NEW)

Progress indicator showing:
- Current step / total steps
- Section indicator (content vs exercises)
- Time elapsed (optional)

**Checklist - 2.2.5 LessonProgress:**
- [ ] Create `src/components/lesson/LessonProgress.tsx`
- [ ] Implement progress bar
- [ ] Show section labels
- [ ] Add animation on progress update

**File:** `src/components/lesson/index.ts` (NEW)

Barrel export for all lesson components.

**Checklist - 2.2.6 Index:**
- [ ] Create `src/components/lesson/index.ts`
- [ ] Export all lesson components

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
- [ ] Create or enhance `src/components/lesson/CharacterLesson.tsx`
- [ ] Add stroke order SVG animation
- [ ] Add drawing practice canvas (optional)
- [ ] Integrate with useTTS hook
- [ ] Add mnemonic display
- [ ] Handle both hiragana and kanji

**File:** `src/components/lesson/VocabularyLesson.tsx` (NEW)

Vocabulary learning card with:
- Word in target language
- Reading/pronunciation
- Meaning with translations
- Example sentences
- TTS button

**Checklist - 2.3.2 VocabularyLesson:**
- [ ] Create `src/components/lesson/VocabularyLesson.tsx`
- [ ] Display word with reading
- [ ] Show meaning with UI language translation
- [ ] Display example sentences
- [ ] Add TTS for word and examples
- [ ] Add context/usage notes

**File:** `src/components/lesson/GrammarLesson.tsx` (NEW)

Grammar learning card with:
- Grammar point title
- Explanation
- Examples with translations
- Usage notes

**Checklist - 2.3.3 GrammarLesson:**
- [ ] Create `src/components/lesson/GrammarLesson.tsx`
- [ ] Display grammar title
- [ ] Show explanation with translations
- [ ] Display example sentences
- [ ] Add TTS for examples
- [ ] Add "See more" for extended examples

---

### 2.4 Lesson Flow Implementation

**State Machine:**
```
INTRO → CONTENT_1 → CONTENT_2 → ... → EXERCISE_1 → EXERCISE_2 → ... → SUMMARY
```

**Checklist - 2.4 Lesson Flow:**
- [ ] Implement lesson state machine
- [ ] Handle forward navigation
- [ ] Handle back navigation (if allowed)
- [ ] Persist state to localStorage
- [ ] Resume from saved state
- [ ] Handle exit mid-lesson
- [ ] Calculate and save results
- [ ] Trigger XP award on completion

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
- [ ] Create `src/lib/xp.ts` with XP calculation functions
- [ ] Define XP_CONFIG constants
- [ ] Implement `calculateLessonXP()`
- [ ] Implement `calculateReviewXP()`
- [ ] Implement `calculateLevelFromXP()`
- [ ] Create XP breakdown function
- [ ] Add XP history tracking

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
- [ ] Create `src/lib/streak.ts`
- [ ] Implement streak check logic
- [ ] Implement streak freeze logic
- [ ] Handle timezone considerations
- [ ] Add streak recovery window (12-hour grace period)
- [ ] Integrate with daily goal completion

---

### 3.3 Daily Goals

**File:** `src/components/gamification/DailyGoalSelector.tsx` (NEW)

Daily goal configuration UI:
- 5, 10, 15, 20 minute options
- Visual indicators
- Confirmation on change

**Checklist - 3.3.1 DailyGoalSelector:**
- [ ] Create `src/components/gamification/DailyGoalSelector.tsx`
- [ ] Display goal options as cards
- [ ] Show current selection
- [ ] Add change confirmation
- [ ] Persist to settings

**File:** `src/components/gamification/DailyGoalProgress.tsx` (NEW)

Daily goal progress display:
- Circular progress ring
- Minutes remaining
- Celebration on completion

**Checklist - 3.3.2 DailyGoalProgress:**
- [ ] Create `src/components/gamification/DailyGoalProgress.tsx`
- [ ] Display circular progress
- [ ] Show minutes/lessons completed
- [ ] Add completion animation
- [ ] Add celebration effect

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
- [ ] Create `src/data/achievements.json`
- [ ] Define streak achievements (3, 7, 14, 30, 60, 100, 365 days)
- [ ] Define lesson achievements (1, 10, 50, 100, 500 lessons)
- [ ] Define vocabulary achievements (10, 50, 100, 500, 1000 words)
- [ ] Define kanji achievements (10, 50, 100, 500 kanji)
- [ ] Define review achievements (100, 500, 1000, 5000 reviews)
- [ ] Define time achievements (1hr, 10hr, 50hr, 100hr)
- [ ] Define milestone achievements (complete N5, complete path, etc.)
- [ ] Define special achievements (first lesson, perfect score, etc.)

**File:** `src/components/gamification/AchievementCard.tsx` (NEW)

Achievement display card:
- Icon and title
- Description
- XP reward
- Unlock status
- Rarity indicator

**Checklist - 3.4.2 AchievementCard:**
- [ ] Create `src/components/gamification/AchievementCard.tsx`
- [ ] Display achievement icon
- [ ] Show title and description
- [ ] Display XP reward
- [ ] Show locked/unlocked state
- [ ] Add rarity color coding

**File:** `src/components/gamification/AchievementUnlock.tsx` (NEW)

Achievement unlock celebration:
- Modal overlay
- Animation
- XP award display

**Checklist - 3.4.3 AchievementUnlock:**
- [ ] Create `src/components/gamification/AchievementUnlock.tsx`
- [ ] Create celebration animation
- [ ] Display achievement details
- [ ] Show XP earned
- [ ] Add share button (optional)
- [ ] Auto-dismiss after delay

**File:** `src/components/gamification/AchievementGrid.tsx` (NEW)

Achievement gallery:
- Category filters
- Grid display
- Progress indicators

**Checklist - 3.4.4 AchievementGrid:**
- [ ] Create `src/components/gamification/AchievementGrid.tsx`
- [ ] Display achievements by category
- [ ] Add filter tabs
- [ ] Show progress for incomplete achievements
- [ ] Handle empty states

---

### 3.5 XP & Level Display

**File:** `src/components/gamification/XPBar.tsx` (NEW)

XP and level progress bar:
- Current level display
- XP progress to next level
- Recent XP gains

**Checklist - 3.5.1 XPBar:**
- [ ] Create `src/components/gamification/XPBar.tsx`
- [ ] Display current level
- [ ] Show XP progress bar
- [ ] Add animation on XP gain
- [ ] Show level title

**File:** `src/components/gamification/XPGain.tsx` (NEW)

Floating XP gain indicator:
- "+50 XP" animation
- Floats up and fades

**Checklist - 3.5.2 XPGain:**
- [ ] Create `src/components/gamification/XPGain.tsx`
- [ ] Implement floating animation
- [ ] Support multiple simultaneous gains
- [ ] Add sound effect (optional)

**File:** `src/components/gamification/LevelUpCelebration.tsx` (NEW)

Level up celebration:
- Full-screen overlay
- Animation
- New level display

**Checklist - 3.5.3 LevelUpCelebration:**
- [ ] Create `src/components/gamification/LevelUpCelebration.tsx`
- [ ] Create celebration animation
- [ ] Display new level and title
- [ ] Show unlocked features (if any)
- [ ] Add confetti effect

---

### 3.6 Gamification Components Index

**File:** `src/components/gamification/index.ts` (NEW)

**Checklist - 3.6 Index:**
- [ ] Create `src/components/gamification/index.ts`
- [ ] Export all gamification components

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
- [ ] Redesign `src/app/page.tsx` with new layout
- [ ] Create new `src/app/page.module.css`
- [ ] Prioritize path progress card
- [ ] Add "Continue Lesson" action card
- [ ] Add "Review Session" action card
- [ ] Add daily goal progress display
- [ ] Add quick stats section
- [ ] Add library quick access section
- [ ] Ensure mobile responsiveness
- [ ] Add loading states
- [ ] Add empty states for new users

---

### 4.2 Dashboard Components

**File:** `src/components/dashboard/PathProgressCard.tsx` (NEW)

Main path progress display:
- Path name and level
- Progress bar (0-100%)
- Current lesson indicator
- "Continue" button

**Checklist - 4.2.1 PathProgressCard:**
- [ ] Create `src/components/dashboard/PathProgressCard.tsx`
- [ ] Display path name
- [ ] Show progress percentage and bar
- [ ] Display current lesson title
- [ ] Add "Continue Learning" button
- [ ] Handle no-path-enrolled state

**File:** `src/components/dashboard/ActionCard.tsx` (NEW)

Reusable action card for:
- Continue Lesson
- Start Review
- Take Test

**Checklist - 4.2.2 ActionCard:**
- [ ] Create `src/components/dashboard/ActionCard.tsx`
- [ ] Support different action types
- [ ] Show relevant metadata (time, count)
- [ ] Add prominent action button
- [ ] Add icon support

**File:** `src/components/dashboard/DailyGoalCard.tsx` (NEW)

Daily goal progress card:
- Goal selector (if not set)
- Progress ring
- Time/lessons remaining

**Checklist - 4.2.3 DailyGoalCard:**
- [ ] Create `src/components/dashboard/DailyGoalCard.tsx`
- [ ] Show goal progress ring
- [ ] Display minutes completed
- [ ] Show celebration on completion
- [ ] Allow goal change

**File:** `src/components/dashboard/QuickStats.tsx` (NEW)

Stats overview:
- Current streak
- Words learned
- Kanji learned
- Study time

**Checklist - 4.2.4 QuickStats:**
- [ ] Create `src/components/dashboard/QuickStats.tsx`
- [ ] Display 4 key stats
- [ ] Add icons for each stat
- [ ] Make responsive grid

**File:** `src/components/dashboard/LibraryQuickAccess.tsx` (NEW)

Library module links:
- Alphabet, Vocabulary, Kanji, Grammar
- Show available modules only

**Checklist - 4.2.5 LibraryQuickAccess:**
- [ ] Create `src/components/dashboard/LibraryQuickAccess.tsx`
- [ ] Display module icons/buttons
- [ ] Filter by available modules
- [ ] Show learned count per module

**File:** `src/components/dashboard/WeeklyProgressCard.tsx` (NEW)

Weekly summary preview:
- This week's activity
- Compare to last week
- Link to full report

**Checklist - 4.2.6 WeeklyProgressCard:**
- [ ] Create `src/components/dashboard/WeeklyProgressCard.tsx`
- [ ] Show weekly summary
- [ ] Add comparison to previous week
- [ ] Link to full weekly report page

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
- [ ] Create/update `src/components/common/Header.tsx`
- [ ] Add streak badge
- [ ] Add XP/level indicator
- [ ] Integrate language selector
- [ ] Add profile/settings access
- [ ] Make mobile-responsive (collapse to hamburger)

---

## Phase 5: Library Transformation

### 5.1 Library Landing Page

**File:** `src/app/library/page.tsx` (NEW)

Library index page:
- Module cards (Alphabet, Vocabulary, Kanji, Grammar)
- Module-specific filters
- Search functionality

**Checklist - 5.1 Library Page:**
- [ ] Create `src/app/library/page.tsx`
- [ ] Create `src/app/library/library.module.css`
- [ ] Display module cards
- [ ] Filter by available modules per language
- [ ] Add search bar
- [ ] Show items learned per module

**File:** `src/app/library/layout.tsx` (NEW)

Library layout with:
- Side navigation
- Search header
- Content area

**Checklist - 5.1.2 Library Layout:**
- [ ] Create `src/app/library/layout.tsx`
- [ ] Add side navigation for modules
- [ ] Add breadcrumb
- [ ] Handle responsive layout

---

### 5.2 Library Module Pages

**File:** `src/app/library/alphabet/page.tsx` (MOVE/MODIFY)

Moved from `/alphabet` to `/library/alphabet`:
- Add "Learned only" filter
- Add "By lesson" filter
- Add search
- Add mastery indicators

**Checklist - 5.2.1 Alphabet Library:**
- [ ] Move `src/app/alphabet/page.tsx` to `src/app/library/alphabet/page.tsx`
- [ ] Add "Learned only" filter toggle
- [ ] Add "By lesson" filter dropdown
- [ ] Add search functionality
- [ ] Add mastery indicator per character
- [ ] Update navigation links

**File:** `src/app/library/vocabulary/page.tsx` (MOVE/MODIFY)

**Checklist - 5.2.2 Vocabulary Library:**
- [ ] Move `src/app/vocabulary/page.tsx` to `src/app/library/vocabulary/page.tsx`
- [ ] Add "Learned only" filter toggle
- [ ] Add "By lesson" filter dropdown
- [ ] Add search functionality
- [ ] Enhance cards with lesson source info
- [ ] Add mastery indicator per word
- [ ] Update navigation links

**File:** `src/app/library/kanji/page.tsx` (MOVE/MODIFY)

**Checklist - 5.2.3 Kanji Library:**
- [ ] Move `src/app/kanji/page.tsx` to `src/app/library/kanji/page.tsx`
- [ ] Add "Learned only" filter toggle
- [ ] Add "By lesson" filter dropdown
- [ ] Add search functionality
- [ ] Enhance cards with lesson source info
- [ ] Add mastery indicator per kanji
- [ ] Update navigation links

**File:** `src/app/library/grammar/page.tsx` (MOVE/MODIFY)

**Checklist - 5.2.4 Grammar Library:**
- [ ] Move `src/app/grammar/page.tsx` to `src/app/library/grammar/page.tsx`
- [ ] Add "Learned only" filter toggle
- [ ] Add "By lesson" filter dropdown
- [ ] Add search functionality
- [ ] Enhance cards with lesson source info
- [ ] Add mastery indicator per grammar point
- [ ] Update navigation links

---

### 5.3 Library Card Enhancements

**File:** `src/components/library/LibraryCard.tsx` (NEW)

Enhanced library item card:
- Item content (word, character, etc.)
- Lesson source indicator
- SRS status (due, mastered, new)
- Quick review button

**Checklist - 5.3 LibraryCard:**
- [ ] Create `src/components/library/LibraryCard.tsx`
- [ ] Display item content
- [ ] Show "From: Lesson X" indicator
- [ ] Show SRS status badge
- [ ] Add mastery percentage
- [ ] Add quick review button
- [ ] Add audio play button

---

### 5.4 Search & Filter Components

**File:** `src/components/library/LibrarySearch.tsx` (NEW)

Search input with:
- Real-time filtering
- Search suggestions
- Recent searches

**Checklist - 5.4.1 LibrarySearch:**
- [ ] Create `src/components/library/LibrarySearch.tsx`
- [ ] Implement search input
- [ ] Add debounced filtering
- [ ] Show search results count
- [ ] Handle no results state

**File:** `src/components/library/LibraryFilters.tsx` (NEW)

Filter controls:
- Learned/All toggle
- Level filter
- Lesson filter
- SRS status filter

**Checklist - 5.4.2 LibraryFilters:**
- [ ] Create `src/components/library/LibraryFilters.tsx`
- [ ] Add learned/all toggle
- [ ] Add level dropdown
- [ ] Add lesson dropdown
- [ ] Add SRS status filter
- [ ] Persist filter state

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
- [ ] Redesign `src/app/review/page.tsx`
- [ ] Implement cross-module item fetching
- [ ] Add session configuration (quick/full/module-specific)
- [ ] Implement exercise variety per item type
- [ ] Add progress indicators
- [ ] Add session summary
- [ ] Award XP on completion

---

### 6.2 Review Session Configuration

**File:** `src/components/review/ReviewConfig.tsx` (NEW)

Session configuration UI:
- Review type selector (Smart Mix, Module-Specific, Lesson Review)
- Item count selector
- Difficulty preference

**Checklist - 6.2 ReviewConfig:**
- [ ] Create `src/components/review/ReviewConfig.tsx`
- [ ] Add review type selector
- [ ] Add item count options (10, 25, 50, All)
- [ ] Add module filter (for module-specific)
- [ ] Add lesson filter (for lesson review)
- [ ] Start session button

---

### 6.3 Review Item Components

**File:** `src/components/review/VocabularyReview.tsx` (NEW)

Vocabulary review card:
- Word display
- Meaning/reading input
- Multiple choice option
- Feedback display

**Checklist - 6.3.1 VocabularyReview:**
- [ ] Create `src/components/review/VocabularyReview.tsx`
- [ ] Support typing mode
- [ ] Support multiple choice mode
- [ ] Add TTS playback
- [ ] Show answer feedback
- [ ] Display quality rating buttons

**File:** `src/components/review/KanjiReview.tsx` (NEW)

Kanji review card:
- Kanji display
- Reading/meaning input
- Stroke order prompt (optional)

**Checklist - 6.3.2 KanjiReview:**
- [ ] Create `src/components/review/KanjiReview.tsx`
- [ ] Support reading input
- [ ] Support meaning input
- [ ] Add stroke order practice option
- [ ] Show answer feedback
- [ ] Display quality rating buttons

**File:** `src/components/review/GrammarReview.tsx` (NEW)

Grammar review card:
- Grammar point display
- Sentence construction
- Multiple choice exercises

**Checklist - 6.3.3 GrammarReview:**
- [ ] Create `src/components/review/GrammarReview.tsx`
- [ ] Display grammar point
- [ ] Add sentence exercises
- [ ] Support multiple choice
- [ ] Show answer feedback
- [ ] Display quality rating buttons

---

### 6.4 Review Session Flow

**Checklist - 6.4 Review Flow:**
- [ ] Implement review session state machine
- [ ] Fetch due items from unified queue
- [ ] Randomize item order
- [ ] Track session progress
- [ ] Calculate accuracy
- [ ] Update SRS data per item
- [ ] Generate session summary
- [ ] Award XP based on performance

---

## Phase 7: Exercise System

### 7.1 Exercise Components

**File:** `src/components/exercises/MultipleChoice.tsx` (MODIFY/ENHANCE)

Enhanced multiple choice:
- Option highlighting
- Explanation display
- Animation on selection

**Checklist - 7.1.1 MultipleChoice:**
- [ ] Enhance existing `src/components/common/MultipleChoice.tsx`
- [ ] Add explanation display
- [ ] Improve animations
- [ ] Add keyboard navigation (1-4 keys)
- [ ] Support 2-6 options

**File:** `src/components/exercises/FillBlank.tsx` (NEW)

Fill in the blank exercise:
- Sentence with blanks
- Text input for each blank
- Validation

**Checklist - 7.1.2 FillBlank:**
- [ ] Create `src/components/exercises/FillBlank.tsx`
- [ ] Parse sentence with blank markers
- [ ] Create input per blank
- [ ] Validate answers
- [ ] Show correct/incorrect feedback
- [ ] Support hints

**File:** `src/components/exercises/Matching.tsx` (NEW)

Matching exercise:
- Two columns
- Drag-and-drop or click matching
- Visual connection lines

**Checklist - 7.1.3 Matching:**
- [ ] Create `src/components/exercises/Matching.tsx`
- [ ] Display two columns
- [ ] Implement click-to-match
- [ ] Implement drag-and-drop (optional)
- [ ] Draw connection lines
- [ ] Validate matches
- [ ] Support audio items

**File:** `src/components/exercises/SentenceBuilding.tsx` (NEW)

Sentence building exercise:
- Word tiles
- Drag to arrange
- Sentence validation

**Checklist - 7.1.4 SentenceBuilding:**
- [ ] Create `src/components/exercises/SentenceBuilding.tsx`
- [ ] Display word tiles
- [ ] Implement tile reordering
- [ ] Validate sentence order
- [ ] Show correct order on incorrect
- [ ] Add TTS for correct sentence

**File:** `src/components/exercises/Typing.tsx` (NEW)

Typing exercise:
- Prompt display
- Text input
- Virtual keyboard (optional)

**Checklist - 7.1.5 Typing:**
- [ ] Create `src/components/exercises/Typing.tsx`
- [ ] Display prompt
- [ ] Create text input
- [ ] Add virtual keyboard for special characters
- [ ] Validate input
- [ ] Support fuzzy matching

**File:** `src/components/exercises/ListeningDictation.tsx` (NEW)

Listening dictation exercise:
- Audio playback
- Text input
- Progressive hints

**Checklist - 7.1.6 ListeningDictation:**
- [ ] Create `src/components/exercises/ListeningDictation.tsx`
- [ ] Add audio player
- [ ] Add text input
- [ ] Implement hint system
- [ ] Validate transcription
- [ ] Support partial credit

**File:** `src/components/exercises/StrokeOrder.tsx` (NEW)

Stroke order practice:
- Character display
- Stroke animation
- Drawing canvas

**Checklist - 7.1.7 StrokeOrder:**
- [ ] Create `src/components/exercises/StrokeOrder.tsx`
- [ ] Display character
- [ ] Animate stroke order
- [ ] Create drawing canvas
- [ ] Validate stroke order
- [ ] Provide feedback

---

### 7.2 Exercise Container

**File:** `src/components/exercises/ExerciseContainer.tsx` (NEW)

Generic exercise wrapper:
- Exercise header
- Timer (optional)
- Skip/hint buttons
- Feedback display

**Checklist - 7.2 ExerciseContainer:**
- [ ] Create `src/components/exercises/ExerciseContainer.tsx`
- [ ] Add exercise header with type indicator
- [ ] Add timer component (optional)
- [ ] Add hint button
- [ ] Add skip button
- [ ] Handle feedback display
- [ ] Award XP on completion

---

### 7.3 Exercise Index

**File:** `src/components/exercises/index.ts` (NEW)

**Checklist - 7.3 Index:**
- [ ] Create `src/components/exercises/index.ts`
- [ ] Export all exercise components

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
- [ ] Create `tools/find-hardcoded-strings.ts`
- [ ] Parse TSX files with AST
- [ ] Identify JSX text nodes
- [ ] Identify template literals with text
- [ ] Ignore comments and code strings
- [ ] Output report with file:line

**File:** `tools/check-translation-completeness.ts` (NEW)

Check translation coverage:
- Compare locales
- Find missing keys
- Report coverage percentage

**Checklist - 8.1.2 check-translation-completeness:**
- [ ] Create `tools/check-translation-completeness.ts`
- [ ] Load all locale files
- [ ] Compare key sets
- [ ] Calculate coverage percentage
- [ ] Output missing keys per locale
- [ ] Support JSON output

**File:** `tools/find-unused-i18n-keys.ts` (NEW)

Find orphaned translation keys:
- Scan codebase for key usage
- Compare to locale files
- Report unused keys

**Checklist - 8.1.3 find-unused-i18n-keys:**
- [ ] Create `tools/find-unused-i18n-keys.ts`
- [ ] Parse all TSX/TS files
- [ ] Extract translation key usage
- [ ] Compare to locale keys
- [ ] Report unused keys

**File:** `tools/analyze-data-completeness.ts` (NEW)

Report on learning data coverage:
- Items per language
- Items per level
- Audio coverage
- Missing fields

**Checklist - 8.1.4 analyze-data-completeness:**
- [ ] Create `tools/analyze-data-completeness.ts`
- [ ] Load all data files
- [ ] Count items per language/level
- [ ] Check audio URL coverage
- [ ] Check translation coverage
- [ ] Output summary report

**File:** `tools/validate-data-structure.ts` (NEW)

Validate JSON data files:
- Check against TypeScript types
- Validate references (lessonId exists)
- Report errors

**Checklist - 8.1.5 validate-data-structure:**
- [ ] Create `tools/validate-data-structure.ts`
- [ ] Create JSON schemas from TypeScript types
- [ ] Validate all data files against schemas
- [ ] Check lessonId references
- [ ] Check audioUrl file existence
- [ ] Report all validation errors

---

### 8.2 Admin UI (in murmura_admin)

> These tasks are for the separate murmura_admin repository

**Checklist - 8.2 Admin UI:**
- [ ] Set up Next.js project in `murmura_admin/admin_ui/`
- [ ] Create FastAPI backend routes in `murmura_admin/src/api/`
- [ ] Implement Dashboard page
- [ ] Implement Content Browser page
- [ ] Implement Curriculum Editor page
- [ ] Implement Generation Panel
- [ ] Implement i18n Management page
- [ ] Implement Data Analysis page
- [ ] Set up export to murmura web app
- [ ] Add documentation

---

## Testing Requirements

### Unit Tests

**Checklist - Unit Tests:**
- [ ] Test XP calculation functions
- [ ] Test streak management functions
- [ ] Test SRS algorithm functions
- [ ] Test exercise validation functions
- [ ] Test data loading utilities
- [ ] Test curriculum parsing
- [ ] Test lesson flow state machine
- [ ] Test achievement unlock logic

### Integration Tests

**Checklist - Integration Tests:**
- [ ] Test Convex queries/mutations
- [ ] Test lesson completion flow
- [ ] Test review session flow
- [ ] Test XP awarding
- [ ] Test streak updates
- [ ] Test achievement unlocks
- [ ] Test path progress updates

### E2E Tests

**Checklist - E2E Tests:**
- [ ] Test complete lesson flow
- [ ] Test review session
- [ ] Test dashboard interactions
- [ ] Test library navigation
- [ ] Test settings changes
- [ ] Test mobile responsiveness

### Accessibility Tests

**Checklist - Accessibility:**
- [ ] Test keyboard navigation on all pages
- [ ] Test screen reader compatibility
- [ ] Verify color contrast (4.5:1 minimum)
- [ ] Verify touch targets (44px minimum)
- [ ] Test focus indicators
- [ ] Test with prefers-reduced-motion

---

## Migration Strategy

### User Data Migration

**Checklist - Data Migration:**
- [ ] Create migration script for existing user progress
- [ ] Map old module stats to new gamification data
- [ ] Calculate initial XP from existing stats
- [ ] Initialize streak from lastActive date
- [ ] Set default daily goal
- [ ] Create empty path progress
- [ ] Test migration with sample data
- [ ] Create rollback script
- [ ] Document migration process

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
- [ ] Create new routes
- [ ] Set up redirects from old routes
- [ ] Update all internal links
- [ ] Update navigation component
- [ ] Test all redirects
- [ ] Update sitemap (if applicable)

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
- [ ] Curriculum data structure
- [ ] Basic lesson experience (3 content types)
- [ ] XP and streak tracking
- [ ] Daily goals
- [ ] Redesigned dashboard
- [ ] Basic exercises (multiple choice, typing)
- [ ] Cross-module reviews

**Defer to Post-MVP:**
- [ ] Advanced exercises (matching, sentence building)
- [ ] Achievements system
- [ ] Weekly reports
- [ ] Stroke order practice
- [ ] Speech recognition
- [ ] Admin UI
- [ ] Leaderboards enhancement

---

## File Checklist Summary

### New Files to Create:

**Types (5 files):**
- [ ] `src/types/curriculum.ts`
- [ ] `src/types/exercises.ts`
- [ ] `src/types/gamification.ts`
- [ ] `src/types/paths.ts`
- [ ] `src/types/reviews.ts`

**Hooks (8 files):**
- [ ] `src/hooks/useCurriculum.ts`
- [ ] `src/hooks/useLessonProgress.ts`
- [ ] `src/hooks/useGamification.ts`
- [ ] `src/hooks/useReviewQueue.ts`
- [ ] `src/hooks/useWeeklyReport.ts`
- [ ] `src/hooks/useAchievements.ts`
- [ ] `src/hooks/useDailyGoal.ts`
- [ ] `src/hooks/useStreak.ts`

**Lib (4 files):**
- [ ] `src/lib/xp.ts`
- [ ] `src/lib/streak.ts`
- [ ] `src/lib/curriculum.ts`
- [ ] `src/lib/achievements.ts`

**Pages (10 files):**
- [ ] `src/app/paths/page.tsx`
- [ ] `src/app/paths/[pathId]/page.tsx`
- [ ] `src/app/paths/[pathId]/[lessonId]/page.tsx`
- [ ] `src/app/library/page.tsx`
- [ ] `src/app/library/layout.tsx`
- [ ] `src/app/library/alphabet/page.tsx` (move)
- [ ] `src/app/library/vocabulary/page.tsx` (move)
- [ ] `src/app/library/kanji/page.tsx` (move)
- [ ] `src/app/library/grammar/page.tsx` (move)
- [ ] `src/app/achievements/page.tsx`

**Lesson Components (10 files):**
- [ ] `src/components/lesson/LessonView.tsx`
- [ ] `src/components/lesson/LessonIntro.tsx`
- [ ] `src/components/lesson/LessonCard.tsx`
- [ ] `src/components/lesson/LessonSummary.tsx`
- [ ] `src/components/lesson/LessonProgress.tsx`
- [ ] `src/components/lesson/CharacterLesson.tsx`
- [ ] `src/components/lesson/VocabularyLesson.tsx`
- [ ] `src/components/lesson/GrammarLesson.tsx`
- [ ] `src/components/lesson/CulturalNote.tsx`
- [ ] `src/components/lesson/index.ts`

**Gamification Components (12 files):**
- [ ] `src/components/gamification/DailyGoalSelector.tsx`
- [ ] `src/components/gamification/DailyGoalProgress.tsx`
- [ ] `src/components/gamification/AchievementCard.tsx`
- [ ] `src/components/gamification/AchievementUnlock.tsx`
- [ ] `src/components/gamification/AchievementGrid.tsx`
- [ ] `src/components/gamification/XPBar.tsx`
- [ ] `src/components/gamification/XPGain.tsx`
- [ ] `src/components/gamification/LevelUpCelebration.tsx`
- [ ] `src/components/gamification/StreakBadge.tsx`
- [ ] `src/components/gamification/StreakFreeze.tsx`
- [ ] `src/components/gamification/WeeklyReport.tsx`
- [ ] `src/components/gamification/index.ts`

**Dashboard Components (8 files):**
- [ ] `src/components/dashboard/PathProgressCard.tsx`
- [ ] `src/components/dashboard/ActionCard.tsx`
- [ ] `src/components/dashboard/DailyGoalCard.tsx`
- [ ] `src/components/dashboard/QuickStats.tsx`
- [ ] `src/components/dashboard/LibraryQuickAccess.tsx`
- [ ] `src/components/dashboard/WeeklyProgressCard.tsx`
- [ ] `src/components/dashboard/Header.tsx`
- [ ] `src/components/dashboard/index.ts` (update)

**Library Components (5 files):**
- [ ] `src/components/library/LibraryCard.tsx`
- [ ] `src/components/library/LibrarySearch.tsx`
- [ ] `src/components/library/LibraryFilters.tsx`
- [ ] `src/components/library/LibraryGrid.tsx`
- [ ] `src/components/library/index.ts`

**Review Components (6 files):**
- [ ] `src/components/review/ReviewConfig.tsx`
- [ ] `src/components/review/VocabularyReview.tsx`
- [ ] `src/components/review/KanjiReview.tsx`
- [ ] `src/components/review/GrammarReview.tsx`
- [ ] `src/components/review/ReviewSummary.tsx`
- [ ] `src/components/review/index.ts` (update)

**Exercise Components (9 files):**
- [ ] `src/components/exercises/ExerciseContainer.tsx`
- [ ] `src/components/exercises/FillBlank.tsx`
- [ ] `src/components/exercises/Matching.tsx`
- [ ] `src/components/exercises/SentenceBuilding.tsx`
- [ ] `src/components/exercises/Typing.tsx`
- [ ] `src/components/exercises/ListeningDictation.tsx`
- [ ] `src/components/exercises/StrokeOrder.tsx`
- [ ] `src/components/exercises/Speaking.tsx`
- [ ] `src/components/exercises/index.ts`

**Convex (6 files):**
- [ ] `convex/pathProgress.js`
- [ ] `convex/gamification.js`
- [ ] `convex/reviewQueue.js`
- [ ] `convex/weeklyReports.js`
- [ ] `convex/lessonSessions.js`
- [ ] `convex/achievements.js`

**Data Files (8+ files):**
- [ ] `src/data/achievements.json`
- [ ] `src/data/ja/curriculum.json`
- [ ] `src/data/ko/curriculum.json`
- [ ] `src/data/zh/curriculum.json`
- [ ] `src/data/es/curriculum.json`
- [ ] `src/data/de/curriculum.json`
- [ ] `src/data/en/curriculum.json`
- [ ] `src/data/it/curriculum.json`

**Tools (5 files):**
- [ ] `tools/find-hardcoded-strings.ts`
- [ ] `tools/check-translation-completeness.ts`
- [ ] `tools/find-unused-i18n-keys.ts`
- [ ] `tools/analyze-data-completeness.ts`
- [ ] `tools/validate-data-structure.ts`

### Files to Modify:

- [ ] `src/types/index.ts`
- [ ] `src/hooks/index.ts`
- [ ] `src/app/page.tsx` (dashboard)
- [ ] `src/app/review/page.tsx`
- [ ] `src/components/common/MultipleChoice.tsx`
- [ ] `src/components/common/Navigation.tsx`
- [ ] `convex/schema.js`
- [ ] `src/data/*/vocabulary.json` (add lessonId)
- [ ] `src/data/*/grammar.json` (add lessonId)
- [ ] `src/data/*/kanji.json` (add lessonId)

---

## Total Checklist Items: ~250+

This implementation plan provides a comprehensive roadmap for transforming Murmura from a module-centric app to a curriculum-driven learning platform with full gamification support.
