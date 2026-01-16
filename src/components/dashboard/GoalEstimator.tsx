'use client';

import { useState, useMemo } from 'react';
import { Card, Text, Button } from '@/components/ui';
import { useRecommendations } from '@/hooks/useRecommendations';
import { IoFlag, IoTime, IoTrendingUp, IoCheckmarkCircle } from 'react-icons/io5';
import styles from './GoalEstimator.module.css';

interface GoalEstimatorProps {
  className?: string;
}

const GOALS = [
  { id: 'n5', name: 'JLPT N5', level: 'N5', estimatedHours: 80, items: 800 },
  { id: 'n4', name: 'JLPT N4', level: 'N4', estimatedHours: 160, items: 1500 },
  { id: 'n3', name: 'JLPT N3', level: 'N3', estimatedHours: 300, items: 3500 },
  { id: 'n2', name: 'JLPT N2', level: 'N2', estimatedHours: 500, items: 6000 },
  { id: 'n1', name: 'JLPT N1', level: 'N1', estimatedHours: 800, items: 10000 },
];

export default function GoalEstimator({ className }: GoalEstimatorProps) {
  const { jlptProgress, stats, adaptiveRecommendations } = useRecommendations();
  const [selectedGoal, setSelectedGoal] = useState(GOALS[0]);

  // Calculate estimated days to reach goal
  const estimate = useMemo(() => {
    const currentProgress = jlptProgress?.percentComplete || 0;
    const dailyMinutes = adaptiveRecommendations?.dailyGoalMinutes || 30;
    const dailyHours = dailyMinutes / 60;

    const goalData = selectedGoal;
    const remainingHours = goalData.estimatedHours * (1 - currentProgress / 100);
    const daysNeeded = Math.ceil(remainingHours / dailyHours);

    // Calculate milestones
    const milestones = [
      { percent: 25, name: 'Beginner', reached: currentProgress >= 25 },
      { percent: 50, name: 'Intermediate', reached: currentProgress >= 50 },
      { percent: 75, name: 'Advanced', reached: currentProgress >= 75 },
      { percent: 100, name: 'Master', reached: currentProgress >= 100 },
    ];

    // Estimate dates
    const today = new Date();
    const completionDate = new Date(today);
    completionDate.setDate(today.getDate() + daysNeeded);

    return {
      currentProgress,
      daysNeeded,
      dailyMinutes,
      completionDate,
      remainingHours: Math.round(remainingHours),
      totalItems: goalData.items,
      learnedItems: stats?.totalItemsLearned || 0,
      milestones,
    };
  }, [selectedGoal, jlptProgress, stats, adaptiveRecommendations]);

  // Format date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Card variant="glass" className={`${styles.estimator} ${className || ''}`}>
      <div className={styles.header}>
        <IoFlag className={styles.headerIcon} />
        <Text variant="h3">Goal Estimator</Text>
      </div>

      {/* Goal Selector */}
      <div className={styles.goalSelector}>
        {GOALS.map((goal) => (
          <button
            key={goal.id}
            className={`${styles.goalButton} ${selectedGoal.id === goal.id ? styles.active : ''}`}
            onClick={() => setSelectedGoal(goal)}
          >
            {goal.level}
          </button>
        ))}
      </div>

      {/* Progress Ring */}
      <div className={styles.progressContainer}>
        <svg viewBox="0 0 100 100" className={styles.progressRing}>
          <circle cx="50" cy="50" r="40" className={styles.ringBackground} />
          <circle
            cx="50"
            cy="50"
            r="40"
            className={styles.ringProgress}
            style={{
              strokeDasharray: `${(estimate.currentProgress / 100) * 251.2} 251.2`,
            }}
          />
        </svg>
        <div className={styles.progressContent}>
          <Text variant="h2" color="gold">{Math.round(estimate.currentProgress)}%</Text>
          <Text variant="caption" color="muted">to {selectedGoal.level}</Text>
        </div>
      </div>

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        <div className={styles.stat}>
          <IoTime className={styles.statIcon} />
          <div className={styles.statContent}>
            <Text variant="h3">{estimate.daysNeeded}</Text>
            <Text variant="label" color="muted">days left</Text>
          </div>
        </div>
        <div className={styles.stat}>
          <IoTrendingUp className={styles.statIcon} />
          <div className={styles.statContent}>
            <Text variant="h3">{estimate.dailyMinutes}</Text>
            <Text variant="label" color="muted">min/day</Text>
          </div>
        </div>
        <div className={styles.stat}>
          <IoFlag className={styles.statIcon} />
          <div className={styles.statContent}>
            <Text variant="h3">{estimate.remainingHours}</Text>
            <Text variant="label" color="muted">hours left</Text>
          </div>
        </div>
      </div>

      {/* Estimated Completion */}
      <div className={styles.completion}>
        <Text variant="label" color="muted">Estimated Completion</Text>
        <Text variant="h3" color="gold">{formatDate(estimate.completionDate)}</Text>
        <Text variant="caption" color="muted">
          At {estimate.dailyMinutes} min/day
        </Text>
      </div>

      {/* Milestones */}
      <div className={styles.milestones}>
        <Text variant="label" color="muted" className={styles.milestonesLabel}>
          Milestones
        </Text>
        <div className={styles.milestoneList}>
          {estimate.milestones.map((milestone) => (
            <div
              key={milestone.percent}
              className={`${styles.milestone} ${milestone.reached ? styles.reached : ''}`}
            >
              <div className={styles.milestoneIcon}>
                {milestone.reached ? <IoCheckmarkCircle /> : <span>{milestone.percent}%</span>}
              </div>
              <span className={styles.milestoneName}>{milestone.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Items Progress */}
      <div className={styles.itemsProgress}>
        <div className={styles.itemsBar}>
          <div
            className={styles.itemsBarFill}
            style={{
              width: `${Math.min(100, (estimate.learnedItems / estimate.totalItems) * 100)}%`,
            }}
          />
        </div>
        <Text variant="caption" color="muted">
          {estimate.learnedItems} / {estimate.totalItems} items learned
        </Text>
      </div>
    </Card>
  );
}
