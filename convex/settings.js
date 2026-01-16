import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

// Get settings
export const getSettings = query({
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const settings = await ctx.db
      .query("userSettings")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    return settings?.settings || null;
  },
});

// Save settings
export const saveSettings = mutation({
  args: {
    settings: v.any(),
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
        settings: args.settings,
      });
      return existing._id;
    } else {
      const id = await ctx.db.insert("userSettings", {
        userId: userId,
        settings: args.settings,
      });
      return id;
    }
  },
});

// Update a single setting
export const updateSetting = mutation({
  args: {
    key: v.string(),
    value: v.any(),
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

    if (!existing) {
      throw new Error("Settings not found");
    }

    await ctx.db.patch(existing._id, {
      settings: {
        ...existing.settings,
        [args.key]: args.value,
      },
    });

    return { success: true };
  },
});
