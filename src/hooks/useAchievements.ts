'use client';

import { useCallback, useMemo, useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type {
  Achievement,
  UserAchievement,
  AchievementCategory,
  AchievementUnlockEvent,
} from '@/types/gamification';

// Import achievements data
import achievementsData from '@/data/achievements.json';

interface UseAchievementsReturn {
  // All achievements
  achievements: Achievement[];

  // User's unlocked achievements
  unlockedAchievements: UserAchievement[];

  // Loading state
  isLoading: boolean;

  // Summary stats
  summary: {
    total: number;
    unlocked: number;
    percentComplete: number;
    totalXPEarned: number;
    byCategory: Record<AchievementCategory, { total: number; unlocked: number }>;
  };

  // Recent achievements
  recentAchievements: UserAchievement[];

  // Pending unlock notification
  pendingUnlock: AchievementUnlockEvent | null;
  clearPendingUnlock: () => void;

  // Check if achievement is unlocked
  isUnlocked: (achievementId: string) => boolean;

  // Get achievement progress
  getProgress: (achievementId: string) => number;

  // Get achievement by ID
  getAchievement: (achievementId: string) => Achievement | null;

  // Filter achievements
  filterByCategory: (category: AchievementCategory | 'all') => Achievement[];
  filterByStatus: (status: 'all' | 'unlocked' | 'locked') => Achievement[];

  // Unlock achievement (usually called internally)
  unlockAchievement: (achievementId: string) => Promise<{
    success: boolean;
    xpAwarded: number;
    alreadyUnlocked: boolean;
  }>;

  // Update progress for progressive achievements
  updateProgress: (achievementId: string, progress: number) => Promise<void>;
}

export function useAchievements(): UseAchievementsReturn {
  // Local state for pending unlock notification
  const [pendingUnlock, setPendingUnlock] = useState<AchievementUnlockEvent | null>(null);

  // Query user achievements from Convex
  const userAchievementsData = useQuery(api.achievements.getUserAchievements);
  const summaryData = useQuery(api.achievements.getAchievementSummary);
  const recentData = useQuery(api.achievements.getRecentAchievements, { limit: 5 });

  // Mutations
  const unlockMutation = useMutation(api.achievements.unlockAchievement);
  const updateProgressMutation = useMutation(api.achievements.updateAchievementProgress);

  // All achievements from static data
  const achievements = useMemo((): Achievement[] => {
    return (achievementsData as { achievements: Achievement[] }).achievements;
  }, []);

  // User's unlocked achievements
  const unlockedAchievements = useMemo((): UserAchievement[] => {
    if (!userAchievementsData) return [];
    return userAchievementsData.map((ua) => ({
      achievementId: ua.achievementId,
      unlockedAt: ua.unlockedAt ? new Date(ua.unlockedAt).toISOString() : null,
      progress: ua.progress,
    }));
  }, [userAchievementsData]);

  // Recent achievements
  const recentAchievements = useMemo((): UserAchievement[] => {
    if (!recentData) return [];
    return recentData.map((ua) => ({
      achievementId: ua.achievementId,
      unlockedAt: ua.unlockedAt ? new Date(ua.unlockedAt).toISOString() : null,
      progress: ua.progress,
    }));
  }, [recentData]);

  // Summary stats
  const summary = useMemo(() => {
    const total = achievements.length;
    const unlocked = unlockedAchievements.length;
    const percentComplete = total > 0 ? Math.round((unlocked / total) * 100) : 0;

    // Calculate XP earned
    const totalXPEarned = unlockedAchievements.reduce((sum, ua) => {
      const achievement = achievements.find((a) => a.id === ua.achievementId);
      return sum + (achievement?.xpReward ?? 0);
    }, 0);

    // By category
    const categories: AchievementCategory[] = [
      'learning',
      'streak',
      'mastery',
      'explorer',
      'social',
      'special',
    ];
    const byCategory: Record<AchievementCategory, { total: number; unlocked: number }> = {
      learning: { total: 0, unlocked: 0 },
      streak: { total: 0, unlocked: 0 },
      mastery: { total: 0, unlocked: 0 },
      explorer: { total: 0, unlocked: 0 },
      social: { total: 0, unlocked: 0 },
      special: { total: 0, unlocked: 0 },
    };

    for (const cat of categories) {
      const catAchievements = achievements.filter((a) => a.category === cat);
      const catUnlocked = catAchievements.filter((a) =>
        unlockedAchievements.some((ua) => ua.achievementId === a.id)
      );
      byCategory[cat] = {
        total: catAchievements.length,
        unlocked: catUnlocked.length,
      };
    }

    return {
      total,
      unlocked,
      percentComplete,
      totalXPEarned,
      byCategory,
    };
  }, [achievements, unlockedAchievements]);

  // Check if achievement is unlocked
  const isUnlocked = useCallback(
    (achievementId: string): boolean => {
      return unlockedAchievements.some(
        (ua) => ua.achievementId === achievementId && ua.unlockedAt !== null
      );
    },
    [unlockedAchievements]
  );

  // Get achievement progress
  const getProgress = useCallback(
    (achievementId: string): number => {
      const ua = unlockedAchievements.find((u) => u.achievementId === achievementId);
      return ua?.progress ?? 0;
    },
    [unlockedAchievements]
  );

  // Get achievement by ID
  const getAchievement = useCallback(
    (achievementId: string): Achievement | null => {
      return achievements.find((a) => a.id === achievementId) ?? null;
    },
    [achievements]
  );

  // Filter by category
  const filterByCategory = useCallback(
    (category: AchievementCategory | 'all'): Achievement[] => {
      if (category === 'all') return achievements;
      return achievements.filter((a) => a.category === category);
    },
    [achievements]
  );

  // Filter by status
  const filterByStatus = useCallback(
    (status: 'all' | 'unlocked' | 'locked'): Achievement[] => {
      if (status === 'all') return achievements;
      if (status === 'unlocked') {
        return achievements.filter((a) => isUnlocked(a.id));
      }
      return achievements.filter((a) => !isUnlocked(a.id));
    },
    [achievements, isUnlocked]
  );

  // Clear pending unlock
  const clearPendingUnlock = useCallback(() => {
    setPendingUnlock(null);
  }, []);

  // Unlock achievement
  const unlockAchievement = useCallback(
    async (achievementId: string) => {
      const result = await unlockMutation({ achievementId });

      if (result.success) {
        const achievement = getAchievement(achievementId);
        if (achievement) {
          // Set pending unlock for notification
          setPendingUnlock({
            achievement,
            xpAwarded: achievement.xpReward || 0,
            timestamp: Date.now(),
          });
        }
      }

      const isAlreadyUnlocked = !result.success && 'error' in result && result.error === 'Already unlocked';

      return {
        success: result.success,
        xpAwarded: result.success ? (getAchievement(achievementId)?.xpReward || 0) : 0,
        alreadyUnlocked: isAlreadyUnlocked,
      };
    },
    [unlockMutation, getAchievement]
  );

  // Update progress
  const updateProgress = useCallback(
    async (achievementId: string, progress: number) => {
      await updateProgressMutation({ achievementId, progress });
    },
    [updateProgressMutation]
  );

  return {
    achievements,
    unlockedAchievements,
    isLoading: userAchievementsData === undefined,
    summary,
    recentAchievements,
    pendingUnlock,
    clearPendingUnlock,
    isUnlocked,
    getProgress,
    getAchievement,
    filterByCategory,
    filterByStatus,
    unlockAchievement,
    updateProgress,
  };
}

export default useAchievements;
