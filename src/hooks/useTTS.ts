'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
import { useTargetLanguage } from '@/hooks/useTargetLanguage';
import {
  isKokoroLoaded,
  isKokoroLoading,
  speakWithKokoro,
  loadKokoroModel,
  checkKokoroSupport,
} from '@/lib/kokoroTTS';
import { isMobileDevice } from '@/lib/mobileDetection';

interface TTSOptions {
  lang?: string;
  volume?: number;
  rate?: number;
  pitch?: number;
  audioUrl?: string; // ElevenLabs pre-generated audio URL
}

/**
 * TTS tier definitions for fallback chain
 * Tier 1: Pre-generated ElevenLabs audio (best quality, instant)
 * Tier 2: Kokoro browser TTS (good quality, English only, if model loaded)
 * Tier 3: Web Speech API (variable quality, always available)
 */
type TTSTier = 'pregenerated' | 'kokoro' | 'webspeech';

// Global audio preload cache (shared across hook instances)
const audioPreloadCache = new Map<string, HTMLAudioElement>();
const MAX_CACHE_SIZE = 50; // Limit cache to prevent memory issues

/**
 * Clean up old cache entries if cache exceeds max size
 */
function trimCache() {
  if (audioPreloadCache.size > MAX_CACHE_SIZE) {
    // Remove oldest entries (first ones added)
    const keysToRemove = Array.from(audioPreloadCache.keys()).slice(0, 10);
    for (const key of keysToRemove) {
      audioPreloadCache.delete(key);
    }
  }
}

