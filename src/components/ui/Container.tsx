'use client'

import { HTMLAttributes, ReactNode } from 'react';
import styles from './Container.module.css';
import BurningEffect from '@/components/effects/BurningEffect';

interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'centered' | 'dashboard';
    children: ReactNode;
    streak?: number;
}

export default function Container({
    variant = 'default',
    className = '',
    children,
    streak = 0,
    ...props
}: ContainerProps) {
    const classes = [
        styles.container,
        styles[variant],
        className
    ].filter(Boolean).join(' ');

    return (
        <div className={classes} {...props}>
            {streak > 0 && <BurningEffect streak={streak} />}
            {children}
        </div>
    );
}
