'use client';

import { useState, useCallback, useMemo, useRef, KeyboardEvent } from 'react';
import { Text, Button } from '@/components/ui';
import { useLanguage } from '@/context/LanguageProvider';
import { IoCheckmark, IoClose, IoShuffle } from 'react-icons/io5';
import type { MatchingExercise } from '@/types/exercises';
import styles from './Matching.module.css';

interface MatchingProps {
  exercise: MatchingExercise;
  onAnswer: (isCorrect: boolean) => void;
}

interface MatchedPair {
  leftIndex: number;
  rightIndex: number;
}

export default function Matching({ exercise, onAnswer }: MatchingProps) {
  const { t } = useLanguage();
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [matches, setMatches] = useState<MatchedPair[]>([]);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const leftRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const rightRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Shuffle the right side options
  const shuffledRight = useMemo(() => {
    const indices = exercise.pairs.map((_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return indices;
  }, [exercise.pairs]);

  const handleLeftClick = useCallback((index: number) => {
    if (submitted) return;
    // Check if already matched
    if (matches.some(m => m.leftIndex === index)) return;
    setSelectedLeft(selectedLeft === index ? null : index);
  }, [submitted, matches, selectedLeft]);

  const handleRightClick = useCallback((shuffledIndex: number) => {
    if (submitted || selectedLeft === null) return;

    const originalIndex = shuffledRight[shuffledIndex];
    // Check if already matched
    if (matches.some(m => m.rightIndex === originalIndex)) return;

    setMatches(prev => [...prev, { leftIndex: selectedLeft, rightIndex: originalIndex }]);
    setSelectedLeft(null);
  }, [submitted, selectedLeft, shuffledRight, matches]);

  const removeMatch = useCallback((leftIndex: number) => {
    if (submitted) return;
    setMatches(prev => prev.filter(m => m.leftIndex !== leftIndex));
  }, [submitted]);

  // Keyboard navigation for left column
  const handleLeftKeyDown = useCallback((event: KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
    if (submitted) return;

    const itemCount = exercise.pairs.length;
    let newIndex: number | null = null;

    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        newIndex = currentIndex === 0 ? itemCount - 1 : currentIndex - 1;
        break;
      case 'ArrowDown':
        event.preventDefault();
        newIndex = currentIndex === itemCount - 1 ? 0 : currentIndex + 1;
        break;
      case 'ArrowRight':
      case 'Tab':
        if (!event.shiftKey && selectedLeft !== null) {
          event.preventDefault();
          // Move focus to right column
          const firstAvailable = shuffledRight.findIndex((origIdx) =>
            !matches.some(m => m.rightIndex === origIdx)
          );
          if (firstAvailable >= 0) {
            rightRefs.current[firstAvailable]?.focus();
          }
        }
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (matches.some(m => m.leftIndex === currentIndex)) {
          removeMatch(currentIndex);
        } else {
          handleLeftClick(currentIndex);
        }
        break;
    }

    if (newIndex !== null && leftRefs.current[newIndex]) {
      leftRefs.current[newIndex]?.focus();
    }
  }, [submitted, exercise.pairs.length, selectedLeft, shuffledRight, matches, handleLeftClick, removeMatch]);

  // Keyboard navigation for right column
  const handleRightKeyDown = useCallback((event: KeyboardEvent<HTMLButtonElement>, shuffledIndex: number) => {
    if (submitted) return;

    const itemCount = shuffledRight.length;
    let newIndex: number | null = null;

    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        newIndex = shuffledIndex === 0 ? itemCount - 1 : shuffledIndex - 1;
        break;
      case 'ArrowDown':
        event.preventDefault();
        newIndex = shuffledIndex === itemCount - 1 ? 0 : shuffledIndex + 1;
        break;
      case 'ArrowLeft':
        event.preventDefault();
        // Move focus back to left column
        if (selectedLeft !== null) {
          leftRefs.current[selectedLeft]?.focus();
        } else {
          leftRefs.current[0]?.focus();
        }
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        handleRightClick(shuffledIndex);
        break;
    }

    if (newIndex !== null && rightRefs.current[newIndex]) {
      rightRefs.current[newIndex]?.focus();
    }
  }, [submitted, shuffledRight.length, selectedLeft, handleRightClick]);

  const handleSubmit = useCallback(() => {
    if (matches.length !== exercise.pairs.length || submitted) return;

    // Check if all matches are correct
    const allCorrect = matches.every(m => m.leftIndex === m.rightIndex);
    setFeedback(allCorrect ? 'correct' : 'incorrect');
    setSubmitted(true);

    setTimeout(() => {
      onAnswer(allCorrect);
    }, 1500);
  }, [matches, exercise.pairs.length, onAnswer, submitted]);

  const getMatchForLeft = (leftIndex: number) => matches.find(m => m.leftIndex === leftIndex);
  const getMatchForRight = (originalIndex: number) => matches.find(m => m.rightIndex === originalIndex);

  return (
    <div className={styles.container}>
      <Text variant="h3" className={styles.instruction}>
        {t('exercises.matching.title')}
      </Text>

      <div className={styles.matchArea} role="application" aria-label={t('exercises.matching.title')}>
        <div className={styles.column} role="listbox" aria-label={t('exercises.matching.leftColumnLabel')}>
          {exercise.pairs.map((pair, index) => {
            const match = getMatchForLeft(index);
            const isSelected = selectedLeft === index;
            const isMatched = !!match;
            const isCorrect = submitted && match && match.rightIndex === index;
            const isIncorrect = submitted && match && match.rightIndex !== index;

            const matched = isMatched ? t('exercises.matching.matchedStatus') : '';
            const status = isCorrect
              ? t('exercises.matching.correctMatchStatus')
              : isIncorrect
                ? t('exercises.matching.incorrectMatchStatus')
                : '';

            return (
              <button
                key={`left-${index}`}
                ref={(el) => { leftRefs.current[index] = el; }}
                onClick={() => isMatched ? removeMatch(index) : handleLeftClick(index)}
                onKeyDown={(e) => handleLeftKeyDown(e, index)}
                disabled={submitted}
                className={`${styles.item} ${isSelected ? styles.selected : ''} ${isMatched ? styles.matched : ''} ${isCorrect ? styles.correct : ''} ${isIncorrect ? styles.incorrect : ''}`}
                role="option"
                aria-selected={isSelected}
                aria-label={t('exercises.matching.leftItemLabel', { item: pair.left, matched, status })}
                type="button"
              >
                <span>{pair.left}</span>
                {isCorrect && <IoCheckmark className={styles.icon} aria-hidden="true" />}
                {isIncorrect && <IoClose className={styles.icon} aria-hidden="true" />}
              </button>
            );
          })}
        </div>

        <div className={styles.connector} aria-hidden="true">
          {matches.map((match, i) => (
            <div key={i} className={styles.line} />
          ))}
        </div>

        <div className={styles.column} role="listbox" aria-label={t('exercises.matching.rightColumnLabel')}>
          {shuffledRight.map((originalIndex, shuffledIndex) => {
            const pair = exercise.pairs[originalIndex];
            const match = getMatchForRight(originalIndex);
            const isMatched = !!match;
            const isAvailable = selectedLeft !== null && !isMatched;

            const matched = isMatched ? t('exercises.matching.alreadyMatchedStatus') : '';
            const available = isAvailable ? t('exercises.matching.availableToMatchStatus') : '';

            return (
              <button
                key={`right-${shuffledIndex}`}
                ref={(el) => { rightRefs.current[shuffledIndex] = el; }}
                onClick={() => handleRightClick(shuffledIndex)}
                onKeyDown={(e) => handleRightKeyDown(e, shuffledIndex)}
                disabled={submitted || isMatched || selectedLeft === null}
                className={`${styles.item} ${styles.right} ${isMatched ? styles.matched : ''} ${isAvailable ? styles.available : ''}`}
                role="option"
                aria-selected={false}
                aria-disabled={isMatched || selectedLeft === null}
                aria-label={t('exercises.matching.rightItemLabel', { item: pair.right, matched, available })}
                type="button"
              >
                <span>{pair.right}</span>
              </button>
            );
          })}
        </div>
      </div>

      {feedback && (
        <div className={`${styles.feedback} ${styles[feedback]}`}>
          {feedback === 'correct' ? (
            <Text>{t('exercises.matching.success')}</Text>
          ) : (
            <Text>{t('exercises.matching.error')}</Text>
          )}
        </div>
      )}

      {!submitted && (
        <Button
          onClick={handleSubmit}
          disabled={matches.length !== exercise.pairs.length}
          fullWidth
        >
          {t('exercises.matching.checkMatches', { count: matches.length, total: exercise.pairs.length })}
        </Button>
      )}
    </div>
  );
}
