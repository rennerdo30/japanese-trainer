import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

// Get all lesson progress for a user and language
export const getLessonProgress = query({
  args: {
    languageCode: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return [];
    }

    const progress = await ctx.db
      .query("lessonProgress")
      .withIndex("by_userId_language", (q) =>
        q.eq("userId", userId).eq("languageCode", args.languageCode)
      )
      .collect();

    return progress;
  },
});

// Get progress for a specific lesson
export const getSingleLessonProgress = query({
  args: {
    lessonId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return null;
    }

    const progress = await ctx.db
      .query("lessonProgress")
      .withIndex("by_userId_lesson", (q) =>
        q.eq("userId", userId).eq("lessonId", args.lessonId)
      )
      .first();

    return progress;
  },
});

// Update or create lesson progress
export const updateLessonProgress = mutation({
  args: {
    languageCode: v.string(),
    lessonId: v.string(),
    status: v.union(
      v.literal('locked'),
      v.literal('available'),
      v.literal('in_progress'),
      v.literal('completed')
    ),
    score: v.optional(v.number()),
    xpEarned: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const existing = await ctx.db
      .query("lessonProgress")
      .withIndex("by_userId_lesson", (q) =>
        q.eq("userId", userId).eq("lessonId", args.lessonId)
      )
      .first();

    const now = Date.now();

    if (existing) {
      const updates = {
        status: args.status,
        attempts: args.status === 'completed' ? existing.attempts + 1 : existing.attempts,
      };

      // Set startedAt if transitioning to in_progress
      if (args.status === 'in_progress' && !existing.startedAt) {
        updates.startedAt = now;
      }

      // Set completedAt and score if completing
      if (args.status === 'completed') {
        updates.completedAt = now;
        if (args.score !== undefined) {
          updates.score = args.score;
        }
        if (args.xpEarned !== undefined) {
          updates.xpEarned = (existing.xpEarned || 0) + args.xpEarned;
        }
      }

      await ctx.db.patch(existing._id, updates);
      return existing._id;
    } else {
      const id = await ctx.db.insert("lessonProgress", {
        userId,
        languageCode: args.languageCode,
        lessonId: args.lessonId,
        status: args.status,
        startedAt: args.status === 'in_progress' ? now : undefined,
        completedAt: args.status === 'completed' ? now : undefined,
        score: args.score,
        xpEarned: args.xpEarned || 0,
        attempts: args.status === 'completed' ? 1 : 0,
      });
      return id;
    }
  },
});

// Start a lesson (set status to in_progress)
export const startLesson = mutation({
  args: {
    languageCode: v.string(),
    lessonId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const existing = await ctx.db
      .query("lessonProgress")
      .withIndex("by_userId_lesson", (q) =>
        q.eq("userId", userId).eq("lessonId", args.lessonId)
      )
      .first();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: 'in_progress',
        startedAt: existing.startedAt || now,
      });
      return existing._id;
    } else {
      const id = await ctx.db.insert("lessonProgress", {
        userId,
        languageCode: args.languageCode,
        lessonId: args.lessonId,
        status: 'in_progress',
        startedAt: now,
        attempts: 0,
      });
      return id;
    }
  },
});

// Complete a lesson
export const completeLesson = mutation({
  args: {
    languageCode: v.string(),
    lessonId: v.string(),
    score: v.number(),
    xpEarned: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const existing = await ctx.db
      .query("lessonProgress")
      .withIndex("by_userId_lesson", (q) =>
        q.eq("userId", userId).eq("lessonId", args.lessonId)
      )
      .first();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: 'completed',
        completedAt: now,
        score: args.score,
        xpEarned: (existing.xpEarned || 0) + args.xpEarned,
        attempts: existing.attempts + 1,
      });
      return { id: existing._id, xpEarned: args.xpEarned };
    } else {
      const id = await ctx.db.insert("lessonProgress", {
        userId,
        languageCode: args.languageCode,
        lessonId: args.lessonId,
        status: 'completed',
        startedAt: now,
        completedAt: now,
        score: args.score,
        xpEarned: args.xpEarned,
        attempts: 1,
      });
      return { id, xpEarned: args.xpEarned };
    }
  },
});

// Unlock next lesson (set status to available)
export const unlockLesson = mutation({
  args: {
    languageCode: v.string(),
    lessonId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const existing = await ctx.db
      .query("lessonProgress")
      .withIndex("by_userId_lesson", (q) =>
        q.eq("userId", userId).eq("lessonId", args.lessonId)
      )
      .first();

    if (existing) {
      // Only unlock if currently locked
      if (existing.status === 'locked') {
        await ctx.db.patch(existing._id, {
          status: 'available',
        });
      }
      return existing._id;
    } else {
      const id = await ctx.db.insert("lessonProgress", {
        userId,
        languageCode: args.languageCode,
        lessonId: args.lessonId,
        status: 'available',
        attempts: 0,
      });
      return id;
    }
  },
});

// Get completed lesson count for a language
export const getCompletedLessonCount = query({
  args: {
    languageCode: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return 0;
    }

    const progress = await ctx.db
      .query("lessonProgress")
      .withIndex("by_userId_language", (q) =>
        q.eq("userId", userId).eq("languageCode", args.languageCode)
      )
      .collect();

    return progress.filter((p) => p.status === 'completed').length;
  },
});
