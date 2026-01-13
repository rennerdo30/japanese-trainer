'use client'

import { HTMLAttributes, ReactNode } from 'react';
import styles from './Card.module.css';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'elevated' | 'outlined' | 'glass';
    hover?: boolean;
    children: ReactNode;
}

export default function Card({
    variant = 'default',
    hover = false,
    className = '',
    children,
    ...props
}: CardProps) {
    const classes = [
        styles.card,
        styles[variant],
        hover && styles.hover,
        className
    ].filter(Boolean).join(' ');

    return (
        <div className={classes} {...props}>
            {children}
        </div>
    );
}
