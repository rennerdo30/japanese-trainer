import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

// Get user data
export const getUserData = query({
  handler: async (ctx) => {
    const sessionId = await auth.getSessionId(ctx);
    if (!sessionId) {
      throw new Error("Not authenticated");
    }
    
    const session = await auth.store.getSession(ctx, sessionId);
    if (!session) {
      throw new Error("Not authenticated");
    }
    
    const userId = session.userId;
    const userData = await ctx.db
      .query("userData")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    
    return userData;
  },
});

// Save user data
export const saveUserData = mutation({
  args: {
    data: v.any(), // Full data object
  },
  handler: async (ctx, args) => {
    const sessionId = await auth.getSessionId(ctx);
    if (!sessionId) {
      throw new Error("Not authenticated");
    }
    
    const session = await auth.store.getSession(ctx, sessionId);
    if (!session) {
      throw new Error("Not authenticated");
    }
    
    const userId = session.userId;
    const existing = await ctx.db
      .query("userData")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    
    if (existing) {
      await ctx.db.patch(existing._id, {
        modules: args.data.modules,
        globalStats: args.data.globalStats,
      });
      return existing._id;
    } else {
      const id = await ctx.db.insert("userData", {
        userId: userId,
        modules: args.data.modules,
        globalStats: args.data.globalStats,
      });
      return id;
    }
  },
});

// Update module data
export const updateModule = mutation({
  args: {
    moduleName: v.string(),
    moduleData: v.any(),
  },
  handler: async (ctx, args) => {
    const sessionId = await auth.getSessionId(ctx);
    if (!sessionId) {
      throw new Error("Not authenticated");
    }
    
    const session = await auth.store.getSession(ctx, sessionId);
    if (!session) {
      throw new Error("Not authenticated");
    }
    
    const userId = session.userId;
    const userData = await ctx.db
      .query("userData")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    
    if (!userData) {
      throw new Error("User data not found");
    }
    
    const updatedModules = {
      ...userData.modules,
      [args.moduleName]: args.moduleData,
    };
    
    await ctx.db.patch(userData._id, {
      modules: updatedModules,
    });
    
    return { success: true };
  },
});

// Update global stats
export const updateGlobalStats = mutation({
  args: {
    stats: v.any(),
  },
  handler: async (ctx, args) => {
    const sessionId = await auth.getSessionId(ctx);
    if (!sessionId) {
      throw new Error("Not authenticated");
    }
    
    const session = await auth.store.getSession(ctx, sessionId);
    if (!session) {
      throw new Error("Not authenticated");
    }
    
    const userId = session.userId;
    const userData = await ctx.db
      .query("userData")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    
    if (!userData) {
      throw new Error("User data not found");
    }
    
    await ctx.db.patch(userData._id, {
      globalStats: {
        ...userData.globalStats,
        ...args.stats,
        lastActive: Date.now(),
      },
    });
    
    return { success: true };
  },
});
