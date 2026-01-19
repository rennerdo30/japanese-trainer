'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
import { useTargetLanguage } from '@/hooks/useTargetLanguage';
import {
  isKokoroLoaded,
  isKokoroLoading,
  speakWithKokoro,
  generateKokoroAudio,
  loadKokoroModel,
  checkKokoroSupport,
  isKokoroSupportedLanguage,
} from '@/lib/kokoroTTS';
import {
  isEdgeTTSSupported,
  generateEdgeTTSAudio,
} from '@/lib/edgeTTS';
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
 * Tier 2: Edge TTS (high quality, all languages including Japanese/Korean/Chinese)
 * Tier 3: Kokoro browser TTS (English only, if model loaded)
 * Tier 4: Web Speech API (variable quality, always available)
 */
type TTSTier = 'pregenerated' | 'edge' | 'kokoro' | 'webspeech';

// Global audio preload cache (shared across hook instances)
const audioPreloadCache = new Map<string, HTMLAudioElement>();
const MAX_CACHE_SIZE = 50; // Limit cache to prevent memory issues

// Kokoro audio cache (text -> blobUrl)
const kokoroCache = new Map<string, string>();
const MAX_KOKORO_CACHE_SIZE = 20;

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

  if (kokoroCache.size > MAX_KOKORO_CACHE_SIZE) {
    const keysToRemove = Array.from(kokoroCache.keys()).slice(0, 5);
    for (const key of keysToRemove) {
      const url = kokoroCache.get(key);
      if (url) URL.revokeObjectURL(url);
      kokoroCache.delete(key);
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
   * Preload Kokoro audio for a given text
   */
  const preloadKokoro = useCallback(async (text: string, lang: string) => {
    if (
      typeof window === 'undefined' ||
      !isKokoroLoaded() ||
      !isKokoroSupportedLanguage(lang) ||
      kokoroCache.has(text)
    ) {
      return;
    }

    try {
      const url = await generateKokoroAudio(text);
      kokoroCache.set(text, url);
      trimCache();
    } catch (error) {
      console.warn('Failed to preload Kokoro audio:', error);
    }
  }, []);

  /**
   * Preload Edge TTS audio for a given text
   */
  const preloadEdge = useCallback(async (text: string, lang: string) => {
    if (typeof window === 'undefined' || !isEdgeTTSSupported(lang)) {
      return;
    }

    try {
      await generateEdgeTTSAudio(text, lang);
    } catch (error) {
      console.warn('Failed to preload Edge TTS audio:', error);
    }
  }, []);

  /**
   * Preload multiple audio files in batch (e.g., next 5 vocabulary items)
   * This is useful for preloading upcoming content while user is viewing current content
   */
  const preloadBatch = useCallback(
    (audioUrls: (string | undefined | null)[], texts: string[] = [], lang?: string): void => {
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

      // Preload Kokoro for texts if no audio URL is available
      if (lang) {
        const edgeSupported = isEdgeTTSSupported(lang);
        const kokoroLoaded = isKokoroLoaded();
        const kokoroSupported = isKokoroSupportedLanguage(lang);

        texts.forEach((text, index) => {
          // Only preload if there is no pre-generated audio URL for this item
          if (!audioUrls[index]) {
            // Prioritize Edge TTS for preloading as it supports all languages
            if (edgeSupported) {
              preloadEdge(text, lang);
            } else if (kokoroLoaded && kokoroSupported) {
              preloadKokoro(text, lang);
            }
          }
        });
      }
    },
    [preloadAudio, preloadKokoro, preloadEdge]
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

  // Helper to play a blob URL (for Kokoro)
  const playBlobUrl = useCallback(
    async (blobUrl: string, volume: number, rate: number): Promise<void> => {
      return new Promise((resolve, reject) => {
        const audio = new Audio(blobUrl);
        audio.volume = volume;
        // Note: playbackRate might need more handling for pitch correction if significantly altered,
        // but for basic speed it works.
        audio.playbackRate = rate;
        audioRef.current = audio;

        audio.onended = () => {
          audioRef.current = null;
          resolve();
        };

        audio.onerror = () => {
          audioRef.current = null;
          reject(new Error('Failed to play blob audio'));
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

        // Cancel existing speech to prevent queueing weirdness
        window.speechSynthesis.cancel();

        // Debug available voices
        const availableVoices = window.speechSynthesis.getVoices();
        console.log(`Available voices: ${availableVoices.length}`,
          availableVoices.map(v => `${v.name} (${v.lang})`).filter(n => n.includes('JP') || n.includes('ja') || n.includes('JA'))
        );

        const utterance = new SpeechSynthesisUtterance(text);
        // Map basic language codes to full locales if needed
        let speechLang = options.lang || defaultLang;
        if (speechLang === 'ja') speechLang = 'ja-JP';
        else if (speechLang === 'ko') speechLang = 'ko-KR';
        else if (speechLang === 'zh') speechLang = 'zh-CN';

        utterance.lang = speechLang;
        utterance.volume = options.volume ?? 1.0;
        utterance.rate = options.rate ?? 0.9;
        utterance.pitch = options.pitch ?? 1;

        // VERBOSE DEBUGGING
        const allVoices = window.speechSynthesis.getVoices();
        const matchingVoices = allVoices.filter(v => v.lang.includes(speechLang) || v.lang.includes(defaultLang));

        console.group('TTS Debug: speakWithWebSpeech');
        console.log('Text:', text);
        console.log('Requested Lang:', speechLang);
        console.log('All Voices Count:', allVoices.length);
        console.log('Matching Voices:', matchingVoices.map(v => `${v.name} (${v.lang})`));

        // Explicitly set voice if we find a good match for the language
        // Prioritize local system voices (Samantha, Kyoko, Daniel) over network voices (Google)
        // Network voices often fail silently if connection is flaky or quota exceeded
        const preferredVoice = matchingVoices.find(v => v.name.includes('Kyoko'))
          || matchingVoices.find(v => v.name.includes('Samantha') && speechLang.includes('en'))
          || matchingVoices.find(v => v.name.includes('Daniel') && speechLang.includes('en'))
          || matchingVoices.find(v => !v.name.includes('Google') && v.lang === speechLang)
          || matchingVoices.find(v => v.name.includes('Google') && v.lang === speechLang)
          || matchingVoices[0];

        if (preferredVoice) {
          console.log('Force setting voice to:', preferredVoice.name);
          utterance.voice = preferredVoice;
        } else {
          console.warn('No matching voice found for lang:', speechLang);
        }
        console.groupEnd();

        utterance.onstart = () => {
          console.log('TTS Event: onstart');
        };

        utterance.onend = () => {
          console.log('TTS Event: onend');
          utteranceRef.current = null;
          resolve();
        };

        utterance.onerror = (event) => {
          console.error('TTS Event: onerror', event);
          utteranceRef.current = null;
          if (event.error === 'canceled' || event.error === 'interrupted') {
            resolve();
          } else {
            reject(new Error(`Web Speech error: ${event.error}`));
          }
        };

        // Explicitly resume (fixes Chrome "stuck" state)
        if (window.speechSynthesis.paused) {
          console.log('Resume paused synthesis');
          window.speechSynthesis.resume();
        }

        utteranceRef.current = utterance;

        // WORKAROUND: Attach to window to prevent Garbage Collection (common Chrome bug)
        // @ts-ignore
        window.activeUtterance = utterance;

        window.speechSynthesis.speak(utterance);

        // Log status after speak call
        console.log('Speech status:', {
          pending: window.speechSynthesis.pending,
          speaking: window.speechSynthesis.speaking,
          paused: window.speechSynthesis.paused
        });
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
      console.log(`[TTS] executeTTSFallback called. Text: "${text}", Lang: ${lang}, AudioUrl: ${options.audioUrl ? 'YES' : 'NO'}`);

      // Tier 1: Pre-generated ElevenLabs audio
      if (options.audioUrl) {
        try {
          await playPregenerated(options.audioUrl, volume, rate);
          return 'pregenerated';
        } catch {
          // Fall through to next tier
        }
      }

      // Tier 2: Edge TTS (Microsoft neural voices - high priority for all languages)
      if (isEdgeTTSSupported(lang)) {
        try {
          console.log(`[TTS] Trying Edge TTS for ${lang}`);
          const blobUrl = await generateEdgeTTSAudio(text, lang);
          await playBlobUrl(blobUrl, volume, rate);
          return 'edge';
        } catch (e) {
          console.warn('Edge TTS failed, falling back', e);
          // Fall through to Kokoro
        }
      }

      // Tier 3: Kokoro (if model loaded and supported - backup for Edge)
      const kokoroLoaded = isKokoroLoaded();
      const kokoroSupported = isKokoroSupportedLanguage(lang);

      if (kokoroLoaded && kokoroSupported) {
        try {
          // Check cache first
          if (kokoroCache.has(text)) {
            console.log('Using cached Kokoro audio');
            await playBlobUrl(kokoroCache.get(text)!, volume, rate);
            return 'kokoro';
          }

          // Generate and cache - pass lang for correct voice selection
          const blobUrl = await generateKokoroAudio(text, undefined, lang);
          kokoroCache.set(text, blobUrl);
          trimCache();

          await playBlobUrl(blobUrl, volume, rate);

          return 'kokoro';
        } catch (e) {
          console.warn('Kokoro generation failed, falling back', e);
          // Fall through to Web Speech
        }
      }

      // Tier 4: Web Speech API (final fallback)
      console.log('Falling back to Web Speech API. Lang:', lang);
      await speakWithWebSpeech(text, { ...options, volume }, lang);
      return 'webspeech';
    },
    [playPregenerated, speakWithWebSpeech, playBlobUrl]
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
          // Only log legitimate errors, ignore expected cancellations if any bubble up
          if (error instanceof Error && error.message.includes('canceled')) {
            return;
          }
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
        if (error instanceof Error && error.message.includes('canceled')) {
          return;
        }
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
    preloadBatch, // Now supports Kokoro preloading implicitly if we add the logic
    preloadKokoro, // Exposed for specific use cases
    cancel,
    stop,
    isPlaying,
    lastUsedTier,
    kokoroReady,
  };
}
