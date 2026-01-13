'use client'

import { InputHTMLAttributes, forwardRef } from 'react';
import styles from './Input.module.css';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
    variant?: 'default' | 'error' | 'success';
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
    variant = 'default',
    size = 'md',
    fullWidth = false,
    className = '',
    ...props
}, ref) => {
    const classes = [
        styles.input,
        styles[variant],
        styles[size],
        fullWidth && styles.fullWidth,
        className
    ].filter(Boolean).join(' ');

    return (
        <input ref={ref} className={classes} {...props} />
    );
});

Input.displayName = 'Input';

export default Input;
