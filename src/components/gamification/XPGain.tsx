'use client';

import { useEffect, useState } from 'react';
import { IoSparkles } from 'react-icons/io5';
import styles from './XPGain.module.css';

interface XPGainProps {
  amount: number;
  onComplete?: () => void;
  position?: 'center' | 'top' | 'bottom';
  size?: 'sm' | 'md' | 'lg';
}

export default function XPGain({
  amount,
  onComplete,
  position = 'center',
  size = 'md',
}: XPGainProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger animation
    const showTimer = setTimeout(() => setIsVisible(true), 50);

    // Start exit animation
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, 1500);

    // Complete and cleanup
    const completeTimer = setTimeout(() => {
      onComplete?.();
    }, 2000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={`
        ${styles.container}
        ${styles[position]}
        ${styles[size]}
        ${isVisible ? styles.visible : ''}
        ${isExiting ? styles.exiting : ''}
      `}
    >
      <div className={styles.badge}>
        <IoSparkles className={styles.icon} />
        <span className={styles.amount}>+{amount}</span>
        <span className={styles.label}>XP</span>
      </div>

      {/* Particle effects */}
      <div className={styles.particles}>
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className={styles.particle}
            style={{
              '--angle': `${i * 45}deg`,
              '--delay': `${i * 0.05}s`,
            } as React.CSSProperties}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Hook to manage XP gain animations
 */
export function useXPGain() {
  const [gains, setGains] = useState<Array<{ id: number; amount: number }>>([]);
  let nextId = 0;

  const showXPGain = (amount: number) => {
    const id = nextId++;
    setGains((prev) => [...prev, { id, amount }]);
  };

  const removeGain = (id: number) => {
    setGains((prev) => prev.filter((g) => g.id !== id));
  };

  const XPGainContainer = () => (
    <>
      {gains.map((gain) => (
        <XPGain
          key={gain.id}
          amount={gain.amount}
          onComplete={() => removeGain(gain.id)}
        />
      ))}
    </>
  );

  return { showXPGain, XPGainContainer };
}
