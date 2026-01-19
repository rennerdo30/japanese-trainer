'use client';

import { Text } from '@/components/ui';
import { useLanguage } from '@/context/LanguageProvider';
import { IoFlame, IoStar, IoNotifications, IoPerson } from 'react-icons/io5';
import { getLevelTierColor } from '@/lib/xp';
import { getStreakColorClass } from '@/lib/streak';
import type { UserLevel, StreakData, DailyGoal } from '@/types/gamification';
import styles from './Header.module.css';

interface HeaderProps {
  level: UserLevel | null;
  streak: StreakData | null;
  dailyGoal: DailyGoal | null;
  userName?: string;
  onProfileClick?: () => void;
  onNotificationsClick?: () => void;
}

export default function Header({
  level,
  streak,
  dailyGoal,
  userName,
  onProfileClick,
  onNotificationsClick,
}: HeaderProps) {
  const { t } = useLanguage();
  const currentStreak = streak?.currentStreak ?? 0;
  const currentLevel = level?.level ?? 1;
  const levelProgress = level
    ? Math.round((level.currentXP / level.xpToNextLevel) * 100)
    : 0;
  const dailyProgress = dailyGoal
    ? Math.min(100, Math.round((dailyGoal.current / dailyGoal.target) * 100))
    : 0;

  const tierColor = getLevelTierColor(currentLevel);
  const streakColor = getStreakColorClass(currentStreak);

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        {userName && (
          <button className={styles.profileButton} onClick={onProfileClick}>
            <IoPerson className={styles.profileIcon} />
          </button>
        )}
        <div className={styles.greeting}>
          <Text variant="h3" className={styles.greetingText}>
            {getGreeting(t)}
            {userName && <span className={styles.userName}>, {userName}</span>}
          </Text>
        </div>
      </div>

      <div className={styles.stats}>
        {/* Streak Badge */}
        <div className={`${styles.stat} ${styles[streakColor]}`}>
          <div className={`${styles.statBadge} ${currentStreak > 0 ? styles.active : ''}`}>
            <IoFlame className={styles.statIcon} />
            <Text variant="body" className={styles.statValue}>
              {currentStreak}
            </Text>
          </div>
        </div>

        {/* Level Badge */}
        <div className={`${styles.stat} ${styles[tierColor]}`}>
          <div className={styles.levelBadge}>
            <IoStar className={styles.statIcon} />
            <Text variant="body" className={styles.statValue}>
              {currentLevel}
            </Text>
          </div>
          <div className={styles.levelProgressBar}>
            <div
              className={styles.levelProgressFill}
              style={{ width: `${levelProgress}%` }}
            />
          </div>
        </div>

        {/* Daily Goal Progress */}
        {dailyGoal && (
          <div className={`${styles.stat} ${dailyGoal.completed ? styles.completed : ''}`}>
            <div className={styles.dailyGoalRing}>
              <svg viewBox="0 0 36 36" className={styles.dailyGoalSvg}>
                <circle
                  className={styles.dailyGoalBg}
                  cx="18"
                  cy="18"
                  r="15.915"
                />
                <circle
                  className={styles.dailyGoalFill}
                  cx="18"
                  cy="18"
                  r="15.915"
                  strokeDasharray={`${dailyProgress}, 100`}
                />
              </svg>
              <Text variant="caption" className={styles.dailyGoalPercent}>
                {dailyProgress}%
              </Text>
            </div>
          </div>
        )}

        {/* Notifications */}
        {onNotificationsClick && (
          <button
            className={styles.notificationButton}
            onClick={onNotificationsClick}
            aria-label={t('dashboard.notifications')}
          >
            <IoNotifications className={styles.notificationIcon} />
          </button>
        )}
      </div>
    </header>
  );
}

function getGreeting(t: (key: string) => string): string {
  const hour = new Date().getHours();

  if (hour < 5) return t('dashboard.greetings.goodNight');
  if (hour < 12) return t('dashboard.greetings.goodMorning');
  if (hour < 17) return t('dashboard.greetings.goodAfternoon');
  if (hour < 21) return t('dashboard.greetings.goodEvening');
  return t('dashboard.greetings.goodNight');
}
