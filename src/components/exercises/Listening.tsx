'use client';

import { useState, useCallback } from 'react';
import { Text, Button } from '@/components/ui';
import { IoCheckmark, IoClose, IoVolumeHigh, IoRefresh, IoEye } from 'react-icons/io5';
import { useTTS } from '@/hooks/useTTS';
import type { ListeningExercise } from '@/types/exercises';
import styles from './Listening.module.css';

interface ListeningProps {
  exercise: ListeningExercise;
  onAnswer: (isCorrect: boolean) => void;
}

export default function Listening({ exercise, onAnswer }: ListeningProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [playCount, setPlayCount] = useState(0);
  const { speak, isPlaying } = useTTS();

  const handlePlay = useCallback(() => {
    speak('', { audioUrl: exercise.audioUrl });
    setPlayCount(prev => prev + 1);
  }, [exercise.audioUrl, speak]);

  const handleSelect = useCallback((index: number) => {
    if (submitted) return;
    setSelectedIndex(index);
  }, [submitted]);

  const handleSubmit = useCallback(() => {
    if (selectedIndex === null || submitted) return;

    const isCorrect = selectedIndex === exercise.correctIndex;
    setFeedback(isCorrect ? 'correct' : 'incorrect');
    setSubmitted(true);

    setTimeout(() => {
      onAnswer(isCorrect);
    }, 1500);
  }, [selectedIndex, exercise.correctIndex, onAnswer, submitted]);

  return (
    <div className={styles.container}>
      <div className={styles.audioSection}>
        <Button
          onClick={handlePlay}
          size="lg"
          disabled={isPlaying}
          className={styles.playButton}
        >
          <IoVolumeHigh /> {isPlaying ? 'Playing...' : 'Play Audio'}
        </Button>
        {playCount > 0 && (
          <Text variant="caption" color="muted">
            Played {playCount} time{playCount !== 1 ? 's' : ''}
          </Text>
        )}
      </div>

      <Text variant="h3" className={styles.question}>
        {exercise.question}
      </Text>

      <div className={styles.options}>
        {exercise.options.map((option, index) => {
          const isSelected = selectedIndex === index;
          const isCorrect = index === exercise.correctIndex;
          const showCorrect = submitted && isCorrect;
          const showIncorrect = submitted && isSelected && !isCorrect;

          return (
            <button
              key={index}
              onClick={() => handleSelect(index)}
              disabled={submitted}
              className={`${styles.option} ${isSelected ? styles.selected : ''} ${showCorrect ? styles.correct : ''} ${showIncorrect ? styles.incorrect : ''}`}
            >
              <span>{option}</span>
              {showCorrect && <IoCheckmark className={styles.icon} />}
              {showIncorrect && <IoClose className={styles.icon} />}
            </button>
          );
        })}
      </div>

      {exercise.transcript && (
        <div className={styles.transcriptSection}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowTranscript(!showTranscript)}
          >
            <IoEye /> {showTranscript ? 'Hide' : 'Show'} Transcript
          </Button>
          {showTranscript && (
            <div className={styles.transcript}>
              <Text color="muted">{exercise.transcript}</Text>
            </div>
          )}
        </div>
      )}

      {!submitted && (
        <Button
          onClick={handleSubmit}
          disabled={selectedIndex === null}
          fullWidth
        >
          Check Answer
        </Button>
      )}
    </div>
  );
}
