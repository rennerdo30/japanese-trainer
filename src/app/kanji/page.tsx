'use client'

import { useState, useEffect, useCallback } from 'react';
import Navigation from '@/components/common/Navigation';
import StatsPanel from '@/components/common/StatsPanel';
import MultipleChoice from '@/components/common/MultipleChoice';
import { Container, CharacterCard, InputSection, Input, OptionsPanel, Text, Toggle, Chip, CharacterDisplay, Animated, Button } from '@/components/ui';
import optionsStyles from '@/components/ui/OptionsPanel.module.css';
import { useProgressContext } from '@/context/ProgressProvider';
import { useLanguage } from '@/context/LanguageProvider';
import { useTTS } from '@/hooks/useTTS';
import kanjiJson from '@/data/kanji.json';
import { KanjiItem, Filter } from '@/types';
import styles from './kanji.module.css';

const kanjiData = kanjiJson as KanjiItem[];

export default function KanjiPage() {
    const { updateModuleStats: updateStats } = useProgressContext();
    const { t } = useLanguage();
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

    const [filters, setFilters] = useState<Record<string, Filter>>({
        n5: { id: 'n5', label: 'JLPT N5', checked: true, type: 'checkbox' },
        n4: { id: 'n4', label: 'JLPT N4', checked: false, type: 'checkbox' },
        practiceMeaning: { id: 'practice-meaning', label: t('kanji.practiceMeaning'), checked: true, type: 'radio', name: 'kanji-mode' },
        practiceReading: { id: 'practice-reading', label: t('kanji.practiceReading'), checked: false, type: 'radio', name: 'kanji-mode' }
    });

    const getAvailableKanji = useCallback(() => {
        return kanjiData.filter(item => {
            if (filters.n5.checked && item.jlpt === 'N5') return true;
            if (filters.n4.checked && item.jlpt === 'N4') return true;
            return false;
        });
    }, [filters]);

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

    useEffect(() => {
        if (kanjiData.length > 0) {
            nextKanji();
        }
    }, [filters.n5.checked, filters.n4.checked, practiceType]);

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

    useEffect(() => {
        setFilters(prev => ({
            ...prev,
            practiceMeaning: { ...prev.practiceMeaning, label: t('kanji.practiceMeaning') },
            practiceReading: { ...prev.practiceReading, label: t('kanji.practiceReading') }
        }));
    }, [t]);

    if (!currentKanji) {
        return (
            <Container variant="centered">
                <Navigation />
                <div>{t('kanji.noKanji')}</div>
            </Container>
        );
    }

    return (
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
                    🔊
                </Button>
            </CharacterCard>

            <div className="mt-8 mb-4 min-h-[100px] flex flex-col items-center">
                <Animated animation="fadeInUp" key={currentKanji.id + (showInfo ? '-info' : '')}>
                    {showInfo ? (
                        <div className="text-center">
                            <Text variant="h2" color="gold">{currentKanji.meaning}</Text>
                            <Text color="muted" className="mt-2">
                                {t('kanji.onyomi')}: {currentKanji.onyomi.join(', ')}
                            </Text>
                            <Text color="muted">
                                {t('kanji.kunyomi')}: {currentKanji.kunyomi.join(', ')}
                            </Text>
                        </div>
                    ) : (
                        <Button variant="ghost" onClick={() => setShowInfo(true)}>
                            {t('common.showInfo') || 'Show Info'}
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
                    placeholder={practiceType === 'meaning' ? t('kanji.typeMeaningOrReading') : '読みを入力...'}
                    autoComplete="off"
                    disabled={isProcessing}
                    variant={inputState}
                    size="lg"
                    fullWidth
                />
                <StatsPanel correct={correct} total={total} streak={streak} />
            </InputSection>
        </Container>
    );
}

