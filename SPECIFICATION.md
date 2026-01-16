# Murmura - Technical Specification

## Overview

Murmura is a modern, full-featured web application for learning multiple languages. Built with Next.js and TypeScript, it provides an elegant, distraction-free learning experience with comprehensive progress tracking, audio pronunciation, and support for Japanese, Korean, Chinese, Spanish, German, Italian, and English.

**URL**: https://murmura.renner.dev (to be updated)
**Repository**: https://github.com/rennerdo30/murmura

---

## Architecture

### Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.1.1 | React framework with App Router, static export |
| TypeScript | ^5 | Type-safe development |
| React | 19.2.1 | UI framework |
| Wanakana.js | 5.0.2 | Hiragana/Katakana conversion |
| Convex | 1.31.4 | Backend-as-a-service for data and auth |
| @convex-dev/auth | 0.0.90 | Authentication (Password + Anonymous) |
| ElevenLabs API | - | High-quality Japanese TTS (390+ audio files) |
| GitHub Pages | - | Static file hosting for frontend |

### Deployment Architecture

**Frontend + Backend Separation**

This application uses a **decoupled architecture**:

- **Frontend (GitHub Pages)**: Next.js static export (`out/` directory) served as HTML/CSS/JS files
- **Backend (Convex Cloud)**: Serverless backend hosted separately at `*.convex.cloud`
- **Communication**: Frontend makes HTTPS API calls to Convex backend
- **No Traditional Server**: No Node.js server, no PostgreSQL, no server-side rendering at runtime

```
┌──────────────────────────────┐
│   GitHub Pages (Frontend)   │
│   Static Files Only          │
│   - HTML, CSS, JS            │
│   - Audio files (390+)       │
│   - Images, fonts            │
└────────────┬─────────────────┘
             │
             │ API Calls (HTTPS)
             │
┌────────────▼─────────────────┐
│   Convex Cloud (Backend)    │
│   Serverless Functions       │
│   - Database (users, data)   │
│   - Authentication           │
│   - Real-time subscriptions  │
└──────────────────────────────┘
```

**How Convex Works with GitHub Pages:**

1. **Build Time**: `npx convex deploy --cmd 'npm run build'` sets `NEXT_PUBLIC_CONVEX_URL` and builds static files
2. **Deployment**: Static files pushed to GitHub Pages, Convex backend deployed to Convex cloud
3. **Runtime**: Browser loads static HTML/CSS/JS from GitHub Pages, then makes API calls to Convex backend
4. **Data Flow**: All user data, progress, and authentication handled by Convex backend via API

### Build Configuration

- **Static Export**: `output: 'export'` in `next.config.js` for GitHub Pages compatibility
- **TypeScript**: Strict mode enabled with comprehensive type checking
- **Environment Variables**: `NEXT_PUBLIC_CONVEX_URL` set at build time for backend communication
- **Deployment**: Combined deployment via `npm run deploy` (deploys both frontend and backend)

### Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Dashboard with module cards
│   ├── alphabet/          # Hiragana/Katakana practice
│   ├── vocabulary/        # Vocabulary flashcards
│   ├── kanji/             # Kanji recognition
│   ├── grammar/           # Grammar patterns & exercises
│   ├── reading/           # Reading comprehension
│   └── listening/         # Audio comprehension
├── components/            # React components
│   ├── common/           # Shared UI (CharacterCard, MultipleChoice, Timer, etc.)
│   └── [module]/         # Module-specific components
├── hooks/                 # Custom React hooks
│   ├── useTTS.ts         # Audio playback (ElevenLabs + Web Speech)
│   ├── useMobile.ts      # Mobile device detection
│   ├── useTimer.ts       # Countdown timer
│   ├── useProgress.ts    # Progress tracking
│   ├── useSRS.ts         # Spaced repetition
│   └── useStorage.ts     # LocalStorage utilities
├── contexts/              # React Context providers
│   ├── ProgressContext.tsx
│   ├── SettingsContext.tsx
│   └── LanguageContext.tsx
├── types/                 # TypeScript interfaces
├── data/                  # JSON data files
├── lib/                   # Utilities
└── styles/
    └── globals.css        # Design system CSS
