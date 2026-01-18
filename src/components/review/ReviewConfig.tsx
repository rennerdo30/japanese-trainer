'use client';

import { useState, useCallback } from 'react';
import { Card, Text, Button } from '@/components/ui';
import { IoBook, IoSchool, IoDocumentText, IoPlay, IoSettings } from 'react-icons/io5';
import styles from './ReviewConfig.module.css';

export type ReviewModuleType = 'vocabulary' | 'kanji' | 'grammar';

interface ReviewConfigProps {
  dueItems: {
    vocabulary: number;
    kanji: number;
    grammar: number;
    total: number;
  };
  onStart: (config: {
    modules: ReviewModuleType[];
    itemCount: number;
  }) => void;
  maxItems?: number;
}

const moduleOptions: Array<{
  value: ReviewModuleType;
  label: string;
  icon: typeof IoBook;
}> = [
  { value: 'vocabulary', label: 'Vocabulary', icon: IoBook },
  { value: 'kanji', label: 'Characters', icon: IoSchool },
  { value: 'grammar', label: 'Grammar', icon: IoDocumentText },
];

const itemCountOptions = [5, 10, 20, 50];

export default function ReviewConfig({
  dueItems,
  onStart,
  maxItems = 50,
}: ReviewConfigProps) {
  const [selectedModules, setSelectedModules] = useState<ReviewModuleType[]>(['vocabulary', 'kanji', 'grammar']);
  const [itemCount, setItemCount] = useState(20);

  const toggleModule = useCallback((module: ReviewModuleType) => {
    setSelectedModules((prev) => {
      if (prev.includes(module)) {
        if (prev.length === 1) return prev;
        return prev.filter((m) => m !== module);
      }
      return [...prev, module];
    });
  }, []);

  const availableItems = selectedModules.reduce(
    (sum, module) => sum + dueItems[module],
    0
  );

  const effectiveItemCount = Math.min(itemCount, availableItems, maxItems);

  const handleStart = useCallback(() => {
    if (effectiveItemCount > 0) {
      onStart({
        modules: selectedModules,
        itemCount: effectiveItemCount,
      });
    }
  }, [selectedModules, effectiveItemCount, onStart]);

  return (
    <Card variant="glass" className={styles.container}>
      <div className={styles.header}>
        <IoSettings className={styles.headerIcon} />
        <Text variant="h2">Review Session</Text>
      </div>

      <div className={styles.section}>
        <Text variant="label" color="muted" className={styles.sectionLabel}>
          Select Modules
        </Text>
        <div className={styles.moduleGrid}>
          {moduleOptions.map((option) => {
            const ModuleIcon = option.icon;
            const count = dueItems[option.value];
            const isSelected = selectedModules.includes(option.value);
            const isDisabled = count === 0;

            return (
              <button
                key={option.value}
                onClick={() => toggleModule(option.value)}
                disabled={isDisabled}
                className={`${styles.moduleButton} ${isSelected ? styles.selected : ''} ${isDisabled ? styles.disabled : ''}`}
              >
                <ModuleIcon className={styles.moduleIcon} />
                <span className={styles.moduleLabel}>{option.label}</span>
                <span className={styles.moduleCount}>
                  {count} due
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.section}>
        <Text variant="label" color="muted" className={styles.sectionLabel}>
          Number of Items
        </Text>
        <div className={styles.countOptions}>
          {itemCountOptions.map((count) => (
            <button
              key={count}
              onClick={() => setItemCount(count)}
              className={`${styles.countButton} ${itemCount === count ? styles.selected : ''}`}
              disabled={count > availableItems}
            >
              {count}
            </button>
          ))}
        </div>
        {availableItems < itemCount && availableItems > 0 && (
          <Text variant="caption" color="muted" className={styles.availableNote}>
            Only {availableItems} items available
          </Text>
        )}
      </div>

      <div className={styles.summary}>
        <div className={styles.summaryRow}>
          <Text color="muted">Selected modules:</Text>
          <Text>{selectedModules.length}</Text>
        </div>
        <div className={styles.summaryRow}>
          <Text color="muted">Items to review:</Text>
          <Text color="gold">{effectiveItemCount}</Text>
        </div>
      </div>

      <Button
        onClick={handleStart}
        size="lg"
        fullWidth
        disabled={effectiveItemCount === 0}
        className={styles.startButton}
      >
        <IoPlay /> Start Review
      </Button>

      {dueItems.total === 0 && (
        <Text color="muted" className={styles.noItemsMessage}>
          No items due for review. Great job keeping up!
        </Text>
      )}
    </Card>
  );
}
