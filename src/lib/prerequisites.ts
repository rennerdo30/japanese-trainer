/**
 * Prerequisites System
 * Handles prerequisite checking and dependency tracking for learning items
 */

import prerequisitesData from '@/data/ja/prerequisites.json';

export type MasteryLevel = 'new' | 'learning' | 'advanced' | 'mastered';
export type ModuleName = 'alphabet' | 'vocabulary' | 'kanji' | 'grammar' | 'reading' | 'listening';

export interface PrerequisiteRule {
  module: ModuleName;
  itemId?: string;
  level?: string;
  tags?: string[];
  mastery?: MasteryLevel;
  masteryPercentage?: number;
}

export interface PrerequisiteCheckResult {
  met: boolean;
  missing: PrerequisiteRule[];
  warnings: string[];
}

export interface UserProgress {
  modules: {
    [key in ModuleName]?: {
      learned: string[];
      reviews: Record<string, ReviewData>;
      stats?: {
        correct: number;
        total: number;
      };
    };
  };
}

export interface ReviewData {
  interval: number;
  easeFactor: number;
  repetitions: number;
  quality: number[];
  lastReview: number;
  nextReview: number;
}

const prerequisites = prerequisitesData as {
  rules: Partial<Record<ModuleName, Record<string, unknown>>>;
  difficultyScores: Partial<Record<ModuleName, Record<string, number>>>;
  masteryLevels: Record<MasteryLevel, { minReps: number; minInterval: number }>;
};

/**
 * Get the mastery level for an item based on review data
 */
export function getMasteryLevel(reviewData: ReviewData | undefined): MasteryLevel {
  if (!reviewData) return 'new';

  const { repetitions, interval } = reviewData;
  const levels = prerequisites.masteryLevels;

  if (repetitions >= levels.mastered.minReps && interval >= levels.mastered.minInterval) {
    return 'mastered';
  }
  if (repetitions >= levels.advanced.minReps && interval >= levels.advanced.minInterval) {
    return 'advanced';
  }
  if (repetitions >= levels.learning.minReps) {
    return 'learning';
  }
  return 'new';
}

/**
 * Check if a mastery level meets the required level
 */
export function masteryMeetsRequirement(actual: MasteryLevel, required: MasteryLevel): boolean {
  const order: MasteryLevel[] = ['new', 'learning', 'advanced', 'mastered'];
  return order.indexOf(actual) >= order.indexOf(required);
}

/**
 * Calculate mastery percentage for a module/level combination
 */
export function calculateMasteryPercentage(
  userProgress: UserProgress,
  module: ModuleName,
  level?: string,
  tags?: string[]
): number {
  const moduleData = userProgress.modules[module];
  if (!moduleData) return 0;

  const reviews = moduleData.reviews || {};
  const learned = moduleData.learned || [];

  // For simplicity, we calculate percentage based on items in "learning" or better
  let totalItems = learned.length || 1;
  let masteredItems = 0;

  Object.values(reviews).forEach((review) => {
    const mastery = getMasteryLevel(review as ReviewData);
    if (masteryMeetsRequirement(mastery, 'learning')) {
      masteredItems++;
    }
  });

  return totalItems > 0 ? (masteredItems / totalItems) * 100 : 0;
}

/**
 * Get prerequisites for a specific item
 */
export function getPrerequisites(
  module: ModuleName,
  itemId: string
): PrerequisiteRule[] {
  const moduleRules = prerequisites.rules[module];
  if (!moduleRules) return [];

  // Check for specific item prerequisites
  const itemRules = moduleRules[itemId] as { prerequisites?: PrerequisiteRule[] } | undefined;
  if (itemRules?.prerequisites) {
    return itemRules.prerequisites;
  }

  // Check for "requires-*" global rules
  const globalRules: PrerequisiteRule[] = [];
  Object.entries(moduleRules).forEach(([key, rule]) => {
    if (key.startsWith('requires-') && typeof rule === 'object' && rule !== null) {
      const globalRule = rule as {
        prerequisiteModule: ModuleName;
        prerequisiteMastery: MasteryLevel;
        applies: string;
      };
      if (globalRule.applies === 'all') {
        globalRules.push({
          module: globalRule.prerequisiteModule,
          mastery: globalRule.prerequisiteMastery,
        });
      }
    }
  });

  return globalRules;
}

/**
 * Check if all prerequisites are met for an item
 */
