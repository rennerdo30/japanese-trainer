// Audio file processing and management

import * as fs from 'fs-extra';
import * as path from 'path';
import { createHash } from 'crypto';
import { exec } from 'child_process';
import { promisify } from 'util';
import { AudioGenerationTask, GenerationResult } from '../types';
import { DEFAULT_CONFIG } from '../config';

const execAsync = promisify(exec);

export class AudioProcessor {
  private outputDir: string;

  constructor(outputDir: string) {
    this.outputDir = outputDir;
  }

  /**
   * Generate a unique filename for audio file
   */
  generateFilename(task: AudioGenerationTask): string {
    const hash = createHash('md5')
      .update(`${task.type}-${task.id}-${task.text}`)
      .digest('hex')
      .substring(0, 8);

    return `${hash}.${DEFAULT_CONFIG.AUDIO_FORMAT}`;
  }

  /**
   * Get the output directory for a specific data type
   */
  getTypeDirectory(type: AudioGenerationTask['type']): string {
    const dirMap: Record<AudioGenerationTask['type'], string> = {
      character: DEFAULT_CONFIG.CHARACTERS_DIR,
      vocabulary: DEFAULT_CONFIG.VOCABULARY_DIR,
      grammar: DEFAULT_CONFIG.GRAMMAR_DIR,
      kanji: DEFAULT_CONFIG.KANJI_DIR,
      reading: DEFAULT_CONFIG.READING_DIR,
      listening: DEFAULT_CONFIG.LISTENING_DIR,
    };

    return path.join(this.outputDir, dirMap[type]);
  }

  /**
   * Get the full output path for an audio file
   */
  getOutputPath(task: AudioGenerationTask): string {
    const typeDir = this.getTypeDirectory(task.type);
    const filename = this.generateFilename(task);
    return path.join(typeDir, filename);
  }

  /**
   * Get the relative URL path for the audio file (for use in app)
   */
  getAudioUrl(task: AudioGenerationTask): string {
    const outputPath = this.getOutputPath(task);
    // Convert to web path (relative to public directory)
    return '/' + outputPath.replace(/^public\//, '');
  }

  /**
   * Check if audio file already exists
   */
  async fileExists(task: AudioGenerationTask): Promise<boolean> {
    const outputPath = this.getOutputPath(task);
    return await fs.pathExists(outputPath);
  }

  /**
   * Save audio buffer to file
   */
  async saveAudio(task: AudioGenerationTask, audioBuffer: Buffer): Promise<string> {
    const outputPath = this.getOutputPath(task);
    const typeDir = this.getTypeDirectory(task.type);

    // Ensure directory exists
    await fs.ensureDir(typeDir);

    // Write file
    await fs.writeFile(outputPath, audioBuffer);

    // Clean audio (denoise + trim)
    await this.cleanAudio(outputPath);

    return outputPath;
  }

  /**
   * Clean audio file (denoise + trim silence) using FFmpeg
   */
  async cleanAudio(filePath: string): Promise<void> {
    try {
      const tempPath = `${filePath}.temp.mp3`;

      // FFmpeg filter description:
      // afftdn: FFT-based denoiser (reduces background hiss)
      // silenceremove:
      //   start_threshold=-50dB: remove leading silence
      //   stop_threshold=-50dB: detect silence at end
      //   stop_duration=1.0: require 1s of silence at end to trigger cleanup
      //   stop_periods=-1: apply to the end of the file
      const filter = 'afftdn,silenceremove=start_threshold=-50dB:start_duration=0:stop_threshold=-50dB:stop_duration=1.0:stop_periods=-1';

      await execAsync(`ffmpeg -i "${filePath}" -af "${filter}" -y "${tempPath}"`);

      // Replace original with cleaned version
      await fs.move(tempPath, filePath, { overwrite: true });
    } catch (error) {
      console.warn(`Failed to clean audio ${filePath}:`, error);
      // Don't fail the whole process if cleaning fails
    }
  }

  /**
   * Ensure all output directories exist
   */
  async ensureDirectories(): Promise<void> {
    const dirs = [
      path.join(this.outputDir, DEFAULT_CONFIG.CHARACTERS_DIR),
      path.join(this.outputDir, DEFAULT_CONFIG.VOCABULARY_DIR),
      path.join(this.outputDir, DEFAULT_CONFIG.GRAMMAR_DIR),
      path.join(this.outputDir, DEFAULT_CONFIG.KANJI_DIR),
      path.join(this.outputDir, DEFAULT_CONFIG.READING_DIR),
      path.join(this.outputDir, DEFAULT_CONFIG.LISTENING_DIR),
    ];

    for (const dir of dirs) {
      await fs.ensureDir(dir);
    }
  }

  /**
   * Get statistics about existing audio files
   */
  async getStats(): Promise<Record<string, number>> {
    const stats: Record<string, number> = {};

    const dirs = [
      { type: 'character', dir: DEFAULT_CONFIG.CHARACTERS_DIR },
      { type: 'vocabulary', dir: DEFAULT_CONFIG.VOCABULARY_DIR },
      { type: 'grammar', dir: DEFAULT_CONFIG.GRAMMAR_DIR },
      { type: 'kanji', dir: DEFAULT_CONFIG.KANJI_DIR },
      { type: 'reading', dir: DEFAULT_CONFIG.READING_DIR },
      { type: 'listening', dir: DEFAULT_CONFIG.LISTENING_DIR },
    ];

    for (const { type, dir } of dirs) {
      const fullPath = path.join(this.outputDir, dir);
      if (await fs.pathExists(fullPath)) {
        const files = await fs.readdir(fullPath);
        stats[type] = files.filter(f => f.endsWith(`.${DEFAULT_CONFIG.AUDIO_FORMAT}`)).length;
      } else {
        stats[type] = 0;
      }
    }

    return stats;
  }
}
