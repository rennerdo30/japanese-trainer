'use client'

import { useState, useEffect, useCallback, useMemo } from 'react';
import Navigation from '@/components/common/Navigation';
import StatsPanel from '@/components/common/StatsPanel';
import MultipleChoice from '@/components/common/MultipleChoice';
import LanguageContentGuard from '@/components/common/LanguageContentGuard';
import { Container, CharacterCard, InputSection, Input, OptionsPanel, Text, Toggle, Chip, CharacterDisplay, Animated } from '@/components/ui';
import optionsStyles from '@/components/ui/OptionsPanel.module.css';
import { useProgressContext } from '@/context/ProgressProvider';
import { useLanguage } from '@/context/LanguageProvider';
import { useTargetLanguage } from '@/hooks/useTargetLanguage';
import { useTTS } from '@/hooks/useTTS';
import { getVocabularyData, getItemLevel } from '@/lib/dataLoader';
import { VocabularyItem, Filter } from '@/types';
import styles from './vocabulary.module.css';

export default function VocabularyPage() {
    const { updateModuleStats: updateStats } = useProgressContext();
    const { t } = useLanguage();
    const { targetLanguage, levels } = useTargetLanguage();
    const { speak } = useTTS();
    const [currentWord, setCurrentWord] = useState<VocabularyItem | null>(null);
    const [correct, setCorrect] = useState(0);
    const [total, setTotal] = useState(0);
    const [streak, setStreak] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [practiceMode, setPracticeMode] = useState(false); // false = meaning, true = multiple choice
    const [multipleChoiceOptions, setMultipleChoiceOptions] = useState<string[]>([]);
    const [isCharacterEntering, setIsCharacterEntering] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [inputState, setInputState] = useState<'default' | 'success' | 'error'>('default');

    // Get vocabulary data for the current language (from centralized data loader)
    const vocabulary = useMemo(() => getVocabularyData(targetLanguage), [targetLanguage]);

    // Get first 2 levels from language config (for initial filters)
    // Levels come from language-configs.json - no hardcoding needed!
    const displayLevels = useMemo(() => levels.slice(0, 2), [levels]);

    // Initialize filters based on language-specific levels from config
    const [filters, setFilters] = useState<Record<string, Filter>>({});

    // Update filters when language changes
    useEffect(() => {
        const newFilters: Record<string, Filter> = {};
        displayLevels.forEach((level, index) => {
            newFilters[level.id] = {
                id: level.id,
                label: level.name,
                checked: index === 0, // First level is checked by default
                type: 'checkbox'
            };
        });
        newFilters['practiceMode'] = {
            id: 'practice-mode',
            label: t('vocabulary.practiceMode'),
            checked: false,
            type: 'checkbox'
        };
        setFilters(newFilters);
    }, [targetLanguage, displayLevels, t]);

    const generateMultipleChoice = useCallback((correctWord: VocabularyItem, available: VocabularyItem[]) => {
        const incorrect = available
            .filter(v => v.id !== correctWord.id)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);

        const options = [correctWord, ...incorrect]
            .sort(() => Math.random() - 0.5)
            .map(v => v.meaning);

        setMultipleChoiceOptions(options);
    }, []);

    const getAvailableVocabulary = useCallback(() => {
        return vocabulary.filter(word => {
            const wordLevel = getItemLevel(word);
            // Check if any of the active level filters match
            return displayLevels.some(level =>
                filters[level.id]?.checked && wordLevel === level.id
            );
        });
    }, [filters, vocabulary, displayLevels]);

    const nextWord = useCallback(() => {
        const available = getAvailableVocabulary();
        if (available.length === 0) {
            setCurrentWord(null);
            return;
        }

        const index = Math.floor(Math.random() * available.length);
        const newWord = available[index];

        setIsCharacterEntering(false);
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                setCurrentWord(newWord);
                setInputValue('');
                setIsCorrect(false);
                setInputState('default');
                setIsCharacterEntering(true);
                setTimeout(() => setIsCharacterEntering(false), 400);

                if (practiceMode) {
                    generateMultipleChoice(newWord, available);
                }
            });
        });
    }, [getAvailableVocabulary, practiceMode, generateMultipleChoice]);

    const handleCorrect = useCallback(() => {
        if (!currentWord) return;
        setIsProcessing(true);
        setIsCorrect(true);
        setInputState('success');
        setCorrect(prev => prev + 1);
        setTotal(prev => prev + 1);
        setStreak(prev => prev + 1);
        speak(currentWord.word, { audioUrl: currentWord.audioUrl });
        updateStats('vocabulary', { correct: correct + 1, total: total + 1, streak: streak + 1 });
        setTimeout(() => {
            nextWord();
            setIsProcessing(false);
        }, 1000);
    }, [currentWord, correct, total, streak, speak, updateStats, nextWord]);

    const handleIncorrect = useCallback(() => {
        if (!currentWord) return;
        setIsProcessing(true);
        setInputState('error');
        setTotal(prev => prev + 1);
        setStreak(0);
        speak(currentWord.word, { audioUrl: currentWord.audioUrl });
        updateStats('vocabulary', { correct, total: total + 1, streak: 0 });
        setTimeout(() => {
            nextWord();
            setIsProcessing(false);
        }, 2000);
    }, [currentWord, correct, total, speak, updateStats, nextWord]);

    const checkInput = useCallback((value: string) => {
        if (isProcessing || !currentWord) return;
        const normalizedInput = value.toLowerCase().trim();
        const normalizedMeaning = currentWord.meaning.toLowerCase().trim();
        // romaji may not exist for non-Japanese languages
        const normalizedRomaji = (currentWord.romaji || '').toLowerCase().trim();

        if (normalizedInput === normalizedMeaning || (normalizedRomaji && normalizedInput === normalizedRomaji)) {
            handleCorrect();
        }
    }, [isProcessing, currentWord, handleCorrect]);

    const { getModuleData } = useProgressContext();

    useEffect(() => {
        const moduleData = getModuleData('vocabulary');
        setCorrect(moduleData?.stats?.correct || 0);
        setTotal(moduleData?.stats?.total || 0);
        setStreak(moduleData?.stats?.streak || 0);
    }, [getModuleData]);

    // Create a stable string of filter states for dependency tracking
    const filterStates = Object.entries(filters)
        .filter(([key]) => key !== 'practiceMode')
        .map(([key, f]) => `${key}:${f.checked}`)
        .join(',');

    useEffect(() => {
        if (vocabulary.length > 0 && Object.keys(filters).length > 0) {
            nextWord();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterStates, practiceMode, targetLanguage]);

    const handleFilterChange = useCallback((id: string, checked: boolean) => {
        if (id === 'practice-mode') {
            setPracticeMode(checked);
        } else {
            setFilters(prev => ({ ...prev, [id]: { ...prev[id], checked } }));
        }
    }, []);


    if (!currentWord) {
        return (
            <LanguageContentGuard moduleName="vocabulary">
                <Container variant="centered">
                    <Navigation />
                    <div>{t('vocabulary.noWords')}</div>
                </Container>
            </LanguageContentGuard>
        );
    }

    return (
        <LanguageContentGuard moduleName="vocabulary">
            <Container variant="centered" streak={streak}>
                <Navigation />

            <OptionsPanel>
                <div className={optionsStyles.toggleContainer}>
                    <Text variant="label" color="muted">{t('vocabulary.practiceMode')}</Text>
                    <Toggle
                        options={[
                            { id: 'meaning', label: t('vocabulary.typeMeaning') },
                            { id: 'practice', label: t('vocabulary.practiceMode') }
                        ]}
                        value={practiceMode ? 'practice' : 'meaning'}
                        onChange={(val) => {
                            setPracticeMode(val === 'practice');
                            setFilters(prev => ({ ...prev, practiceMode: { ...prev.practiceMode, checked: val === 'practice' } }));
                        }}
                        name="vocabulary-mode"
                    />
                </div>
                <div className={optionsStyles.group}>
                    {Object.values(filters)
                        .filter(f => f.id !== 'practice-mode')
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
                    character={currentWord.word}
                    entering={isCharacterEntering}
                    correct={isCorrect}
                    subtext={currentWord.reading}
                />
            </CharacterCard>

            <div className="mt-8 mb-4">
                <Animated animation="pulse" key={currentWord.id}>
                    <Text variant="h2" color="gold">
                        {isCorrect ? currentWord.meaning : '???'}
                    </Text>
                </Animated>
            </div>

            <InputSection>
                {practiceMode ? (
                    <MultipleChoice
                        options={multipleChoiceOptions}
                        onSelect={(selected, index) => {
                            if (selected === currentWord.meaning) handleCorrect();
                            else handleIncorrect();
                        }}
                        disabled={isProcessing}
                    />
                ) : (
                    <Input
                        type="text"
                        value={inputValue}
                        onChange={(e) => {
                            setInputValue(e.target.value);
                            checkInput(e.target.value);
                        }}
                        placeholder={t('vocabulary.typeMeaning')}
                        autoComplete="off"
                        disabled={isProcessing}
                        variant={inputState}
                        size="lg"
                        fullWidth
                    />
                )}
                <StatsPanel correct={correct} total={total} streak={streak} />
            </InputSection>
            </Container>
        </LanguageContentGuard>
    );
}

