'use client'

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthActions } from '@convex-dev/auth/react';
import { IoMail, IoPerson } from 'react-icons/io5';
import styles from './LoginDialog.module.css';

interface LoginDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

type AuthMode = 'select' | 'email-password' | 'anonymous';

// Convert Convex auth errors to user-friendly messages
function getAuthErrorMessage(error: unknown): string {
    const errorObj = error as { message?: string } | null;
    const message = errorObj?.message || String(error);

    // Invalid credentials / account not found
    if (message.includes('InvalidAccountId') || message.includes('InvalidSecret')) {
        return 'Invalid email or password. Please check your credentials and try again.';
    }

    // Account already exists
    if (message.includes('AccountAlreadyExists') || message.includes('already exists')) {
        return 'An account with this email already exists. Try signing in instead.';
    }

    // Invalid email format
    if (message.includes('InvalidEmail') || message.includes('invalid email')) {
        return 'Please enter a valid email address.';
    }

    // Password too short/weak
    if (message.includes('password') && (message.includes('short') || message.includes('weak'))) {
        return 'Password must be at least 8 characters long.';
    }

    // Rate limiting
    if (message.includes('rate') || message.includes('too many')) {
        return 'Too many attempts. Please wait a moment and try again.';
    }

    // Network errors
    if (message.includes('network') || message.includes('fetch')) {
        return 'Connection error. Please check your internet and try again.';
    }

    // Generic fallback
    return 'Authentication failed. Please try again.';
}

export default function LoginDialog({ isOpen, onClose }: LoginDialogProps) {
    const { signIn } = useAuthActions();
    const [mode, setMode] = useState<AuthMode>('select');
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const dialogRef = useRef<HTMLDivElement>(null);
    const previousActiveElement = useRef<HTMLElement | null>(null);

    // Reset form when dialog opens/closes
    useEffect(() => {
        if (isOpen) {
            setMode('select');
            setEmail('');
            setPassword('');
            setError('');
            setIsSignUp(false);
        }
    }, [isOpen]);

    // Store previously focused element and restore on close
    useEffect(() => {
        if (isOpen) {
            previousActiveElement.current = document.activeElement as HTMLElement;
        } else if (previousActiveElement.current) {
            previousActiveElement.current.focus();
        }
    }, [isOpen]);

    // Focus trap: keep focus within dialog
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (!isOpen || !dialogRef.current) return;

        if (e.key === 'Escape') {
            onClose();
            return;
        }

        if (e.key === 'Tab') {
            const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
                'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
            );

            if (focusableElements.length === 0) return;

            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            if (e.shiftKey) {
                // Shift+Tab: if on first element, go to last
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                }
            } else {
                // Tab: if on last element, go to first
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        }
    }, [isOpen, onClose]);

    // Attach keyboard listener for focus trap
    useEffect(() => {
        if (!isOpen) return;

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, handleKeyDown]);

    // Focus first focusable element when dialog opens
    useEffect(() => {
        if (isOpen && dialogRef.current) {
            // Small delay to ensure dialog is rendered
            setTimeout(() => {
                const firstFocusable = dialogRef.current?.querySelector<HTMLElement>(
                    'button:not([disabled]), input:not([disabled])'
                );
                firstFocusable?.focus();
            }, 100);
        }
    }, [isOpen, mode]);

    const handleEmailPasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await signIn('password', {
                flow: isSignUp ? 'signUp' : 'signIn',
                email,
                password,
            });
            onClose();
            setEmail('');
            setPassword('');
        } catch (err: unknown) {
            setError(getAuthErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    const handleAnonymousSignIn = async () => {
        setError('');
        setLoading(true);

        try {
            await signIn('anonymous', {});
            onClose();
        } catch (err: unknown) {
            setError(getAuthErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <div
                className={styles.backdrop}
                onClick={onClose}
            />

            <div ref={dialogRef} className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="login-dialog-title">
                <button
                    className={styles.close}
                    onClick={onClose}
                    aria-label="Close dialog"
                >
                    ×
                </button>

                <h2 id="login-dialog-title" className={styles.title}>
                    {mode === 'select' && 'Sign In'}
                    {mode === 'email-password' && (isSignUp ? 'Create Account' : 'Sign In')}
                    {mode === 'anonymous' && 'Continue Anonymously'}
                </h2>

                {error && (
                    <div className={styles.error} role="alert">
                        {error}
                    </div>
                )}

                {mode === 'select' && (
                    <div className={styles.options}>
                        <button
                            className={styles.optionCard}
                            onClick={() => setMode('email-password')}
                            disabled={loading}
                        >
                            <div className={styles.optionIcon}><IoMail /></div>
                            <div className={styles.optionTitle}>Email & Password</div>
                            <div className={styles.optionDescription}>
                                Sign in with your email and password. Access your account from any device.
                            </div>
                        </button>

                        <button
                            className={styles.optionCard}
                            onClick={handleAnonymousSignIn}
                            disabled={loading}
                        >
                            <div className={styles.optionIcon}><IoPerson /></div>
                            <div className={styles.optionTitle}>Continue Anonymously</div>
                            <div className={styles.optionDescription}>
                                Start using the app immediately. Your session is tied to this device only.
                            </div>
                        </button>
                    </div>
                )}

                {mode === 'email-password' && (
                    <form onSubmit={handleEmailPasswordSubmit} className={styles.form}>
                        <div className={styles.formGroup}>
                            <label htmlFor="email" className={styles.label}>Email</label>
                            <input
                                id="email"
                                type="email"
                                placeholder="your@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className={styles.input}
                                autoFocus
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="password" className={styles.label}>Password</label>
                            <input
                                id="password"
                                type="password"
                                placeholder={isSignUp ? "At least 8 characters" : "Enter your password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={8}
                                className={styles.input}
                            />
                        </div>

                        <div className={styles.actions}>
                            <button
                                type="button"
                                className={`${styles.button} ${styles.secondary}`}
                                onClick={() => setMode('select')}
                                disabled={loading}
                            >
                                Back
                            </button>
                            <button
                                type="submit"
                                className={`${styles.button} ${styles.primary}`}
                                disabled={loading}
                            >
                                {loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
                            </button>
                        </div>

                        <button
                            type="button"
                            className={styles.linkButton}
                            onClick={() => {
                                setIsSignUp(!isSignUp);
                                setError('');
                            }}
                        >
                            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                        </button>
                    </form>
                )}

                {loading && mode === 'anonymous' && (
                    <div className={styles.loading}>
                        <div className={styles.spinner}></div>
                        <p>Signing in...</p>
                    </div>
                )}
            </div>
        </>
    );
}
