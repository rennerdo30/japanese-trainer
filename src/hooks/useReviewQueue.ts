'use client';

import { useCallback, useMemo } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type {
  ReviewQueueItem,
  ReviewQueueStats,
  ReviewQuality,
  ReviewItemType,
  ReviewItemPreview,
} from '@/types/reviews';

interface UseReviewQueueReturn {
  // Data
  dueItems: ReviewQueueItem[];
  stats: ReviewQueueStats | null;
  isLoading: boolean;

  // Computed values
  totalDue: number;
  dueToday: number;
  moduleBreakdown: Record<string, { total: number; dueNow: number }>;

  // Actions
  addItem: (
    itemId: string,
    itemType: ReviewItemType,
    languageCode: string,
    preview: ReviewItemPreview,
    lessonId?: string,
    pathId?: string
  ) => Promise<{ success: boolean; isNew: boolean }>;

  addItemsFromLesson: (
    items: Array<{
      itemId: string;
      itemType: ReviewItemType;
      preview: ReviewItemPreview;
    }>,
    languageCode: string,
    lessonId: string,
    pathId?: string
  ) => Promise<{ added: number; updated: number }>;

  recordReview: (
    itemId: string,
    quality: ReviewQuality,
    timeSpentSeconds?: number
  ) => Promise<{ correct: boolean; newInterval: number }>;

  removeItem: (itemId: string) => Promise<void>;
  resetItem: (itemId: string) => Promise<void>;

  // Get next item for review
  getNextItem: () => ReviewQueueItem | null;
}

export function useReviewQueue(
  languageCode?: string,
  itemType?: ReviewItemType
): UseReviewQueueReturn {
  // Query due items
  const dueItemsData = useQuery(
    api.reviewQueue.getDueItems,
    languageCode || itemType
      ? { languageCode, itemType, limit: 100 }
      : { limit: 100 }
  );

  // Query stats
  const statsData = useQuery(
    api.reviewQueue.getQueueStats,
    languageCode ? { languageCode } : {}
  );

  // Mutations
  const addItemMutation = useMutation(api.reviewQueue.addItem);
  const addItemsFromLessonMutation = useMutation(api.reviewQueue.addItemsFromLesson);
  const recordReviewMutation = useMutation(api.reviewQueue.recordReview);
  const removeItemMutation = useMutation(api.reviewQueue.removeItem);
  const resetItemMutation = useMutation(api.reviewQueue.resetItem);

  // Transform data to match types
  const dueItems = useMemo((): ReviewQueueItem[] => {
    if (!dueItemsData) return [];
    return dueItemsData.map((item) => ({
      id: item._id,
      itemId: item.itemId,
      itemType: item.itemType as ReviewItemType,
      lessonId: item.lessonId || '',
      pathId: item.pathId,
      languageCode: item.languageCode,
      dueAt: item.dueAt,
      interval: item.interval,
      easeFactor: item.easeFactor,
      repetitions: item.repetitions,
      lastReview: item.lastReview,
      lastQuality: item.lastQuality,
      preview: item.preview as ReviewItemPreview,
    }));
  }, [dueItemsData]);

  // Transform stats
  const stats = useMemo((): ReviewQueueStats | null => {
    if (!statsData) return null;
    return {
      totalItems: statsData.totalItems,
      dueNow: statsData.dueNow,
      dueToday: statsData.dueToday,
      dueThisWeek: statsData.dueThisWeek,
      averageEaseFactor: statsData.averageEaseFactor,
      byModule: statsData.byModule as Record<
        ReviewItemType,
        { total: number; dueNow: number; averageEaseFactor: number }
      >,
      newItems: statsData.newItems,
      learningItems: statsData.learningItems,
      reviewItems: statsData.reviewItems,
      masteredItems: statsData.masteredItems,
    };
  }, [statsData]);

  // Computed values
  const totalDue = stats?.dueNow ?? 0;
  const dueToday = stats?.dueToday ?? 0;
  const moduleBreakdown = useMemo(() => {
    if (!stats?.byModule) return {};
    const breakdown: Record<string, { total: number; dueNow: number }> = {};
    for (const [key, value] of Object.entries(stats.byModule)) {
      breakdown[key] = { total: value.total, dueNow: value.dueNow };
    }
    return breakdown;
  }, [stats]);

  // Add item action
  const addItem = useCallback(
    async (
      itemId: string,
      itemType: ReviewItemType,
      langCode: string,
      preview: ReviewItemPreview,
      lessonId?: string,
      pathId?: string
    ) => {
      const result = await addItemMutation({
        itemId,
        itemType,
        languageCode: langCode,
        preview,
        lessonId,
        pathId,
      });
      return { success: result.success, isNew: result.isNew };
    },
    [addItemMutation]
  );

  // Add items from lesson
  const addItemsFromLesson = useCallback(
    async (
      items: Array<{
        itemId: string;
        itemType: ReviewItemType;
        preview: ReviewItemPreview;
      }>,
      langCode: string,
      lessonId: string,
      pathId?: string
    ) => {
      const result = await addItemsFromLessonMutation({
        items,
        languageCode: langCode,
        lessonId,
        pathId,
      });
      return { added: result.added, updated: result.updated };
    },
    [addItemsFromLessonMutation]
  );

  // Record review
  const recordReview = useCallback(
    async (itemId: string, quality: ReviewQuality, timeSpentSeconds?: number) => {
      const result = await recordReviewMutation({
        itemId,
        quality,
        timeSpentSeconds,
      });
      return { correct: result.correct, newInterval: result.newInterval };
    },
    [recordReviewMutation]
  );

  // Remove item
  const removeItem = useCallback(
    async (itemId: string) => {
      await removeItemMutation({ itemId });
    },
    [removeItemMutation]
  );

  // Reset item
  const resetItem = useCallback(
    async (itemId: string) => {
      await resetItemMutation({ itemId });
    },
    [resetItemMutation]
  );

  // Get next item
  const getNextItem = useCallback((): ReviewQueueItem | null => {
    if (dueItems.length === 0) return null;
    // Return the first due item (they're already sorted by due date)
    return dueItems[0];
  }, [dueItems]);

  return {
    dueItems,
    stats,
    isLoading: dueItemsData === undefined,
    totalDue,
    dueToday,
    moduleBreakdown,
    addItem,
    addItemsFromLesson,
    recordReview,
    removeItem,
    resetItem,
    getNextItem,
  };
}

export default useReviewQueue;
