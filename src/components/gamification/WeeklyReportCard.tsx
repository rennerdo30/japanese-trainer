'use client';

import { useMemo } from 'react';
import { Card, Text } from '@/components/ui';
import { useLanguage } from '@/context/LanguageProvider';
import {
  IoTime,
  IoBook,
  IoFlame,
  IoTrendingUp,
  IoTrendingDown,
  IoSparkles,
  IoCalendar,
  IoLanguage,
} from 'react-icons/io5';
import styles from './WeeklyReportCard.module.css';

interface WeeklyStats {
  totalStudyTimeMinutes: number;
  lessonsCompleted: number;
  exercisesCompleted: number;
  accuracy: number;
  xpEarned: number;
  streakDays: number;
  newWordsLearned: number;
  newKanjiLearned: number;
}

interface Comparison {
  studyTimeChange: number;
  lessonsChange: number;
  accuracyChange: number;
}

interface WeeklyReportCardProps {
  weekStart: string;
  weekEnd: string;
  stats: WeeklyStats;
  comparison?: Comparison;
  highlights?: string[];
  compact?: boolean;
}

export default function WeeklyReportCard({
  weekStart,
  weekEnd,
  stats,
  comparison,
  highlights,
  compact = false,
}: WeeklyReportCardProps) {
  const { t } = useLanguage();

  // Format dates
  const dateRange = useMemo(() => {
    const start = new Date(weekStart);
    const end = new Date(weekEnd);
    const formatOptions: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
    };
    return `${start.toLocaleDateString(undefined, formatOptions)} - ${end.toLocaleDateString(undefined, formatOptions)}`;
  }, [weekStart, weekEnd]);

  // Format study time
  const formattedStudyTime = useMemo(() => {
    const hours = Math.floor(stats.totalStudyTimeMinutes / 60);
    const minutes = stats.totalStudyTimeMinutes % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }, [stats.totalStudyTimeMinutes]);

  // Render change indicator
  const renderChange = (value: number) => {
    if (value === 0) return null;
    const isPositive = value > 0;
    return (
      <span className={`${styles.change} ${isPositive ? styles.positive : styles.negative}`}>
        {isPositive ? <IoTrendingUp /> : <IoTrendingDown />}
        {Math.abs(value)}%
      </span>
    );
  };

  if (compact) {
    return (
      <Card variant="glass" className={styles.compactCard}>
        <div className={styles.compactHeader}>
          <IoCalendar className={styles.calendarIcon} />
          <Text variant="label" color="muted">{dateRange}</Text>
        </div>
        <div className={styles.compactStats}>
          <div className={styles.compactStat}>
            <IoTime className={styles.statIcon} />
            <Text variant="body">{formattedStudyTime}</Text>
          </div>
          <div className={styles.compactStat}>
            <IoBook className={styles.statIcon} />
            <Text variant="body">{stats.lessonsCompleted}</Text>
          </div>
          <div className={styles.compactStat}>
            <IoFlame className={styles.statIcon} />
            <Text variant="body">{stats.streakDays}/7</Text>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card variant="glass" className={styles.card}>
      <div className={styles.header}>
        <div className={styles.dateContainer}>
          <IoCalendar className={styles.calendarIcon} />
          <Text variant="h3">{t('gamification.weeklyReport.title')}</Text>
        </div>
        <Text variant="caption" color="muted">{dateRange}</Text>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statItem}>
          <div className={styles.statIconWrapper}>
            <IoTime className={styles.statIcon} />
          </div>
          <div className={styles.statContent}>
            <Text variant="h3" className={styles.statValue}>{formattedStudyTime}</Text>
            <Text variant="caption" color="muted">{t('gamification.weeklyReport.studyTime')}</Text>
            {comparison && renderChange(comparison.studyTimeChange)}
          </div>
        </div>

        <div className={styles.statItem}>
          <div className={styles.statIconWrapper}>
            <IoBook className={styles.statIcon} />
          </div>
          <div className={styles.statContent}>
            <Text variant="h3" className={styles.statValue}>{stats.lessonsCompleted}</Text>
            <Text variant="caption" color="muted">{t('gamification.weeklyReport.lessons')}</Text>
            {comparison && renderChange(comparison.lessonsChange)}
          </div>
        </div>

        <div className={styles.statItem}>
          <div className={styles.statIconWrapper}>
            <IoFlame className={styles.statIcon} />
          </div>
          <div className={styles.statContent}>
            <Text variant="h3" className={styles.statValue}>{stats.streakDays}/7</Text>
            <Text variant="caption" color="muted">{t('gamification.weeklyReport.activeDays')}</Text>
          </div>
        </div>

        <div className={styles.statItem}>
          <div className={styles.statIconWrapper}>
            <IoSparkles className={styles.statIcon} />
          </div>
          <div className={styles.statContent}>
            <Text variant="h3" className={styles.statValue}>{stats.xpEarned}</Text>
            <Text variant="caption" color="muted">{t('gamification.weeklyReport.xpEarned')}</Text>
          </div>
        </div>

        <div className={styles.statItem}>
          <div className={styles.statIconWrapper}>
            <IoLanguage className={styles.statIcon} />
          </div>
          <div className={styles.statContent}>
            <Text variant="h3" className={styles.statValue}>{stats.newWordsLearned}</Text>
            <Text variant="caption" color="muted">{t('gamification.weeklyReport.newWords')}</Text>
          </div>
        </div>

        <div className={styles.statItem}>
          <div className={styles.statIconWrapper} data-type="accuracy">
            <Text variant="body" className={styles.accuracyText}>{stats.accuracy}%</Text>
          </div>
          <div className={styles.statContent}>
            <Text variant="caption" color="muted">{t('gamification.weeklyReport.accuracy')}</Text>
            {comparison && renderChange(comparison.accuracyChange)}
          </div>
        </div>
      </div>

      {highlights && highlights.length > 0 && (
        <div className={styles.highlights}>
          <Text variant="label" color="muted">{t('gamification.weeklyReport.highlights')}</Text>
          <ul className={styles.highlightList}>
            {highlights.map((highlight, index) => (
              <li key={index} className={styles.highlightItem}>
                <IoSparkles className={styles.highlightIcon} />
                <Text variant="body">{highlight}</Text>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
