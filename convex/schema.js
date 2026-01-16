import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  // Convex Auth required tables (automatically includes users, authAccounts, sessions, etc.)
  ...authTables,

  userData: defineTable({
    userId: v.string(),
    modules: v.object({
      alphabet: v.object({
        learned: v.array(v.string()),
        reviews: v.object({}),
        stats: v.object({
          correct: v.number(),
          total: v.number(),
          streak: v.number(),
          bestStreak: v.number(),
        }),
      }),
      vocabulary: v.object({
        learned: v.array(v.string()),
        reviews: v.object({}),
        stats: v.object({
          correct: v.number(),
          total: v.number(),
          streak: v.number(),
          bestStreak: v.number(),
          wordsMastered: v.number(),
        }),
      }),
      kanji: v.object({
        learned: v.array(v.string()),
        reviews: v.object({}),
        stats: v.object({
          correct: v.number(),
          total: v.number(),
          streak: v.number(),
          bestStreak: v.number(),
          kanjiMastered: v.number(),
        }),
      }),
      grammar: v.object({
        learned: v.array(v.string()),
        reviews: v.object({}),
        stats: v.object({
          correct: v.number(),
          total: v.number(),
          streak: v.number(),
          bestStreak: v.number(),
          pointsMastered: v.number(),
        }),
      }),
      reading: v.object({
        completed: v.array(v.string()),
        stats: v.object({
          textsRead: v.number(),
          comprehensionScore: v.number(),
        }),
      }),
      listening: v.object({
        completed: v.array(v.string()),
        stats: v.object({
          exercisesCompleted: v.number(),
          accuracy: v.number(),
        }),
      }),
    }),
    globalStats: v.object({
      streak: v.number(),
      bestStreak: v.number(),
      totalStudyTime: v.number(),
      lastActive: v.union(v.number(), v.null()),
      createdAt: v.number(),
    }),
  })
    .index("by_userId", ["userId"]),

  userSettings: defineTable({
    userId: v.string(),
    settings: v.object({
      theme: v.string(),
      soundEnabled: v.boolean(),
      ttsEnabled: v.boolean(),
      ttsRate: v.number(),
      ttsVolume: v.number(),
      timerEnabled: v.boolean(),
      timerDuration: v.number(),
    }),
  })
    .index("by_userId", ["userId"]),
});
