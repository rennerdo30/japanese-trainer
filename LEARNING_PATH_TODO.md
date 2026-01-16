# Learning Path System - Implementation TODO

**Project:** Comprehensive Guided Learning System with Adaptive SRS
**Started:** 2026-01-16
**Status:** ✅ COMPLETE - All 6 Phases Implemented

---

## Overview

Building a freedom-first guided learning system that provides intelligent recommendations and structured paths WITHOUT restricting user freedom. Think "Google Maps for Language Learning" - users can take any route, but the system shows optimal paths and adapts to preferences.

---

## Phase 1: Foundation (Refactoring & Data) ✅ COMPLETE

**Goal:** Prepare codebase for multi-language and learning paths

### 1.1 Data Directory Restructuring ✅
- [x] Create `src/data/ja/` directory
- [x] Move all Japanese data files to `src/data/ja/`
- [x] Update all import paths in components
- [x] Test that all modules still load correctly

### 1.2 Language Configuration System ✅
- [x] Create `src/data/language-configs.json` with Japanese, Spanish, Korean, Chinese configs
- [x] Create `src/lib/language.ts` with core interfaces and utilities
- [x] Create `src/hooks/useTargetLanguage.ts` for managing target language

### 1.3 Prerequisite System ✅
- [x] Create `src/data/ja/prerequisites.json` with prerequisite rules
- [x] Create `src/lib/prerequisites.ts` with checking functions

### 1.4 Learning Paths Data ✅
- [x] Create `src/data/learning-paths.json` with JLPT Linear Path and Topic Tracks

### 1.5 Convex Schema Extensions ✅
- [x] Update `convex/schema.js` with new tables
- [x] Create `convex/learningPaths.ts`
- [x] Create `convex/reviewSessions.ts`
- [x] Create `convex/srsSettings.ts`

---

## Phase 2: SRS Review System ✅ COMPLETE

**Goal:** Build unified review dashboard with Anki-like spaced repetition

### 2.1 Review Queue Logic ✅
- [x] Create `src/lib/reviewQueue.ts` with full review queue implementation

### 2.2 Review Dashboard UI ✅
- [x] Create `src/app/review/page.tsx` with overview, session, and complete modes
- [x] Create `src/components/review/ReviewCard.tsx`
- [x] Create `src/components/review/ReviewProgress.tsx`
- [x] Create `src/components/review/ReviewStats.tsx`

### 2.3 SRS Settings UI ✅
- [x] Create `src/app/settings/srs/page.tsx` with full settings controls

---

## Phase 3: Learning Companion AI ✅ COMPLETE

**Goal:** Implement intelligent recommendation system with persistent UI

### 3.1 Recommendation Engine ✅
- [x] Create `src/lib/recommendations.ts` with all 4 path types:
  - Linear path recommendations (JLPT progression)
  - Topic track recommendations (themed paths)
  - Prerequisite-based recommendations
  - Adaptive AI recommendations

### 3.2 Learning Companion UI ✅
- [x] Create `src/components/LearningCompanion/LearningCompanion.tsx`
- [x] Desktop: Collapsible right sidebar
- [x] Mobile: Floating FAB with bottom sheet

### 3.3 Hooks ✅
- [x] Create `src/hooks/useRecommendations.ts`
- [x] Create `src/hooks/usePathProgress.ts`

---

## Phase 4: Learning Paths UI ✅ COMPLETE

**Goal:** Build path browsing, enrollment, and navigation

### 4.1 Paths Browse Page ✅
- [x] Create `src/app/paths/page.tsx` with filters
- [x] Section: Structured Paths (JLPT linear path)
- [x] Section: Topic Tracks (themed track cards)
- [x] Section: Adaptive Paths (AI-generated recommendations)

### 4.2 Individual Path Detail Pages ✅
- [x] Create `src/app/paths/[pathId]/page.tsx`
- [x] Milestone list for linear paths
- [x] Item breakdown for topic tracks
- [x] Enrollment/unenrollment logic

---

## Phase 5: Enhanced Progress Visualization ✅ COMPLETE

**Goal:** Improve dashboard with advanced progress widgets

### 5.1 Dashboard Widgets ✅
- [x] Create `src/components/dashboard/LearningCompass.tsx` with radar chart
- [x] Create `src/components/dashboard/MasteryHeatmap.tsx` (GitHub-style grid)
- [x] Create `src/components/dashboard/StreakCalendar.tsx` (activity calendar)
- [x] Create `src/components/dashboard/GoalEstimator.tsx` with goal tracking

---

## Phase 6: Multi-Language Support (Foundation) ✅ COMPLETE

**Goal:** Validate language abstraction with second language (Spanish)

### 6.1 Spanish Language Data ✅
- [x] Create `src/data/es/` directory
- [x] Create `src/data/es/vocabulary.json` (30 A1 vocabulary items)
- [x] Create `src/data/es/grammar.json` (8 grammar patterns)
- [x] Create `src/data/es/readings.json` (3 reading passages)

### 6.2 Language Selector ✅
- [x] Create `src/components/common/TargetLanguageSelector.tsx`
- [x] Dropdown with language selection
- [x] Updates target language in localStorage

