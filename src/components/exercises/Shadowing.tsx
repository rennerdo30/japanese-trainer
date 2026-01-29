'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import styles from './Shadowing.module.css';
import type { ShadowingContent, ShadowingSegment } from '@/types/pronunciation';

interface ShadowingProps {
  content: ShadowingContent;
  onComplete?: () => void;
}

type Speed = 'slow' | 'normal' | 'fast';

const SPEED_RATES: Record<Speed, number> = {
  slow: 0.75,
  normal: 1.0,
  fast: 1.25,
};

export function Shadowing({ content, onComplete }: ShadowingProps) {
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState<Speed>(content.speed || 'normal');
  const [completedSegments, setCompletedSegments] = useState<Set<number>>(new Set());
  const [showText, setShowText] = useState(true);
  const [phase, setPhase] = useState<'listen' | 'repeat' | 'complete'>('listen');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentSegment = content.segments[currentSegmentIndex];
  const progress = (completedSegments.size / content.segments.length) * 100;

  // Initialize audio
  useEffect(() => {
    if (content.audioUrl) {
      audioRef.current = new Audio(content.audioUrl);
      audioRef.current.playbackRate = SPEED_RATES[speed];
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (pauseTimeoutRef.current) {
        clearTimeout(pauseTimeoutRef.current);
      }
    };
  }, [content.audioUrl, speed]);

  // Update playback rate when speed changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = SPEED_RATES[speed];
    }
  }, [speed]);

  const playSegment = useCallback((segment: ShadowingSegment) => {
    if (!audioRef.current) return;

    const audio = audioRef.current;
    audio.currentTime = segment.start / 1000;

    const handleTimeUpdate = () => {
      if (audio.currentTime >= segment.end / 1000) {
        audio.pause();
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        setIsPlaying(false);
        setPhase('repeat');

        // Give user time to repeat
        pauseTimeoutRef.current = setTimeout(() => {
          setPhase('listen');
        }, (segment.end - segment.start) * 1.5);
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.play();
    setIsPlaying(true);
    setPhase('listen');
  }, []);

  const handlePlayCurrent = useCallback(() => {
    if (currentSegment) {
      playSegment(currentSegment);
    }
  }, [currentSegment, playSegment]);

  const handleNext = useCallback(() => {
    // Mark current as completed
    setCompletedSegments(prev => new Set([...prev, currentSegmentIndex]));

    if (currentSegmentIndex < content.segments.length - 1) {
      setCurrentSegmentIndex(prev => prev + 1);
      setPhase('listen');
    } else {
      setPhase('complete');
      onComplete?.();
    }
  }, [currentSegmentIndex, content.segments.length, onComplete]);

  const handlePrevious = useCallback(() => {
    if (currentSegmentIndex > 0) {
      setCurrentSegmentIndex(prev => prev - 1);
      setPhase('listen');
    }
  }, [currentSegmentIndex]);

  const handlePause = useCallback(() => {
    if (audioRef.current) {
      if (isPaused) {
        audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
      setIsPaused(!isPaused);
    }
  }, [isPaused]);

  const handleSpeedChange = useCallback((newSpeed: Speed) => {
    setSpeed(newSpeed);
  }, []);

  if (phase === 'complete') {
    return (
      <div className={styles.container}>
        <div className={styles.complete}>
          <div className={styles.completeIcon}>&#10003;</div>
          <h3>Shadowing Complete!</h3>
          <p>You practiced {content.segments.length} segments</p>
          <button className={styles.restartButton} onClick={() => {
            setCurrentSegmentIndex(0);
            setCompletedSegments(new Set());
            setPhase('listen');
          }}>
            Practice Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Progress bar */}
      <div className={styles.progressContainer}>
        <div className={styles.progressBar} style={{ width: `${progress}%` }} />
        <span className={styles.progressText}>
          {currentSegmentIndex + 1} / {content.segments.length}
        </span>
      </div>

      {/* Speed controls */}
      <div className={styles.speedControls}>
        <span className={styles.speedLabel}>Speed:</span>
        {(['slow', 'normal', 'fast'] as Speed[]).map(s => (
          <button
            key={s}
            className={`${styles.speedButton} ${speed === s ? styles.active : ''}`}
            onClick={() => handleSpeedChange(s)}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Current segment display */}
      <div className={styles.segmentDisplay}>
        {showText && currentSegment && (
          <>
            <div className={styles.segmentText}>{currentSegment.text}</div>
            {currentSegment.reading && (
              <div className={styles.segmentReading}>{currentSegment.reading}</div>
            )}
            {currentSegment.translation && (
              <div className={styles.segmentTranslation}>{currentSegment.translation}</div>
            )}
          </>
        )}
      </div>

      {/* Phase indicator */}
      <div className={`${styles.phaseIndicator} ${styles[phase]}`}>
        {phase === 'listen' && (isPlaying ? 'Listening...' : 'Press Play to Listen')}
        {phase === 'repeat' && 'Your Turn - Repeat!'}
      </div>

      {/* Controls */}
      <div className={styles.controls}>
        <button
          className={styles.controlButton}
          onClick={handlePrevious}
          disabled={currentSegmentIndex === 0}
        >
          &#9664;
        </button>

        <button
          className={`${styles.playButton} ${isPlaying ? styles.playing : ''}`}
          onClick={isPlaying ? handlePause : handlePlayCurrent}
        >
          {isPlaying ? (isPaused ? '&#9658;' : '&#10074;&#10074;') : '&#9658;'}
        </button>

        <button
          className={styles.controlButton}
          onClick={handleNext}
        >
          &#9654;
        </button>
      </div>

      {/* Toggle text visibility */}
      <button
        className={styles.toggleText}
        onClick={() => setShowText(!showText)}
      >
        {showText ? 'Hide Text' : 'Show Text'}
      </button>
    </div>
  );
}

export default Shadowing;
