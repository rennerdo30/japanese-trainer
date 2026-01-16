#!/usr/bin/env node
// TTS Audio Generator CLI Tool
// Generates ElevenLabs audio files for all learning data

import { Command } from 'commander';
import * as dotenv from 'dotenv';
import * as fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';
import cliProgress from 'cli-progress';
import { ElevenLabsClient } from './lib/elevenlabs-client';
import { MacOSSayClient } from './lib/macos-say-client';
import { PiperTTSClient } from './lib/piper-tts-client';
import { KokoroTTSClient } from './lib/kokoro-tts-client';
import { AudioProcessor } from './lib/audio-processor';
import { AudioWorkerPool } from './lib/worker-pool';
import { DEFAULT_CONFIG, Config } from './config';
import { AudioGenerationTask, GenerationResult, GenerationStats, DataType } from './types';

// Load environment variables
// Load .env first, then .env.local (which will override .env values)
dotenv.config();
dotenv.config({ path: '.env.local', override: true });

/**
 * Cleanup function to ensure proper process termination
 */
function cleanupAndExit(code: number = 0): void {
  // Kill any remaining child processes
  if (process.platform !== 'win32') {
    try {
      process.kill(-process.pid, 'SIGTERM');
    } catch (e) {
      // Ignore errors
    }
  }

  // Clear temp audio directory
  try {
    const tempDir = path.join(process.cwd(), '.temp-audio');
    if (fs.pathExistsSync(tempDir)) {
      fs.removeSync(tempDir);
    }
  } catch (e) {
    // Ignore errors
  }

  // Force exit after a brief delay to allow cleanup
  setTimeout(() => {
    process.exit(code);
  }, 100);
}

// Handle termination signals
process.on('SIGINT', () => cleanupAndExit(0));
process.on('SIGTERM', () => cleanupAndExit(0));

const program = new Command();

program
  .name('tts-generator')
  .description('Generate TTS audio files for multi-language learning data')
  .option('-t, --type <type>', 'Data type to generate: characters|vocabulary|grammar|kanji|reading|listening|all', 'all')
  .option('-o, --output <path>', 'Output directory', DEFAULT_CONFIG.DEFAULT_OUTPUT_DIR)
  .option('-k, --api-key <key>', 'ElevenLabs API key (or use ELEVENLABS_API_KEY env var)')
  .option('-v, --voice-id <id>', 'ElevenLabs voice ID (or use ELEVENLABS_VOICE_ID env var)')
  .option('-m, --model-id <id>', 'ElevenLabs model ID (or use ELEVENLABS_MODEL_ID env var)')
  .option('--provider <provider>', 'TTS provider: elevenlabs|macos-say|piper|kokoro (default: elevenlabs)', 'elevenlabs')
  .option('--macos-voice <voice>', 'macOS voice name (e.g., Kyoko, Otoya) - only for macos-say provider', 'Kyoko')
  .option('--piper-model <path>', 'Piper model path or name (e.g., ja_JP-shinji-medium) - only for piper provider', DEFAULT_CONFIG.PIPER_DEFAULT_MODEL)
  .option('--kokoro-voice <voice>', 'Kokoro voice name (e.g., jf_alpha) - only for kokoro provider', DEFAULT_CONFIG.KOKORO_DEFAULT_VOICE)
  .option('-c, --concurrency <number>', 'Number of concurrent workers for parallel generation (default: 4)', '4')
  .option('-u, --update-json', 'Update JSON files with audio URLs', false)
  .option('--dry-run', 'Preview without generating audio', false)
  .parse(process.argv);

const options = program.opts();

