'use client'

import { useState, useEffect, useCallback } from 'react';
import * as storage from '@/lib/storage';

interface UseStorageReturn {
    data: any;
    isLoading: boolean;
    updateData: (updates: any) => void;
    getModuleData: typeof storage.getModuleData;
    saveModuleData: typeof storage.saveModuleData;
    getGlobalStats: typeof storage.getGlobalStats;
    updateGlobalStats: typeof storage.updateGlobalStats;
    updateModuleStats: typeof storage.updateModuleStats;
    markLearned: typeof storage.markLearned;
    isLearned: typeof storage.isLearned;
    getReviewData: typeof storage.getReviewData;
    saveReviewData: typeof storage.saveReviewData;
    clearAllData: typeof storage.clearAllData;
}

export function useStorage(): UseStorageReturn {
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    const loadData = useCallback(() => {
        setData(storage.getAllData());
        setIsLoading(false);
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const updateData = useCallback((updates: any) => {
        const currentData = storage.getAllData();
        const newData = { ...currentData, ...updates };
        storage.saveAllData(newData);
        setData(newData);
    }, []);

    return {
        data,
        isLoading,
        updateData,
        getModuleData: storage.getModuleData,
        saveModuleData: storage.saveModuleData,
        getGlobalStats: storage.getGlobalStats,
        updateGlobalStats: storage.updateGlobalStats,
        updateModuleStats: storage.updateModuleStats,
        markLearned: storage.markLearned,
        isLearned: storage.isLearned,
        getReviewData: storage.getReviewData,
        saveReviewData: storage.saveReviewData,
        clearAllData: storage.clearAllData
    };
}
