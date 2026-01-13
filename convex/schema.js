import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Convex Auth required tables
  users: defineTable({
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    picture: v.optional(v.string()),
    isAnonymous: v.optional(v.boolean()),
  }),

  authAccounts: defineTable({
    userId: v.id("users"),
    provider: v.string(),
    providerAccountId: v.string(),
    secret: v.optional(v.string()),
    emailVerified: v.optional(v.boolean()),
    phoneVerified: v.optional(v.boolean()),
  })
    .index("providerAndAccountId", ["provider", "providerAccountId"])
    .index("by_userId", ["userId"]),

  sessions: defineTable({
    userId: v.id("users"),
    expiresAt: v.number(),
  })
    .index("by_userId", ["userId"]),

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
