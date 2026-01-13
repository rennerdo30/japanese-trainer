'use client'

import { HTMLAttributes } from 'react';
import styles from './CharacterDisplay.module.css';

interface CharacterDisplayProps extends HTMLAttributes<HTMLDivElement> {
    character: string;
    entering?: boolean;
    correct?: boolean;
    subtext?: string;
}

export default function CharacterDisplay({
    character,
    entering = false,
    correct = false,
    subtext,
    className = '',
    ...props
}: CharacterDisplayProps) {
    const classes = [
        styles.display,
        entering && styles.entering,
        correct && styles.correct,
        className
    ].filter(Boolean).join(' ');

    return (
        <div className={styles.container} {...props}>
            <div className={classes}>
                {character}
            </div>
            {subtext && (
                <div className={`${styles.subtext} ${entering ? styles.entering : ''}`}>
                    {subtext}
                </div>
            )}
        </div>
    );
}
