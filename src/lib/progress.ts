// Progress tracking utilities
// Works with storage.js to track learning progress

import { getAllData, getGlobalStats, updateGlobalStats, getModuleData, getReviewData } from './storage';
import { ProgressSummary } from '@/types/context';

interface GlobalStats {
    streak?: number;
    bestStreak?: number;
    totalStudyTime?: number;
    lastActive?: number | null;
    createdAt?: number;
}

// Calculate daily streak
export function calculateStreak(globalStats: GlobalStats): number {
    if (!globalStats.lastActive) return 0;
    
    const lastActive = new Date(globalStats.lastActive);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    lastActive.setHours(0, 0, 0, 0);
    
    const daysDiff = Math.floor((today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 0) {
        // Studied today, return current streak
        return globalStats.streak || 0;
    } else if (daysDiff === 1) {
        // Studied yesterday, increment streak
        return (globalStats.streak || 0) + 1;
    } else {
        // Missed days, reset streak
        return 0;
    }
}

// Update daily streak
export function updateStreak(): number {
    const globalStats = getGlobalStats();
    const newStreak = calculateStreak(globalStats);
    const bestStreak = Math.max(newStreak, globalStats.bestStreak || 0);
    
    updateGlobalStats({
        streak: newStreak,
        bestStreak: bestStreak,
        lastActive: Date.now()
    });
    
    return newStreak;
}

// Get overall progress summary
export function getProgressSummary(): ProgressSummary {
    const data = getAllData();
    const summary: ProgressSummary = {
        totalWords: data.modules.vocabulary?.learned?.length || 0,
        totalKanji: data.modules.kanji?.learned?.length || 0,
        totalGrammar: data.modules.grammar?.learned?.length || 0,
        textsRead: data.modules.reading?.completed?.length || 0,
        listeningExercises: data.modules.listening?.completed?.length || 0,
        streak: calculateStreak(data.globalStats),
        bestStreak: data.globalStats.bestStreak || 0,
        totalStudyTime: data.globalStats.totalStudyTime || 0
    };
    
    return summary;
}

// Get module progress percentage
export function getModuleProgress(moduleName: string, totalItems: number): number {
    const moduleData = getModuleData(moduleName);
    const learned = moduleData.learned?.length || 0;
    return totalItems > 0 ? Math.round((learned / totalItems) * 100) : 0;
}

// Record study session time
export function recordStudyTime(seconds: number): void {
    const globalStats = getGlobalStats();
    updateGlobalStats({
        totalStudyTime: (globalStats.totalStudyTime || 0) + seconds
    });
}

// Get items due for review (for SRS)
export function getItemsDueForReview(moduleName: string): Array<{ itemId: string; reviewData: any }> {
    const moduleData = getModuleData(moduleName);
    const now = Date.now();
    const dueItems: Array<{ itemId: string; reviewData: any }> = [];
    
    for (const [itemId, reviewData] of Object.entries(moduleData.reviews || {})) {
        if (reviewData && reviewData.nextReview && reviewData.nextReview <= now) {
            dueItems.push({
                itemId,
                reviewData
            });
        }
    }
    
    return dueItems;
}

// Get mastery level for an item
export function getMasteryLevel(moduleName: string, itemId: string): string {
    const reviewData = getReviewData(moduleName, itemId);
    if (!reviewData) return 'new';
    
    const repetitions = reviewData.repetitions || 0;
    const interval = reviewData.interval || 0;
    
    if (repetitions >= 5 && interval >= 30) return 'mastered';
    if (repetitions >= 3 && interval >= 7) return 'advanced';
    if (repetitions >= 1) return 'learning';
    return 'new';
}
