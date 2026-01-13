'use client'

import { HTMLAttributes, ReactNode } from 'react';
import styles from './InputSection.module.css';

interface InputSectionProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
}

export default function InputSection({
    className = '',
    children,
    ...props
}: InputSectionProps) {
    const classes = [
        styles.section,
        className
    ].filter(Boolean).join(' ');

    return (
        <div className={classes} {...props}>
            {children}
        </div>
    );
}
