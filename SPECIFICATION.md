# Japanese Trainer - Technical Specification

## Overview

Japanese Trainer is a modern, full-featured web application for learning Japanese. Built with Next.js and TypeScript, it provides an elegant, distraction-free learning experience with comprehensive progress tracking, audio pronunciation, and multi-language support.

**URL**: https://japanese.renner.dev
**Repository**: https://github.com/rennerdo30/japanese-trainer

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
- Custom domain: `japanese.renner.dev`
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

## License & Credits

**Project**: Open source (specify license)
**Fonts**: Google Fonts (Zen Kaku Gothic New, Crimson Pro)
**TTS**: ElevenLabs API
**Backend**: Convex
**Hosting**: GitHub Pages
**Domain**: japanese.renner.dev
