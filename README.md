# Japanese Trainer 🎌

A lightweight, browser-based Japanese alphabet learning application. Practice recognizing Hiragana and Katakana characters by typing the corresponding Romaji.

**🌐 Live Demo**: [https://japanese.renner.dev](https://japanese.renner.dev)

## Features

- **Dual Alphabet Support**: Practice both Hiragana and Katakana
- **Character Type Filtering**: Focus on specific character sets:
  - **Gojūon** (五十音) - Basic 46 characters
  - **Yōon** (拗音) - Palatalized combinations (きゃ, しゅ, ちょ)
  - **Dakuten** (濁音) - Voiced consonants (が, ざ, だ)
  - **Handakuten** (半濁音) - Semi-voiced sounds (ぱ, ぴ, ぷ)
- **Adaptive Input Methods**:
  - **Desktop**: Type Romaji to match displayed characters
  - **Mobile**: Multiple choice buttons (4 options) for touch-friendly interaction
- **Smart Mobile Detection**: Automatically switches to multiple choice on mobile devices
- **Timer System**: 5-second countdown per character for timed practice
- **Text-to-Speech**: Automatic pronunciation using Web Speech API
- **Progress Tracking**: Real-time score display (correct/total)
- **Streak Counter**: Track consecutive correct answers
- **No Build Process**: Pure vanilla JavaScript - just open and learn!

## Tech Stack

- **Vanilla HTML/CSS/JavaScript** - No frameworks or build tools
- **Wanakana.js** (v5.0.2) - Hiragana/Katakana conversion library
- **Web Speech API** - Browser-native text-to-speech
- **GitHub Pages** - Static hosting

## Getting Started

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/rennerdo30/japanese-trainer.git
cd japanese-trainer
```

2. Open `index.html` in your browser - that's it! No build process required.

### Usage

1. Visit the [live site](https://japanese.renner.dev) or open `index.html` locally
2. Click "Begin Practice"
3. Select your preferred alphabet (Hiragana or Katakana)
4. Choose character type filters (Gojūon, Yōon, Dakuten)
5. Type the Romaji equivalent for each displayed character
6. Get instant feedback and hear pronunciation on correct answers

## Project Structure

```
japanese-trainer/
├── index.html              # Landing page
├── learn_alphabet.html     # Main training interface
├── learn_alphabet.js       # Core application logic (character database + quiz logic)
├── style.css               # Styling
├── CNAME                   # GitHub Pages domain configuration
├── DEBUGGING.md            # Debugging guide for mobile features
└── README.md               # This file
```

## Character Database

The application includes 656+ character combinations stored in `learn_alphabet.js`. Each entry follows this format:

```javascript
{
  romaji: "ka",           // Romanized pronunciation
  hiragana: "か",         // Hiragana character
  type: "gojuon"          // Character type classification
}
```

Katakana conversion is handled automatically at runtime using Wanakana.js.

## Browser Compatibility

- ✅ Chrome/Edge (full TTS support)
- ✅ Safari (full TTS support)
- ✅ Firefox (TTS may vary by OS)
- ✅ Modern browsers with ES6 support

## Deployment

This project is automatically deployed to GitHub Pages on every push to the `master` branch.

- **Live URL**: https://japanese.renner.dev
- **GitHub Pages**: Configured via repository settings
- **Custom Domain**: Managed via `CNAME` file

## Contributing

Contributions are welcome! This is a simple static site, so:

1. Fork the repository
2. Make your changes
3. Test locally by opening `index.html` in a browser
4. Submit a pull request

### Common Contribution Ideas

- Adding more character combinations
- Improving UI/UX
- Adding new features (see [SPECIFICATION.md](SPECIFICATION.md) for ideas)
- Bug fixes
- Performance optimizations

## License

This project is open source and available for educational purposes.

## Acknowledgments

- [Wanakana.js](https://github.com/WaniKani/WanaKana) for Hiragana/Katakana conversion
- Web Speech API for pronunciation support

---

Made with ❤️ for Japanese language learners