async function main() {
  const provider = options.provider || 'elevenlabs';
  const config: Config = {
    apiKey: options.apiKey || process.env.ELEVENLABS_API_KEY || '',
    voiceId: options.voiceId || process.env.ELEVENLABS_VOICE_ID,
    modelId: options.modelId || process.env.ELEVENLABS_MODEL_ID,
    outputDir: options.output,
    updateJson: options.updateJson,
    dryRun: options.dryRun,
  };

  // Initialize TTS client based on provider
  let client: ElevenLabsClient | MacOSSayClient | PiperTTSClient | KokoroTTSClient;

  if (provider === 'kokoro') {
    console.log(chalk.blue('🎙️  Kokoro TTS Audio Generator (best quality local TTS)\n'));

    const kokoroVoice = options.kokoroVoice || DEFAULT_CONFIG.KOKORO_DEFAULT_VOICE;
    client = new KokoroTTSClient({
      voice: kokoroVoice,
      outputFormat: 'mp3', // Generate MP3 directly
      speed: DEFAULT_CONFIG.KOKORO_SPEED,
      silence: DEFAULT_CONFIG.KOKORO_SILENCE,
    });

    // Verify Kokoro TTS is installed and initialized
    if (!config.dryRun) {
      try {
        await (client as KokoroTTSClient).verify();
        const voices = await (client as KokoroTTSClient).getAvailableVoices();
        console.log(chalk.green(`✓ Kokoro TTS verified (using voice: ${kokoroVoice})`));
        if (voices.length > 1) {
          console.log(chalk.cyan(`Available Japanese voices: ${voices.slice(0, 5).join(', ')}${voices.length > 5 ? '...' : ''}\n`));
        } else {
          console.log();
        }
      } catch (error: any) {
        console.error(chalk.red(`✗ Kokoro TTS verification failed: ${error.message}`));
        console.error(chalk.yellow('\nQuick setup (recommended):'));
        console.error(chalk.cyan('  npm run setup-kokoro'));
        console.error(chalk.yellow('\nOr manual setup:'));
        console.error(chalk.yellow('  1. Install Kokoro TTS: pip install kokoro-tts-tool'));
        console.error(chalk.yellow('  2. Initialize (downloads models): kokoro-tts-tool init'));
        console.error(chalk.yellow('  3. List available voices: kokoro-tts-tool list-voices\n'));
        process.exit(1);
      }
    }
  } else if (provider === 'piper') {
    console.log(chalk.blue('🎙️  Piper TTS Audio Generator (high-quality local TTS)\n'));

    const piperModel = options.piperModel || DEFAULT_CONFIG.PIPER_DEFAULT_MODEL;
    client = new PiperTTSClient({
      modelPath: piperModel,
      outputFormat: 'mp3', // Generate MP3 directly
      lengthScale: DEFAULT_CONFIG.PIPER_LENGTH_SCALE,
      noiseScale: DEFAULT_CONFIG.PIPER_NOISE_SCALE,
      noiseW: DEFAULT_CONFIG.PIPER_NOISE_W,
    });

    // Verify Piper TTS is installed and model is available
    if (!config.dryRun) {
      try {
        await (client as PiperTTSClient).verify();
        console.log(chalk.green(`✓ Piper TTS verified (using model: ${piperModel})\n`));
      } catch (error: any) {
        console.error(chalk.red(`✗ Piper TTS verification failed: ${error.message}`));
        console.error(chalk.yellow('\nInstallation instructions:'));
        console.error(chalk.yellow('  1. Install Piper TTS: brew install piper-tts'));
        console.error(chalk.yellow('  2. Download a Japanese model from: https://github.com/rhasspy/piper/releases'));
        console.error(chalk.yellow('  3. Place model in ~/.local/share/piper/models/ or specify path with --piper-model\n'));
        process.exit(1);
      }
    }
  } else if (provider === 'macos-say') {
    if (process.platform !== 'darwin') {
      console.error(chalk.red('Error: macOS say provider requires macOS'));
      process.exit(1);
    }

    console.log(chalk.blue('🎙️  macOS TTS Audio Generator (using "say" command)\n'));

    const macosVoice = options.macosVoice || 'Kyoko';
    client = new MacOSSayClient({
      voice: macosVoice,
      rate: 200,
      outputFormat: 'aiff', // Will be converted to MP3 by audio processor if needed
    });

    // Verify macOS say is available
    try {
      await (client as MacOSSayClient).verify();
      const voices = await (client as MacOSSayClient).getAvailableVoices();
      console.log(chalk.green(`✓ Using macOS voice: ${macosVoice}`));
      if (voices.length > 0) {
        console.log(chalk.cyan(`Available Japanese voices: ${voices.join(', ')}\n`));
      }
    } catch (error: any) {
      console.error(chalk.red(`✗ macOS say verification failed: ${error.message}`));
      process.exit(1);
    }
  } else {
    // ElevenLabs provider
    if (!config.apiKey) {
      console.error(chalk.red('Error: API key required. Set ELEVENLABS_API_KEY env var or use --api-key'));
      process.exit(1);
    }

    console.log(chalk.blue('🎙️  ElevenLabs TTS Audio Generator\n'));

    client = new ElevenLabsClient({
      apiKey: config.apiKey,
      voiceId: config.voiceId,
      modelId: config.modelId,
    });
  }

  const processor = new AudioProcessor(config.outputDir);

  // Verify API connection and list available voices (only for ElevenLabs)
  if (!config.dryRun && provider === 'elevenlabs') {
    console.log(chalk.yellow('Verifying API connection...'));
    try {
      const voices = await (client as ElevenLabsClient).getVoices();
      if (voices.length > 0) {
        console.log(chalk.green(`✓ API connection verified (${voices.length} voices available)\n`));

        // Check if the configured voice ID exists
        if (config.voiceId) {
          const voiceExists = voices.some((v: any) => v.voice_id === config.voiceId);
          if (!voiceExists) {
            console.log(chalk.yellow(`⚠ Warning: Voice ID "${config.voiceId}" not found in your account.\n`));
            console.log(chalk.cyan('Available voices:'));
            voices.slice(0, 10).forEach((v: any) => {
              console.log(`  - ${v.name} (${v.voice_id})`);
            });
            if (voices.length > 10) {
              console.log(`  ... and ${voices.length - 10} more`);
            }
            console.log();
          }
        }
      } else {
        console.log(chalk.yellow('⚠ No voices found in your account. Using default voice ID.\n'));
      }
    } catch (error: any) {
      console.log(chalk.yellow(`⚠ Could not verify API connection: ${error.message}`));
      console.log(chalk.yellow('Continuing anyway...\n'));
    }
  }

  // Ensure output directories exist
  await processor.ensureDirectories();

  // Get existing stats
  const existingStats = await processor.getStats();
  console.log(chalk.cyan('Existing audio files:'));
  Object.entries(existingStats).forEach(([type, count]) => {
    console.log(`  ${type}: ${count} files`);
  });
  console.log();

  // Generate tasks based on type
  const dataType = options.type as DataType;
  const tasks = await generateTasks(dataType, processor);

  if (tasks.length === 0) {
    console.log(chalk.yellow('No tasks to generate.'));
    return;
  }

  console.log(chalk.cyan(`Generating audio for ${tasks.length} items...\n`));

  if (config.dryRun) {
    console.log(chalk.yellow('DRY RUN - Preview of tasks:'));
    tasks.slice(0, 10).forEach((task, i) => {
      console.log(`  ${i + 1}. ${task.type}: ${task.text} -> ${processor.getOutputPath(task)}`);
    });
    if (tasks.length > 10) {
      console.log(`  ... and ${tasks.length - 10} more`);
    }
    return;
  }

  // Generate audio with parallelization
  const stats: GenerationStats = {
    total: tasks.length,
    success: 0,
    failed: 0,
    skipped: 0,
    duration: 0,
  };

  const startTime = Date.now();
  const concurrency = Math.max(1, Math.min(parseInt(options.concurrency, 10) || 4, 16));
  const progressBar = new cliProgress.SingleBar({
    format: 'Progress |{bar}| {percentage}% | {value}/{total} | Workers: {workers} | {status}',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true,
  });

  progressBar.start(tasks.length, 0, { status: 'Preparing...', workers: 0 });

  // Create worker pool for parallel audio generation
  const workerPool = new AudioWorkerPool(concurrency);

  // Separate skipped tasks from tasks to process
  const tasksToProcess: AudioGenerationTask[] = [];

  for (const task of tasks) {
    // Check if file already exists
    if (await processor.fileExists(task)) {
      stats.skipped++;
      task.audioUrl = processor.getAudioUrl(task);
    } else {
      tasksToProcess.push(task);
    }
  }

  if (tasksToProcess.length === 0) {
    progressBar.stop();
    console.log(chalk.cyan('All audio files already exist. Nothing to generate.\n'));
  } else {
    // Add tasks to worker pool
    workerPool.addTasks(
      tasksToProcess.map(task => ({
        id: task.id,
        text: task.text,
        generate: async (text: string) => {
          try {
            return await client.generateAudio(text);
          } catch (error: any) {
            // Check for quota/limit errors and propagate them
            const errorMsg = error.message || String(error);
            const isQuotaError = errorMsg.toLowerCase().includes('reached') ||
              errorMsg.toLowerCase().includes('limit') ||
              errorMsg.toLowerCase().includes('quota') ||
              errorMsg.toLowerCase().includes('character limit');

            if (isQuotaError) {
              throw error; // Propagate quota errors to stop the pool
            }
            throw error;
          }
        },
      }))
    );

    // Process all tasks in parallel
    let quotaExceeded = false;
    let lastProgressTime = Date.now();

    try {
      const result = await workerPool.process((progress) => {
        const now = Date.now();
        // Update progress bar at most every 100ms to avoid flashing
        if (now - lastProgressTime >= 100) {
          progressBar.update(progress.completed + stats.skipped, {
            status: progress.current.substring(0, 20),
            workers: workerPool.getActiveWorkers(),
          });
          lastProgressTime = now;
        }
      });

      // Process results
      let processedCount = 0;
      for (const [taskId, resultData] of result.results) {
        const task = tasksToProcess.find(t => t.id === taskId);
        if (!task) continue;

        if (resultData.error) {
          stats.failed++;
          const errorMsg = resultData.error.message || String(resultData.error);
          console.error(chalk.red(`\n✗ Failed: ${task.text} - ${errorMsg}`));

          // Check for quota/limit errors
          const isQuotaError = errorMsg.toLowerCase().includes('reached') ||
            errorMsg.toLowerCase().includes('limit') ||
            errorMsg.toLowerCase().includes('quota') ||
            errorMsg.toLowerCase().includes('character limit');

          if (isQuotaError) {
            quotaExceeded = true;
          }
        } else if (resultData.result) {
          try {
            // Save file
            await processor.saveAudio(task, resultData.result);
            task.audioUrl = processor.getAudioUrl(task);
            stats.success++;
          } catch (saveError: any) {
            stats.failed++;
            console.error(chalk.red(`\n✗ Failed to save: ${task.text} - ${saveError.message}`));
          }
        }
        processedCount++;
      }
    } catch (error: any) {
      console.error(chalk.red(`\nWorker pool error: ${error.message}`));
      quotaExceeded = true;
    }

    progressBar.stop();

    // Show quota error message if needed
    if (quotaExceeded) {
      console.error(chalk.yellow('\n⚠ You have reached your API quota/limit or encountered an error.'));
      console.error(chalk.yellow('Generation stopped to avoid further issues.\n'));
      console.error(chalk.cyan('Next steps:'));
      console.error(chalk.cyan('  1. Check your ElevenLabs dashboard: https://elevenlabs.io/app/usage'));
      console.error(chalk.cyan('  2. Wait for quota reset or upgrade your plan'));
      console.error(chalk.cyan('  3. Resume generation later (existing files will be skipped)\n'));
    }
  }

  stats.duration = Date.now() - startTime;

  // Print summary
  console.log(chalk.green('\n✓ Generation complete!\n'));
  console.log(chalk.cyan('Summary:'));
  console.log(`  Total: ${stats.total}`);
  console.log(chalk.green(`  Success: ${stats.success}`));
  console.log(chalk.yellow(`  Skipped: ${stats.skipped}`));
  console.log(chalk.red(`  Failed: ${stats.failed}`));
  console.log(`  Duration: ${(stats.duration / 1000).toFixed(1)}s`);

  // Update JSON files if requested
  if (config.updateJson && stats.success > 0) {
    console.log(chalk.cyan('\nUpdating JSON files...'));
    await updateJsonFiles(dataType, tasks, processor);
    console.log(chalk.green('✓ JSON files updated'));
  }

  // Clean exit
  cleanupAndExit(0);
}

