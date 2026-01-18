'use client';

import { Card, Text, Button } from '@/components/ui';
import type { CurriculumLesson } from '@/types/curriculum';
import {
  IoCheckmarkCircle,
  IoTrophy,
  IoFlame,
  IoArrowForward,
  IoHome,
  IoStar,
} from 'react-icons/io5';
import styles from './LessonSummary.module.css';

interface LessonResult {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  xpEarned: number;
  xpBreakdown: {
    base: number;
    perfect: number;
    streak: number;
  };
  leveledUp: boolean;
  newLevel?: number;
}

interface LessonSummaryProps {
  lesson: CurriculumLesson;
  result: LessonResult;
  nextLesson: CurriculumLesson | null;
  onNextLesson: () => void;
  onBackToPath: () => void;
}

export default function LessonSummary({
  lesson,
  result,
  nextLesson,
  onNextLesson,
  onBackToPath,
}: LessonSummaryProps) {
  const isPerfect = result.score === 100;

  return (
    <div className={styles.summaryContainer}>
      {/* Header with celebration */}
      <div className={styles.header}>
        <div className={`${styles.celebrationIcon} ${isPerfect ? styles.perfect : ''}`}>
          {isPerfect ? <IoTrophy /> : <IoCheckmarkCircle />}
        </div>
        <Text variant="h1" color="gold" className={styles.title}>
          {isPerfect ? 'Perfect!' : 'Lesson Complete!'}
        </Text>
        <Text color="muted" className={styles.subtitle}>
          {lesson.title}
        </Text>
      </div>

      {/* Stats Card */}
      <Card variant="glass" className={styles.statsCard}>
        {/* Score */}
        <div className={styles.scoreSection}>
          <div className={styles.scoreCircle}>
            <Text variant="h1" className={styles.scoreValue}>
              {result.score}%
            </Text>
          </div>
          <Text variant="caption" color="muted">
            {result.correctAnswers} / {result.totalQuestions} correct
          </Text>
        </div>

        {/* XP Breakdown */}
        <div className={styles.xpSection}>
          <Text variant="h2" color="gold" className={styles.xpTotal}>
            +{result.xpEarned} XP
          </Text>

          <div className={styles.xpBreakdown}>
            <div className={styles.xpItem}>
              <IoStar className={styles.xpIcon} />
              <Text variant="caption">Base: +{result.xpBreakdown.base}</Text>
            </div>

            {result.xpBreakdown.perfect > 0 && (
              <div className={styles.xpItem}>
                <IoTrophy className={styles.xpIcon} />
                <Text variant="caption">Perfect: +{result.xpBreakdown.perfect}</Text>
              </div>
            )}

            {result.xpBreakdown.streak > 0 && (
              <div className={styles.xpItem}>
                <IoFlame className={styles.xpIcon} />
                <Text variant="caption">Streak: +{result.xpBreakdown.streak}</Text>
              </div>
            )}
          </div>
        </div>

        {/* Level Up Banner */}
        {result.leveledUp && (
          <div className={styles.levelUpBanner}>
            <IoTrophy className={styles.levelUpIcon} />
            <div className={styles.levelUpContent}>
              <Text variant="h3">Level Up!</Text>
              <Text variant="caption" color="muted">
                You reached level {result.newLevel}
              </Text>
            </div>
          </div>
        )}
      </Card>

      {/* Actions */}
      <div className={styles.actions}>
        {nextLesson ? (
          <Button onClick={onNextLesson} size="lg" className={styles.primaryButton}>
            Next Lesson <IoArrowForward />
          </Button>
        ) : (
          <Button onClick={onBackToPath} size="lg" className={styles.primaryButton}>
            Path Complete <IoTrophy />
          </Button>
        )}

        <Button variant="ghost" onClick={onBackToPath}>
          <IoHome /> Back to Path
        </Button>
      </div>

      {/* Next Lesson Preview */}
      {nextLesson && (
        <Card variant="outlined" className={styles.nextLessonPreview}>
          <Text variant="label" color="muted">
            Up Next
          </Text>
          <Text variant="h3">{nextLesson.title}</Text>
          <Text variant="caption" color="muted">
            {nextLesson.description}
          </Text>
        </Card>
      )}
    </div>
  );
}
