/**
 * Kokoro-82M Browser TTS Integration
 * Uses kokoro-js package for proper TTS support
 * https://huggingface.co/onnx-community/Kokoro-82M-ONNX
 *
 * Supported languages:
 * - American English, British English
 * - Japanese, Mandarin Chinese
 * - Spanish, French, Hindi, Italian, Brazilian Portuguese
 *
 * Note: Korean is NOT supported - falls back to Web Speech API
 */

import type { KokoroTTS as KokoroTTSType } from 'kokoro-js';

// Model state
let ttsInstance: KokoroTTSType | null = null;
let isLoading = false;
let loadError: Error | null = null;

// Model configuration
const MODEL_ID = 'onnx-community/Kokoro-82M-ONNX';
const MODEL_SIZE_MB = 82;

// Kokoro language codes mapped to our target language codes
export type KokoroLanguage =
  | 'en-us' // American English
  | 'en-gb' // British English
  | 'ja'    // Japanese
  | 'zh'    // Mandarin Chinese
  | 'es'    // Spanish
  | 'fr'    // French
  | 'hi'    // Hindi
  | 'it'    // Italian
  | 'pt';   // Brazilian Portuguese

// Voice metadata from kokoro-js
export interface KokoroVoiceInfo {
  id: KokoroVoice;
  name: string;
  language: KokoroLanguage;
  languageLabel: string;
  gender: 'Female' | 'Male';
  quality: string;
  traits?: string;
}

// Valid Kokoro voice IDs
export type KokoroVoice =
  // American English
  | 'af_heart' | 'af_alloy' | 'af_aoede' | 'af_bella' | 'af_jessica'
  | 'af_kore' | 'af_nicole' | 'af_nova' | 'af_river' | 'af_sarah' | 'af_sky'
  | 'am_adam' | 'am_echo' | 'am_eric' | 'am_fenrir' | 'am_liam'
  | 'am_michael' | 'am_onyx' | 'am_puck' | 'am_santa'
  // British English
  | 'bf_emma' | 'bf_isabella' | 'bf_alice' | 'bf_lily'
  | 'bm_george' | 'bm_lewis' | 'bm_daniel' | 'bm_fable'
  // Japanese
  | 'jf_alpha' | 'jf_gongitsune' | 'jf_nezumi' | 'jf_tebukuro' | 'jm_kumo'
  // Mandarin Chinese
  | 'zf_xiaobei' | 'zf_xiaoni' | 'zf_xiaoxiao' | 'zf_xiaoyi'
  | 'zm_yunjian' | 'zm_yunxi' | 'zm_yunxia' | 'zm_yunyang'
  // Spanish
  | 'ef_dora' | 'em_alex' | 'em_santa'
  // French
  | 'ff_siwis'
  // Hindi
  | 'hf_alpha' | 'hf_beta' | 'hm_omega' | 'hm_psi'
  // Italian
  | 'if_sara' | 'im_nicola'
  // Brazilian Portuguese
  | 'pf_dora' | 'pm_alex' | 'pm_santa';