---

## Implementation Summary

### Files Created

**Core Libraries:**
- `src/lib/language.ts` - Language abstraction utilities
- `src/lib/prerequisites.ts` - Prerequisite checking system
- `src/lib/reviewQueue.ts` - SRS review queue management
- `src/lib/recommendations.ts` - 4-type recommendation engine

**Hooks:**
- `src/hooks/useTargetLanguage.ts` - Target language management
- `src/hooks/useRecommendations.ts` - Recommendation data fetching
- `src/hooks/usePathProgress.ts` - Path enrollment and progress

**Components:**
- `src/components/LearningCompanion/LearningCompanion.tsx` - AI sidebar companion
- `src/components/dashboard/LearningCompass.tsx` - Radar chart widget
- `src/components/dashboard/MasteryHeatmap.tsx` - Progress heatmap
- `src/components/dashboard/StreakCalendar.tsx` - Activity calendar
- `src/components/dashboard/GoalEstimator.tsx` - Goal tracking widget
- `src/components/review/ReviewCard.tsx` - Review session cards
- `src/components/review/ReviewProgress.tsx` - Session progress bar
- `src/components/review/ReviewStats.tsx` - Session statistics
- `src/components/common/TargetLanguageSelector.tsx` - Language dropdown

**Pages:**
- `src/app/review/page.tsx` - Unified review dashboard
- `src/app/paths/page.tsx` - Path browsing with filters
- `src/app/paths/[pathId]/page.tsx` - Individual path details
- `src/app/settings/srs/page.tsx` - SRS configuration

**Data:**
- `src/data/language-configs.json` - Multi-language configurations
- `src/data/learning-paths.json` - JLPT path + 5 topic tracks
- `src/data/ja/prerequisites.json` - Japanese prerequisite rules
- `src/data/es/vocabulary.json` - Spanish A1 vocabulary (30 items)
- `src/data/es/grammar.json` - Spanish A1 grammar (8 patterns)
- `src/data/es/readings.json` - Spanish A1 readings (3 passages)

**Convex Backend:**
- `convex/learningPaths.ts` - Path enrollment/progress
- `convex/reviewSessions.ts` - Session tracking
- `convex/srsSettings.ts` - SRS settings storage

### Key Features Implemented

1. **Freedom-First Architecture** - No locked content, all paths are suggestions
2. **4-Type Recommendation Engine** - Linear, Topic, Prerequisite, Adaptive
3. **Unified SRS Review** - Anki-like review across all modules
4. **Learning Companion** - Persistent sidebar with AI recommendations
5. **Path System** - Browse, enroll, track progress on learning paths
6. **Dashboard Widgets** - Compass, Heatmap, Calendar, Goal Estimator
7. **Multi-Language Foundation** - Spanish added to validate architecture

---

## Next Steps (Post-MVP)

### Multi-Language Module Refactoring (Priority)
- [ ] Refactor `alphabet/page.tsx` to load data dynamically based on target language
- [ ] Add Korean-specific filters to alphabet page (consonant, vowel, double_consonant, compound_vowel)
- [ ] Refactor `kanji/page.tsx` to load data dynamically based on target language
- [ ] Add Chinese-specific features to kanji page (HSK levels, pinyin instead of onyomi/kunyomi)
- [ ] Update translations for language-aware module descriptions

### Language Data Creation
**Korean:**
- [ ] Create Korean vocabulary data (`src/data/ko/vocabulary.json`)
- [ ] Create Korean grammar data (`src/data/ko/grammar.json`)
- [ ] Create Korean reading data (`src/data/ko/readings.json`)
- [ ] Create Korean listening data (`src/data/ko/listening.json`)
- [x] Hangul characters created (`src/data/ko/characters.json` - 40 chars)

**Chinese:**
- [ ] Create Chinese vocabulary data (`src/data/zh/vocabulary.json`)
- [ ] Create Chinese grammar data (`src/data/zh/grammar.json`)
- [ ] Create Chinese reading data (`src/data/zh/readings.json`)
- [ ] Create Chinese listening data (`src/data/zh/listening.json`)
- [ ] Expand Chinese Hanzi data (more HSK1-HSK2 characters)
- [x] Basic Hanzi created (`src/data/zh/hanzi.json` - 10 HSK1 chars)

**Other Languages:**
- [ ] Create German complete data set
- [ ] Create English complete data set (for non-native speakers)
- [ ] Create Italian complete data set

### General
- [ ] Add Learning Companion to root layout
- [ ] Add dashboard widgets to main dashboard page
- [ ] Generate Spanish TTS audio files
- [ ] Implement notification system
- [ ] Add social features (leaderboards, groups)
- [ ] Add gamification (XP, badges, achievements)

---

## Notes & Decisions

### 2026-01-16
- Initial plan created
- All 6 phases implemented in a single session
- Used custom SVG for radar chart (no external chart library needed)
- Spanish added with CEFR levels (A1-C2) vs Japanese JLPT (N5-N1)
- Freedom-first architecture maintained throughout
