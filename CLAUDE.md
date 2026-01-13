# CLAUDE.md

This file provides guidance for AI assistants working on the Japanese Trainer codebase.

## Project Overview

A lightweight, browser-based Japanese alphabet learning application. Users practice recognizing Hiragana and Katakana characters by typing the corresponding Romaji.

**Live URL**: https://japanese.renner.dev

## Tech Stack

- **Next.js** (v16.1.1) - React framework with TypeScript
- **TypeScript** - Type-safe development
- **Wanakana.js** (v5.0.2) - Hiragana/Katakana conversion library
- **ElevenLabs TTS** - High-quality Japanese text-to-speech (primary)
- **Web Speech API** - Browser-native text-to-speech fallback
- **Convex** - Backend-as-a-service for user data and progress
- **GitHub Pages** - Static hosting

## Project Structure

```
japanese-trainer/
├── src/                    # Next.js source code
│   ├── app/               # Next.js app router pages
│   ├── components/        # React components
│   ├── hooks/             # Custom React hooks (useTTS, etc.)
│   ├── types/             # TypeScript type definitions
│   ├── data/              # Data files (characters, vocabulary, etc.)
│   └── lib/               # Utility libraries
├── tools/                  # CLI tools for data generation
│   ├── tts-generator.ts   # ElevenLabs TTS audio generation tool
│   └── lib/               # Tool utilities
├── public/                 # Static assets
│   └── audio/             # Generated TTS audio files
├── data/                   # Source data files (JSON)
└── convex/                 # Convex backend functions
```

## Key Code Locations

- **Character database**: `learn_alphabet.js` - `characters[]` array (lines 1-650+)
- **Mobile detection**: `learn_alphabet.js` - `isMobileDevice()` function
- **Input validation**: `learn_alphabet.js` - `checkInput()` and `checkMultipleChoice()` functions
- **Multiple choice generation**: `learn_alphabet.js` - `generateMultipleChoiceOptions()` function
- **TTS pronunciation**: `src/hooks/useTTS.ts` - React hook with ElevenLabs TTS and Web Speech API fallback
- **ElevenLabs TTS integration**: `src/hooks/useTTS.ts` - Primary TTS using pre-generated audio files
- **Audio generation tools**: `tools/tts-generator.ts` - CLI tool for generating ElevenLabs audio files
- **Character selection**: `learn_alphabet.js` - `next()` function
- **Timer logic**: `learn_alphabet.js` - `startTimer()` function

## Development Notes

### Build Process
This is a Next.js TypeScript project. Run `npm run dev` for development or `npm run build` for production.

### TTS Audio Generation
The project uses ElevenLabs for high-quality Japanese TTS. Audio files are pre-generated using CLI tools:

```bash
npm run generate-audio -- --type all --update-json
```

See `tools/README.md` for detailed usage instructions. Audio files are stored in `public/audio/` and referenced via `audioUrl` fields in data structures.

### Testing Changes
1. Open `learn_alphabet.html` in a browser
2. Test with different character type filters (Gojūon, Yōon, Dakuten)
3. Verify TTS works in Chrome/Safari/Edge
4. Test mobile mode using browser DevTools device emulation
5. Enable debug mode: `window.DEBUG_MOBILE = true` in console (see DEBUGGING.md)

### Character Data Structure
Each character entry in the `characters[]` array follows this format:
```typescript
{ romaji: "ka", hiragana: "か", type: "gojuon", audioUrl?: string }
```
Note: Katakana conversion happens via Wanakana.js at runtime. `audioUrl` is optional and points to pre-generated ElevenLabs audio files.

### Character Types
- `gojuon` - Basic 50-sound syllabary
- `yoon` - Palatalized sounds (きゃ, しゃ, etc.)
- `dakuten` - Voiced consonants (が, ざ, etc.)
- `handakuten` - Semi-voiced consonants (ぱ, ぴ, etc.)

## Common Tasks

### Adding New Characters
Add entries to the `characters[]` array in `learn_alphabet.js` with appropriate `type` value.

### Modifying Timer Duration
Change `timePerCharakter` variable (default: 5 seconds).

### Styling Changes
Edit `style.css` - uses flexbox for centering, large font sizes for readability.

### Mobile Multiple Choice Feature
- **Detection**: Uses user agent, touch capability, and screen width (< 768px)
- **UI Switching**: Automatically shows/hides text input vs multiple choice buttons
- **Option Generation**: Creates 4 options (1 correct + 3 random incorrect) from available characters
- **Debug Mode**: Set `window.DEBUG_MOBILE = true` for detailed console logging
- See `DEBUGGING.md` for testing and troubleshooting guide

## TTS System

### ElevenLabs Integration
- **Primary TTS**: ElevenLabs API with `eleven_v3` and `language_code: "ja"` for native Japanese pronunciation.
- **Local TTS**: Kokoro TTS (recommended) with native voices (`jf_alpha`, `jf_tebukuro`) and 500ms trailing silence.
- **Audio Files**: Pre-generated MP3 files stored in `public/audio/`.
- **Data Structure**: All learning data types support optional `audioUrl` field.
- **Fallback**: Web Speech API used when `audioUrl` is missing or fails to load.

### Generating Audio Files
Use the TypeScript CLI tool to generate audio:

```bash
# Generate audio for all data types (ElevenLabs default)
npm run generate-audio -- --type all --update-json

# Generate using Kokoro (Local high-quality)
npm run generate-audio -- --provider kokoro --kokoro-voice jf_tebukuro --type all --update-json

# Dry run to preview
npm run generate-audio -- --type all --dry-run
```

**Requirements:**
- ElevenLabs: API key in `.env` (`ELEVENLABS_API_KEY`).
- Kokoro: Python environment with `kokoro-tts-tool` installed.

**Audio Organization:**
- `public/audio/characters/` - Hiragana/Katakana character audio
- `public/audio/vocabulary/` - Vocabulary word audio
- `public/audio/grammar/` - Grammar example sentence audio
- `public/audio/kanji/` - Kanji reading and example audio

## Deployment

Push to `master` branch - GitHub Pages auto-deploys from master to japanese.renner.dev.
