'use client';

import React from 'react';
import styles from './PlacementResults.module.css';
import type { AssessmentResult, SectionScore } from '@/types/assessment';

interface PlacementResultsProps {
  result: AssessmentResult;
  onStartLearning: (path: string) => void;
  onRetake: () => void;
}

const LEVEL_INFO: Record<string, { name: string; description: string; color: string }> = {
  N5: {
    name: 'Beginner (N5)',
    description: 'Start with the basics - hiragana, katakana, and fundamental grammar',
    color: '#4ADE80',
  },
  N4: {
    name: 'Elementary (N4)',
    description: 'Build on basics with more vocabulary and intermediate grammar patterns',
    color: '#60A5FA',
  },
  N3: {
    name: 'Intermediate (N3)',
    description: 'Expand to complex grammar, kanji, and natural conversation',
    color: '#A855F7',
  },
  N2: {
    name: 'Advanced (N2)',
    description: 'Master nuanced expressions and prepare for fluency',
    color: '#F59E0B',
  },
  N1: {
    name: 'Expert (N1)',
    description: 'Refine your skills with native-level content',
    color: '#EF4444',
  },
};

const SKILL_NAMES: Record<string, string> = {
  vocabulary: 'Vocabulary',
  grammar: 'Grammar',
  reading: 'Reading',
  listening: 'Listening',
};

export default function PlacementResults({
  result,
  onStartLearning,
  onRetake,
}: PlacementResultsProps) {
  const levelInfo = LEVEL_INFO[result.recommendedLevel] ?? LEVEL_INFO.N5;

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#4ADE80';
    if (score >= 60) return '#60A5FA';
    if (score >= 40) return '#F59E0B';
    return '#EF4444';
  };

  return (
    <div className={styles.container}>
      {/* Celebration */}
      <div className={styles.celebration}>
        <div className={styles.celebrationIcon}>&#127881;</div>
        <h1>Test Complete!</h1>
        <p>Here are your results</p>
      </div>

      {/* Overall Score */}
      <div className={styles.scoreCard}>
        <div
          className={styles.scoreCircle}
          style={{
            background: `conic-gradient(${getScoreColor(result.totalScore)} ${result.totalScore}%, rgba(255,255,255,0.1) 0)`,
          }}
        >
          <div className={styles.scoreInner}>
            <span className={styles.scoreNumber}>{result.totalScore}</span>
            <span className={styles.scorePercent}>%</span>
          </div>
        </div>
        <div className={styles.scoreLabel}>Overall Score</div>
      </div>

      {/* Section Scores */}
      <div className={styles.sectionScores}>
        <h3>Skills Breakdown</h3>
        <div className={styles.skillBars}>
          {Object.entries(result.sectionScores).map(([skill, scoreData]: [string, SectionScore]) => (
            <div key={skill} className={styles.skillBar}>
              <div className={styles.skillInfo}>
                <span className={styles.skillName}>
                  {SKILL_NAMES[skill] ?? skill}
                </span>
                <span className={styles.skillScore}>{scoreData.percent}%</span>
              </div>
              <div className={styles.barContainer}>
                <div
                  className={styles.barFill}
                  style={{
                    width: `${scoreData.percent}%`,
                    backgroundColor: getScoreColor(scoreData.percent),
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommended Level */}
      <div
        className={styles.recommendationCard}
        style={{ borderColor: levelInfo.color }}
      >
        <div className={styles.recommendationHeader}>
          <span className={styles.recommendationIcon}>&#127919;</span>
          <h3>Your Recommended Level</h3>
        </div>
        <div
          className={styles.levelBadge}
          style={{ backgroundColor: `${levelInfo.color}20`, color: levelInfo.color }}
        >
          {levelInfo.name}
        </div>
        <p className={styles.levelDescription}>{levelInfo.description}</p>
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        <button
          className={styles.startButton}
          onClick={() => onStartLearning(result.recommendedPath)}
        >
          Start Learning at {result.recommendedLevel}
        </button>
        <button className={styles.retakeButton} onClick={onRetake}>
          Retake Test
        </button>
      </div>

      {/* Tips */}
      <div className={styles.tips}>
        <h4>Tips for Success</h4>
        <ul>
          <li>Practice daily, even if just for 10-15 minutes</li>
          <li>Review vocabulary using spaced repetition</li>
          <li>Listen to native content at your level</li>
          <li>Don&apos;t skip the writing practice!</li>
        </ul>
      </div>
    </div>
  );
}
