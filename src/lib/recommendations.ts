/**
 * Recommendation Engine
 * Provides intelligent learning recommendations based on user progress and preferences
 * Supports 4 path types: Linear, Topic, Prerequisite-based, and Adaptive
 */

import {
  getMasteryLevel,
  calculateMasteryPercentage,
  checkPrerequisites,
  MasteryLevel,
  ModuleName,
  UserProgress,
} from './prerequisites';
import { ReviewQueue, SRSSettings, DEFAULT_SRS_SETTINGS } from './reviewQueue';
import learningPathsData from '@/data/learning-paths.json';

// Types
export type RecommendationType = 'review' | 'new-lesson' | 'path-milestone' | 'weak-area' | 'topic-track' | 'daily-goal';

export interface Recommendation {
  id: string;
  type: RecommendationType;
  priority: number; // 1-10, higher = more important
  title: string;
  description: string;
  module?: ModuleName;
  pathId?: string;
  itemIds?: string[];
  estimatedMinutes?: number;
  rationale: string;
  action: {
    type: 'navigate' | 'start-review' | 'start-lesson';
    target: string;
  };
}

export interface PathProgress {
  pathId: string;
  pathType: 'linear' | 'topic' | 'adaptive';
  name: string;
  currentMilestoneIndex: number;
  totalMilestones: number;
  completedMilestones: number;
  percentComplete: number;
  currentMilestone?: {
    id: string;
    name: string;
    progress: number;
  };
  nextMilestone?: {
    id: string;
    name: string;
    estimatedHours: number;
  };
}

export interface LearningStats {
  totalItemsLearned: number;
  totalReviewsDue: number;
  weakestModule: ModuleName | null;
  strongestModule: ModuleName | null;
  moduleStrengths: Record<ModuleName, number>;
  recentAccuracy: number;
  studyStreak: number;
  lastStudyDate: number | null;
}

export interface AdaptivePathRecommendation {
  focusAreas: Array<{
    module: ModuleName;
    level: string;
    reason: string;
    priority: number;
  }>;
  suggestedPace: 'relaxed' | 'moderate' | 'intensive';
  dailyGoalMinutes: number;
  weeklyGoal: {
    newItems: number;
    reviews: number;
  };
  rationale: string;
}

// Path data types
interface PathMilestone {
  id: string;
  level: string;
  name: string;
  description: string;
  module: string;
  requirement: {
    type: string;
    value?: number;
  };
  estimatedHours: number;
}

interface TopicTrack {
  id: string;
  type: 'topic';
  name: string;
  description: string;
  icon: string;
  language: string;
  estimatedHours: number;
  difficulty: string;
  tags?: string[];
  prerequisites?: string[];
  items: {
    vocabulary?: string[];
    grammar?: string[];
    reading?: string[];
    kanji?: string[];
  };
}

interface LinearPath {
  id: string;
  type: 'linear';
  name: string;
  description: string;
  milestones: PathMilestone[];
}

const pathsData = learningPathsData as {
  paths: Record<string, LinearPath | TopicTrack>;
  pathOrder: string[];
};

// Constants
const REVIEW_PRIORITY_THRESHOLD = 20; // Prioritize reviews when more than this many are due
const WEAK_AREA_THRESHOLD = 0.5; // 50% mastery considered weak
const STRONG_AREA_THRESHOLD = 0.8; // 80% mastery considered strong

// Mapping from language code to linear path ID
const LANGUAGE_PATH_MAP: Record<string, string> = {
  ja: 'jlpt-mastery',
  es: 'cefr-spanish',
  de: 'cefr-german',
  it: 'cefr-italian',
  en: 'cefr-english',
  ko: 'topik-korean',
  zh: 'hsk-chinese',
};

/**
 * Get the linear path ID for a given language
 */
export function getLinearPathIdForLanguage(languageCode: string): string | null {
  return LANGUAGE_PATH_MAP[languageCode] || null;
}

