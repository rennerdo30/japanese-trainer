'use client';

import { useEffect, useState } from 'react';
import { Card, Text, Button } from '@/components/ui';
import { IoStar, IoClose, IoSparkles } from 'react-icons/io5';
import { getLevelDisplayName, getLevelTierColor } from '@/lib/xp';
import styles from './LevelUpModal.module.css';

interface LevelUpModalProps {
  previousLevel: number;
  newLevel: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function LevelUpModal({
  previousLevel,
  newLevel,
  isOpen,
  onClose,
}: LevelUpModalProps) {
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowAnimation(true);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const tierName = getLevelDisplayName(newLevel);
  const tierColor = getLevelTierColor(newLevel);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button className={styles.closeButton} onClick={onClose}>
          <IoClose />
        </button>

        {/* Confetti/sparkles animation */}
        <div className={styles.sparkles}>
          {[...Array(12)].map((_, i) => (
            <IoSparkles
              key={i}
              className={styles.sparkle}
              style={{
                '--delay': `${i * 0.1}s`,
                '--x': `${Math.random() * 200 - 100}px`,
                '--y': `${Math.random() * 200 - 100}px`,
              } as React.CSSProperties}
            />
          ))}
        </div>

        <Card variant="glass" className={`${styles.card} ${styles[tierColor]}`}>
          {/* Level transition animation */}
          <div className={styles.levelTransition}>
            <div className={styles.previousLevel}>
              <Text variant="h3" color="muted">{previousLevel}</Text>
            </div>
            <div className={styles.arrow}>→</div>
            <div className={`${styles.newLevel} ${showAnimation ? styles.animate : ''}`}>
              <IoStar className={styles.starIcon} />
              <Text variant="h1">{newLevel}</Text>
            </div>
          </div>

          {/* Message */}
          <div className={styles.message}>
            <Text variant="h2" color="gold">Level Up!</Text>
            <Text color="muted">
              You&apos;ve reached {tierName} level {newLevel}
            </Text>
          </div>

          {/* Continue button */}
          <Button onClick={onClose} className={styles.continueButton}>
            Continue
          </Button>
        </Card>
      </div>
    </div>
  );
}
