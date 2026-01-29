# Murmura Platform Redesign & Admin Tooling Plan

## Executive Summary

This plan covers two major initiatives:

1. **End-User App Redesign** - Transform the current module-centric app into a curriculum-driven learning experience
2. **Admin Tooling System** - A local-only admin UI for content generation and management (completely separate from the production app)

### Key Clarifications

- **Admin UI is always local** - Never deployed, no static mode needed
- **CLI analysis scripts target murmura_web** - i18n checks, hardcoded string detection apply to the user-facing app only
- **Direct file export** - Admin writes JSON directly to `murmura_web/src/data/`, no browser download needed
- **Test-based progression** - After X lessons, user takes a test before advancing

### Competitive Positioning

**What Makes Murmura Unique:**
- **LLM-Generated Curriculum** - Faster content creation and updates vs. manual expert creation
- **Asian Language Focus** - Specialization in stroke order and character depth (like LingoDeer)
- **5-Minute Lessons** - Shorter than Duolingo/Babbel - modern attention span optimization
- **Path-First Design** - UI built around learning journey (not separate apps bolted together)
- **AI-First Architecture** - Built for 2026, not retrofitted with AI features

### Research-Backed Insights (2026)

**Proven Effectiveness:**
- Users with **7-day streaks** are **3.6x more likely** to stay engaged long-term
- Learning for **4-34 hours** can produce gains equivalent to a university semester
- **60% of app users** improve oral proficiency, not just grammar/vocabulary
- **Spaced repetition** moves content from short-term to long-term memory most effectively

**Engagement Metrics from Top Platforms:**
- Streak simplification = 40% increase in 7-day streak maintenance
- XP leaderboards = 40% more engagement
- Streak Freeze feature = 21% reduction in churn
- Treasure Chest rewards = 15% uptick in lesson completion

---

## Part 1: End-User App Redesign

### Current State Analysis

The current murmura_web app is **module-focused**:
- Separate pages: Alphabet, Vocabulary, Kanji, Grammar, Reading, Listening
- Each module is independent with its own data and progress
- Learning paths exist but are secondary to module exploration
- User chooses what to study (free exploration model)

### Target Vision (From Platform Outline)

The new app should be **Curriculum-Driven**:
- **Paths take center stage** - User follows a structured 0-to-100 journey
- **Lessons are the atomic unit** - 5 minutes max, mixing content types
- **Module pages become reference/review** - Access content you've already learned
- **SRS operates independently** - Reviews scheduled forever across all content

### Architecture Transformation

```
CURRENT ARCHITECTURE              NEW ARCHITECTURE
──────────────────────           ──────────────────────
┌─────────────────────┐          ┌─────────────────────┐
│     Dashboard       │          │     Dashboard       │
│  ┌───┐ ┌───┐ ┌───┐ │          │  ┌─────────────────┐│
│  │Alp│ │Voc│ │Kan│ │          │  │  Path Progress  ││
│  └───┘ └───┘ └───┘ │          │  │   (0 → 100%)    ││
│  ┌───┐ ┌───┐ ┌───┐ │          │  └─────────────────┘│
│  │Gra│ │Rea│ │Lis│ │          │  ┌─────────────────┐│
│  └───┘ └───┘ └───┘ │          │  │  Next Lesson    ││
└─────────────────────┘          │  │  "Food & Drink" ││
         ↓                        │  └─────────────────┘│
    Module Pages                  │  ┌─────────────────┐│
    (isolated)                    │  │ Reviews Due: 42 ││
                                  │  └─────────────────┘│
                                  └─────────────────────┘
                                           ↓
                                   ┌─────────────────┐
                                   │   Lesson View   │
                                   │ (mixed content) │
                                   │ Vocab + Grammar │
                                   │ + Characters    │
                                   └─────────────────┘
```

---

### Detailed Redesign Specification

#### 1. New Page Structure

```
/                           → Dashboard (Path-focused)
/paths                      → Path Selection / Overview
/paths/[pathId]             → Path Detail (Units/Lessons list)
/paths/[pathId]/[lessonId]  → Lesson Experience (5-min lesson)
/review                     → SRS Review Session (cross-module)
/library                    → Content Library (formerly modules)
/library/alphabet           → Alphabet Reference
/library/vocabulary         → Vocabulary Reference
/library/kanji              → Kanji/Hanzi Reference
/library/grammar            → Grammar Reference
/settings                   → User Settings
/admin                      → (Local only) Admin Tools
```