```

---

## Features

### 1. Learning Modules

#### Alphabet (Hiragana & Katakana)
- **Practice Mode**: Timed character recognition (5 seconds per character)
- **Filters**: Gojūon (46), Yōon (21), Dakuten (25), Handakuten (5)
- **Input Methods**:
  - Desktop: Text input with real-time validation
  - Mobile: 4-option multiple choice
- **Audio**: Native pronunciation for each character

#### Vocabulary
- **Database**: 86+ words with JLPT levels (N5-N1)
- **Multi-language**: 12 language translations
- **Flashcards**: Interactive study mode
- **Audio**: Native speaker pronunciation

#### Kanji
- **Database**: 162+ characters with readings and examples
- **Readings**: On'yomi and kun'yomi
- **Examples**: Real-world usage with audio
- **Recognition**: Character-to-meaning matching

#### Grammar
- **Patterns**: Essential Japanese grammar structures
- **Examples**: Contextualized sentences with audio
- **Exercises**: Interactive practice
- **Translations**: Multi-language explanations

#### Reading
- **Passages**: Graded reading materials
- **Comprehension**: Multiple-choice questions
- **Vocabulary**: In-context word learning
- **Audio**: Full passage narration

#### Listening
- **Exercises**: Audio comprehension tasks
- **Transcripts**: Japanese text with furigana
- **Questions**: Comprehension assessment
- **Replay**: Unlimited audio playback

### 2. Progress Tracking

#### Statistics
- **Per Module**: Correct/total answers, mastery percentage
- **Global Stats**:
  - Day streak (consecutive study days)
  - Total study time (minutes)
  - Words learned count
  - Kanji mastered count

#### Spaced Repetition System (SRS)
- **Algorithm**: Custom SRS implementation in `useSRS.ts`
- **Review Scheduling**: Items reviewed at optimal intervals
- **Difficulty Tracking**: Adjusts based on performance
- **Data Storage**: Convex backend with localStorage fallback

### 3. Audio System

#### Two-Tier TTS Architecture

**Primary: ElevenLabs Pre-generated Audio**
- 390+ MP3 files covering all content
- Voice: `GR4dBIFsYe57TxyrHKXz` (Japanese native)
- Model: `eleven_v3` (Multilingual v3)
- Quality: Professional, consistent pronunciation
- Organization:
  - `public/audio/characters/` (104 files)
  - `public/audio/vocabulary/` (86 files)
  - `public/audio/kanji/` (162 files)
  - `public/audio/grammar/` (28 files)
  - `public/audio/reading/` (5 files)
  - `public/audio/listening/` (5 files)

**Fallback: Web Speech API**
- Browser-native synthesis
- Language: `ja-JP`
- Activated when audio file missing or fails to load
- Configurable volume, rate, pitch

**Implementation**: `src/hooks/useTTS.ts`
```typescript
const { speak } = useTTS();
speak(text, { audioUrl: data.audioUrl });
```

### 4. Mobile Support

#### Detection (`useMobile.ts`)
Multi-factor detection requiring 2 of 3 criteria:
1. User agent matches mobile regex
2. Touch capability detected (`ontouchstart`, `maxTouchPoints`)
3. Screen width < 768px

#### Responsive Breakpoints Strategy

**Mobile-First Approach** with 4 primary breakpoints:

1. **Ultra-Small Phones** (`max-width: 375px`)
   - iPhone SE, older Android devices (320px-375px)
   - Base font: 15px
   - Reduced padding/spacing
   - Full-width layouts
   - Dropdown menus span viewport width

2. **Small Phones** (`max-width: 480px`)
   - Most modern phones (376px-480px)
   - Touch targets: minimum 44px height
   - Grid: Single column for modules, 2 columns for stats
   - Font scaling: h1 → 1.75rem, h2 → 1.5rem
   - Button padding optimized for touch

3. **Medium Phones & Small Tablets** (`481px-640px`)
   - Standard mobile layout
   - Grid: Single column modules, flexible stats
   - Standard mobile padding
   - Optimized button sizes

4. **Tablets & Desktop** (`> 640px`)
   - Full desktop layout
   - Multi-column grids
   - Hover effects enabled
   - Maximum content widths

#### Mobile UI Adaptations

**Touch Targets**:
- All interactive elements: **minimum 44px × 44px**
- Buttons small: 44px height with 0.625rem padding
- Buttons medium: 48px height
- Buttons large: 56px height (reduced to 48px on small phones)
- Multiple choice options: 55px height minimum

**Typography**:
- Ultra-small phones: Base font 15px
- Small phones: h1 max 1.75rem, h2 max 1.5rem
- Prevent text overflow: `word-wrap: break-word`, `overflow-wrap: break-word`
- Line height optimized for readability

**Layout**:
- Grid minimum widths reduced: 260px (modules), 140px (stats)
- Single-column layouts on phones
- Reduced gaps and padding on small screens
- Dialog: Full-width minus margins on mobile (calc(100% - 1.5rem) on ultra-small)

**Input**:
- Multiple choice (4 options grid) replaces text input on touch devices
- Large touch-friendly buttons in 2×2 grid
- Proper spacing to prevent accidental taps (0.75rem gap)

**Viewport Configuration**:
```typescript
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,  // Allow zoom for accessibility
}
```

**Special Cases**:
- Landscape phones (`max-height: 500px`): Reduced vertical spacing
- Language switcher on ultra-small: Full-width dropdown
- Login dialog: Responsive padding and border-radius

### 5. Internationalization (i18n)

#### Supported Languages (12 total)
1. English (en) - Default
2. Spanish (es)
3. Chinese Simplified (zh-CN)
4. Portuguese (pt)
5. French (fr)
6. German (de)
7. Russian (ru)
8. Japanese (ja)
9. Korean (ko)
10. Italian (it)
11. Arabic (ar)
12. Hindi (hi)

#### Implementation
- **Translation Files**: `locales/*.json` with nested structure
- **Context**: `LanguageContext.tsx` for app-wide access
- **Browser Detection**: Auto-detect via `navigator.language`
- **Persistence**: Saved in localStorage
- **Validation**: `npm run check-i18n` ensures completeness

### 6. Authentication & Data

#### Convex Backend

**Schema** (`convex/schema.js`):
- **users**: Authentication data
- **authAccounts**: OAuth providers
- **sessions**: Session management
- **userData**: Comprehensive progress tracking
  - Per-module stats (alphabet, vocabulary, kanji, etc.)
  - Global stats (streak, study time)
  - SRS scheduling data
- **userSettings**: User preferences
  - Theme, audio, TTS provider
  - Timer settings, language

**Authentication**:
- **Providers**: Password, Anonymous
- **Library**: `@convex-dev/auth`
- **Fallback**: LocalStorage when offline

---

## Design System

### Philosophy

The design embodies **elegant Japanese minimalism** with a modern dark theme. Inspired by traditional Japanese aesthetics—清寂 (seijaku, tranquility) and 間 (ma, negative space)—the interface balances bold character display with restrained UI elements.

### Color Palette

#### Foundation (Dark Theme)
```css
--bg-primary: #0f0f1a;        /* Deep indigo-black, main background */
--bg-secondary: #1a1a2e;      /* Slightly lighter, secondary surfaces */
--bg-card: #16162a;           /* Card/elevated surface background */
--bg-glass: rgba(22,22,42,0.7); /* Glassmorphism effect */
```

#### Typography
```css
--text-primary: #f5f0e8;      /* Warm off-white, main text */
--text-secondary: #a8a4b8;    /* Muted lavender-gray, labels */
--text-muted: #6b6880;        /* Darker gray, hints */
```

#### Accents (Inspired by traditional Japanese colors)
```css
--accent-red: #c41e3a;        /* 緋色 (hiiro) - Deep crimson */
--accent-gold: #d4a574;       /* 砂色 (sunairo) - Warm sand/gold */
--success: #4a9d7c;           /* 青竹色 (aotakeiro) - Green bamboo */
```

#### Effects
```css
--accent-red-glow: rgba(196,30,58,0.3);
--accent-gold-dim: rgba(212,165,116,0.15);
--success-glow: rgba(74,157,124,0.3);
--border-subtle: rgba(255,255,255,0.06);
--shadow-deep: 0 25px 50px -12px rgba(0,0,0,0.5);
```

### Typography

#### Font Families
**Primary**: `'Zen Kaku Gothic New'`
- Modern Japanese-inspired sans-serif
- Weights: 400 (regular), 500 (medium), 700 (bold)
- Excellent kanji/kana rendering
- Used for: UI elements, body text, inputs

**Secondary**: `'Crimson Pro'`
- Elegant serif for contrast
- Weights: 400, 500
- Used for: Subtitles, decorative text

#### Font Sizing Philosophy
Hierarchical scale emphasizing **character prominence**:

| Element | Size | Purpose |
|---------|------|---------|
| Character Display | `clamp(8rem, 30vw, 14rem)` | Massive, unmissable |
| Landing Title | `clamp(3rem, 8vw, 6rem)` | Hero emphasis |
| Dashboard Title | `clamp(2.5rem, 6vw, 4rem)` | Section headers |
| Input Text | `2.5rem` | Large, readable input |
| Module Icons | `4rem` | Visual hierarchy |
| Stat Values | `2rem` | Numeric emphasis |
| Body Text | `1rem` (16px) | Comfortable reading |
| Labels | `0.75rem - 0.9rem` | Subtle, uppercase |

### Atmospheric Background

**Dual Gradient Overlay** (`body::before`):
```css
radial-gradient(ellipse 80% 50% at 50% -20%,
  rgba(196,30,58,0.08), transparent),  /* Red from top */
