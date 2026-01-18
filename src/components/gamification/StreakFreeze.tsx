'use client';

import { useState } from 'react';
import { Text, Button, Card } from '@/components/ui';
import { IoSnow, IoShieldCheckmark, IoWarning } from 'react-icons/io5';
import styles from './StreakFreeze.module.css';

interface StreakFreezeProps {
  freezesAvailable: number;
  freezesUsed: number;
  maxFreezes?: number;
  currentStreak: number;
  streakAtRisk?: boolean;
  onUseFreeze?: () => void;
  onPurchaseFreeze?: () => void;
  compact?: boolean;
}

export default function StreakFreeze({
  freezesAvailable,
  freezesUsed,
  maxFreezes = 2,
  currentStreak,
  streakAtRisk = false,
  onUseFreeze,
  onPurchaseFreeze,
  compact = false,
}: StreakFreezeProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleUseFreeze = () => {
    if (freezesAvailable > 0) {
      setShowConfirm(true);
    }
  };

  const confirmUseFreeze = () => {
    onUseFreeze?.();
    setShowConfirm(false);
  };

  if (compact) {
    return (
      <div className={styles.compactContainer}>
        <div className={styles.compactFreezes}>
          {[...Array(maxFreezes)].map((_, idx) => (
            <div
              key={idx}
              className={`${styles.freezeIcon} ${idx < freezesAvailable ? styles.available : styles.used}`}
            >
              <IoSnow />
            </div>
          ))}
        </div>
        <Text variant="caption" color="muted">
          {freezesAvailable} freeze{freezesAvailable !== 1 ? 's' : ''} available
        </Text>
      </div>
    );
  }

  return (
    <Card variant="glass" className={styles.container}>
      <div className={styles.header}>
        <div className={styles.iconWrapper}>
          <IoSnow className={styles.icon} />
        </div>
        <div className={styles.headerText}>
          <Text variant="h3">Streak Freeze</Text>
          <Text variant="caption" color="muted">
            Protect your streak when life gets busy
          </Text>
        </div>
      </div>

      <div className={styles.freezeDisplay}>
        <div className={styles.freezeIcons}>
          {[...Array(maxFreezes)].map((_, idx) => (
            <div
              key={idx}
              className={`${styles.freezeIconLarge} ${idx < freezesAvailable ? styles.available : styles.used}`}
            >
              <IoSnow />
              {idx < freezesAvailable && <IoShieldCheckmark className={styles.shieldIcon} />}
            </div>
          ))}
        </div>
        <Text variant="body">
          <strong>{freezesAvailable}</strong> of {maxFreezes} freezes available
        </Text>
      </div>

      {streakAtRisk && freezesAvailable > 0 && (
        <div className={styles.warningSection}>
          <IoWarning className={styles.warningIcon} />
          <div className={styles.warningText}>
            <Text variant="body">
              Your {currentStreak}-day streak is at risk!
            </Text>
            <Text variant="caption" color="muted">
              Use a freeze to protect it
            </Text>
          </div>
        </div>
      )}

      <div className={styles.actions}>
        {freezesAvailable > 0 ? (
          <Button
            variant={streakAtRisk ? 'primary' : 'secondary'}
            onClick={handleUseFreeze}
            className={styles.useButton}
          >
            <IoSnow /> Use Freeze
          </Button>
        ) : (
          <Button
            variant="secondary"
            onClick={onPurchaseFreeze}
            className={styles.purchaseButton}
            disabled={freezesAvailable >= maxFreezes}
          >
            Get More Freezes
          </Button>
        )}
      </div>

      {showConfirm && (
        <div className={styles.confirmOverlay}>
          <Card variant="elevated" className={styles.confirmCard}>
            <Text variant="h3">Use Streak Freeze?</Text>
            <Text variant="body" color="muted">
              This will protect your streak for today if you don&apos;t complete your goal.
            </Text>
            <div className={styles.confirmButtons}>
              <Button variant="ghost" onClick={() => setShowConfirm(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={confirmUseFreeze}>
                <IoSnow /> Use Freeze
              </Button>
            </div>
          </Card>
        </div>
      )}

      <div className={styles.info}>
        <Text variant="caption" color="muted">
          Freezes reset weekly. Use them wisely!
        </Text>
      </div>
    </Card>
  );
}
