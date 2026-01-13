'use client'

import { useEffect, useState, useMemo } from 'react';
import styles from './BurningEffect.module.css';
import { BURNING_THRESHOLD, MAX_BURNING_INTENSITY_STREAK } from '@/constants';

interface Ember {
    id: number;
    left: string;
    duration: string;
    delay: string;
    size: string;
    drift: string;
}

interface BurningEffectProps {
    streak: number;
}

export default function BurningEffect({ streak }: BurningEffectProps) {
    const [embers, setEmbers] = useState<Ember[]>([]);
    const isActive = streak >= BURNING_THRESHOLD;

    // Intensity factor from 0 to 1
    const intensity = useMemo(() => {
        if (!isActive) return 0;
        return Math.min(1, (streak - BURNING_THRESHOLD) / (MAX_BURNING_INTENSITY_STREAK - BURNING_THRESHOLD));
    }, [streak, isActive]);

    useEffect(() => {
        if (isActive) {
            // Generate embers based on intensity
            const count = Math.floor(10 + intensity * 40);
            const newEmbers = Array.from({ length: count }, (_, i) => ({
                id: Math.random(),
                left: `${Math.random() * 100}%`,
                duration: `${3 + Math.random() * 5}s`,
                delay: `-${Math.random() * 5}s`,
                size: `${2 + Math.random() * 4}px`,
                drift: `${(Math.random() - 0.5) * 100}px`
            }));
            setEmbers(newEmbers);
        } else {
            setEmbers([]);
        }
    }, [isActive, intensity]);

    if (!isActive) return null;

    return (
        <div className={`${styles.burningContainer} ${isActive ? styles.active : ''}`}>
            <div className={styles.emberLayer} style={{ opacity: 0.3 + intensity * 0.7 }} />
            <div className={styles.fireEdge} style={{ height: `${100 + intensity * 150}px`, opacity: 0.5 + intensity * 0.5 }} />
            <div className={styles.fireEdgeTop} style={{ height: `${50 + intensity * 100}px`, opacity: 0.3 + intensity * 0.4 }} />

            {embers.map((ember) => (
                <div
                    key={ember.id}
                    className={styles.ember}
                    style={{
                        left: ember.left,
                        width: ember.size,
                        height: ember.size,
                        '--duration': ember.duration,
                        '--drift': ember.drift,
                        animationDelay: ember.delay,
                    } as any}
                />
            ))}

            {/* SVG Filter for heat distortion if needed later */}
            <svg style={{ position: 'fixed', width: 0, height: 0 }}>
                <filter id="heatBlur">
                    <feTurbulence type="fractalNoise" baseFrequency="0.01" numOctaves="3" result="noise">
                        <animate attributeName="baseFrequency" values="0.01;0.015;0.01" dur="5s" repeatCount="indefinite" />
                    </feTurbulence>
                    <feDisplacementMap in="SourceGraphic" in2="noise" scale={5 + intensity * 15} />
                </filter>
            </svg>
        </div>
    );
}
