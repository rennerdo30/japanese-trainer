// Context type definitions

import { ReactNode } from 'react';
import { ModuleData, ModuleStats } from './index';

export interface LanguageContextValue {
    language: string;
    changeLanguage: (langCode: string) => void;
    t: (key: string, params?: Record<string, string | number>) => string;
    isLoading: boolean;
    supportedLanguages: Array<{
        code: string;
        name: string;
        flag: string;
    }>;
}

export interface Settings {
    theme: string;
    soundEnabled: boolean;
    ttsEnabled: boolean;
    ttsRate: number;
    ttsVolume: number;
    timerEnabled: boolean;
    timerDuration: number;
}

export interface SettingsContextValue {
    settings: Settings;
    updateSetting: (key: keyof Settings, value: any) => void;
    loaded: boolean;
}

export interface ProgressSummary {
    totalWords: number;
    totalKanji: number;
    totalGrammar: number;
    textsRead: number;
    listeningExercises: number;
    streak: number;
    bestStreak: number;
    totalStudyTime: number;
}

export interface ProgressContextValue {
    summary: ProgressSummary | null;
    isLoading: boolean;
    initialized: boolean;
    refresh: () => void;
    updateStreak: () => number;
    getModuleProgress: (moduleName: string, totalItems: number) => number;
    recordStudyTime: (seconds: number) => void;
    getItemsDueForReview: (moduleName: string) => Array<{ itemId: string; reviewData: any }>;
    getMasteryLevel: (moduleName: string, itemId: string) => string;
    getModuleData: (moduleName: string) => ModuleData;
    updateModuleStats: (moduleName: string, stats: Partial<ModuleStats>) => void;
    updateData: (data: any) => void;
}

export interface ContextProviderProps {
    children: ReactNode;
}
