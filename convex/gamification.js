import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

// XP thresholds for each level
const LEVEL_THRESHOLDS = [0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700, 3250, 3850, 4500, 5200, 6000];

// Calculate level from total XP
function getLevelFromXP(totalXP) {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXP >= LEVEL_THRESHOLDS[i]) {
      return {
        level: i + 1,
        currentXP: totalXP - LEVEL_THRESHOLDS[i],
        xpToNextLevel: i < LEVEL_THRESHOLDS.length - 1
          ? LEVEL_THRESHOLDS[i + 1] - LEVEL_THRESHOLDS[i]
          : 1000, // Default for max level
      };
    }
  }
  return { level: 1, currentXP: totalXP, xpToNextLevel: LEVEL_THRESHOLDS[1] };
}

// Get today's date as YYYY-MM-DD
function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

// Get default gamification state
function getDefaultGamificationState(userId) {
  const today = getTodayDate();
  return {
    userId,
    level: 1,
    currentXP: 0,
    totalXP: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: today,
    todayXP: 0,
    todayDate: today,
    dailyGoalType: 'xp',
    dailyGoalTarget: 50,
    dailyGoalProgress: 0,
  };
}

// Get gamification state for a user
export const getGamificationState = query({
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return null;
    }

    const state = await ctx.db
      .query("gamification")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!state) {
      return getDefaultGamificationState(userId);
    }

    const today = getTodayDate();

    // Reset daily values if it's a new day
    if (state.todayDate !== today) {
      return {
        ...state,
        todayXP: 0,
        todayDate: today,
        dailyGoalProgress: 0,
      };
    }

    return state;
  },
});

// Initialize gamification state for a new user
export const initializeGamification = mutation({
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const existing = await ctx.db
      .query("gamification")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      return existing._id;
    }

    const defaultState = getDefaultGamificationState(userId);
    const id = await ctx.db.insert("gamification", defaultState);
    return id;
  },
});

// Award XP to a user
export const awardXP = mutation({
  args: {
    amount: v.number(),
    source: v.union(
      v.literal('lesson_complete'),
      v.literal('lesson_perfect'),
      v.literal('review_correct'),
      v.literal('streak_bonus'),
      v.literal('daily_goal'),
      v.literal('achievement')
    ),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const today = getTodayDate();

    let state = await ctx.db
      .query("gamification")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!state) {
      // Create initial state
      const defaultState = getDefaultGamificationState(userId);
      const id = await ctx.db.insert("gamification", defaultState);
      state = { ...defaultState, _id: id };
    }

    // Calculate new totals
    const isNewDay = state.todayDate !== today;
    const newTotalXP = state.totalXP + args.amount;
    const newTodayXP = isNewDay ? args.amount : state.todayXP + args.amount;

    // Calculate new level
    const levelInfo = getLevelFromXP(newTotalXP);
    const previousLevel = state.level;

    // Calculate streak
    let newStreak = state.currentStreak;
    let newLongestStreak = state.longestStreak;

    if (isNewDay) {
      // Check if this continues the streak (was active yesterday)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (state.lastActiveDate === yesterdayStr) {
        newStreak = state.currentStreak + 1;
      } else if (state.lastActiveDate !== today) {
        // Streak broken, reset to 1
        newStreak = 1;
      }

      newLongestStreak = Math.max(newLongestStreak, newStreak);
    }

    // Calculate daily goal progress
    let dailyGoalProgress = state.dailyGoalProgress;
    if (state.dailyGoalType === 'xp') {
      dailyGoalProgress = isNewDay ? args.amount : state.dailyGoalProgress + args.amount;
    } else if (state.dailyGoalType === 'lessons' && args.source === 'lesson_complete') {
      dailyGoalProgress = isNewDay ? 1 : state.dailyGoalProgress + 1;
    }

    await ctx.db.patch(state._id, {
      level: levelInfo.level,
      currentXP: levelInfo.currentXP,
      totalXP: newTotalXP,
      currentStreak: newStreak,
      longestStreak: newLongestStreak,
      lastActiveDate: today,
      todayXP: newTodayXP,
      todayDate: today,
      dailyGoalProgress,
    });

    return {
      xpAwarded: args.amount,
      newTotalXP,
      newLevel: levelInfo.level,
      leveledUp: levelInfo.level > previousLevel,
      currentStreak: newStreak,
      dailyGoalProgress,
      dailyGoalTarget: state.dailyGoalTarget,
      dailyGoalCompleted: dailyGoalProgress >= state.dailyGoalTarget,
    };
  },
});

// Update daily goal settings
export const updateDailyGoal = mutation({
  args: {
    goalType: v.union(
      v.literal('xp'),
      v.literal('lessons'),
      v.literal('time')
    ),
    target: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const state = await ctx.db
      .query("gamification")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!state) {
      // Create with the new goal
      const defaultState = getDefaultGamificationState(userId);
      const id = await ctx.db.insert("gamification", {
        ...defaultState,
        dailyGoalType: args.goalType,
        dailyGoalTarget: args.target,
      });
      return id;
    }

    await ctx.db.patch(state._id, {
      dailyGoalType: args.goalType,
      dailyGoalTarget: args.target,
    });

    return state._id;
  },
});

// Get streak info
export const getStreakInfo = query({
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return { currentStreak: 0, longestStreak: 0, lastActiveDate: null };
    }

    const state = await ctx.db
      .query("gamification")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!state) {
      return { currentStreak: 0, longestStreak: 0, lastActiveDate: null };
    }

    const today = getTodayDate();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Check if streak is still active
    let currentStreak = state.currentStreak;
    if (state.lastActiveDate !== today && state.lastActiveDate !== yesterdayStr) {
      currentStreak = 0; // Streak broken
    }

    return {
      currentStreak,
      longestStreak: state.longestStreak,
      lastActiveDate: state.lastActiveDate,
    };
  },
});

// Get leaderboard data (top XP earners)
export const getXPLeaderboard = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;

    const allStates = await ctx.db
      .query("gamification")
      .collect();

    // Sort by total XP descending
    const sorted = allStates
      .sort((a, b) => b.totalXP - a.totalXP)
      .slice(0, limit);

    return sorted.map((state, index) => ({
      rank: index + 1,
      level: state.level,
      totalXP: state.totalXP,
      currentStreak: state.currentStreak,
    }));
  },
});