async function generateTasks(
  dataType: DataType,
  processor: AudioProcessor
): Promise<AudioGenerationTask[]> {
  const tasks: AudioGenerationTask[] = [];

  if (dataType === 'characters' || dataType === 'all') {
    const characters = await loadCharacters();
    for (const char of characters) {
      tasks.push({
        id: char.romaji,
        text: char.hiragana,
        type: 'character',
        outputPath: '',
        metadata: { romaji: char.romaji, type: char.type },
      });
    }
  }

  if (dataType === 'vocabulary' || dataType === 'all') {
    const vocabulary = await loadVocabulary();
    for (const vocab of vocabulary) {
      tasks.push({
        id: vocab.id,
        text: vocab.word,
        type: 'vocabulary',
        outputPath: '',
        metadata: { word: vocab.word, meaning: vocab.meaning, reading: vocab.reading },
      });
    }
  }

  if (dataType === 'grammar' || dataType === 'all') {
    const grammar = await loadGrammar();
    for (const item of grammar) {
      if (item.examples) {
        item.examples.forEach((example: any, index: number) => {
          tasks.push({
            id: `${item.id}-example-${index}`,
            text: example.japanese,
            type: 'grammar',
            outputPath: '',
            metadata: { grammarId: item.id, exampleIndex: index },
          });
        });
      }
    }
  }

  if (dataType === 'kanji' || dataType === 'all') {
    const kanji = await loadKanji();
    for (const item of kanji) {
      // Generate audio for the main kanji character itself (pronunciation/reading)
      // We'll use the first onyomi or kunyomi as the spoken text
      const mainReading = (item.onyomi && item.onyomi.length > 0) ? item.onyomi[0] :
        ((item.kunyomi && item.kunyomi.length > 0) ? item.kunyomi[0] : item.kanji);

      tasks.push({
        id: item.id,
        text: mainReading,
        type: 'kanji',
        outputPath: '',
        metadata: { kanji: item.kanji, type: 'main' },
      });

      // Generate audio for onyomi readings
      if (item.onyomi) {
        item.onyomi.forEach((reading: string, index: number) => {
          tasks.push({
            id: `${item.id}-onyomi-${index}`,
            text: reading,
            type: 'kanji',
            outputPath: '',
            metadata: { kanjiId: item.id, readingType: 'onyomi', index },
          });
        });
      }

      // Generate audio for kunyomi readings
      if (item.kunyomi) {
        item.kunyomi.forEach((reading: string, index: number) => {
          tasks.push({
            id: `${item.id}-kunyomi-${index}`,
            text: reading,
            type: 'kanji',
            outputPath: '',
            metadata: { kanjiId: item.id, readingType: 'kunyomi', index },
          });
        });
      }

      // Generate audio for example words
      if (item.examples) {
        item.examples.forEach((example: any, index: number) => {
          tasks.push({
            id: `${item.id}-example-${index}`,
            text: example.reading,
            type: 'kanji',
            outputPath: '',
            metadata: { kanjiId: item.id, exampleIndex: index },
          });
        });
      }
    }
  }

  if (dataType === 'reading' || dataType === 'all') {
    const readings = await loadReading();
    for (const item of readings) {
      tasks.push({
        id: item.id,
        text: item.text,
        type: 'reading',
        outputPath: '',
        metadata: { title: item.title, level: item.level },
      });
    }
  }

  if (dataType === 'listening' || dataType === 'all') {
    const listening = await loadListening();
    for (const item of listening) {
      tasks.push({
        id: item.id,
        text: item.text,
        type: 'listening',
        outputPath: '',
        metadata: { title: item.title, level: item.level },
      });
    }
  }

  return tasks;
}

