import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

// Get all learned content for a user
export const getLearnedContent = query({
  args: {
    languageCode: v.optional(v.string()),
    contentType: v.optional(v.union(
      v.literal('vocabulary'),
      v.literal('grammar'),
      v.literal('character'),
      v.literal('reading'),
      v.literal('listening')
    )),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return [];
    }

    let query = ctx.db.query("learnedContent");

    if (args.languageCode) {
      query = query.withIndex("by_userId_language", (q) =>
        q.eq("userId", userId).eq("languageCode", args.languageCode)
      );
    } else if (args.contentType) {
      query = query.withIndex("by_userId_type", (q) =>
        q.eq("userId", userId).eq("contentType", args.contentType)
      );
    } else {
      query = query.withIndex("by_userId", (q) => q.eq("userId", userId));
    }

    return await query.collect();
  },
});

// Get content due for review
export const getDueForReview = query({
  args: {
    languageCode: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return [];
    }

    const now = Date.now();
    const limit = args.limit || 50;

    let content = await ctx.db
      .query("learnedContent")
      .withIndex("by_userId_due", (q) => q.eq("userId", userId).lte("nextReviewAt", now))
      .take(limit * 2); // Get more than needed for filtering

    // Filter by language if specified
    if (args.languageCode) {
      content = content.filter((c) => c.languageCode === args.languageCode);
    }

    // Sort by due date and take limit
    content.sort((a, b) => a.nextReviewAt - b.nextReviewAt);
    return content.slice(0, limit);
  },
});

// Get count of content due for review
export const getDueCount = query({
  args: {
    languageCode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return 0;
    }

    const now = Date.now();
    let content = await ctx.db
      .query("learnedContent")
      .withIndex("by_userId_due", (q) => q.eq("userId", userId).lte("nextReviewAt", now))
      .collect();

    if (args.languageCode) {
      content = content.filter((c) => c.languageCode === args.languageCode);
    }

    return content.length;
  },
});

// Check if a specific content is learned
export const isContentLearned = query({
  args: {
    contentId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return false;
    }

    const content = await ctx.db
      .query("learnedContent")
      .withIndex("by_userId_content", (q) =>
        q.eq("userId", userId).eq("contentId", args.contentId)
      )
      .first();

    return content !== null;
  },
});

// Add learned content from a completed lesson
export const addLearnedContent = mutation({
  args: {
    contentType: v.union(
      v.literal('vocabulary'),
      v.literal('grammar'),
      v.literal('character'),
      v.literal('reading'),
      v.literal('listening')
    ),
    contentId: v.string(),
    languageCode: v.string(),
    fromLessonId: v.string(),
    preview: v.object({
      front: v.string(),
      back: v.string(),
      reading: v.optional(v.string()),
      audioUrl: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check if already learned
    const existing = await ctx.db
      .query("learnedContent")
      .withIndex("by_userId_content", (q) =>
        q.eq("userId", userId).eq("contentId", args.contentId)
      )
      .first();

    if (existing) {
      // Already learned, skip
      return existing._id;
    }

    const now = Date.now();
    // Schedule first review in 1 day (86400000 ms)
    const oneDayMs = 24 * 60 * 60 * 1000;

    const id = await ctx.db.insert("learnedContent", {
      userId,
      contentType: args.contentType,
      contentId: args.contentId,
      languageCode: args.languageCode,
      fromLessonId: args.fromLessonId,
      learnedAt: now,
      nextReviewAt: now + oneDayMs,
      easeFactor: 2.5, // SM-2 default
      interval: 1,
      repetitions: 0,
      preview: args.preview,
    });

    return id;
  },
});

// Add multiple learned content items at once (from lesson completion)
export const addLearnedContentBatch = mutation({
  args: {
    items: v.array(v.object({
      contentType: v.union(
        v.literal('vocabulary'),
        v.literal('grammar'),
        v.literal('character'),
        v.literal('reading'),
        v.literal('listening')
      ),
      contentId: v.string(),
      languageCode: v.string(),
      fromLessonId: v.string(),
      preview: v.object({
        front: v.string(),
        back: v.string(),
        reading: v.optional(v.string()),
        audioUrl: v.optional(v.string()),
      }),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const addedIds = [];

    for (const item of args.items) {
      // Check if already learned
      const existing = await ctx.db
        .query("learnedContent")
        .withIndex("by_userId_content", (q) =>
          q.eq("userId", userId).eq("contentId", item.contentId)
        )
        .first();

      if (!existing) {
        const id = await ctx.db.insert("learnedContent", {
          userId,
          contentType: item.contentType,
          contentId: item.contentId,
          languageCode: item.languageCode,
          fromLessonId: item.fromLessonId,
          learnedAt: now,
          nextReviewAt: now + oneDayMs,
          easeFactor: 2.5,
          interval: 1,
          repetitions: 0,
          preview: item.preview,
        });
        addedIds.push(id);
      }
    }

    return { addedCount: addedIds.length, ids: addedIds };
  },
});

// Update SRS data after a review (SM-2 algorithm)
export const recordReview = mutation({
  args: {
    contentId: v.string(),
    quality: v.number(), // 0-5 (0-2 = failure, 3-5 = success)
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const content = await ctx.db
      .query("learnedContent")
      .withIndex("by_userId_content", (q) =>
        q.eq("userId", userId).eq("contentId", args.contentId)
      )
      .first();

    if (!content) {
      throw new Error("Content not found");
    }

    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    // SM-2 algorithm
    let { easeFactor, interval, repetitions } = content;
    const quality = Math.max(0, Math.min(5, args.quality));

    if (quality < 3) {
      // Failed review - reset
      repetitions = 0;
      interval = 1;
    } else {
      // Successful review
      if (repetitions === 0) {
        interval = 1;
      } else if (repetitions === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * easeFactor);
      }
      repetitions += 1;
    }

    // Update ease factor
    easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    easeFactor = Math.max(1.3, easeFactor); // Minimum ease factor

    const nextReviewAt = now + (interval * oneDayMs);

    await ctx.db.patch(content._id, {
      easeFactor,
      interval,
      repetitions,
      nextReviewAt,
    });

    return { interval, nextReviewAt, easeFactor };
  },
});

// Get learned content stats
export const getLearnedStats = query({
  args: {
    languageCode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return {
        totalLearned: 0,
        byType: {},
        dueForReview: 0,
      };
    }

    const now = Date.now();
    let content;

    if (args.languageCode) {
      content = await ctx.db
        .query("learnedContent")
        .withIndex("by_userId_language", (q) =>
          q.eq("userId", userId).eq("languageCode", args.languageCode)
        )
        .collect();
    } else {
      content = await ctx.db
        .query("learnedContent")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .collect();
    }

    const byType = {};
    let dueForReview = 0;

    for (const item of content) {
      byType[item.contentType] = (byType[item.contentType] || 0) + 1;
      if (item.nextReviewAt <= now) {
        dueForReview++;
      }
    }

    return {
      totalLearned: content.length,
      byType,
      dueForReview,
    };
  },
});
