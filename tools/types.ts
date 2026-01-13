// Type definitions for TTS generator tools

export interface ElevenLabsConfig {
  apiKey: string;
  voiceId?: string;
  modelId?: string;
  stability?: number;
  similarityBoost?: number;
  style?: number;
  useSpeakerBoost?: boolean;
}

export interface AudioGenerationTask {
  id: string;
  text: string;
  outputPath: string;
  audioUrl?: string;
  type: 'character' | 'vocabulary' | 'grammar' | 'kanji';
  metadata?: Record<string, any>;
}

export interface GenerationResult {
  success: boolean;
  task: AudioGenerationTask;
  error?: string;
  duration?: number;
}

export interface GenerationStats {
  total: number;
  success: number;
  failed: number;
  skipped: number;
  duration: number;
}

export type DataType = 'characters' | 'vocabulary' | 'grammar' | 'kanji' | 'all';
