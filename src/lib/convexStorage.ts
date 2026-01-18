'use client';

// Convex-based storage adapter
// Replaces localStorage with Convex backend
// Uses authenticated userId from Convex Auth

import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { StorageData, ModuleData, GlobalStats } from './storage';
import { ReviewData } from '@/types';

// Valid module names matching Convex validator
type ModuleName = 'alphabet' | 'vocabulary' | 'kanji' | 'grammar' | 'reading' | 'listening';

// Valid setting keys matching Convex validator
type SettingKey = 'theme' | 'soundEnabled' | 'ttsEnabled' | 'ttsRate' | 'ttsVolume' | 'timerEnabled' | 'timerDuration' | 'leaderboardVisible';

// Settings data structure
interface SettingsData {
    theme?: string;
    soundEnabled?: boolean;
    ttsEnabled?: boolean;
    ttsRate?: number;
    ttsVolume?: number;
    timerEnabled?: boolean;
    timerDuration?: number;
    leaderboardVisible?: boolean;
}

// Default data structure
function getDefaultData(): StorageData {
    return {
        userId: null, // Will be set by authenticated user
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
    updateModule: (moduleName: string, moduleData: Partial<ModuleData>) => Promise<void>;
    updateGlobalStats: (stats: Partial<GlobalStats>) => Promise<void>;
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
        data: (userData as StorageData | null) || getDefaultData(),
        isLoading: userData === undefined || currentUser === undefined,
        isAuthenticated: true,
        saveUserData: async (data: StorageData) => {
            // Use type assertion for Convex validator compatibility
            await saveUserData({ data: data as unknown as Record<string, unknown> });
        },
        updateModule: async (moduleName: ModuleName, moduleData: Partial<ModuleData>) => {
            await updateModule({ moduleName, moduleData });
        },
        updateGlobalStats: async (stats: Partial<GlobalStats>) => {
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
        saveSettings: async (settingsData: SettingsData) => {
            await saveSettings({ settings: settingsData });
        },
        updateSetting: async (key: SettingKey, value: string | boolean | number) => {
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
        saveModuleData: async (moduleName: string, moduleData: Partial<ModuleData>) => {
            await updateModule(moduleName, moduleData);
        },
        getGlobalStats: () => {
            const allData = data || getDefaultData();
            return allData.globalStats;
        },
        updateGlobalStats: async (updates: Partial<GlobalStats>) => {
            await updateGlobalStats(updates);
        },
        updateModuleStats: async (moduleName: ModuleName, statUpdates: Record<string, unknown>) => {
            const moduleData = { ...(data?.modules[moduleName] || getDefaultData().modules[moduleName]) };
            moduleData.stats = { ...moduleData.stats, ...statUpdates };
            await updateModule(moduleName, moduleData);
        },
        markLearned: async (moduleName: ModuleName, itemId: string) => {
            const moduleData = { ...(data?.modules[moduleName] || getDefaultData().modules[moduleName]) };
            const learned = moduleData.learned || [];
            if (!learned.includes(itemId)) {
                moduleData.learned = [...learned, itemId];
                await updateModule(moduleName, moduleData);
            }
        },
        isLearned: (moduleName: ModuleName, itemId: string) => {
            const moduleData = data?.modules[moduleName] || getDefaultData().modules[moduleName];
            const learned = moduleData.learned || [];
            return learned.includes(itemId);
        },
        getReviewData: (moduleName: ModuleName, itemId: string) => {
            const moduleData = data?.modules[moduleName] || getDefaultData().modules[moduleName];
            const reviews = moduleData.reviews || {};
            return reviews[itemId] || null;
        },
        saveReviewData: async (moduleName: ModuleName, itemId: string, reviewData: ReviewData) => {
            const moduleData = { ...(data?.modules[moduleName] || getDefaultData().modules[moduleName]) };
            const reviews = { ...(moduleData.reviews || {}) };
            reviews[itemId] = reviewData;
            moduleData.reviews = reviews;
            await updateModule(moduleName, moduleData);
        },
        clearAllData: async () => {
            // Reset to default data
            await saveUserData(getDefaultData());
        },
    };
}
