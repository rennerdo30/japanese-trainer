'use client'

import { useState } from 'react';
import { useQuery } from 'convex/react';
import { useAuthActions } from '@convex-dev/auth/react';
import { useLanguage } from '@/context/LanguageProvider';
import { api } from '../../../convex/_generated/api';
import LoginDialog from './LoginDialog';
import styles from './AuthButton.module.css';

export default function AuthButton() {
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    const { t } = useLanguage();

    if (!convexUrl) {
        return null;
    }

    const currentUser = useQuery(api.auth.getCurrentUser);
    const { signOut } = useAuthActions();
    const [showLoginDialog, setShowLoginDialog] = useState(false);

    if (currentUser === undefined) {
        return (
            <button className={`${styles.button} glass`} disabled>
                {t('auth.loading')}
            </button>
        );
    }

    if (currentUser) {
        return (
            <div className={styles.userInfo}>
                <span className={styles.userName}>
                    {currentUser.name || currentUser.email || t('auth.user')}
                </span>
                <button
                    className={`${styles.button} ${styles.signOut}`}
                    onClick={() => signOut()}
                >
                    {t('auth.signOut')}
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
                {t('auth.signIn')}
            </button>
            <LoginDialog
                isOpen={showLoginDialog}
                onClose={() => setShowLoginDialog(false)}
            />
        </div>
    );
}