radial-gradient(ellipse 60% 40% at 80% 100%,
  rgba(212,165,116,0.05), transparent)  /* Gold from bottom-right */
```

Creates **depth and atmosphere** without distraction—like soft ambient lighting in a traditional Japanese room.

### Animation Language

#### Entry Animations (Staggered Choreography)

**fadeInUp** - Content rises gracefully:
```css
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
/* Duration: 0.6s ease-out */
/* Stagger delays: 0.1s, 0.2s for layered effect */
```

**fadeInDown** - Headers descend:
```css
@keyframes fadeInDown {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}
```

**fadeInScale** - Elements bloom:
```css
@keyframes fadeInScale {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
```

**characterEnter** - Character-specific with bounce:
```css
@keyframes characterEnter {
  from { opacity: 0; transform: scale(0.8) rotate(-5deg); }
  to { opacity: 1; transform: scale(1) rotate(0deg); }
}
/* Easing: cubic-bezier(0.34, 1.56, 0.64, 1) - playful bounce */
```

#### Continuous Motion

**float** - Gentle floating (background kanji):
```css
@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0); }
  50% { transform: translateY(-15px) rotate(1deg); }
}
/* Duration: 6s, infinite loop */
```

#### Feedback Animations

**shake** - Error indication:
```css
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-8px); }
  40%, 80% { transform: translateX(8px); }
}
/* Duration: 0.5s ease-out */
```

**pulseSuccess** - Correct answer celebration:
```css
@keyframes pulseSuccess {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
```

### Component Design Language

#### Character Display Card

**Visual Hierarchy**:
- Square aspect ratio (`aspect-ratio: 1`)
- Responsive width: `min(90vw, 400px)`
- Centered character: `clamp(8rem, 30vw, 14rem)`
- Subtle gradient border (visible on hover)
- Deep shadow for elevation
- Timer ring in top-right corner

**Special Effects**:
```css
/* Gradient border overlay (CSS mask technique) */
.character-card::before {
  background: linear-gradient(135deg,
    rgba(212,165,116,0.2),  /* Gold start */
    transparent,
    rgba(196,30,58,0.2));   /* Red end */
  /* Applied as border via mask-composite */
}
```

#### Input Fields

**States**:
| State | Border | Background | Effects |
|-------|--------|------------|---------|
| Default | `--border-subtle` | `--bg-card` | - |
| Focus | `--accent-gold` | `--bg-card` | 4px gold glow ring |
| Error | `--accent-red` | Red tint (10%) | Shake animation |
| Success | `--success` | `--bg-card` | 4px green glow ring |

**Typography**:
- Font size: `2.5rem` (large, readable)
- Caret color: Gold accent
- Placeholder: Muted gray

#### Multiple Choice Buttons

**Grid Layout**:
```css
display: grid;
grid-template-columns: repeat(2, 1fr);
gap: 1rem;
```

**Button States**:
- **Default**: Card background, subtle border
- **Hover**: Gold border + glow (desktop only)
- **Active**: `scale(0.98)` for tactile feedback
- **Correct**: Green border + green background tint
- **Disabled**: 50% opacity, no pointer events

**Touch Optimization**:
- Minimum height: 60px
- Large padding: `1.25rem 1.5rem`
- Flex centering for text

#### Circular Timer Ring

**SVG-based progress indicator**:
- Radius: 22px (circumference: ~138.23)
- Stroke width: 3px
- Colors: Gold (normal), Red (≤2 seconds warning)
- Animation: `stroke-dashoffset` transition (1s linear)
- Position: Absolute, top-right of character card

**Centered text overlay** showing countdown number.

#### Filter Chips

**Pill-shaped toggles**:
```css
border-radius: 4px;
padding: 0.5rem 1.25rem;
font-size: 0.85rem;
```

**States**:
- Unchecked: Card background, subtle border
- Hover: Gold border tint
- Checked: Gold background tint, gold border, gold text

#### Module Cards (Dashboard)

**Layout**:
```css
display: grid;
grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
gap: 2rem;
```

**Card Structure**:
1. **Icon**: 4rem font-size, centered (emoji or kanji)
2. **Title**: 1.5rem, bold
3. **Description**: 0.9rem, secondary color
4. **Progress Bar**: Linear gradient (red → gold)

**Hover Effects**:
- Lift: `translateY(-8px)`
- Deep shadow appears
- Gold border accent
- Gradient border overlay fades in

**Gradient Border Technique**:
Same CSS mask approach as character card—creates elegant highlighted border without affecting layout.

### Responsive Breakpoints

#### Mobile (≤ 640px)
- Container padding: `2rem → 1rem`
- Character card: `90vw → 85vw`
- Stats grid: `auto-fit → 2 columns`
- Modules grid: `auto-fit → 1 column`
- Font sizes: Reduced 10-20%
- Multiple choice: Full-width grid

### Accessibility

#### Focus Management
```css
:focus-visible {
  outline: 2px solid var(--accent-gold);
  outline-offset: 2px;
}
```

#### Selection Styling
```css
::selection {
  background: var(--accent-red);
  color: var(--text-primary);
}
```

#### Touch Targets
- Minimum 44px × 44px on mobile
- Generous padding on interactive elements
- Clear hover/active states

#### Keyboard Navigation
- Full keyboard support
- Visible focus indicators
- Logical tab order

---

## Data Model

### Character
```typescript
interface Character {
  romaji: string;
  hiragana: string;
  type: 'gojuon' | 'yoon' | 'dakuten' | 'handakuten';
  audioUrl?: string;
}
```

### Vocabulary
```typescript
interface VocabularyItem {
  id: string;
  word: string;
  reading: string;
  meanings: { [lang: string]: string[] };
  audioUrl?: string;
  level?: 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
}
```

### Kanji
```typescript
interface KanjiItem {
  id: string;
  kanji: string;
  meanings: { [lang: string]: string[] };
  onyomi: string[];
  kunyomi: string[];
  examples: Array<{
    word: string;
    reading: string;
    meanings: { [lang: string]: string[] };
    audioUrl?: string;
  }>;
  audioUrl?: string;
  level?: 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
}
```

### Progress Tracking
```typescript
interface ModuleStats {
  correct: number;
  total: number;
  streak: number;
  mastered: string[];  // IDs of mastered items
  lastReviewed: Date;
}
```

---

## User Flow

### First Visit
1. Land on dashboard (anonymous auth)
2. View module cards with 0% progress
3. Click "Alphabet" to start learning
4. Prompted to select filters (Gojūon, etc.)
5. Begin practice session

### Practice Session
1. Character appears with animation
2. Timer starts (5-second countdown)
3. User types romaji (desktop) or selects option (mobile)
4. On correct:
   - Success animation + audio pronunciation
   - Stats update (+1 correct, +1 total, +1 streak)
   - New character appears (300ms delay)
5. On incorrect:
   - Error animation (shake)
   - Correct answer shown (2s timeout)
   - Streak resets to 0
6. Repeat

### Progress Persistence
- Convex backend saves every action
- LocalStorage backup if offline
- Dashboard updates with new percentages
- Streak tracking across days

---

## Performance Optimizations

### Next.js Static Export
- Pre-rendered HTML at build time
- No server-side rendering overhead
- Instant page loads

### Audio Preloading
```typescript
useTTS({ preload: true })  // Loads audio in background
```

### Image Optimization
- Unoptimized images (static export requirement)
- SVG icons for scalability
- CSS-only effects (no image backgrounds)

### Code Splitting
- Automatic route-based splitting
- Dynamic imports for heavy components
- Lazy loading audio files

---

## Deployment

### Build Process
```bash
npm run build
# Outputs to: out/
```

### GitHub Pages
- Custom domain: `murmura.renner.dev`
- CNAME file in public/
- Deployed from `out/` directory
- Automated via GitHub Actions

### Convex Backend
```bash
npm run deploy
# Deploys Convex functions + Next.js build
```

### Environment Requirements
- Node.js 20+
- npm 9+
- ElevenLabs API key (for audio generation only)
- Convex account (for backend)

---

## Browser Support

| Browser | Version | Support |
|---------|---------|---------|
| Chrome | 90+ | Full |
| Firefox | 88+ | Full |
| Safari | 14+ | Full |
| Edge | 90+ | Full |
| Mobile Safari | 14+ | Full (with mobile UI) |
| Chrome Android | 90+ | Full (with mobile UI) |

### Required Features
- ES6+ JavaScript
- CSS Grid & Flexbox
- CSS Custom Properties
- Web Speech API (for TTS fallback)
- LocalStorage

---

## Future Enhancements

### Planned Features
- **Kanji Stroke Order**: Animated stroke order diagrams
- **Writing Practice**: Canvas-based handwriting recognition
- **Voice Input**: Speech-to-text for pronunciation practice
- **Gamification**: Achievements, badges, leaderboards
- **Social Features**: Study groups, progress sharing
- **Offline Mode**: Progressive Web App (PWA)
- **Advanced SRS**: Customizable review algorithms
- **More Content**: JLPT N2/N1 vocabulary and kanji

### Technical Improvements
- **Performance**: Virtualized lists for large datasets
- **Accessibility**: ARIA labels, screen reader optimization
- **Analytics**: Usage tracking, error monitoring
- **Testing**: Unit tests, E2E tests with Playwright
- **CI/CD**: Automated testing, visual regression

---

---

## Supported Proficiency Levels

**IMPORTANT: Full proficiency range support from beginner to mastery.**

The application supports complete proficiency level ranges for all languages - from absolute beginner to near-native fluency. Content should be created for ALL levels, not just beginner levels.

### Level Frameworks by Language

| Language | Framework | Levels | Range |
|----------|-----------|--------|-------|
| Japanese | JLPT | N5 → N4 → N3 → N2 → N1 | Beginner → Proficiency |
| Korean | TOPIK | TOPIK1 → TOPIK2 → TOPIK3 → TOPIK4 → TOPIK5 → TOPIK6 | Beginner → Proficiency |
| Chinese | HSK | HSK1 → HSK2 → HSK3 → HSK4 → HSK5 → HSK6 | Beginner → Proficiency |
| Spanish | CEFR | A1 → A2 → B1 → B2 → C1 → C2 | Beginner → Proficiency |
| German | CEFR | A1 → A2 → B1 → B2 → C1 → C2 | Beginner → Proficiency |
| Italian | CEFR | A1 → A2 → B1 → B2 → C1 → C2 | Beginner → Proficiency |
| English | CEFR | A1 → A2 → B1 → B2 → C1 → C2 | Beginner → Proficiency |

### Level Descriptions

**CEFR (Common European Framework)**
- **A1** - Beginner: Basic phrases, simple interactions
- **A2** - Elementary: Routine tasks, simple descriptions
- **B1** - Intermediate: Main points, travel situations, personal topics
- **B2** - Upper-Intermediate: Complex texts, fluent interaction
- **C1** - Advanced: Demanding texts, implicit meaning, flexible language use
- **C2** - Proficiency: Near-native, nuanced expression, complex academic/professional contexts

**JLPT (Japanese Language Proficiency Test)**
- **N5** - Beginner: Hiragana, katakana, basic kanji (~100), basic grammar
- **N4** - Elementary: ~300 kanji, basic conversations
- **N3** - Intermediate: ~650 kanji, everyday situations
- **N2** - Upper-Intermediate: ~1000 kanji, newspapers, complex texts
- **N1** - Advanced: ~2000 kanji, nuanced Japanese, academic/business contexts

**HSK (Hanyu Shuiping Kaoshi)**
- **HSK1-2** - Beginner: Basic vocabulary and grammar
- **HSK3-4** - Intermediate: Daily communication, travel
- **HSK5-6** - Advanced: News, academic texts, professional contexts

**TOPIK (Test of Proficiency in Korean)**
- **TOPIK I (1-2)** - Beginner to Elementary
- **TOPIK II (3-6)** - Intermediate to Advanced/Proficiency

### Content Requirements

All module data (vocabulary, grammar, reading, listening) MUST include content across the full level range:

```json
// Example vocabulary item with level
{
  "id": "es-vocab-42",
  "word": "imprescindible",
  "meaning": "essential, indispensable",
  "level": "C1"  // Must cover A1 through C2
}
```

---

## Multi-Language Theme System

### Design Philosophy

**Each language has its own distinct visual identity** that creates an immersive, culturally-authentic learning experience. When a user selects a target language, the entire app transforms to reflect that language's cultural aesthetics.

**Key Principles:**
1. **Cultural Authenticity** - Colors, typography, and visual elements inspired by the target culture
2. **Immersive Learning** - Help learners feel connected to the language they're studying
3. **Consistent UX** - Same interaction patterns, different visual treatment
4. **Accessibility First** - All themes maintain WCAG 2.1 AA contrast ratios

---

### Japanese (日本語) - "Zen Garden" Theme

**Current Implementation** - The default theme.

**Color Palette:**
```css
--bg-primary: #0f0f1a;        /* Deep indigo-black (yoru - night) */
--bg-secondary: #1a1a2e;      /* Dark blue-purple */
--bg-card: #16162a;           /* Card background */
--text-primary: #f5f0e8;      /* Warm off-white (washi paper) */
--text-secondary: #a0a0b0;    /* Muted gray */
--accent-primary: #c41e3a;    /* Traditional vermillion (aka) */
--accent-secondary: #d4a574;  /* Warm gold (kin) */
--accent-tertiary: #2d5a4a;   /* Deep forest green (matcha) */
--success: #4a9d7c;           /* Jade green */
--error: #c41e3a;             /* Vermillion red */
```

**Typography:**
- Primary: `'Zen Kaku Gothic New'` - Japanese-style sans-serif
- Secondary: `'Crimson Pro'` - Elegant serif for subtitles

**Visual Elements:**
- Background decoration: Floating kanji "学" (manabu - to learn)
- Subtle paper texture overlays
- Soft shadows, rounded corners
- Animations: Gentle floating, graceful transitions

**Cultural Inspiration:**
- Traditional Japanese aesthetics (wabi-sabi)
- Calligraphy and brush strokes
- Temple architecture colors
- Night garden atmosphere

---

### Spanish (Español) - "Sol y Sombra" Theme

**Theme Concept:** Warm Mediterranean energy meets passionate Spanish culture.

**Color Palette:**
```css
--bg-primary: #1a0f0a;        /* Deep warm brown (tierra) */
--bg-secondary: #2a1810;      /* Dark terracotta */
--bg-card: #251512;           /* Card background */
--text-primary: #fff8e7;      /* Warm cream (crema) */
--text-secondary: #c4a882;    /* Sandy beige */
--accent-primary: #e63946;    /* Vibrant red (rojo) */
--accent-secondary: #f4a261;  /* Warm orange (naranja) */
--accent-tertiary: #e9c46a;   /* Golden yellow (amarillo) */
--success: #2a9d8f;           /* Teal green */
--error: #e63946;             /* Spanish red */
```

**Typography:**
- Primary: `'Playfair Display'` - Elegant serif with Spanish flair
- Secondary: `'Source Sans Pro'` - Clean, readable sans-serif

**Visual Elements:**
- Background decoration: "Ñ" or stylized sun motif
- Decorative tile patterns (azulejo-inspired borders)
- Warm, earthy shadows
- Animations: Energetic but smooth, flamenco-inspired rhythms

**Cultural Inspiration:**
- Spanish tiles and Moorish architecture
- Warm Mediterranean sunlight
- Flamenco passion and energy
- Terracotta and whitewashed walls

---

### German (Deutsch) - "Schwarzwald" Theme

**Theme Concept:** Bauhaus precision meets Black Forest mystique.

**Color Palette:**
```css
--bg-primary: #0d1117;        /* Deep forest black */
--bg-secondary: #161b22;      /* Dark pine */
--bg-card: #1c2128;           /* Card background */
--text-primary: #e6edf3;      /* Cool white (schnee) */
--text-secondary: #8b949e;    /* Stone gray */
--accent-primary: #d4af37;    /* Prussian gold */
--accent-secondary: #4a7c59;  /* Forest green (wald) */
--accent-tertiary: #8b0000;   /* Deep burgundy */
--success: #3fb950;           /* Bright green */
--error: #f85149;             /* Alert red */
```

**Typography:**
- Primary: `'Fira Sans'` - German-designed, precise sans-serif
- Secondary: `'Merriweather'` - Sturdy serif for headings

**Visual Elements:**
- Background decoration: "ß" or geometric Bauhaus pattern
- Clean lines and precise spacing
- Minimal but purposeful decoration
- Animations: Precise, mechanical, efficient

**Cultural Inspiration:**
- Bauhaus design principles
- German engineering precision
- Black Forest mystique
- Gothic architecture elements

---

### English - "Oxford Library" Theme

**Theme Concept:** Classic British scholarly elegance.

**Color Palette:**
```css
--bg-primary: #1a1a2e;        /* Deep navy blue */
--bg-secondary: #232342;      /* Royal blue-gray */
--bg-card: #2a2a4a;           /* Card background */
--text-primary: #f0ead6;      /* Parchment cream */
--text-secondary: #9a9ab8;    /* Lavender gray */
--accent-primary: #c9a227;    /* Royal gold */
--accent-secondary: #b8860b;  /* Dark goldenrod */
--accent-tertiary: #4169e1;   /* Royal blue */
--success: #228b22;           /* Forest green */
--error: #dc143c;             /* Crimson */
```

**Typography:**
- Primary: `'Libre Baskerville'` - Classic English serif
- Secondary: `'Open Sans'` - Modern, readable sans-serif

**Visual Elements:**
- Background decoration: Crown motif or "Æ" letter
- Subtle book spine patterns
- Leather texture hints
- Animations: Page turn effects, scholarly pace

**Cultural Inspiration:**
- Oxford/Cambridge libraries
- Victorian book design
- British royal colors
- Classic English literature

---

### Italian (Italiano) - "Rinascimento" Theme

**Theme Concept:** Renaissance elegance meets Tuscan warmth.

**Color Palette:**
```css
--bg-primary: #1a1410;        /* Deep umber */
--bg-secondary: #2a2018;      /* Tuscan brown */
--bg-card: #352a20;           /* Card background */
--text-primary: #faf3e0;      /* Marble white (marmo) */
--text-secondary: #c4b59d;    /* Travertine */
--accent-primary: #c41e3a;    /* Ferrari red (rosso) */
--accent-secondary: #d4a574;  /* Tuscan gold */
--accent-tertiary: #2e5339;   /* Cypress green (cipresso) */
--success: #3d8b40;           /* Italian green */
--error: #c41e3a;             /* Italian red */
```

**Typography:**
- Primary: `'Cormorant Garamond'` - Renaissance-inspired serif
- Secondary: `'Lato'` - Clean, Italian modernism

**Visual Elements:**
- Background decoration: Renaissance flourish or architectural column
- Subtle marble texture overlays
- Renaissance frame borders
- Animations: Graceful, artistic, operatic

**Cultural Inspiration:**
- Renaissance art and architecture
- Florentine elegance
- Tuscan countryside
- Italian fashion and design

---

### Korean (한국어) - "Hanok" Theme

**Theme Concept:** Traditional Korean elegance meets modern K-culture energy.

**Color Palette:**
```css
--bg-primary: #0f1419;        /* Deep charcoal (숯) */
--bg-secondary: #1a2027;      /* Dark slate */
--bg-card: #1e262f;           /* Card background */
--text-primary: #ffffff;      /* Pure white (백) */
--text-secondary: #8899a6;    /* Celadon gray */
--accent-primary: #e91e63;    /* Vibrant pink (분홍) - K-pop */
--accent-secondary: #00bcd4;  /* Cyan blue (청록) */
--accent-tertiary: #9c27b0;   /* Purple (보라) */
--success: #4caf50;           /* Fresh green */
--error: #f44336;             /* Bright red */
```

**Typography:**
- Primary: `'Noto Sans KR'` - Modern Korean sans-serif
- Secondary: `'Nanum Gothic'` - Traditional Korean web font

**Visual Elements:**
- Background decoration: "한" (han) or taegeuk motif
- Hanbok pattern overlays
- K-pop inspired gradients
- Animations: Dynamic K-pop energy meets traditional grace

**Cultural Inspiration:**
- Traditional hanok architecture
- Modern K-pop aesthetics
- Celadon pottery colors
- K-drama visual style

---

### Chinese (中文) - "Silk Road" Theme

**Theme Concept:** Imperial Chinese luxury meets ancient wisdom.

**Color Palette:**
```css
--bg-primary: #1a0a0a;        /* Deep lacquer red-black */
--bg-secondary: #2a1515;      /* Dark cinnabar */
--bg-card: #251818;           /* Card background */
--text-primary: #fff5e6;      /* Silk white (丝白) */
--text-secondary: #c9a86c;    /* Antique gold */
--accent-primary: #c41e3a;    /* Imperial red (朱红) */
--accent-secondary: #ffd700;  /* Imperial gold (金) */
--accent-tertiary: #006400;   /* Jade green (玉绿) */
--success: #228b22;           /* Prosperity green */
--error: #dc143c;             /* Lucky red */
```

**Typography:**
- Primary: `'Noto Sans SC'` - Clean simplified Chinese
- Secondary: `'ZCOOL XiaoWei'` - Elegant Chinese display font

**Visual Elements:**
- Background decoration: "学" (xué - study) or cloud pattern (祥云)
- Subtle silk wave patterns
- Chinese cloud motifs
- Animations: Flowing like silk, tai chi inspired

**Cultural Inspiration:**
- Imperial Chinese aesthetics
- Silk Road luxury
- Chinese calligraphy
- Forbidden City architecture

---

### Theme Implementation

#### CSS Variables Structure

Each theme overrides CSS custom properties on the root element:

```css
[data-theme="japanese"] {
  --bg-primary: #0f0f1a;
  --accent-primary: #c41e3a;
  --font-primary: 'Zen Kaku Gothic New', sans-serif;
  --bg-decoration: "学";
  /* ... all theme variables */
}

[data-theme="spanish"] {
  --bg-primary: #1a0f0a;
  --accent-primary: #e63946;
  --font-primary: 'Playfair Display', serif;
  --bg-decoration: "Ñ";
  /* ... all theme variables */
}
```

#### Theme Provider Integration

The theme automatically switches when the target language changes:

```typescript
// In useTargetLanguage hook
useEffect(() => {
  document.documentElement.setAttribute('data-theme', targetLanguage);
}, [targetLanguage]);
```

#### Background Decoration Component

The floating background character changes per language:

```typescript
const BACKGROUND_DECORATIONS = {
  ja: '学',  // "learn" in Japanese
  es: 'Ñ',   // Distinctive Spanish letter
  de: 'ß',   // Distinctive German letter
  en: 'A',   // Classic English
  it: '&',   // Italian ampersand flourish
  ko: '한',  // "han" in Korean
  zh: '学',  // "learn" in Chinese
};
```

#### Font Loading Strategy

Load language-specific fonts on demand:

```typescript
const THEME_FONTS = {
  ja: ['Zen Kaku Gothic New', 'Crimson Pro'],
  es: ['Playfair Display', 'Source Sans Pro'],
  de: ['Fira Sans', 'Merriweather'],
  en: ['Libre Baskerville', 'Open Sans'],
  it: ['Cormorant Garamond', 'Lato'],
  ko: ['Noto Sans KR', 'Nanum Gothic'],
  zh: ['Noto Sans SC', 'ZCOOL XiaoWei'],
};
```

#### Transition Effects

Smooth 300ms transition when switching themes:

```css
:root {
  transition: background-color 0.3s ease,
              color 0.3s ease;
}
```

---

### Theme File Structure

```
src/
├── styles/
│   ├── themes/
│   │   ├── japanese.css    /* Zen Garden */
│   │   ├── spanish.css     /* Sol y Sombra */
│   │   ├── german.css      /* Schwarzwald */
│   │   ├── english.css     /* Oxford Library */
│   │   ├── italian.css     /* Rinascimento */
│   │   ├── korean.css      /* Hanok */
│   │   └── chinese.css     /* Silk Road */
│   └── globals.css         /* Base styles + theme switching */
├── context/
│   └── ThemeProvider.tsx   /* Theme context */
└── hooks/
    └── useTheme.ts         /* Theme utilities */
```

---

### Accessibility Requirements

All themes MUST maintain:

- **WCAG 2.1 AA compliance** for color contrast
- **Minimum 4.5:1** contrast ratio for normal text
- **Minimum 3:1** contrast ratio for large text and UI components
- **Focus indicators** visible in all themes
- **Reduced motion** option respected

---

### Testing Checklist Per Theme

- [ ] All text readable at minimum contrast ratios
- [ ] Buttons and interactive elements clearly visible
- [ ] Success/error states distinguishable
- [ ] Theme persists across page navigation
- [ ] Smooth transition when switching languages
- [ ] Background decoration renders correctly
- [ ] Fonts load without FOUT (flash of unstyled text)
- [ ] Mobile responsive at all breakpoints
- [ ] Dark mode consistency maintained

---

## License & Credits

**Project**: Open source (specify license)
**Fonts**: Google Fonts (Zen Kaku Gothic New, Crimson Pro)
**TTS**: ElevenLabs API
**Backend**: Convex
**Hosting**: GitHub Pages
**Domain**: murmura.renner.dev
