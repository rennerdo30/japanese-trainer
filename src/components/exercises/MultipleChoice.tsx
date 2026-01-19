'use client';

import { useState, useCallback, useRef, KeyboardEvent } from 'react';
import { Text, Button } from '@/components/ui';
import { useLanguage } from '@/context/LanguageProvider';
import { IoCheckmark, IoClose, IoVolumeHigh } from 'react-icons/io5';
import { useTTS } from '@/hooks/useTTS';
import type { MultipleChoiceExercise } from '@/types/exercises';
import styles from './MultipleChoice.module.css';

interface MultipleChoiceProps {
  exercise: MultipleChoiceExercise;
  onAnswer: (isCorrect: boolean) => void;
}

export default function MultipleChoice({ exercise, onAnswer }: MultipleChoiceProps) {
  const { t } = useLanguage();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const { speak } = useTTS();
  const optionsRef = useRef<(HTMLButtonElement | null)[]>([]);

  const handleSelect = useCallback((index: number) => {
    if (submitted) return;
    setSelectedIndex(index);
  }, [submitted]);

  // Handle keyboard navigation for options
  const handleKeyDown = useCallback((event: KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
    if (submitted) return;

    const optionCount = exercise.options.length;
    let newIndex: number | null = null;

    switch (event.key) {
      case 'ArrowUp':
      case 'ArrowLeft':
        event.preventDefault();
        newIndex = currentIndex === 0 ? optionCount - 1 : currentIndex - 1;
        break;
      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault();
        newIndex = currentIndex === optionCount - 1 ? 0 : currentIndex + 1;
        break;
      case 'Home':
        event.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        newIndex = optionCount - 1;
        break;
    }

    if (newIndex !== null && optionsRef.current[newIndex]) {
      optionsRef.current[newIndex]?.focus();
      setSelectedIndex(newIndex);
    }
  }, [submitted, exercise.options.length]);

  const handleSubmit = useCallback(() => {
    if (selectedIndex === null || submitted) return;

    const isCorrect = selectedIndex === exercise.correctIndex;
    setFeedback(isCorrect ? 'correct' : 'incorrect');
    setSubmitted(true);

    setTimeout(() => {
      onAnswer(isCorrect);
    }, 1500);
  }, [selectedIndex, exercise.correctIndex, onAnswer, submitted]);

  const handlePlayAudio = useCallback(() => {
    if (exercise.questionAudio) {
      speak(exercise.question, { audioUrl: exercise.questionAudio });
    }
  }, [exercise, speak]);

  return (
    <div className={styles.container}>
      <div className={styles.question}>
        <Text variant="h3">{exercise.question}</Text>
        {exercise.questionAudio && (
          <Button variant="ghost" size="sm" onClick={handlePlayAudio}>
            <IoVolumeHigh /> {t('common.play')}
          </Button>
        )}
      </div>

      <div
        className={styles.options}
        role="radiogroup"
        aria-label={t('exercises.common.answerOptions')}
      >
        {exercise.options.map((option, index) => {
          const isSelected = selectedIndex === index;
          const isCorrect = index === exercise.correctIndex;
          const showCorrect = submitted && isCorrect;
          const showIncorrect = submitted && isSelected && !isCorrect;

          const status = showCorrect
            ? t('exercises.common.correctAnswerStatus')
            : showIncorrect
              ? t('exercises.common.incorrectStatus')
              : '';

          return (
            <button
              key={index}
              ref={(el) => { optionsRef.current[index] = el; }}
              onClick={() => handleSelect(index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              disabled={submitted}
              className={`${styles.option} ${isSelected ? styles.selected : ''} ${showCorrect ? styles.correct : ''} ${showIncorrect ? styles.incorrect : ''}`}
              role="radio"
              aria-checked={isSelected}
              aria-label={t('exercises.common.optionLabelWithStatus', { index: index + 1, option, status })}
              type="button"
            >
              <span className={styles.optionLabel}>{option}</span>
              {showCorrect && <IoCheckmark className={styles.icon} aria-hidden="true" />}
              {showIncorrect && <IoClose className={styles.icon} aria-hidden="true" />}
            </button>
          );
        })}
      </div>

      {feedback && exercise.explanation && (
        <div className={styles.explanation}>
          <Text variant="caption" color="muted">
            {exercise.explanation}
          </Text>
        </div>
      )}

      {!submitted && (
        <Button
          onClick={handleSubmit}
          disabled={selectedIndex === null}
          className={styles.submitButton}
          fullWidth
        >
          {t('exercises.common.checkAnswer')}
        </Button>
      )}
    </div>
  );
}
