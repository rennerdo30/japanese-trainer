'use client'

import { ReactNode } from 'react';

interface AnimatedProps {
    children: ReactNode;
    animation: 'fadeInUp' | 'fadeInDown' | 'float' | 'pulse' | 'shake' | 'characterEnter';
    delay?: number;
    className?: string;
    infinite?: boolean;
}

export default function Animated({
    children,
    animation,
    delay = 0,
    className = '',
    infinite = false
}: AnimatedProps) {
    const animationClass = `animate-${animation}`;
    const delayStyle = delay ? { animationDelay: `${delay}s` } : {};

    // CharacterEnter has its own specialized class in globals.css for now
    const baseClass = animation === 'characterEnter' ? 'character-entering' : animationClass;

    return (
        <div
            className={`${baseClass} ${className}`}
            style={{
                ...delayStyle,
                animationIterationCount: infinite ? 'infinite' : undefined
            }}
        >
            {children}
        </div>
    );
}
