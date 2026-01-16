'use client';

import { Card, Text, Button, Animated } from '@/components/ui';
import { IoCheckmarkCircle, IoCloseCircle, IoTime, IoBook, IoSchool, IoDocumentText, IoTrophy } from 'react-icons/io5';
import { ReviewModuleName } from '@/lib/reviewQueue';
import styles from './ReviewStats.module.css';

interface ReviewStatsProps {
  stats: {
    accuracy: number;
    avgTimePerItem: number;
    totalItems: number;
    correct: number;
    incorrect: number;
    duration: number;
    moduleBreakdown: Record<ReviewModuleName, { reviewed: number; correct: number }>;
  };
  onBackToDashboard: () => void;
  onAnotherSession: () => void;
}

const moduleIcons = {
  vocabulary: IoBook,
  kanji: IoSchool,
  grammar: IoDocumentText,
};

const moduleLabels = {
  vocabulary: 'Vocabulary',
  kanji: 'Kanji',
  grammar: 'Grammar',
};

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes === 0) {
    return `${seconds}s`;
  }
  return `${minutes}m ${remainingSeconds}s`;
}

export default function ReviewStats({
  stats,
  onBackToDashboard,
  onAnotherSession,
}: ReviewStatsProps) {
  const accuracyPercent = Math.round(stats.accuracy * 100);

  // Determine performance level
  let performanceLevel: 'excellent' | 'good' | 'okay' | 'needsWork';
  if (accuracyPercent >= 90) performanceLevel = 'excellent';
  else if (accuracyPercent >= 70) performanceLevel = 'good';
  else if (accuracyPercent >= 50) performanceLevel = 'okay';
  else performanceLevel = 'needsWork';

  const performanceMessages = {
    excellent: 'Excellent work! Keep it up!',
    good: 'Good job! You\'re making progress.',
    okay: 'Not bad! Keep practicing.',
    needsWork: 'Keep going! Practice makes perfect.',
  };

  return (
    <Card variant="glass" className={styles.statsCard}>
      <Animated animation="fadeInDown">
        <div className={styles.header}>
          <IoTrophy className={styles.trophyIcon} />
          <Text variant="h1" color="gold">
            Session Complete!
          </Text>
        </div>
      </Animated>

      <Animated animation="fadeInUp">
        {/* Main stats */}
        <div className={styles.mainStats}>
          <div className={styles.accuracyCircle}>
            <div className={`${styles.accuracyRing} ${styles[performanceLevel]}`}>
              <span className={styles.accuracyValue}>{accuracyPercent}%</span>
            </div>
            <Text color="muted">Accuracy</Text>
          </div>

          <div className={styles.sideStats}>
            <div className={styles.statItem}>
              <IoCheckmarkCircle className={styles.correctIcon} />
              <div>
                <Text variant="h3">{stats.correct}</Text>
                <Text variant="label" color="muted">Correct</Text>
              </div>
            </div>

            <div className={styles.statItem}>
              <IoCloseCircle className={styles.incorrectIcon} />
              <div>
                <Text variant="h3">{stats.incorrect}</Text>
                <Text variant="label" color="muted">Incorrect</Text>
              </div>
            </div>

            <div className={styles.statItem}>
              <IoTime className={styles.timeIcon} />
              <div>
                <Text variant="h3">{formatDuration(stats.duration)}</Text>
                <Text variant="label" color="muted">Duration</Text>
              </div>
            </div>
          </div>
        </div>

        {/* Performance message */}
        <div className={`${styles.performanceMessage} ${styles[performanceLevel]}`}>
          <Text>{performanceMessages[performanceLevel]}</Text>
        </div>

        {/* Module breakdown */}
        <div className={styles.moduleBreakdown}>
          <Text variant="label" color="muted" className={styles.breakdownLabel}>
            Module Breakdown
          </Text>

          <div className={styles.moduleList}>
            {(Object.entries(stats.moduleBreakdown) as [ReviewModuleName, { reviewed: number; correct: number }][]).map(
              ([module, data]) => {
                if (data.reviewed === 0) return null;

                const ModuleIcon = moduleIcons[module];
                const moduleAccuracy = data.reviewed > 0 ? Math.round((data.correct / data.reviewed) * 100) : 0;

                return (
                  <div key={module} className={styles.moduleItem}>
                    <div className={styles.moduleInfo}>
                      <ModuleIcon className={styles.moduleIcon} />
                      <Text>{moduleLabels[module]}</Text>
                    </div>
                    <div className={styles.moduleStats}>
                      <span>{data.correct}/{data.reviewed}</span>
                      <span className={styles.moduleAccuracy}>({moduleAccuracy}%)</span>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>

        {/* Average time */}
        <div className={styles.avgTime}>
          <Text color="muted">
            Average time per item: {(stats.avgTimePerItem / 1000).toFixed(1)}s
          </Text>
        </div>

        {/* Action buttons */}
        <div className={styles.actions}>
          <Button onClick={onAnotherSession} size="lg" fullWidth>
            Review More Items
          </Button>
          <Button onClick={onBackToDashboard} variant="ghost" fullWidth>
            Back to Dashboard
          </Button>
        </div>
      </Animated>
    </Card>
  );
}
