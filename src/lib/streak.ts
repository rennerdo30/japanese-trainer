/**
 * Streak System Utilities
 *
 * Handles streak calculations, milestones, and streak-related logic.
 */

import type { StreakMilestone } from '@/types/gamification';

// Streak milestone definitions
const STREAK_MILESTONES = [
  { days: 3, label: '3 Day Streak' },
  { days: 7, label: '1 Week' },
  { days: 14, label: '2 Weeks' },
  { days: 30, label: '1 Month' },
  { days: 60, label: '2 Months' },
  { days: 90, label: '3 Months' },
  { days: 180, label: '6 Months' },
  { days: 365, label: '1 Year' },
] as const;

/**
 * Get today's date as YYYY-MM-DD string
 */
export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get yesterday's date as YYYY-MM-DD string
 */
export function getYesterdayDate(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
}

/**
 * Calculate new streak value based on last active date
 */
export function calculateStreak(
  lastActiveDate: string | null,
  currentDate: string = getTodayDate()
): { newStreak: number; streakBroken: boolean; isNewDay: boolean } {
  if (!lastActiveDate) {
    return { newStreak: 1, streakBroken: false, isNewDay: true };
  }

  if (lastActiveDate === currentDate) {
    // Same day, no change
    return { newStreak: 0, streakBroken: false, isNewDay: false };
  }

  const yesterday = getYesterdayDate();

  if (lastActiveDate === yesterday) {
    // Streak continues
    return { newStreak: 1, streakBroken: false, isNewDay: true };
  }

  // Streak broken (more than 1 day gap)
  return { newStreak: 1, streakBroken: true, isNewDay: true };
}

/**
 * Check if streak is still active (active today or yesterday)
 */
export function isStreakActive(lastActiveDate: string | null): boolean {
  if (!lastActiveDate) return false;

  const today = getTodayDate();
  const yesterday = getYesterdayDate();

  return lastActiveDate === today || lastActiveDate === yesterday;
}

/**
 * Get streak milestones with achieved status
 */
export function getStreakMilestones(currentStreak: number): StreakMilestone[] {
  return STREAK_MILESTONES.map((milestone) => ({
    days: milestone.days,
    label: milestone.label,
    achieved: currentStreak >= milestone.days,
  }));
}

/**
 * Get the next milestone to achieve
 */
export function getNextMilestone(currentStreak: number): StreakMilestone | null {
  for (const milestone of STREAK_MILESTONES) {
    if (currentStreak < milestone.days) {
      return {
        days: milestone.days,
        label: milestone.label,
        achieved: false,
      };
    }
  }
  return null;
}

/**
 * Get days until next milestone
 */
export function getDaysToNextMilestone(currentStreak: number): number {
  const nextMilestone = getNextMilestone(currentStreak);
  if (!nextMilestone) return 0;
  return nextMilestone.days - currentStreak;
}

/**
 * Get streak display text
 */
/**
 * Get streak display text key for translation
 * Returns a key that should be passed to t() function
 */
export function getStreakDisplayTextKey(streak: number): string {
  if (streak === 0) return 'streak.noStreak';
  if (streak === 1) return 'streak.oneDay';
  return 'streak.days';
}

/**
 * Get streak display text (legacy - use getStreakDisplayTextKey with t() instead)
 */
export function getStreakDisplayText(streak: number, t?: (key: string, params?: Record<string, string | number>) => string): string {
  if (t) {
    if (streak === 0) return t('gamification.streak.noStreak');
    if (streak === 1) return t('gamification.streak.oneDay');
    return t('gamification.streak.days', { count: streak });
  }
  // Fallback for legacy code
  if (streak === 0) return 'No streak';
  if (streak === 1) return '1 day';
  return `${streak} days`;
}

/**
 * Get streak encouragement message key for translation
 */
export function getStreakMessageKey(streak: number): string {
  if (streak === 0) return 'gamification.streak.messages.startToday';
  if (streak === 1) return 'gamification.streak.messages.greatStart';
  if (streak < 7) return 'gamification.streak.messages.buildingMomentum';
  if (streak < 30) return 'gamification.streak.messages.onFire';
  if (streak < 90) return 'gamification.streak.messages.incredibleDedication';
  if (streak < 365) return 'gamification.streak.messages.legend';
  return 'gamification.streak.messages.unstoppable';
}

/**
 * Get streak encouragement message (legacy - use getStreakMessageKey with t() instead)
 */
export function getStreakMessage(streak: number, t?: (key: string) => string): string {
  if (t) {
    return t(getStreakMessageKey(streak));
  }
  // Fallback for legacy code
  if (streak === 0) return 'Start your streak today!';
  if (streak === 1) return 'Great start! Keep it going!';
  if (streak < 7) return 'Building momentum!';
  if (streak < 30) return 'You\'re on fire!';
  if (streak < 90) return 'Incredible dedication!';
  if (streak < 365) return 'You\'re a legend!';
  return 'Unstoppable!';
}

/**
 * Get streak color class based on streak length
 */
export function getStreakColorClass(streak: number): string {
  if (streak === 0) return 'streak-none';
  if (streak < 7) return 'streak-starting';
  if (streak < 30) return 'streak-building';
  if (streak < 90) return 'streak-strong';
  return 'streak-legendary';
}

/**
 * Check if streak was broken
 */
export function wasStreakBroken(lastActiveDate: string | null): boolean {
  if (!lastActiveDate) return false;

  const today = getTodayDate();
  const yesterday = getYesterdayDate();

  // If last active was today or yesterday, streak is not broken
  if (lastActiveDate === today || lastActiveDate === yesterday) {
    return false;
  }

  // More than 1 day gap means streak was broken
  return true;
}

/**
 * Calculate streak freeze days (if implementing streak freezes)
 */
export function calculateFreezeNeeded(lastActiveDate: string | null): number {
  if (!lastActiveDate) return 0;

  const today = new Date(getTodayDate());
  const lastActive = new Date(lastActiveDate);
  const diffTime = today.getTime() - lastActive.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // Need 1 freeze for each missed day (not counting today)
  return Math.max(0, diffDays - 1);
}
