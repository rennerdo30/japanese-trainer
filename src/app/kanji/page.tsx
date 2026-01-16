'use client'

import { useState, useEffect, useCallback, useMemo } from 'react';
import Navigation from '@/components/common/Navigation';
import StatsPanel from '@/components/common/StatsPanel';
import MultipleChoice from '@/components/common/MultipleChoice';
import LanguageContentGuard from '@/components/common/LanguageContentGuard';
import { Container, CharacterCard, InputSection, Input, OptionsPanel, Text, Toggle, Chip, CharacterDisplay, Animated, Button } from '@/components/ui';
import optionsStyles from '@/components/ui/OptionsPanel.module.css';
import { useProgressContext } from '@/context/ProgressProvider';
import { useLanguage } from '@/context/LanguageProvider';
import { useTargetLanguage } from '@/hooks/useTargetLanguage';
import { useTTS } from '@/hooks/useTTS';
import { KanjiItem, Filter } from '@/types';
import { IoVolumeHigh } from 'react-icons/io5';
import styles from './kanji.module.css';

// Import kanji/hanzi data for each language
import jaKanjiJson from '@/data/ja/kanji.json';
import zhHanziJson from '@/data/zh/hanzi.json';

// Extended type for Chinese Hanzi
interface HanziItem {
    id: string;
    hanzi: string;
    meaning: string;
    pinyin: string;
    strokes: number;
    hsk: string;
    radicals: string[];
    examples: Array<{
        word: string;
        pinyin: string;
        meaning: string;
        audioUrl?: string;
    }>;
    audioUrl?: string;
}

// Normalize Hanzi to KanjiItem for unified handling
const normalizeHanzi = (hanzi: HanziItem): KanjiItem => ({
    id: hanzi.id,
    kanji: hanzi.hanzi,
    meaning: hanzi.meaning,
    onyomi: [hanzi.pinyin], // Use pinyin as the primary reading
    kunyomi: [],
    strokes: hanzi.strokes,
    jlpt: hanzi.hsk, // Use HSK level in place of JLPT
    radicals: hanzi.radicals,
    examples: hanzi.examples.map(ex => ({
        word: ex.word,
        reading: ex.pinyin,
        meaning: ex.meaning,
        audioUrl: ex.audioUrl,
    })),
    audioUrl: hanzi.audioUrl,
});

// Get character data based on target language
const getCharacterData = (lang: string): KanjiItem[] => {
    switch (lang) {
        case 'zh':
            return (zhHanziJson as HanziItem[]).map(normalizeHanzi);
        case 'ja':
        default:
            return jaKanjiJson as KanjiItem[];
    }
};

// Level filter configurations per language
interface LevelFilterConfig {
    id: string;
    label: string;
    value: string;
}

const LEVEL_FILTERS: Record<string, LevelFilterConfig[]> = {
    ja: [
        { id: 'n5', label: 'JLPT N5', value: 'N5' },
        { id: 'n4', label: 'JLPT N4', value: 'N4' },
        { id: 'n3', label: 'JLPT N3', value: 'N3' },
        { id: 'n2', label: 'JLPT N2', value: 'N2' },
        { id: 'n1', label: 'JLPT N1', value: 'N1' },
    ],
    zh: [
        { id: 'hsk1', label: 'HSK 1', value: 'HSK1' },
        { id: 'hsk2', label: 'HSK 2', value: 'HSK2' },
        { id: 'hsk3', label: 'HSK 3', value: 'HSK3' },
        { id: 'hsk4', label: 'HSK 4', value: 'HSK4' },
        { id: 'hsk5', label: 'HSK 5', value: 'HSK5' },
        { id: 'hsk6', label: 'HSK 6', value: 'HSK6' },
    ],
};

// Reading labels per language
const READING_LABELS: Record<string, { primary: string; secondary?: string }> = {
    ja: { primary: 'kanji.onyomi', secondary: 'kanji.kunyomi' },
    zh: { primary: 'kanji.pinyin' },
};

