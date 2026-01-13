// Piper TTS client for text-to-speech generation
// High-quality, free, local neural TTS engine

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs-extra';
import * as path from 'path';
import { DEFAULT_CONFIG } from '../config';

const execAsync = promisify(exec);

export interface PiperTTSConfig {
  modelPath?: string; // Path to Piper model file (.onnx) or model name
  outputFormat?: 'wav' | 'mp3'; // Output format
  lengthScale?: number; // Speech speed (default: 1.0)
  noiseScale?: number; // Voice variation (default: 0.667)
  noiseW?: number; // Phoneme duration variation (default: 0.8)
}

export class PiperTTSClient {
  private modelPath: string;
  private outputFormat: string;
  private lengthScale: number;
  private noiseScale: number;
  private noiseW: number;
  private piperCommand: string; // 'piper' or 'python -m piper'

  constructor(config: PiperTTSConfig = {}) {
    // Default to high-quality Japanese model
    // Users can override with --piper-model option
    this.modelPath = config.modelPath || DEFAULT_CONFIG.PIPER_DEFAULT_MODEL;
    this.outputFormat = config.outputFormat || 'wav';
    this.lengthScale = config.lengthScale ?? 1.0;
    this.noiseScale = config.noiseScale ?? 0.667;
    this.noiseW = config.noiseW ?? 0.8;
    this.piperCommand = 'piper'; // Will be resolved in verify()
  }

  /**
   * Get available Japanese models (if model repository is accessible)
   */
  async getAvailableModels(): Promise<string[]> {
    // Common Japanese models for Piper TTS
    return [
      'ja_JP-shinji-medium',
      'ja_JP-shinji-high',
      'ja_JP-natsumi-medium',
      'ja_JP-natsumi-high',
    ];
  }

  /**
   * Generate audio from text using Piper TTS
   */
  async generateAudio(text: string): Promise<Buffer> {
    // Create a temporary file for output
    const tempDir = path.join(process.cwd(), '.temp-audio');
    await fs.ensureDir(tempDir);
    const tempFile = path.join(tempDir, `temp-${Date.now()}.wav`);

    try {
      // Resolve model path (could be a file path or model name)
      const resolvedModelPath = await this.resolveModelPath(this.modelPath);

      // Use piper command-line tool to generate audio
      // Piper reads from stdin and outputs WAV to stdout or file
      // Try different command formats for compatibility
      const escapedText = text.replace(/"/g, '\\"').replace(/'/g, "\\'");
      
      // Try --output-file first (newer versions), fallback to stdout redirection
      let command = `echo "${escapedText}" | ${this.piperCommand} --model "${resolvedModelPath}" --length-scale ${this.lengthScale} --noise-scale ${this.noiseScale} --noise-w ${this.noiseW} --output-file "${tempFile}" 2>&1`;
      
      try {
        await execAsync(command);
      } catch (error: any) {
        // If --output-file doesn't work, try stdout redirection
        if (error.message.includes('output-file') || error.message.includes('unknown')) {
          command = `echo "${escapedText}" | ${this.piperCommand} --model "${resolvedModelPath}" --length-scale ${this.lengthScale} --noise-scale ${this.noiseScale} --noise-w ${this.noiseW} > "${tempFile}" 2>&1`;
          await execAsync(command);
        } else {
          throw error;
        }
      }

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
      if (error.message.includes('command not found') || error.message.includes('piper: not found')) {
        throw new Error('Piper TTS not found. Please install Piper TTS first. See tools/README.md for installation instructions.');
      }
      
      if (error.message.includes('No such file') || error.message.includes('model')) {
        // If it's a model name (not a file path), suggest it will be auto-downloaded
        if (!this.modelPath.endsWith('.onnx') && !path.isAbsolute(this.modelPath) && !this.modelPath.startsWith('.')) {
          throw new Error(`Piper model "${this.modelPath}" not found. It should be automatically downloaded from Hugging Face on first use. If this error persists, check your internet connection or install manually.`);
        } else {
          throw new Error(`Piper model not found: ${this.modelPath}. Please download a Japanese model or specify a model name (e.g., ja_JP-shinji-medium) for automatic download.`);
        }
      }
      
      throw new Error(`Piper TTS generation failed: ${error.message}`);
    }
  }

  /**
   * Resolve model path - check if it's a file path or model name
   * If it's a model name, Piper will automatically download from Hugging Face
   */
  private async resolveModelPath(modelPathOrName: string): Promise<string> {
    // If it's an absolute path or starts with . or ~, treat as file path
    if (path.isAbsolute(modelPathOrName) || modelPathOrName.startsWith('.') || modelPathOrName.startsWith('~')) {
      const resolved = modelPathOrName.startsWith('~') 
        ? modelPathOrName.replace('~', process.env.HOME || '')
        : path.resolve(modelPathOrName);
      
      if (await fs.pathExists(resolved)) {
        return resolved;
      }
      throw new Error(`Model file not found: ${resolved}`);
    }

    // Check if it's a local file path (has .onnx extension)
    if (modelPathOrName.endsWith('.onnx')) {
      // Try common model locations
      const possiblePaths = [
        path.join(process.env.HOME || '', '.local', 'share', 'piper', 'models', modelPathOrName),
        path.join(process.env.HOME || '', '.piper', 'models', modelPathOrName),
        path.join('/usr', 'local', 'share', 'piper', 'models', modelPathOrName),
        path.join(process.cwd(), 'models', modelPathOrName),
        modelPathOrName, // Try as-is if it's already a full path
      ];

      for (const possiblePath of possiblePaths) {
        if (await fs.pathExists(possiblePath)) {
          return possiblePath;
        }
      }
    }

    // If it's a model name (not a file path), return as-is
    // Piper will automatically download from Hugging Face if not found locally
    // Models are typically stored in ~/.local/share/piper/voices/ after download
    return modelPathOrName;
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
   * Verify that Piper TTS is installed and model is available
   */
  async verify(): Promise<boolean> {
    // Determine which piper command to use
    try {
      // Try 'piper' command first (for pre-built binaries)
      await execAsync('which piper || command -v piper');
      this.piperCommand = 'piper';
    } catch (error) {
      // Try Python module format (for PyPI installation)
      try {
        await execAsync('python -m piper --version 2>&1');
        this.piperCommand = 'python -m piper';
      } catch (pyError) {
        throw new Error('Piper TTS not found. Install via: pip install piper-tts (or use pre-built binaries). See tools/README.md for details.');
      }
    }

    // For model names (not file paths), Piper will auto-download from Hugging Face
    // So we don't need to verify the model exists - just verify piper is installed
    // If it's a file path, try to resolve it
    if (path.isAbsolute(this.modelPath) || this.modelPath.startsWith('.') || this.modelPath.startsWith('~') || this.modelPath.endsWith('.onnx')) {
      try {
        await this.resolveModelPath(this.modelPath);
      } catch (error: any) {
        // If it's a file path and not found, that's an error
        throw new Error(`Piper model file not found: ${this.modelPath}. Please check the path or use a model name for automatic download.`);
      }
    }
    // Otherwise, it's a model name and will be auto-downloaded on first use

    return true;
  }
}
