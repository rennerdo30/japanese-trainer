'use client'

import { HTMLAttributes, ReactNode, memo } from 'react';
import styles from './Text.module.css';

interface TextProps extends HTMLAttributes<HTMLDivElement> {
    variant?: 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'label';
    color?: 'primary' | 'secondary' | 'muted' | 'success' | 'error' | 'gold';
    align?: 'left' | 'center' | 'right';
    children: ReactNode;
    as?: 'h1' | 'h2' | 'h3' | 'p' | 'span' | 'div';
}

const Text = memo(function Text({
    variant = 'body',
    color = 'primary',
    align = 'left',
    as,
    className = '',
    children,
    ...props
}: TextProps) {
    const Component = as || (variant.startsWith('h') ? variant as 'h1' | 'h2' | 'h3' : 'div');

    const classes = [
        styles.text,
        styles[variant],
        styles[`color-${color}`],
        styles[`align-${align}`],
        className
    ].filter(Boolean).join(' ');

    return (
        <Component className={classes} {...props}>
            {children}
        </Component>
    );
});

export default Text;
