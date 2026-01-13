# Japanese Trainer - Specification

## Overview

Japanese Trainer is a web-based learning application designed to help users learn and practice Japanese Hiragana and Katakana characters through interactive quizzes.

**URL**: https://japanese.renner.dev
**Repository**: https://github.com/rennerdo30/japanese-trainer

## Features

### 1. Alphabet Selection
- **Hiragana Mode**: Practice reading Hiragana characters (あ, い, う, etc.)
- **Katakana Mode**: Practice reading Katakana characters (ア, イ, ウ, etc.)

### 2. Character Type Filtering
Users can filter which character types to practice:

| Filter | Japanese | Description | Example |
|--------|----------|-------------|---------|
| Gojūon | 五十音 | Basic 46 characters | あ, か, さ |
| Yōon | 拗音 | Palatalized combinations | きゃ, しゅ, ちょ |
| Dakuten | 濁音 | Voiced consonants | が, ざ, だ |
| Handakuten | 半濁音 | Semi-voiced (p-sounds) | ぱ, ぴ, ぷ |

### 3. Quiz Mechanics
- Random character selection from filtered pool
- User types Romaji equivalent (e.g., "ka" for か)
- Real-time input validation
- Auto-advance on correct answer

### 4. Timer System
- 5-second countdown per character
- Visual countdown display
- Auto-advance with error highlight on timeout

### 5. Text-to-Speech (TTS)
- Automatic pronunciation on correct answer
- **Primary**: ElevenLabs TTS with pre-generated high-quality audio files
- **Fallback**: Web Speech API for browser-native pronunciation
- Audio files stored locally and referenced via `audioUrl` in data structures
- Helps reinforce audio-visual association with consistent pronunciation

### 6. Progress Tracking
- Displays correct answers vs total attempts
- Format: "Correct / Total" (e.g., "15 / 20")

## User Interface

### Landing Page (`index.html`)
- Simple entry point
- Link to learning interface

### Learning Interface (`learn_alphabet.html`)

```
┌─────────────────────────────────────────┐
│  ○ Hiragana  ○ Katakana                 │
│  ☑ Gojūon  ☑ Yōon  ☑ Dakuten/Handakuten │
├─────────────────────────────────────────┤
│                                         │
│                  か                      │
│              (large display)            │
│                                         │
├─────────────────────────────────────────┤
│            [  ka  ]                     │
│         (romaji input)                  │
├─────────────────────────────────────────┤
│            15 / 20                      │
│          (score display)                │
│              4s                         │
│         (countdown timer)               │
└─────────────────────────────────────────┘
```

## Technical Specifications

### Browser Requirements
- Modern browser with ES6 support
- Web Speech API support (Chrome, Edge, Safari)
- JavaScript enabled

### Dependencies
| Dependency | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.1.1 | React framework |
| TypeScript | ^5 | Type-safe development |
| Wanakana.js | 5.0.2 | Hiragana to Katakana conversion |
| ElevenLabs | - | High-quality Japanese TTS (via API) |
| Convex | 1.31.4 | Backend for user data and progress |

### Character Database
- **Total entries**: 656+ character combinations
- **Storage**: TypeScript array in `src/data/characters.ts`
- **Format**: `{ romaji: string, hiragana: string, type: string, audioUrl?: string }`
- **Audio**: Optional pre-generated ElevenLabs audio files for pronunciation

### Performance
- No build step required
- Minimal file sizes (~15KB total JS)
- Instant page load

## Data Model

### Character Object
```typescript
{
  romaji: string,      // Romanized pronunciation ("ka", "shi", "tsu")
  hiragana: string,    // Hiragana character ("か", "し", "つ")
  type: string,        // "gojuon" | "yoon" | "dakuten" | "handakuten"
  audioUrl?: string    // Optional URL to pre-generated ElevenLabs audio file
}
```
Note: Katakana is converted at runtime via Wanakana.js.

### Application State
| Variable | Type | Description |
|----------|------|-------------|
| `correct` | number | Count of correct answers |
| `totoal` | number | Total questions answered |
| `character` | object | Current character being displayed |
| `countdown` | number | Seconds remaining (0-5) |
| `timePerCharakter` | number | Seconds allowed per question (5) |

## User Flow