#### 2. Dashboard Redesign

**Current Dashboard:**
- 6 module cards (Alphabet, Vocab, Kanji, Grammar, Reading, Listening)
- Stats panel showing streak, words learned, etc.

**New Dashboard:**
```
┌────────────────────────────────────────────────────────────┐
│  MURMURA                           [DE] Japanese  [≡]     │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  YOUR PATH: Japanese Journey                         │ │
│  │  ━━━━━━━━━━━━━━━━━━━━●───────────── 23%              │ │
│  │  Level: N5 (Beginner)  •  Lesson 12 of 52            │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌────────────────────┐  ┌────────────────────┐           │
│  │  CONTINUE LESSON   │  │   REVIEW SESSION   │           │
│  │                    │  │                    │           │
│  │  "Food & Drink"    │  │   42 items due     │           │
│  │  ～5 min           │  │   (15 vocab,       │           │
│  │                    │  │    20 kanji,       │           │
│  │  [Start Lesson]    │  │    7 grammar)      │           │
│  │                    │  │                    │           │
│  │                    │  │   [Start Review]   │           │
│  └────────────────────┘  └────────────────────┘           │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  QUICK STATS                                         │ │
│  │  🔥 12 day streak  •  245 words  •  89 kanji         │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  LIBRARY (Reference)                                 │ │
│  │  [Alphabet] [Vocabulary] [Kanji] [Grammar]           │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

#### 3. Lesson Experience (New Page)

The lesson is the core learning experience - 5 minutes max, mixing content types.

**Lesson Structure:**
```typescript
interface Lesson {
  id: string;           // "A1-U1-L3"
  title: string;        // "Food & Drink"
  description: string;
  estimatedMinutes: number; // max 5
  content: {
    // Characters to introduce (if applicable)
    characters?: string[];  // ["食", "飲"]

    // Vocabulary for this lesson
    vocabulary: string[];   // ["vocab-123", "vocab-124"]

    // Grammar points
    grammar?: string[];     // ["gram-5"]

    // Mini reading passage (optional)
    reading?: string;       // reading ID

    // Cultural notes
    culturalNotes?: string[];
  };
}
```

**Lesson Flow:**
1. **Introduction** (30s) - What you'll learn
2. **New Content** (2-3min) - Characters → Vocab → Grammar (sequential reveal)
3. **Practice** (1-2min) - Quick exercises mixing new content
4. **Summary** (30s) - Review what was learned + SRS scheduling

**Unit Tests (From Platform Outline):**
After completing X lessons (e.g., 5-10), users take a **Unit Test**:
- Tests all content from the completed lessons
- Must pass (e.g., 70%) to unlock next unit
- Failed tests highlight weak areas for review
- Adds gamification and ensures retention

**UI Pattern:**
```
┌────────────────────────────────────────────────────────────┐
│  ← Back    Lesson 3: Food & Drink         [||] Pause      │
├────────────────────────────────────────────────────────────┤
│                                                            │
│              ┌─────────────────────────┐                   │
│              │                         │                   │
│              │         食べる          │                   │
│              │        taberu           │                   │
│              │                         │                   │
│              │       "to eat"          │                   │
│              │                         │                   │
│              │    🔊 [Play Sound]      │                   │
│              │                         │                   │
│              └─────────────────────────┘                   │
│                                                            │
│  Progress: ━━━━━━━━━━━●───────────────── 4/10             │
│                                                            │
│                    [Next →]                                │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

#### 4. Library (Renamed from Modules)

The current module pages become "Library" - a reference for content you've learned.

**Key Changes:**
- Add filter: "Learned only" (default) vs "All content"
- Add filter: "By lesson" - see which lesson introduced each item
- Add search functionality
- SRS status indicators (due, mastered, new)

**Library Card Enhancement:**
```
┌─────────────────────────────────────────┐
│  食べる                    🔊  ✓ Learned │
│  taberu - to eat                        │
│                                         │
│  From: Lesson 3 "Food & Drink"          │
│  SRS: Due in 3 days | Mastery: 87%      │
└─────────────────────────────────────────┘
```

#### 5. Gamification & Engagement System

**Motivational Systems:**
- **Streaks** - Daily activity tracking to maintain learning momentum (3.6x engagement multiplier)
- **XP/Points** - Experience points earned for completing lessons and exercises (40% more engagement)
- **Levels** - User progression system separate from language proficiency
- **Achievements/Badges** - Unlock rewards for milestones (7-day streak, 100 lessons, etc.)
- **Leaderboards** - Weekly/monthly competition with friends or global learners (post-MVP)