export function checkPrerequisites(
  module: ModuleName,
  itemId: string,
  userProgress: UserProgress
): PrerequisiteCheckResult {
  const prereqs = getPrerequisites(module, itemId);
  const missing: PrerequisiteRule[] = [];
  const warnings: string[] = [];

  for (const prereq of prereqs) {
    const moduleData = userProgress.modules[prereq.module];

    if (prereq.itemId && prereq.itemId !== 'all') {
      // Check specific item mastery
      const review = moduleData?.reviews?.[prereq.itemId] as ReviewData | undefined;
      const mastery = getMasteryLevel(review);
      const requiredMastery = prereq.mastery || 'learning';

      if (!masteryMeetsRequirement(mastery, requiredMastery)) {
        missing.push(prereq);
        warnings.push(`Prerequisite not met: ${prereq.module}/${prereq.itemId} requires ${requiredMastery} mastery`);
      }
    } else if (prereq.masteryPercentage !== undefined) {
      // Check percentage-based prerequisite
      const percentage = calculateMasteryPercentage(
        userProgress,
        prereq.module,
        prereq.level,
        prereq.tags
      );

      if (percentage < prereq.masteryPercentage) {
        missing.push(prereq);
        warnings.push(
          `Prerequisite not met: ${prereq.module} ${prereq.level || ''} requires ${prereq.masteryPercentage}% mastery (current: ${Math.round(percentage)}%)`
        );
      }
    } else if (prereq.mastery) {
      // Check general module mastery
      const percentage = calculateMasteryPercentage(userProgress, prereq.module, prereq.level);
      const requiredPercentage = prereq.mastery === 'learning' ? 30 : prereq.mastery === 'advanced' ? 60 : 80;

      if (percentage < requiredPercentage) {
        missing.push(prereq);
        warnings.push(`Prerequisite not met: ${prereq.module} needs ${prereq.mastery} level mastery`);
      }
    }
  }

  return {
    met: missing.length === 0,
    missing,
    warnings,
  };
}

/**
 * Get missing prerequisites for an item
 */
export function getMissingPrerequisites(
  module: ModuleName,
  itemId: string,
  userProgress: UserProgress
): PrerequisiteRule[] {
  const result = checkPrerequisites(module, itemId, userProgress);
  return result.missing;
}

/**
 * Get the full prerequisite chain for an item (recursive)
 */
export function getPrerequisiteChain(
  module: ModuleName,
  itemId: string,
  visited: Set<string> = new Set()
): PrerequisiteRule[] {
  const key = `${module}:${itemId}`;
  if (visited.has(key)) return [];
  visited.add(key);

  const directPrereqs = getPrerequisites(module, itemId);
  const allPrereqs: PrerequisiteRule[] = [...directPrereqs];

  for (const prereq of directPrereqs) {
    if (prereq.itemId && prereq.itemId !== 'all') {
      const childPrereqs = getPrerequisiteChain(prereq.module, prereq.itemId, visited);
      allPrereqs.push(...childPrereqs);
    }
  }

  return allPrereqs;
}

/**
 * Calculate difficulty score for an item
 */
export function calculateDifficulty(module: ModuleName, level: string): number {
  const scores = prerequisites.difficultyScores[module];
  if (!scores) return 5; // Default middle difficulty

  return scores[level] || 5;
}

/**
 * Get all items that have a specific item as a prerequisite
 */
export function getDependentItems(
  prerequisiteModule: ModuleName,
  prerequisiteItemId: string
): Array<{ module: ModuleName; itemId: string }> {
  const dependents: Array<{ module: ModuleName; itemId: string }> = [];

  (Object.entries(prerequisites.rules) as [ModuleName, Record<string, unknown>][]).forEach(
    ([module, rules]) => {
      Object.entries(rules).forEach(([itemId, rule]) => {
        if (typeof rule === 'object' && rule !== null && 'prerequisites' in rule) {
          const prereqs = (rule as { prerequisites: PrerequisiteRule[] }).prerequisites;
          if (prereqs.some((p) => p.module === prerequisiteModule && p.itemId === prerequisiteItemId)) {
            dependents.push({ module, itemId });
          }
        }
      });
    }
  );

  return dependents;
}

/**
 * Check if an item is ready to learn (all prerequisites met)
 */
export function isReadyToLearn(
  module: ModuleName,
  itemId: string,
  userProgress: UserProgress
): boolean {
  const result = checkPrerequisites(module, itemId, userProgress);
  return result.met;
}

/**
 * Get recommended learning order for items based on prerequisites
 */
export function getRecommendedOrder(
  module: ModuleName,
  items: string[],
  userProgress: UserProgress
): string[] {
  // Simple topological sort based on prerequisites
  const ready: string[] = [];
  const pending = new Set(items);

  while (pending.size > 0) {
    let added = false;

    for (const itemId of pending) {
      if (isReadyToLearn(module, itemId, userProgress)) {
        ready.push(itemId);
        pending.delete(itemId);
        added = true;
        break;
      }
    }

    // If no item can be added, add remaining items anyway (circular dependency or missing data)
    if (!added) {
      for (const itemId of pending) {
        ready.push(itemId);
      }
      break;
    }
  }

  return ready;
}

export default {
  getMasteryLevel,
  masteryMeetsRequirement,
  calculateMasteryPercentage,
  getPrerequisites,
  checkPrerequisites,
  getMissingPrerequisites,
  getPrerequisiteChain,
  calculateDifficulty,
  getDependentItems,
  isReadyToLearn,
  getRecommendedOrder,
};
