import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { auth } from "./auth";

// Valid achievement ID format (alphanumeric with underscores, max 64 chars)
const MAX_ACHIEVEMENT_ID_LENGTH = 64;
const ACHIEVEMENT_ID_REGEX = /^[a-zA-Z0-9_-]+$/;

function isValidAchievementId(id) {
  return (
    typeof id === 'string' &&
    id.length > 0 &&
    id.length <= MAX_ACHIEVEMENT_ID_LENGTH &&
    ACHIEVEMENT_ID_REGEX.test(id)
  );
}

/**
 * Get all user achievements
 */
export const getUserAchievements = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return [];
    }

    const achievements = await ctx.db
      .query("userAchievements")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    return achievements;
  },
});

/**
 * Check if a specific achievement is unlocked
 */
export const isAchievementUnlocked = query({
  args: {
    achievementId: v.string(),
  },
  handler: async (ctx, { achievementId }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return false;
    }

    const achievement = await ctx.db
      .query("userAchievements")
      .withIndex("by_userId_achievement", (q) =>
        q.eq("userId", userId).eq("achievementId", achievementId)
      )
      .first();

    return achievement !== null;
  },
});

/**
 * Unlock an achievement
 */
export const unlockAchievement = mutation({
  args: {
    achievementId: v.string(),
  },
  handler: async (ctx, { achievementId }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    // Validate achievement ID format
    if (!isValidAchievementId(achievementId)) {
      return { success: false, error: "Invalid achievement ID format" };
    }

    // Check if already unlocked
    const existing = await ctx.db
      .query("userAchievements")
      .withIndex("by_userId_achievement", (q) =>
        q.eq("userId", userId).eq("achievementId", achievementId)
      )
      .first();

    if (existing) {
      return { success: false, error: "Already unlocked" };
    }

    // Create the achievement record
    await ctx.db.insert("userAchievements", {
      userId,
      achievementId,
      unlockedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Update achievement progress (for progressive achievements)
 */
export const updateAchievementProgress = mutation({
  args: {
    achievementId: v.string(),
    progress: v.number(),
  },
  handler: async (ctx, { achievementId, progress }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    // Validate achievement ID format
    if (!isValidAchievementId(achievementId)) {
      return { success: false, error: "Invalid achievement ID format" };
    }

    // Validate progress range
    if (progress < 0 || progress > 100) {
      return { success: false, error: "Progress must be between 0 and 100" };
    }

    // Check if already unlocked (progress = 100)
    const existing = await ctx.db
      .query("userAchievements")
      .withIndex("by_userId_achievement", (q) =>
        q.eq("userId", userId).eq("achievementId", achievementId)
      )
      .first();

    if (existing) {
      // Update existing progress
      await ctx.db.patch(existing._id, {
        progress: Math.min(100, progress),
      });
    } else {
      // Create new progress record
      await ctx.db.insert("userAchievements", {
        userId,
        achievementId,
        unlockedAt: progress >= 100 ? Date.now() : 0,
        progress: Math.min(100, progress),
      });
    }

    return { success: true };
  },
});

/**
 * Get achievement count summary
 */
export const getAchievementSummary = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return {
        total: 0,
        unlocked: 0,
        byCategory: {},
        byRarity: {},
      };
    }

    const achievements = await ctx.db
      .query("userAchievements")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    // Count unlocked achievements (those with unlockedAt > 0)
    const unlocked = achievements.filter((a) => a.unlockedAt > 0).length;

    return {
      total: achievements.length,
      unlocked,
      // Note: Actual category/rarity counts would require loading achievements.json
      byCategory: {},
      byRarity: {},
    };
  },
});

/**
 * Get recent achievement unlocks
 */
export const getRecentAchievements = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { limit = 5 }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return [];
    }

    const achievements = await ctx.db
      .query("userAchievements")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit);

    // Filter to only unlocked achievements
    return achievements
      .filter((a) => a.unlockedAt > 0)
      .sort((a, b) => b.unlockedAt - a.unlockedAt);
  },
});