**Progress Tracking:**
- **Daily Goals** - Customizable (5/10/15/20 min per day)
- **Weekly Reports** - Summary of time spent, lessons completed, accuracy rates
- **Strength Meter** - Visual indicator of vocabulary/skill retention
- **Mastery Levels** - Per-word or per-topic mastery tracking

**UI Pattern for Streak/XP:**
```
┌──────────────────────────────────────────────────────────┐
│  🔥 12 day streak    ⚡ 1,250 XP    📈 Level 5          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 750/1000 to Level 6  │
└──────────────────────────────────────────────────────────┘
```

#### 6. Exercise Variety

**Exercise Types for Lessons & Reviews:**
1. **Multiple Choice** - Select correct translation or answer
2. **Fill in the Blank** - Complete sentences with missing words
3. **Matching** - Pair words with translations or images
4. **Sentence Building** - Arrange words to form correct sentences
5. **Writing Practice** - Type translations or construct sentences
6. **Speaking Practice** - Pronunciation exercises with speech recognition (post-MVP)
7. **Picture Description** - Describe images using target language (post-MVP)

**Feedback & Correction:**
- **Instant Feedback** - Immediate correction with explanations
- **Mistake Analysis** - Track common errors and patterns
- **Grammar Tips** - Contextual grammar explanations when errors occur

#### 7. Review System Enhancement

The SRS review should be **cross-module** - reviewing vocab, kanji, and grammar together.

**Review Session Types:**
1. **Smart Mix** (default) - Algorithm picks most due items across all types
2. **Module-Specific** - Focus on one module (vocab only, kanji only)
3. **Lesson Review** - Review items from a specific lesson

**Review Interface Update:**
```
┌────────────────────────────────────────────────────────────┐
│  Review Session                  42 remaining  [×] End    │
├────────────────────────────────────────────────────────────┤
│                                                            │
│              ┌─────────────────────────┐                   │
│              │                         │                   │
│              │           食            │  ← Kanji item     │
│              │                         │                   │
│              │      What is this?      │                   │
│              │                         │                   │
│              └─────────────────────────┘                   │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ Type meaning or reading...                           │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  [Show Answer]                                             │
│                                                            │
│  Item type: Kanji (N5) | From: Lesson 3                   │
└────────────────────────────────────────────────────────────┘
```

#### 8. Adaptive Learning Features

**Personalization:**
- **Difficulty Adjustment** - Adapts lesson complexity based on user performance
- **Personalized Review** - System identifies weak areas and suggests focused practice
- **Skip/Placement Tests** - Allow advanced learners to skip known content (post-MVP)

#### 9. Data Model Changes

**New Data Structure Requirements:**

```typescript
// Enhanced vocabulary with lesson reference
interface VocabularyItem {
  id: string;
  word: string;
  reading: string;
  meaning: string;
  meanings: Record<string, string>; // multi-language
  level: string;       // "N5", "A1"
  lessonId: string;    // "A1-U1-L3" - NEW: Links to curriculum
  tags: string[];
  audioUrl?: string;
  examples: Example[];
}

// Curriculum structure (from admin)
interface Course {
  languageCode: string;
  levels: Level[];
}

interface Level {
  level: string;        // "A1", "N5"
  description: string;
  units: Unit[];
}

interface Unit {
  id: string;           // "A1-U1"
  title: string;
  description: string;
  lessons: Lesson[];
}

interface Lesson {
  id: string;           // "A1-U1-L1"
  title: string;
  description: string;
  content: LessonContent;
}

interface LessonContent {
  topics: string[];         // Grammar topics
  vocabFocus: string[];     // Vocab themes
  kanjiFocus?: string[];    // Kanji to teach
  culturalNotes?: string[];
}
```

**New Files Needed:**
- `src/data/{lang}/curriculum.json` - Course structure with lessons
- Update `vocabulary.json`, `grammar.json` to include `lessonId` field

#### 10. User Progress Model Changes

**Current Progress:**
```typescript
{
  modules: {
    vocabulary: { learned: string[], reviews: {}, stats: {} },
    kanji: { learned: string[], reviews: {}, stats: {} },
    // ...
  }
}
```

