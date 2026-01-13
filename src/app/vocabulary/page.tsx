'use client'

import { useState, useEffect, useCallback } from 'react';
import Navigation from '@/components/common/Navigation';
import StatsPanel from '@/components/common/StatsPanel';
import MultipleChoice from '@/components/common/MultipleChoice';
import { Container, CharacterCard, InputSection, Input, OptionsPanel, Text, Toggle, Chip, CharacterDisplay, Animated } from '@/components/ui';
import optionsStyles from '@/components/ui/OptionsPanel.module.css';
import { useProgressContext } from '@/context/ProgressProvider';
import { useLanguage } from '@/context/LanguageProvider';
import { useTTS } from '@/hooks/useTTS';
import vocabularyJson from '@/data/vocabulary.json';
import { VocabularyItem, Filter } from '@/types';
import styles from './vocabulary.module.css';

const vocabulary = vocabularyJson as VocabularyItem[];

export default function VocabularyPage() {
    const { updateModuleStats: updateStats } = useProgressContext();
    const { t } = useLanguage();
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

    const [filters, setFilters] = useState<Record<string, Filter>>({
        n5: { id: 'n5', label: 'JLPT N5', checked: true, type: 'checkbox' },
        n4: { id: 'n4', label: 'JLPT N4', checked: false, type: 'checkbox' },
        practiceMode: { id: 'practice-mode', label: t('vocabulary.practiceMode'), checked: false, type: 'checkbox' }
    });

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
            if (filters.n5.checked && word.jlpt === 'N5') return true;
            if (filters.n4.checked && word.jlpt === 'N4') return true;
            return false;
        });
    }, [filters]);

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
        const normalizedRomaji = currentWord.romaji.toLowerCase().trim();

        if (normalizedInput === normalizedMeaning || normalizedInput === normalizedRomaji) {
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

    useEffect(() => {
        if (vocabulary.length > 0) {
            nextWord();
        }
    }, [filters.n5.checked, filters.n4.checked, practiceMode]);

    const handleFilterChange = useCallback((id: string, checked: boolean) => {
        if (id === 'practice-mode') {
            setPracticeMode(checked);
        } else {
            setFilters(prev => ({ ...prev, [id]: { ...prev[id], checked } }));
        }
    }, []);

    useEffect(() => {
        setFilters(prev => ({
            ...prev,
            practiceMode: { ...prev.practiceMode, label: t('vocabulary.practiceMode') }
        }));
    }, [t]);

    if (!currentWord) {
        return (
            <Container variant="centered">
                <Navigation />
                <div>{t('vocabulary.noWords')}</div>
            </Container>
        );
    }

    return (
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
    );
}

