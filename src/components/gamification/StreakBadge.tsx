'use client';

import { Text } from '@/components/ui';
import { IoFlame } from 'react-icons/io5';
import { getStreakDisplayText, getStreakColorClass, getStreakMessage } from '@/lib/streak';
import type { StreakData } from '@/types/gamification';
import styles from './StreakBadge.module.css';

interface StreakBadgeProps {
  streak: StreakData | null;
  showMessage?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function StreakBadge({
  streak,
  showMessage = false,
  size = 'md',
}: StreakBadgeProps) {
  const currentStreak = streak?.currentStreak ?? 0;
  const isActive = currentStreak > 0;
  const colorClass = getStreakColorClass(currentStreak);

  return (
    <div className={`${styles.container} ${styles[size]} ${styles[colorClass]}`}>
      <div className={`${styles.badge} ${isActive ? styles.active : ''}`}>
        <IoFlame className={styles.flameIcon} />
        <Text variant={size === 'lg' ? 'h2' : size === 'sm' ? 'body' : 'h3'}>
          {currentStreak}
        </Text>
      </div>

      {showMessage && (
        <div className={styles.info}>
          <Text variant="body" className={styles.displayText}>
            {getStreakDisplayText(currentStreak)}
          </Text>
          <Text variant="caption" color="muted" className={styles.message}>
            {getStreakMessage(currentStreak)}
          </Text>

          {(streak?.longestStreak ?? 0) > currentStreak && (
            <Text variant="caption" color="muted" className={styles.best}>
              Best: {streak?.longestStreak} days
            </Text>
          )}
        </div>
      )}
    </div>
  );
}
