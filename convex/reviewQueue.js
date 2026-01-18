import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { auth } from "./auth";

/**
 * SM-2 Algorithm constants
 */
const DEFAULT_EASE_FACTOR = 2.5;
const MIN_EASE_FACTOR = 1.3;
const EASE_MODIFIER = 0.1;

/**
 * Calculate next review parameters using SM-2 algorithm
 */
function calculateNextReview(quality, repetitions, easeFactor, interval) {
  // Quality: 0-5 (0 = complete blackout, 5 = perfect)
  const isCorrect = quality >= 3;

  let newEaseFactor = easeFactor;
  let newRepetitions = repetitions;
  let newInterval = interval;

  if (isCorrect) {
    // Update ease factor
    newEaseFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    newEaseFactor = Math.max(MIN_EASE_FACTOR, newEaseFactor);

    // Calculate new interval
    if (repetitions === 0) {
      newInterval = 1;
    } else if (repetitions === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * newEaseFactor);
    }

    newRepetitions = repetitions + 1;
  } else {
    // Failed - reset repetitions, reduce ease factor
    newRepetitions = 0;
    newInterval = 1;
    newEaseFactor = Math.max(MIN_EASE_FACTOR, easeFactor - 0.2);
  }

  // Calculate due date
  const now = Date.now();
  const newDueAt = now + newInterval * 24 * 60 * 60 * 1000;

  return {
    interval: newInterval,
    easeFactor: newEaseFactor,
    repetitions: newRepetitions,
    dueAt: newDueAt,
  };
}

/**
 * Get all due items for review
 */
export const getDueItems = query({
  args: {
    languageCode: v.optional(v.string()),
    itemType: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { languageCode, itemType, limit = 50 }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return [];
    }

    const now = Date.now();

    let items = await ctx.db
      .query("reviewQueue")
      .withIndex("by_userId_due", (q) => q.eq("userId", userId).lte("dueAt", now))
      .collect();

    // Filter by language if specified
    if (languageCode) {
      items = items.filter((item) => item.languageCode === languageCode);
    }

    // Filter by item type if specified
    if (itemType) {
      items = items.filter((item) => item.itemType === itemType);
    }

    // Limit results
    if (limit > 0) {
      items = items.slice(0, limit);
    }

    return items;
  },
});

/**
 * Get review queue stats
 */
export const getQueueStats = query({
  args: {
    languageCode: v.optional(v.string()),
  },
  handler: async (ctx, { languageCode }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return null;
    }

    const now = Date.now();
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    const weekEnd = new Date();
    weekEnd.setDate(weekEnd.getDate() + 7);

    let items = await ctx.db
      .query("reviewQueue")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    // Filter by language if specified
    if (languageCode) {
      items = items.filter((item) => item.languageCode === languageCode);
    }

    const dueNow = items.filter((item) => item.dueAt <= now).length;
    const dueToday = items.filter((item) => item.dueAt <= todayEnd.getTime()).length;
    const dueThisWeek = items.filter((item) => item.dueAt <= weekEnd.getTime()).length;

    // Calculate stats by module
    const byModule = {};
    const moduleTypes = ['vocabulary', 'kanji', 'hanzi', 'grammar', 'character', 'reading'];
    for (const type of moduleTypes) {
      const moduleItems = items.filter((item) => item.itemType === type);
      if (moduleItems.length > 0) {
        byModule[type] = {
          total: moduleItems.length,
          dueNow: moduleItems.filter((item) => item.dueAt <= now).length,
          averageEaseFactor:
            moduleItems.reduce((sum, item) => sum + item.easeFactor, 0) / moduleItems.length,
        };
      }
    }

    // Calculate mastery levels
    const newItems = items.filter((item) => item.repetitions === 0).length;
    const learningItems = items.filter(
      (item) => item.repetitions > 0 && item.interval < 1
    ).length;
    const reviewItems = items.filter(
      (item) => item.interval >= 1 && item.interval < 21
    ).length;
    const masteredItems = items.filter((item) => item.interval >= 21).length;

    return {
      totalItems: items.length,
      dueNow,
      dueToday,
      dueThisWeek,
      averageEaseFactor:
        items.length > 0
          ? items.reduce((sum, item) => sum + item.easeFactor, 0) / items.length
          : DEFAULT_EASE_FACTOR,
      byModule,
      newItems,
      learningItems,
      reviewItems,
      masteredItems,
    };
  },
});

/**
 * Add an item to the review queue
 */
