// Progress tracking utilities
// Works with storage.js to track learning progress

// Calculate daily streak
function calculateStreak(globalStats) {
    if (!globalStats.lastActive) return 0;
    
    const lastActive = new Date(globalStats.lastActive);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    lastActive.setHours(0, 0, 0, 0);
    
    const daysDiff = Math.floor((today - lastActive) / (1000 * 60 * 60 * 24));
    
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
function updateStreak() {
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
function getProgressSummary() {
    // Note: This assumes storage.js is loaded and functions are in global scope
    // In browser context, these will be available after storage.js loads
    if (typeof getAllData === 'undefined' || typeof getGlobalStats === 'undefined') {
        console.warn('storage.js must be loaded before progress.js');
        return {
            totalWords: 0,
            totalKanji: 0,
            totalGrammar: 0,
            textsRead: 0,
            listeningExercises: 0,
            streak: 0,
            bestStreak: 0,
            totalStudyTime: 0
        };
    }
    
    const data = getAllData();
    const summary = {
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
function getModuleProgress(moduleName, totalItems) {
    if (typeof getModuleData === 'undefined') return 0;
    const moduleData = getModuleData(moduleName);
    const learned = moduleData.learned?.length || 0;
    return totalItems > 0 ? Math.round((learned / totalItems) * 100) : 0;
}

// Record study session time
function recordStudyTime(seconds) {
    if (typeof getGlobalStats === 'undefined' || typeof updateGlobalStats === 'undefined') return;
    const globalStats = getGlobalStats();
    updateGlobalStats({
        totalStudyTime: (globalStats.totalStudyTime || 0) + seconds
    });
}

// Get items due for review (for SRS)
function getItemsDueForReview(moduleName) {
    if (typeof getModuleData === 'undefined') return [];
    const moduleData = getModuleData(moduleName);
    const now = Date.now();
    const dueItems = [];
    
    for (const [itemId, reviewData] of Object.entries(moduleData.reviews || {})) {
        if (reviewData.nextReview && reviewData.nextReview <= now) {
            dueItems.push({
                itemId,
                reviewData
            });
        }
    }
    
    return dueItems;
}

// Get mastery level for an item
function getMasteryLevel(moduleName, itemId) {
    if (typeof getReviewData === 'undefined') return 'new';
    const reviewData = getReviewData(moduleName, itemId);
    if (!reviewData) return 'new';
    
    const repetitions = reviewData.repetitions || 0;
    const interval = reviewData.interval || 0;
    
    if (repetitions >= 5 && interval >= 30) return 'mastered';
    if (repetitions >= 3 && interval >= 7) return 'advanced';
    if (repetitions >= 1) return 'learning';
    return 'new';
}

// Note: These functions depend on storage.js
// Make sure storage.js is loaded before this file
