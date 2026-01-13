// Convex-based storage adapter
// Replaces localStorage with Convex backend
// Uses authenticated userId from Convex Auth

import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { StorageData } from './storage';

// Default data structure
function getDefaultData(): StorageData {
    return {
        userId: null as any, // Will be set by authenticated user
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
                stats: {
                    correct: 0,
                    total: 0,
                    streak: 0,
                    textsRead: 0,
                    comprehensionScore: 0,
                    totalAttempts: 0
                },
                completed: []
            },
            listening: {
                stats: {
                    correct: 0,
                    total: 0,
                    streak: 0,
                    exercisesCompleted: 0,
                    accuracy: 0
                },
                completed: []
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

interface ConvexHooks {
    data: StorageData | null;
    isLoading: boolean;
    saveUserData: (data: StorageData) => Promise<void>;
    updateModule: (moduleName: string, moduleData: any) => Promise<void>;
    updateGlobalStats: (stats: any) => Promise<void>;
}

// Hook to get user data from Convex
export function useConvexUserData() {
    const currentUser = useQuery(api.auth.getCurrentUser);
    
    // Only fetch data if user is authenticated
    const userData = useQuery(
        api.userData.getUserData,
        currentUser ? {} : "skip"
    );
    
    const saveUserData = useMutation(api.userData.saveUserData);
    const updateModule = useMutation(api.userData.updateModule);
    const updateGlobalStats = useMutation(api.userData.updateGlobalStats);
    
    // Return default data if not authenticated
    if (!currentUser) {
        return {
            data: getDefaultData(),
            isLoading: currentUser === undefined,
            isAuthenticated: false,
            saveUserData: async () => { throw new Error("Not authenticated"); },
            updateModule: async () => { throw new Error("Not authenticated"); },
            updateGlobalStats: async () => { throw new Error("Not authenticated"); },
        };
    }
    
    return {
        data: (userData as any as StorageData | null) || getDefaultData(),
        isLoading: userData === undefined || currentUser === undefined,
        isAuthenticated: true,
        saveUserData: async (data: StorageData) => {
            await saveUserData({ data });
        },
        updateModule: async (moduleName: string, moduleData: any) => {
            await updateModule({ moduleName, moduleData });
        },
        updateGlobalStats: async (stats: any) => {
            await updateGlobalStats({ stats });
        },
    };
}

// Hook to get settings from Convex
export function useConvexSettings() {
    const currentUser = useQuery(api.auth.getCurrentUser);
    
    // Only fetch settings if user is authenticated
    const settings = useQuery(
        api.settings.getSettings,
        currentUser ? {} : "skip"
    );
    
    const saveSettings = useMutation(api.settings.saveSettings);
    const updateSetting = useMutation(api.settings.updateSetting);
    
    if (!currentUser) {
        return {
            settings: null,
            isLoading: currentUser === undefined,
            isAuthenticated: false,
            saveSettings: async () => { throw new Error("Not authenticated"); },
            updateSetting: async () => { throw new Error("Not authenticated"); },
        };
    }
    
    return {
        settings: settings || null,
        isLoading: settings === undefined || currentUser === undefined,
        isAuthenticated: true,
        saveSettings: async (settingsData: any) => {
            await saveSettings({ settings: settingsData });
        },
        updateSetting: async (key: string, value: any) => {
            await updateSetting({ key, value });
        },
    };
}

// Storage adapter that matches the existing localStorage API
export function createConvexStorageAdapter(convexHooks: ConvexHooks) {
    const { data, isLoading, saveUserData, updateModule, updateGlobalStats } = convexHooks;
    
    return {
        getAllData: () => data || getDefaultData(),
        saveAllData: async (newData: StorageData) => {
            await saveUserData(newData);
        },
        getModuleData: (moduleName: string) => {
            const allData = data || getDefaultData();
            if (!allData.modules[moduleName]) {
                allData.modules[moduleName] = getDefaultData().modules[moduleName] || {
                    learned: [],
                    reviews: {},
                    stats: {
                        correct: 0,
                        total: 0,
                        streak: 0
                    }
                };
            }
            return allData.modules[moduleName];
        },
        saveModuleData: async (moduleName: string, moduleData: any) => {
            await updateModule(moduleName, moduleData);
        },
        getGlobalStats: () => {
            const allData = data || getDefaultData();
            return allData.globalStats;
        },
        updateGlobalStats: async (updates: any) => {
            await updateGlobalStats(updates);
        },
        updateModuleStats: async (moduleName: string, statUpdates: any) => {
            const moduleData = data?.modules[moduleName] || getDefaultData().modules[moduleName];
            moduleData.stats = { ...moduleData.stats, ...statUpdates };
            await updateModule(moduleName, moduleData);
        },
        markLearned: async (moduleName: string, itemId: string) => {
            const moduleData = data?.modules[moduleName] || getDefaultData().modules[moduleName];
            if (!moduleData.learned.includes(itemId)) {
                moduleData.learned.push(itemId);
                await updateModule(moduleName, moduleData);
            }
        },
        isLearned: (moduleName: string, itemId: string) => {
            const moduleData = data?.modules[moduleName] || getDefaultData().modules[moduleName];
            return moduleData.learned.includes(itemId);
        },
        getReviewData: (moduleName: string, itemId: string) => {
            const moduleData = data?.modules[moduleName] || getDefaultData().modules[moduleName];
            return moduleData.reviews[itemId] || null;
        },
        saveReviewData: async (moduleName: string, itemId: string, reviewData: any) => {
            const moduleData = data?.modules[moduleName] || getDefaultData().modules[moduleName];
            moduleData.reviews[itemId] = reviewData;
            await updateModule(moduleName, moduleData);
        },
        clearAllData: async () => {
            // Reset to default data
            await saveUserData(getDefaultData());
        },
    };
}
