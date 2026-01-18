'use client';

import { useState, useCallback } from 'react';
import { Text, Button } from '@/components/ui';
import { IoCheckmark, IoClose, IoHelpCircle } from 'react-icons/io5';
import type { FillBlankExercise } from '@/types/exercises';
import styles from './FillBlank.module.css';

interface FillBlankProps {
  exercise: FillBlankExercise;
  onAnswer: (isCorrect: boolean) => void;
}

export default function FillBlank({ exercise, onAnswer }: FillBlankProps) {
  const [userInput, setUserInput] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Split sentence at the blank position marker (_____)
  const sentenceParts = exercise.sentence.split('_____');
  const beforeBlank = sentenceParts[0] || '';
  const afterBlank = sentenceParts[1] || '';

  const checkAnswer = useCallback(() => {
    const trimmedInput = userInput.trim().toLowerCase();
    const correctAnswer = exercise.correctAnswer.toLowerCase();
    const acceptableAnswers = exercise.acceptableAnswers?.map(a => a.toLowerCase()) || [];

    const isCorrect = trimmedInput === correctAnswer || acceptableAnswers.includes(trimmedInput);

    setFeedback(isCorrect ? 'correct' : 'incorrect');
    setSubmitted(true);

    // Delay the callback to show feedback
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
      <div className={styles.sentenceContainer}>
        <Text variant="h3" className={styles.sentence}>
          <span>{beforeBlank}</span>
          <span className={`${styles.blankWrapper} ${feedback ? styles[feedback] : ''}`}>
            {submitted ? (
              <span className={styles.answer}>
                {feedback === 'correct' ? userInput : exercise.correctAnswer}
              </span>
            ) : (
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className={styles.input}
                placeholder="..."
                autoFocus
                disabled={submitted}
              />
            )}
          </span>
          <span>{afterBlank}</span>
        </Text>
      </div>

      {feedback && (
        <div className={`${styles.feedback} ${styles[feedback]}`}>
          {feedback === 'correct' ? (
            <>
              <IoCheckmark className={styles.feedbackIcon} />
              <Text variant="body">Correct!</Text>
            </>
          ) : (
            <>
              <IoClose className={styles.feedbackIcon} />
              <Text variant="body">
                The correct answer is: <strong>{exercise.correctAnswer}</strong>
              </Text>
            </>
          )}
        </div>
      )}

      {!submitted && (
        <div className={styles.actions}>
          {exercise.hint && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHint(!showHint)}
              className={styles.hintButton}
            >
              <IoHelpCircle /> {showHint ? 'Hide Hint' : 'Show Hint'}
            </Button>
          )}

          <Button
            onClick={checkAnswer}
            disabled={!userInput.trim()}
            className={styles.submitButton}
          >
            Check Answer
          </Button>
        </div>
      )}

      {showHint && exercise.hint && !submitted && (
        <div className={styles.hint}>
          <Text variant="caption" color="muted">
            Hint: {exercise.hint}
          </Text>
        </div>
      )}
    </div>
  );
}