// All available voices with metadata
export const KOKORO_VOICES: KokoroVoiceInfo[] = [
  // American English - Female
  {
    id: 'af_heart',
    name: 'Heart',
    language: 'en-us',
    languageLabel: 'American English',
    gender: 'Female',
    quality: 'A',
    traits: '❤️ Best quality',
  },
  {
    id: 'af_bella',
    name: 'Bella',
    language: 'en-us',
    languageLabel: 'American English',
    gender: 'Female',
    quality: 'A-',
    traits: '🔥 Expressive',
  },
  {
    id: 'af_nicole',
    name: 'Nicole',
    language: 'en-us',
    languageLabel: 'American English',
    gender: 'Female',
    quality: 'B-',
    traits: '🎧 Clear',
  },
  {
    id: 'af_aoede',
    name: 'Aoede',
    language: 'en-us',
    languageLabel: 'American English',
    gender: 'Female',
    quality: 'C+',
  },
  {
    id: 'af_kore',
    name: 'Kore',
    language: 'en-us',
    languageLabel: 'American English',
    gender: 'Female',
    quality: 'C+',
  },
  {
    id: 'af_sarah',
    name: 'Sarah',
    language: 'en-us',
    languageLabel: 'American English',
    gender: 'Female',
    quality: 'C+',
  },
  {
    id: 'af_alloy',
    name: 'Alloy',
    language: 'en-us',
    languageLabel: 'American English',
    gender: 'Female',
    quality: 'C',
  },
  {
    id: 'af_nova',
    name: 'Nova',
    language: 'en-us',
    languageLabel: 'American English',
    gender: 'Female',
    quality: 'C',
  },
  {
    id: 'af_sky',
    name: 'Sky',
    language: 'en-us',
    languageLabel: 'American English',
    gender: 'Female',
    quality: 'C-',
  },
  {
    id: 'af_jessica',
    name: 'Jessica',
    language: 'en-us',
    languageLabel: 'American English',
    gender: 'Female',
    quality: 'D',
  },
  {
    id: 'af_river',
    name: 'River',
    language: 'en-us',
    languageLabel: 'American English',
    gender: 'Female',
    quality: 'D',
  },
  // American English - Male
  {
    id: 'am_fenrir',
    name: 'Fenrir',
    language: 'en-us',
    languageLabel: 'American English',
    gender: 'Male',
    quality: 'C+',
  },
  {
    id: 'am_michael',
    name: 'Michael',
    language: 'en-us',
    languageLabel: 'American English',
    gender: 'Male',
    quality: 'C+',
  },
  {
    id: 'am_puck',
    name: 'Puck',
    language: 'en-us',
    languageLabel: 'American English',
    gender: 'Male',
    quality: 'C+',
  },
  {
    id: 'am_echo',
    name: 'Echo',
    language: 'en-us',
    languageLabel: 'American English',
    gender: 'Male',
    quality: 'D',
  },
  {
    id: 'am_eric',
    name: 'Eric',
    language: 'en-us',
    languageLabel: 'American English',
    gender: 'Male',
    quality: 'D',
  },
  {
    id: 'am_liam',
    name: 'Liam',
    language: 'en-us',
    languageLabel: 'American English',
    gender: 'Male',
    quality: 'D',
  },
  {
    id: 'am_onyx',
    name: 'Onyx',
    language: 'en-us',
    languageLabel: 'American English',
    gender: 'Male',
    quality: 'D',
  },
  {
    id: 'am_santa',
    name: 'Santa',
    language: 'en-us',
    languageLabel: 'American English',
    gender: 'Male',
    quality: 'D-',
  },
  {
    id: 'am_adam',
    name: 'Adam',
    language: 'en-us',
    languageLabel: 'American English',
    gender: 'Male',
    quality: 'F+',
  },
  // British English - Female
  {
    id: 'bf_emma',
    name: 'Emma',
    language: 'en-gb',
    languageLabel: 'British English',
    gender: 'Female',
    quality: 'B-',
    traits: '🇬🇧 Best British',
  },
  {
    id: 'bf_isabella',
    name: 'Isabella',
    language: 'en-gb',
    languageLabel: 'British English',
    gender: 'Female',
    quality: 'C',
  },
  {
    id: 'bf_alice',
    name: 'Alice',
    language: 'en-gb',
    languageLabel: 'British English',
    gender: 'Female',
    quality: 'D',
  },
  {
    id: 'bf_lily',
    name: 'Lily',
    language: 'en-gb',
    languageLabel: 'British English',
    gender: 'Female',
    quality: 'D',
  },
  // British English - Male
  {
    id: 'bm_george',
    name: 'George',
    language: 'en-gb',
    languageLabel: 'British English',
    gender: 'Male',
    quality: 'C',
  },
  {
    id: 'bm_fable',
    name: 'Fable',
    language: 'en-gb',
    languageLabel: 'British English',
    gender: 'Male',
    quality: 'C',
  },
  {
    id: 'bm_lewis',
    name: 'Lewis',
    language: 'en-gb',
    languageLabel: 'British English',
    gender: 'Male',
    quality: 'D+',
  },
  {
    id: 'bm_daniel',
    name: 'Daniel',
    language: 'en-gb',
    languageLabel: 'British English',
    gender: 'Male',
    quality: 'D',
  },
  // Japanese - Female
  {
    id: 'jf_alpha',
    name: 'Alpha',
    language: 'ja',
    languageLabel: 'Japanese',
    gender: 'Female',
    quality: 'C+',
    traits: '🎌 Best Japanese',
  },
  {
    id: 'jf_gongitsune',
    name: 'Gongitsune',
    language: 'ja',
    languageLabel: 'Japanese',
    gender: 'Female',
    quality: 'C',
  },
  {
    id: 'jf_tebukuro',
    name: 'Tebukuro',
    language: 'ja',
    languageLabel: 'Japanese',
    gender: 'Female',
    quality: 'C',
  },
  {
    id: 'jf_nezumi',
    name: 'Nezumi',
    language: 'ja',
    languageLabel: 'Japanese',
    gender: 'Female',
    quality: 'C-',
  },
  // Japanese - Male
  {
    id: 'jm_kumo',
    name: 'Kumo',
    language: 'ja',
    languageLabel: 'Japanese',
    gender: 'Male',
    quality: 'C-',
  },
  // Mandarin Chinese - Female
  {
    id: 'zf_xiaobei',
    name: 'Xiaobei',
    language: 'zh',
    languageLabel: 'Mandarin Chinese',
    gender: 'Female',
    quality: 'D',
    traits: '🇨🇳 Chinese',
  },
  {
    id: 'zf_xiaoni',
    name: 'Xiaoni',
    language: 'zh',
    languageLabel: 'Mandarin Chinese',
    gender: 'Female',
    quality: 'D',
  },
  {
    id: 'zf_xiaoxiao',
    name: 'Xiaoxiao',
    language: 'zh',
    languageLabel: 'Mandarin Chinese',
    gender: 'Female',
    quality: 'D',
  },
  {
    id: 'zf_xiaoyi',
    name: 'Xiaoyi',
    language: 'zh',
    languageLabel: 'Mandarin Chinese',
    gender: 'Female',
    quality: 'D',
  },
  // Mandarin Chinese - Male
  {
    id: 'zm_yunjian',
    name: 'Yunjian',
    language: 'zh',
    languageLabel: 'Mandarin Chinese',
    gender: 'Male',
    quality: 'D',
  },
  {
    id: 'zm_yunxi',
    name: 'Yunxi',
    language: 'zh',
    languageLabel: 'Mandarin Chinese',
    gender: 'Male',
    quality: 'D',
  },
  {
    id: 'zm_yunxia',
    name: 'Yunxia',
    language: 'zh',
    languageLabel: 'Mandarin Chinese',
    gender: 'Male',
    quality: 'D',
  },
  {
    id: 'zm_yunyang',
    name: 'Yunyang',
    language: 'zh',
    languageLabel: 'Mandarin Chinese',
    gender: 'Male',
    quality: 'D',
  },
  // Spanish - Female
  {
    id: 'ef_dora',
    name: 'Dora',
    language: 'es',
    languageLabel: 'Spanish',
    gender: 'Female',
    quality: '-',
    traits: '🇪🇸 Spanish',
  },
  // Spanish - Male
  {
    id: 'em_alex',
    name: 'Alex',
    language: 'es',
    languageLabel: 'Spanish',
    gender: 'Male',
    quality: '-',
  },
  {
    id: 'em_santa',
    name: 'Santa',
    language: 'es',
    languageLabel: 'Spanish',
    gender: 'Male',
    quality: '-',
  },
  // French - Female
  {
    id: 'ff_siwis',
    name: 'Siwis',
    language: 'fr',
    languageLabel: 'French',
    gender: 'Female',
    quality: 'B-',
    traits: '🇫🇷 French',
  },
  // Hindi - Female
  {
    id: 'hf_alpha',
    name: 'Alpha',
    language: 'hi',
    languageLabel: 'Hindi',
    gender: 'Female',
    quality: 'C',
    traits: '🇮🇳 Hindi',
  },
  {
    id: 'hf_beta',
    name: 'Beta',
    language: 'hi',
    languageLabel: 'Hindi',
    gender: 'Female',
    quality: 'C',
  },
  // Hindi - Male
  {
    id: 'hm_omega',
    name: 'Omega',
    language: 'hi',
    languageLabel: 'Hindi',
    gender: 'Male',
    quality: 'C',
  },
  {
    id: 'hm_psi',
    name: 'Psi',
    language: 'hi',
    languageLabel: 'Hindi',
    gender: 'Male',
    quality: 'C',
  },
  // Italian - Female
  {
    id: 'if_sara',
    name: 'Sara',
    language: 'it',
    languageLabel: 'Italian',
    gender: 'Female',
    quality: 'C',
    traits: '🇮🇹 Italian',
  },
  // Italian - Male
  {
    id: 'im_nicola',
    name: 'Nicola',
    language: 'it',
    languageLabel: 'Italian',
    gender: 'Male',
    quality: 'C',
  },
  // Brazilian Portuguese - Female
  {
    id: 'pf_dora',
    name: 'Dora',
    language: 'pt',
    languageLabel: 'Brazilian Portuguese',
    gender: 'Female',
    quality: '-',
    traits: '🇧🇷 Portuguese',
  },
  // Brazilian Portuguese - Male
  {
    id: 'pm_alex',
    name: 'Alex',
    language: 'pt',
    languageLabel: 'Brazilian Portuguese',
    gender: 'Male',
    quality: '-',
  },
  {
    id: 'pm_santa',
    name: 'Santa',
    language: 'pt',
    languageLabel: 'Brazilian Portuguese',
    gender: 'Male',
    quality: '-',
  },
];