export default function KanjiPage() {
    const { updateModuleStats: updateStats } = useProgressContext();
    const { t } = useLanguage();
    const { targetLanguage } = useTargetLanguage();
    const { speak } = useTTS();
    const [currentKanji, setCurrentKanji] = useState<KanjiItem | null>(null);
    const [correct, setCorrect] = useState(0);
    const [total, setTotal] = useState(0);
    const [streak, setStreak] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [practiceType, setPracticeType] = useState<'meaning' | 'reading'>('meaning');
    const [inputValue, setInputValue] = useState('');
    const [isCharacterEntering, setIsCharacterEntering] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [inputState, setInputState] = useState<'default' | 'success' | 'error'>('default');
    const [showInfo, setShowInfo] = useState(false);

    // Get data and configurations for current language
    const kanjiData = useMemo(() => getCharacterData(targetLanguage), [targetLanguage]);
    const levelFilters = useMemo(() => LEVEL_FILTERS[targetLanguage] || LEVEL_FILTERS.ja, [targetLanguage]);
    const readingLabels = useMemo(() => READING_LABELS[targetLanguage] || READING_LABELS.ja, [targetLanguage]);

    // Initialize level filters based on language
    const [filters, setFilters] = useState<Record<string, Filter>>(() => {
        const levelConfig = LEVEL_FILTERS[targetLanguage] || LEVEL_FILTERS.ja;
        const initialFilters: Record<string, Filter> = {};
        levelConfig.forEach((lf, index) => {
            initialFilters[lf.id] = {
                id: lf.id,
                label: lf.label,
                checked: index === 0, // First level checked by default
                type: 'checkbox',
            };
        });
        initialFilters.practiceMeaning = { id: 'practice-meaning', label: t('kanji.practiceMeaning'), checked: true, type: 'radio', name: 'kanji-mode' };
        initialFilters.practiceReading = { id: 'practice-reading', label: t('kanji.practiceReading'), checked: false, type: 'radio', name: 'kanji-mode' };
        return initialFilters;
    });

    const getAvailableKanji = useCallback(() => {
        return kanjiData.filter(item => {
            // Check each level filter for the current language
            for (const lf of levelFilters) {
                if (filters[lf.id]?.checked && item.jlpt === lf.value) {
                    return true;
                }
            }
            return false;
        });
    }, [filters, levelFilters, kanjiData]);

    const nextKanji = useCallback(() => {
        const available = getAvailableKanji();
        if (available.length === 0) {
            setCurrentKanji(null);
            return;
        }

        const index = Math.floor(Math.random() * available.length);
        const newKanji = available[index];

        setIsCharacterEntering(false);
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                setCurrentKanji(newKanji);
                setInputValue('');
                setShowInfo(false);
                setIsCorrect(false);
                setInputState('default');
                setIsCharacterEntering(true);
                setTimeout(() => setIsCharacterEntering(false), 400);
            });
        });
    }, [getAvailableKanji]);

    const handleCorrect = useCallback(() => {
        if (!currentKanji) return;
        setIsProcessing(true);
        setIsCorrect(true);
        setInputState('success');
        setCorrect(prev => prev + 1);
        setTotal(prev => prev + 1);
        setStreak(prev => prev + 1);
        speak(currentKanji.kanji, { audioUrl: currentKanji.audioUrl });
        updateStats('kanji', { correct: correct + 1, total: total + 1, streak: streak + 1 });
        setTimeout(() => {
            nextKanji();
            setIsProcessing(false);
        }, 1000);
    }, [currentKanji, correct, total, streak, speak, updateStats, nextKanji]);

    const handleIncorrect = useCallback(() => {
        if (!currentKanji) return;
        setIsProcessing(true);
        setInputState('error');
        setTotal(prev => prev + 1);
        setStreak(0);
        speak(currentKanji.kanji, { audioUrl: currentKanji.audioUrl });
        updateStats('kanji', { correct, total: total + 1, streak: 0 });
        setTimeout(() => {
            nextKanji();
            setIsProcessing(false);
        }, 2000);
    }, [currentKanji, correct, total, speak, updateStats, nextKanji]);

    const checkInput = useCallback((value: string) => {
        if (isProcessing || !currentKanji) return;
        const normalizedInput = value.toLowerCase().trim();

        if (practiceType === 'meaning') {
            if (normalizedInput === currentKanji.meaning.toLowerCase().trim()) {
                handleCorrect();
            }
        } else {
            const isCorrectReading = currentKanji.onyomi.some(r => r.trim() === normalizedInput) ||
                currentKanji.kunyomi.some(r => r.trim() === normalizedInput);
            if (isCorrectReading) {
                handleCorrect();
            }
        }
    }, [isProcessing, currentKanji, practiceType, handleCorrect]);

    const { getModuleData } = useProgressContext();

    useEffect(() => {
        const moduleData = getModuleData('kanji');
        setCorrect(moduleData?.stats?.correct || 0);
        setTotal(moduleData?.stats?.total || 0);
        setStreak(moduleData?.stats?.streak || 0);
    }, [getModuleData]);

    // Create a stable string of filter states for dependency tracking
    const filterStates = useMemo(() => {
        return Object.entries(filters)
            .filter(([id]) => id !== 'practiceMeaning' && id !== 'practiceReading')
            .map(([id, f]) => `${id}:${f.checked}`)
            .join(',');
    }, [filters]);

    useEffect(() => {
        if (kanjiData.length > 0) {
            nextKanji();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterStates, practiceType, targetLanguage]);

    const handleFilterChange = useCallback((id: string, checked: boolean) => {
        if (id === 'practice-meaning' || id === 'practice-reading') {
            setPracticeType(id === 'practice-meaning' ? 'meaning' : 'reading');
            setFilters(prev => ({
                ...prev,
                practiceMeaning: { ...prev.practiceMeaning, checked: id === 'practice-meaning' },
                practiceReading: { ...prev.practiceReading, checked: id === 'practice-reading' }
            }));
        } else {
            setFilters(prev => ({ ...prev, [id]: { ...prev[id], checked } }));
        }
    }, []);

    // Update labels when translation changes
    useEffect(() => {
        setFilters(prev => ({
            ...prev,
            practiceMeaning: { ...prev.practiceMeaning, label: t('kanji.practiceMeaning') },
            practiceReading: { ...prev.practiceReading, label: t('kanji.practiceReading') }
        }));
    }, [t]);

    // Reset filters when language changes
    useEffect(() => {
        const newFilters: Record<string, Filter> = {};
        levelFilters.forEach((lf, index) => {
            newFilters[lf.id] = {
                id: lf.id,
                label: lf.label,
                checked: index === 0,
                type: 'checkbox',
            };
        });
        newFilters.practiceMeaning = { id: 'practice-meaning', label: t('kanji.practiceMeaning'), checked: true, type: 'radio', name: 'kanji-mode' };
        newFilters.practiceReading = { id: 'practice-reading', label: t('kanji.practiceReading'), checked: false, type: 'radio', name: 'kanji-mode' };
        setFilters(newFilters);
        setPracticeType('meaning');
    }, [targetLanguage, levelFilters, t]);

    if (!currentKanji) {
        return (
            <LanguageContentGuard moduleName="kanji">
                <Container variant="centered">
                    <Navigation />
                    <div>{t('kanji.noKanji')}</div>
                </Container>
            </LanguageContentGuard>
        );
    }

    return (
        <LanguageContentGuard moduleName="kanji">
            <Container variant="centered" streak={streak}>
                <Navigation />

            <OptionsPanel>
                <div className={optionsStyles.toggleContainer}>
                    <Text variant="label" color="muted">{t('kanji.practiceMeaning')}</Text>
                    <Toggle
                        options={[
                            { id: 'meaning', label: t('kanji.practiceMeaning') },
                            { id: 'reading', label: t('kanji.practiceReading') }
                        ]}
                        value={practiceType}
                        onChange={(val) => {
                            setPracticeType(val as 'meaning' | 'reading');
                            setFilters(prev => ({
                                ...prev,
                                practiceMeaning: { ...prev.practiceMeaning, checked: val === 'meaning' },
                                practiceReading: { ...prev.practiceReading, checked: val === 'reading' }
                            }));
                        }}
                        name="kanji-mode"
                    />
                </div>
                <div className={optionsStyles.group}>
                    {Object.values(filters)
                        .filter(f => f.id !== 'practice-meaning' && f.id !== 'practice-reading')
                        .map((filter) => (
                            <Chip
                                key={filter.id}
                                id={filter.id}
                                label={filter.label}
                                checked={filter.checked}
                                onChange={(checked) => handleFilterChange(filter.id, checked)}
                            />
                        ))}
                </div>
            </OptionsPanel>

            <CharacterCard entering={isCharacterEntering} correct={isCorrect}>
                <CharacterDisplay
                    character={currentKanji.kanji}
                    entering={isCharacterEntering}
                    correct={isCorrect}
                />
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => speak(currentKanji.kanji, { audioUrl: currentKanji.audioUrl })}
                    className={styles.audioButton}
                >
                    <IoVolumeHigh />
                </Button>
            </CharacterCard>

            <div className="mt-8 mb-4 min-h-[100px] flex flex-col items-center">
                <Animated animation="fadeInUp" key={currentKanji.id + (showInfo ? '-info' : '')}>
                    {showInfo ? (
                        <div className="text-center">
                            <Text variant="h2" color="gold">{currentKanji.meaning}</Text>
                            {/* Show language-specific reading labels */}
                            <Text color="muted" className="mt-2">
                                {t(readingLabels.primary)}: {currentKanji.onyomi.join(', ')}
                            </Text>
                            {readingLabels.secondary && currentKanji.kunyomi.length > 0 && (
                                <Text color="muted">
                                    {t(readingLabels.secondary)}: {currentKanji.kunyomi.join(', ')}
                                </Text>
                            )}
                        </div>
                    ) : (
                        <Button variant="ghost" onClick={() => setShowInfo(true)}>
                            {t('kanji.showInfo')}
                        </Button>
                    )}
                </Animated>
            </div>

            <InputSection>
                <Input
                    type="text"
                    value={inputValue}
                    onChange={(e) => {
                        setInputValue(e.target.value);
                        checkInput(e.target.value);
                    }}
                    placeholder={practiceType === 'meaning' ? t('kanji.typeMeaningOrReading') : t('kanji.typeReading')}
                    autoComplete="off"
                    disabled={isProcessing}
                    variant={inputState}
                    size="lg"
                    fullWidth
                />
                <StatsPanel correct={correct} total={total} streak={streak} />
            </InputSection>
            </Container>
        </LanguageContentGuard>
    );
}

