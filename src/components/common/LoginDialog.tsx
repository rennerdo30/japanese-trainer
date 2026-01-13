'use client'

import { useState, useEffect } from 'react';
import { useAuthActions } from '@convex-dev/auth/react';
import styles from './LoginDialog.module.css';

interface LoginDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

type AuthMode = 'select' | 'email-password' | 'anonymous';

export default function LoginDialog({ isOpen, onClose }: LoginDialogProps) {
    const { signIn } = useAuthActions();
    const [mode, setMode] = useState<AuthMode>('select');
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

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

    // Close on Escape key
    useEffect(() => {
        if (!isOpen) return;

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

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
        } catch (err: any) {
            setError(err.message || 'Authentication failed');
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
        } catch (err: any) {
            setError(err.message || 'Anonymous sign-in failed');
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

            <div className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="login-dialog-title">
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
                            <div className={styles.optionIcon}>📧</div>
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
                            <div className={styles.optionIcon}>👤</div>
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
