'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import styles from './ListenRepeat.module.css';
import type { ListenRepeatPhrase } from '@/types/pronunciation';

interface ListenRepeatProps {
  phrases: ListenRepeatPhrase[];
  repeatCount?: number;
  onComplete?: (totalPhrases: number, totalRepeats: number) => void;
}

export function ListenRepeat({ phrases, repeatCount = 2, onComplete }: ListenRepeatProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentRepeat, setCurrentRepeat] = useState(0);
  const [phase, setPhase] = useState<'ready' | 'playing' | 'countdown' | 'repeat' | 'complete'>('ready');
  const [countdown, setCountdown] = useState(0);
  const [showText, setShowText] = useState(false);
  const [totalRepeats, setTotalRepeats] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const currentPhrase = phrases[currentIndex];
  const progress = ((currentIndex + 1) / phrases.length) * 100;

  // Cleanup countdown timer on unmount
  useEffect(() => {
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, []);

  const playAudio = useCallback(() => {
    if (currentPhrase.audioUrl && audioRef.current) {
      audioRef.current.src = currentPhrase.audioUrl;
      audioRef.current.play().catch(() => {
        // Audio play failed - maybe no audio file, proceed to countdown
        startCountdown();
      });
      setPhase('playing');
    } else {
      // No audio URL, proceed directly to countdown
      startCountdown();
    }
  }, [currentPhrase]);

  const startCountdown = useCallback(() => {
    const pauseDuration = currentPhrase.pauseDuration || 3000;
    const seconds = Math.ceil(pauseDuration / 1000);
    setCountdown(seconds);
    setPhase('countdown');

    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          if (countdownRef.current) {
            clearInterval(countdownRef.current);
          }
          setPhase('repeat');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [currentPhrase.pauseDuration]);

  const handleAudioEnded = useCallback(() => {
    startCountdown();
  }, [startCountdown]);

  const handleDoneRepeating = useCallback(() => {
    setTotalRepeats(prev => prev + 1);
    setShowText(true);

    // Check if we need more repeats
    if (currentRepeat < repeatCount - 1) {
      // More repeats for this phrase
      setCurrentRepeat(prev => prev + 1);
      setTimeout(() => {
        setShowText(false);
        playAudio();
      }, 2000);
    } else {
      // Move to next phrase or complete
      setTimeout(() => {
        if (currentIndex < phrases.length - 1) {
          setCurrentIndex(prev => prev + 1);
          setCurrentRepeat(0);
          setShowText(false);
          setPhase('ready');
        } else {
          setPhase('complete');
          onComplete?.(phrases.length, totalRepeats + 1);
        }
      }, 2000);
    }
  }, [currentRepeat, repeatCount, currentIndex, phrases.length, playAudio, totalRepeats, onComplete]);

  const handleStart = useCallback(() => {
    playAudio();
  }, [playAudio]);

  const handleReplay = useCallback(() => {
    if (audioRef.current && currentPhrase.audioUrl) {
      audioRef.current.src = currentPhrase.audioUrl;
      audioRef.current.play();
    }
  }, [currentPhrase]);

  const handleRestart = useCallback(() => {
    setCurrentIndex(0);
    setCurrentRepeat(0);
    setPhase('ready');
    setShowText(false);
    setTotalRepeats(0);
    setCountdown(0);
  }, []);

  if (phase === 'complete') {
    return (
      <div className={styles.container}>
        <div className={styles.complete}>
          <div className={styles.completeIcon}>&#127911;</div>
          <h3>Practice Complete!</h3>
          <p>
            You practiced {phrases.length} phrases, {totalRepeats} total repetitions.
          </p>
          <button className={styles.restartButton} onClick={handleRestart}>
            Practice Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Hidden audio element */}
      <audio ref={audioRef} onEnded={handleAudioEnded} />

      {/* Progress */}
      <div className={styles.progressContainer}>
        <div className={styles.progressBar} style={{ width: `${progress}%` }} />
        <span className={styles.progressText}>
          {currentIndex + 1} / {phrases.length}
        </span>
      </div>

      {/* Repeat counter */}
      <div className={styles.repeatCounter}>
        Repeat {currentRepeat + 1} / {repeatCount}
      </div>

      {/* Phrase display */}
      <div className={styles.phraseDisplay}>
        {phase === 'ready' && (
          <div className={styles.readyState}>
            <p className={styles.instruction}>Press play to hear the phrase</p>
            <button className={styles.playButton} onClick={handleStart}>
              &#9654;
            </button>
          </div>
        )}

        {phase === 'playing' && (
          <div className={styles.playingState}>
            <div className={styles.audioIcon}>&#128266;</div>
            <p className={styles.instruction}>Listen carefully...</p>
          </div>
        )}

        {phase === 'countdown' && (
          <div className={styles.countdownState}>
            <div className={styles.countdownNumber}>{countdown}</div>
            <p className={styles.instruction}>Get ready to repeat!</p>
          </div>
        )}

        {phase === 'repeat' && (
          <div className={styles.repeatState}>
            <div className={styles.micIcon}>&#127908;</div>
            <p className={styles.instruction}>Repeat now!</p>

            {showText && (
              <div className={styles.phraseText}>
                <div className={styles.targetText}>{currentPhrase.text}</div>
                {currentPhrase.reading && (
                  <div className={styles.reading}>{currentPhrase.reading}</div>
                )}
                <div className={styles.translation}>{currentPhrase.translation}</div>
              </div>
            )}

            <div className={styles.repeatControls}>
              <button className={styles.replayButton} onClick={handleReplay}>
                &#128257; Replay
              </button>
              <button className={styles.doneButton} onClick={handleDoneRepeating}>
                Done &#10003;
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Show text toggle */}
      {(phase === 'playing' || phase === 'countdown') && (
        <button
          className={styles.toggleText}
          onClick={() => setShowText(!showText)}
        >
          {showText ? 'Hide Text' : 'Show Text'}
        </button>
      )}

      {showText && (phase === 'playing' || phase === 'countdown') && (
        <div className={styles.earlyText}>
          <div className={styles.targetText}>{currentPhrase.text}</div>
          {currentPhrase.reading && (
            <div className={styles.reading}>{currentPhrase.reading}</div>
          )}
        </div>
      )}
    </div>
  );
}

export default ListenRepeat;
