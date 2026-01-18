/**
 * Puter.js TTS Integration
 * Provides free, unlimited TTS via cloud providers (AWS Polly, OpenAI, ElevenLabs)
 * https://developer.puter.com/tutorials/free-unlimited-text-to-speech-api/
 */

import type { PuterAPI, PuterTTSOptions } from '@/types/puter';

const PUTER_SCRIPT_URL = 'https://js.puter.com/v2/';

let puterLoadPromise: Promise<PuterAPI> | null = null;

/**
 * Dynamically load the Puter.js script
 * Returns cached promise if already loading/loaded
 */
export function loadPuterScript(): Promise<PuterAPI> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Puter.js requires browser environment'));
  }

  // Return existing puter instance if already loaded
  if (window.puter) {
    return Promise.resolve(window.puter);
  }

  // Return existing load promise if already loading
  if (puterLoadPromise) {
    return puterLoadPromise;
  }

  // Start loading the script
  puterLoadPromise = new Promise<PuterAPI>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = PUTER_SCRIPT_URL;
    script.async = true;

    script.onload = () => {
      // Give puter a moment to initialize
      const checkPuter = () => {
        if (window.puter) {
          resolve(window.puter);
        } else {
          setTimeout(checkPuter, 50);
        }
      };
      checkPuter();
    };

    script.onerror = () => {
      puterLoadPromise = null;
      reject(new Error('Failed to load Puter.js script'));
    };

    document.head.appendChild(script);
  });

  return puterLoadPromise;
}

/**
 * Check if Puter.js is available
 */
export function isPuterAvailable(): boolean {
  return typeof window !== 'undefined' && window.puter !== undefined;
}

/**
 * Get TTS options based on target language
 */
function getTTSOptions(lang: string): PuterTTSOptions {
  // Use ElevenLabs for best multilingual support (Japanese, Korean, Chinese)
  // AWS Polly works well for European languages
  const needsElevenLabs = ['ja', 'ko', 'zh', 'ar', 'hi'].some(
    (code) => lang.startsWith(code)
  );

  if (needsElevenLabs) {
    return {
      provider: 'elevenlabs',
      model: 'eleven_multilingual_v2',
    };
  }

  // Default to AWS Polly for other languages (good quality, fast)
  return {
    provider: 'aws-polly',
  };
}

/**
 * Speak text using Puter.js TTS
 * @param text Text to speak
 * @param lang Language code (e.g., 'ja', 'ko', 'en')
 * @param volume Volume level 0-1 (not directly supported by Puter, applied after)
 */
export async function speakWithPuter(
  text: string,
  lang: string,
  volume = 0.8
): Promise<void> {
  const puter = await loadPuterScript();
  const options = getTTSOptions(lang);

  const audioResponse = await puter.ai.txt2speech(text, options);

  // Get blob and create audio element for volume control
  const blob = await audioResponse.blob();
  const audio = new Audio(URL.createObjectURL(blob));
  audio.volume = volume;

  return new Promise<void>((resolve, reject) => {
    audio.onended = () => {
      URL.revokeObjectURL(audio.src);
      resolve();
    };
    audio.onerror = () => {
      URL.revokeObjectURL(audio.src);
      reject(new Error('Failed to play Puter TTS audio'));
    };
    audio.play().catch(reject);
  });
}

/**
 * Preload Puter.js script for faster first TTS
 */
export function preloadPuterScript(): void {
  if (typeof window !== 'undefined' && !window.puter) {
    loadPuterScript().catch(() => {
      // Silently fail preload - will retry on actual use
    });
  }
}
