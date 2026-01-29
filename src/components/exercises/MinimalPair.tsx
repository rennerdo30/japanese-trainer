'use client';

import React, { useState, useCallback, useRef } from 'react';
import styles from './MinimalPair.module.css';
import type { MinimalPairItem } from '@/types/pronunciation';

interface MinimalPairProps {
  pairs: MinimalPairItem[];
  onComplete?: (score: number, total: number) => void;
}

export function MinimalPair({ pairs, onComplete }: MinimalPairProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playedWord, setPlayedWord] = useState<1 | 2 | null>(null);
  const [userGuess, setUserGuess] = useState<1 | 2 | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [phase, setPhase] = useState<'listening' | 'guessing' | 'result' | 'complete'>('listening');

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentPair = pairs[currentIndex];
  const progress = ((currentIndex + 1) / pairs.length) * 100;

  const playWord = useCallback((wordNum: 1 | 2, audioUrl?: string) => {
    // In a real implementation, this would play the audio
    // For now, we simulate with a random selection
    if (audioUrl && audioRef.current) {
      audioRef.current.src = audioUrl;
      audioRef.current.play();
    }

    // Set which word was played (randomly if no user choice yet)
    if (phase === 'listening') {
      const randomWord = Math.random() > 0.5 ? 1 : 2;
      setPlayedWord(randomWord as 1 | 2);
      setPhase('guessing');
    }
  }, [phase]);

  const handleGuess = useCallback((guess: 1 | 2) => {
    setUserGuess(guess);
    setShowResult(true);
    setTotalAttempts(prev => prev + 1);
    setPhase('result');

    if (guess === playedWord) {
      setScore(prev => prev + 1);
    }
  }, [playedWord]);

  const handleNext = useCallback(() => {
    if (currentIndex < pairs.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setPlayedWord(null);
      setUserGuess(null);
      setShowResult(false);
      setPhase('listening');
    } else {
      setPhase('complete');
      onComplete?.(score + (userGuess === playedWord ? 1 : 0), totalAttempts + 1);
    }
  }, [currentIndex, pairs.length, score, userGuess, playedWord, totalAttempts, onComplete]);

  const isCorrect = userGuess === playedWord;

  if (phase === 'complete') {
    const finalScore = score + (userGuess === playedWord ? 1 : 0);
    const percentage = Math.round((finalScore / (totalAttempts + 1)) * 100);

    return (
      <div className={styles.container}>
        <div className={styles.complete}>
          <div className={`${styles.completeIcon} ${percentage >= 70 ? styles.good : styles.needsPractice}`}>
            {percentage >= 70 ? '&#10003;' : '&#9733;'}
          </div>
          <h3>{percentage >= 70 ? 'Great Job!' : 'Keep Practicing!'}</h3>
          <p className={styles.scoreText}>
            {finalScore} / {totalAttempts + 1} correct ({percentage}%)
          </p>
          <button
            className={styles.restartButton}
            onClick={() => {
              setCurrentIndex(0);
              setPlayedWord(null);
              setUserGuess(null);
              setShowResult(false);
              setScore(0);
              setTotalAttempts(0);
              setPhase('listening');
            }}
          >
            Practice Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Hidden audio element */}
      <audio ref={audioRef} />

      {/* Progress */}
      <div className={styles.progressContainer}>
        <div className={styles.progressBar} style={{ width: `${progress}%` }} />
        <span className={styles.progressText}>
          {currentIndex + 1} / {pairs.length}
        </span>
      </div>

      {/* Score */}
      <div className={styles.scoreDisplay}>
        Score: {score} / {totalAttempts}
      </div>

      {/* Distinction info */}
      <div className={styles.distinction}>
        <span className={styles.distinctionLabel}>Distinction:</span>
        <span className={styles.distinctionText}>{currentPair.distinction}</span>
      </div>

      {/* Word options */}
      <div className={styles.wordOptions}>
        <button
          className={`${styles.wordButton} ${showResult && playedWord === 1 ? styles.correct : ''} ${showResult && userGuess === 1 && playedWord !== 1 ? styles.incorrect : ''}`}
          onClick={() => phase === 'guessing' ? handleGuess(1) : playWord(1, currentPair.word1Audio)}
          disabled={showResult}
        >
          <div className={styles.wordText}>{currentPair.word1}</div>
          {currentPair.word1Meaning && (
            <div className={styles.wordMeaning}>{currentPair.word1Meaning}</div>
          )}
          {showResult && playedWord === 1 && (
            <div className={styles.correctIndicator}>&#10003; This was played</div>
          )}
        </button>

        <div className={styles.vsIndicator}>VS</div>

        <button
          className={`${styles.wordButton} ${showResult && playedWord === 2 ? styles.correct : ''} ${showResult && userGuess === 2 && playedWord !== 2 ? styles.incorrect : ''}`}
          onClick={() => phase === 'guessing' ? handleGuess(2) : playWord(2, currentPair.word2Audio)}
          disabled={showResult}
        >
          <div className={styles.wordText}>{currentPair.word2}</div>
          {currentPair.word2Meaning && (
            <div className={styles.wordMeaning}>{currentPair.word2Meaning}</div>
          )}
          {showResult && playedWord === 2 && (
            <div className={styles.correctIndicator}>&#10003; This was played</div>
          )}
        </button>
      </div>

      {/* Instructions / Result */}
      <div className={styles.instructions}>
        {phase === 'listening' && (
          <p>Tap one of the words to hear it, then guess which one was played</p>
        )}
        {phase === 'guessing' && (
          <p className={styles.guessPrompt}>Which word did you hear? Tap to guess!</p>
        )}
        {phase === 'result' && (
          <div className={`${styles.result} ${isCorrect ? styles.resultCorrect : styles.resultIncorrect}`}>
            {isCorrect ? 'Correct!' : 'Not quite - keep practicing!'}
          </div>
        )}
      </div>

      {/* Explanation */}
      {showResult && currentPair.explanation && (
        <div className={styles.explanation}>
          {currentPair.explanation}
        </div>
      )}

      {/* Next button */}
      {showResult && (
        <button className={styles.nextButton} onClick={handleNext}>
          {currentIndex < pairs.length - 1 ? 'Next Pair' : 'See Results'}
        </button>
      )}
    </div>
  );
}

export default MinimalPair;
