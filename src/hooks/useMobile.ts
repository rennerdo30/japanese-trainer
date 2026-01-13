'use client'

import { useState, useEffect } from 'react';

export function useMobile(): boolean {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = (): boolean => {
            const userAgent = navigator.userAgent || (navigator as any).vendor || (window as any).opera;
            const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
            const isUserAgentMobile = mobileRegex.test(userAgent.toLowerCase());
            const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            const isSmallScreen = window.innerWidth < 768;
            const conditions = [isUserAgentMobile, hasTouch, isSmallScreen];
            return conditions.filter(Boolean).length >= 2;
        };

        setIsMobile(checkMobile());

        const handleResize = () => {
            setIsMobile(checkMobile());
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return isMobile;
}