async function loadCharacters(): Promise<any[]> {
  try {
    // Load from src/data/characters.json
    const jsonPath = path.join(process.cwd(), 'src/data/characters.json');
    if (await fs.pathExists(jsonPath)) {
      const chars = await fs.readJson(jsonPath);
      if (Array.isArray(chars) && chars.length > 0) {
        return chars;
      }
    }

    // Fallback: try to import from TypeScript (works with tsx)
    try {
      // Use dynamic import with proper path resolution
      const charactersPath = path.join(process.cwd(), 'src/data/characters.ts');
      if (await fs.pathExists(charactersPath)) {
        // tsx handles TypeScript imports, so this should work
        const charactersModule = await import(charactersPath);
        if (charactersModule?.characters && Array.isArray(charactersModule.characters)) {
          return charactersModule.characters;
        }
      }
    } catch (importError: any) {
      console.warn(chalk.yellow('Could not import characters from TypeScript.'));
      console.warn(chalk.yellow('Run: npm run export-characters'));
    }

    console.warn(chalk.yellow('No character data found. Run: npm run export-characters'));
    return [];
  } catch (error: any) {
    console.warn(chalk.yellow(`Could not load characters: ${error.message}`));
    return [];
  }
}

async function loadVocabulary(): Promise<any[]> {
  const filePath = path.join(process.cwd(), 'src/data/vocabulary.json');
  return await fs.readJson(filePath);
}

