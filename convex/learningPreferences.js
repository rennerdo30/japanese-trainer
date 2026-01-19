import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

// Get learning preferences for a language
export const getPreferences = query({
  args: {
    languageCode: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      // Return defaults for non-authenticated users
      return {
        progressionMode: 'linear',
        placementLevel: null,
        placementTakenAt: null,
        skipToLevel: null,
      };
    }

    const prefs = await ctx.db
      .query("learningPreferences")
      .withIndex("by_userId_language", (q) =>
        q.eq("userId", userId).eq("languageCode", args.languageCode)
      )
      .first();

    if (!prefs) {
      // Return defaults
      return {
        progressionMode: 'linear',
        placementLevel: null,
        placementTakenAt: null,
        skipToLevel: null,
      };
    }

    return {
      progressionMode: prefs.progressionMode,
      placementLevel: prefs.placementLevel,
      placementTakenAt: prefs.placementTakenAt,
      skipToLevel: prefs.skipToLevel,
    };
  },
});

// Get all learning preferences for a user
export const getAllPreferences = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return [];
    }

    const prefs = await ctx.db
      .query("learningPreferences")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    return prefs;
  },
});

// Set progression mode
export const setProgressionMode = mutation({
  args: {
    languageCode: v.string(),
    progressionMode: v.union(
      v.literal('linear'),
      v.literal('flexible'),
      v.literal('open')
    ),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const existing = await ctx.db
      .query("learningPreferences")
      .withIndex("by_userId_language", (q) =>
        q.eq("userId", userId).eq("languageCode", args.languageCode)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        progressionMode: args.progressionMode,
      });
      return existing._id;
    } else {
      const id = await ctx.db.insert("learningPreferences", {
        userId,
        languageCode: args.languageCode,
        progressionMode: args.progressionMode,
      });
      return id;
    }
  },
});

// Record placement test result
export const recordPlacementResult = mutation({
  args: {
    languageCode: v.string(),
    placementLevel: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const now = Date.now();

    const existing = await ctx.db
      .query("learningPreferences")
      .withIndex("by_userId_language", (q) =>
        q.eq("userId", userId).eq("languageCode", args.languageCode)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        placementLevel: args.placementLevel,
        placementTakenAt: now,
        progressionMode: 'flexible', // Switch to flexible after placement
      });
      return existing._id;
    } else {
      const id = await ctx.db.insert("learningPreferences", {
        userId,
        languageCode: args.languageCode,
        progressionMode: 'flexible',
        placementLevel: args.placementLevel,
        placementTakenAt: now,
      });
      return id;
    }
  },
});

// Skip to a specific level (unlocks all content up to that level)
export const skipToLevel = mutation({
  args: {
    languageCode: v.string(),
    level: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const existing = await ctx.db
      .query("learningPreferences")
      .withIndex("by_userId_language", (q) =>
        q.eq("userId", userId).eq("languageCode", args.languageCode)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        skipToLevel: args.level,
      });
      return existing._id;
    } else {
      const id = await ctx.db.insert("learningPreferences", {
        userId,
        languageCode: args.languageCode,
        progressionMode: 'flexible',
        skipToLevel: args.level,
      });
      return id;
    }
  },
});

// Reset preferences (for testing or starting over)
export const resetPreferences = mutation({
  args: {
    languageCode: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const existing = await ctx.db
      .query("learningPreferences")
      .withIndex("by_userId_language", (q) =>
        q.eq("userId", userId).eq("languageCode", args.languageCode)
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }

    return { success: true };
  },
});
