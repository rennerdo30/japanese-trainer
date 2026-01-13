# CLAUDE.md

This file provides guidance for AI assistants working on the Japanese Trainer codebase.

## Project Overview

A lightweight, browser-based Japanese alphabet learning application. Users practice recognizing Hiragana and Katakana characters by typing the corresponding Romaji.

**Live URL**: https://japanese.renner.dev

## Tech Stack

- **Vanilla HTML/CSS/JavaScript** - No build process or frameworks
- **Wanakana.js** (v5.0.2) - Hiragana/Katakana conversion library (loaded via CDN)
- **Web Speech API** - Browser-native text-to-speech for pronunciation
- **GitHub Pages** - Static hosting

## Project Structure

```
japanese-trainer/
├── index.html              # Landing page
├── learn_alphabet.html     # Main training interface
├── learn_alphabet.js       # Core application logic
├── style.css               # Styling
└── CNAME                   # GitHub Pages domain config
```

## Key Code Locations

- **Character database**: `learn_alphabet.js` - `characters[]` array (lines 1-650+)
- **Mobile detection**: `learn_alphabet.js` - `isMobileDevice()` function
- **Input validation**: `learn_alphabet.js` - `checkInput()` and `checkMultipleChoice()` functions
- **Multiple choice generation**: `learn_alphabet.js` - `generateMultipleChoiceOptions()` function
- **TTS pronunciation**: `learn_alphabet.js` - `speak()` function
- **Character selection**: `learn_alphabet.js` - `next()` function
- **Timer logic**: `learn_alphabet.js` - `startTimer()` function

## Development Notes

### No Build Process
This is a static site. Simply edit files and refresh the browser. No npm/yarn required.

### Testing Changes
1. Open `learn_alphabet.html` in a browser
2. Test with different character type filters (Gojūon, Yōon, Dakuten)
3. Verify TTS works in Chrome/Safari/Edge
4. Test mobile mode using browser DevTools device emulation
5. Enable debug mode: `window.DEBUG_MOBILE = true` in console (see DEBUGGING.md)

### Character Data Structure
Each character entry in the `characters[]` array follows this format:
```javascript
{ romaji: "ka", hiragana: "か", type: "gojuon" }
```
Note: Katakana conversion happens via Wanakana.js at runtime.

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

## Deployment

Push to `master` branch - GitHub Pages auto-deploys from master to japanese.renner.dev.
