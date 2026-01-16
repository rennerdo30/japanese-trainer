# CLAUDE.md

This file provides guidance for AI assistants working on the Murmura codebase.

**Murmura** - *From whispers to fluency* - A multi-language learning platform.

## ⚠️ CRITICAL: Follow SPECIFICATION.md

**Always refer to `SPECIFICATION.md` for detailed technical and design specifications.**

Key sections to follow:
- **Multi-Language Theme System** - Each language MUST have its own distinct visual theme
- **Design System** - Color palettes, typography, animations
- **Mobile Responsiveness** - Touch targets, breakpoints, responsive patterns

### Language-Specific Themes (REQUIRED)

When implementing features or making UI changes, ensure each language has its own culturally-inspired design:

| Language | Theme Name | Key Colors | Background Decoration |
|----------|------------|------------|----------------------|
| Japanese | "Zen Garden" | Vermillion + Gold | 学 (kanji) |
| Spanish | "Sol y Sombra" | Red + Orange + Yellow | Ñ |
| German | "Schwarzwald" | Prussian Gold + Forest Green | ß |
| English | "Oxford Library" | Royal Gold + Navy Blue | Crown/Æ |
| Italian | "Rinascimento" | Ferrari Red + Tuscan Gold | Flourish |
| Korean | "Hanok" | K-pop Pink + Cyan | 한 |
| Chinese | "Silk Road" | Imperial Red + Gold | 学/祥云 |

**DO NOT** show Japanese-specific elements (like floating kanji 学) when learning other languages.
**DO** switch the entire theme (colors, fonts, decorations) when the target language changes.

## Multi-Language Architecture

### Data Structure
Data is organized by language code in `src/data/{lang}/`:
```
src/data/
├── ja/                    # Japanese
│   ├── characters.json    # Hiragana/Katakana (112 chars)
│   ├── vocabulary.json
│   ├── kanji.json
│   ├── grammar.json
│   ├── readings.json
│   └── prerequisites.json
├── ko/                    # Korean
│   └── characters.json    # Hangul (40 chars)
├── zh/                    # Chinese
│   └── hanzi.json         # Chinese characters (10 HSK1 chars)
├── es/                    # Spanish (vocabulary, grammar, readings)
└── language-configs.json  # Master config for all languages
```

### Language Configuration (`src/data/language-configs.json`)
Defines which modules each language supports:

| Language | Code | Alphabet | Vocabulary | Kanji/Hanzi | Grammar | Reading | Listening |
|----------|------|----------|------------|-------------|---------|---------|-----------|
| Japanese | ja   | Hiragana/Katakana | Yes | Kanji | Yes | Yes | Yes |
| Korean   | ko   | **Hangul** | Yes* | - | Yes* | Yes* | Yes* |
| Chinese  | zh   | - | Yes* | **Hanzi** | Yes* | Yes* | Yes* |
| Spanish  | es   | - | Yes* | - | Yes* | Yes* | Yes* |
| German   | de   | - | Yes* | - | Yes* | Yes* | Yes* |
| English  | en   | - | Yes* | - | Yes* | Yes* | Yes* |
| Italian  | it   | - | Yes* | - | Yes* | Yes* | Yes* |

\* = Module enabled but shows "Coming Soon" (data not yet available)

### Key Components

**`LanguageContentGuard`** (`src/components/common/LanguageContentGuard.tsx`)
- Guards module pages, showing "Coming Soon" if no data exists
- `MODULE_DATA_AVAILABILITY` defines which languages have actual data

**`useTargetLanguage`** (`src/hooks/useTargetLanguage.ts`)
- Manages target language state
- Persists to localStorage
- Applies theme via `data-theme` attribute

**Dashboard Module Filtering** (`src/components/layout/Dashboard.tsx`)
- `isModuleEnabled()` filters modules based on language config
- `getModuleName()` returns language-specific module titles
- `getStatLabel()` returns language-specific stat labels

### Language-Specific Module Names

| Module ID | Japanese | Korean | Chinese | Others |
|-----------|----------|--------|---------|--------|
| alphabet  | "Alphabet" (Hiragana/Katakana) | "Hangul" | - | - |
| kanji     | "Kanji" | - | "Hanzi" | - |

### Theme System
CSS themes in `src/styles/themes/{lang}.css`:
- Use `html[data-theme="{lang}"]` selector for specificity
- Override `:root` CSS variables
- Applied automatically by `ClientLayout` when language changes

### Supported Proficiency Levels

**CRITICAL: Full proficiency range support from beginner to mastery!**

The app supports COMPLETE level ranges for all languages. Content MUST be created for ALL levels:

| Language | Framework | Full Range |
|----------|-----------|------------|
| Japanese | JLPT | N5 → N4 → N3 → N2 → N1 |
| Korean | TOPIK | TOPIK1 → TOPIK2 → TOPIK3 → TOPIK4 → TOPIK5 → TOPIK6 |
| Chinese | HSK | HSK1 → HSK2 → HSK3 → HSK4 → HSK5 → HSK6 |
| European (ES/DE/IT/EN) | CEFR | A1 → A2 → B1 → B2 → C1 → C2 |

