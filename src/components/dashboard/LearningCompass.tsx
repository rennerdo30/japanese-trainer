'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Card, Text, Button } from '@/components/ui';
import { useRecommendations } from '@/hooks/useRecommendations';
import { useTargetLanguage } from '@/hooks/useTargetLanguage';
import { IoCompass, IoPlay, IoTime, IoSparkles } from 'react-icons/io5';
import styles from './LearningCompass.module.css';
import type { ModuleName } from '@/lib/prerequisites';

interface LearningCompassProps {
  className?: string;
}

export default function LearningCompass({ className }: LearningCompassProps) {
  const { stats, topRecommendation, reviewQueue, isLoading } = useRecommendations();
  const { isModuleEnabled, targetLanguage } = useTargetLanguage();

  // Calculate radar chart points - filtered by enabled modules for current language
  const radarData = useMemo(() => {
    if (!stats) return [];

    // All possible modules with display names
    const allModules: Array<{ name: string; key: ModuleName }> = [
      { name: 'Alphabet', key: 'alphabet' },
      { name: 'Vocab', key: 'vocabulary' },
      { name: 'Kanji', key: 'kanji' },
      { name: 'Grammar', key: 'grammar' },
      { name: 'Reading', key: 'reading' },
      { name: 'Listening', key: 'listening' },
    ];

    // Filter to only enabled modules for current target language
    const modules = allModules.filter(mod => isModuleEnabled(mod.key));

    return modules.map((mod, index) => {
      const strength = (stats.moduleStrengths[mod.key] || 0) * 100;
      // Recalculate angles based on actual number of enabled modules
      const angle = (index * 360) / modules.length - 90;
      const radian = (angle * Math.PI) / 180;
      const radius = (strength / 100) * 40; // Max radius 40 (out of 50)

      return {
        name: mod.name,
        strength: Math.round(strength),
        x: 50 + radius * Math.cos(radian),
        y: 50 + radius * Math.sin(radian),
        labelX: 50 + 48 * Math.cos(radian),
        labelY: 50 + 48 * Math.sin(radian),
      };
    });
  }, [stats, isModuleEnabled, targetLanguage]);

  // Generate polygon points string
  const polygonPoints = radarData.map((d) => `${d.x},${d.y}`).join(' ');

  if (isLoading) {
    return (
      <Card variant="glass" className={`${styles.compass} ${className || ''}`}>
        <div className={styles.loading}>
          <IoCompass className={styles.loadingIcon} />
          <Text color="muted">Loading...</Text>
        </div>
      </Card>
    );
  }

  return (
    <Card variant="glass" className={`${styles.compass} ${className || ''}`}>
      <div className={styles.header}>
        <IoCompass className={styles.headerIcon} />
        <Text variant="h3">Learning Compass</Text>
      </div>

      <div className={styles.content}>
        {/* Radar Chart */}
        <div className={styles.radarContainer}>
          <svg viewBox="0 0 100 100" className={styles.radar}>
            {/* Background circles */}
            <circle cx="50" cy="50" r="40" className={styles.radarGrid} />
            <circle cx="50" cy="50" r="30" className={styles.radarGrid} />
            <circle cx="50" cy="50" r="20" className={styles.radarGrid} />
            <circle cx="50" cy="50" r="10" className={styles.radarGrid} />

            {/* Grid lines */}
            {radarData.map((_, index) => {
              const angle = (index * 360) / radarData.length - 90;
              const radian = (angle * Math.PI) / 180;
              const x2 = 50 + 40 * Math.cos(radian);
              const y2 = 50 + 40 * Math.sin(radian);
              return (
                <line
                  key={index}
                  x1="50"
                  y1="50"
                  x2={x2}
                  y2={y2}
                  className={styles.radarGridLine}
                />
              );
            })}

            {/* Data polygon */}
            {radarData.length > 0 && (
              <polygon points={polygonPoints} className={styles.radarPolygon} />
            )}

            {/* Data points */}
            {radarData.map((d, index) => (
              <circle key={index} cx={d.x} cy={d.y} r="3" className={styles.radarPoint} />
            ))}
          </svg>

          {/* Labels */}
          {radarData.map((d, index) => (
            <div
              key={index}
              className={styles.radarLabel}
              style={{
                left: `${d.labelX}%`,
                top: `${d.labelY}%`,
              }}
            >
              <span className={styles.labelName}>{d.name}</span>
              <span className={styles.labelValue}>{d.strength}%</span>
            </div>
          ))}
        </div>

        {/* Module List */}
        <div className={styles.moduleList}>
          {radarData.map((d, index) => (
            <div key={index} className={styles.moduleItem}>
              <span className={styles.moduleName}>{d.name}</span>
              <div className={styles.moduleBar}>
                <div
                  className={styles.moduleBarFill}
                  style={{ width: `${d.strength}%` }}
                />
              </div>
              <span className={styles.moduleValue}>{d.strength}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Next Action */}
      {topRecommendation && (
        <div className={styles.nextAction}>
          <div className={styles.nextActionHeader}>
            <IoSparkles className={styles.nextActionIcon} />
            <Text variant="label" color="muted">Next Up</Text>
          </div>
          <Text variant="body" className={styles.nextActionTitle}>
            {topRecommendation.title}
          </Text>
          {topRecommendation.estimatedMinutes && (
            <Text variant="caption" color="muted" className={styles.nextActionTime}>
              <IoTime /> {topRecommendation.estimatedMinutes} min
            </Text>
          )}
          <Link href={topRecommendation.action.target}>
            <Button size="sm" className={styles.nextActionButton}>
              <IoPlay /> Start
            </Button>
          </Link>
        </div>
      )}

      {/* Review Alert */}
      {reviewQueue && reviewQueue.total > 0 && (
        <Link href="/review" className={styles.reviewAlert}>
          <IoTime className={styles.reviewAlertIcon} />
          <span>{reviewQueue.total} reviews due</span>
        </Link>
      )}
    </Card>
  );
}
