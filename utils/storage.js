// localStorage wrapper for progress tracking
// Designed for easy migration to backend API

const STORAGE_KEY = 'murmura_data';
const USER_ID_KEY = 'murmura_user_id';

// Generate or retrieve user ID
function getUserId() {
    let userId = localStorage.getItem(USER_ID_KEY);
    if (!userId) {
        userId = 'local-user-' + Date.now();
        localStorage.setItem(USER_ID_KEY, userId);
    }
    return userId;
}

// Get all stored data
function getAllData() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : getDefaultData();
    } catch (e) {
        console.error('Error reading storage:', e);
        return getDefaultData();
    }
}

// Get default data structure
function getDefaultData() {
    return {
        userId: getUserId(),
        modules: {
            alphabet: {
                learned: [],
                reviews: {},
                stats: {
                    correct: 0,
                    total: 0,
                    streak: 0,
                    bestStreak: 0
                }
            },
            vocabulary: {
                learned: [],
                reviews: {},
                stats: {
                    correct: 0,
                    total: 0,
                    streak: 0,
                    bestStreak: 0,
                    wordsMastered: 0
                }
            },
            kanji: {
                learned: [],
                reviews: {},
                stats: {
                    correct: 0,
                    total: 0,
                    streak: 0,
                    bestStreak: 0,
                    kanjiMastered: 0
                }
            },
            grammar: {
                learned: [],
                reviews: {},
                stats: {
                    correct: 0,
                    total: 0,
                    streak: 0,
                    bestStreak: 0,
                    pointsMastered: 0
                }
            },
            reading: {
                completed: [],
                stats: {
                    textsRead: 0,
                    comprehensionScore: 0
                }
            },
            listening: {
                completed: [],
                stats: {
                    exercisesCompleted: 0,
                    accuracy: 0
                }
            }
        },
        globalStats: {
            streak: 0,
            bestStreak: 0,
            totalStudyTime: 0,
            lastActive: null,
            createdAt: Date.now()
        }
    };
}

// Save all data
function saveAllData(data) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        return true;
    } catch (e) {
        console.error('Error saving storage:', e);
        return false;
    }
}

// Get module data
function getModuleData(moduleName) {
    const data = getAllData();
    if (!data.modules[moduleName]) {
        data.modules[moduleName] = getDefaultData().modules[moduleName] || {};
        saveAllData(data);
    }
    return data.modules[moduleName];
}

// Save module data
function saveModuleData(moduleName, moduleData) {
    const data = getAllData();
    data.modules[moduleName] = moduleData;
    return saveAllData(data);
}

// Get global stats
function getGlobalStats() {
    const data = getAllData();
    return data.globalStats;
}

// Update global stats
function updateGlobalStats(updates) {
    const data = getAllData();
    data.globalStats = { ...data.globalStats, ...updates };
    data.globalStats.lastActive = Date.now();
    return saveAllData(data);
}

// Update module stats
function updateModuleStats(moduleName, statUpdates) {
    const moduleData = getModuleData(moduleName);
    moduleData.stats = { ...moduleData.stats, ...statUpdates };
    return saveModuleData(moduleName, moduleData);
}

// Mark item as learned
function markLearned(moduleName, itemId) {
    const moduleData = getModuleData(moduleName);
    if (!moduleData.learned.includes(itemId)) {
        moduleData.learned.push(itemId);
        return saveModuleData(moduleName, moduleData);
    }
    return true;
}

// Check if item is learned
function isLearned(moduleName, itemId) {
    const moduleData = getModuleData(moduleName);
    return moduleData.learned.includes(itemId);
}

// Get review data for an item
function getReviewData(moduleName, itemId) {
    const moduleData = getModuleData(moduleName);
    return moduleData.reviews[itemId] || null;
}

// Save review data for an item
function saveReviewData(moduleName, itemId, reviewData) {
    const moduleData = getModuleData(moduleName);
    moduleData.reviews[itemId] = reviewData;
    return saveModuleData(moduleName, moduleData);
}

// Clear all data (for testing/reset)
function clearAllData() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(USER_ID_KEY);
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getUserId,
        getAllData,
        saveAllData,
        getModuleData,
        saveModuleData,
        getGlobalStats,
        updateGlobalStats,
        updateModuleStats,
        markLearned,
        isLearned,
        getReviewData,
        saveReviewData,
        clearAllData
    };
}
