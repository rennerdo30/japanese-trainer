import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { auth } from "./auth";

// Default SRS settings
export const defaultSRSSettings = {
  // Review scheduling
  dailyNewItemsLimit: 20,
  dailyReviewLimit: 100, // 0 = unlimited
  reviewThreshold: "moderate", // 'strict' | 'moderate' | 'relaxed'

  // Difficulty adjustments
  easeBonus: 0, // -0.2 to 0.2
  intervalMultiplier: 1.0, // 0.5 to 2.0
  lapseNewInterval: 0.5, // 0 to 1.0

  // Review modes
  autoplayAudio: true,
  showReadingHints: false,
  requiredAccuracy: 0.75, // 0.6 to 1.0

  // Notifications
  reviewReminders: true,
  reminderTime: "09:00",
  reminderThreshold: 10,
};

// Get user's SRS settings
export const getSRSSettings = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return { settings: defaultSRSSettings };

    const userSettings = await ctx.db
      .query("srsSettings")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!userSettings) {
      return { settings: defaultSRSSettings };
    }

    return { settings: userSettings.settings };
  },
});

// Initialize SRS settings for a user
export const initializeSRSSettings = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("srsSettings")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (existing) return existing._id;

    const id = await ctx.db.insert("srsSettings", {
      userId,
      settings: defaultSRSSettings,
    });

    return id;
  },
});

// Update SRS settings
export const updateSRSSettings = mutation({
  args: {
    settings: v.object({
      dailyNewItemsLimit: v.optional(v.number()),
      dailyReviewLimit: v.optional(v.number()),
      reviewThreshold: v.optional(v.string()),
      easeBonus: v.optional(v.number()),
      intervalMultiplier: v.optional(v.number()),
      lapseNewInterval: v.optional(v.number()),
      autoplayAudio: v.optional(v.boolean()),
      showReadingHints: v.optional(v.boolean()),
      requiredAccuracy: v.optional(v.number()),
      reviewReminders: v.optional(v.boolean()),
      reminderTime: v.optional(v.string()),
      reminderThreshold: v.optional(v.number()),
    }),
  },
  handler: async (ctx, { settings }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    let userSettings = await ctx.db
      .query("srsSettings")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!userSettings) {
      // Create with merged settings
      await ctx.db.insert("srsSettings", {
        userId,
        settings: { ...defaultSRSSettings, ...settings },
      });
      return { success: true };
    }

    // Merge with existing settings
    await ctx.db.patch(userSettings._id, {
      settings: { ...userSettings.settings, ...settings },
    });

    return { success: true };
  },
});

// Reset SRS settings to defaults
export const resetSRSSettings = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const userSettings = await ctx.db
      .query("srsSettings")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!userSettings) {
      await ctx.db.insert("srsSettings", {
        userId,
        settings: defaultSRSSettings,
      });
    } else {
      await ctx.db.patch(userSettings._id, {
        settings: defaultSRSSettings,
      });
    }

    return { success: true };
  },
});

// Get daily activity for streak calendar
export const getDailyActivity = query({
  args: { days: v.optional(v.number()) },
  handler: async (ctx, { days = 365 }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];

    // Get activity from the last N days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];

    const activities = await ctx.db
      .query("dailyActivity")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .filter((q) => q.gte(q.field("date"), startDateStr))
      .collect();

    return activities;
  },
});

// Record daily activity
export const recordDailyActivity = mutation({
  args: {
    studyTimeMinutes: v.optional(v.number()),
    itemsLearned: v.optional(v.number()),
    itemsReviewed: v.optional(v.number()),
    module: v.optional(v.string()),
    moduleTime: v.optional(v.number()),
  },
  handler: async (ctx, { studyTimeMinutes, itemsLearned, itemsReviewed, module, moduleTime }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const today = new Date().toISOString().split('T')[0];

    let activity = await ctx.db
      .query("dailyActivity")
      .withIndex("by_userId_date", (q) => q.eq("userId", userId).eq("date", today))
      .first();

    if (!activity) {
      const newActivity = {
        userId,
        date: today,
        studyTimeMinutes: studyTimeMinutes || 0,
        itemsLearned: itemsLearned || 0,
        itemsReviewed: itemsReviewed || 0,
        modules: {},
      };

      if (module && moduleTime) {
        newActivity.modules[module] = moduleTime;
      }

      await ctx.db.insert("dailyActivity", newActivity);
    } else {
      const updates = {};

      if (studyTimeMinutes !== undefined) {
        updates.studyTimeMinutes = activity.studyTimeMinutes + studyTimeMinutes;
      }
      if (itemsLearned !== undefined) {
        updates.itemsLearned = activity.itemsLearned + itemsLearned;
      }
      if (itemsReviewed !== undefined) {
        updates.itemsReviewed = activity.itemsReviewed + itemsReviewed;
      }
      if (module && moduleTime) {
        const currentModuleTime = activity.modules[module] || 0;
        updates.modules = {
          ...activity.modules,
          [module]: currentModuleTime + moduleTime,
        };
      }

      if (Object.keys(updates).length > 0) {
        await ctx.db.patch(activity._id, updates);
      }
    }

    return { success: true };
  },
});
