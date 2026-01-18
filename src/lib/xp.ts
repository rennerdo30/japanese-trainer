/**
 * XP System Utilities
 *
 * Handles XP calculations, level thresholds, and XP awards for various actions.
 */

// XP configuration
export const XP_CONFIG = {
  // Base XP awards
  LESSON_COMPLETE: 25,
  LESSON_PERFECT: 10,      // Bonus for 100% score
  REVIEW_CORRECT: 5,

  // Streak bonuses
  STREAK_MULTIPLIER: 5,    // XP per streak day
  STREAK_CAP: 50,          // Max bonus from streak

  // Daily goal completion bonus
  DAILY_GOAL_BONUS: 15,

  // Level thresholds (cumulative XP needed for each level)
  LEVEL_THRESHOLDS: [
    0,      // Level 1
    100,    // Level 2
    250,    // Level 3
    450,    // Level 4
    700,    // Level 5
    1000,   // Level 6
    1350,   // Level 7
    1750,   // Level 8
    2200,   // Level 9
    2700,   // Level 10
    3250,   // Level 11
    3850,   // Level 12
    4500,   // Level 13
    5200,   // Level 14
    6000,   // Level 15
    6900,   // Level 16
    7900,   // Level 17
    9000,   // Level 18
    10200,  // Level 19
    11500,  // Level 20
  ],
} as const;

export interface LevelInfo {
  level: number;
  currentXP: number;
  xpToNextLevel: number;
}

/**
 * Calculate level information from total XP
 */
export function getLevelFromXP(totalXP: number): LevelInfo {
  const thresholds = XP_CONFIG.LEVEL_THRESHOLDS;

  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (totalXP >= thresholds[i]) {
      const level = i + 1;
      const currentXP = totalXP - thresholds[i];
      const xpToNextLevel =
        i < thresholds.length - 1
          ? thresholds[i + 1] - thresholds[i]
          : 1500; // Default increment after max defined level

      return {
        level,
        currentXP,
        xpToNextLevel,
      };
    }
  }

  // Should never reach here, but default to level 1
  return {
    level: 1,
    currentXP: totalXP,
    xpToNextLevel: thresholds[1] || 100,
  };
}

/**
 * Get total XP needed to reach a specific level
 */
export function getXPForLevel(level: number): number {
  if (level <= 1) return 0;

  const thresholds = XP_CONFIG.LEVEL_THRESHOLDS;
  const index = level - 1;

  if (index < thresholds.length) {
    return thresholds[index];
  }

  // Calculate for levels beyond defined thresholds
  const lastThreshold = thresholds[thresholds.length - 1];
  const levelsAfter = level - thresholds.length;
  return lastThreshold + levelsAfter * 1500;
}

/**
 * Calculate XP for a specific action
 */
export function getXPForAction(
  action: 'lesson_complete' | 'lesson_perfect' | 'review_correct' | 'daily_goal',
  context?: {
    streakDays?: number;
    score?: number;
  }
): number {
  let baseXP = 0;

  switch (action) {
    case 'lesson_complete':
      baseXP = XP_CONFIG.LESSON_COMPLETE;
      break;
    case 'lesson_perfect':
      baseXP = XP_CONFIG.LESSON_PERFECT;
      break;
    case 'review_correct':
      baseXP = XP_CONFIG.REVIEW_CORRECT;
      break;
    case 'daily_goal':
      baseXP = XP_CONFIG.DAILY_GOAL_BONUS;
      break;
  }

  // Apply streak bonus for lesson completion
  if (action === 'lesson_complete' && context?.streakDays) {
    const streakBonus = Math.min(
      context.streakDays * XP_CONFIG.STREAK_MULTIPLIER,
      XP_CONFIG.STREAK_CAP
    );
    baseXP += streakBonus;
  }

  return baseXP;
}

/**
 * Calculate total XP for completing a lesson
 */
export function calculateLessonXP(
  score: number,
  streakDays: number = 0
): { total: number; breakdown: { base: number; perfect: number; streak: number } } {
  const base = XP_CONFIG.LESSON_COMPLETE;
  const perfect = score === 100 ? XP_CONFIG.LESSON_PERFECT : 0;
  const streak = Math.min(streakDays * XP_CONFIG.STREAK_MULTIPLIER, XP_CONFIG.STREAK_CAP);

  return {
    total: base + perfect + streak,
    breakdown: {
      base,
      perfect,
      streak,
    },
  };
}

/**
 * Get progress to next level as percentage (0-100)
 */
export function getLevelProgress(totalXP: number): number {
  const levelInfo = getLevelFromXP(totalXP);
  if (levelInfo.xpToNextLevel === 0) return 100;
  return Math.round((levelInfo.currentXP / levelInfo.xpToNextLevel) * 100);
}

/**
 * Check if a level up occurred
 */
export function checkLevelUp(previousXP: number, newXP: number): boolean {
  const previousLevel = getLevelFromXP(previousXP).level;
  const newLevel = getLevelFromXP(newXP).level;
  return newLevel > previousLevel;
}

/**
 * Get display name for a level
 */
export function getLevelDisplayName(level: number): string {
  if (level <= 5) return 'Beginner';
  if (level <= 10) return 'Intermediate';
  if (level <= 15) return 'Advanced';
  if (level <= 20) return 'Expert';
  return 'Master';
}

/**
 * Get level tier color class
 */
export function getLevelTierColor(level: number): string {
  if (level <= 5) return 'tier-bronze';
  if (level <= 10) return 'tier-silver';
  if (level <= 15) return 'tier-gold';
  if (level <= 20) return 'tier-platinum';
  return 'tier-diamond';
}