export function useTTS() {
  const { ttsVoice } = useTargetLanguage();
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [lastUsedTier, setLastUsedTier] = useState<TTSTier | null>(null);
  const [kokoroReady, setKokoroReady] = useState(false);

  // Auto-load Kokoro on desktop browsers in background
  useEffect(() => {
    // Skip if already loaded or loading
    if (isKokoroLoaded() || isKokoroLoading()) {
      setKokoroReady(isKokoroLoaded());
      return;
    }

    // Skip on mobile - user must enable manually in settings
    if (isMobileDevice()) {
      return;
    }

    // Check if Kokoro is supported
    const support = checkKokoroSupport();
    if (!support.supported) {
      return;
    }

    // Load Kokoro in background on desktop
    loadKokoroModel()
      .then(() => {
        setKokoroReady(true);
        console.log('Kokoro TTS loaded in background');
      })
      .catch((error) => {
        console.warn('Failed to load Kokoro TTS in background:', error);
      });
  }, []);

  // Cleanup: stop audio when component unmounts (page navigation)
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') {
        if (window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }
      }
    };
  }, []);

  /**
   * Preload a single audio file into the cache
   */
  const preloadAudio = useCallback(
    (audioUrl: string): HTMLAudioElement | null => {
      if (typeof window === 'undefined' || !audioUrl) {
        return null;
      }

      // Check if already in cache
      if (audioPreloadCache.has(audioUrl)) {
        return audioPreloadCache.get(audioUrl) || null;
      }

      try {
        const audio = new Audio(audioUrl);
        audio.preload = 'auto';
        audio.load();

        // Add to cache
        audioPreloadCache.set(audioUrl, audio);
        trimCache();

        return audio;
      } catch (error) {
        console.warn('Failed to preload audio:', error);
        return null;
      }
    },
    []
  );

  /**
   * Preload multiple audio files in batch (e.g., next 5 vocabulary items)
   * This is useful for preloading upcoming content while user is viewing current content
   */
  const preloadBatch = useCallback(
    (audioUrls: (string | undefined | null)[]): void => {
      if (typeof window === 'undefined') {
        return;
      }

      // Filter out undefined/null and already cached URLs
      const urlsToPreload = audioUrls.filter(
        (url): url is string => !!url && !audioPreloadCache.has(url)
      );

      // Preload each URL
      for (const url of urlsToPreload) {
        preloadAudio(url);
      }
    },
    [preloadAudio]
  );

  // Tier 1: Play pre-generated audio file (uses cache if available)
  const playPregenerated = useCallback(
    async (audioUrl: string, volume: number, rate: number): Promise<void> => {
      return new Promise((resolve, reject) => {
        // Check cache first for instant playback
        let audio = audioPreloadCache.get(audioUrl);

        if (audio) {
          // Use cached audio - reset to beginning
          audio.currentTime = 0;
        } else {
          // Create new audio element and add to cache
          audio = new Audio(audioUrl);
          audioPreloadCache.set(audioUrl, audio);
          trimCache();
        }

        audio.volume = volume;
        audio.playbackRate = rate;
        audioRef.current = audio;

        audio.onended = () => {
          audioRef.current = null;
          resolve();
        };

        audio.onerror = () => {
          audioRef.current = null;
          // Remove failed audio from cache
          audioPreloadCache.delete(audioUrl);
          reject(new Error('Failed to play pre-generated audio'));
        };

        audio.play().catch(reject);
      });
    },
    []
  );

  // Tier 3: Web Speech API fallback
  const speakWithWebSpeech = useCallback(
    (text: string, options: TTSOptions, defaultLang: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (
          typeof window === 'undefined' ||
          !('speechSynthesis' in window)
        ) {
          reject(new Error('Web Speech API not available'));
          return;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = options.lang || defaultLang;
        utterance.volume = options.volume ?? 0.5;
        utterance.rate = options.rate ?? 0.9;
        utterance.pitch = options.pitch ?? 1;

        utterance.onend = () => {
          utteranceRef.current = null;
          resolve();
        };

        utterance.onerror = (event) => {
          utteranceRef.current = null;
          reject(new Error(`Web Speech error: ${event.error}`));
        };

        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
      });
    },
    []
  );

  // Shared TTS fallback chain logic
  const executeTTSFallback = useCallback(
    async (
      text: string,
      options: TTSOptions,
      lang: string,
      volume: number,
      rate: number
    ): Promise<TTSTier> => {
      // Tier 1: Pre-generated ElevenLabs audio
      if (options.audioUrl) {
        try {
          await playPregenerated(options.audioUrl, volume, rate);
          return 'pregenerated';
        } catch {
          // Fall through to next tier
        }
      }

      // Tier 2: Kokoro (if model loaded - English only)
      if (isKokoroLoaded()) {
        try {
          await speakWithKokoro(text, undefined, volume);
          return 'kokoro';
        } catch {
          // Fall through to next tier
        }
      }

      // Tier 3: Web Speech API
      await speakWithWebSpeech(text, { ...options, volume }, lang);
      return 'webspeech';
    },
    [playPregenerated, speakWithWebSpeech]
  );

  // Main speak function with 3-tier fallback
  const speak = useCallback(
    (
      text: string,
      options: TTSOptions = {}
    ): SpeechSynthesisUtterance | HTMLAudioElement | undefined => {
      if (typeof window === 'undefined') {
        return;
      }

      // Cancel any ongoing speech
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      setIsPlaying(true);

      const lang = options.lang || ttsVoice;
      const volume = options.volume ?? 0.8;
      const rate = options.rate ?? 1.0;

      // Async fallback chain using shared helper
      (async () => {
        try {
          const tier = await executeTTSFallback(text, options, lang, volume, rate);
          setLastUsedTier(tier);
        } catch (error) {
          console.warn('All TTS tiers failed:', error);
        } finally {
          setIsPlaying(false);
        }
      })();

      // Return the audio ref for backwards compatibility
      return audioRef.current ?? undefined;
    },
    [ttsVoice, executeTTSFallback]
  );

  // speakAndWait with 3-tier fallback
  const speakAndWait = useCallback(
    async (text: string, options: TTSOptions = {}): Promise<void> => {
      if (typeof window === 'undefined') {
        return;
      }

      // Cancel any ongoing speech
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      setIsPlaying(true);

      const lang = options.lang || ttsVoice;
      const volume = options.volume ?? 0.8;
      const rate = options.rate ?? 1.0;

      try {
        const tier = await executeTTSFallback(text, options, lang, volume, rate);
        setLastUsedTier(tier);
      } catch (error) {
        console.warn('All TTS tiers failed:', error);
      } finally {
        setIsPlaying(false);
      }
    },
    [ttsVoice, executeTTSFallback]
  );

  const cancel = useCallback(() => {
    if (typeof window !== 'undefined') {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setIsPlaying(false);
    }
  }, []);

  // Alias for cancel - more intuitive for UI buttons
  const stop = cancel;

  return {
    speak,
    speakAndWait,
    preloadAudio,
    preloadBatch,
    cancel,
    stop,
    isPlaying,
    lastUsedTier,
    kokoroReady,
  };
}
