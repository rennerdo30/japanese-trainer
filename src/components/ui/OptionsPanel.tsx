'use client'

import { HTMLAttributes, ReactNode } from 'react';
import styles from './OptionsPanel.module.css';

interface OptionsPanelProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
}

export default function OptionsPanel({
    className = '',
    children,
    ...props
}: OptionsPanelProps) {
    const classes = [
        styles.panel,
        className
    ].filter(Boolean).join(' ');

    return (
        <div className={classes} {...props}>
            {children}
        </div>
    );
}
