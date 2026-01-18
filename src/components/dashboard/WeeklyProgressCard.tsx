'use client';

import Link from 'next/link';
import { Text, Card } from '@/components/ui';
import { IoCalendar, IoTrendingUp, IoTrendingDown, IoRemove } from 'react-icons/io5';
import styles from './WeeklyProgressCard.module.css';

interface WeeklyProgressCardProps {
  studyTimeMinutes: number;
  lessonsCompleted: number;
  xpEarned: number;
  accuracy: number;
  streakDays: number;
  comparison?: {
    studyTimeChange: number;
    lessonsChange: number;
  };
}

export default function WeeklyProgressCard({
  studyTimeMinutes,
  lessonsCompleted,
  xpEarned,
  accuracy,
  streakDays,
  comparison,
}: WeeklyProgressCardProps) {
  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const getTrendIcon = (change: number) => {
    if (change > 5) return <IoTrendingUp className={styles.trendUp} />;
    if (change < -5) return <IoTrendingDown className={styles.trendDown} />;
    return <IoRemove className={styles.trendNeutral} />;
  };

  return (
    <Card variant="glass" className={styles.card}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <IoCalendar className={styles.icon} />
          <Text variant="h3" className={styles.titleText}>This Week</Text>
        </div>
        <Link href="/weekly-report" className={styles.viewReport}>
          <Text variant="caption" color="muted">Full Report</Text>
        </Link>
      </div>

      <div className={styles.stats}>
        <div className={styles.statItem}>
          <Text variant="h3" className={styles.statValue}>
            {formatTime(studyTimeMinutes)}
          </Text>
          <Text variant="caption" color="muted">Study Time</Text>
          {comparison && (
            <div className={styles.trend}>
              {getTrendIcon(comparison.studyTimeChange)}
              <Text variant="caption" className={styles.trendText}>
                {comparison.studyTimeChange > 0 ? '+' : ''}
                {comparison.studyTimeChange}%
              </Text>
            </div>
          )}
        </div>

        <div className={styles.statItem}>
          <Text variant="h3" className={styles.statValue}>
            {lessonsCompleted}
          </Text>
          <Text variant="caption" color="muted">Lessons</Text>
          {comparison && (
            <div className={styles.trend}>
              {getTrendIcon(comparison.lessonsChange)}
              <Text variant="caption" className={styles.trendText}>
                {comparison.lessonsChange > 0 ? '+' : ''}
                {comparison.lessonsChange}%
              </Text>
            </div>
          )}
        </div>

        <div className={styles.statItem}>
          <Text variant="h3" className={styles.statValue}>
            {xpEarned}
          </Text>
          <Text variant="caption" color="muted">XP Earned</Text>
        </div>

        <div className={styles.statItem}>
          <Text variant="h3" className={styles.statValue}>
            {streakDays}/7
          </Text>
          <Text variant="caption" color="muted">Active Days</Text>
        </div>
      </div>

      {accuracy > 0 && (
        <div className={styles.accuracyBar}>
          <div className={styles.accuracyHeader}>
            <Text variant="caption" color="muted">Accuracy</Text>
            <Text variant="label" className={styles.accuracyValue}>
              {accuracy}%
            </Text>
          </div>
          <div className={styles.accuracyTrack}>
            <div
              className={styles.accuracyFill}
              style={{ width: `${accuracy}%` }}
            />
          </div>
        </div>
      )}
    </Card>
  );
}
