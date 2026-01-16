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
    updateModuleReview: (moduleName: string, itemId: string, reviewData: any) => void;
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

    const updateModuleReview = useCallback((moduleName: string, itemId: string, reviewData: any) => {
        // Get current module data
        const moduleData = storage.getModuleData(moduleName);
        const currentReviews = moduleData?.reviews || {};

        // Update the reviews object
        const updatedReviews = {
            ...currentReviews,
            [itemId]: reviewData
        };

        // Save back to storage
        storage.saveModuleData(moduleName, {
            ...moduleData,
            reviews: updatedReviews
        });

        // Also mark as learned if not already
        if (!moduleData?.learned?.includes(itemId)) {
            storage.markLearned(moduleName, itemId);
        }

        // Reload data
        setData(storage.getAllData());
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
        clearAllData: storage.clearAllData,
        updateModuleReview
    };
}
