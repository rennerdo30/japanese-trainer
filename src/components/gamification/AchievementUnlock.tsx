'use client';

import { useEffect, useState } from 'react';
import { Text, Button } from '@/components/ui';
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
  IoClose,
} from 'react-icons/io5';
import type { Achievement, AchievementRarity } from '@/types/gamification';
import styles from './AchievementUnlock.module.css';

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
  IoLibrary: IoBook,
};

// Rarity colors
const RARITY_COLORS: Record<AchievementRarity, string> = {
  common: '#9CA3AF',
  rare: '#3B82F6',
  epic: '#A855F7',
  legendary: '#F59E0B',
};

interface AchievementUnlockProps {
  achievement: Achievement;
  onClose: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

export default function AchievementUnlock({
  achievement,
  onClose,
  autoClose = true,
  autoCloseDelay = 5000,
}: AchievementUnlockProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const IconComponent = ICON_MAP[achievement.icon] || IoTrophy;
  const rarityColor = RARITY_COLORS[achievement.rarity];

  useEffect(() => {
    // Animate in
    const showTimer = setTimeout(() => setIsVisible(true), 50);

    // Auto close
    let closeTimer: ReturnType<typeof setTimeout>;
    if (autoClose) {
      closeTimer = setTimeout(() => {
        handleClose();
      }, autoCloseDelay);
    }

    return () => {
      clearTimeout(showTimer);
      if (closeTimer) clearTimeout(closeTimer);
    };
  }, [autoClose, autoCloseDelay]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  return (
    <div
      className={`${styles.overlay} ${isVisible ? styles.visible : ''} ${isExiting ? styles.exiting : ''}`}
      onClick={handleClose}
    >
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        style={{ '--rarity-color': rarityColor } as React.CSSProperties}
      >
        <button className={styles.closeButton} onClick={handleClose} aria-label="Close">
          <IoClose />
        </button>

        <div className={styles.celebration}>
          <div className={styles.sparkles}>
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className={styles.sparkle}
                style={{
                  '--delay': `${i * 0.1}s`,
                  '--rotation': `${i * 30}deg`,
                } as React.CSSProperties}
              />
            ))}
          </div>
        </div>

        <div className={styles.content}>
          <Text variant="label" color="muted" className={styles.label}>
            Achievement Unlocked!
          </Text>

          <div className={styles.iconWrapper}>
            <IconComponent className={styles.icon} />
          </div>

          <Text variant="h2" className={styles.name}>
            {achievement.name}
          </Text>

          <Text variant="body" color="muted" className={styles.description}>
            {achievement.description}
          </Text>

          <div className={styles.xpReward}>
            <IoSparkles className={styles.xpIcon} />
            <Text variant="h3" className={styles.xpAmount}>
              +{achievement.xpReward} XP
            </Text>
          </div>

          <div className={styles.rarityBadge}>
            <Text variant="caption" className={styles.rarityText}>
              {achievement.rarity}
            </Text>
          </div>
        </div>

        <Button onClick={handleClose} className={styles.continueButton}>
          Continue
        </Button>
      </div>
    </div>
  );
}