/**
 * Calculate learning statistics from user progress
 * @param userProgress - User's learning progress data
 * @param reviewQueue - Current review queue
 * @param enabledModules - Optional list of modules to include (for language filtering)
 */
export function calculateLearningStats(
  userProgress: UserProgress,
  reviewQueue: ReviewQueue,
  enabledModules?: ModuleName[]
): LearningStats {
  // Use provided modules or fall back to all modules
  const modules: ModuleName[] = enabledModules || ['alphabet', 'vocabulary', 'kanji', 'grammar', 'reading', 'listening'];
  const moduleStrengths: Record<ModuleName, number> = {} as Record<ModuleName, number>;

  let totalItemsLearned = 0;
  let weakestModule: ModuleName | null = null;
  let strongestModule: ModuleName | null = null;
  let weakestScore = 1;
  let strongestScore = 0;

  for (const module of modules) {
    const moduleData = userProgress.modules[module];
    const learned = moduleData?.learned?.length || 0;
    totalItemsLearned += learned;

    const mastery = calculateMasteryPercentage(userProgress, module) / 100;
    moduleStrengths[module] = mastery;

    if (learned > 0) {
      if (mastery < weakestScore) {
        weakestScore = mastery;
        weakestModule = module;
      }
      if (mastery > strongestScore) {
        strongestScore = mastery;
        strongestModule = module;
      }
    }
  }

  // Calculate recent accuracy from review data
  let recentCorrect = 0;
  let recentTotal = 0;

  for (const module of modules) {
    const stats = userProgress.modules[module]?.stats;
    if (stats) {
      recentCorrect += stats.correct || 0;
      recentTotal += stats.total || 0;
    }
  }

  const recentAccuracy = recentTotal > 0 ? recentCorrect / recentTotal : 0;

  return {
    totalItemsLearned,
    totalReviewsDue: reviewQueue.total,
    weakestModule,
    strongestModule,
    moduleStrengths,
    recentAccuracy,
    studyStreak: 0, // This would come from global stats
    lastStudyDate: null,
  };
}

/**
 * Get linear path progress (JLPT progression)
 */
export function getLinearPathProgress(
  pathId: string,
  userProgress: UserProgress
): PathProgress | null {
  const path = pathsData.paths[pathId];
  if (!path || path.type !== 'linear') return null;

  const linearPath = path as LinearPath;
  const milestones = linearPath.milestones || [];
  let completedMilestones = 0;
  let currentMilestoneIndex = 0;

  for (let i = 0; i < milestones.length; i++) {
    const milestone = milestones[i];
    const progress = getMilestoneProgress(milestone, userProgress);

    if (progress >= 100) {
      completedMilestones++;
      currentMilestoneIndex = i + 1;
    } else if (progress > 0 && currentMilestoneIndex === i) {
      // Currently working on this milestone
      break;
    } else {
      // First incomplete milestone
      currentMilestoneIndex = i;
      break;
    }
  }

  const currentMilestone = milestones[currentMilestoneIndex];
  const nextMilestone = milestones[currentMilestoneIndex + 1];

  return {
    pathId,
    pathType: 'linear',
    name: linearPath.name,
    currentMilestoneIndex,
    totalMilestones: milestones.length,
    completedMilestones,
    percentComplete: milestones.length > 0
      ? Math.round((completedMilestones / milestones.length) * 100)
      : 0,
    currentMilestone: currentMilestone ? {
      id: currentMilestone.id,
      name: currentMilestone.name,
      progress: getMilestoneProgress(currentMilestone, userProgress),
    } : undefined,
    nextMilestone: nextMilestone ? {
      id: nextMilestone.id,
      name: nextMilestone.name,
      estimatedHours: nextMilestone.estimatedHours,
    } : undefined,
  };
}

/**
 * Calculate progress for a specific milestone
 */
