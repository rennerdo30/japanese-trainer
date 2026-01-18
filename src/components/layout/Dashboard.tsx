'use client'

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useProgressContext } from '@/context/ProgressProvider';
import { useLanguage } from '@/context/LanguageProvider';
import { useTargetLanguage } from '@/hooks/useTargetLanguage';
import { ModuleName } from '@/lib/language';
import ProgressBar from '@/components/common/ProgressBar';
import LanguageSwitcher from '@/components/common/LanguageSwitcher';
import TargetLanguageSelector from '@/components/common/TargetLanguageSelector';
import AuthButton from '@/components/common/AuthButton';
import { Container, Card, Text, Animated, Button } from '@/components/ui';
import { IoFlame, IoBook, IoSchool, IoTime, IoDocumentText, IoHeadset, IoMap, IoRefresh, IoTrophy, IoSettings } from 'react-icons/io5';
import { PiExam } from 'react-icons/pi';
import LearningCompass from '@/components/dashboard/LearningCompass';
import MasteryHeatmap from '@/components/dashboard/MasteryHeatmap';
import StreakCalendar from '@/components/dashboard/StreakCalendar';
import styles from './Dashboard.module.css';

interface Module {
    id: ModuleName;
    icon: React.ReactNode;
    href: string;
    totalItems: number;
}

// Icons that vary by language
const ALPHABET_ICONS: Record<string, string> = {
    ja: 'あ',
    ko: '한',
    zh: '拼',
    default: 'A'
};

const KANJI_ICONS: Record<string, string> = {
    ja: '字',
    zh: '汉',
    default: '字'
};

const getAlphabetIcon = (lang: string) => ALPHABET_ICONS[lang] || ALPHABET_ICONS.default;
const getKanjiIcon = (lang: string) => KANJI_ICONS[lang] || KANJI_ICONS.default;

// Background decoration per language (culturally appropriate)
const BACKGROUND_DECORATIONS: Record<string, string> = {
    ja: '学',   // Japanese: "learn/study" kanji
    es: 'Ñ',    // Spanish: distinctive letter
    de: 'ß',    // German: distinctive letter
    en: 'A',    // English: classic letter
    it: '&',    // Italian: ampersand flourish
    ko: '한',   // Korean: "han" in Hangul
    zh: '学',   // Chinese: "learn/study" hanzi
};

const getBackgroundDecoration = (lang: string) => BACKGROUND_DECORATIONS[lang] || BACKGROUND_DECORATIONS.ja;

// Language-specific module names and descriptions
const MODULE_NAMES: Record<string, Record<string, { title: string; description: string }>> = {
    ja: {
        alphabet: { title: 'Alphabet', description: 'Master Hiragana & Katakana' },
        kanji: { title: 'Kanji', description: 'Learn Japanese characters' },
    },
    ko: {
        alphabet: { title: 'Hangul', description: 'Master Korean alphabet' },
    },
    zh: {
        kanji: { title: 'Hanzi', description: 'Learn Chinese characters' },
    },
};

const getModuleName = (moduleId: string, lang: string, t: (key: string) => string) => {
    const langSpecific = MODULE_NAMES[lang]?.[moduleId];
    if (langSpecific) {
        return langSpecific;
    }
    // Fall back to translation system
    return {
        title: t(`modules.${moduleId}.title`),
        description: t(`modules.${moduleId}.description`)
    };
};

// Language-specific stat labels
const STAT_LABELS: Record<string, Record<string, string>> = {
    ja: { characters: 'Kanji Mastered' },
    zh: { characters: 'Hanzi Mastered' },
    ko: { characters: 'Hangul Mastered' },
    default: { characters: 'Characters Learned' },
};

const getStatLabel = (statKey: string, lang: string): string => {
    return STAT_LABELS[lang]?.[statKey] || STAT_LABELS.default[statKey] || statKey;
};

const ALL_MODULES: Module[] = [
    { id: 'alphabet', icon: <span className={styles.japaneseIcon}>あ</span>, href: '/alphabet', totalItems: 112 },
    { id: 'vocabulary', icon: <IoBook />, href: '/vocabulary', totalItems: 30 },
    { id: 'kanji', icon: <span className={styles.japaneseIcon}>字</span>, href: '/kanji', totalItems: 10 },
    { id: 'grammar', icon: <PiExam />, href: '/grammar', totalItems: 5 },
    { id: 'reading', icon: <IoDocumentText />, href: '/reading', totalItems: 2 },
    { id: 'listening', icon: <IoHeadset />, href: '/listening', totalItems: 3 },
];

