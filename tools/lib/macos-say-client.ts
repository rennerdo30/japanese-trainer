// macOS 'say' command TTS client for text-to-speech generation
// Free alternative to ElevenLabs that uses macOS built-in TTS

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs-extra';
import * as path from 'path';
import { DEFAULT_CONFIG } from '../config';

const execAsync = promisify(exec);

export interface MacOSSayConfig {
  voice?: string; // e.g., 'Kyoko' (Japanese female) or 'Otoya' (Japanese male)
  rate?: number; // Speech rate (words per minute, default ~200)
  outputFormat?: 'aiff' | 'wav' | 'mp3'; // Output format
}

export class MacOSSayClient {
  private voice: string;
  private rate: number;
  private outputFormat: string;

  constructor(config: MacOSSayConfig = {}) {
    // Default Japanese voices on macOS:
    // - Kyoko: Japanese female voice
    // - Otoya: Japanese male voice
    this.voice = config.voice || 'Kyoko';
    this.rate = config.rate || 200;
    this.outputFormat = config.outputFormat || 'aiff';
  }

  /**
   * Get available Japanese voices on macOS
   */
  async getAvailableVoices(): Promise<string[]> {
    try {
      const { stdout } = await execAsync('say -v ?');
      const voices = stdout
        .split('\n')
        .filter(line => line.includes('ja_JP') || line.includes('Japanese'))
        .map(line => {
          const match = line.match(/^(\w+)\s+/);
          return match ? match[1] : null;
        })
        .filter((v): v is string => v !== null);
      
      return voices.length > 0 ? voices : ['Kyoko', 'Otoya']; // Fallback to common Japanese voices
    } catch (error) {
      console.warn('Could not list voices, using default:', error);
      return ['Kyoko', 'Otoya'];
    }
  }

  /**
   * Generate audio from text using macOS 'say' command
   */
  async generateAudio(text: string): Promise<Buffer> {
    // Create a temporary file for output
    const tempDir = path.join(process.cwd(), '.temp-audio');
    await fs.ensureDir(tempDir);
    const tempFile = path.join(tempDir, `temp-${Date.now()}.${this.outputFormat}`);

    try {
      // Use 'say' command to generate audio
      // -v: voice
      // -r: rate (words per minute)
      // -o: output file
      const command = `say -v ${this.voice} -r ${this.rate} -o "${tempFile}" "${text.replace(/"/g, '\\"')}"`;
      
      await execAsync(command);

      // Read the generated file
      const audioBuffer = await fs.readFile(tempFile);

      // Clean up temp file
      await fs.remove(tempFile);

      // Convert AIFF to MP3 if needed (using ffmpeg if available, otherwise return as-is)
      if (this.outputFormat === 'mp3') {
        return await this.convertToMp3(audioBuffer, tempDir);
      }

      return audioBuffer;
    } catch (error: any) {
      // Clean up temp file on error
      if (await fs.pathExists(tempFile)) {
        await fs.remove(tempFile);
      }
      throw new Error(`macOS say command failed: ${error.message}`);
    }
  }

  /**
   * Convert AIFF/WAV to MP3 using ffmpeg (if available)
   */
  private async convertToMp3(audioBuffer: Buffer, tempDir: string): Promise<Buffer> {
    const inputFile = path.join(tempDir, `input-${Date.now()}.aiff`);
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
        // ffmpeg not available, return original format
        console.warn('ffmpeg not available, returning AIFF format instead of MP3');
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
   * Verify that 'say' command is available
   */
  async verify(): Promise<boolean> {
    try {
      await execAsync('say --version 2>&1 || say -v ?');
      return true;
    } catch (error) {
      throw new Error('macOS "say" command not available. This tool requires macOS.');
    }
  }
}
