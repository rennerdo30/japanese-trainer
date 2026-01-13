'use client'

import { useState, useEffect, useRef, useCallback } from 'react';

interface UseTimerReturn {
    timeLeft: number;
    isRunning: boolean;
    start: () => void;
    stop: () => void;
    reset: () => void;
}

export function useTimer(initialTime: number, onTimeout?: () => void): UseTimerReturn {
    const [timeLeft, setTimeLeft] = useState(initialTime);
    const [isRunning, setIsRunning] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const start = useCallback(() => {
        setIsRunning(true);
        setTimeLeft(initialTime);
    }, [initialTime]);

    const stop = useCallback(() => {
        setIsRunning(false);
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    const reset = useCallback(() => {
        stop();
        setTimeLeft(initialTime);
    }, [initialTime, stop]);

    useEffect(() => {
        if (isRunning && timeLeft > 0) {
            intervalRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        setIsRunning(false);
                        if (onTimeout) onTimeout();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isRunning, timeLeft, onTimeout]);

    return {
        timeLeft,
        isRunning,
        start,
        stop,
        reset
    };
}