1. User opens application
2. Selects alphabet type (Hiragana/Katakana)
3. Optionally adjusts character filters
4. Random character is displayed
5. User types Romaji equivalent
6. On correct answer:
   - TTS speaks the character
   - Score increments
   - New character appears
7. On timeout:
   - Input highlights red
   - New character appears
8. Repeat steps 5-7

## TTS Audio System

### Overview
The application uses a two-tier TTS system for Japanese pronunciation:
1. **Primary**: ElevenLabs TTS with pre-generated high-quality audio files
2. **Fallback**: Web Speech API for browser-native pronunciation

### Audio Generation Tools

#### CLI Tool: `tools/tts-generator.ts`
TypeScript command-line tool for generating audio files using ElevenLabs API.

**Usage:**
```bash
npm run generate-audio [options]
  --type <type>        # characters|vocabulary|grammar|kanji|all
  --output <path>       # Output directory (default: public/audio)
  --api-key <key>      # ElevenLabs API key (or use .env)
  --voice-id <id>      # ElevenLabs voice ID (default: Japanese voice)
  --update-json        # Update JSON files with audio URLs
  --dry-run            # Preview without generating audio
```

**Features:**
- Batch processing of all data types
- Progress tracking with visual progress bars
- Error handling and retry logic with exponential backoff
- Resume capability (skips existing audio files)
- Automatic JSON file updates with audio URLs
- TypeScript type safety

**Audio Generation Strategy:**
- **Characters**: One audio file per character (hiragana reading).
- **Vocabulary**: One audio file per vocabulary word (reading field).
- **Grammar**: Audio for each example sentence.
- **Kanji**: Audio for onyomi/kunyomi readings and example words.
- **Quality Optimizations**:
  - **ElevenLabs**: Uses `eleven_v3` (Multilingual v3) with explicit `language_code: "ja"` for native Japanese phonology and superior prosody.
  - **Kokoro**: Uses optimized voice parameters including trailing silence (500ms) to prevent audio cutoff.

### Audio File Organization

```
public/
  audio/
    characters/
      {hash}.mp3          # Character audio files
    vocabulary/
      {id}.mp3            # Vocabulary word audio
    grammar/
      {id}-{exampleIndex}.mp3  # Grammar example audio
    kanji/
      {id}-{readingType}.mp3   # Kanji reading audio
```

### Data Structure Updates

All learning data types now support optional `audioUrl` fields:

- **Character**: `audioUrl?: string` - Points to character pronunciation
- **VocabularyItem**: `audioUrl?: string` - Points to word pronunciation
- **GrammarItem.examples**: `audioUrl?: string` - Points to example sentence audio
- **KanjiItem**: `audioUrl?: string` - Points to reading pronunciation
- **KanjiItem.examples**: `audioUrl?: string` - Points to example word audio

### TTS Integration

**Implementation**: `src/hooks/useTTS.ts`

The TTS hook checks for `audioUrl` in the data:
1. If `audioUrl` exists, attempts to play ElevenLabs audio via HTML5 Audio API
2. If `audioUrl` is missing or fails to load, falls back to Web Speech API
3. Supports both local file paths and CDN URLs

**Usage in Components:**
```typescript
const { speak } = useTTS();
// Automatically uses audioUrl if available, falls back to Web Speech API
speak(text, { audioUrl: data.audioUrl });
```

### Configuration

**Environment Variables** (`.env`):
- `ELEVENLABS_API_KEY` - Required: ElevenLabs API key
- `ELEVENLABS_VOICE_ID` - Optional: Japanese voice ID (tool suggests defaults)
- `ELEVENLABS_MODEL_ID` - Optional: Model ID (defaults to latest)

**Setup:**
1. Obtain ElevenLabs API key from https://elevenlabs.io
2. Create `.env` file with `ELEVENLABS_API_KEY`
3. Run `npm run generate-audio -- --type all --update-json`
4. Audio files are generated and JSON files updated automatically

## Future Enhancement Possibilities

- Persistent score storage (localStorage)
- Kanji learning mode
- Vocabulary/word training
- Spaced repetition system
- Mobile app version
- Progress statistics/history
- Difficulty levels
- Sound effects

## Design System & Visual Style

### Color Palette

The application uses a dark, elegant color scheme with warm accent colors:

#### Background Colors
- **Primary Background** (`--bg-primary`): `#0f0f1a` - Deep dark blue-black, main page background
- **Secondary Background** (`--bg-secondary`): `#1a1a2e` - Slightly lighter dark blue, used for secondary surfaces
- **Card Background** (`--bg-card`): `#16162a` - Medium dark blue, used for cards and elevated surfaces

#### Text Colors
- **Primary Text** (`--text-primary`): `#f5f0e8` - Warm off-white, main text color
- **Secondary Text** (`--text-secondary`): `#a8a4b8` - Muted lavender-gray, for secondary information
- **Muted Text** (`--text-muted`): `#6b6880` - Darker gray, for labels and hints

#### Accent Colors
- **Accent Red** (`--accent-red`): `#c41e3a` - Deep crimson, used for primary actions and errors
- **Accent Red Glow** (`--accent-red-glow`): `rgba(196, 30, 58, 0.3)` - Red glow effect for shadows
- **Accent Gold** (`--accent-gold`): `#d4a574` - Warm gold, used for highlights and interactive elements
- **Accent Gold Dim** (`--accent-gold-dim`): `rgba(212, 165, 116, 0.15)` - Subtle gold background tint

#### Status Colors
- **Success** (`--success`): `#4a9d7c` - Green, for correct answers and success states
- **Success Glow** (`--success-glow`): `rgba(74, 157, 124, 0.3)` - Green glow effect

#### Border & Shadow
- **Border Subtle** (`--border-subtle`): `rgba(255, 255, 255, 0.06)` - Very subtle white border
- **Shadow Deep** (`--shadow-deep`): `0 25px 50px -12px rgba(0, 0, 0, 0.5)` - Deep shadow for elevation

### Typography

#### Font Families
- **Primary Font**: `'Zen Kaku Gothic New'` (sans-serif)
  - Weights: 400 (regular), 500 (medium), 700 (bold)
  - Used for: Body text, buttons, inputs, UI elements
  
- **Secondary Font**: `'Crimson Pro'` (serif)
  - Weights: 400 (regular), 500 (medium)
  - Used for: Subtitles, decorative text

#### Font Sizes
- **Landing Title**: `clamp(3rem, 8vw, 6rem)` - Responsive large title
- **Dashboard Title**: `clamp(2.5rem, 6vw, 4rem)` - Responsive dashboard heading
- **Character Display**: `clamp(8rem, 30vw, 14rem)` - Massive character display
- **Input Text**: `2.5rem` - Large, readable input text
- **Body Text**: `1rem` (16px base) - Standard body text
- **Small Text**: `0.75rem - 0.9rem` - Labels, hints, metadata

### Background Effects

#### Gradient Overlay
The body has a subtle animated gradient overlay created with pseudo-element:
```css
background:
  radial-gradient(ellipse 80% 50% at 50% -20%, rgba(196, 30, 58, 0.08), transparent),
  radial-gradient(ellipse 60% 40% at 80% 100%, rgba(212, 165, 116, 0.05), transparent);
```
- Red gradient at top center (subtle)
- Gold gradient at bottom right (very subtle)
- Creates depth without distraction

### Animations

#### Entry Animations
1. **fadeInUp** - Elements slide up while fading in
   - Duration: `0.6s - 0.8s`
   - Easing: `ease-out`
   - Used for: Page sections, cards, inputs
   - Transform: `translateY(20px)` → `translateY(0)`

2. **fadeInDown** - Elements slide down while fading in
   - Duration: `0.6s`
   - Easing: `ease-out`
   - Used for: Headers, top navigation
   - Transform: `translateY(-20px)` → `translateY(0)`

3. **fadeInScale** - Elements scale up while fading in
   - Duration: `0.3s - 0.5s`
   - Easing: `ease-out`
   - Used for: Character cards, badges
   - Transform: `scale(0.95)` → `scale(1)`

4. **characterEnter** - Character-specific entrance with rotation
   - Duration: `0.4s`
   - Easing: `cubic-bezier(0.34, 1.56, 0.64, 1)` (bouncy)
   - Used for: New character appearance
   - Transform: `scale(0.8) rotate(-5deg)` → `scale(1) rotate(0deg)`

#### Interactive Animations
1. **float** - Continuous floating motion
   - Duration: `6s`
   - Easing: `ease-in-out`
   - Loop: Infinite
   - Used for: Decorative background elements (kanji)
   - Transform: `translateY(0)` → `translateY(-20px)` → `translateY(0)`