export default function Dashboard() {
    const { summary, getModuleProgress, refresh, initialized } = useProgressContext();
    const { t } = useLanguage();
    const { targetLanguage, isModuleEnabled } = useTargetLanguage();
    const [moduleProgress, setModuleProgress] = useState<Record<string, number>>({});

    // Filter modules based on target language and update icons
    const filteredModules = useMemo(() => {
        return ALL_MODULES
            .filter(module => isModuleEnabled(module.id))
            .map(module => {
                // Update icons based on target language
                if (module.id === 'alphabet') {
                    return {
                        ...module,
                        icon: <span className={styles.japaneseIcon}>{getAlphabetIcon(targetLanguage)}</span>
                    };
                }
                if (module.id === 'kanji') {
                    return {
                        ...module,
                        icon: <span className={styles.japaneseIcon}>{getKanjiIcon(targetLanguage)}</span>
                    };
                }
                return module;
            });
    }, [targetLanguage, isModuleEnabled]);

    useEffect(() => {
        if (initialized && summary) {
            const progress: Record<string, number> = {};
            filteredModules.forEach(module => {
                progress[module.id] = getModuleProgress(module.id, module.totalItems);
            });
            setModuleProgress(progress);
        }
    }, [initialized, summary, getModuleProgress, refresh, filteredModules]);

    if (!summary) {
        return <Container variant="dashboard">{t('common.loading')}</Container>;
    }

    return (
        <Container variant="dashboard">
            <div className={styles.languageSwitcher}>
                <LanguageSwitcher />
            </div>
            <Animated animation="float" infinite className={styles.backgroundKanji}>
                {getBackgroundDecoration(targetLanguage)}
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
                        <TargetLanguageSelector />
                        <AuthButton />
                    </div>
                </div>
            </header>

            <div className={styles.statsOverview}>
                <Card variant="glass" hover className={`${styles.statCard} fadeInUp stagger-1`}>
                    <div className={styles.statIcon}><IoFlame /></div>
                    <Text variant="h2" color="gold" className={styles.statValue}>
                        {summary.streak || 0}
                    </Text>
                    <Text variant="label" color="muted" className={styles.statLabel}>
                        {t('dashboard.dayStreak')}
                    </Text>
                </Card>
                <Card variant="glass" hover className={`${styles.statCard} fadeInUp stagger-2`}>
                    <div className={styles.statIcon}><IoBook /></div>
                    <Text variant="h2" color="gold" className={styles.statValue}>
                        {summary.totalWords || 0}
                    </Text>
                    <Text variant="label" color="muted" className={styles.statLabel}>
                        {t('dashboard.wordsLearned')}
                    </Text>
                </Card>
                <Card variant="glass" hover className={`${styles.statCard} fadeInUp stagger-3`}>
                    <div className={styles.statIcon}><IoSchool /></div>
                    <Text variant="h2" color="gold" className={styles.statValue}>
                        {summary.totalKanji || 0}
                    </Text>
                    <Text variant="label" color="muted" className={styles.statLabel}>
                        {getStatLabel('characters', targetLanguage)}
                    </Text>
                </Card>
                <Card variant="glass" hover className={`${styles.statCard} fadeInUp stagger-4`}>
                    <div className={styles.statIcon}><IoTime /></div>
                    <Text variant="h2" color="gold" className={styles.statValue}>
                        {Math.round((summary.totalStudyTime || 0) / 60)}
                    </Text>
                    <Text variant="label" color="muted" className={styles.statLabel}>
                        {t('dashboard.studyTime')}
                    </Text>
                </Card>
            </div>

            {/* Quick Actions */}
            <div className={styles.quickActions}>
                <Link href="/paths">
                    <Button variant="ghost" className={styles.quickActionButton}>
                        <IoMap /> Browse Learning Paths
                    </Button>
                </Link>
                <Link href="/review">
                    <Button variant="ghost" className={styles.quickActionButton}>
                        <IoRefresh /> Review Dashboard
                    </Button>
                </Link>
                <Link href="/leaderboard">
                    <Button variant="ghost" className={styles.quickActionButton}>
                        <IoTrophy /> Leaderboard
                    </Button>
                </Link>
                <Link href="/settings">
                    <Button variant="ghost" className={styles.quickActionButton}>
                        <IoSettings /> Settings
                    </Button>
                </Link>
            </div>

            {/* New Dashboard Widgets */}
            <div className={styles.widgetsSection}>
                <LearningCompass className={styles.compassWidget} />
                <MasteryHeatmap className={styles.heatmapWidget} />
            </div>

            <div className={styles.calendarSection}>
                <StreakCalendar className={styles.calendarWidget} weeks={16} />
            </div>

            <div className={styles.modulesGrid}>
                {filteredModules.map((module, index) => {
                    const moduleNames = getModuleName(module.id, targetLanguage, t);
                    return (
                        <Link key={module.id} href={module.href}>
                            <Card variant="glass" hover className={`${styles.moduleCard} fadeInUp stagger-${(index % 6) + 1}`}>
                                <div className={styles.moduleIcon}>{module.icon}</div>
                                <Text variant="h2" className={styles.moduleTitle}>
                                    {moduleNames.title}
                                </Text>
                                <Text variant="body" color="secondary" className={styles.moduleDescription}>
                                    {moduleNames.description}
                                </Text>
                                <ProgressBar
                                    progress={moduleProgress[module.id] || 0}
                                    showText={true}
                                />
                            </Card>
                        </Link>
                    );
                })}
            </div>
        </Container>
    );
}
