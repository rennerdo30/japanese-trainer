# Murmura

*From whispers to fluency* - A comprehensive, browser-based language learning application.

**Live Demo**: [https://japanese.renner.dev](https://japanese.renner.dev)

## Supported Languages

| Language | Framework | Features |
|----------|-----------|----------|
| Japanese | JLPT (N5-N1) | Hiragana, Katakana, Kanji, Vocabulary, Grammar, Reading, Listening |
| Korean | TOPIK (1-6) | Hangul, Vocabulary, Grammar, Reading, Listening |
| Chinese | HSK (1-6) | Hanzi, Vocabulary, Grammar, Reading, Listening |
| Spanish | CEFR (A1-C2) | Vocabulary, Grammar, Reading, Listening |
| German | CEFR (A1-C2) | Vocabulary, Grammar, Reading, Listening |
| Italian | CEFR (A1-C2) | Vocabulary, Grammar, Reading, Listening |
| English | CEFR (A1-C2) | Vocabulary, Grammar, Reading, Listening |

## Features

- **Multi-Language Support**: Learn 7 languages with culturally-themed interfaces
- **Structured Learning Paths**: JLPT, CEFR, HSK, and TOPIK progression tracks
- **Character Systems**: Hiragana, Katakana, Hangul, Kanji, and Hanzi practice
- **Adaptive Input Methods**:
  - **Desktop**: Type answers with keyboard
  - **Mobile**: Touch-friendly multiple choice
- **Spaced Repetition**: SRS-based review system for optimal retention
- **Progress Tracking**: Persistent stats with Convex backend
- **Text-to-Speech**: High-quality pronunciation with ElevenLabs
- **Offline Support**: Works without internet after initial load

## Tech Stack

- **Next.js** (v16.1.1) - React framework with App Router
- **TypeScript** - Type-safe development
- **Convex** - Backend for user data and authentication
- **ElevenLabs/Kokoro TTS** - High-quality text-to-speech
- **GitHub Pages** - Static hosting

## Getting Started

### Local Development

1. Clone the repository and install dependencies:
```bash
git clone https://github.com/rennerdo30/murmura.git
cd murmura
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000)

### Environment Variables

Create a `.env.local` file:
```env
CONVEX_DEPLOYMENT=dev:your-deployment
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
ELEVENLABS_API_KEY=sk_...  # Optional, for audio generation
```

## Project Structure

```
murmura/
├── src/
│   ├── app/                # Next.js App Router pages
│   ├── components/         # React components
│   ├── hooks/              # Custom React hooks
│   ├── context/            # React Context providers
│   ├── data/               # Language data (JSON)
│   │   ├── ja/             # Japanese
│   │   ├── ko/             # Korean
│   │   ├── zh/             # Chinese
│   │   └── ...
│   ├── lib/                # Utilities
│   ├── styles/             # CSS and themes
│   └── types/              # TypeScript types
├── convex/                 # Backend functions
├── public/                 # Static assets & audio
└── tools/                  # CLI utilities
```

## Deployment

Deployed automatically to GitHub Pages on push to `master`.

```bash
npm run deploy  # Deploy Convex + build frontend
```

## Contributing

Contributions welcome! See [SPECIFICATION.md](SPECIFICATION.md) for design guidelines.

## License

Open source for educational purposes.

## Acknowledgments

- [Wanakana.js](https://github.com/WaniKani/WanaKana) - Japanese character conversion
- [Convex](https://convex.dev) - Backend platform
- [ElevenLabs](https://elevenlabs.io) - Text-to-speech

---

Made with care for language learners everywhere
