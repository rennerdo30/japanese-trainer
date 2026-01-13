'use client'

import { useCallback, useRef } from 'react';

interface TTSOptions {
    lang?: string;
    volume?: number;
    rate?: number;
    pitch?: number;
    audioUrl?: string; // ElevenLabs audio URL
}

export function useTTS() {
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const speak = useCallback((text: string, options: TTSOptions = {}): SpeechSynthesisUtterance | HTMLAudioElement | undefined => {
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

        // Try ElevenLabs audio first if audioUrl is provided
        if (options.audioUrl) {
            try {
                const audio = new Audio(options.audioUrl);
                audio.volume = options.volume ?? 0.8;
                audio.playbackRate = options.rate ?? 1.0;
                
                audio.onerror = () => {
                    // Fallback to Web Speech API if audio fails to load
                    fallbackToWebSpeech(text, options);
                };
                
                audioRef.current = audio;
                audio.play().catch(() => {
                    // If play fails, fallback to Web Speech API
                    fallbackToWebSpeech(text, options);
                });
                
                return audio;
            } catch (error) {
                // If audio creation fails, fallback to Web Speech API
                console.warn('Failed to play ElevenLabs audio, falling back to Web Speech API:', error);
            }
        }

        // Fallback to Web Speech API
        return fallbackToWebSpeech(text, options);
    }, []);

    const fallbackToWebSpeech = (text: string, options: TTSOptions): SpeechSynthesisUtterance | undefined => {
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
            return;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = options.lang || 'ja-JP';
        utterance.volume = options.volume ?? 0.5;
        utterance.rate = options.rate ?? 0.9;
        utterance.pitch = options.pitch ?? 1;

        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);

        return utterance;
    };

    const cancel = useCallback(() => {
        if (typeof window !== 'undefined') {
            if (window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        }
    }, []);

    return { speak, cancel };
}
