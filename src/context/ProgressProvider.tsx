'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useProgress } from '@/hooks/useProgress';
import { useStorage } from '@/hooks/useStorage';
import { ProgressContextValue, ContextProviderProps } from '@/types/context';

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: ContextProviderProps) {
    const storage = useStorage();
    const progress = useProgress();
    const [initialized, setInitialized] = useState(false);

    useEffect(() => {
        if (!storage.isLoading && !initialized) {
            progress.refresh();
            setInitialized(true);
        }
    }, [storage.isLoading, initialized, progress]);

    const value: ProgressContextValue = {
        ...progress,
        ...storage,
        initialized
    };

    return (
        <ProgressContext.Provider value={value}>
            {children}
        </ProgressContext.Provider>
    );
}

export function useProgressContext() {
    const context = useContext(ProgressContext);
    if (!context) {
        throw new Error('useProgressContext must be used within ProgressProvider');
    }
    return context;
}
