'use client';

import { Card, Text } from '@/components/ui';
import { IoStar, IoTrendingUp } from 'react-icons/io5';
import { useLanguage } from '@/context/LanguageProvider';
import { getLevelDisplayName, getLevelTierColor } from '@/lib/xp';
import type { UserLevel } from '@/types/gamification';
import styles from './XPDisplay.module.css';

interface XPDisplayProps {
  level: UserLevel | null;
  showProgress?: boolean;
  compact?: boolean;
}

export default function XPDisplay({
  level,
  showProgress = true,
  compact = false,
}: XPDisplayProps) {
  const { t } = useLanguage();

  if (!level) {
    return null;
  }

  const progressPercent = level.xpToNextLevel > 0
    ? Math.round((level.currentXP / level.xpToNextLevel) * 100)
    : 100;

  const tierColor = getLevelTierColor(level.level);
  const tierName = getLevelDisplayName(level.level);

  if (compact) {
    return (
      <div className={`${styles.compactContainer} ${styles[tierColor]}`}>
        <div className={styles.levelBadgeSmall}>
          <IoStar className={styles.starIcon} />
          <Text variant="h3">{level.level}</Text>
        </div>
        <Text variant="caption" color="muted">
          {level.currentXP} / {level.xpToNextLevel} XP
        </Text>
      </div>
    );
  }

  return (
    <Card variant="glass" className={`${styles.card} ${styles[tierColor]}`}>
      {/* Level Badge */}
      <div className={styles.levelSection}>
        <div className={styles.levelBadge}>
          <IoStar className={styles.starIcon} />
          <Text variant="h1" className={styles.levelNumber}>
            {level.level}
          </Text>
        </div>
        <div className={styles.levelInfo}>
          <Text variant="h3">{tierName}</Text>
          <Text variant="caption" color="muted">
            {t('gamification.xp.totalXP', { xp: level.totalXP.toLocaleString() })}
          </Text>
        </div>
      </div>

      {/* Progress Bar */}
      {showProgress && (
        <div className={styles.progressSection}>
          <div className={styles.progressHeader}>
            <Text variant="caption" color="muted">
              {t('gamification.xp.progressToLevel', { level: level.level + 1 })}
            </Text>
            <Text variant="caption">
              {level.currentXP} / {level.xpToNextLevel} XP
            </Text>
          </div>

          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className={styles.xpNeeded}>
            <IoTrendingUp className={styles.trendIcon} />
            <Text variant="caption" color="muted">
              {t('gamification.xp.toNextLevel', { xp: level.xpToNextLevel - level.currentXP })}
            </Text>
          </div>
        </div>
      )}
    </Card>
  );
}
