'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useTargetLanguage } from '@/hooks/useTargetLanguage';
import {
  loadCurriculum,
  loadLessons,
  getLessonById,
  getCurriculumLesson,
  getLessonContext,
  flattenLessons,
  getNextLesson,
  getPreviousLesson,
  getTotalLessonCount,
} from '@/lib/curriculumLoader';
import type {
  Curriculum,
  CurriculumLesson,
  LessonContext,
  FlattenedLesson,
  LessonProgress,
  LessonStatus,
} from '@/types/curriculum';

interface UseCurriculumReturn {
  // Curriculum data
  curriculum: Curriculum | null;
  isLoading: boolean;
  error: string | null;

  // Flattened lessons for easy iteration
  lessons: FlattenedLesson[];
  totalLessons: number;

  // Lesson lookup
  getLesson: (lessonId: string) => CurriculumLesson | undefined;
  getLessonInfo: (lessonId: string) => LessonContext | null;
  getNextLessonAfter: (lessonId: string) => CurriculumLesson | null;
  getPreviousLessonBefore: (lessonId: string) => CurriculumLesson | null;

  // Progress
  lessonProgress: Map<string, LessonProgress>;
  getLessonStatus: (lessonId: string) => LessonStatus;
  completedCount: number;
  progressPercentage: number;

  // Actions
  startLesson: (lessonId: string) => Promise<void>;
  completeLesson: (lessonId: string, score: number, xpEarned: number) => Promise<void>;
  unlockLesson: (lessonId: string) => Promise<void>;
}

