'use client'

import { useCallback } from 'react';
import * as srs from '@/lib/srs';
import { getReviewData, saveReviewData } from '@/lib/storage';

interface UseSRSReturn {
    calculateNextReview: (itemId: string, quality: number) => any;
    getQualityFromResponse: (isCorrect: boolean, responseTime: number, difficulty?: string) => number;
    isDueForReview: typeof srs.isDueForReview;
    getReviewPriority: typeof srs.getReviewPriority;
    getMasteryStatus: typeof srs.getMasteryStatus;
    SRS_CONFIG: typeof srs.SRS_CONFIG;
}

export function useSRS(moduleName: string): UseSRSReturn {
    const calculateNextReview = useCallback((itemId: string, quality: number) => {
        const reviewData = getReviewData(moduleName, itemId);
        const newReviewData = srs.calculateNextReview(reviewData, quality);
        saveReviewData(moduleName, itemId, newReviewData);
        return newReviewData;
    }, [moduleName]);

    const getQualityFromResponse = useCallback((isCorrect: boolean, responseTime: number, difficulty: string = 'normal') => {
        return srs.getQualityFromResponse(isCorrect, responseTime, difficulty);
    }, []);

    return {
        calculateNextReview,
        getQualityFromResponse,
        isDueForReview: srs.isDueForReview,
        getReviewPriority: srs.getReviewPriority,
        getMasteryStatus: srs.getMasteryStatus,
        SRS_CONFIG: srs.SRS_CONFIG
    };
}
