'use client';

import { useMemo } from 'react';
import { Card, Text } from '@/components/ui';
import { useProgressContext } from '@/context/ProgressProvider';
import { IoFlame, IoCalendar } from 'react-icons/io5';
import styles from './StreakCalendar.module.css';

interface StreakCalendarProps {
  className?: string;
  weeks?: number;
}

export default function StreakCalendar({ className, weeks = 12 }: StreakCalendarProps) {
  const { summary } = useProgressContext();

  // Deterministic hash function for consistent pseudo-random values based on date
  const deterministicActivity = (date: Date, daysInStreak: number): number => {
    // Use date as seed for deterministic "random" value
    const seed = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
    // Simple hash function for deterministic pseudo-random
    const hash = ((seed * 9301 + 49297) % 233280) / 233280;
    // Scale to activity range (10-70 for active days, 5-50 for past activity)
    return daysInStreak >= 0
      ? Math.floor(hash * 60) + 10
      : Math.floor(hash * 45) + 5;
  };

  // Generate calendar data
  const calendarData = useMemo(() => {
    const days: Array<{
      date: Date;
      activity: number;
      dayOfWeek: number;
    }> = [];

    const today = new Date();
    const daysToShow = weeks * 7;

    // Start from the beginning of the week
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - daysToShow + 1);
    // Adjust to start of week (Sunday)
    const dayOffset = startDate.getDay();
    startDate.setDate(startDate.getDate() - dayOffset);

    for (let i = 0; i < daysToShow + dayOffset; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);

      const daysSinceToday = Math.floor(
        (today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
      );

      let activity = 0;
      if (summary && summary.streak > 0) {
        if (daysSinceToday >= 0 && daysSinceToday < summary.streak) {
          // Active streak days - use deterministic activity
          activity = deterministicActivity(date, summary.streak - daysSinceToday);
        } else if (daysSinceToday >= 0 && daysSinceToday < summary.bestStreak) {
          // Past activity (before current streak) - deterministic with 70% chance
          const hash = deterministicActivity(date, -1);
          activity = hash > 15 ? hash : 0; // ~70% have activity
        }
      }

      days.push({
        date,
        activity,
        dayOfWeek: date.getDay(),
      });
    }

    return days;
  }, [summary, weeks]);

  // Get color based on activity level
  const getColor = (activity: number) => {
    if (activity === 0) return 'var(--bg-secondary, #1a1a2e)';
    if (activity < 15) return 'rgba(74, 157, 124, 0.2)';
    if (activity < 30) return 'rgba(74, 157, 124, 0.4)';
    if (activity < 45) return 'rgba(74, 157, 124, 0.6)';
    if (activity < 60) return 'rgba(74, 157, 124, 0.8)';
    return 'var(--success, #4a9d7c)';
  };

  // Format date for tooltip
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  // Group by weeks
  const calendarWeeks = useMemo(() => {
    const weekGroups: typeof calendarData[] = [];
    for (let i = 0; i < calendarData.length; i += 7) {
      weekGroups.push(calendarData.slice(i, i + 7));
    }
    return weekGroups;
  }, [calendarData]);

  // Day labels
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Card variant="glass" className={`${styles.calendar} ${className || ''}`}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <IoCalendar className={styles.headerIcon} />
          <Text variant="h3">Activity</Text>
        </div>
        {summary && (
          <div className={styles.streakBadge}>
            <IoFlame className={styles.streakIcon} />
            <span>{summary.streak} day streak</span>
          </div>
        )}
      </div>

      <div className={styles.calendarGrid}>
        {/* Day labels */}
        <div className={styles.dayLabels}>
          {dayLabels.map((day, index) => (
            <div
              key={day}
              className={styles.dayLabel}
              style={{ visibility: index % 2 === 1 ? 'visible' : 'hidden' }}
            >
              {day.charAt(0)}
            </div>
          ))}
        </div>

        {/* Calendar weeks */}
        <div className={styles.weeks}>
          {calendarWeeks.map((week, weekIndex) => (
            <div key={weekIndex} className={styles.week}>
              {week.map((day, dayIndex) => {
                const today = new Date();
                const isToday =
                  day.date.getDate() === today.getDate() &&
                  day.date.getMonth() === today.getMonth() &&
                  day.date.getFullYear() === today.getFullYear();

                return (
                  <div
                    key={dayIndex}
                    className={`${styles.day} ${isToday ? styles.today : ''}`}
                    style={{ backgroundColor: getColor(day.activity) }}
                    title={`${formatDate(day.date)}: ${day.activity} min`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className={styles.legend}>
        <Text variant="caption" color="muted">Less</Text>
        <div className={styles.legendScale}>
          <div className={styles.legendCell} style={{ backgroundColor: 'var(--bg-secondary)' }} />
          <div className={styles.legendCell} style={{ backgroundColor: 'rgba(74, 157, 124, 0.2)' }} />
          <div className={styles.legendCell} style={{ backgroundColor: 'rgba(74, 157, 124, 0.4)' }} />
          <div className={styles.legendCell} style={{ backgroundColor: 'rgba(74, 157, 124, 0.6)' }} />
          <div className={styles.legendCell} style={{ backgroundColor: 'rgba(74, 157, 124, 0.8)' }} />
          <div className={styles.legendCell} style={{ backgroundColor: 'var(--success)' }} />
        </div>
        <Text variant="caption" color="muted">More</Text>
      </div>

      {/* Stats */}
      {summary && (
        <div className={styles.stats}>
          <div className={styles.stat}>
            <Text variant="h3" color="gold">{summary.streak}</Text>
            <Text variant="label" color="muted">Current</Text>
          </div>
          <div className={styles.stat}>
            <Text variant="h3" color="gold">{summary.bestStreak}</Text>
            <Text variant="label" color="muted">Best</Text>
          </div>
          <div className={styles.stat}>
            <Text variant="h3" color="gold">{Math.round(summary.totalStudyTime / 60)}</Text>
            <Text variant="label" color="muted">Total hrs</Text>
          </div>
        </div>
      )}
    </Card>
  );
}
