'use client';

import { useCallback, useMemo } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { getLevelFromXP, getXPForAction, XP_CONFIG } from '@/lib/xp';
import { getStreakMilestones } from '@/lib/streak';
import type {
  GamificationState,
  UserLevel,
  StreakData,
  DailyGoal,
  XPSource,
  LevelUpEvent,
  StreakMilestone,
} from '@/types/gamification';

interface UseGamificationReturn {
  // State
  state: GamificationState | null;
  isLoading: boolean;

  // Computed values
  level: UserLevel | null;
  streak: StreakData | null;
  dailyGoal: DailyGoal | null;
  todayXP: number;

  // Level progress (0-100)
  levelProgress: number;

  // Streak milestones
  streakMilestones: StreakMilestone[];

  // Actions
  awardXP: (
    amount: number,
    source: XPSource
  ) => Promise<{
    xpAwarded: number;
    leveledUp: boolean;
    newLevel?: number;
    dailyGoalCompleted: boolean;
  }>;

  // Helper to calculate XP for actions
  calculateXP: (
    action: 'lesson_complete' | 'lesson_perfect' | 'review_correct',
    context?: { streakDays?: number }
  ) => number;

  // Daily goal
  updateDailyGoal: (goalType: 'xp' | 'lessons' | 'time', target: number) => Promise<void>;
  isDailyGoalComplete: boolean;
  dailyGoalProgress: number;
}

export function useGamification(): UseGamificationReturn {
  // Query gamification state from Convex
  const convexState = useQuery(api.gamification.getGamificationState);

  // Mutations
  const awardXPMutation = useMutation(api.gamification.awardXP);
  const updateDailyGoalMutation = useMutation(api.gamification.updateDailyGoal);
  const initializeMutation = useMutation(api.gamification.initializeGamification);

  // Build state object
  const state = useMemo((): GamificationState | null => {
    if (!convexState) return null;

    const levelInfo = getLevelFromXP(convexState.totalXP);

    return {
      level: {
        level: levelInfo.level,
        currentXP: levelInfo.currentXP,
        xpToNextLevel: levelInfo.xpToNextLevel,
        totalXP: convexState.totalXP,
      },
      streak: {
        currentStreak: convexState.currentStreak,
        longestStreak: convexState.longestStreak,
        lastActiveDate: convexState.lastActiveDate,
      },
      dailyGoal: {
        type: convexState.dailyGoalType as 'xp' | 'lessons' | 'time',
        target: convexState.dailyGoalTarget,
        current: convexState.dailyGoalProgress,
        completed: convexState.dailyGoalProgress >= convexState.dailyGoalTarget,
      },
      todayXP: convexState.todayXP,
    };
  }, [convexState]);

  // Extract individual parts for convenience
  const level = state?.level ?? null;
  const streak = state?.streak ?? null;
  const dailyGoal = state?.dailyGoal ?? null;
  const todayXP = state?.todayXP ?? 0;

  // Level progress percentage
  const levelProgress = useMemo(() => {
    if (!level) return 0;
    if (level.xpToNextLevel === 0) return 100;
    return Math.round((level.currentXP / level.xpToNextLevel) * 100);
  }, [level]);

  // Streak milestones
  const streakMilestones = useMemo(() => {
    const currentStreak = streak?.currentStreak ?? 0;
    return getStreakMilestones(currentStreak);
  }, [streak]);

  // Daily goal helpers
  const isDailyGoalComplete = dailyGoal?.completed ?? false;
  const dailyGoalProgress = useMemo(() => {
    if (!dailyGoal) return 0;
    if (dailyGoal.target === 0) return 100;
    return Math.min(100, Math.round((dailyGoal.current / dailyGoal.target) * 100));
  }, [dailyGoal]);

  // Award XP action
  const awardXP = useCallback(
    async (amount: number, source: XPSource) => {
      // Initialize if needed
      if (!convexState) {
        await initializeMutation();
      }

      const result = await awardXPMutation({ amount, source });

      return {
        xpAwarded: result.xpAwarded,
        leveledUp: result.leveledUp,
        newLevel: result.leveledUp ? result.newLevel : undefined,
        dailyGoalCompleted: result.dailyGoalCompleted,
      };
    },
    [convexState, initializeMutation, awardXPMutation]
  );

  // Calculate XP helper
  const calculateXP = useCallback(
    (
      action: 'lesson_complete' | 'lesson_perfect' | 'review_correct',
      context?: { streakDays?: number }
    ) => {
      return getXPForAction(action, context);
    },
    []
  );

  // Update daily goal
  const updateDailyGoal = useCallback(
    async (goalType: 'xp' | 'lessons' | 'time', target: number) => {
      await updateDailyGoalMutation({ goalType, target });
    },
    [updateDailyGoalMutation]
  );

  return {
    state,
    isLoading: convexState === undefined,
    level,
    streak,
    dailyGoal,
    todayXP,
    levelProgress,
    streakMilestones,
    awardXP,
    calculateXP,
    updateDailyGoal,
    isDailyGoalComplete,
    dailyGoalProgress,
  };
}

export default useGamification;
