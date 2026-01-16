# CLAUDE.md

This file provides guidance for AI assistants working on the Japanese Trainer codebase.

## Project Overview

A modern, full-featured Japanese learning web application built with Next.js and TypeScript. Users can practice Hiragana, Katakana, vocabulary, Kanji, grammar, reading comprehension, and listening skills through interactive exercises with audio support and progress tracking.

**Live URL**: https://japanese.renner.dev

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
japanese-trainer/
├── src/                           # Next.js source code
│   ├── app/                      # Next.js App Router pages
│   │   ├── page.tsx              # Dashboard landing page
│   │   ├── alphabet/             # Hiragana/Katakana practice
│   │   ├── vocabulary/           # Vocabulary learning
│   │   ├── kanji/                # Kanji practice
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
- **Desktop**: Full layout with all features
- **Mobile** (< 640px):
  - Single column layouts
  - Multiple choice replaces text input
  - Reduced font sizes
  - Touch-optimized buttons (min 44px)

## Deployment

### GitHub Pages Setup
1. Push to `master` branch
2. GitHub Actions builds Next.js (`npm run build`)
3. Static files from `out/` deployed to GitHub Pages
4. Custom domain: `japanese.renner.dev` (configured via `CNAME`)

### Convex Deployment
```bash
npm run deploy  # Deploys Convex backend + builds Next.js
```

**Note:** Requires `CONVEX_DEPLOYMENT` environment variable set.

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
