'use client';

import { Text } from '@/components/ui';
import { useLanguage } from '@/context/LanguageProvider';
import styles from './LessonProgress.module.css';

interface LessonProgressProps {
  current: number;
  total: number;
  phase: 'learning' | 'exercises';
}

export default function LessonProgressBar({
  current,
  total,
  phase,
}: LessonProgressProps) {
  const { t } = useLanguage();
  const progress = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Text variant="label" color="muted" className={styles.phaseLabel}>
          {phase === 'learning' ? t('lessons.view.learning') : t('lessons.view.practice')}
        </Text>
        <Text variant="caption" color="muted">
          {current} / {total}
        </Text>
      </div>

      <div className={styles.progressBar}>
        <div
          className={`${styles.progressFill} ${styles[phase]}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
