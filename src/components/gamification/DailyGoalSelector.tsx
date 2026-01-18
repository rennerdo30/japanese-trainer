'use client';

import { useState } from 'react';
import { Text, Button, Card } from '@/components/ui';
import { IoFlash, IoCheckmark } from 'react-icons/io5';
import styles from './DailyGoalSelector.module.css';

interface GoalOption {
  type: 'xp' | 'lessons' | 'time';
  target: number;
  label: string;
  description: string;
}

const GOAL_OPTIONS: GoalOption[] = [
  { type: 'xp', target: 50, label: 'Casual', description: '50 XP per day' },
  { type: 'xp', target: 100, label: 'Regular', description: '100 XP per day' },
  { type: 'xp', target: 200, label: 'Serious', description: '200 XP per day' },
  { type: 'xp', target: 300, label: 'Intense', description: '300 XP per day' },
];

interface DailyGoalSelectorProps {
  currentGoalType?: 'xp' | 'lessons' | 'time';
  currentTarget?: number;
  onSelect: (goalType: 'xp' | 'lessons' | 'time', target: number) => void;
  compact?: boolean;
}

export default function DailyGoalSelector({
  currentGoalType = 'xp',
  currentTarget = 50,
  onSelect,
  compact = false,
}: DailyGoalSelectorProps) {
  const [selectedOption, setSelectedOption] = useState<GoalOption | null>(
    GOAL_OPTIONS.find((o) => o.type === currentGoalType && o.target === currentTarget) || null
  );
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSelect = (option: GoalOption) => {
    setSelectedOption(option);
    if (!compact) {
      setShowConfirm(true);
    }
  };

  const handleConfirm = () => {
    if (selectedOption) {
      onSelect(selectedOption.type, selectedOption.target);
      setShowConfirm(false);
    }
  };

  if (compact) {
    return (
      <div className={styles.compactContainer}>
        <div className={styles.compactOptions}>
          {GOAL_OPTIONS.map((option) => {
            const isSelected = selectedOption?.target === option.target;
            return (
              <button
                key={`${option.type}-${option.target}`}
                className={`${styles.compactOption} ${isSelected ? styles.selected : ''}`}
                onClick={() => {
                  setSelectedOption(option);
                  onSelect(option.type, option.target);
                }}
              >
                <Text variant="caption" className={styles.compactLabel}>
                  {option.label}
                </Text>
                <Text variant="label" className={styles.compactTarget}>
                  {option.target}
                </Text>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <IoFlash className={styles.headerIcon} />
        <Text variant="h3">Set Your Daily Goal</Text>
      </div>

      <Text variant="body" color="muted" className={styles.subtitle}>
        Choose how much you want to learn each day
      </Text>

      <div className={styles.options}>
        {GOAL_OPTIONS.map((option) => {
          const isSelected = selectedOption?.target === option.target;
          const isCurrent = currentTarget === option.target && currentGoalType === option.type;
          return (
            <Card
              key={`${option.type}-${option.target}`}
              variant={isSelected ? 'elevated' : 'glass'}
              className={`${styles.optionCard} ${isSelected ? styles.selected : ''}`}
              onClick={() => handleSelect(option)}
            >
              <div className={styles.optionContent}>
                <div className={styles.optionMain}>
                  <Text variant="h3" className={styles.optionLabel}>
                    {option.label}
                  </Text>
                  <Text variant="body" color="muted">
                    {option.description}
                  </Text>
                </div>
                {isCurrent && (
                  <div className={styles.currentBadge}>
                    <IoCheckmark />
                    <Text variant="caption">Current</Text>
                  </div>
                )}
              </div>
              {isSelected && !isCurrent && (
                <div className={styles.selectedIndicator}>
                  <IoCheckmark />
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {showConfirm && selectedOption && (
        <div className={styles.confirmSection}>
          <Text variant="body">
            Change your daily goal to <strong>{selectedOption.target} XP</strong>?
          </Text>
          <div className={styles.confirmButtons}>
            <Button variant="ghost" onClick={() => setShowConfirm(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleConfirm}>
              Confirm
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