function getMilestoneProgress(
  milestone: PathMilestone,
  userProgress: UserProgress
): number {
  const module = milestone.module as ModuleName;
  const requirement = milestone.requirement;

  if (requirement.type === 'complete-all') {
    const moduleData = userProgress.modules[module];
    if (!moduleData) return 0;
    // For complete-all, we'd need to know total items in module
    // For now, return mastery percentage
    return calculateMasteryPercentage(userProgress, module);
  }

  if (requirement.type === 'master-percentage') {
    const mastery = calculateMasteryPercentage(userProgress, module);
    const target = requirement.value || 70;
    return Math.min(100, (mastery / target) * 100);
  }

  return 0;
}

/**
 * Get topic track progress
 */
export function getTopicTrackProgress(
  trackId: string,
  userProgress: UserProgress
): PathProgress | null {
  const track = pathsData.paths[trackId];
  if (!track || track.type !== 'topic') return null;

  const topicTrack = track as TopicTrack;
  const items = topicTrack.items;

  // Count total and learned items
  let totalItems = 0;
  let learnedItems = 0;

  const modules: Array<keyof typeof items> = ['vocabulary', 'grammar', 'reading', 'kanji'];
  for (const module of modules) {
    const itemIds = items[module] || [];
    totalItems += itemIds.length;

    const moduleData = userProgress.modules[module as ModuleName];
    const learned = moduleData?.learned || [];

    for (const itemId of itemIds) {
      if (learned.includes(itemId)) {
        learnedItems++;
      }
    }
  }

  const percentComplete = totalItems > 0 ? Math.round((learnedItems / totalItems) * 100) : 0;

  return {
    pathId: trackId,
    pathType: 'topic',
    name: topicTrack.name,
    currentMilestoneIndex: 0,
    totalMilestones: totalItems,
    completedMilestones: learnedItems,
    percentComplete,
  };
}

/**
 * Generate adaptive path recommendations based on user progress and patterns
 * @param targetLanguage - Optional language code to filter recommendations
 * @param enabledModules - Optional list of modules enabled for the current language
 */
export function generateAdaptiveRecommendations(
  userProgress: UserProgress,
  reviewQueue: ReviewQueue,
  settings: SRSSettings = DEFAULT_SRS_SETTINGS,
  targetLanguage?: string,
  enabledModules?: ModuleName[]
): AdaptivePathRecommendation {
  const stats = calculateLearningStats(userProgress, reviewQueue, enabledModules);
  const focusAreas: AdaptivePathRecommendation['focusAreas'] = [];

  // Identify weak areas to focus on (only for enabled modules)
  const modules: ModuleName[] = enabledModules || ['vocabulary', 'kanji', 'grammar', 'reading'];

  for (const module of modules) {
    const strength = stats.moduleStrengths[module] || 0;
    const moduleData = userProgress.modules[module];
    const hasContent = (moduleData?.learned?.length || 0) > 0;

    if (hasContent && strength < WEAK_AREA_THRESHOLD) {
      focusAreas.push({
        module,
        level: targetLanguage === 'ja' ? 'N5' : 'beginner',
        reason: `${module} mastery is low (${Math.round(strength * 100)}%)`,
        priority: Math.round((1 - strength) * 10),
      });
    }
  }

  // If user hasn't started alphabet, prioritize it (Japanese/Korean only - languages with character systems)
  if (targetLanguage === 'ja' || targetLanguage === 'ko') {
    const alphabetData = userProgress.modules['alphabet'];
    const alphabetModule = enabledModules?.includes('alphabet');
    if (alphabetModule && (!alphabetData || (alphabetData.learned?.length || 0) < 46)) {
      const reason = targetLanguage === 'ja'
        ? 'Master Hiragana and Katakana first'
        : 'Master Hangul first';
      focusAreas.unshift({
        module: 'alphabet',
        level: targetLanguage === 'ja' ? 'N5' : 'TOPIK1',
        reason,
        priority: 10,
      });
    }
  }

  // Sort by priority
  focusAreas.sort((a, b) => b.priority - a.priority);

  // Determine suggested pace based on activity
  let suggestedPace: 'relaxed' | 'moderate' | 'intensive' = 'moderate';
  if (stats.recentAccuracy < 0.6) {
    suggestedPace = 'relaxed'; // Slow down if struggling
  } else if (stats.recentAccuracy > 0.85 && stats.totalReviewsDue < 20) {
    suggestedPace = 'intensive'; // Can handle more if doing well
  }

  // Calculate daily goals
  const dailyGoalMinutes = suggestedPace === 'relaxed' ? 15 : suggestedPace === 'moderate' ? 30 : 45;
  const weeklyNewItems = suggestedPace === 'relaxed' ? 35 : suggestedPace === 'moderate' ? 70 : 100;
  const weeklyReviews = Math.min(stats.totalReviewsDue * 7, 500);

  // Generate rationale
  let rationale = '';
  if (focusAreas.length > 0) {
    const topFocus = focusAreas[0];
    rationale = `Focus on ${topFocus.module} this week - ${topFocus.reason}. `;
  }
  if (stats.totalReviewsDue > 50) {
    rationale += 'You have many reviews due - consider clearing your review queue before adding new items. ';
  }
  if (suggestedPace === 'relaxed') {
    rationale += 'Taking it slow to build stronger foundations.';
  } else if (suggestedPace === 'intensive') {
    rationale += "You're doing great! Feel free to push harder.";
  }

  return {
    focusAreas: focusAreas.slice(0, 5),
    suggestedPace,
    dailyGoalMinutes,
    weeklyGoal: {
      newItems: weeklyNewItems,
      reviews: weeklyReviews,
    },
    rationale: rationale.trim(),
  };
}

