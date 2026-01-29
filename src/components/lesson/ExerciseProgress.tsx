'use client';

import React from 'react';
import styles from './ExerciseProgress.module.css';

export type CognitiveLevel = 'recognition' | 'supported' | 'guided' | 'independent';
export type SkillFocus = 'reading' | 'writing' | 'listening' | 'speaking' | 'grammar';

interface ExerciseProgressProps {
  currentIndex: number;
  totalExercises: number;
  currentCognitiveLevel?: CognitiveLevel;
  currentSkillFocus?: SkillFocus;
  correctCount: number;
  showDetailedProgress?: boolean;
}

const COGNITIVE_LABELS: Record<CognitiveLevel, string> = {
  recognition: 'Recognition',
  supported: 'Supported',
  guided: 'Guided',
  independent: 'Independent',
};

const COGNITIVE_DESCRIPTIONS: Record<CognitiveLevel, string> = {
  recognition: 'Identify and recognize',
  supported: 'Practice with support',
  guided: 'Apply with guidance',
  independent: 'Use independently',
};

const SKILL_LABELS: Record<SkillFocus, string> = {
  reading: 'Reading',
  writing: 'Writing',
  listening: 'Listening',
  speaking: 'Speaking',
  grammar: 'Grammar',
};

const SKILL_ICONS: Record<SkillFocus, string> = {
  reading: '📖',
  writing: '✍️',
  listening: '👂',
  speaking: '🗣️',
  grammar: '📝',
};

export function ExerciseProgress({
  currentIndex,
  totalExercises,
  currentCognitiveLevel,
  currentSkillFocus,
  correctCount,
  showDetailedProgress = false,
}: ExerciseProgressProps) {
  const progress = ((currentIndex + 1) / totalExercises) * 100;
  const accuracy = currentIndex > 0 ? Math.round((correctCount / currentIndex) * 100) : 0;

  return (
    <div className={styles.container}>
      {/* Main progress bar */}
      <div className={styles.progressBarContainer}>
        <div className={styles.progressBar} style={{ width: `${progress}%` }} />
      </div>

      {/* Progress text */}
      <div className={styles.progressInfo}>
        <span className={styles.progressText}>
          {currentIndex + 1} / {totalExercises}
        </span>
        {currentIndex > 0 && (
          <span className={styles.accuracyText}>
            {correctCount} correct ({accuracy}%)
          </span>
        )}
      </div>

      {/* Detailed progress (cognitive level and skill focus) */}
      {showDetailedProgress && (currentCognitiveLevel || currentSkillFocus) && (
        <div className={styles.detailedProgress}>
          {currentCognitiveLevel && (
            <div className={styles.levelIndicator}>
              <span className={styles.levelLabel}>Level:</span>
              <span className={`${styles.levelBadge} ${styles[currentCognitiveLevel]}`}>
                {COGNITIVE_LABELS[currentCognitiveLevel]}
              </span>
              <span className={styles.levelDescription}>
                {COGNITIVE_DESCRIPTIONS[currentCognitiveLevel]}
              </span>
            </div>
          )}

          {currentSkillFocus && (
            <div className={styles.skillIndicator}>
              <span className={styles.skillIcon}>{SKILL_ICONS[currentSkillFocus]}</span>
              <span className={styles.skillLabel}>{SKILL_LABELS[currentSkillFocus]}</span>
            </div>
          )}
        </div>
      )}

      {/* Cognitive progression indicator */}
      {showDetailedProgress && currentCognitiveLevel && (
        <div className={styles.cognitiveProgress}>
          {(['recognition', 'supported', 'guided', 'independent'] as CognitiveLevel[]).map(
            (level, index) => (
              <div
                key={level}
                className={`${styles.cognitiveStep} ${
                  currentCognitiveLevel === level ? styles.active : ''
                } ${
                  ['recognition', 'supported', 'guided', 'independent'].indexOf(
                    currentCognitiveLevel
                  ) > index
                    ? styles.completed
                    : ''
                }`}
              >
                <div className={styles.stepDot} />
                <span className={styles.stepLabel}>{COGNITIVE_LABELS[level]}</span>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

export default ExerciseProgress;
