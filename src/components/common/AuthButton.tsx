'use client'

import { useState } from 'react';
import { useQuery } from 'convex/react';
import { useAuthActions } from '@convex-dev/auth/react';
import { api } from '../../../convex/_generated/api';
import LoginDialog from './LoginDialog';
import styles from './AuthButton.module.css';

export default function AuthButton() {
    const currentUser = useQuery(api.auth.getCurrentUser);
    const { signOut } = useAuthActions();
    const [showLoginDialog, setShowLoginDialog] = useState(false);

    if (currentUser === undefined) {
        return (
            <button className={`${styles.button} glass`} disabled>
                Loading...
            </button>
        );
    }

    if (currentUser) {
        return (
            <div className={styles.userInfo}>
                <span className={styles.userName}>
                    {currentUser.name || currentUser.email || 'User'}
                </span>
                <button
                    className={`${styles.button} ${styles.signOut}`}
                    onClick={() => signOut()}
                >
                    Sign Out
                </button>
            </div>
        );
    }

    return (
        <div className={styles.authContainer}>
            <button
                className={`${styles.button} ${styles.primary}`}
                onClick={() => setShowLoginDialog(true)}
            >
                Sign In
            </button>
            <LoginDialog
                isOpen={showLoginDialog}
                onClose={() => setShowLoginDialog(false)}
            />
        </div>
    );
}
