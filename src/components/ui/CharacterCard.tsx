'use client'

import { HTMLAttributes, ReactNode } from 'react';
import styles from './CharacterCard.module.css';

interface CharacterCardProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
    entering?: boolean;
    correct?: boolean;
}

export default function CharacterCard({
    entering = false,
    correct = false,
    className = '',
    children,
    ...props
}: CharacterCardProps) {
    const classes = [
        styles.card,
        entering && styles.entering,
        correct && styles.correct,
        className
    ].filter(Boolean).join(' ');

    return (
        <div className={classes} {...props}>
            {children}
        </div>
    );
}
