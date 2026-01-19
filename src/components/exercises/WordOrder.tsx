'use client';

import { useState, useCallback } from 'react';
import { Text, Button } from '@/components/ui';
import { useLanguage } from '@/context/LanguageProvider';
import { IoCheckmark, IoClose, IoArrowUndo } from 'react-icons/io5';
import type { WordOrderExercise } from '@/types/exercises';
import styles from './WordOrder.module.css';

interface WordOrderProps {
  exercise: WordOrderExercise;
  onAnswer: (isCorrect: boolean) => void;
}

export default function WordOrder({ exercise, onAnswer }: WordOrderProps) {
  const { t } = useLanguage();
  const [selectedWords, setSelectedWords] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const availableWords = exercise.words.filter((_, index) => !selectedWords.includes(index));

  const handleWordClick = useCallback((wordIndex: number) => {
    if (submitted) return;
    setSelectedWords(prev => [...prev, wordIndex]);
  }, [submitted]);

  const handleRemoveWord = useCallback((position: number) => {
    if (submitted) return;
    setSelectedWords(prev => prev.filter((_, i) => i !== position));
  }, [submitted]);

  const handleClear = useCallback(() => {
    if (submitted) return;
    setSelectedWords([]);
  }, [submitted]);

  const handleSubmit = useCallback(() => {
    if (selectedWords.length !== exercise.words.length || submitted) return;

    const isCorrect = selectedWords.every((wordIndex, position) =>
      exercise.correctOrder[position] === wordIndex
    );

    setFeedback(isCorrect ? 'correct' : 'incorrect');
    setSubmitted(true);

    setTimeout(() => {
      onAnswer(isCorrect);
    }, 1500);
  }, [selectedWords, exercise, onAnswer, submitted]);

  const getCorrectSentence = () => {
    return exercise.correctOrder.map(i => exercise.words[i]).join(' ');
  };

  return (
    <div className={styles.container}>
      {exercise.translation && (
        <div className={styles.translation}>
          <Text color="muted">{exercise.translation}</Text>
        </div>
      )}

      <div className={`${styles.sentenceArea} ${feedback ? styles[feedback] : ''}`}>
        {selectedWords.length === 0 ? (
          <Text color="muted" className={styles.placeholder}>
            {t('exercises.wordOrder.placeholder')}
          </Text>
        ) : (
          <div className={styles.selectedWords}>
            {selectedWords.map((wordIndex, position) => (
              <button
                key={`selected-${position}`}
                onClick={() => handleRemoveWord(position)}
                disabled={submitted}
                className={styles.selectedWord}
              >
                {exercise.words[wordIndex]}
              </button>
            ))}
          </div>
        )}
      </div>

      {feedback && (
        <div className={`${styles.feedback} ${styles[feedback]}`}>
          {feedback === 'correct' ? (
            <>
              <IoCheckmark className={styles.feedbackIcon} />
              <Text>{t('exercises.correct')}</Text>
            </>
          ) : (
            <>
              <IoClose className={styles.feedbackIcon} />
              <Text>
                {t('exercises.translation.correctAnswer')} <strong>{getCorrectSentence()}</strong>
              </Text>
            </>
          )}
        </div>
      )}

      {!submitted && (
        <div className={styles.wordBank}>
          {exercise.words.map((word, index) => {
            const isUsed = selectedWords.includes(index);
            return (
              <button
                key={`word-${index}`}
                onClick={() => handleWordClick(index)}
                disabled={isUsed}
                className={`${styles.word} ${isUsed ? styles.used : ''}`}
              >
                {word}
              </button>
            );
          })}
        </div>
      )}

      {!submitted && (
        <div className={styles.actions}>
          {selectedWords.length > 0 && (
            <Button variant="ghost" size="sm" onClick={handleClear}>
              <IoArrowUndo /> {t('common.clear')}
            </Button>
          )}
          <Button
            onClick={handleSubmit}
            disabled={selectedWords.length !== exercise.words.length}
            fullWidth
          >
            {t('exercises.common.checkAnswer')}
          </Button>
        </div>
      )}
    </div>
  );
}
