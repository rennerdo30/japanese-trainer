import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { auth } from "./auth";

// Create a new review session
export const createReviewSession = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    const id = await ctx.db.insert("reviewSessions", {
      userId,
      sessionId,
      startedAt: Date.now(),
      itemsReviewed: 0,
      accuracy: 0,
      moduleBreakdown: {
        vocabulary: { reviewed: 0, correct: 0 },
        kanji: { reviewed: 0, correct: 0 },
        grammar: { reviewed: 0, correct: 0 },
      },
    });

    return { id, sessionId };
  },
});

// Update review session with item result
export const updateReviewSession = mutation({
  args: {
    sessionId: v.string(),
    module: v.string(), // 'vocabulary' | 'kanji' | 'grammar'
    correct: v.boolean(),
  },
  handler: async (ctx, { sessionId, module, correct }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const session = await ctx.db
      .query("reviewSessions")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", sessionId))
      .first();

    if (!session || session.userId !== userId) {
      throw new Error("Session not found");
    }

    // Update module breakdown
    const moduleStats = session.moduleBreakdown[module] || { reviewed: 0, correct: 0 };
    const newModuleBreakdown = {
      ...session.moduleBreakdown,
      [module]: {
        reviewed: moduleStats.reviewed + 1,
        correct: moduleStats.correct + (correct ? 1 : 0),
      },
    };

    // Calculate new totals
    const newItemsReviewed = session.itemsReviewed + 1;
    const totalCorrect = Object.values(newModuleBreakdown).reduce(
      (sum, m) => sum + m.correct,
      0
    );
    const newAccuracy = newItemsReviewed > 0 ? totalCorrect / newItemsReviewed : 0;

    await ctx.db.patch(session._id, {
      itemsReviewed: newItemsReviewed,
      accuracy: newAccuracy,
      moduleBreakdown: newModuleBreakdown,
    });

    return { success: true };
  },
});

// Complete a review session
export const completeReviewSession = mutation({
  args: { sessionId: v.string() },
  handler: async (ctx, { sessionId }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const session = await ctx.db
      .query("reviewSessions")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", sessionId))
      .first();

    if (!session || session.userId !== userId) {
      throw new Error("Session not found");
    }

    await ctx.db.patch(session._id, {
      completedAt: Date.now(),
    });

    // Update daily activity
    const today = new Date().toISOString().split('T')[0];
    let activity = await ctx.db
      .query("dailyActivity")
      .withIndex("by_userId_date", (q) => q.eq("userId", userId).eq("date", today))
      .first();

    if (!activity) {
      await ctx.db.insert("dailyActivity", {
        userId,
        date: today,
        studyTimeMinutes: 0,
        itemsLearned: 0,
        itemsReviewed: session.itemsReviewed,
        modules: {},
      });
    } else {
      await ctx.db.patch(activity._id, {
        itemsReviewed: activity.itemsReviewed + session.itemsReviewed,
      });
    }

    return { success: true, session };
  },
});

// Get review session by ID
export const getReviewSession = query({
  args: { sessionId: v.string() },
  handler: async (ctx, { sessionId }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;

    const session = await ctx.db
      .query("reviewSessions")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", sessionId))
      .first();

    if (!session || session.userId !== userId) {
      return null;
    }

    return session;
  },
});

// Get recent review sessions (last 30 days)
export const getReviewHistory = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 30 }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];

    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

    const sessions = await ctx.db
      .query("reviewSessions")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .filter((q) => q.gte(q.field("startedAt"), thirtyDaysAgo))
      .order("desc")
      .take(limit);

    return sessions;
  },
});

// Get review statistics for a time period
export const getReviewStats = query({
  args: { days: v.optional(v.number()) },
  handler: async (ctx, { days = 7 }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;

    const startDate = Date.now() - (days * 24 * 60 * 60 * 1000);

    const sessions = await ctx.db
      .query("reviewSessions")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .filter((q) => q.gte(q.field("startedAt"), startDate))
      .collect();

    const completedSessions = sessions.filter(s => s.completedAt);

    const totalItemsReviewed = completedSessions.reduce((sum, s) => sum + s.itemsReviewed, 0);
    const totalCorrect = completedSessions.reduce((sum, s) => sum + Math.round(s.itemsReviewed * s.accuracy), 0);
    const averageAccuracy = totalItemsReviewed > 0 ? totalCorrect / totalItemsReviewed : 0;

    const moduleStats = {
      vocabulary: { reviewed: 0, correct: 0 },
      kanji: { reviewed: 0, correct: 0 },
      grammar: { reviewed: 0, correct: 0 },
    };

    completedSessions.forEach(session => {
      Object.entries(session.moduleBreakdown).forEach(([module, stats]) => {
        if (moduleStats[module]) {
          moduleStats[module].reviewed += stats.reviewed;
          moduleStats[module].correct += stats.correct;
        }
      });
    });

    return {
      sessionsCompleted: completedSessions.length,
      totalItemsReviewed,
      averageAccuracy,
      moduleStats,
      periodDays: days,
    };
  },
});