export function useCurriculum(): UseCurriculumReturn {
  const { targetLanguage } = useTargetLanguage();
  const [curriculum, setCurriculum] = useState<Curriculum | null>(null);
  const [lessonData, setLessonData] = useState<CurriculumLesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Query lesson progress from Convex
  const progressData = useQuery(api.lessonProgress.getLessonProgress, {
    languageCode: targetLanguage,
  });

  // Mutations
  const startLessonMutation = useMutation(api.lessonProgress.startLesson);
  const completeLessonMutation = useMutation(api.lessonProgress.completeLesson);
  const unlockLessonMutation = useMutation(api.lessonProgress.unlockLesson);

  // Load curriculum and lessons when language changes
  useEffect(() => {
    let mounted = true;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        // Load both curriculum and lessons in parallel
        const [curriculumData, lessonsData] = await Promise.all([
          loadCurriculum(targetLanguage),
          loadLessons(targetLanguage),
        ]);

        if (mounted) {
          setCurriculum(curriculumData);
          setLessonData(lessonsData);
          if (!curriculumData) {
            setError(`No curriculum available for ${targetLanguage}`);
          }
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load curriculum');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [targetLanguage]);

  // Build progress map from Convex data
  const lessonProgress = useMemo(() => {
    const map = new Map<string, LessonProgress>();
    if (progressData) {
      for (const p of progressData) {
        map.set(p.lessonId, {
          lessonId: p.lessonId,
          status: p.status as LessonStatus,
          startedAt: p.startedAt,
          completedAt: p.completedAt,
          score: p.score,
          xpEarned: p.xpEarned,
          attempts: p.attempts,
        });
      }
    }
    return map;
  }, [progressData]);

  // Get flattened lessons, including lessons from lessons.json
  const lessons = useMemo(() => {
    const flattened: FlattenedLesson[] = [];

    // First add lessons from curriculum.json (legacy)
    if (curriculum) {
      flattened.push(...flattenLessons(curriculum));
    }

    // Then add lessons from lessons.json (new format)
    // These are added as separate flattened entries
    for (const lesson of lessonData) {
      // Check if this lesson ID is not already in the list
      if (!flattened.some((f) => f.lesson.id === lesson.id)) {
        flattened.push({
          lesson,
          levelId: 'A1', // Default level
          unitId: lesson.milestoneId || 'default',
          levelIndex: 0,
          unitIndex: 0,
          lessonIndex: flattened.length,
        });
      }
    }

    return flattened;
  }, [curriculum, lessonData]);

  // Total lesson count (includes both curriculum and lessons.json)
  const totalLessons = useMemo(() => {
    return lessons.length;
  }, [lessons]);

  // Completed count
  const completedCount = useMemo(() => {
    let count = 0;
    for (const progress of lessonProgress.values()) {
      if (progress.status === 'completed') {
        count++;
      }
    }
    return count;
  }, [lessonProgress]);

  // Progress percentage
  const progressPercentage = useMemo(() => {
    if (totalLessons === 0) return 0;
    return Math.round((completedCount / totalLessons) * 100);
  }, [completedCount, totalLessons]);

  // Lesson lookup (checks both curriculum and lessons.json)
  const getLesson = useCallback(
    (lessonId: string): CurriculumLesson | undefined => {
      // First check lessons.json data
      const lessonFromJson = getLessonById(lessonData, lessonId);
      if (lessonFromJson) return lessonFromJson;

      // Then check curriculum data
      if (curriculum) {
        return getCurriculumLesson(curriculum, lessonId);
      }
      return undefined;
    },
    [curriculum, lessonData]
  );

  // Get lesson info (context)
  const getLessonInfo = useCallback(
    (lessonId: string): LessonContext | null => {
      if (!curriculum) return null;
      return getLessonContext(curriculum, lessonId);
    },
    [curriculum]
  );

  // Get next lesson after
  const getNextLessonAfter = useCallback(
    (lessonId: string): CurriculumLesson | null => {
      if (!curriculum) return null;
      return getNextLesson(curriculum, lessonId);
    },
    [curriculum]
  );

  // Get previous lesson before
  const getPreviousLessonBefore = useCallback(
    (lessonId: string): CurriculumLesson | null => {
      if (!curriculum) return null;
      return getPreviousLesson(curriculum, lessonId);
    },
    [curriculum]
  );

  // Get lesson status with fallback logic
  const getLessonStatus = useCallback(
    (lessonId: string): LessonStatus => {
      const progress = lessonProgress.get(lessonId);
      if (progress) {
        return progress.status;
      }

      // Default status logic: first lesson is available, others are locked
      if (lessons.length > 0 && lessons[0].lesson.id === lessonId) {
        return 'available';
      }

      // Check if this is a lesson from lessonData (AI-generated lessons)
      // AI lessons are available by default to allow users to start learning
      const isAILesson = lessonData.some((l) => l.id === lessonId);
      if (isAILesson) {
        return 'available';
      }

      // Check if previous lesson is completed
      const lessonIndex = lessons.findIndex((l) => l.lesson.id === lessonId);
      if (lessonIndex > 0) {
        const prevLessonId = lessons[lessonIndex - 1].lesson.id;
        const prevProgress = lessonProgress.get(prevLessonId);
        if (prevProgress?.status === 'completed') {
          return 'available';
        }
      }

      return 'locked';
    },
    [lessonProgress, lessons, lessonData]
  );

  // Start lesson action
  const startLesson = useCallback(
    async (lessonId: string) => {
      await startLessonMutation({
        languageCode: targetLanguage,
        lessonId,
      });
    },
    [startLessonMutation, targetLanguage]
  );

  // Complete lesson action
  const completeLesson = useCallback(
    async (lessonId: string, score: number, xpEarned: number) => {
      await completeLessonMutation({
        languageCode: targetLanguage,
        lessonId,
        score,
        xpEarned,
      });

      // Auto-unlock next lesson
      const nextLesson = getNextLessonAfter(lessonId);
      if (nextLesson) {
        const nextStatus = getLessonStatus(nextLesson.id);
        if (nextStatus === 'locked') {
          await unlockLessonMutation({
            languageCode: targetLanguage,
            lessonId: nextLesson.id,
          });
        }
      }
    },
    [
      completeLessonMutation,
      targetLanguage,
      getNextLessonAfter,
      getLessonStatus,
      unlockLessonMutation,
    ]
  );

  // Unlock lesson action
  const unlockLesson = useCallback(
    async (lessonId: string) => {
      await unlockLessonMutation({
        languageCode: targetLanguage,
        lessonId,
      });
    },
    [unlockLessonMutation, targetLanguage]
  );

  return {
    curriculum,
    isLoading: isLoading || progressData === undefined,
    error,
    lessons,
    totalLessons,
    getLesson,
    getLessonInfo,
    getNextLessonAfter,
    getPreviousLessonBefore,
    lessonProgress,
    getLessonStatus,
    completedCount,
    progressPercentage,
    startLesson,
    completeLesson,
    unlockLesson,
  };
}

export default useCurriculum;
