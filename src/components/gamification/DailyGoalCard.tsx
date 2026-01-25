'use client';

import { useMemo } from 'react';
import { Card, Text } from '@/components/ui';
import { IoFlame, IoCheckmarkCircle, IoTrophy, IoTime } from 'react-icons/io5';
import { useLanguage } from '@/context/LanguageProvider';
import type { DailyGoal, StreakData } from '@/types/gamification';
import styles from './DailyGoalCard.module.css';

interface DailyGoalCardProps {
  dailyGoal: DailyGoal | null;
  streak: StreakData | null;
  todayXP: number;
  compact?: boolean;
}

export default function DailyGoalCard({
  dailyGoal,
  streak,
  todayXP,
  compact = false,
}: DailyGoalCardProps) {
  const { t } = useLanguage();
  const progress = useMemo(() => {
    if (!dailyGoal) return 0;
    if (dailyGoal.target === 0) return 100;
    return Math.min(100, Math.round((dailyGoal.current / dailyGoal.target) * 100));
  }, [dailyGoal]);

  const isComplete = dailyGoal?.completed ?? false;

  // Calculate stroke dashoffset for circular progress
  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  if (compact) {
    return (
      <Card variant="glass" className={styles.compactCard}>
        <div className={styles.compactContent}>
          <div className={styles.streakBadge}>
            <IoFlame className={styles.flameIcon} />
            <Text variant="h3">{streak?.currentStreak ?? 0}</Text>
          </div>
          <div className={styles.divider} />
          <div className={styles.xpBadge}>
            <IoTrophy className={styles.trophyIcon} />
            <Text variant="h3">{todayXP}</Text>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card variant="glass" className={styles.card}>
      {/* Circular Progress */}
      <div className={styles.progressRing}>
        <svg className={styles.progressSvg} viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            className={styles.progressBg}
            cx="50"
            cy="50"
            r="45"
            fill="none"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <circle
            className={`${styles.progressFill} ${isComplete ? styles.complete : ''}`}
            cx="50"
            cy="50"
            r="45"
            fill="none"
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 50 50)"
          />
        </svg>

        {/* Center content */}
        <div className={styles.ringCenter}>
          {isComplete ? (
            <IoCheckmarkCircle className={styles.completeIcon} />
          ) : (
            <>
              <Text variant="h2" className={styles.progressValue}>
                {dailyGoal?.current ?? 0}
              </Text>
              <Text variant="caption" color="muted">
                / {dailyGoal?.target ?? 0}
              </Text>
            </>
          )}
        </div>
      </div>

      {/* Goal Info */}
      <div className={styles.goalInfo}>
        <Text variant="h3">
          {isComplete ? t('gamification.dailyGoal.complete') : t('gamification.dailyGoal.title')}
        </Text>
        <Text variant="caption" color="muted">
          {t(`gamification.dailyGoal.types.${dailyGoal?.type ?? 'xp'}`)}
        </Text>
      </div>

      {/* Streak Info */}
      <div className={styles.streakInfo}>
        <div className={styles.streakRow}>
          <IoFlame className={`${styles.flameIcon} ${streak?.currentStreak ? styles.active : ''}`} />
          <Text variant="body">
            {t('gamification.streak.dayStreak', { count: streak?.currentStreak ?? 0 })}
          </Text>
        </div>

        {(streak?.longestStreak ?? 0) > 0 && (
          <Text variant="caption" color="muted">
            {t('gamification.streak.best', { count: streak?.longestStreak ?? 0 })}
          </Text>
        )}
      </div>

      {/* Today's XP */}
      <div className={styles.todayXP}>
        <IoTrophy className={styles.trophyIcon} />
        <Text variant="body">{t('gamification.xp.today', { xp: todayXP })}</Text>
      </div>
    </Card>
  );
}