**DO NOT** create only beginner content. Every module needs content from start to finish!

See `SPECIFICATION.md` for detailed level descriptions.

---

### Modular Data Loading Architecture

**CRITICAL: Keep it modular! Languages should be addable without code changes.**

The app uses a registry-based data loading system that allows adding new languages with minimal code changes:

#### Key Files

1. **`src/data/language-configs.json`** - Master config for all languages
   - Defines which modules each language supports
   - Contains level configurations (JLPT for Japanese, CEFR for European, HSK for Chinese, TOPIK for Korean)
   - **Adding a new language starts here**

2. **`src/lib/dataLoader.ts`** - Centralized data loader with registry pattern
   ```typescript
   // Import vocabulary data for all languages
   import jaVocabJson from '@/data/ja/vocabulary.json';
   import koVocabJson from '@/data/ko/vocabulary.json';
   // ...

   const DATA_REGISTRY: DataRegistry = {
     vocabulary: {
       ja: jaVocabJson,
       ko: koVocabJson,
       // Add new languages here
     },
   };

   export function getVocabularyData(lang: string): VocabularyItem[];
   export function getItemLevel(item: VocabularyItem): string;  // Handles jlpt/level fields
   ```

3. **`src/hooks/useTargetLanguage.ts`** - Language context hook
   - Provides `targetLanguage`, `levels`, `getDataUrl(filename)`
   - `levels` comes from `language-configs.json` - use this for filters!
   - `getDataUrl('grammar.json')` returns `/data/{lang}/grammar.json`

#### Module Page Pattern

All module pages (vocabulary, grammar, reading, listening) follow this pattern:

```typescript
import { useTargetLanguage } from '@/hooks/useTargetLanguage';
import { getVocabularyData, getItemLevel } from '@/lib/dataLoader';

export default function ModulePage() {
  const { targetLanguage, levels, getDataUrl } = useTargetLanguage();

  // Get first 2 levels from language config for filters
  const displayLevels = useMemo(() => levels.slice(0, 2), [levels]);

  // For vocabulary (static import via registry)
  const vocabulary = useMemo(() => getVocabularyData(targetLanguage), [targetLanguage]);

  // For grammar/reading/listening (dynamic fetch)
  useEffect(() => {
    fetch(getDataUrl('grammar.json'))
      .then(res => res.json())
      .then(data => setData(data));
  }, [targetLanguage, getDataUrl]);

  // Language-aware filters - NEVER hardcode JLPT/CEFR/HSK!
  useEffect(() => {
    const newFilters: Record<string, Filter> = {};
    displayLevels.forEach((level) => {
      newFilters[level.id] = {
        id: level.id,
        label: level.name,  // From language-configs.json
        checked: true,
        type: 'checkbox'
      };
    });
    setFilters(newFilters);
  }, [targetLanguage, displayLevels]);
}
```

#### Adding a New Language

1. **Add language config** to `src/data/language-configs.json`:
   ```json
   {
     "code": "fr",
     "name": "French",
     "nativeName": "Français",
     "levels": [
       { "id": "a1", "name": "CEFR A1", "framework": "CEFR" },
       { "id": "a2", "name": "CEFR A2", "framework": "CEFR" }
     ],
     "modules": {
       "vocabulary": true,
       "grammar": true,
       "reading": true,
       "listening": true
     }
   }
   ```

2. **Create data files** in `src/data/fr/`:
   - `vocabulary.json` - with `level` field matching level IDs (a1, a2)
   - `grammar.json`
   - `readings.json`
   - `listening.json`

3. **Add to dataLoader.ts** (for vocabulary only):
   ```typescript
   import frVocabJson from '@/data/fr/vocabulary.json';

   const DATA_REGISTRY = {
     vocabulary: {
       // ...existing languages
       fr: frVocabJson as VocabularyItem[],
     },
   };
   ```

4. **No changes needed** for grammar, reading, listening pages - they use dynamic fetch!

#### Level Field Handling

Different languages use different level systems:
- Japanese: `jlpt` field (n5, n4, n3, n2, n1)
- European: `level` field (a1, a2, b1, b2, c1, c2)
- Chinese: `level` field (hsk1, hsk2, hsk3, etc.)
- Korean: `level` field (topik1, topik2)

The `getItemLevel()` function in dataLoader.ts handles this:
```typescript
export function getItemLevel(item: VocabularyItem): string {
  const record = item as Record<string, unknown>;
  return (record.jlpt as string) || (record.level as string) || '';
}
```

### ⚠️ Known Issues / TODO

**Module Pages Needing Further Work:**
1. **`src/app/alphabet/page.tsx`**:
   - Hardcodes `@/data/ja/characters.json` (line 11)
   - Japanese-specific: Hiragana/Katakana toggle, gojuon/yoon/dakuten filters
   - Korean needs: consonant/vowel/double_consonant/compound_vowel filters
   - Should dynamically load data based on target language

