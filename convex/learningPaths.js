import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { auth } from "./auth";

// Default path preferences
const defaultPathPreferences = {
  preferStructured: true,
  showPrerequisiteWarnings: true,
  autoEnrollInPaths: false,
};

// Get user's learning paths
export const getUserPaths = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;

    const paths = await ctx.db
      .query("learningPaths")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    return paths;
  },
});

// Get a specific active path
export const getActivePath = query({
  args: { pathId: v.string() },
  handler: async (ctx, { pathId }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;

    const paths = await ctx.db
      .query("learningPaths")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!paths) return null;

    return paths.activePaths.find(p => p.pathId === pathId) || null;
  },
});

// Initialize learning paths for a new user
export const initializePaths = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("learningPaths")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (existing) return existing._id;

    const id = await ctx.db.insert("learningPaths", {
      userId,
      activePaths: [],
      pathPreferences: defaultPathPreferences,
    });

    return id;
  },
});

// Enroll in a learning path
export const enrollInPath = mutation({
  args: { pathId: v.string() },
  handler: async (ctx, { pathId }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    let paths = await ctx.db
      .query("learningPaths")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    // Create if doesn't exist
    if (!paths) {
      const id = await ctx.db.insert("learningPaths", {
        userId,
        activePaths: [],
        pathPreferences: defaultPathPreferences,
      });
      paths = await ctx.db.get(id);
    }

    // Check if already enrolled
    if (paths.activePaths.some(p => p.pathId === pathId)) {
      return { success: false, error: "Already enrolled in this path" };
    }

    // Add new path
    const newPath = {
      pathId,
      startedAt: Date.now(),
      currentMilestone: 0,
      completed: false,
    };

    await ctx.db.patch(paths._id, {
      activePaths: [...paths.activePaths, newPath],
    });

    return { success: true };
  },
});

// Unenroll from a learning path
export const unenrollFromPath = mutation({
  args: { pathId: v.string() },
  handler: async (ctx, { pathId }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const paths = await ctx.db
      .query("learningPaths")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!paths) {
      return { success: false, error: "No learning paths found" };
    }

    const updatedPaths = paths.activePaths.filter(p => p.pathId !== pathId);

    await ctx.db.patch(paths._id, {
      activePaths: updatedPaths,
    });

    return { success: true };
  },
});

// Update path progress
export const updatePathProgress = mutation({
  args: {
    pathId: v.string(),
    currentMilestone: v.number(),
    completed: v.optional(v.boolean()),
  },
  handler: async (ctx, { pathId, currentMilestone, completed }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const paths = await ctx.db
      .query("learningPaths")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!paths) {
      return { success: false, error: "No learning paths found" };
    }

    const updatedPaths = paths.activePaths.map(p => {
      if (p.pathId !== pathId) return p;
      return {
        ...p,
        currentMilestone,
        completed: completed ?? p.completed,
        completedAt: completed ? Date.now() : p.completedAt,
      };
    });

    await ctx.db.patch(paths._id, {
      activePaths: updatedPaths,
    });

    return { success: true };
  },
});

// Update path preferences
export const updatePathPreferences = mutation({
  args: {
    preferStructured: v.optional(v.boolean()),
    showPrerequisiteWarnings: v.optional(v.boolean()),
    autoEnrollInPaths: v.optional(v.boolean()),
  },
  handler: async (ctx, updates) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    let paths = await ctx.db
      .query("learningPaths")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!paths) {
      const id = await ctx.db.insert("learningPaths", {
        userId,
        activePaths: [],
        pathPreferences: {
          ...defaultPathPreferences,
          ...updates,
        },
      });
      return { success: true };
    }

    await ctx.db.patch(paths._id, {
      pathPreferences: {
        ...paths.pathPreferences,
        ...updates,
      },
    });

    return { success: true };
  },
});

// Track module access for preference learning
export const trackModuleAccess = mutation({
  args: {
    module: v.string(),
    duration: v.number(), // seconds spent
  },
  handler: async (ctx, { module, duration }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return;

    // Get or create today's activity
    const today = new Date().toISOString().split('T')[0];

    let activity = await ctx.db
      .query("dailyActivity")
      .withIndex("by_userId_date", (q) => q.eq("userId", userId).eq("date", today))
      .first();

    if (!activity) {
      await ctx.db.insert("dailyActivity", {
        userId,
        date: today,
        studyTimeMinutes: Math.round(duration / 60),
        itemsLearned: 0,
        itemsReviewed: 0,
        modules: {
          [module]: Math.round(duration / 60),
        },
      });
    } else {
      const currentModuleTime = activity.modules[module] || 0;
      await ctx.db.patch(activity._id, {
        studyTimeMinutes: activity.studyTimeMinutes + Math.round(duration / 60),
        modules: {
          ...activity.modules,
          [module]: currentModuleTime + Math.round(duration / 60),
        },
      });
    }
  },
});