2. **shake** - Horizontal shake for errors
   - Duration: `0.5s`
   - Easing: `ease-out`
   - Used for: Error states, incorrect input
   - Transform: `translateX(0)` → `translateX(-8px)` → `translateX(8px)` → `translateX(0)`

3. **pulseSuccess** - Subtle scale pulse for success
   - Duration: `0.5s`
   - Easing: `ease-out`
   - Used for: Correct answer feedback
   - Transform: `scale(1)` → `scale(1.05)` → `scale(1)`

#### Hover & Interaction Effects
- **Card Hover**: `translateY(-4px to -8px)` with shadow increase
- **Button Hover**: Border color change + glow effect (`box-shadow: 0 0 0 4px`)
- **Input Focus**: Border color change + glow ring
- **Active States**: `scale(0.98)` for tactile feedback

### UI Components

#### Character Display Card
- **Size**: `min(90vw, 400px)` square (aspect-ratio: 1)
- **Background**: Card background with subtle border
- **Border**: 1px subtle border with animated gradient overlay on hover
- **Shadow**: Deep shadow for elevation
- **Animation**: Fade in with scale on appearance
- **Special Effect**: Gradient border overlay using CSS mask technique

#### Input Fields
- **Size**: `min(90vw, 280px)` width
- **Padding**: `1rem 1.5rem`
- **Font Size**: `2.5rem` (large for readability)
- **Border**: 2px, changes color on focus/error/success
- **Focus Ring**: 4px glow effect matching border color
- **Caret Color**: Gold accent
- **States**:
  - Default: Subtle border
  - Focus: Gold border + gold glow
  - Error: Red border + red background tint + shake animation
  - Success: Green border + green glow

#### Multiple Choice Buttons
- **Layout**: 2-column grid
- **Size**: `min(90vw, 400px)` container
- **Button Height**: Minimum 60px
- **Font Size**: `1.5rem`
- **States**:
  - Default: Card background with subtle border
  - Hover: Gold border + gold glow
  - Active: `scale(0.98)` for press feedback
  - Correct: Green border + green background tint
  - Disabled: 50% opacity, no pointer events

#### Timer Ring
- **Size**: 52px × 52px
- **Position**: Absolute, top-right of character card
- **Style**: Circular progress indicator
- **Colors**: 
  - Background: Subtle border color
  - Progress: Gold (changes to red when ≤2 seconds)
- **Animation**: Smooth stroke-dashoffset transition (1s linear)
- **Text**: Centered countdown number

#### Filter Chips
- **Style**: Pill-shaped buttons
- **Size**: `0.5rem 1.25rem` padding
- **Font Size**: `0.85rem`
- **States**:
  - Default: Card background, subtle border
  - Hover: Gold border tint, text brightens
  - Active: Gold background tint, gold border, gold text

#### Stats Display
- **Layout**: Horizontal flex with gaps
- **Values**: Large (2rem), bold (700)
- **Correct Count**: Green color
- **Labels**: Small (0.75rem), uppercase, letter-spaced
- **Divider**: Muted color "/" separator

#### Streak Badge
- **Style**: Pill-shaped with gradient background
- **Icon**: Fire emoji (🔥) as ::before pseudo-element
- **Animation**: Fade in with scale
- **Visibility**: Only shown when streak ≥ 3

#### Module Cards (Dashboard)
- **Size**: Minimum 280px width, auto-fit grid
- **Padding**: `2rem`
- **Border Radius**: `12px`
- **Hover Effect**: 
  - Lift: `translateY(-8px)`
  - Shadow: Deep shadow
  - Border: Gold accent
  - Gradient border overlay appears
- **Animation**: Staggered fade-in-up (0.1s, 0.2s delays)

### Responsive Design

#### Breakpoint: 640px (Mobile)
- Container padding: `2rem` → `1rem`
- Character card: `90vw` → `85vw`
- Font sizes: Reduced by ~20%
- Button padding: Slightly reduced
- Grid layouts: Single column for modules
- Stats: 2-column grid instead of auto-fit

### Accessibility

- **Focus Visible**: 2px gold outline with 2px offset
- **Selection**: Red background with white text
- **Contrast**: All text meets WCAG AA standards
- **Touch Targets**: Minimum 44px × 44px for mobile
- **Keyboard Navigation**: Full support with visible focus states