2. **`src/app/kanji/page.tsx`**:
   - Hardcodes `@/data/ja/kanji.json` (line 13)
   - Japanese-specific: JLPT levels (N5, N4), onyomi/kunyomi readings
   - Chinese needs: HSK levels, pinyin instead of readings
   - Should dynamically load data based on target language

3. **Translations** (`src/locales/*.json`):
   - Module descriptions are Japanese-specific (e.g., "Master Hiragana & Katakana")
   - Should have language-aware descriptions

**Data Needed:**
- Korean: vocabulary, grammar, reading, listening
- Chinese: vocabulary, grammar, reading, listening (more Hanzi)
- All other languages: complete data sets

**ALREADY FIXED:**
- ✅ Vocabulary page - uses `dataLoader.ts` and `useTargetLanguage().levels`
- ✅ Grammar page - uses `getDataUrl()` and language-aware filters
- ✅ Reading page - uses `getDataUrl()`, conditional furigana (Japanese only)
- ✅ Listening page - uses `getDataUrl()` and language-aware filters

## ⚠️ IMPORTANT: Deployment Architecture

This project uses a **client-server architecture** with:

- **Frontend**: Next.js static export deployed to GitHub Pages
- **Backend**: Convex hosted backend-as-a-service (separate from frontend hosting)
- **Data Persistence**: Convex database (user progress, settings, authentication)
- **Static Assets**: GitHub Pages serves the built Next.js app
- **API Communication**: Frontend communicates with Convex backend via HTTPS

### How Convex Works with GitHub Pages

Convex is a **separate backend service** that works perfectly with static site hosting like GitHub Pages:

1. **Frontend Build**: Next.js static export generates HTML/CSS/JS files
2. **Backend Deployment**: Convex backend functions run on Convex's infrastructure
3. **Runtime Communication**: The static frontend makes API calls to `NEXT_PUBLIC_CONVEX_URL`
4. **No Server Required**: GitHub Pages only serves static files; Convex handles all backend logic

**Key Concept**: GitHub Pages hosts the **frontend** (static files), while Convex provides the **backend** (database, auth, serverless functions). They are **two separate services** that work together.

### Deployment Process

```bash
# Deploy backend + build frontend in one command
npm run deploy  # Runs: npx convex deploy --cmd 'npm run build'

# This does:
# 1. Sets NEXT_PUBLIC_CONVEX_URL to production Convex deployment
# 2. Runs 'npm run build' to generate static files in out/ directory
# 3. Deploys Convex backend functions
# 4. Push to GitHub master branch to deploy frontend to Pages
```

**No PostgreSQL, No Node.js Server**: This is NOT a traditional full-stack app. There's no PostgreSQL database, no Express server, no server-side Node.js runtime on GitHub Pages. It's a **static frontend + serverless backend** architecture.

## Project Overview

Murmura is a modern, full-featured multi-language learning web application built with Next.js and TypeScript. Users can learn Japanese, Korean, Chinese, Spanish, German, Italian, and English through interactive exercises with audio support and progress tracking.

**Live URL**: https://japanese.renner.dev (to be updated)

## Tech Stack

- **Next.js** (v16.1.1) - React framework with App Router, static export for GitHub Pages
- **TypeScript** (v5) - Type-safe development
- **React** (v19.2.1) - UI framework
- **Wanakana.js** (v5.0.2) - Hiragana/Katakana conversion library
- **Convex** (v1.31.4) - Backend-as-a-service for user data, progress tracking, and authentication
- **@convex-dev/auth** (v0.0.90) - Authentication provider (Password + Anonymous)
- **ElevenLabs TTS** - High-quality Japanese text-to-speech (390+ pre-generated audio files)
- **Web Speech API** - Browser-native text-to-speech fallback
- **GitHub Pages** - Static hosting with custom domain

## Project Structure