/**
 * Get all recommendations for a user
 * Combines all 4 path types into prioritized action list
 * @param targetLanguage - Optional language code to filter recommendations
 */
export function getRecommendations(
  userProgress: UserProgress,
  reviewQueue: ReviewQueue,
  settings: SRSSettings = DEFAULT_SRS_SETTINGS,
  maxRecommendations: number = 5,
  targetLanguage?: string
): Recommendation[] {
  const recommendations: Recommendation[] = [];
  const stats = calculateLearningStats(userProgress, reviewQueue);

  // 1. REVIEW PRIORITY - Always check if reviews are due
  if (reviewQueue.total > 0) {
    const reviewPriority = Math.min(10, Math.floor(reviewQueue.total / 5) + 3);

    recommendations.push({
      id: 'review-due',
      type: 'review',
      priority: reviewQueue.urgency === 'overdue' ? 10 : reviewPriority,
      title: `${reviewQueue.total} Reviews Due`,
      description: reviewQueue.urgency === 'overdue'
        ? 'You have overdue reviews! Complete them to maintain your progress.'
        : `Clear your review queue to strengthen your memory.`,
      estimatedMinutes: reviewQueue.estimatedMinutes,
      rationale: reviewQueue.urgency === 'overdue'
        ? 'Overdue reviews lose retention quickly'
        : 'Regular reviews are key to long-term retention',
      action: {
        type: 'start-review',
        target: '/review',
      },
    });
  }

  // 2. LINEAR PATH PROGRESS - Next milestone for the target language
  if (targetLanguage) {
    const pathId = getLinearPathIdForLanguage(targetLanguage);
    if (pathId) {
      const pathProgress = getLinearPathProgress(pathId, userProgress);
      if (pathProgress && pathProgress.currentMilestone) {
        const milestone = pathProgress.currentMilestone;
        const isHighPriority = pathProgress.completedMilestones === 0; // First milestone

        // Customize description based on language
        const journeyType = targetLanguage === 'ja' ? 'JLPT' :
          targetLanguage === 'ko' ? 'TOPIK' :
          targetLanguage === 'zh' ? 'HSK' : 'CEFR';

        recommendations.push({
          id: `path-${pathProgress.pathId}-${milestone.id}`,
          type: 'path-milestone',
          priority: isHighPriority ? 8 : 6,
          title: milestone.name,
          description: `Continue your ${journeyType} journey - ${Math.round(milestone.progress)}% complete`,
          pathId: pathProgress.pathId,
          rationale: `Structured progression through ${journeyType} levels`,
          action: {
            type: 'navigate',
            target: `/paths/${pathProgress.pathId}`,
          },
        });
      }
    }
  }

  // 3. WEAK AREA FOCUS - Prerequisite-based recommendations
  if (stats.weakestModule && stats.moduleStrengths[stats.weakestModule] < WEAK_AREA_THRESHOLD) {
    const weakness = stats.moduleStrengths[stats.weakestModule];

    recommendations.push({
      id: `weak-area-${stats.weakestModule}`,
      type: 'weak-area',
      priority: 7,
      title: `Strengthen Your ${capitalize(stats.weakestModule)}`,
      description: `Your ${stats.weakestModule} needs attention - only ${Math.round(weakness * 100)}% mastery`,
      module: stats.weakestModule,
      rationale: 'Balanced skills lead to better overall comprehension',
      action: {
        type: 'navigate',
        target: `/${stats.weakestModule}`,
      },
    });
  }

  // 4. TOPIC TRACKS - Recommend relevant themed paths (filtered by language)
  const topicTracks = Object.values(pathsData.paths).filter(
    (p): p is TopicTrack => p.type === 'topic' &&
      (!targetLanguage || p.language === targetLanguage)
  );

  for (const track of topicTracks.slice(0, 2)) {
    const trackProgress = getTopicTrackProgress(track.id, userProgress);
    if (trackProgress && trackProgress.percentComplete < 100) {
      const isStarted = trackProgress.percentComplete > 0;

      recommendations.push({
        id: `topic-${track.id}`,
        type: 'topic-track',
        priority: isStarted ? 5 : 4,
        title: isStarted ? `Continue: ${track.name}` : track.name,
        description: isStarted
          ? `${trackProgress.percentComplete}% complete - keep going!`
          : track.description,
        pathId: track.id,
        estimatedMinutes: track.estimatedHours * 60,
        rationale: `Practical ${track.tags?.join(', ') || ''} skills`,
        action: {
          type: 'navigate',
          target: `/paths/${track.id}`,
        },
      });
    }
  }

  // 5. DAILY GOAL - Suggest new content if reviews are under control
  if (reviewQueue.total < REVIEW_PRIORITY_THRESHOLD) {
    const adaptive = generateAdaptiveRecommendations(userProgress, reviewQueue, settings);

    if (adaptive.focusAreas.length > 0) {
      const focus = adaptive.focusAreas[0];

      recommendations.push({
        id: 'daily-new-items',
        type: 'daily-goal',
        priority: 5,
        title: `Learn New ${capitalize(focus.module)}`,
        description: adaptive.rationale.split('.')[0] + '.',
        module: focus.module,
        rationale: adaptive.rationale,
        action: {
          type: 'navigate',
          target: `/${focus.module}`,
        },
      });
    }
  }

  // Sort by priority and return top recommendations
  recommendations.sort((a, b) => b.priority - a.priority);
  return recommendations.slice(0, maxRecommendations);
}

