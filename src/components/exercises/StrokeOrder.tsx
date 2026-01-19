'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Text, Button } from '@/components/ui';
import { IoCheckmark, IoClose, IoRefresh, IoVolumeHigh, IoPlay, IoEye, IoEyeOff } from 'react-icons/io5';
import { useLanguage } from '@/context/LanguageProvider';
import { useTTS } from '@/hooks/useTTS';
import type { StrokeOrderExercise } from '@/types/exercises';
import styles from './StrokeOrder.module.css';

interface StrokeOrderProps {
  exercise: StrokeOrderExercise;
  onAnswer: (isCorrect: boolean) => void;
}

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  points: Point[];
}

export default function StrokeOrder({ exercise, onAnswer }: StrokeOrderProps) {
  const { t } = useLanguage();
  const [currentStroke, setCurrentStroke] = useState(0);
  const [userStrokes, setUserStrokes] = useState<Stroke[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [showGuide, setShowGuide] = useState(true);
  const [showAnimation, setShowAnimation] = useState(false);
  const [animationStep, setAnimationStep] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { speak } = useTTS();

  // Canvas dimensions
  const canvasSize = 300;
  const strokeWidth = 8;

  // Clear and redraw the canvas
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvasSize, canvasSize);

    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);

    // Vertical center line
    ctx.beginPath();
    ctx.moveTo(canvasSize / 2, 0);
    ctx.lineTo(canvasSize / 2, canvasSize);
    ctx.stroke();

    // Horizontal center line
    ctx.beginPath();
    ctx.moveTo(0, canvasSize / 2);
    ctx.lineTo(canvasSize, canvasSize / 2);
    ctx.stroke();

    ctx.setLineDash([]);

    // Draw guide character (faint)
    if (showGuide && !showAnimation) {
      ctx.font = `${canvasSize * 0.8}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fillText(exercise.character, canvasSize / 2, canvasSize / 2);
    }

    // Draw user strokes
    userStrokes.forEach((stroke, index) => {
      if (stroke.points.length < 2) return;

      ctx.beginPath();
      ctx.strokeStyle = 'var(--gold, #FFD700)';
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      stroke.points.forEach((point) => {
        ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();
    });

    // Draw current stroke being drawn
    if (currentPoints.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = 'var(--gold, #FFD700)';
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.moveTo(currentPoints[0].x, currentPoints[0].y);
      currentPoints.forEach((point) => {
        ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();
    }
  }, [userStrokes, currentPoints, showGuide, showAnimation, exercise.character]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // Animate strokes demonstration
  useEffect(() => {
    if (!showAnimation) {
      setAnimationStep(0);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw character stroke by stroke
    const interval = setInterval(() => {
      setAnimationStep((prev) => {
        if (prev >= exercise.strokeCount) {
          setShowAnimation(false);
          return 0;
        }
        return prev + 1;
      });
    }, 800);

    return () => clearInterval(interval);
  }, [showAnimation, exercise.strokeCount]);

  // Redraw during animation
  useEffect(() => {
    if (!showAnimation) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasSize, canvasSize);

    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(canvasSize / 2, 0);
    ctx.lineTo(canvasSize / 2, canvasSize);
    ctx.moveTo(0, canvasSize / 2);
    ctx.lineTo(canvasSize, canvasSize / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Show character partially based on animation step
    ctx.font = `${canvasSize * 0.8}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'var(--gold, #FFD700)';
    ctx.globalAlpha = Math.min(1, animationStep / exercise.strokeCount);
    ctx.fillText(exercise.character, canvasSize / 2, canvasSize / 2);
    ctx.globalAlpha = 1;
  }, [showAnimation, animationStep, exercise.character, exercise.strokeCount]);

  const getCanvasCoordinates = useCallback((e: React.MouseEvent | React.TouchEvent): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvasSize / rect.width;
    const scaleY = canvasSize / rect.height;

    let clientX: number;
    let clientY: number;

    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }, []);

  const handleStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (submitted) return;
    e.preventDefault();

    const point = getCanvasCoordinates(e);
    if (!point) return;

    setIsDrawing(true);
    setCurrentPoints([point]);
  }, [submitted, getCanvasCoordinates]);

  const handleMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || submitted) return;
    e.preventDefault();

    const point = getCanvasCoordinates(e);
    if (!point) return;

    setCurrentPoints((prev) => [...prev, point]);
  }, [isDrawing, submitted, getCanvasCoordinates]);

  const handleEnd = useCallback(() => {
    if (!isDrawing || submitted) return;

    if (currentPoints.length > 2) {
      setUserStrokes((prev) => [...prev, { points: currentPoints }]);
      setCurrentStroke((prev) => prev + 1);
    }

    setIsDrawing(false);
    setCurrentPoints([]);
  }, [isDrawing, submitted, currentPoints]);

  const handleClear = useCallback(() => {
    setUserStrokes([]);
    setCurrentStroke(0);
    setCurrentPoints([]);
  }, []);

  const handleSubmit = useCallback(() => {
    if (submitted) return;

    // Simple validation: check if user drew approximately the right number of strokes
    const strokeDiff = Math.abs(userStrokes.length - exercise.strokeCount);
    const isCorrect = strokeDiff <= 1 && userStrokes.length > 0;

    setFeedback(isCorrect ? 'correct' : 'incorrect');
    setSubmitted(true);

    setTimeout(() => {
      onAnswer(isCorrect);
    }, 1500);
  }, [submitted, userStrokes, exercise.strokeCount, onAnswer]);

  const handlePlayAudio = useCallback(() => {
    if (exercise.audioUrl) {
      speak(exercise.character, { audioUrl: exercise.audioUrl });
    } else {
      speak(exercise.character);
    }
  }, [exercise, speak]);

  const handleShowAnimation = useCallback(() => {
    handleClear();
    setShowAnimation(true);
  }, [handleClear]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Text variant="h2" className={styles.character}>
          {exercise.character}
        </Text>
        <Text variant="caption" color="muted">
          {t('exercises.strokeOrder.strokesCount', { count: exercise.strokeCount })}
        </Text>
        {exercise.mnemonic && (
          <Text variant="body" color="muted" className={styles.mnemonic}>
            {exercise.mnemonic}
          </Text>
        )}
      </div>

      <div className={styles.controls}>
        <Button variant="ghost" size="sm" onClick={handlePlayAudio}>
          <IoVolumeHigh /> {t('common.listen')}
        </Button>
        <Button variant="ghost" size="sm" onClick={handleShowAnimation}>
          <IoPlay /> {t('common.demo')}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setShowGuide(!showGuide)}>
          {showGuide ? <IoEyeOff /> : <IoEye />} {t('common.guide')}
        </Button>
        <Button variant="ghost" size="sm" onClick={handleClear} disabled={submitted}>
          <IoRefresh /> {t('common.clear')}
        </Button>
      </div>

      <div className={styles.canvasWrapper}>
        <canvas
          ref={canvasRef}
          width={canvasSize}
          height={canvasSize}
          className={styles.canvas}
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
          onContextMenu={(e) => e.preventDefault()}
        />
        <div className={styles.strokeCounter}>
          <Text variant="caption">
            {t('exercises.strokeOrder.strokesProgress', { current: currentStroke, total: exercise.strokeCount })}
          </Text>
        </div>
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
              <Text>{t('exercises.strokeOrder.feedbackIncorrect', { count: exercise.strokeCount })}</Text>
            </>
          )}
        </div>
      )}

      {!submitted && (
        <Button
          onClick={handleSubmit}
          disabled={userStrokes.length === 0}
          fullWidth
        >
          {t('exercises.strokeOrder.checkCharacter')}
        </Button>
      )}
    </div>
  );
}
