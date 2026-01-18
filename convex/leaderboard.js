import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

// Anonymous name generator components
const ADJECTIVES = [
  "Swift", "Brave", "Clever", "Mighty", "Silent", "Golden", "Cosmic", "Noble",
  "Fierce", "Gentle", "Ancient", "Mystic", "Crystal", "Shadow", "Thunder", "Radiant",
  "Serene", "Wild", "Lunar", "Solar", "Stellar", "Azure", "Crimson", "Emerald",
  "Sage", "Zen", "Nimble", "Bold", "Bright", "Calm"
];

const NOUNS = [
  "Panda", "Tiger", "Dragon", "Phoenix", "Falcon", "Wolf", "Bear", "Fox",
  "Eagle", "Lion", "Owl", "Crane", "Serpent", "Hawk", "Panther", "Raven",
  "Turtle", "Koi", "Tanuki", "Samurai", "Shinobi", "Ronin", "Kitsune", "Tengu",
  "Scholar", "Sage", "Monk", "Knight", "Archer", "Wanderer"
];

// Generate a random anonymous name
function generateAnonymousName() {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const number = Math.floor(Math.random() * 100);
  return `${adjective} ${noun} ${number}`;
}

// Calculate XP from user data
function calculateXP(userData) {
  if (!userData) return { total: 0, breakdown: {} };

  const { modules, globalStats } = userData;

  // Study Time XP = totalStudyTime (minutes) × 2
  const studyTimeXP = Math.floor((globalStats?.totalStudyTime || 0) / 60) * 2;

  // Accuracy XP = total correct answers × 10
  const alphabetCorrect = modules?.alphabet?.stats?.correct || 0;
  const vocabularyCorrect = modules?.vocabulary?.stats?.correct || 0;
  const kanjiCorrect = modules?.kanji?.stats?.correct || 0;
  const grammarCorrect = modules?.grammar?.stats?.correct || 0;
  const totalCorrect = alphabetCorrect + vocabularyCorrect + kanjiCorrect + grammarCorrect;
  const accuracyXP = totalCorrect * 10;

  // Streak XP = (currentStreak × 50) + (bestStreak × 25)
  const currentStreak = globalStats?.streak || 0;
  const bestStreak = globalStats?.bestStreak || 0;
  const streakXP = (currentStreak * 50) + (bestStreak * 25);

  // Mastery XP = various mastery bonuses
  const wordsMastered = modules?.vocabulary?.stats?.wordsMastered || 0;
  const kanjiMastered = modules?.kanji?.stats?.kanjiMastered || 0;
  const pointsMastered = modules?.grammar?.stats?.pointsMastered || 0;
  const textsRead = modules?.reading?.stats?.textsRead || 0;
  const exercisesCompleted = modules?.listening?.stats?.exercisesCompleted || 0;

  const masteryXP =
    (wordsMastered * 100) +
    (kanjiMastered * 150) +
    (pointsMastered * 75) +
    (textsRead * 200) +
    (exercisesCompleted * 150);

  const totalXP = studyTimeXP + accuracyXP + streakXP + masteryXP;

  return {
    total: totalXP,
    breakdown: {
      studyTime: studyTimeXP,
      accuracy: accuracyXP,
      streaks: streakXP,
      mastery: masteryXP,
    },
    details: {
      studyMinutes: Math.floor((globalStats?.totalStudyTime || 0) / 60),
      totalCorrect,
      currentStreak,
      bestStreak,
      wordsMastered,
      kanjiMastered,
      pointsMastered,
      textsRead,
      exercisesCompleted,
    },
  };
}

// Get or create anonymous name for current user
export const getOrCreateAnonymousName = mutation({
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const userData = await ctx.db
      .query("userData")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (userData?.anonymousName) {
      return userData.anonymousName;
    }

    // Generate new name
    const newName = generateAnonymousName();

    if (userData) {
      await ctx.db.patch(userData._id, { anonymousName: newName });
    }

    return newName;
  },
});

// Get current user's XP breakdown
export const getMyXPBreakdown = query({
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return null;
    }

    const userData = await ctx.db
      .query("userData")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!userData) {
      return null;
    }

    const xpData = calculateXP(userData);

    return {
      anonymousName: userData.anonymousName || null,
      ...xpData,
    };
  },
});