```
murmura/
├── src/                           # Next.js source code
│   ├── app/                      # Next.js App Router pages
│   │   ├── page.tsx              # Dashboard landing page
│   │   ├── alphabet/             # Character practice (Hiragana/Katakana/Hangul)
│   │   ├── vocabulary/           # Vocabulary learning
│   │   ├── kanji/                # Kanji/Hanzi practice
│   │   ├── grammar/              # Grammar lessons
│   │   ├── reading/              # Reading comprehension
│   │   └── listening/            # Listening exercises
│   ├── components/               # React components
│   │   ├── common/               # Shared components (CharacterCard, MultipleChoice, etc.)
│   │   ├── alphabet/             # Alphabet-specific components
│   │   ├── vocabulary/           # Vocabulary components
│   │   └── ...                   # Other module components
│   ├── hooks/                    # Custom React hooks
│   │   ├── useTTS.ts            # Text-to-speech with ElevenLabs + Web Speech API
│   │   ├── useMobile.ts         # Mobile device detection
│   │   ├── useTimer.ts          # Countdown timer logic
│   │   ├── useProgress.ts       # Progress tracking
│   │   ├── useSRS.ts            # Spaced repetition system
│   │   └── useStorage.ts        # LocalStorage utilities
│   ├── contexts/                 # React Context providers
│   │   ├── ProgressContext.tsx  # Global progress state
│   │   ├── SettingsContext.tsx  # User settings
│   │   └── LanguageContext.tsx  # i18n language state
│   ├── types/                    # TypeScript type definitions
│   │   └── index.ts             # All interfaces (Character, Vocabulary, Kanji, etc.)
│   ├── data/                     # JSON data files
│   │   ├── characters.json      # Hiragana/Katakana characters
│   │   ├── vocabulary.json      # Vocabulary words
│   │   ├── kanji.json           # Kanji characters
│   │   ├── grammar.json         # Grammar patterns
│   │   ├── readings.json        # Reading passages
│   │   └── listening.json       # Listening exercises
│   ├── lib/                      # Utility libraries
│   │   ├── convex.tsx           # Convex client provider
│   │   └── convexStorage.ts     # Convex data operations
│   └── styles/                   # Global CSS
│       └── globals.css          # Design system CSS
├── public/                       # Static assets
│   └── audio/                    # Generated TTS audio files (390+ files)
│       ├── characters/          # Character pronunciation
│       ├── vocabulary/          # Word pronunciation
│       ├── kanji/               # Kanji readings
│       ├── grammar/             # Grammar examples
│       ├── reading/             # Reading audio
│       └── listening/           # Listening exercises
├── convex/                       # Convex backend
│   ├── schema.js                # Database schema (users, userData, settings)
│   ├── auth.ts                  # Authentication configuration
│   └── ...                      # Backend queries/mutations
├── tools/                        # CLI tools for development
│   ├── tts-generator.ts         # ElevenLabs/Kokoro audio generation
│   ├── check-i18n.ts            # i18n validation
│   └── setup-kokoro.sh          # Kokoro TTS setup script
├── locales/                      # i18n translation files
│   ├── en.json                  # English (default)
│   ├── es.json                  # Spanish
│   ├── ja.json                  # Japanese
│   └── ...                      # 12 total languages
├── next.config.js               # Next.js configuration (static export)
├── tsconfig.json                # TypeScript configuration
└── package.json                 # Dependencies and scripts
```

## Key Code Locations

### Core Components
- **Dashboard**: `src/app/page.tsx` - Main landing page with module cards and stats
- **Character Practice**: `src/app/alphabet/page.tsx` - Hiragana/Katakana learning
- **Vocabulary**: `src/app/vocabulary/page.tsx` - Word learning with flashcards
- **Kanji**: `src/app/kanji/page.tsx` - Kanji recognition and practice
- **Grammar**: `src/app/grammar/page.tsx` - Grammar patterns and exercises
- **Reading**: `src/app/reading/page.tsx` - Reading comprehension passages
- **Listening**: `src/app/listening/page.tsx` - Audio comprehension exercises

### Data & Types
- **Character Database**: `src/data/characters.json` - 112 characters with audio URLs
- **TypeScript Types**: `src/types/index.ts` - All interfaces and types
- **Data Loading**: Components import JSON directly via ES modules

### Custom Hooks
- **useTTS**: `src/hooks/useTTS.ts` - Audio playback with ElevenLabs primary, Web Speech fallback
- **useMobile**: `src/hooks/useMobile.ts` - Mobile device detection (user agent + touch + screen size)
- **useTimer**: `src/hooks/useTimer.ts` - Countdown timer for timed exercises
- **useProgress**: `src/hooks/useProgress.ts` - Progress tracking and statistics
- **useSRS**: `src/hooks/useSRS.ts` - Spaced repetition scheduling algorithm

### Backend Integration
- **Convex Client**: `src/lib/convex.tsx` - ConvexReactClient provider
- **Convex Storage**: `src/lib/convexStorage.ts` - Data operations (save/load progress)
- **Auth Config**: `convex/auth.ts` - Password + Anonymous authentication
- **Schema**: `convex/schema.js` - Database tables (users, userData, userSettings)

### Styling
- **Global CSS**: `src/styles/globals.css` - Complete design system with:
  - Dark theme color palette
  - CSS custom properties (variables)
  - Animation keyframes
  - Responsive breakpoints
  - Accessibility styles

## Development Notes

### Build Process
This is a Next.js TypeScript project with static export for GitHub Pages deployment.

**Development:**
```bash
npm run dev           # Start development server (localhost:3000)
```

**Production Build:**
```bash
npm run build         # Build static site to out/ directory
```

**Deployment:**
```bash
npm run deploy        # Deploy Convex backend + build Next.js
```

### Python Virtual Environment

**IMPORTANT: Always use the project's virtual environment for Python commands!**

The project uses a Python venv for data generation scripts. Never install packages globally.

