# TTS Audio Generation Tools

TypeScript CLI tools for generating high-quality Japanese text-to-speech audio files using multiple TTS providers (ElevenLabs, Piper TTS, or macOS say).

## Overview

These tools generate audio files for all learning data types (characters, vocabulary, grammar, kanji) and update the JSON data files with audio URLs. The generated audio files are stored locally and can be served via CDN.

## TTS Providers

The tool supports four TTS providers:

1. **Kokoro TTS** (recommended) - Best quality local TTS, 82M parameters, native Apple Silicon support, 54 voices
2. **ElevenLabs** (default) - High-quality cloud-based TTS, requires API key
3. **Piper TTS** - Free, local neural TTS (still functional but repository archived Oct 2025)
4. **macOS say** - Free built-in macOS TTS (lower quality but no setup needed)

## Prerequisites

### For All Providers
- **Node.js**: Version 18 or higher
- **Dependencies**: Install project dependencies with `npm install`

### For ElevenLabs Provider
- **ElevenLabs API Key**: Sign up at [https://elevenlabs.io](https://elevenlabs.io) and get your API key

### For Piper TTS Provider
- **Piper TTS**: Install via PyPI: `pip install piper-tts` (or use pre-built binaries)
  - ⚠️ **Note**: The original repository was archived in Oct 2025. Piper is still functional but no longer actively maintained.
  - Alternative: Download pre-built binaries from [community builds](https://github.com/itsabhishekolkha/piper-x64-build)
- **Japanese Model**: **Automatically downloaded from Hugging Face on first use!**
  - Just specify a model name (e.g., `ja_JP-shinji-medium`) and Piper will download it automatically
  - Recommended models: `ja_JP-shinji-medium` or `ja_JP-shinji-high`
  - Models are stored in `~/.local/share/piper/voices/` after download
  - Manual download also available from [Piper Voices](https://www.nadobots.com/piper/) or [Hugging Face](https://huggingface.co/rhasspy/piper-voices)

### For Kokoro TTS Provider (Recommended - Best Quality)
- **Kokoro v1.0**: Currently the best option for local Japanese TTS on macOS
  - **Installation**: `pip install kokoro-tts-tool` (or `uv tool install kokoro-tts-tool`)
  - **Initialization**: Run `kokoro-tts-tool init` on first use (downloads models ~350MB)
  - **Advantages**: 
    - Superior quality with 82M parameters (lightweight yet high-quality)
    - Native Japanese support with optimized voices (`jf_alpha`, `jf_tebukuro`)
    - Optimized for Apple Silicon (M1/M2/M3+)
    - **Trailing Silence**: Automatically adds 500ms silence to prevent audio clipping
    - Actively maintained (released Jan 2025)

### For macOS say Provider
- **macOS**: Only available on macOS systems

## Setup

### Option 1: Kokoro TTS (Recommended - Best Quality, Free & Local)

**Automated Setup (Recommended):**

**⚠️ Python Version Requirement:** Kokoro TTS requires Python 3.13 exactly:
- `kokoro-tts-tool` requires Python >=3.13
- `kokoro-onnx` (dependency) requires Python >=3.12,<3.14
- **So you need Python 3.13** (3.12 is too old, 3.14 is too new)

If you don't have Python 3.13, install it first:
```bash
# On macOS with Homebrew:
brew install python@3.13

# Or with conda:
conda create -n kokoro python=3.13
conda activate kokoro
```

Then run the setup script:

```bash
npm run setup-kokoro
# Or directly:
./tools/setup-kokoro.sh
```

This script will:
1. Detect and use Python 3.13 (or exit with clear error if not found)
2. Create a Python virtual environment (`.kokoro-venv/`)
3. Install `kokoro-tts-tool` in the venv
4. Initialize Kokoro (downloads models ~350MB)
5. List available voices

**Manual Setup (Alternative):**

If you prefer to install globally or use a different method:

1. **Install Kokoro TTS**:
   ```bash
   pip install kokoro-tts-tool
   # Or using uv:
   uv tool install kokoro-tts-tool
   ```

2. **Initialize Kokoro** (downloads models on first run, ~350MB):
   ```bash
   kokoro-tts-tool init
   ```

3. **List available voices** (optional):
   ```bash
   kokoro-tts-tool list-voices
   ```

**Generate audio** (works with both automated and manual setup):
```bash
npm run generate-audio -- --provider kokoro --type all --update-json
```

**Note**: 
- The automated setup uses a virtual environment to avoid polluting your global Python
- Models are automatically downloaded during initialization and cached locally
- The tool automatically detects and uses the venv if available

### Option 2: Piper TTS (Free & High Quality, but Repository Archived)

**Note**: The original Piper repository was archived in Oct 2025, but Piper TTS is still available and functional.

1. **Install Piper TTS** (choose one method):

   **Method A: PyPI (Recommended)**:
   ```bash
   pip install piper-tts
   ```

   **Method B: Pre-built Binaries** (for Intel Macs):
   ```bash
   # Download from: https://github.com/itsabhishekolkha/piper-x64-build/releases
   # Extract and add to PATH, or use full path to piper binary
   ```

2. **Generate audio** (model will be auto-downloaded from Hugging Face):
   ```bash
   npm run generate-audio -- --provider piper --type all --update-json
   ```
   
   The first time you run this, Piper will automatically download the Japanese model (`ja_JP-shinji-medium` by default) from Hugging Face. This may take a few minutes depending on your internet connection.

3. **Optional: Verify Installation**:
   ```bash
   piper --version
   # or if using PyPI:
   python -m piper --version
   ```

**Note**: Models are automatically downloaded from Hugging Face and stored in `~/.local/share/piper/voices/`. No manual download needed!

**⚠️ Important**: While Piper still works, the repository was archived in Oct 2025. For the best quality, use **Kokoro TTS** (see Option 1 above - Kokoro TTS).

### Option 3: ElevenLabs (Cloud-based)

1. **Create `.env` file** (copy from `.env.example` if it exists):
   ```bash
   ELEVENLABS_API_KEY=your_api_key_here
   ELEVENLABS_VOICE_ID=your_voice_id_here  # Optional
   ELEVENLABS_MODEL_ID=your_model_id_here   # Optional
   ```

2. **Generate audio**:
   ```bash
   npm run generate-audio -- --provider elevenlabs --type all --update-json
   ```

### Option 4: macOS say (Built-in, Lower Quality)

1. **Generate audio** (no setup needed on macOS):
   ```bash
   npm run generate-audio -- --provider macos-say --type all --update-json
   ```

### Export Character Data (if needed)
```bash
npm run generate-audio -- --type characters --dry-run
# If characters fail to load, run:
tsx tools/export-characters.ts
```

## Usage

### Basic Usage

Generate audio for all data types:
```bash
npm run generate-audio -- --type all --update-json
```

Generate audio for specific type:
```bash
npm run generate-audio -- --type vocabulary --update-json
```

### Command Options

- `--type <type>`: Data type to generate (`characters|vocabulary|grammar|kanji|all`)
- `--output <path>`: Output directory (default: `public/audio`)
- `--provider <provider>`: TTS provider (`elevenlabs|kokoro|piper|macos-say`, default: `elevenlabs`)
- `--concurrency <number>`: Number of concurrent workers for parallel generation (default: 4, max: 16)
- `--update-json`: Update JSON files with audio URLs after generation
- `--dry-run`: Preview tasks without generating audio

**ElevenLabs Options:**
- `--api-key <key>`: ElevenLabs API key (or use `ELEVENLABS_API_KEY` env var)
- `--voice-id <id>`: ElevenLabs voice ID (or use `ELEVENLABS_VOICE_ID` env var)
- `--model-id <id>`: ElevenLabs model ID (or use `ELEVENLABS_MODEL_ID` env var)

**Kokoro TTS Options:**
- `--kokoro-voice <voice>`: Kokoro voice name (default: `jf_alpha`)

**Piper TTS Options:**
- `--piper-model <path>`: Piper model path or name (default: `ja_JP-shinji-medium`)

**macOS say Options:**
- `--macos-voice <voice>`: macOS voice name (e.g., `Kyoko`, `Otoya`, default: `Kyoko`)

### Examples

**Preview what will be generated:**
```bash
npm run generate-audio -- --type all --dry-run
```

**Generate vocabulary audio only:**
```bash
npm run generate-audio -- --type vocabulary --update-json
```

**Generate with custom output directory:**
```bash
npm run generate-audio -- --type all --output custom/audio --update-json
```

**Generate with API key from command line:**
```bash
npm run generate-audio -- --provider elevenlabs --type all --api-key YOUR_KEY --update-json
```

**Generate with Kokoro TTS (best quality, free, local):**
```bash
npm run generate-audio -- --provider kokoro --type all --update-json
```

**Generate with custom Kokoro voice:**
```bash
npm run generate-audio -- --provider kokoro --kokoro-voice jf_alpha --type all --update-json
```

**Generate with Piper TTS (free, high quality):**
```bash
npm run generate-audio -- --provider piper --type all --update-json
```

**Generate with custom Piper model:**
```bash
npm run generate-audio -- --provider piper --piper-model ~/models/ja_JP-shinji-high.onnx --type all --update-json
```

**Generate with macOS say (free, built-in):**
```bash
npm run generate-audio -- --provider macos-say --macos-voice Otoya --type all --update-json
```

## Audio File Organization

Generated audio files are organized by type:

```
public/
  audio/
    characters/      # Hiragana/Katakana character audio
      {hash}.mp3
    vocabulary/     # Vocabulary word audio
      {id}.mp3
    grammar/        # Grammar example sentence audio
      {id}-{exampleIndex}.mp3
    kanji/          # Kanji reading and example audio
      {id}-{readingType}.mp3
```

## Data Structure Updates

After running with `--update-json`, the following fields are added to data files:

- **Characters**: `audioUrl?: string` (in TypeScript, requires manual update or separate export)
- **Vocabulary**: `audioUrl?: string` in `data/vocabulary.json`
- **Grammar**: `audioUrl?: string` in example objects in `data/grammar.json`
- **Kanji**: `audioUrl?: string` in example objects in `data/kanji.json`

## How It Works

1. **Load Data**: Reads JSON/TypeScript data files
2. **Generate Tasks**: Creates audio generation tasks for each text item
3. **Check Existing**: Skips files that already exist (resume capability)
4. **Generate Audio**: Calls selected TTS provider (ElevenLabs API, Piper TTS, or macOS say) to generate audio files
5. **Save Files**: Saves audio files (MP3 or WAV) to organized directories
6. **Update JSON**: Updates data files with audio URLs (if `--update-json` is used)

## Error Handling

- **API Errors**: Failed requests are logged and processing continues
- **Rate Limiting**: Built-in delays between requests to respect API limits
- **Resume Capability**: Existing files are skipped, allowing interrupted runs to resume
- **Fallback**: If ElevenLabs audio fails in the app, Web Speech API is used automatically

## Troubleshooting

### Kokoro TTS Provider

**"Kokoro TTS not found" error:**
- Install Kokoro TTS: `pip install kokoro-tts-tool`
- Or using uv: `uv tool install kokoro-tts-tool`
- Verify installation: `kokoro-tts-tool --version`

**"Kokoro TTS not initialized" error:**
- Run initialization: `kokoro-tts-tool init`
- This downloads models (~350MB) on first run
- Models are cached locally after download

**"Voice not found" error:**
- List available voices: `kokoro-tts-tool list-voices`
- Use a valid voice name with `--kokoro-voice` option
- Default voice is `jf_alpha` (Japanese female)

**Audio quality issues:**
- Kokoro v1.0 is optimized for quality - should work well out of the box.
- **Recommended Voice**: Use `--kokoro-voice jf_tebukuro` for a gentle, natural teacher voice.
- **Audio Cutoff**: The tool now defaults to 500ms trailing silence. You can adjust this in `tools/config.ts` if needed.
- Try different native Japanese voices using `--kokoro-voice`.

### ElevenLabs Provider

**"API key required" error:**
- Ensure `.env` file exists with `ELEVENLABS_API_KEY`
- Or pass `--api-key` as command-line argument

**Rate limiting errors:**
- The tool includes delays between requests
- If you hit rate limits, wait and resume (existing files are skipped)
- Consider using Piper TTS provider for unlimited generation

### Piper TTS Provider

**"Piper TTS not found" error:**
- Install Piper TTS via PyPI: `pip install piper-tts`
- Or download pre-built binaries from [community builds](https://github.com/itsabhishekolkha/piper-x64-build)
- Verify installation: `which piper` or `piper --version`
- If using PyPI, you may need to use: `python -m piper` instead of `piper`

**"Model not found" error:**
- Models should be automatically downloaded from Hugging Face on first use
- If auto-download fails:
  - Check your internet connection
  - Ensure you're using the PyPI installation (`pip install piper-tts`)
  - Try specifying the model explicitly: `--piper-model ja_JP-shinji-medium`
- Manual download (if needed):
  - [Piper Voices](https://www.nadobots.com/piper/) (current)
  - [Hugging Face](https://huggingface.co/rhasspy/piper-voices) (official)
  - Place model files in `~/.local/share/piper/voices/` (note: `voices/` not `models/`)
- Recommended models: `ja_JP-shinji-medium` or `ja_JP-shinji-high`

**Audio quality issues:**
- Try a different model (e.g., `-high` instead of `-medium`)
- Adjust model parameters in `tools/config.ts` if needed

### macOS say Provider

**"macOS say command not available" error:**
- This provider only works on macOS
- Verify: `say -v ?` should list available voices

### General Issues

**"Could not load characters" warning:**
- Run `tsx tools/export-characters.ts` to export characters to JSON
- Or ensure `data/characters.json` exists

**Audio files not playing in app:**
- Check that files are in `public/audio/` directory
- Verify audio URLs in JSON files are correct
- Check browser console for loading errors
- App will automatically fallback to Web Speech API
- Note: WAV files work in browsers, but MP3 has better compatibility

## Performance

- **Batch Processing**: Processes all items sequentially with rate limiting
- **Progress Tracking**: Visual progress bar shows generation status
- **Resume Support**: Can safely interrupt and resume generation
- **Statistics**: Summary report shows success/failure counts

## Integration with App

The app's `useTTS` hook automatically:
1. Checks for `audioUrl` in data
2. Plays pre-generated audio (from any provider) if available
3. Falls back to Web Speech API if audio fails or is missing

No code changes needed in components - just ensure data has `audioUrl` fields.

## Cost Considerations

**ElevenLabs Provider:**
- API usage is billed per character
- For large datasets, consider using local TTS providers instead
- Start with `--dry-run` to preview
- Generate in batches by type
- Monitor your ElevenLabs usage dashboard

**Piper TTS Provider:**
- Completely free - no API costs
- Unlimited generation
- Runs entirely offline
- ⚠️ Repository archived (Oct 2025) - still functional but not actively maintained

**Kokoro TTS Provider:**
- Completely free - no API costs
- Superior quality compared to Piper (82M parameters)
- Optimized for Apple Silicon
- Actively maintained (released Jan 2025)
- Unlimited generation
- Runs entirely offline (after initial model download)
- **Recommended** for best local quality

**macOS say Provider:**
- Completely free - built into macOS
- No setup required
- Lower quality than Piper TTS, Kokoro, or ElevenLabs

## Future Enhancements

- Support for CDN upload
- Batch API calls for better performance
- Audio quality options
- Voice selection per data type
- Audio preview before generation

## About TTS Provider Status

**Current Status (2025):**
- **Kokoro v1.0** is now integrated and recommended for local Japanese TTS on macOS, offering the best quality-to-size ratio with 82M parameters and native Apple Silicon optimization.
- **Piper TTS** repository was archived in Oct 2025 but remains functional. The tool still supports Piper for compatibility.
- **ElevenLabs** remains the best cloud-based option for highest quality, but requires API costs.
- **macOS say** is the simplest option with no setup, but lower quality.

For the best local experience, use **Kokoro TTS** - it's now fully integrated and ready to use!