// Get voices filtered by language
export function getVoicesByLanguage(
  language: KokoroLanguage
): KokoroVoiceInfo[] {
  return KOKORO_VOICES.filter((v) => v.language === language);
}

// Map target language code to Kokoro language code
export function targetLanguageToKokoroLanguage(
  targetLang: string
): KokoroLanguage | null {
  const mapping: Record<string, KokoroLanguage> = {
    'ja': 'ja',
    'zh': 'zh',
    'es': 'es',
    'fr': 'fr',
    'hi': 'hi',
    'it': 'it',
    'pt': 'pt',
    'en': 'en-us', // Default English to American
  };
  return mapping[targetLang] ?? null;
}

// Check if Kokoro supports a given target language
export function isKokoroSupportedLanguage(targetLang: string): boolean {
  // Korean is NOT supported by Kokoro
  if (targetLang === 'ko') return false;
  return targetLanguageToKokoroLanguage(targetLang) !== null;
}

// Get default voice for a target language
export function getDefaultVoiceForLanguage(targetLang: string): KokoroVoice {
  const langMap: Record<string, KokoroVoice> = {
    'ja': 'jf_alpha',      // Best Japanese voice
    'zh': 'zf_xiaobei',    // Chinese voice
    'es': 'ef_dora',       // Spanish voice
    'fr': 'ff_siwis',      // French voice (only one)
    'hi': 'hf_alpha',      // Hindi voice
    'it': 'if_sara',       // Italian voice
    'pt': 'pf_dora',       // Portuguese voice
    'en': 'af_heart',      // Best English voice
  };
  return langMap[targetLang] ?? 'af_heart';
}

