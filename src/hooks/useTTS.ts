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

/**
 * Check if device is mobile
 */
function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  const nav = navigator as Navigator & { vendor?: string };
  const win = window as Window & { opera?: string };
  const userAgent = navigator.userAgent || nav.vendor || win.opera || '';
  const mobileRegex =
    /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
  const isUserAgentMobile = mobileRegex.test(userAgent.toLowerCase());
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isSmallScreen = window.innerWidth < 768;
  const conditions = [isUserAgentMobile, hasTouch, isSmallScreen];
  return conditions.filter(Boolean).length >= 2;
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

  const preloadAudio = useCallback(
    (audioUrl: string): HTMLAudioElement | null => {
      if (typeof window === 'undefined') {
        return null;
      }
      try {
        const audio = new Audio(audioUrl);
        audio.preload = 'auto';
        audio.load();
        return audio;
      } catch (error) {
        console.warn('Failed to preload audio:', error);
        return null;
      }
    },
    []
  );

  // Tier 1: Play pre-generated audio file
  const playPregenerated = useCallback(
    async (audioUrl: string, volume: number, rate: number): Promise<void> => {
      return new Promise((resolve, reject) => {
        const audio = new Audio(audioUrl);
        audio.volume = volume;
        audio.playbackRate = rate;
        audioRef.current = audio;

        audio.onended = () => {
          audioRef.current = null;
          resolve();
        };

        audio.onerror = () => {
          audioRef.current = null;
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

      // Async fallback chain
      (async () => {
        try {
          // Tier 1: Pre-generated ElevenLabs audio
          if (options.audioUrl) {
            try {
              await playPregenerated(options.audioUrl, volume, rate);
              setLastUsedTier('pregenerated');
              return;
            } catch {
              // Fall through to next tier
            }
          }

          // Tier 2: Kokoro (if model loaded - English only)
          if (isKokoroLoaded()) {
            try {
              // Kokoro uses saved voice preference, not language
              await speakWithKokoro(text, undefined, volume);
              setLastUsedTier('kokoro');
              return;
            } catch {
              // Fall through to next tier
            }
          }

          // Tier 3: Web Speech API
          await speakWithWebSpeech(text, { ...options, volume }, lang);
          setLastUsedTier('webspeech');
        } catch (error) {
          console.warn('All TTS tiers failed:', error);
        } finally {
          setIsPlaying(false);
        }
      })();

      // Return the audio ref for backwards compatibility
      return audioRef.current ?? undefined;
    },
    [ttsVoice, playPregenerated, speakWithWebSpeech]
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
        // Tier 1: Pre-generated ElevenLabs audio
        if (options.audioUrl) {
          try {
            await playPregenerated(options.audioUrl, volume, rate);
            setLastUsedTier('pregenerated');
            return;
          } catch {
            // Fall through to next tier
          }
        }

        // Tier 2: Kokoro (if model loaded - English only)
        if (isKokoroLoaded()) {
          try {
            // Kokoro uses saved voice preference, not language
            await speakWithKokoro(text, undefined, volume);
            setLastUsedTier('kokoro');
            return;
          } catch {
            // Fall through to next tier
          }
        }

        // Tier 3: Web Speech API
        await speakWithWebSpeech(text, { ...options, volume }, lang);
        setLastUsedTier('webspeech');
      } catch (error) {
        console.warn('All TTS tiers failed:', error);
      } finally {
        setIsPlaying(false);
      }
    },
    [ttsVoice, playPregenerated, speakWithWebSpeech]
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
    cancel,
    stop,
    isPlaying,
    lastUsedTier,
    kokoroReady,
  };
}