// Get leaderboard entries with pagination support
// PERFORMANCE NOTE: This implementation loads all users to calculate rankings.
// For production scale (>1000 users), consider:
// 1. Create a 'leaderboardCache' table with pre-computed XP
// 2. Update cache via scheduled function (e.g., every hour) or on user activity
// 3. Add index: .index("by_xp", ["xp"]) for efficient sorted queries
// 4. Query from cache: ctx.db.query("leaderboardCache").withIndex("by_xp").order("desc").take(limit)
export const getLeaderboard = query({
  args: {
    period: v.union(v.literal("daily"), v.literal("weekly"), v.literal("allTime")),
    language: v.optional(v.string()), // null/undefined for global
    limit: v.optional(v.number()),
    offset: v.optional(v.number()), // For pagination
  },
  handler: async (ctx, args) => {
    const currentUserId = await auth.getUserId(ctx);
    const limit = Math.min(args.limit || 50, 100); // Cap at 100 for performance
    const offset = args.offset || 0;

    // Limit total users loaded to prevent memory issues
    // For apps with >1000 users, implement proper caching/denormalization
    const MAX_USERS_TO_LOAD = 1000;
    const allUserData = await ctx.db.query("userData").take(MAX_USERS_TO_LOAD);

    // Get settings for visibility check (also limited)
    const allSettings = await ctx.db.query("userSettings").take(MAX_USERS_TO_LOAD);
    const settingsMap = new Map();
    for (const s of allSettings) {
      settingsMap.set(s.userId, s.settings);
    }

    // Get daily activity for time-based filtering
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // For time-period filtering, we need to look at dailyActivity
    // Limit to recent entries only (7 days max for weekly, 1 day for daily)
    let dailyActivityData = [];
    if (args.period !== "allTime") {
      // For better performance, could add index: .index("by_date", ["date"])
      // and filter with .withIndex("by_date", q => q.gte(q.field("date"), cutoffDate))
      dailyActivityData = await ctx.db.query("dailyActivity").take(MAX_USERS_TO_LOAD * 7);
    }

    // Build daily activity map by user
    const userDailyActivity = new Map();
    for (const activity of dailyActivityData) {
      const activityDate = new Date(activity.date);
      const isInPeriod =
        args.period === "daily"
          ? activity.date === todayStr
          : activityDate >= weekAgo;

      if (isInPeriod) {
        if (!userDailyActivity.has(activity.userId)) {
          userDailyActivity.set(activity.userId, {
            studyTimeMinutes: 0,
            itemsLearned: 0,
            itemsReviewed: 0,
          });
        }
        const userData = userDailyActivity.get(activity.userId);
        userData.studyTimeMinutes += activity.studyTimeMinutes || 0;
        userData.itemsLearned += activity.itemsLearned || 0;
        userData.itemsReviewed += activity.itemsReviewed || 0;
      }
    }

    // Calculate XP and build leaderboard - SECURITY: never include userId in entries
    const leaderboardEntries = [];
    let currentUserRank = null;
    let currentUserXp = null;
    let currentUserStreak = null;
    let currentUserName = null;

    for (const userData of allUserData) {
      // Check visibility setting (default to true)
      const settings = settingsMap.get(userData.userId);
      const isVisible = settings?.leaderboardVisible !== false;
      if (!isVisible) continue;

      // Filter by language if specified
      if (args.language && userData.targetLanguage !== args.language) continue;

      const xpData = calculateXP(userData);

      // For time-based periods, only include users with activity in that period
      if (args.period !== "allTime") {
        const activity = userDailyActivity.get(userData.userId);
        if (!activity || activity.studyTimeMinutes === 0) continue;
      }

      const isCurrentUser = userData.userId === currentUserId;

      // Track current user's data separately (never expose userId)
      if (isCurrentUser) {
        currentUserXp = xpData.total;
        currentUserStreak = userData.globalStats?.streak || 0;
        currentUserName = userData.anonymousName || "Anonymous Learner";
      }

      // SECURITY: Only include public data, never userId
      leaderboardEntries.push({
        anonymousName: userData.anonymousName || "Anonymous Learner",
        xp: xpData.total,
        streak: userData.globalStats?.streak || 0,
        isCurrentUser,
      });
    }

    // Sort by XP descending
    leaderboardEntries.sort((a, b) => b.xp - a.xp);

    // Find current user's rank after sorting
    if (currentUserId && currentUserXp !== null) {
      const currentUserIndex = leaderboardEntries.findIndex(e => e.isCurrentUser);
      if (currentUserIndex >= 0) {
        currentUserRank = {
          anonymousName: currentUserName,
          xp: currentUserXp,
          streak: currentUserStreak,
          rank: currentUserIndex + 1,
          isCurrentUser: true,
        };
      }
    }

    // Apply pagination - add ranks before slicing
    const totalParticipants = leaderboardEntries.length;
    const paginatedEntries = leaderboardEntries
      .slice(offset, offset + limit)
      .map((entry, index) => ({
        ...entry,
        rank: offset + index + 1,
      }));

    return {
      entries: paginatedEntries,
      currentUserRank,
      totalParticipants,
      hasMore: offset + limit < totalParticipants,
    };
  },
});

// Set leaderboard visibility
export const setLeaderboardVisibility = mutation({
  args: {
    visible: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const existing = await ctx.db
      .query("userSettings")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        settings: {
          ...existing.settings,
          leaderboardVisible: args.visible,
        },
      });
    } else {
      // Create default settings with visibility
      await ctx.db.insert("userSettings", {
        userId: userId,
        settings: {
          theme: "dark",
          soundEnabled: true,
          ttsEnabled: true,
          ttsRate: 1.0,
          ttsVolume: 0.8,
          timerEnabled: true,
          timerDuration: 5,
          leaderboardVisible: args.visible,
        },
      });
    }

    return { success: true };
  },
});

// Get current user's leaderboard visibility setting
export const getLeaderboardVisibility = query({
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return true; // Default visible for anonymous
    }

    const settings = await ctx.db
      .query("userSettings")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    // Default to true if not set
    return settings?.settings?.leaderboardVisible !== false;
  },
});