async function loadGrammar(): Promise<any[]> {
  const filePath = path.join(process.cwd(), 'src/data/grammar.json');
  return await fs.readJson(filePath);
}

async function loadKanji(): Promise<any[]> {
  const filePath = path.join(process.cwd(), 'src/data/kanji.json');
  return await fs.readJson(filePath);
}

async function loadReading(): Promise<any[]> {
  const filePath = path.join(process.cwd(), 'src/data/readings.json');
  return await fs.readJson(filePath);
}

async function loadListening(): Promise<any[]> {
  const filePath = path.join(process.cwd(), 'public/listening.json');
  return await fs.readJson(filePath);
}

async function updateJsonFiles(
  dataType: DataType,
  tasks: AudioGenerationTask[],
  processor: AudioProcessor
): Promise<void> {
  if (dataType === 'characters' || dataType === 'all') {
    // Characters are in TypeScript, so we'll need a different approach
    // For now, skip - can be handled manually or with a more sophisticated parser
  }

  if (dataType === 'vocabulary' || dataType === 'all') {
    const vocabulary = await loadVocabulary();
    const taskMap = new Map(tasks.filter(t => t.type === 'vocabulary').map(t => [t.id, t]));

    for (const vocab of vocabulary) {
      const task = taskMap.get(vocab.id);
      if (task?.audioUrl) {
        vocab.audioUrl = task.audioUrl;
      }
    }

    await fs.writeJson(
      path.join(process.cwd(), 'src/data/vocabulary.json'),
      vocabulary,
      { spaces: 2 }
    );
  }

  if (dataType === 'grammar' || dataType === 'all') {
    const grammar = await loadGrammar();
    const taskMap = new Map(tasks.filter(t => t.type === 'grammar').map(t => [t.id, t]));

    for (const item of grammar) {
      if (item.examples) {
        item.examples.forEach((example: any, index: number) => {
          const task = taskMap.get(`${item.id}-example-${index}`);
          if (task?.audioUrl) {
            example.audioUrl = task.audioUrl;
          }
        });
      }
    }

    await fs.writeJson(
      path.join(process.cwd(), 'src/data/grammar.json'),
      grammar,
      { spaces: 2 }
    );
  }

  if (dataType === 'kanji' || dataType === 'all') {
    const kanji = await loadKanji();
    const taskMap = new Map(tasks.filter(t => t.type === 'kanji').map(t => [t.id, t]));

    for (const item of kanji) {
      // Update onyomi/kunyomi audio URLs (stored in metadata for now)
      // For kanji, we might want a different structure

      // Update main kanji audio URL
      const mainTask = taskMap.get(item.id);
      if (mainTask?.audioUrl) {
        item.audioUrl = mainTask.audioUrl;
      }

      // Update example audio URLs
      if (item.examples) {
        item.examples.forEach((example: any, index: number) => {
          const task = taskMap.get(`${item.id}-example-${index}`);
          if (task?.audioUrl) {
            example.audioUrl = task.audioUrl;
          }
        });
      }
    }

    await fs.writeJson(
      path.join(process.cwd(), 'src/data/kanji.json'),
      kanji,
      { spaces: 2 }
    );
  }

  if (dataType === 'reading' || dataType === 'all') {
    const readings = await loadReading();
    const taskMap = new Map(tasks.filter(t => t.type === 'reading').map(t => [t.id, t]));

    for (const item of readings) {
      const task = taskMap.get(item.id);
      if (task?.audioUrl) {
        item.audioUrl = task.audioUrl;
      }
    }

    await fs.writeJson(
      path.join(process.cwd(), 'src/data/readings.json'),
      readings,
      { spaces: 2 }
    );
  }

  if (dataType === 'listening' || dataType === 'all') {
    const listening = await loadListening();
    const taskMap = new Map(tasks.filter(t => t.type === 'listening').map(t => [t.id, t]));

    for (const item of listening) {
      const task = taskMap.get(item.id);
      if (task?.audioUrl) {
        item.audioUrl = task.audioUrl;
      }
    }

    await fs.writeJson(
      path.join(process.cwd(), 'public/listening.json'),
      listening,
      { spaces: 2 }
    );
  }
}

// Run main function
main().catch(error => {
  console.error(chalk.red('Fatal error:'), error);
  cleanupAndExit(1);
});
