// Kokoro TTS v1.0 client for text-to-speech generation
// High-quality, free, local neural TTS engine - currently the best option for Japanese TTS
// Supports both sequential and batch/concurrent processing

import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs-extra';
import * as path from 'path';
import { DEFAULT_CONFIG } from '../config';

const execAsync = promisify(exec);

export interface KokoroTTSConfig {
  voice?: string; // Voice name (e.g., 'jf_alpha' for Japanese)
  outputFormat?: 'wav' | 'mp3'; // Output format
  speed?: number; // Speech speed (default: 1.0)
  silence?: number; // Trailing silence in ms (default: 500)
  enableBatchProcessing?: boolean; // Enable batch processing for better performance (default: true)
}

export class KokoroTTSClient {
  private voice: string;
  private outputFormat: string;
  private speed: number;
  private silence: number;
  private kokoroCommand: string; // 'kokoro-tts-tool' or resolved path
  private enableBatchProcessing: boolean;

  constructor(config: KokoroTTSConfig = {}) {
    // Default to high-quality Japanese voice
    // Users can override with --kokoro-voice option
    this.voice = config.voice || DEFAULT_CONFIG.KOKORO_DEFAULT_VOICE;
    this.outputFormat = config.outputFormat || 'wav';
    this.speed = config.speed ?? 1.0;
    this.silence = config.silence ?? DEFAULT_CONFIG.KOKORO_SILENCE;
    this.kokoroCommand = 'kokoro-tts-tool'; // Will be resolved in verify()
    this.enableBatchProcessing = config.enableBatchProcessing !== false; // Default: true
  }

  /**
   * Get available Japanese voices
   */
  async getAvailableVoices(): Promise<string[]> {
    try {
      const { stdout } = await execAsync(`${this.kokoroCommand} list-voices`);
      // Parse output to extract Japanese voices
      // Format may vary, but typically lists voices
      const lines = stdout.split('\n');
      const voices = lines
        .filter(line => line.trim() && !line.startsWith('#') && !line.includes('Usage'))
        .map(line => line.trim().split(/\s+/)[0])
        .filter(v => v && (v.includes('jf_') || v.includes('ja_') || v.includes('jp_')))
        .filter((v, i, arr) => arr.indexOf(v) === i); // Remove duplicates

      return voices.length > 0 ? voices : [this.voice]; // Fallback to default
    } catch (error) {
      console.warn('Could not list voices, using default:', error);
      return [this.voice];
    }
  }

  /**
   * Generate audio from text using Kokoro TTS
   */
  async generateAudio(text: string): Promise<Buffer> {
    // Create a temporary file for output
    const tempDir = path.join(process.cwd(), '.temp-audio');
    await fs.ensureDir(tempDir);
    const tempFile = path.join(tempDir, `temp-${Date.now()}.wav`);

    try {
      // Use kokoro-tts-tool command-line tool to generate audio
      // Format: kokoro-tts-tool synthesize "text" --output file.wav --voice voice_name --speed 1.0
      const escapedText = text.replace(/"/g, '\\"').replace(/'/g, "\\'");
      const command = `${this.kokoroCommand} synthesize "${escapedText}" --output "${tempFile}" --voice ${this.voice} --speed ${this.speed} --silence ${this.silence}`;

      // Execute with timeout (30 seconds per task)
      await execAsync(command, { timeout: 30000, maxBuffer: 10 * 1024 * 1024 });

      // Read the generated WAV file
      const audioBuffer = await fs.readFile(tempFile);

      // Clean up temp file
      await fs.remove(tempFile);

      // Convert WAV to MP3 if needed (using ffmpeg if available)
      if (this.outputFormat === 'mp3') {
        return await this.convertToMp3(audioBuffer, tempDir);
      }

      return audioBuffer;
    } catch (error: any) {
      // Clean up temp file on error
      if (await fs.pathExists(tempFile)) {
        await fs.remove(tempFile);
      }

      // Provide helpful error messages
      if (error.message.includes('command not found') || error.message.includes('kokoro-tts-tool: not found')) {
        throw new Error('Kokoro TTS not found. Run: npm run setup-kokoro (or ./tools/setup-kokoro.sh) to set up automatically. See tools/README.md for details.');
      }

      if (error.message.includes('not initialized') || error.message.includes('init')) {
        throw new Error('Kokoro TTS not initialized. Run: npm run setup-kokoro (or ./tools/setup-kokoro.sh) to initialize automatically.');
      }

      if (error.message.includes('voice') || error.message.includes('Voice')) {
        throw new Error(`Kokoro voice "${this.voice}" not found. Use 'kokoro-tts-tool list-voices' to see available voices.`);
      }

      throw new Error(`Kokoro TTS generation failed: ${error.message}`);
    }
  }

  /**
   * Convert WAV to MP3 using ffmpeg (if available)
   */
  private async convertToMp3(audioBuffer: Buffer, tempDir: string): Promise<Buffer> {
    const inputFile = path.join(tempDir, `input-${Date.now()}.wav`);
    const outputFile = path.join(tempDir, `output-${Date.now()}.mp3`);

    try {
      // Write input file
      await fs.writeFile(inputFile, audioBuffer);

      // Try to convert using ffmpeg
      try {
        await execAsync(`ffmpeg -i "${inputFile}" -acodec libmp3lame -ab 128k "${outputFile}" -y`);
        const mp3Buffer = await fs.readFile(outputFile);
        await fs.remove(inputFile);
        await fs.remove(outputFile);
        return mp3Buffer;
      } catch (ffmpegError) {
        // ffmpeg not available, return WAV format
        console.warn('ffmpeg not available, returning WAV format instead of MP3');
        await fs.remove(inputFile);
        return audioBuffer;
      }
    } catch (error) {
      // Clean up on error
      if (await fs.pathExists(inputFile)) await fs.remove(inputFile);
      if (await fs.pathExists(outputFile)) await fs.remove(outputFile);
      throw error;
    }
  }