// Get all voices available for a target language
export function getVoicesForTargetLanguage(targetLang: string): KokoroVoiceInfo[] {
  const kokoroLang = targetLanguageToKokoroLanguage(targetLang);
  if (!kokoroLang) return [];
  return getVoicesByLanguage(kokoroLang);
}

// Get voices filtered by gender
export function getVoicesByGender(
  gender: 'Female' | 'Male'
): KokoroVoiceInfo[] {
  return KOKORO_VOICES.filter((v) => v.gender === gender);
}

// Get voice info by ID
export function getVoiceInfo(voiceId: KokoroVoice): KokoroVoiceInfo | undefined {
  return KOKORO_VOICES.find((v) => v.id === voiceId);
}

// Storage key for voice preferences (per-language)
const VOICE_STORAGE_KEY_PREFIX = 'murmura_kokoro_voice_';

// Get saved voice preference for a specific target language
export function getSavedVoice(targetLang?: string): KokoroVoice {
  if (typeof window === 'undefined') {
    return targetLang ? getDefaultVoiceForLanguage(targetLang) : 'af_heart';
  }

  // If target language specified, get per-language preference
  if (targetLang) {
    const langKey = `${VOICE_STORAGE_KEY_PREFIX}${targetLang}`;
    const saved = localStorage.getItem(langKey);
    if (saved && KOKORO_VOICES.some((v) => v.id === saved)) {
      return saved as KokoroVoice;
    }
    return getDefaultVoiceForLanguage(targetLang);
  }

  // Legacy: check for old single-voice preference
  const legacyKey = 'murmura_kokoro_voice';
  const legacySaved = localStorage.getItem(legacyKey);
  if (legacySaved && KOKORO_VOICES.some((v) => v.id === legacySaved)) {
    return legacySaved as KokoroVoice;
  }

  return 'af_heart'; // Default to best quality voice
}

