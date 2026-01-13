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
- Uses native Japanese voice (Web Speech API)
- Helps reinforce audio-visual association

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
| Wanakana.js | 5.0.2 | Hiragana to Katakana conversion |

### Character Database
- **Total entries**: 656+ character combinations
- **Storage**: Embedded JavaScript array
- **Format**: `{ romaji, hiragana, katakana, type }`

### Performance
- No build step required
- Minimal file sizes (~15KB total JS)
- Instant page load

## Data Model

### Character Object
```javascript
{
  romaji: string,      // Romanized pronunciation ("ka", "shi", "tsu")
  hiragana: string,    // Hiragana character ("か", "し", "つ")
  katakana: string,    // Empty string (converted at runtime)
  type: string         // "gojuon" | "yoon" | "dakuten" | "handakuten"
}
```

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

## Future Enhancement Possibilities

- Persistent score storage (localStorage)
- Kanji learning mode
- Vocabulary/word training
- Spaced repetition system
- Mobile app version
- Progress statistics/history
- Difficulty levels
- Sound effects

## Hosting

- **Platform**: GitHub Pages
- **Domain**: japanese.renner.dev
- **Deployment**: Automatic on push to master branch