### Design Principles

1. **Dark First**: Deep dark backgrounds reduce eye strain
2. **Warm Accents**: Gold and red provide warmth against cool backgrounds
3. **Subtle Motion**: Animations enhance UX without being distracting
4. **Clear Hierarchy**: Size, weight, and color create clear information hierarchy
5. **Tactile Feedback**: All interactions provide visual/kinetic feedback
6. **Elegant Simplicity**: Clean lines, generous spacing, minimal decoration

## Internationalization (i18n)

The application should support multiple languages to make Japanese learning accessible to users worldwide. The following languages should be prioritized based on global usage and Japanese learning popularity:

### Supported Languages (Priority Order)

1. **English** (en) - Default language
2. **Spanish** (es) - 500+ million speakers
3. **Chinese (Simplified)** (zh-CN) - 1+ billion speakers, high Japanese learning interest
4. **Portuguese** (pt) - 250+ million speakers
5. **French** (fr) - 280+ million speakers
6. **German** (de) - 130+ million speakers
7. **Russian** (ru) - 260+ million speakers
8. **Japanese** (ja) - Native language for reference
9. **Korean** (ko) - High Japanese learning interest
10. **Italian** (it) - 85+ million speakers
11. **Arabic** (ar) - 400+ million speakers
12. **Hindi** (hi) - 600+ million speakers

### Internationalization Scope

#### UI Elements to Translate
- **Navigation**: Menu items, back buttons, dashboard links
- **Module Names**: "Alphabet", "Vocabulary", "Kanji", "Grammar", "Reading", "Listening"
- **Module Descriptions**: Short descriptions for each learning module
- **Buttons**: "Start", "Next", "Previous", "Check Answer", "Submit", etc.
- **Labels**: Filter labels (Gojūon, Yōon, Dakuten), practice mode labels
- **Stats Labels**: "Correct", "Total", "Streak", "Day Streak", "Words Learned", etc.
- **Messages**: Success/error messages, feedback text
- **Dashboard**: Title, subtitle, stat card labels
- **Settings**: All settings labels and descriptions
- **Help Text**: Hints, instructions, tooltips

#### Content NOT to Translate
- **Japanese Characters**: Hiragana, Katakana, Kanji remain in Japanese
- **Romaji**: Romanized Japanese remains as-is
- **Japanese Vocabulary**: Word meanings should be translated, but Japanese text stays
- **Character Names**: Technical terms like "Gojūon", "Yōon" may remain (with explanations)

### Technical Implementation

#### Language Detection
- **Primary**: Browser language detection (`navigator.language`)
- **Fallback**: User preference stored in localStorage
- **Default**: English if language not supported

#### Storage
- Language preference stored in localStorage: `japanese_trainer_language`
- Persists across sessions
- Can be changed in settings

#### Translation Files
- Format: JSON files per language (`locales/en.json`, `locales/es.json`, etc.)
- Structure: Nested objects matching component hierarchy
- Example:
  ```json
  {
    "common": {
      "start": "Start",
      "next": "Next",
      "previous": "Previous"
    },
    "modules": {
      "alphabet": {
        "title": "Alphabet",
        "description": "Master Hiragana & Katakana"
      }
    }
  }
  ```

#### Implementation Approach
- **Next.js i18n**: Use Next.js built-in internationalization routing
- **React Context**: Language context provider for app-wide access
- **Dynamic Imports**: Load translation files on demand
- **RTL Support**: Consider right-to-left languages (Arabic, Hebrew) for future

### Language Switcher

#### Location
- **Dashboard**: Top-right corner or settings menu
- **All Pages**: Accessible via navigation or settings

#### UI Design
- Dropdown or button group
- Shows current language flag/name
- Lists all available languages
- Instant language switch without page reload

### Future Considerations

- **Regional Variants**: Support for regional differences (e.g., es-ES vs es-MX, pt-BR vs pt-PT)
- **Pluralization**: Proper handling of plural forms per language
- **Date/Time Formatting**: Locale-specific date and time formats
- **Number Formatting**: Locale-specific number formats
- **Currency**: If monetization features are added
- **Right-to-Left (RTL)**: Full RTL support for Arabic, Hebrew

## Hosting

- **Platform**: GitHub Pages
- **Domain**: japanese.renner.dev
- **Deployment**: Automatic on push to master branch
