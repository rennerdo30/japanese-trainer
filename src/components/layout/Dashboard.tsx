'use client'

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useProgressContext } from '@/context/ProgressProvider';
import { useLanguage } from '@/context/LanguageProvider';
import ProgressBar from '@/components/common/ProgressBar';
import LanguageSwitcher from '@/components/common/LanguageSwitcher';
import AuthButton from '@/components/common/AuthButton';
import { Container, Card, Text, Animated } from '@/components/ui';
import styles from './Dashboard.module.css';

interface Module {
    id: string;
    icon: string;
    href: string;
    totalItems: number;
}

const MODULES: Module[] = [
    { id: 'alphabet', icon: 'あ', href: '/alphabet', totalItems: 112 },
    { id: 'vocabulary', icon: '📖', href: '/vocabulary', totalItems: 30 },
    { id: 'kanji', icon: '字', href: '/kanji', totalItems: 10 },
    { id: 'grammar', icon: '📝', href: '/grammar', totalItems: 5 },
    { id: 'reading', icon: '📄', href: '/reading', totalItems: 2 },
    { id: 'listening', icon: '🎧', href: '/listening', totalItems: 3 },
];

export default function Dashboard() {
    const { summary, getModuleProgress, refresh, initialized } = useProgressContext();
    const { t } = useLanguage();
    const [moduleProgress, setModuleProgress] = useState<Record<string, number>>({});

    useEffect(() => {
        if (initialized && summary) {
            const progress: Record<string, number> = {};
            MODULES.forEach(module => {
                progress[module.id] = getModuleProgress(module.id, module.totalItems);
            });
            setModuleProgress(progress);
        }
    }, [initialized, summary, getModuleProgress, refresh]);

    if (!summary) {
        return <Container variant="dashboard">{t('common.loading')}</Container>;
    }

    return (
        <Container variant="dashboard">
            <div className={styles.languageSwitcher}>
                <LanguageSwitcher />
            </div>
            <Animated animation="float" infinite className={styles.backgroundKanji}>
                学
            </Animated>
            <header className={styles.header}>
                <div className={styles.headerContent}>
                    <div>
                        <Text variant="h1" align="center" className={styles.title}>
                            {t('dashboard.title')}
                        </Text>
                        <Text variant="body" color="secondary" align="center" className={styles.subtitle}>
                            {t('dashboard.subtitle')}
                        </Text>
                    </div>
                    <div className={styles.headerActions}>
                        <AuthButton />
                    </div>
                </div>
            </header>

            <div className={styles.statsOverview}>
                <Card variant="glass" hover className={`${styles.statCard} fadeInUp stagger-1`}>
                    <div className={styles.statIcon}>🔥</div>
                    <Text variant="h2" color="gold" className={styles.statValue}>
                        {summary.streak || 0}
                    </Text>
                    <Text variant="label" color="muted" className={styles.statLabel}>
                        {t('dashboard.dayStreak')}
                    </Text>
                </Card>
                <Card variant="glass" hover className={`${styles.statCard} fadeInUp stagger-2`}>
                    <div className={styles.statIcon}>📚</div>
                    <Text variant="h2" color="gold" className={styles.statValue}>
                        {summary.totalWords || 0}
                    </Text>
                    <Text variant="label" color="muted" className={styles.statLabel}>
                        {t('dashboard.wordsLearned')}
                    </Text>
                </Card>
                <Card variant="glass" hover className={`${styles.statCard} fadeInUp stagger-3`}>
                    <div className={styles.statIcon}>字</div>
                    <Text variant="h2" color="gold" className={styles.statValue}>
                        {summary.totalKanji || 0}
                    </Text>
                    <Text variant="label" color="muted" className={styles.statLabel}>
                        {t('dashboard.kanjiMastered')}
                    </Text>
                </Card>
                <Card variant="glass" hover className={`${styles.statCard} fadeInUp stagger-4`}>
                    <div className={styles.statIcon}>⏱️</div>
                    <Text variant="h2" color="gold" className={styles.statValue}>
                        {Math.round((summary.totalStudyTime || 0) / 60)}
                    </Text>
                    <Text variant="label" color="muted" className={styles.statLabel}>
                        {t('dashboard.studyTime')}
                    </Text>
                </Card>
            </div>

            <div className={styles.modulesGrid}>
                {MODULES.map((module, index) => (
                    <Link key={module.id} href={module.href}>
                        <Card variant="glass" hover className={`${styles.moduleCard} fadeInUp stagger-${(index % 6) + 1}`}>
                            <div className={styles.moduleIcon}>{module.icon}</div>
                            <Text variant="h2" className={styles.moduleTitle}>
                                {t(`modules.${module.id}.title`)}
                            </Text>
                            <Text variant="body" color="secondary" className={styles.moduleDescription}>
                                {t(`modules.${module.id}.description`)}
                            </Text>
                            <ProgressBar
                                progress={moduleProgress[module.id] || 0}
                                showText={true}
                            />
                        </Card>
                    </Link>
                ))}
            </div>
        </Container>
    );
}