```bash
# Activate venv before running Python commands
source .venv/bin/activate

# Install new packages (always in venv)
source .venv/bin/activate && pip install <package>

# Run Python scripts
source .venv/bin/activate && python tools/generate-kanji-data.py
```

**Installed packages:**
- `kotobase` - Japanese kanji/vocabulary database with JLPT level support

### Environment Variables
Create a `.env.local` file with:
```env
# Convex Backend
CONVEX_DEPLOYMENT=dev:your-deployment
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud

# ElevenLabs TTS (for audio generation)
ELEVENLABS_API_KEY=sk_...
ELEVENLABS_VOICE_ID=GR4dBIFsYe57TxyrHKXz
ELEVENLABS_MODEL_ID=eleven_v3
```

### TTS Audio Generation
The project uses ElevenLabs for high-quality Japanese TTS. Audio files are pre-generated using CLI tools:

**Generate all audio:**
```bash
npm run generate-audio -- --type all --update-json
```

**Generate specific module:**
```bash
npm run generate-audio -- --type characters --update-json
npm run generate-audio -- --type vocabulary --update-json
```

**Using Kokoro (local high-quality TTS):**
```bash
npm run setup-kokoro  # One-time setup
npm run generate-audio -- --provider kokoro --kokoro-voice jf_tebukuro --type all --update-json
```

**Audio Organization:**
- `public/audio/characters/` - Hiragana/Katakana character audio (104 files)
- `public/audio/vocabulary/` - Vocabulary word audio (86 files)
- `public/audio/grammar/` - Grammar example sentence audio (28 files)
- `public/audio/kanji/` - Kanji reading and example audio (162 files)
- `public/audio/reading/` - Reading passage audio (5 files)
- `public/audio/listening/` - Listening exercise audio (5 files)

**Total:** 390+ pre-generated MP3 files

### Testing Changes
1. Run `npm run dev` to start development server
2. Open http://localhost:3000 in browser
3. Test different modules (Alphabet, Vocabulary, Kanji, etc.)
4. Verify TTS audio playback works
5. Test mobile mode using browser DevTools device emulation
6. Enable debug mode: `window.DEBUG_MOBILE = true` in console

### Data Structure

**Character Object:**
```typescript
interface Character {
  romaji: string;       // Romanized pronunciation ("ka", "shi", "tsu")
  hiragana: string;     // Hiragana character ("か", "し", "つ")
  type: 'gojuon' | 'yoon' | 'dakuten' | 'handakuten';
  audioUrl?: string;    // Optional URL to pre-generated audio file
}
```

**Vocabulary Item:**
```typescript
interface VocabularyItem {
  id: string;
  word: string;         // Japanese word (hiragana/kanji)
  reading: string;      // Hiragana reading
  meanings: {           // Multi-language meanings
    en: string[];
    es?: string[];
    // ... other languages
  };
  audioUrl?: string;
  level?: 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
}
```

**Kanji Item:**
```typescript
interface KanjiItem {
  id: string;
  kanji: string;        // The kanji character
  meanings: {           // Multi-language meanings
    en: string[];
    es?: string[];
  };
  onyomi: string[];     // On'yomi readings
  kunyomi: string[];    // Kun'yomi readings
  examples: Array<{
    word: string;
    reading: string;
    meanings: { en: string[]; };
    audioUrl?: string;
  }>;
  audioUrl?: string;
  level?: 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
}
```

Note: Katakana conversion happens via Wanakana.js at runtime. All `audioUrl` fields are optional and point to pre-generated ElevenLabs audio files.

### Character Types
- `gojuon` - Basic 50-sound syllabary (46 characters)
- `yoon` - Palatalized sounds (きゃ, しゃ, ちょ, etc.) (21 characters)
- `dakuten` - Voiced consonants (が, ざ, だ, etc.) (25 characters)
- `handakuten` - Semi-voiced consonants (ぱ, ぴ, ぷ, etc.) (5 characters)

Total: 112 base characters + Katakana variants via Wanakana

## Common Tasks

### Adding New Characters
1. Edit `src/data/characters.json`
2. Add entry: `{ "romaji": "ka", "hiragana": "か", "type": "gojuon" }`
3. Generate audio: `npm run generate-audio -- --type characters --update-json`

### Adding New Vocabulary
1. Edit `src/data/vocabulary.json`
2. Add multi-language meanings
3. Generate audio: `npm run generate-audio -- --type vocabulary --update-json`

### Adding New Kanji
1. Edit `src/data/kanji.json`
2. Include onyomi, kunyomi, examples with meanings
3. Generate audio: `npm run generate-audio -- --type kanji --update-json`

### Modifying Timer Duration
Edit `src/hooks/useTimer.ts` - default is 5 seconds per question

### Styling Changes
Edit `src/styles/globals.css` - uses CSS custom properties for theming:
- Colors: `--bg-primary`, `--accent-red`, `--accent-gold`, etc.
- Animations: `fadeInUp`, `fadeInDown`, `float`, `shake`, etc.
- Responsive: Mobile breakpoint at 640px