/**
 * Get next recommended action (single top recommendation)
 */
export function getNextRecommendedAction(
  userProgress: UserProgress,
  reviewQueue: ReviewQueue,
  settings?: SRSSettings
): Recommendation | null {
  const recommendations = getRecommendations(userProgress, reviewQueue, settings, 1);
  return recommendations[0] || null;
}

/**
 * Get all available learning paths with progress
 * @param targetLanguage - Optional language code to filter paths
 */
export function getAllPathsWithProgress(
  userProgress: UserProgress,
  targetLanguage?: string
): Array<PathProgress & { description: string; difficulty: string; tags?: string[] }> {
  const paths: Array<PathProgress & { description: string; difficulty: string; tags?: string[] }> = [];

  for (const pathId of pathsData.pathOrder) {
    const pathData = pathsData.paths[pathId];
    if (!pathData) continue;

    // Filter by language if specified
    const pathLanguage = (pathData as { language?: string }).language;
    if (targetLanguage && pathLanguage && pathLanguage !== targetLanguage) {
      continue;
    }

    if (pathData.type === 'linear') {
      const progress = getLinearPathProgress(pathId, userProgress);
      if (progress) {
        paths.push({
          ...progress,
          description: pathData.description,
          difficulty: 'beginner-to-advanced',
        });
      }
    } else if (pathData.type === 'topic') {
      const topicPath = pathData as TopicTrack;
      const progress = getTopicTrackProgress(pathId, userProgress);
      if (progress) {
        paths.push({
          ...progress,
          description: topicPath.description,
          difficulty: topicPath.difficulty,
          tags: topicPath.tags,
        });
      }
    }
  }

  return paths;
}

