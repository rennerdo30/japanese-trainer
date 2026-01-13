'use client'

import { useState, useEffect, useCallback } from 'react';
import * as progress from '@/lib/progress';
import { ProgressSummary } from '@/types/context';

interface UseProgressReturn {
    summary: ProgressSummary | null;
    isLoading: boolean;
    refresh: () => void;
    updateStreak: () => number;
    getModuleProgress: (moduleName: string, totalItems: number) => number;
    recordStudyTime: (seconds: number) => void;
    getItemsDueForReview: typeof progress.getItemsDueForReview;
    getMasteryLevel: typeof progress.getMasteryLevel;
}

export function useProgress(): UseProgressReturn {
    const [summary, setSummary] = useState<ProgressSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setSummary(progress.getProgressSummary());
        setIsLoading(false);
    }, []);

    const refresh = useCallback(() => {
        setSummary(progress.getProgressSummary());
    }, []);

    const updateStreak = useCallback(() => {
        const newStreak = progress.updateStreak();
        refresh();
        return newStreak;
    }, [refresh]);

    const getModuleProgress = useCallback((moduleName: string, totalItems: number) => {
        return progress.getModuleProgress(moduleName, totalItems);
    }, []);

    const recordStudyTime = useCallback((seconds: number) => {
        progress.recordStudyTime(seconds);
        refresh();
    }, [refresh]);

    return {
        summary,
        isLoading,
        refresh,
        updateStreak,
        getModuleProgress,
        recordStudyTime,
        getItemsDueForReview: progress.getItemsDueForReview,
        getMasteryLevel: progress.getMasteryLevel
    };
}
