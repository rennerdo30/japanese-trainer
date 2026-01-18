'use client';

import { useMemo } from 'react';
import { Card, Text } from '@/components/ui';
import {
  IoRocket,
  IoSchool,
  IoBook,
  IoTrophy,
  IoStar,
  IoCheckmarkDone,
  IoFlame,
  IoLanguage,
  IoArrowUp,
  IoMedal,
  IoCheckmarkCircle,
  IoCalendar,
  IoEye,
  IoGlobe,
  IoMap,
  IoMoon,
  IoSunny,
  IoSparkles,
  IoLockClosed,
} from 'react-icons/io5';
import type { Achievement, AchievementRarity } from '@/types/gamification';
import styles from './AchievementCard.module.css';

// Map icon names to components
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  IoRocket,
  IoSchool,
  IoBook,
  IoTrophy,
  IoStar,
  IoCheckmarkDone,
  IoFlame,
  IoLanguage,
  IoArrowUp,
  IoMedal,
  IoCheckmarkCircle,
  IoCalendar,
  IoEye,
  IoGlobe,
  IoMap,
  IoMoon,
  IoSunny,
  IoSparkles,
  IoLibrary: IoBook, // Fallback
};

// Rarity colors
const RARITY_COLORS: Record<AchievementRarity, string> = {
  common: '#9CA3AF',     // Gray
  rare: '#3B82F6',       // Blue
  epic: '#A855F7',       // Purple
  legendary: '#F59E0B',  // Gold/Orange
};

interface AchievementCardProps {
  achievement: Achievement;
  unlocked: boolean;
  progress?: number;
  unlockedAt?: string | null;
  compact?: boolean;
}

export default function AchievementCard({
  achievement,
  unlocked,
  progress,
  unlockedAt,
  compact = false,
}: AchievementCardProps) {
  const IconComponent = ICON_MAP[achievement.icon] || IoTrophy;
  const rarityColor = RARITY_COLORS[achievement.rarity];

  // Format unlock date
  const formattedDate = useMemo(() => {
    if (!unlockedAt) return null;
    const date = new Date(unlockedAt);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }, [unlockedAt]);

  // Hidden achievements show ??? when not unlocked
  const isSecret = achievement.hidden && !unlocked;

  if (compact) {
    return (
      <div
        className={`${styles.compactCard} ${unlocked ? styles.unlocked : styles.locked}`}
        style={{ '--rarity-color': rarityColor } as React.CSSProperties}
      >
        <div className={styles.compactIcon}>
          {unlocked ? (
            <IconComponent className={styles.icon} />
          ) : (
            <IoLockClosed className={styles.lockedIcon} />
          )}
        </div>
        <div className={styles.compactInfo}>
          <Text variant="label" className={styles.compactName}>
            {isSecret ? '???' : achievement.name}
          </Text>
        </div>
      </div>
    );
  }

  return (
    <Card
      variant="glass"
      className={`${styles.card} ${unlocked ? styles.unlocked : styles.locked}`}
      style={{ '--rarity-color': rarityColor } as React.CSSProperties}
    >
      <div className={styles.header}>
        <div className={styles.iconWrapper}>
          {unlocked ? (
            <IconComponent className={styles.icon} />
          ) : (
            <IoLockClosed className={styles.lockedIcon} />
          )}
        </div>
        <div className={styles.rarityBadge}>
          <Text variant="caption" className={styles.rarityText}>
            {achievement.rarity}
          </Text>
        </div>
      </div>

      <div className={styles.content}>
        <Text variant="h3" className={styles.name}>
          {isSecret ? '???' : achievement.name}
        </Text>
        <Text variant="body" color="muted" className={styles.description}>
          {isSecret ? 'Complete this secret achievement to reveal it' : achievement.description}
        </Text>

        {!unlocked && progress !== undefined && progress > 0 && (
          <div className={styles.progressContainer}>
            <div
              className={styles.progressBar}
              style={{ width: `${progress}%` }}
            />
            <Text variant="caption" color="muted" className={styles.progressText}>
              {progress}%
            </Text>
          </div>
        )}
      </div>

      <div className={styles.footer}>
        {unlocked ? (
          <>
            <div className={styles.xpBadge}>
              <IoSparkles className={styles.xpIcon} />
              <Text variant="caption">+{achievement.xpReward} XP</Text>
            </div>
            {formattedDate && (
              <Text variant="caption" color="muted">
                {formattedDate}
              </Text>
            )}
          </>
        ) : (
          <div className={styles.xpBadge}>
            <IoSparkles className={styles.xpIcon} />
            <Text variant="caption" color="muted">{achievement.xpReward} XP</Text>
          </div>
        )}
      </div>
    </Card>
  );
}
