// Spaced Repetition System (SRS)
// Implements SM-2 algorithm similar to Anki

export interface ReviewData {
    interval: number;
    easeFactor: number;
    repetitions: number;
    quality: number[];
    lastReview: number;
    nextReview: number;
}

export const SRS_CONFIG = {
    initialInterval: 1, // days
    minEaseFactor: 1.3,
    maxEaseFactor: 2.5,
    defaultEaseFactor: 2.5
} as const;

// Quality levels (0-5, similar to Anki)
// 0: Again (incorrect)
// 1: Hard
// 2: Good
// 3: Easy
// 4: Perfect
// 5: Excellent

// Calculate next review interval using SM-2 algorithm
export function calculateNextReview(reviewData: ReviewData | null, quality: number): ReviewData {
    if (!reviewData) {
        // First review
        return {
            interval: SRS_CONFIG.initialInterval,
            easeFactor: SRS_CONFIG.defaultEaseFactor,
            repetitions: quality >= 3 ? 1 : 0,
            quality: [quality],
            lastReview: Date.now(),
            nextReview: Date.now() + (SRS_CONFIG.initialInterval * 24 * 60 * 60 * 1000)
        };
    }
    
    let { interval, easeFactor, repetitions, quality: qualityHistory } = reviewData;
    easeFactor = easeFactor || SRS_CONFIG.defaultEaseFactor;
    repetitions = repetitions || 0;
    qualityHistory = qualityHistory || [];
    
    // Update ease factor based on quality
    // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    const q = quality;
    easeFactor = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
    easeFactor = Math.max(SRS_CONFIG.minEaseFactor, Math.min(SRS_CONFIG.maxEaseFactor, easeFactor));
    
    // Update quality history (keep last 10)
    qualityHistory.push(q);
    if (qualityHistory.length > 10) {
        qualityHistory = qualityHistory.slice(-10);
    }
    
    // Calculate new interval
    if (q < 3) {
        // Incorrect or hard - reset
        interval = SRS_CONFIG.initialInterval;
        repetitions = 0;
    } else {
        // Correct - increase interval
        if (repetitions === 0) {
            interval = 1;
        } else if (repetitions === 1) {
            interval = 6;
        } else {
            interval = Math.round(interval * easeFactor);
        }
        repetitions += 1;
    }
    
    const nextReview = Date.now() + (interval * 24 * 60 * 60 * 1000);
    
    return {
        interval,
        easeFactor,
        repetitions,
        quality: qualityHistory,
        lastReview: Date.now(),
        nextReview
    };
}

// Get quality score from user response
export function getQualityFromResponse(isCorrect: boolean, responseTime: number, difficulty: string = 'normal'): number {
    if (!isCorrect) return 0; // Again
    
    // Adjust based on response time and difficulty
    // Fast and easy = higher quality
    if (difficulty === 'easy' && responseTime < 2000) return 5;
    if (difficulty === 'easy') return 4;
    if (responseTime < 3000) return 4;
    if (responseTime < 5000) return 3;
    return 2; // Correct but slow
}

// Check if item is due for review
export function isDueForReview(reviewData: ReviewData | null): boolean {
    if (!reviewData || !reviewData.nextReview) return true;
    return Date.now() >= reviewData.nextReview;
}

// Get review priority (higher = more urgent)
export function getReviewPriority(reviewData: ReviewData | null): number {
    if (!reviewData || !reviewData.nextReview) return 100; // New items
    
    const daysOverdue = Math.max(0, (Date.now() - reviewData.nextReview) / (24 * 60 * 60 * 1000));
    const repetitions = reviewData.repetitions || 0;
    
    // New items and overdue items get higher priority
    if (repetitions === 0) return 100;
    if (daysOverdue > 0) return 90 - Math.min(90, daysOverdue);
    
    // Items due soon get medium priority
    const daysUntilDue = (reviewData.nextReview - Date.now()) / (24 * 60 * 60 * 1000);
    if (daysUntilDue <= 1) return 50;
    if (daysUntilDue <= 3) return 30;
    
    return 10; // Not due soon
}

// Get mastery status
export function getMasteryStatus(reviewData: ReviewData | null): string {
    if (!reviewData) return 'new';
    
    const repetitions = reviewData.repetitions || 0;
    const interval = reviewData.interval || 0;
    const avgQuality = reviewData.quality?.length > 0
        ? reviewData.quality.reduce((a, b) => a + b, 0) / reviewData.quality.length
        : 0;
    
    if (repetitions >= 5 && interval >= 30 && avgQuality >= 4) return 'mastered';
    if (repetitions >= 3 && interval >= 7) return 'advanced';
    if (repetitions >= 1) return 'learning';
    return 'new';
}
