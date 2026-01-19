'use client';

import { Text } from '@/components/ui';
import { IoCheckmarkCircle, IoCloseCircle } from 'react-icons/io5';
import styles from './ReviewProgress.module.css';

interface ReviewProgressProps {
  current: number;
  total: number;
  correct: number;
  incorrect: number;
}

export default function ReviewProgress({
  current,
  total,
  correct,
  incorrect,
}: ReviewProgressProps) {
  const progressPercent = ((current - 1) / total) * 100;
  const accuracy = correct + incorrect > 0 ? (correct / (correct + incorrect)) * 100 : 0;

  return (
    <div className={styles.progressContainer}>
      {/* Progress bar */}
      <div className={styles.progressBar}>
        <div
          className={styles.progressFill}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Progress info */}
      <div className={styles.progressInfo}>
        <Text className={styles.progressCount}>
          {current} / {total}
        </Text>

        <div className={styles.statsRow}>
          <div className={styles.statItem}>
            <IoCheckmarkCircle className={styles.correctIcon} />
            <span>{correct}</span>
          </div>
          <div className={styles.statItem}>
            <IoCloseCircle className={styles.incorrectIcon} />
            <span>{incorrect}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.accuracyLabel}>{t('review.progress.accuracy')}</span>
            <span className={styles.accuracyValue}>{Math.round(accuracy)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