### Mobile Multiple Choice Feature
- **Detection**: `useMobile` hook checks user agent, touch capability, screen width < 768px
- **UI Switching**: Automatically shows/hides text input vs multiple choice buttons
- **Component**: `src/components/common/MultipleChoice.tsx`
- **Option Generation**: Creates 4 options (1 correct + 3 random incorrect)
- **Debug Mode**: Set `window.DEBUG_MOBILE = true` for detailed console logging

### Adding Mobile-Responsive Components

**Critical Guidelines for Mobile UX**:

1. **Always add viewport export to layout.tsx**:
   ```typescript
   export const viewport = {
     width: 'device-width',
     initialScale: 1,
     maximumScale: 5,
   }
   ```

2. **Ensure touch targets are ≥ 44px**:
   ```css
   .button {
     min-height: 44px;
     padding: 0.625rem 1rem;
   }
   ```

3. **Add responsive breakpoints**:
   - Ultra-small: `@media (max-width: 375px)`
   - Small: `@media (max-width: 480px)`
   - Medium: `@media (min-width: 481px) and (max-width: 640px)`

4. **Prevent text overflow**:
   ```css
   word-wrap: break-word;
   overflow-wrap: break-word;
   ```

5. **Use flexible grid minmax**:
   ```css
   grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
   /* Not 280px - too wide for small phones */
   ```

6. **Test at multiple widths**:
   - 320px (iPhone SE, oldest devices)
   - 375px (iPhone standard)
   - 480px (large phones)
   - 640px (tablet portrait)

**Common Mobile Pitfalls to Avoid**:
- ❌ Hardcoded `min-width` > 400px on dialogs
- ❌ Touch targets < 44px height
- ❌ Grid `minmax()` values > 280px
- ❌ Only testing at 640px breakpoint
- ❌ Forgetting viewport meta configuration
- ❌ Using `!important` for responsive overrides (use specificity instead)

### Internationalization (i18n)
The app supports 12 languages. Translation files are in `locales/`:
- `en.json` - English (default)
- `es.json` - Spanish
- `ja.json` - Japanese
- `zh-CN.json` - Chinese (Simplified)
- `pt.json` - Portuguese
- `fr.json` - French
- `de.json` - German
- `ru.json` - Russian
- `ko.json` - Korean
- `it.json` - Italian
- `ar.json` - Arabic
- `hi.json` - Hindi

**Adding translations:**
1. Edit relevant `locales/*.json` file
2. Run `npm run check-i18n` to validate completeness
3. Run `npm run find-missing-i18n` to find missing keys

## Convex Backend

### Database Schema
The Convex backend (`convex/schema.js`) defines:

**users table:**
- User authentication data
- Linked to authAccounts for OAuth

**userData table:**
- Comprehensive progress tracking per user
- Module-specific data (alphabet, vocabulary, kanji, grammar, reading, listening)
- Global stats: streak, bestStreak, totalStudyTime, lastActive
- SRS scheduling data

**userSettings table:**
- Theme preferences (dark/light)
- Audio settings (volume, autoplay)
- TTS provider (ElevenLabs/Web Speech)
- Timer settings (duration, enabled)
- Language preference

### Authentication
- **Providers**: Password, Anonymous
- **Implementation**: `@convex-dev/auth` with `convex/auth.ts`
- **Client**: `ConvexAuthProvider` wraps the app in `src/lib/convex.tsx`

### Auth Environment Variables (Required for Production)

Convex Auth requires these environment variables to be set in the **Convex Dashboard** (not GitHub secrets):

| Variable | Description |
|----------|-------------|
| `JWT_PRIVATE_KEY` | RSA private key for signing JWTs |
| `JWKS` | JSON Web Key Set (public key) |
| `SITE_URL` | Production URL (e.g., `https://japanese.renner.dev`) |

**To generate new keys:**
```bash
node tools/generateAuthKeys.mjs
```

**To set up:**
1. Go to https://dashboard.convex.dev
2. Select project → **Settings** → **Environment Variables**
3. Select the **Production** deployment
4. Add all three variables with the generated values

**Important:** These must be set on the Convex deployment, NOT as GitHub secrets. The Convex backend needs these to sign and verify authentication tokens.

### Data Operations
Use `src/lib/convexStorage.ts` for common operations:
- `saveProgress(module, data)` - Save user progress
- `loadProgress(module)` - Load user progress
- `updateStats(module, stats)` - Update statistics

## Design System

### Color Palette (Dark Theme)
- **Background**: `--bg-primary: #0f0f1a` (deep indigo-black)
- **Card Background**: `--bg-card: #16162a` (medium dark blue)
- **Text**: `--text-primary: #f5f0e8` (warm off-white)
- **Accent Red**: `--accent-red: #c41e3a` (traditional vermillion)
- **Accent Gold**: `--accent-gold: #d4a574` (warm gold)
- **Success**: `--success: #4a9d7c` (green)