// Save voice preference for a specific target language
export function saveVoice(voiceId: KokoroVoice, targetLang?: string): void {
  if (typeof window === 'undefined') return;

  if (targetLang) {
    const langKey = `${VOICE_STORAGE_KEY_PREFIX}${targetLang}`;
    localStorage.setItem(langKey, voiceId);
  } else {
    // Legacy single-voice storage
    localStorage.setItem('murmura_kokoro_voice', voiceId);
  }
}

// Get all saved voice preferences
export function getAllSavedVoices(): Record<string, KokoroVoice> {
  if (typeof window === 'undefined') return {};

  const voices: Record<string, KokoroVoice> = {};
  const languages = ['ja', 'zh', 'es', 'fr', 'hi', 'it', 'pt', 'en'];

  for (const lang of languages) {
    voices[lang] = getSavedVoice(lang);
  }

  return voices;
}

export interface KokoroLoadProgress {
  status: 'downloading' | 'loading' | 'ready' | 'error';
  progress: number; // 0-100
  message: string;
}

type ProgressCallback = (progress: KokoroLoadProgress) => void;

/**
 * Check if the Kokoro model is loaded and ready
 */
export function isKokoroLoaded(): boolean {
  return ttsInstance !== null;
}

/**
 * Check if Kokoro is currently loading
 */
export function isKokoroLoading(): boolean {
  return isLoading;
}

/**
 * Get the last load error if any
 */
export function getKokoroLoadError(): Error | null {
  return loadError;
}

/**
 * Get estimated model size for user display
 */
export function getKokoroModelSize(): number {
  return MODEL_SIZE_MB;
}

/**
 * Check if the browser supports WebGPU or WebAssembly for running the model
 */
export function checkKokoroSupport(): {
  supported: boolean;
  device: 'webgpu' | 'wasm' | null;
  reason?: string;
} {
  if (typeof window === 'undefined') {
    return { supported: false, device: null, reason: 'Server-side rendering' };
  }

  // Check WebGPU support (best performance)
  if ('gpu' in navigator) {
    return { supported: true, device: 'webgpu' };
  }

  // Check WebAssembly support (fallback, works everywhere)
  if (typeof WebAssembly !== 'undefined') {
    return { supported: true, device: 'wasm' };
  }

  return {
    supported: false,
    device: null,
    reason: 'Neither WebGPU nor WebAssembly is supported',
  };
}

/**
 * Load the Kokoro TTS model
 * This downloads ~82MB on first load, cached in IndexedDB after
 */
