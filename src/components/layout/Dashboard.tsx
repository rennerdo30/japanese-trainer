'use client'

import { useEffect, useState, useMemo, memo } from 'react';
import Link from 'next/link';
import { useProgressContext } from '@/context/ProgressProvider';
import { useLanguage } from '@/context/LanguageProvider';
import { useTargetLanguage } from '@/hooks/useTargetLanguage';
import { useGamification } from '@/hooks/useGamification';
import { useCurriculum } from '@/hooks/useCurriculum';
import { ModuleName } from '@/lib/language';
import ProgressBar from '@/components/common/ProgressBar';
import LanguageSwitcher from '@/components/common/LanguageSwitcher';
import TargetLanguageSelector from '@/components/common/TargetLanguageSelector';
import AuthButton from '@/components/common/AuthButton';
import XPDisplay from '@/components/gamification/XPDisplay';
import StreakBadge from '@/components/gamification/StreakBadge';
import DailyGoalCard from '@/components/gamification/DailyGoalCard';
import { Container, Card, Text, Animated, Button } from '@/components/ui';
import { IoFlame, IoBook, IoSchool, IoTime, IoDocumentText, IoHeadset, IoMap, IoRefresh, IoTrophy, IoSettings, IoPlay } from 'react-icons/io5';
import { PiExam } from 'react-icons/pi';
import LearningCompass from '@/components/dashboard/LearningCompass';
import MasteryHeatmap from '@/components/dashboard/MasteryHeatmap';
import StreakCalendar from '@/components/dashboard/StreakCalendar';
import styles from './Dashboard.module.css';

// Mapping from language code to primary learning path ID
const LANGUAGE_PATH_MAP: Record<string, string> = {
    ja: 'jlpt-mastery',
    es: 'cefr-spanish',
    de: 'cefr-german',
    it: 'cefr-italian',
    en: 'cefr-english',
    ko: 'topik-korean',
    zh: 'hsk-chinese',
};

const getPathIdForLanguage = (lang: string): string => {
    return LANGUAGE_PATH_MAP[lang] || LANGUAGE_PATH_MAP.ja;
};

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

function Dashboard() {
    const { summary, getModuleProgress, refresh, initialized } = useProgressContext();
    const { t } = useLanguage();
    const { targetLanguage, isModuleEnabled } = useTargetLanguage();
    const { level, streak, dailyGoal, todayXP, isLoading: gamificationLoading } = useGamification();
    const { lessons, lessonProgress, getLessonStatus } = useCurriculum();
    const [moduleProgress, setModuleProgress] = useState<Record<string, number>>({});

    // Find the current in-progress lesson or the next available one
    const currentLesson = useMemo(() => {
        // First, check for an in-progress lesson
        for (const flatLesson of lessons) {
            const status = getLessonStatus(flatLesson.lesson.id);
            if (status === 'in_progress') {
                return flatLesson.lesson;
            }
        }
        // Otherwise, find the first available lesson
        for (const flatLesson of lessons) {
            const status = getLessonStatus(flatLesson.lesson.id);
            if (status === 'available') {
                return flatLesson.lesson;
            }
        }
        // Default to first lesson if all are locked or none available
        return lessons.length > 0 ? lessons[0].lesson : null;
    }, [lessons, getLessonStatus]);

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
  
  
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 220" role="img" aria-label="Murmura wordmark">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1a1a2e"/>
      <stop offset="100%" stop-color="#0f0f1a"/>
    </linearGradient>
    <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#c41e3a"/>
      <stop offset="50%" stop-color="#d4a574"/>
      <stop offset="100%" stop-color="#c41e3a"/>
    </linearGradient>
  </defs>

  <g transform="translate(80,110)">
    <circle r="70" fill="url(#bgGradient)" stroke="url(#ringGradient)" stroke-width="4"/>
    <text x="0" y="0"
          text-anchor="middle"
          dominant-baseline="central"
          font-size="68"
          font-weight="700"
          fill="#f5f0e8"
          font-family="'Noto Sans JP','Hiragino Sans','Yu Gothic',system-ui,sans-serif">学</text>
  </g>

  <g transform="translate(190,0)">
    <text x="0" y="118"
          font-size="120"
          font-weight="700"
          fill="#f5f0e8"
          letter-spacing="1.2"
          font-family="'Playfair Display','Libre Baskerville','Georgia',serif">Murmura</text>

    <g transform="translate(12,145)" fill="none" stroke="#d4a574" stroke-linecap="round" opacity="0.40">
      <path d="M0 0 C45 -24, 95 -24, 140 0 S235 24, 280 0" stroke-width="4"/>
      <path d="M0 18 C45 -6, 95 -6, 140 18 S235 42, 280 18" stroke-width="3" opacity="0.6"/>
    </g>

    <text x="12" y="196"
          font-size="30"
          fill="#d4a574"
          opacity="0.85"
          letter-spacing="2.2"
          font-family="system-ui,-apple-system,'Segoe UI',Roboto,'Fira Sans',sans-serif">From whispers to fluency</text>
  </g>
</svg>




                    </div>
                    <div className={styles.headerActions}>
                        <TargetLanguageSelector />
                        <AuthButton />
                    </div>
                </div>
            </header>

            {/* Continue Learning Card */}
            {currentLesson && (
                <Card variant="glass" hover className={`${styles.continueLessonCard} fadeInUp`}>
                    <div className={styles.continueLessonContent}>
                        <div className={styles.continueLessonInfo}>
                            <Text variant="label" color="muted">Continue Learning</Text>
                            <Text variant="h2">{currentLesson.title}</Text>
                            <Text variant="body" color="secondary">{currentLesson.description}</Text>
                        </div>
                        <Link href={`/paths/${getPathIdForLanguage(targetLanguage)}/${currentLesson.id}`}>
                            <Button className={styles.continueLessonButton}>
                                <IoPlay /> Continue
                            </Button>
                        </Link>
                    </div>
                </Card>
            )}

            {/* Gamification Section */}
            <div className={styles.gamificationSection}>
                <XPDisplay level={level} compact />
                <StreakBadge streak={streak} showMessage size="md" />
                <DailyGoalCard
                    dailyGoal={dailyGoal}
                    streak={streak}
                    todayXP={todayXP}
                    compact
                />
            </div>

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

export default memo(Dashboard);
