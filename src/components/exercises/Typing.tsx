'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Text, Button } from '@/components/ui';
import { IoCheckmark, IoClose, IoVolumeHigh, IoHelpCircle } from 'react-icons/io5';
import { useTTS } from '@/hooks/useTTS';
import type { TypingExercise } from '@/types/exercises';
import styles from './Typing.module.css';

interface TypingProps {
  exercise: TypingExercise;
  onAnswer: (isCorrect: boolean) => void;
}

export default function Typing({ exercise, onAnswer }: TypingProps) {
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { speak } = useTTS();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const checkAnswer = useCallback(() => {
    if (submitted || !userInput.trim()) return;

    const trimmedInput = userInput.trim().toLowerCase();
    const correctAnswer = exercise.correctAnswer.toLowerCase();
    const acceptableAnswers = exercise.acceptableAnswers?.map(a => a.toLowerCase()) || [];

    const isCorrect = trimmedInput === correctAnswer || acceptableAnswers.includes(trimmedInput);

    setFeedback(isCorrect ? 'correct' : 'incorrect');
    setSubmitted(true);

    setTimeout(() => {
      onAnswer(isCorrect);
    }, 1500);
  }, [userInput, exercise, onAnswer, submitted]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !submitted && userInput.trim()) {
      checkAnswer();
    }
  }, [submitted, userInput, checkAnswer]);

  const handlePlayAudio = useCallback(() => {
    if (exercise.audioUrl) {
      speak(exercise.correctAnswer, { audioUrl: exercise.audioUrl });
    } else {
      speak(exercise.correctAnswer);
    }
  }, [exercise, speak]);

  const handleShowHint = useCallback(() => {
    setShowHint(prev => !prev);
  }, []);

  // Calculate character-by-character feedback for visual feedback during typing
  const getCharacterFeedback = useCallback(() => {
    if (!userInput) return [];
    const correct = exercise.correctAnswer;
    return userInput.split('').map((char, index) => {
      if (index >= correct.length) return 'extra';
      return char.toLowerCase() === correct[index].toLowerCase() ? 'correct' : 'incorrect';
    });
  }, [userInput, exercise.correctAnswer]);

  const charFeedback = getCharacterFeedback();

  return (
    <div className={styles.container}>
      <div className={styles.promptSection}>
        <Text variant="caption" color="muted" className={styles.instruction}>
          Type the translation
        </Text>
        <Text variant="h2" className={styles.prompt}>
          {exercise.prompt}
        </Text>
        <div className={styles.promptActions}>
          {(exercise.audioUrl || exercise.correctAnswer) && (
            <Button variant="ghost" size="sm" onClick={handlePlayAudio}>
              <IoVolumeHigh /> Listen
            </Button>
          )}
          {exercise.hint && (
            <Button variant="ghost" size="sm" onClick={handleShowHint}>
              <IoHelpCircle /> Hint
            </Button>
          )}
        </div>
      </div>

      {showHint && exercise.hint && (
        <div className={styles.hintBox}>
          <Text variant="body" color="muted">{exercise.hint}</Text>
        </div>
      )}

      <div className={styles.inputSection}>
        <div className={styles.inputWrapper}>
          <input
            ref={inputRef}
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your answer..."
            className={`${styles.input} ${feedback ? styles[feedback] : ''}`}
            disabled={submitted}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
          />
          {!submitted && userInput && (
            <div className={styles.livePreview}>
              {userInput.split('').map((char, index) => (
                <span
                  key={index}
                  className={`${styles.previewChar} ${charFeedback[index] === 'correct' ? styles.previewCorrect : charFeedback[index] === 'incorrect' ? styles.previewIncorrect : styles.previewExtra}`}
                >
                  {char}
                </span>
              ))}
            </div>
          )}
        </div>

        <Text variant="caption" color="muted" className={styles.expectedLength}>
          Expected: {exercise.correctAnswer.length} characters
        </Text>
      </div>

      {feedback && (
        <div className={`${styles.feedback} ${styles[feedback]}`}>
          {feedback === 'correct' ? (
            <>
              <IoCheckmark className={styles.feedbackIcon} />
              <Text>Correct!</Text>
            </>
          ) : (
            <>
              <IoClose className={styles.feedbackIcon} />
              <div className={styles.feedbackContent}>
                <Text>Correct answer:</Text>
                <Text color="gold" className={styles.correctAnswer}>
                  {exercise.correctAnswer}
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
          Check Answer
        </Button>
      )}
    </div>
  );
}