export async function loadKokoroModel(
  onProgress?: ProgressCallback
): Promise<void> {
  if (ttsInstance) {
    onProgress?.({
      status: 'ready',
      progress: 100,
      message: 'Model already loaded',
    });
    return;
  }

  if (isLoading) {
    throw new Error('Model is already loading');
  }

  const support = checkKokoroSupport();
  if (!support.supported) {
    throw new Error(`Kokoro not supported: ${support.reason}`);
  }

  isLoading = true;
  loadError = null;

  try {
    onProgress?.({
      status: 'downloading',
      progress: 0,
      message: 'Loading Kokoro TTS library...',
    });

    // Dynamically import kokoro-js
    const { KokoroTTS } = await import('kokoro-js');

    onProgress?.({
      status: 'downloading',
      progress: 10,
      message: 'Downloading Kokoro model (~82MB)...',
    });

    // Load the model with the correct model ID and quantization
    ttsInstance = await KokoroTTS.from_pretrained(MODEL_ID, {
      dtype: 'q8', // Use quantized model for smaller size
      progress_callback: (progressData) => {
        const progress =
          typeof progressData === 'object' && progressData !== null
            ? (progressData as { progress?: number }).progress ?? 0
            : 0;
        const adjustedProgress = 10 + progress * 0.85;
        onProgress?.({
          status: 'downloading',
          progress: Math.round(adjustedProgress),
          message: `Downloading model: ${Math.round(progress)}%`,
        });
      },
    });

    onProgress?.({
      status: 'ready',
      progress: 100,
      message: 'Model ready',
    });
  } catch (error) {
    loadError = error instanceof Error ? error : new Error(String(error));
    ttsInstance = null;
    onProgress?.({
      status: 'error',
      progress: 0,
      message: loadError.message,
    });
    throw loadError;
  } finally {
    isLoading = false;
  }
}

/**
 * Unload the Kokoro model to free memory
 */
export function unloadKokoroModel(): void {
  ttsInstance = null;
  loadError = null;
}

/**
 * Speak text using the Kokoro model
 * Model must be loaded first via loadKokoroModel()
 * @param text Text to speak
 * @param voice Voice ID to use (defaults to saved preference)
 * @param volume Volume level 0-1
 */
export async function speakWithKokoro(
  text: string,
  voice?: KokoroVoice,
  volume = 0.8
): Promise<void> {
  if (!ttsInstance) {
    throw new Error('Kokoro model not loaded. Call loadKokoroModel() first.');
  }

  const selectedVoice = voice ?? getSavedVoice();

  // Generate audio using kokoro-js
  // Cast options to bypass kokoro-js types which don't include all supported voices
  const output = await ttsInstance.generate(text, { voice: selectedVoice } as Parameters<typeof ttsInstance.generate>[1]);

  // Convert Float32Array to audio blob
  const audioBlob = float32ToWavBlob(
    output.audio as Float32Array,
    output.sampling_rate
  );
  const audioUrl = URL.createObjectURL(audioBlob);
  const audio = new Audio(audioUrl);
  audio.volume = volume;

  return new Promise<void>((resolve, reject) => {
    audio.onended = () => {
      URL.revokeObjectURL(audioUrl);
      resolve();
    };
    audio.onerror = () => {
      URL.revokeObjectURL(audioUrl);
      reject(new Error('Failed to play Kokoro audio'));
    };
    audio.play().catch(reject);
  });
}

/**
 * Convert Float32Array audio data to WAV blob
 */
function float32ToWavBlob(audioData: Float32Array, sampleRate: number): Blob {
  const numChannels = 1;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = audioData.length * bytesPerSample;
  const headerSize = 44;
  const totalSize = headerSize + dataSize;

  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);

  // WAV header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, totalSize - 8, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, 1, true); // audio format (PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // Audio data - convert float32 to int16
  const offset = 44;
  for (let i = 0; i < audioData.length; i++) {
    const sample = Math.max(-1, Math.min(1, audioData[i]));
    const int16Sample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    view.setInt16(offset + i * 2, int16Sample, true);
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}