**New Progress Model:**
```typescript
{
  // Path progress
  currentPath: {
    pathId: string;
    currentLessonId: string;
    completedLessons: string[];
    startedAt: number;
  },

  // Individual item progress (unchanged but enhanced)
  items: {
    [itemId: string]: {
      learnedAt: number;
      lessonId: string;      // Which lesson taught this
      srsData: SRSData;
      masteryLevel: number;  // 0-100% mastery
    }
  },

  // Gamification
  gamification: {
    xp: number;
    level: number;
    streak: number;
    longestStreak: number;
    lastActivityDate: string;
    achievements: string[];   // Achievement IDs
    dailyGoalMinutes: number; // 5, 10, 15, or 20
    dailyProgress: number;    // Minutes studied today
  },

  // Global stats
  globalStats: {
    totalStudyTime: number;
    lessonsCompleted: number;
    itemsLearned: number;
    testsCompleted: number;
    averageAccuracy: number;
  },

  // Weekly report data
  weeklyStats: {
    weekStart: string;
    minutesPerDay: number[];   // [Mon, Tue, Wed, ...]
    lessonsPerDay: number[];
    accuracyPerDay: number[];
  }
}
```

---

### MVP Feature Prioritization

Based on research and competitive analysis, features are prioritized by impact:

**Tier 1 - Essential for Launch (Must Have):**
1. ⭐ **Spaced Repetition System (SRS)** - Industry-standard for retention
2. ⭐ **Grammar Instruction** - Explicit teaching with contextual tips
3. ⭐ **Streak System** - Proven 3.6x engagement multiplier
4. ⭐ **Interactive Exercises** - Multiple choice, fill-in-blank, matching, sentence building
5. ⭐ **Review/Practice Mode** - Systematic reinforcement of learned material

**Tier 2 - High-Value Additions (Should Have):**
6. 🔸 **XP/Points System** - 40% engagement boost
7. 🔸 **Daily Goals** - Customizable targets drive habit formation
8. 🔸 **Writing Practice** - Type translations and construct sentences
9. 🔸 **Stroke Order Teaching** - Essential for Asian languages
10. 🔸 **Stories/Narrative Content** - Contextual learning and engagement

**Tier 3 - Differentiation Features (Nice to Have):**
11. 🎯 **Placement Testing** - Skip known content
12. 🎯 **AI Speech Recognition** - Pronunciation practice
13. 🎯 **AI Conversation Partner** - Interactive dialogue practice

**Tier 4 - Future Enhancements (Post-MVP):**
- Mobile apps (iOS/Android native)
- Offline mode with sync
- Social features (friends, leaderboards, community)
- Live classes with tutors
- Monetization (premium tiers)

### Recommended MVP Feature Set

✅ Curriculum/Path with progress tracking
✅ 5-minute lessons (4 content types: Characters, Vocab, Listening, Reading)
✅ Spaced repetition review system
✅ Streak tracking + daily goals
✅ Interactive exercises (multiple choice, fill-in-blank, matching, sentence building)
✅ XP/Points system
✅ Grammar instruction within lessons
✅ Stroke order for Asian languages (Japanese, Korean)
✅ Weekly progress reports
✅ Mastery tracking per vocabulary/skill

---

### Implementation Phases

#### Phase 1: Data Model & Infrastructure
- [x] Add `lessonId` field to existing data files
- [x] Create curriculum JSON structure for each language
- [x] Update TypeScript types in `src/types/`
- [x] Create `useCurriculum` hook for curriculum data
- [x] Update progress model in Convex schema
- [x] Add gamification schema (XP, streak, achievements)

#### Phase 2: Lesson Experience
- [x] Create `/paths/[pathId]/[lessonId]/page.tsx`
- [x] Build `LessonView` component with card stack UI
- [x] Implement lesson flow: intro → content → practice → summary
- [x] Add lesson completion and SRS scheduling
- [x] Create lesson progress persistence
- [x] Implement exercise types (multiple choice, fill-in-blank, matching, sentence building)

#### Phase 3: Gamification System
- [x] Implement streak tracking with Streak Freeze option
- [x] Create XP/Points system
- [x] Add user levels with progression
- [x] Build daily goals selector (5/10/15/20 min)
- [x] Create achievement/badge system
- [x] Add XP animations and level-up celebrations

#### Phase 4: Dashboard Redesign
- [x] Redesign Dashboard layout (path-focused)
- [x] Add "Continue Lesson" card
- [x] Add "Review Session" card with due count
- [x] Create path progress visualization
- [x] Add streak/XP display bar
- [x] Add "Library" quick access section
- [x] Add weekly progress summary

