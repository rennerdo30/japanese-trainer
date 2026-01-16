import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  // Convex Auth required tables (automatically includes users, authAccounts, sessions, etc.)
  ...authTables,

  userData: defineTable({
    userId: v.string(),
    targetLanguage: v.optional(v.string()), // 'ja', 'es', 'ko', 'zh' etc.
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

  // Learning Paths - tracks user enrollment and progress in learning paths
  learningPaths: defineTable({
    userId: v.string(),
    activePaths: v.array(v.object({
      pathId: v.string(),
      startedAt: v.number(),
      currentMilestone: v.number(),
      completed: v.boolean(),
      completedAt: v.optional(v.number()),
    })),
    pathPreferences: v.object({
      preferStructured: v.boolean(),
      showPrerequisiteWarnings: v.boolean(),
      autoEnrollInPaths: v.boolean(),
    }),
  })
    .index("by_userId", ["userId"]),

  // Review Sessions - tracks individual review session analytics
  reviewSessions: defineTable({
    userId: v.string(),
    sessionId: v.string(),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    itemsReviewed: v.number(),
    accuracy: v.number(),
    moduleBreakdown: v.object({
      vocabulary: v.object({ reviewed: v.number(), correct: v.number() }),
      kanji: v.object({ reviewed: v.number(), correct: v.number() }),
      grammar: v.object({ reviewed: v.number(), correct: v.number() }),
    }),
  })
    .index("by_userId", ["userId"])
    .index("by_sessionId", ["sessionId"]),

  // SRS Settings - user-configurable spaced repetition settings
  srsSettings: defineTable({
    userId: v.string(),
    settings: v.object({
      // Review scheduling
      dailyNewItemsLimit: v.number(), // Default: 20
      dailyReviewLimit: v.number(), // Default: 100 (0 = unlimited)
      reviewThreshold: v.string(), // 'strict' | 'moderate' | 'relaxed'

      // Difficulty adjustments
      easeBonus: v.number(), // -0.2 to 0.2, default 0
      intervalMultiplier: v.number(), // 0.5 to 2.0, default 1.0
      lapseNewInterval: v.number(), // 0 to 1.0, default 0.5

      // Review modes
      autoplayAudio: v.boolean(),
      showReadingHints: v.boolean(),
      requiredAccuracy: v.number(), // 0.6 to 1.0, default 0.75

      // Notifications
      reviewReminders: v.boolean(),
      reminderTime: v.string(), // "HH:MM" format
      reminderThreshold: v.number(), // Remind when > X items due
    }),
  })
    .index("by_userId", ["userId"]),

  // Daily Activity - tracks daily study activity for streak calendar
  dailyActivity: defineTable({
    userId: v.string(),
    date: v.string(), // "YYYY-MM-DD" format
    studyTimeMinutes: v.number(),
    itemsLearned: v.number(),
    itemsReviewed: v.number(),
    modules: v.object({
      alphabet: v.optional(v.number()),
      vocabulary: v.optional(v.number()),
      kanji: v.optional(v.number()),
      grammar: v.optional(v.number()),
      reading: v.optional(v.number()),
      listening: v.optional(v.number()),
    }),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_date", ["userId", "date"]),
});