/**
 * Check if user has prerequisites for a topic track
 */
export function checkTopicTrackPrerequisites(
  trackId: string,
  userProgress: UserProgress
): { met: boolean; missing: string[] } {
  const track = pathsData.paths[trackId];
  if (!track || track.type !== 'topic') return { met: true, missing: [] };

  const topicTrack = track as TopicTrack;
  const prerequisites = topicTrack.prerequisites || [];
  const missing: string[] = [];

  for (const prereqId of prerequisites) {
    // Check if the prerequisite milestone is complete
    const jlptProgress = getLinearPathProgress('jlpt-mastery', userProgress);
    if (jlptProgress) {
      const completedMilestones = (pathsData.paths['jlpt-mastery'] as LinearPath)
        .milestones
        .slice(0, jlptProgress.completedMilestones)
        .map(m => m.id);

      if (!completedMilestones.includes(prereqId)) {
        const milestone = (pathsData.paths['jlpt-mastery'] as LinearPath)
          .milestones
          .find(m => m.id === prereqId);
        if (milestone) {
          missing.push(milestone.name);
        }
      }
    }
  }

  return {
    met: missing.length === 0,
    missing,
  };
}

/**
 * Get study streak information
 */
export function getStreakInfo(
  lastStudyDate: number | null,
  currentStreak: number
): {
  isActive: boolean;
  daysRemaining: number;
  message: string;
} {
  if (!lastStudyDate) {
    return {
      isActive: false,
      daysRemaining: 0,
      message: 'Start your study streak today!',
    };
  }

  const now = Date.now();
  const lastStudy = new Date(lastStudyDate);
  const today = new Date();

  // Check if studied today
  const studiedToday =
    lastStudy.getDate() === today.getDate() &&
    lastStudy.getMonth() === today.getMonth() &&
    lastStudy.getFullYear() === today.getFullYear();

  if (studiedToday) {
    return {
      isActive: true,
      daysRemaining: 24 - today.getHours(),
      message: `${currentStreak} day streak! Keep it up!`,
    };
  }

  // Check if studied yesterday (streak still active)
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const studiedYesterday =
    lastStudy.getDate() === yesterday.getDate() &&
    lastStudy.getMonth() === yesterday.getMonth() &&
    lastStudy.getFullYear() === yesterday.getFullYear();

  if (studiedYesterday) {
    const hoursUntilMidnight = 24 - today.getHours();
    return {
      isActive: true,
      daysRemaining: hoursUntilMidnight / 24,
      message: `Study today to maintain your ${currentStreak} day streak!`,
    };
  }

  // Streak broken
  return {
    isActive: false,
    daysRemaining: 0,
    message: 'Your streak was lost. Start a new one today!',
  };
}

// Helper function
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export default {
  calculateLearningStats,
  getLinearPathProgress,
  getTopicTrackProgress,
  generateAdaptiveRecommendations,
  getRecommendations,
  getNextRecommendedAction,
  getAllPathsWithProgress,
  checkTopicTrackPrerequisites,
  getStreakInfo,
};