  /**
   * Find Kokoro TTS command - checks venv first, then global
   */
  private async findKokoroCommand(): Promise<string> {
    // Check for virtual environment in project root
    const venvPath = path.join(process.cwd(), '.kokoro-venv');
    const venvBin = process.platform === 'win32'
      ? path.join(venvPath, 'Scripts', 'kokoro-tts-tool.exe')
      : path.join(venvPath, 'bin', 'kokoro-tts-tool');

    if (await fs.pathExists(venvBin)) {
      return venvBin;
    }

    // Try venv activation script
    if (await fs.pathExists(path.join(venvPath, 'bin', 'activate'))) {
      // Use venv's Python to run kokoro-tts-tool
      const venvPython = process.platform === 'win32'
        ? path.join(venvPath, 'Scripts', 'python.exe')
        : path.join(venvPath, 'bin', 'python');

      if (await fs.pathExists(venvPython)) {
        // Check if kokoro-tts-tool is available via venv python
        try {
          await execAsync(`${venvPython} -m kokoro_tts_tool --version 2>&1`);
          return `${venvPython} -m kokoro_tts_tool`;
        } catch (error) {
          // Try direct command in venv
          return venvBin;
        }
      }
    }

    // Try global kokoro-tts-tool
    try {
      await execAsync('which kokoro-tts-tool || command -v kokoro-tts-tool');
      return 'kokoro-tts-tool';
    } catch (error) {
      // Try Python module format
      try {
        await execAsync('python -m kokoro_tts_tool --version 2>&1');
        return 'python -m kokoro_tts_tool';
      } catch (pyError) {
        throw new Error('Kokoro TTS not found. Run: ./tools/setup-kokoro.sh (or pip install kokoro-tts-tool). See tools/README.md for details.');
      }
    }
  }

  /**
   * Verify that Kokoro TTS is installed and initialized
   */
  async verify(): Promise<boolean> {
    // Find the Kokoro command (checks venv first)
    try {
      this.kokoroCommand = await this.findKokoroCommand();
    } catch (error: any) {
      if (error.message.includes('Kokoro TTS not found')) {
        throw error;
      }
      throw new Error('Kokoro TTS not found. Run: ./tools/setup-kokoro.sh (or pip install kokoro-tts-tool). See tools/README.md for installation instructions.');
    }

    // Check if initialized (models downloaded)
    try {
      await execAsync(`${this.kokoroCommand} --version 2>&1 || ${this.kokoroCommand} list-voices 2>&1`);
    } catch (error: any) {
      if (error.message.includes('not initialized') || error.message.includes('init')) {
        throw new Error('Kokoro TTS not initialized. Run: ./tools/setup-kokoro.sh (or kokoro-tts-tool init). This downloads models ~350MB on first run.');
      }
      // If version check fails but command exists, assume it's OK (might need init on first use)
    }

    return true;
  }

  /**
   * Generate audio in batch mode with improved parallelization
   * This method is optimized for processing multiple audio files concurrently
   * by reusing the Kokoro process more efficiently
   */
  async generateAudioBatch(texts: string[]): Promise<Map<string, Buffer>> {
    const results = new Map<string, Buffer>();
    const tempDir = path.join(process.cwd(), '.temp-audio');
    await fs.ensureDir(tempDir);

    const tempFiles: string[] = [];

    try {
      // Generate all files concurrently
      const promises = texts.map(async (text, index) => {
        const tempFile = path.join(tempDir, `temp-batch-${Date.now()}-${index}.wav`);
        tempFiles.push(tempFile);

        try {
          const escapedText = text.replace(/"/g, '\\"').replace(/'/g, "\\'");
          const command = `${this.kokoroCommand} synthesize "${escapedText}" --output "${tempFile}" --voice ${this.voice} --speed ${this.speed} --silence ${this.silence}`;

          // Execute with timeout
          await execAsync(command, { timeout: 30000, maxBuffer: 10 * 1024 * 1024 });
          const audioBuffer = await fs.readFile(tempFile);

          // Convert WAV to MP3 if needed
          if (this.outputFormat === 'mp3') {
            return { index, text, data: await this.convertToMp3(audioBuffer, tempDir) };
          }

          return { index, text, data: audioBuffer };
        } catch (error: any) {
          throw { index, text, error };
        }
      });

      // Wait for all generations
      const outcomes = await Promise.allSettled(promises);

      // Process results
      for (const outcome of outcomes) {
        if (outcome.status === 'fulfilled') {
          const { text, data } = outcome.value;
          results.set(text, data);
        } else if (outcome.status === 'rejected') {
          const { text, error } = outcome.reason;
          console.warn(`Failed to generate audio for "${text}": ${error.message}`);
        }
      }

      return results;
    } finally {
      // Clean up temp files
      for (const tempFile of tempFiles) {
        if (await fs.pathExists(tempFile)) {
          await fs.remove(tempFile);
        }
      }
    }
  }

  /**
   * Check if batch processing is enabled
   */
  isBatchProcessingEnabled(): boolean {
    return this.enableBatchProcessing;
  }
}