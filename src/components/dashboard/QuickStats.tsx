'use client';

import { Text, Card } from '@/components/ui';
import { useLanguage } from '@/context/LanguageProvider';
import { IoFlame, IoBook, IoTime, IoLanguage } from 'react-icons/io5';
import styles from './QuickStats.module.css';

interface QuickStatsProps {
  streak: number;
  wordsLearned: number;
  studyTimeMinutes: number;
  lessonsCompleted: number;
}

export default function QuickStats({
  streak,
  wordsLearned,
  studyTimeMinutes,
  lessonsCompleted,
}: QuickStatsProps) {
  const { t } = useLanguage();
  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const stats = [
    {
      icon: IoFlame,
      value: streak,
      label: t('dashboard.dayStreak'),
      color: 'var(--accent-orange, #FFA500)',
    },
    {
      icon: IoLanguage,
      value: wordsLearned,
      label: t('dashboard.wordsLearned'),
      color: 'var(--accent-blue, #4A90D9)',
    },
    {
      icon: IoTime,
      value: formatTime(studyTimeMinutes),
      label: t('dashboard.studyTime'),
      color: 'var(--accent-green, #4ADE80)',
    },
    {
      icon: IoBook,
      value: lessonsCompleted,
      label: t('dashboard.lessons'),
      color: 'var(--accent-purple, #A855F7)',
    },
  ];

  return (
    <div className={styles.container}>
      {stats.map((stat) => (
        <Card key={stat.label} variant="glass" className={styles.statCard}>
          <div
            className={styles.iconWrapper}
            style={{ backgroundColor: `${stat.color}20` }}
          >
            <stat.icon className={styles.icon} style={{ color: stat.color }} />
          </div>
          <div className={styles.statContent}>
            <Text variant="h3" className={styles.value}>
              {stat.value}
            </Text>
            <Text variant="caption" color="muted">
              {stat.label}
            </Text>
          </div>
        </Card>
      ))}
    </div>
  );
}
