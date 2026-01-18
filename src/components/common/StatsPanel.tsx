'use client'

import { useLanguage } from '@/context/LanguageProvider';
import { IoFlame } from 'react-icons/io5';
import Text from '@/components/ui/Text';
import styles from './StatsPanel.module.css';

interface StatsPanelProps {
    correct: number;
    total: number;
    streak?: number;
    showStreak?: boolean;
}

export default function StatsPanel({ correct, total, streak = 0, showStreak = true }: StatsPanelProps) {
    const { t } = useLanguage();
    return (
        <div className={styles.container}>
            <div className={styles.item}>
                <Text variant="h2" color="success" className={styles.value}>
                    {correct}
                </Text>
                <Text variant="label" color="muted" className={styles.label}>
                    {t('stats.correct')}
                </Text>
            </div>
            <Text variant="h3" color="muted" className={styles.divider}>
                /
            </Text>
            <div className={styles.item}>
                <Text variant="h2" color="primary" className={styles.value}>
                    {total}
                </Text>
                <Text variant="label" color="muted" className={styles.label}>
                    {t('stats.total')}
                </Text>
            </div>
            {showStreak && streak > 0 && (
                <div className={`${styles.streakBadge} ${streak >= 3 ? styles.visible : ''}`}>
                    <IoFlame className={styles.streakIcon} />
                    <span>{streak}</span> {t('stats.streak')}
                </div>
            )}
        </div>
    );
}
