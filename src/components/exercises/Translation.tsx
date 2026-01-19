'use client';

import { useState, useCallback } from 'react';
import { Text, Button } from '@/components/ui';
import { useLanguage } from '@/context/LanguageProvider';
import { IoCheckmark, IoClose, IoHelpCircle } from 'react-icons/io5';
import type { TranslationExercise } from '@/types/exercises';
import styles from './Translation.module.css';

interface TranslationProps {
  exercise: TranslationExercise;
  onAnswer: (isCorrect: boolean) => void;
}

export default function Translation({ exercise, onAnswer }: TranslationProps) {
  const { t } = useLanguage();
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const checkAnswer = useCallback(() => {
    const trimmedInput = userInput.trim().toLowerCase();
    const correctAnswer = exercise.correctTranslation.toLowerCase();
    const acceptableAnswers = exercise.acceptableTranslations?.map(a => a.toLowerCase()) || [];

    const isCorrect = trimmedInput === correctAnswer || acceptableAnswers.includes(trimmedInput);

    setFeedback(isCorrect ? 'correct' : 'incorrect');
    setSubmitted(true);

    setTimeout(() => {
      onAnswer(isCorrect);
    }, 1500);
  }, [userInput, exercise, onAnswer]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !submitted && userInput.trim()) {
      checkAnswer();
    }
  }, [submitted, userInput, checkAnswer]);

  return (
    <div className={styles.container}>
      <div className={styles.sourceSection}>
        <Text variant="caption" color="muted" className={styles.languageLabel}>
          {exercise.sourceLanguage}
        </Text>
        <Text variant="h2" className={styles.sourceText}>
          {exercise.sourceText}
        </Text>
      </div>

      <div className={styles.targetSection}>
        <Text variant="caption" color="muted" className={styles.languageLabel}>
          {t('exercises.translation.translateTo', { language: exercise.targetLanguage })}
        </Text>
        <textarea
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('exercises.translation.placeholder')}
          className={`${styles.input} ${feedback ? styles[feedback] : ''}`}
          disabled={submitted}
          rows={3}
          autoFocus
        />
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
              <div className={styles.feedbackContent}>
                <Text>{t('exercises.translation.correctAnswer')}</Text>
                <Text color="gold" className={styles.correctAnswer}>
                  {exercise.correctTranslation}
                </Text>
              </div>
            </>
          )}
        </div>
      )}

      {!submitted && (
        <Button
          onClick={checkAnswer}
          disabled={!userInput.trim()}
          fullWidth
        >
          {t('exercises.translation.checkTranslation')}
        </Button>
      )}
    </div>
  );
}