#### Phase 5: Library Transformation
- [x] Rename module pages to Library
- [x] Add "By Lesson" filter
- [x] Add "Learned only" filter
- [x] Enhance cards with lesson source info
- [x] Add mastery indicators
- [x] Add search functionality

#### Phase 6: Cross-Module Reviews
- [x] Unify review logic across modules
- [x] Create mixed review session with exercise variety
- [x] Add module filter for focused review
- [x] Add lesson review option
- [x] Update SRS to work with lesson context
- [x] Implement instant feedback with explanations

---

## Part 2: Admin Tooling System

### Overview

The admin system is split between two repositories:

1. **murmura (web app)** - Contains CLI analysis scripts in `/tools/` for analyzing i18n and learning data
2. **murmura_admin** - Separate project at `/Users/rennerdo30/Development/murmura_admin/` with:
   - Python content generation engine (LLM-powered)
   - Admin Web UI for content management and analysis
   - No authentication required (local development only)

### murmura CLI Analysis Scripts (TypeScript)

Located in `murmura/tools/`, these scripts analyze the web app's i18n and data files:

| Script | Purpose |
|--------|---------|
| `find-hardcoded-strings.ts` | Find strings that should use i18n |
| `check-translation-completeness.ts` | Check translation coverage per locale |
| `find-unused-i18n-keys.ts` | Find orphaned translation keys |
| `analyze-data-completeness.ts` | Report on learning data coverage |
| `validate-data-structure.ts` | Validate JSON data files match schemas |

**Usage:**
```bash
npx tsx tools/find-hardcoded-strings.ts
npx tsx tools/check-translation-completeness.ts --json
npx tsx tools/analyze-data-completeness.ts
```

### murmura_admin (Python + Web UI)

**Already Implemented:**
- SQLite database with SQLAlchemy models
- Python generators: Vocab, Grammar, Kanji, Alphabet, Reading, Audio
- Curriculum generator (generates course structure)
- Lesson generator (fills lesson content)
- Multiple TTS backends (ElevenLabs, Edge-TTS, XTTS-v2)
- Multiple LLM backends (OpenAI, Google Gemini, OpenRouter, Ollama)
- CLI via `scripts/admin.py`
- JSON export to `current_data/`

### What's Needed: Admin Web UI (in murmura_admin)

The admin web UI lives in murmura_admin and provides:
1. **Content browsing** - View all data in the database
2. **Content editing** - Edit individual items
3. **Generation control** - Trigger LLM generation with UI
4. **Export management** - Export to web app with one click
5. **Curriculum visualization** - Visual curriculum editor
6. **i18n Analysis** - Translation completeness dashboard
7. **Data Analysis** - Learning data coverage reports

### Admin UI Tech Stack

Since this is local-only (no authentication needed):
- **Backend**: FastAPI (Python) - already has SQLAlchemy
- **Frontend**: Next.js at `murmura_admin/admin_ui/`
- **Database**: SQLite (already in use)

### Admin UI Features

#### 1. Dashboard
- Stats: Items per language, generation coverage
- Translation completeness overview
- Quick actions: Generate, Export, Import

#### 2. Content Browser
- Table view with filtering by language, level, type
- Full-text search
- Inline editing

#### 3. Curriculum Editor
- Visual tree view of Course → Level → Unit → Lesson
- Drag-and-drop reordering
- Edit lesson metadata
- Generate content for specific lessons

#### 4. Generation Panel
- Select: Language, Type (Vocab/Grammar/etc.), Level
- Configure: LLM provider, model, TTS backend
- Progress indicator during generation
- Preview generated content before saving

#### 5. i18n Management
- Side-by-side locale comparison
- Missing keys highlighted
- Download buttons (per locale or all as ZIP)

#### 6. Data Analysis
- Data completeness table per language
- Per-module item counts
- JSON download for each data file

### Implementation Plan

#### Phase A: FastAPI Backend (1-2 days)
- [x] Create `src/api/` with FastAPI routes
- [x] CRUD endpoints for all data types
- [x] Curriculum endpoints
- [x] Generation trigger endpoints
- [x] Export endpoints

#### Phase B: Next.js Frontend (2-3 days)
- [x] Create `admin_ui/` Next.js project
- [x] Dashboard page with stats
- [x] Content browser with DataTable
- [x] Curriculum tree view
- [x] i18n management (from murmura implementation)
- [x] Data analysis (from murmura implementation)

#### Phase C: Integration (1 day)
- [x] Export to murmura_web integration
- [x] Validation scripts
- [x] Documentation

