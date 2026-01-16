'use client';

import { useState, useEffect, useCallback } from 'react';
import { useProgressContext } from '@/context/ProgressProvider';
import {
  PathProgress,
  getLinearPathProgress,
  getTopicTrackProgress,
  checkTopicTrackPrerequisites,
} from '@/lib/recommendations';
import type { UserProgress, ModuleName } from '@/lib/prerequisites';

interface EnrolledPath {
  pathId: string;
  enrolledAt: number;
  currentMilestone: number;
  completed: boolean;
  completedAt?: number;
}

interface PathPreferences {
  preferStructured: boolean;
  showPrerequisiteWarnings: boolean;
  autoEnrollInPaths: boolean;
}

interface UsePathProgressReturn {
  // Enrolled paths
  enrolledPaths: EnrolledPath[];
  isEnrolled: (pathId: string) => boolean;

  // Path progress
  getProgress: (pathId: string) => PathProgress | null;

  // Prerequisites
  checkPrerequisites: (pathId: string) => { met: boolean; missing: string[] };

  // Actions
  enrollInPath: (pathId: string) => void;
  unenrollFromPath: (pathId: string) => void;
  markMilestoneComplete: (pathId: string, milestoneIndex: number) => void;
  completePath: (pathId: string) => void;

  // Preferences
  preferences: PathPreferences;
  updatePreferences: (updates: Partial<PathPreferences>) => void;

  // Loading state
  isLoading: boolean;
}

const ENROLLED_PATHS_KEY = 'japanese_trainer_enrolled_paths';
const PATH_PREFERENCES_KEY = 'japanese_trainer_path_preferences';

const DEFAULT_PREFERENCES: PathPreferences = {
  preferStructured: true,
  showPrerequisiteWarnings: true,
  autoEnrollInPaths: false,
};

export function usePathProgress(): UsePathProgressReturn {
  const { getModuleData } = useProgressContext();

  const [enrolledPaths, setEnrolledPaths] = useState<EnrolledPath[]>([]);
  const [preferences, setPreferences] = useState<PathPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);

  // Load enrolled paths from localStorage
  useEffect(() => {
    try {
      const storedPaths = localStorage.getItem(ENROLLED_PATHS_KEY);
      if (storedPaths) {
        setEnrolledPaths(JSON.parse(storedPaths));
      }

      const storedPrefs = localStorage.getItem(PATH_PREFERENCES_KEY);
      if (storedPrefs) {
        setPreferences({ ...DEFAULT_PREFERENCES, ...JSON.parse(storedPrefs) });
      }
    } catch (error) {
      console.error('Failed to load path data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save enrolled paths to localStorage
  const saveEnrolledPaths = useCallback((paths: EnrolledPath[]) => {
    try {
      localStorage.setItem(ENROLLED_PATHS_KEY, JSON.stringify(paths));
    } catch (error) {
      console.error('Failed to save enrolled paths:', error);
    }
  }, []);

  // Save preferences to localStorage
  const savePreferences = useCallback((prefs: PathPreferences) => {
    try {
      localStorage.setItem(PATH_PREFERENCES_KEY, JSON.stringify(prefs));
    } catch (error) {
      console.error('Failed to save path preferences:', error);
    }
  }, []);

  // Build user progress object
  const buildUserProgress = useCallback((): UserProgress => {
    const modules: ModuleName[] = ['alphabet', 'vocabulary', 'kanji', 'grammar', 'reading', 'listening'];
    const userProgress: UserProgress = { modules: {} };

    for (const module of modules) {
      const moduleData = getModuleData(module);
      if (moduleData) {
        userProgress.modules[module] = {
          learned: moduleData.learned || [],
          reviews: moduleData.reviews || {},
          stats: moduleData.stats,
        };
      }
    }

    return userProgress;
  }, [getModuleData]);

  // Check if enrolled in a path
  const isEnrolled = useCallback((pathId: string): boolean => {
    return enrolledPaths.some(p => p.pathId === pathId);
  }, [enrolledPaths]);

  // Get progress for a path
  const getProgress = useCallback((pathId: string): PathProgress | null => {
    const userProgress = buildUserProgress();

    // Try linear path first
    const linearProgress = getLinearPathProgress(pathId, userProgress);
    if (linearProgress) return linearProgress;

    // Try topic track
    return getTopicTrackProgress(pathId, userProgress);
  }, [buildUserProgress]);

  // Check prerequisites for a path
  const checkPrerequisitesForPath = useCallback((pathId: string): { met: boolean; missing: string[] } => {
    const userProgress = buildUserProgress();
    return checkTopicTrackPrerequisites(pathId, userProgress);
  }, [buildUserProgress]);

  // Enroll in a path
  const enrollInPath = useCallback((pathId: string) => {
    if (isEnrolled(pathId)) return;

    const newEnrollment: EnrolledPath = {
      pathId,
      enrolledAt: Date.now(),
      currentMilestone: 0,
      completed: false,
    };

    const updatedPaths = [...enrolledPaths, newEnrollment];
    setEnrolledPaths(updatedPaths);
    saveEnrolledPaths(updatedPaths);
  }, [enrolledPaths, isEnrolled, saveEnrolledPaths]);

  // Unenroll from a path
  const unenrollFromPath = useCallback((pathId: string) => {
    const updatedPaths = enrolledPaths.filter(p => p.pathId !== pathId);
    setEnrolledPaths(updatedPaths);
    saveEnrolledPaths(updatedPaths);
  }, [enrolledPaths, saveEnrolledPaths]);

  // Mark a milestone as complete
  const markMilestoneComplete = useCallback((pathId: string, milestoneIndex: number) => {
    const updatedPaths = enrolledPaths.map(p => {
      if (p.pathId === pathId) {
        return {
          ...p,
          currentMilestone: Math.max(p.currentMilestone, milestoneIndex + 1),
        };
      }
      return p;
    });

    setEnrolledPaths(updatedPaths);
    saveEnrolledPaths(updatedPaths);
  }, [enrolledPaths, saveEnrolledPaths]);

  // Complete a path
  const completePath = useCallback((pathId: string) => {
    const updatedPaths = enrolledPaths.map(p => {
      if (p.pathId === pathId) {
        return {
          ...p,
          completed: true,
          completedAt: Date.now(),
        };
      }
      return p;
    });

    setEnrolledPaths(updatedPaths);
    saveEnrolledPaths(updatedPaths);
  }, [enrolledPaths, saveEnrolledPaths]);

  // Update preferences
  const updatePreferences = useCallback((updates: Partial<PathPreferences>) => {
    const updatedPrefs = { ...preferences, ...updates };
    setPreferences(updatedPrefs);
    savePreferences(updatedPrefs);
  }, [preferences, savePreferences]);

  return {
    enrolledPaths,
    isEnrolled,
    getProgress,
    checkPrerequisites: checkPrerequisitesForPath,
    enrollInPath,
    unenrollFromPath,
    markMilestoneComplete,
    completePath,
    preferences,
    updatePreferences,
    isLoading,
  };
}

export default usePathProgress;