export const addItem = mutation({
  args: {
    itemId: v.string(),
    itemType: v.union(
      v.literal('vocabulary'),
      v.literal('kanji'),
      v.literal('hanzi'),
      v.literal('grammar'),
      v.literal('character'),
      v.literal('reading')
    ),
    languageCode: v.string(),
    lessonId: v.optional(v.string()),
    pathId: v.optional(v.string()),
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

    // Check if item already exists
    const existing = await ctx.db
      .query("reviewQueue")
      .withIndex("by_userId_item", (q) => q.eq("userId", userId).eq("itemId", args.itemId))
      .first();

    if (existing) {
      // Update preview data if item exists
      await ctx.db.patch(existing._id, { preview: args.preview });
      return { success: true, id: existing._id, isNew: false };
    }

    // Add new item with initial SRS data
    const id = await ctx.db.insert("reviewQueue", {
      userId,
      itemId: args.itemId,
      itemType: args.itemType,
      languageCode: args.languageCode,
      lessonId: args.lessonId,
      pathId: args.pathId,
      dueAt: Date.now(), // Due immediately for new items
      interval: 0,
      easeFactor: DEFAULT_EASE_FACTOR,
      repetitions: 0,
      preview: args.preview,
    });

    return { success: true, id, isNew: true };
  },
});

/**
 * Add multiple items to the review queue (from a lesson)
 */
export const addItemsFromLesson = mutation({
  args: {
    items: v.array(
      v.object({
        itemId: v.string(),
        itemType: v.union(
          v.literal('vocabulary'),
          v.literal('kanji'),
          v.literal('hanzi'),
          v.literal('grammar'),
          v.literal('character'),
          v.literal('reading')
        ),
        preview: v.object({
          front: v.string(),
          back: v.string(),
          reading: v.optional(v.string()),
          audioUrl: v.optional(v.string()),
        }),
      })
    ),
    languageCode: v.string(),
    lessonId: v.string(),
    pathId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    let added = 0;
    let updated = 0;

    for (const item of args.items) {
      const existing = await ctx.db
        .query("reviewQueue")
        .withIndex("by_userId_item", (q) => q.eq("userId", userId).eq("itemId", item.itemId))
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, { preview: item.preview });
        updated++;
      } else {
        await ctx.db.insert("reviewQueue", {
          userId,
          itemId: item.itemId,
          itemType: item.itemType,
          languageCode: args.languageCode,
          lessonId: args.lessonId,
          pathId: args.pathId,
          dueAt: Date.now(),
          interval: 0,
          easeFactor: DEFAULT_EASE_FACTOR,
          repetitions: 0,
          preview: item.preview,
        });
        added++;
      }
    }

    return { success: true, added, updated };
  },
});

/**
 * Record a review and update SRS data
 */
export const recordReview = mutation({
  args: {
    itemId: v.string(),
    quality: v.number(), // 0-5
    timeSpentSeconds: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const item = await ctx.db
      .query("reviewQueue")
      .withIndex("by_userId_item", (q) => q.eq("userId", userId).eq("itemId", args.itemId))
      .first();

    if (!item) {
      throw new Error("Item not found in review queue");
    }

    // Calculate next review using SM-2
    const { interval, easeFactor, repetitions, dueAt } = calculateNextReview(
      args.quality,
      item.repetitions,
      item.easeFactor,
      item.interval
    );

    // Update the item
    await ctx.db.patch(item._id, {
      interval,
      easeFactor,
      repetitions,
      dueAt,
      lastReview: Date.now(),
      lastQuality: args.quality,
    });

    return {
      success: true,
      correct: args.quality >= 3,
      newInterval: interval,
      newDueAt: dueAt,
    };
  },
});

/**
 * Get a single item from the queue
 */
export const getItem = query({
  args: {
    itemId: v.string(),
  },
  handler: async (ctx, { itemId }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return null;
    }

    const item = await ctx.db
      .query("reviewQueue")
      .withIndex("by_userId_item", (q) => q.eq("userId", userId).eq("itemId", itemId))
      .first();

    return item;
  },
});

/**
 * Remove an item from the queue
 */
export const removeItem = mutation({
  args: {
    itemId: v.string(),
  },
  handler: async (ctx, { itemId }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const item = await ctx.db
      .query("reviewQueue")
      .withIndex("by_userId_item", (q) => q.eq("userId", userId).eq("itemId", itemId))
      .first();

    if (item) {
      await ctx.db.delete(item._id);
      return { success: true };
    }

    return { success: false, error: "Item not found" };
  },
});

/**
 * Reset item to initial state (for relearning)
 */
export const resetItem = mutation({
  args: {
    itemId: v.string(),
  },
  handler: async (ctx, { itemId }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const item = await ctx.db
      .query("reviewQueue")
      .withIndex("by_userId_item", (q) => q.eq("userId", userId).eq("itemId", itemId))
      .first();

    if (!item) {
      throw new Error("Item not found");
    }

    await ctx.db.patch(item._id, {
      dueAt: Date.now(),
      interval: 0,
      easeFactor: DEFAULT_EASE_FACTOR,
      repetitions: 0,
      lastReview: undefined,
      lastQuality: undefined,
    });

    return { success: true };
  },
});

/**
 * Get items by module type
 */
export const getItemsByType = query({
  args: {
    itemType: v.string(),
    languageCode: v.optional(v.string()),
  },
  handler: async (ctx, { itemType, languageCode }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return [];
    }

    let items = await ctx.db
      .query("reviewQueue")
      .withIndex("by_userId_type", (q) => q.eq("userId", userId).eq("itemType", itemType))
      .collect();

    if (languageCode) {
      items = items.filter((item) => item.languageCode === languageCode);
    }

    return items;
  },
});