---

## Summary of Files to Create/Modify

### End-User App (murmura_web)

**New Files:**
```
src/app/paths/page.tsx                    # Path selection
src/app/paths/[pathId]/page.tsx           # Path detail
src/app/paths/[pathId]/[lessonId]/page.tsx # Lesson experience
src/app/library/page.tsx                  # Library index
src/app/library/layout.tsx                # Library layout
src/components/lesson/LessonView.tsx      # Lesson UI
src/components/lesson/LessonCard.tsx      # Individual content card
src/components/path/PathProgress.tsx      # Path progress bar
src/hooks/useCurriculum.ts                # Curriculum data hook
src/hooks/useLessonProgress.ts            # Lesson progress
src/types/curriculum.ts                   # Curriculum types
src/data/{lang}/curriculum.json           # Curriculum data (per language)
```

**Modified Files:**
```
src/app/page.tsx                          # Dashboard redesign
src/app/alphabet/page.tsx                 # → Library section
src/app/vocabulary/page.tsx               # → Library section
src/app/kanji/page.tsx                    # → Library section
src/app/grammar/page.tsx                  # → Library section
src/app/review/page.tsx                   # Cross-module review
src/components/common/Navigation.tsx      # Update nav structure
src/hooks/useSRS.ts                       # Enhance for cross-module
src/types/index.ts                        # Add curriculum types
convex/schema.js                          # Add path progress fields
```

### Admin Tools (murmura_admin)

**New Files:**
```
src/api/__init__.py
src/api/main.py                           # FastAPI app
src/api/routes/vocabulary.py              # Vocab CRUD
src/api/routes/grammar.py                 # Grammar CRUD
src/api/routes/curriculum.py              # Curriculum endpoints
src/api/routes/generation.py              # Generation triggers
src/api/routes/export.py                  # Export endpoints
admin_ui/                                 # Frontend (TBD: React or HTMX)
```

---

## Content Diversity

### Supplementary Materials
- **Stories** - Short narratives at various difficulty levels
- **Cultural Notes** - Context about customs, etiquette, cultural practices
- **Grammar Reference** - Comprehensive grammar guide separate from lessons
- **Phrasebook** - Common expressions organized by situation (travel, business, etc.)

### Topic Variety (Themed Lessons)
- Travel & Tourism
- Business & Professional
- Food & Dining
- Health & Emergencies
- Shopping & Services
- Social & Relationships
- Hobbies & Entertainment

---

## Accessibility & Convenience

### Customization Options
- **Learning Pace** - Adjust lesson frequency and difficulty
- **Interface Language** - Choose UI language independent of learning language
- **Notification Settings** - Customizable reminders and motivational messages
- **Dark Mode** - Eye-friendly night mode
- **Font Size** - Accessibility options for readability

### Multi-Platform (Future)
- Web Application (current - responsive PWA)
- Mobile Apps: iOS and Android native (post-MVP)
- Offline Mode: Download lessons for offline learning (post-MVP)
- Cross-Device Sync: Seamless progress synchronization

---

## Questions to Resolve Before Implementation

1. **Lesson Length**: Confirm 5-minute max. How many items per lesson?
2. **Review Strategy**: Should reviews interrupt lessons or be separate?
3. **Offline Support**: Should lessons be downloadable for offline use? (Post-MVP)
4. **Audio Priority**: Generate audio during lesson content generation?
5. **Migration**: How to migrate existing user progress to new model?
6. **XP Values**: How much XP per lesson/review/exercise?
7. **Streak Freeze**: Allow 1 free freeze or require purchase with XP?
8. **Leaderboard Scope**: Friends-only or global? (Post-MVP)

---

## Initial Test Languages

For testing and initial development:
- **Korean** - Uses Hangul alphabet, TOPIK levels
- **Japanese** - Uses Hiragana, Katakana, and Kanji, JLPT levels
- **German** - Uses Latin alphabet with umlauts, CEFR levels
- **English** - Uses Latin alphabet, CEFR levels

---

## Next Steps

1. **Review this plan** and confirm the direction
2. **Start with Admin UI** (since it's needed to generate curriculum data)
3. **Generate curriculum** for test languages (Korean, Japanese, German, English)
4. **Build lesson experience** with exercise variety
5. **Implement gamification** (streak, XP, daily goals)
6. **Redesign dashboard** around paths
7. **Transform modules to library**
8. **Add weekly reports and progress tracking**
