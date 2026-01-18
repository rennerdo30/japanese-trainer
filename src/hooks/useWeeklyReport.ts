'use client';

import { useCallback, useMemo } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

interface WeeklyStats {
  totalStudyTimeMinutes: number;
  lessonsCompleted: number;
  exercisesCompleted: number;
  accuracy: number;
  xpEarned: number;
  streakDays: number;
  newWordsLearned: number;
  newKanjiLearned: number;
}

interface WeeklyComparison {
  studyTimeChange: number;
  lessonsChange: number;
  accuracyChange: number;
}

interface WeeklyReport {
  weekStart: string;
  weekEnd: string;
  generatedAt: number;
  stats: WeeklyStats;
  comparison?: WeeklyComparison;
  highlights?: string[];
}

interface UseWeeklyReportReturn {
  // Current week's report
  currentReport: WeeklyReport | null;

  // Recent reports (last 4 weeks)
  recentReports: WeeklyReport[];

  // Loading state
  isLoading: boolean;

  // Get report for specific week
  getReport: (weekStart: string) => WeeklyReport | null;

  // Generate/update report
  generateReport: (weekStart?: string) => Promise<{ success: boolean }>;

  // Computed values
  weeklyProgress: {
    studyTimeFormatted: string;
    lessonsCount: number;
    accuracy: number;
    streakDays: number;
    xpEarned: number;
  } | null;

  // Comparison indicators
  trends: {
    studyTime: 'up' | 'down' | 'same';
    lessons: 'up' | 'down' | 'same';
    accuracy: 'up' | 'down' | 'same';
  } | null;
}

export function useWeeklyReport(): UseWeeklyReportReturn {
  // Query current week's report
  const currentReportData = useQuery(api.weeklyReports.getCurrentWeekReport);

  // Query recent reports
  const recentReportsData = useQuery(api.weeklyReports.getRecentReports, { limit: 4 });

  // Mutation to generate report
  const generateReportMutation = useMutation(api.weeklyReports.generateWeeklyReport);

  // Transform current report
  const currentReport = useMemo((): WeeklyReport | null => {
    if (!currentReportData) return null;
    return {
      weekStart: currentReportData.weekStart,
      weekEnd: currentReportData.weekEnd,
      generatedAt: currentReportData.generatedAt,
      stats: currentReportData.stats,
      comparison: currentReportData.comparison,
      highlights: currentReportData.highlights,
    };
  }, [currentReportData]);

  // Transform recent reports
  const recentReports = useMemo((): WeeklyReport[] => {
    if (!recentReportsData) return [];
    return recentReportsData.map((report) => ({
      weekStart: report.weekStart,
      weekEnd: report.weekEnd,
      generatedAt: report.generatedAt,
      stats: report.stats,
      comparison: report.comparison,
      highlights: report.highlights,
    }));
  }, [recentReportsData]);

  // Get report for specific week
  const getReport = useCallback(
    (weekStart: string): WeeklyReport | null => {
      return recentReports.find((r) => r.weekStart === weekStart) ?? null;
    },
    [recentReports]
  );

  // Generate report
  const generateReport = useCallback(
    async (weekStart?: string) => {
      const result = await generateReportMutation({ weekStart });
      return { success: result.success };
    },
    [generateReportMutation]
  );

  // Computed weekly progress
  const weeklyProgress = useMemo(() => {
    if (!currentReport) return null;
    const { stats } = currentReport;

    // Format study time
    const hours = Math.floor(stats.totalStudyTimeMinutes / 60);
    const minutes = stats.totalStudyTimeMinutes % 60;
    const studyTimeFormatted = hours > 0
      ? `${hours}h ${minutes}m`
      : `${minutes}m`;

    return {
      studyTimeFormatted,
      lessonsCount: stats.lessonsCompleted,
      accuracy: stats.accuracy,
      streakDays: stats.streakDays,
      xpEarned: stats.xpEarned,
    };
  }, [currentReport]);

  // Comparison trends
  const trends = useMemo(() => {
    if (!currentReport?.comparison) return null;
    const { comparison } = currentReport;

    const getTrend = (value: number): 'up' | 'down' | 'same' => {
      if (value > 5) return 'up';
      if (value < -5) return 'down';
      return 'same';
    };

    return {
      studyTime: getTrend(comparison.studyTimeChange),
      lessons: getTrend(comparison.lessonsChange),
      accuracy: getTrend(comparison.accuracyChange),
    };
  }, [currentReport]);

  return {
    currentReport,
    recentReports,
    isLoading: currentReportData === undefined,
    getReport,
    generateReport,
    weeklyProgress,
    trends,
  };
}

export default useWeeklyReport;
