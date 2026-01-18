import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Helper: Get Monday of a given week
 */
function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Helper: Format date as YYYY-MM-DD
 */
function formatDate(date) {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

/**
 * Get the current week's report
 */
export const getCurrentWeekReport = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const weekStart = formatDate(getWeekStart(new Date()));

    const report = await ctx.db
      .query("weeklyReports")
      .withIndex("by_userId_weekStart", (q) =>
        q.eq("userId", userId).eq("weekStart", weekStart)
      )
      .first();

    return report;
  },
});

/**
 * Get recent weekly reports
 */
export const getRecentReports = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { limit = 4 }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const reports = await ctx.db
      .query("weeklyReports")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit);

    return reports;
  },
});

/**
 * Get a specific week's report
 */
export const getWeekReport = query({
  args: {
    weekStart: v.string(),
  },
  handler: async (ctx, { weekStart }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const report = await ctx.db
      .query("weeklyReports")
      .withIndex("by_userId_weekStart", (q) =>
        q.eq("userId", userId).eq("weekStart", weekStart)
      )
      .first();

    return report;
  },
});

/**
 * Generate or update a weekly report
 * This would typically be called by a cron job or when user views reports
 */
export const generateWeeklyReport = mutation({
  args: {
    weekStart: v.optional(v.string()), // If not provided, generate for current week
  },
  handler: async (ctx, { weekStart: inputWeekStart }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    // Determine the week to generate report for
    const weekStartDate = inputWeekStart
      ? new Date(inputWeekStart)
      : getWeekStart(new Date());
    const weekStart = formatDate(weekStartDate);

    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekEndDate.getDate() + 6);
    const weekEnd = formatDate(weekEndDate);

    // Check if report already exists
    const existingReport = await ctx.db
      .query("weeklyReports")
      .withIndex("by_userId_weekStart", (q) =>
        q.eq("userId", userId).eq("weekStart", weekStart)
      )
      .first();

    // Get daily activities for the week
    const dailyActivities = await ctx.db
      .query("dailyActivity")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    // Filter activities for this week
    const weekActivities = dailyActivities.filter((activity) => {
      return activity.date >= weekStart && activity.date <= weekEnd;
    });

    // Calculate stats
    const stats = {
      totalStudyTimeMinutes: weekActivities.reduce(
        (sum, a) => sum + (a.studyTimeMinutes || 0),
        0
      ),
      lessonsCompleted: weekActivities.reduce(
        (sum, a) => sum + (a.itemsLearned || 0),
        0
      ),
      exercisesCompleted: weekActivities.reduce(
        (sum, a) => sum + (a.itemsReviewed || 0),
        0
      ),
      accuracy: 0, // Would need to calculate from review sessions
      xpEarned: 0, // Would need to calculate from gamification data
      streakDays: weekActivities.length,
      newWordsLearned: weekActivities.reduce(
        (sum, a) => sum + (a.modules?.vocabulary || 0),
        0
      ),
      newKanjiLearned: weekActivities.reduce(
        (sum, a) => sum + (a.modules?.kanji || 0),
        0
      ),
    };

    // Generate highlights
    const highlights = [];
    if (stats.streakDays === 7) {
      highlights.push("Perfect week! You studied every day.");
    }
    if (stats.lessonsCompleted >= 10) {
      highlights.push(`Completed ${stats.lessonsCompleted} lessons this week!`);
    }
    if (stats.totalStudyTimeMinutes >= 60) {
      highlights.push(
        `Studied for ${Math.round(stats.totalStudyTimeMinutes / 60)} hours this week.`
      );
    }

    // Get previous week's report for comparison
    const prevWeekStart = new Date(weekStartDate);
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);
    const prevWeekReport = await ctx.db
      .query("weeklyReports")
      .withIndex("by_userId_weekStart", (q) =>
        q.eq("userId", userId).eq("weekStart", formatDate(prevWeekStart))
      )
      .first();

    let comparison;
    if (prevWeekReport) {
      const prevStats = prevWeekReport.stats;
      comparison = {
        studyTimeChange:
          prevStats.totalStudyTimeMinutes > 0
            ? Math.round(
                ((stats.totalStudyTimeMinutes - prevStats.totalStudyTimeMinutes) /
                  prevStats.totalStudyTimeMinutes) *
                  100
              )
            : 0,
        lessonsChange:
          prevStats.lessonsCompleted > 0
            ? Math.round(
                ((stats.lessonsCompleted - prevStats.lessonsCompleted) /
                  prevStats.lessonsCompleted) *
                  100
              )
            : 0,
        accuracyChange: stats.accuracy - prevStats.accuracy,
      };
    }

    const reportData = {
      userId,
      weekStart,
      weekEnd,
      generatedAt: Date.now(),
      stats,
      comparison,
      highlights: highlights.length > 0 ? highlights : undefined,
    };

    if (existingReport) {
      // Update existing report
      await ctx.db.patch(existingReport._id, reportData);
    } else {
      // Create new report
      await ctx.db.insert("weeklyReports", reportData);
    }

    return { success: true, report: reportData };
  },
});