### Typography
- **Primary Font**: `'Zen Kaku Gothic New'` (Japanese-style sans-serif)
- **Secondary Font**: `'Crimson Pro'` (serif for subtitles)
- **Character Display**: `clamp(8rem, 30vw, 14rem)` - Massive, responsive
- **Input Text**: `2.5rem` - Large for readability

### Key Animations
- **fadeInUp** - Entry animation (0.6s ease-out)
- **fadeInDown** - Header animation (0.6s ease-out)
- **float** - Continuous floating motion (6s infinite)
- **shake** - Error feedback (0.5s ease-out)
- **pulseSuccess** - Success feedback (0.5s ease-out)

### Responsive Design

**Mobile-First Philosophy**: The app is designed mobile-first with progressive enhancement for desktop.

#### Breakpoint Strategy
1. **Ultra-Small (≤ 375px)**: iPhone SE, older Android (320px-375px)
2. **Small (≤ 480px)**: Most modern phones
3. **Medium (481px-640px)**: Large phones, small tablets
4. **Desktop (> 640px)**: Tablets and desktop

#### Critical Mobile Requirements

**Touch Targets**:
- **MINIMUM 44px × 44px** for all interactive elements (Apple/Android HIG standard)
- Buttons:
  - Small: 44px height minimum
  - Medium: 48px height
  - Large: 56px height (48px on ultra-small phones)
- Adequate spacing between touch targets (0.75rem minimum gap)

**Typography**:
- Base font: 15px on ultra-small, 16px elsewhere
- Headings scale down on small screens:
  - h1: max 1.75rem on phones
  - h2: max 1.5rem on phones
- Text overflow prevention:
  ```css
  word-wrap: break-word;
  overflow-wrap: break-word;
  ```

**Layout**:
- Grid minimum widths optimized for narrow screens:
  - Module cards: 260px min (down from 280px)
  - Stats cards: 140px min (down from 150px)
- Single-column on phones, multi-column on desktop
- Responsive padding: Less padding on smaller screens
- Full-width dialogs on ultra-small phones

**Viewport**:
```typescript
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,  // Allow zoom for accessibility
}
```

**Input Methods**:
- Desktop: Text input with keyboard
- Mobile: Multiple choice (4 options in 2×2 grid)
- Touch-friendly button sizes (55px height minimum)

**Testing Mobile**:
- Chrome DevTools: Test at 320px, 375px, 480px, 640px
- Physical devices: iPhone SE (small), iPhone 14 (medium), iPad (tablet)
- Enable debug mode: `window.DEBUG_MOBILE = true`
- Check landscape orientation on phones (< 500px height)

### Icon Usage Guidelines

**NEVER use emojis as icons.** Always use proper icon components from the `react-icons` library.

#### Why Not Emojis?
- **Inconsistent rendering**: Emojis look different across browsers, operating systems, and devices
- **Poor accessibility**: Screen readers handle emojis poorly
- **Limited styling**: Can't control size, color, or alignment reliably
- **Unprofessional**: Emojis create an inconsistent, unprofessional appearance

#### Correct Approach: react-icons

Install the library:
```bash
npm install react-icons
```

Import and use icon components:
```typescript
import { IoFlame, IoBook, IoSchool, IoTime } from 'react-icons/io5';
import { IoVolumeHigh, IoHeadset, IoDocumentText } from 'react-icons/io5';
import { PiExam } from 'react-icons/pi';

// Use as React components
<div className={styles.icon}><IoFlame /></div>
<Button><IoVolumeHigh /> Play Audio</Button>
```

#### Recommended Icon Libraries
- **Ionicons 5** (`react-icons/io5`): Primary choice, modern and consistent
- **Phosphor** (`react-icons/pi`): Good alternative with unique icons
- **Material Design** (`react-icons/md`): For Material UI style
- **Lucide** (`react-icons/lu`): Minimal, clean icons

#### Icon Mapping Guide
Replace emojis with appropriate react-icons:

| Emoji | Icon Component | Import |
|-------|---------------|--------|
| 🔥 (fire) | `IoFlame` | `react-icons/io5` |
| 📚 (books) | `IoBook` | `react-icons/io5` |
| 字 (kanji) | `IoSchool` | `react-icons/io5` |
| ⏱️ (timer) | `IoTime` | `react-icons/io5` |
| 📖 (book) | `IoBook` | `react-icons/io5` |
| 📝 (writing) | `PiExam` | `react-icons/pi` |
| 📄 (document) | `IoDocumentText` | `react-icons/io5` |
| 🎧 (headphones) | `IoHeadset` | `react-icons/io5` |
| 🔊 (speaker) | `IoVolumeHigh` | `react-icons/io5` |

#### Japanese Characters as Icons
When using Japanese characters (あ, 字, etc.) as icons, wrap them in a styled span:

```typescript
interface Module {
    id: string;
    icon: React.ReactNode;  // NOT string!
    href: string;
}

const MODULES = [
    { id: 'alphabet', icon: <span className={styles.japaneseIcon}>あ</span>, href: '/alphabet' },
    { id: 'kanji', icon: <span className={styles.japaneseIcon}>字</span>, href: '/kanji' },
];
```

```css
.japaneseIcon {
  font-family: 'Zen Kaku Gothic New', sans-serif;
  font-weight: 700;
  /* Ensures Japanese characters render properly as icons */
}
```

#### Styling Icons
Icons inherit color and size from parent by default:

```css
.moduleIcon {
  font-size: 4rem;          /* Icon scales to this size */
  color: var(--accent-gold); /* Icon takes this color */
}
```

**Common Pitfall**: Don't use emojis even for "quick prototyping" - they'll end up in production. Always use proper icons from the start.

## Deployment

### Combined Deployment (Recommended)
```bash
npm run deploy  # Deploys Convex backend + builds Next.js static export
```

This single command:
1. Sets `NEXT_PUBLIC_CONVEX_URL` environment variable to production Convex deployment
2. Runs `npm run build` to generate static files in `out/` directory
3. Deploys backend code from `convex/` directory to Convex cloud
4. You then push the `out/` directory to GitHub master branch

### Manual Deployment Steps

**Step 1: Deploy Backend + Build Frontend**
```bash
npx convex deploy --cmd 'npm run build'
```
- Confirms you want to push backend code to production
- Builds Next.js static export with correct Convex URL
- Deploys Convex functions to cloud

**Step 2: Deploy Frontend to GitHub Pages**
```bash
git add out/
git commit -m "deploy: update static build"
git push origin master
```
- GitHub Pages automatically serves from `out/` directory
- Custom domain: `japanese.renner.dev` (configured via `CNAME`)

### Environment Variables

**Local Development (.env.local):**
```env
CONVEX_DEPLOYMENT=dev:your-deployment-name
NEXT_PUBLIC_CONVEX_URL=https://your-dev-deployment.convex.cloud
```

**GitHub Actions Secrets (for CI/CD):**
| Secret | Description |
|--------|-------------|
| `CONVEX_DEPLOY_KEY` | Deploy key from Convex Dashboard → Settings → Deploy Keys |

**Convex Dashboard Environment Variables (for Auth):**

These must be set in the Convex Dashboard (Settings → Environment Variables), NOT in GitHub:
| Variable | Description |
|----------|-------------|
| `JWT_PRIVATE_KEY` | RSA private key for signing JWTs |
| `JWKS` | JSON Web Key Set (public key) |
| `SITE_URL` | `https://japanese.renner.dev` |

Generate keys with: `node tools/generateAuthKeys.mjs`

### Architecture Diagram

```
┌─────────────────────────────────────┐
│   GitHub Pages (Static Hosting)    │
│  https://japanese.renner.dev        │
│                                     │
│  - Serves HTML/CSS/JS files         │
│  - Next.js static export (out/)     │
│  - No server-side processing        │
└───────────────┬─────────────────────┘
                │
                │ HTTPS API Calls
                │
┌───────────────▼─────────────────────┐
│   Convex Backend (Cloud Hosted)    │
│  https://*.convex.cloud             │
│                                     │
│  - Database (users, progress, etc.) │
│  - Authentication (Password, OAuth) │
│  - Serverless functions             │
│  - Real-time subscriptions          │
└─────────────────────────────────────┘
```

### Why This Works

- **Separation of Concerns**: Frontend (static) and backend (dynamic) are decoupled
- **No Server Required**: GitHub Pages only serves files; Convex handles all backend logic
- **Client-Side Rendering**: React app hydrates in browser and makes API calls to Convex
- **Scalable**: Convex backend scales independently of frontend hosting
- **Cost-Effective**: GitHub Pages is free; Convex has generous free tier

## Tools & Scripts

- `npm run dev` - Development server
- `npm run build` - Production build
- `npm run deploy` - Deploy Convex + build
- `npm run generate-audio` - Generate TTS audio files
- `npm run check-i18n` - Validate translations
- `npm run find-missing-i18n` - Find missing translation keys
- `npm run setup-kokoro` - Set up local Kokoro TTS

## Troubleshooting

### Convex Connection Issues
- Ensure `.env.local` has `NEXT_PUBLIC_CONVEX_URL`
- Check Convex dashboard for deployment status
- App gracefully falls back to localStorage if Convex unavailable

### Audio Not Playing
- Check browser console for errors
- Verify `audioUrl` paths in JSON files
- Ensure audio files exist in `public/audio/`
- Test Web Speech API fallback (should work without audio files)

### Mobile Mode Not Activating
- Enable debug mode: `window.DEBUG_MOBILE = true`
- Check console for detection criteria
- Verify screen width < 768px or touch enabled

### Build Failures
- Clear `.next` cache: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check TypeScript errors: `npm run lint`
