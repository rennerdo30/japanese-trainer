'use client'

import { useState, useEffect, useCallback, useRef } from 'react';
import Navigation from '@/components/common/Navigation';
import StatsPanel from '@/components/common/StatsPanel';
import Timer from '@/components/common/Timer';
import MultipleChoice from '@/components/common/MultipleChoice';
import { Container, Input, CharacterCard, CharacterDisplay, OptionsPanel, InputSection, Toggle, Chip, Text } from '@/components/ui';
import optionsStyles from '@/components/ui/OptionsPanel.module.css';
import charactersJson from '@/data/characters.json';
const characters = charactersJson as Character[];
const TIME_PER_CHARACTER = 5;
import { useProgressContext } from '@/context/ProgressProvider';
import { useLanguage } from '@/context/LanguageProvider';
import { useMobile } from '@/hooks/useMobile';
import { useTTS } from '@/hooks/useTTS';
import { useTimer } from '@/hooks/useTimer';
import { Character, Filter } from '@/types';
import { toKatakana } from 'wanakana';
import styles from './alphabet.module.css';

type InputState = '' | 'error' | 'success';

export default function AlphabetPage() {
    const { updateModuleStats: updateStats } = useProgressContext();
    const { t } = useLanguage();
    const isMobile = useMobile();
    const { speak } = useTTS();
    const [currentChar, setCurrentChar] = useState<Character | null>(null);
    const [correct, setCorrect] = useState(0);
    const [total, setTotal] = useState(0);
    const [streak, setStreak] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [multipleChoiceOptions, setMultipleChoiceOptions] = useState<string[]>([]);
    const [useHiragana, setUseHiragana] = useState(true);
    const [isCharacterEntering, setIsCharacterEntering] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [inputState, setInputState] = useState<InputState>('');
    const [showMultipleChoiceFeedback, setShowMultipleChoiceFeedback] = useState(false);
    const [selectedMultipleChoiceIndex, setSelectedMultipleChoiceIndex] = useState<number | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [filters, setFilters] = useState<Record<string, Filter>>({
        gojuon: { id: 'gojuon', label: t('alphabet.filters.gojuon'), checked: true, type: 'checkbox' },
        yoon: { id: 'yoon', label: t('alphabet.filters.yoon'), checked: false, type: 'checkbox' },
        dakuten: { id: 'dakuten', label: t('alphabet.filters.dakuten'), checked: false, type: 'checkbox' },
    });

    const getDisplayCharacter = useCallback((char: Character | null): string => {
        if (!char) return '';
        return useHiragana ? char.hiragana : toKatakana(char.hiragana);
    }, [useHiragana]);

    const generateMultipleChoice = useCallback((correctChar: Character, available: Character[]) => {
        const incorrect = available
            .filter(c => c.romaji !== correctChar.romaji)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);

        const options = [correctChar, ...incorrect]
            .sort(() => Math.random() - 0.5)
            .map(c => c.romaji);

        setMultipleChoiceOptions(options);
    }, []);

    const getAvailableCharacters = useCallback((): Character[] => {
        return characters.filter(char => {
            if (filters.gojuon.checked && char.type === 'gojuon') return true;
            if (filters.yoon.checked && char.type === 'yoon') return true;
            if (filters.dakuten.checked && char.type === 'dakuten') return true;
            return false;
        });
    }, [filters]);

    const nextCharacter = useCallback(() => {
        const available = getAvailableCharacters();
        if (available.length === 0) {
            setCurrentChar(null);
            return;
        }

        let newChar: Character;
        do {
            const index = Math.floor(Math.random() * available.length);
            newChar = available[index];
        } while (available.length > 1 && newChar === currentChar);

        // Reset states
        setIsCorrect(false);
        setInputState('');
        setShowMultipleChoiceFeedback(false);
        setSelectedMultipleChoiceIndex(null);

        // Trigger character enter animation
        setIsCharacterEntering(false);
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                setCurrentChar(newChar);
                setInputValue('');
                setIsCharacterEntering(true);
                setTimeout(() => {
                    setIsCharacterEntering(false);
                }, 400);

                if (isMobile) {
                    generateMultipleChoice(newChar, available);
                }
            });
        });
    }, [getAvailableCharacters, currentChar, isMobile, generateMultipleChoice]);

    const handleTimeout = useCallback(() => {
        if (isProcessing || !currentChar) return;
        setIsProcessing(true);
        setInputState('error');
        setTotal(prev => prev + 1);
        setStreak(0);
        speak(getDisplayCharacter(currentChar), { audioUrl: currentChar.audioUrl });
        setTimeout(() => {
            nextCharacter();
            setIsProcessing(false);
        }, 2000);
    }, [isProcessing, currentChar, speak, getDisplayCharacter, nextCharacter]);

    const { timeLeft, start, reset } = useTimer(TIME_PER_CHARACTER, handleTimeout);

    const handleCorrect = useCallback(() => {
        if (!currentChar) return;
        setIsProcessing(true);
        setIsCorrect(true);
        setInputState('success');
        setCorrect(prev => prev + 1);
        setTotal(prev => prev + 1);
        setStreak(prev => prev + 1);
        speak(getDisplayCharacter(currentChar), { audioUrl: currentChar.audioUrl });
        updateStats('alphabet', { correct: correct + 1, total: total + 1, streak: streak + 1 });
        setTimeout(() => {
            nextCharacter();
            reset();
            start();
            setIsProcessing(false);
        }, 500);
    }, [currentChar, correct, total, streak, speak, getDisplayCharacter, updateStats, nextCharacter, reset, start]);

    const handleIncorrect = useCallback(() => {
        if (!currentChar) return;
        setIsProcessing(true);
        setInputState('error');
        setTotal(prev => prev + 1);
        setStreak(0);
        speak(getDisplayCharacter(currentChar), { audioUrl: currentChar.audioUrl });
        updateStats('alphabet', { correct, total: total + 1, streak: 0 });
        setTimeout(() => {
            nextCharacter();
            reset();
            start();
            setIsProcessing(false);
        }, 2000);
    }, [currentChar, correct, total, speak, getDisplayCharacter, updateStats, nextCharacter, reset, start]);

    const checkInput = useCallback((value: string) => {
        if (isProcessing || !currentChar) return;
        if (value.toLowerCase().trim() === currentChar.romaji.toLowerCase()) {
            handleCorrect();
        }
    }, [isProcessing, currentChar, handleCorrect]);

    const handleMultipleChoice = useCallback((selected: string, index: number) => {
        if (isProcessing || !currentChar) return;
        const correctIndex = multipleChoiceOptions.indexOf(currentChar.romaji);
        setSelectedMultipleChoiceIndex(index);
        setShowMultipleChoiceFeedback(true);
        if (index === correctIndex) {
            handleCorrect();
        } else {
            handleIncorrect();
        }
    }, [isProcessing, currentChar, multipleChoiceOptions, handleCorrect, handleIncorrect]);

    const { getModuleData } = useProgressContext();

    useEffect(() => {
        setFilters(prev => ({
            gojuon: { ...prev.gojuon, label: t('alphabet.filters.gojuon') },
            yoon: { ...prev.yoon, label: t('alphabet.filters.yoon') },
            dakuten: { ...prev.dakuten, label: t('alphabet.filters.dakuten') },
        }));
    }, [t]);

    useEffect(() => {
        const moduleData = getModuleData('alphabet');
        setCorrect(moduleData?.stats?.correct || 0);
        setTotal(moduleData?.stats?.total || 0);
        setStreak(moduleData?.stats?.streak || 0);
    }, [getModuleData]);

    useEffect(() => {
        if (characters.length > 0) {
            nextCharacter();
            start();
        }
    }, [filters.gojuon.checked, filters.yoon.checked, filters.dakuten.checked, useHiragana]);

    useEffect(() => {
        if (!isMobile && currentChar && inputRef.current && !isProcessing) {
            const timeoutId = setTimeout(() => {
                inputRef.current?.focus();
            }, 50);
            return () => clearTimeout(timeoutId);
        }
    }, [currentChar, isMobile, isProcessing]);

    const handleFilterChange = useCallback((id: string, checked: boolean) => {
        setFilters(prev => ({ ...prev, [id]: { ...prev[id], checked } }));
    }, []);

    if (!currentChar) {
        return (
            <Container variant="centered">
                <Navigation />
                <div>{t('alphabet.noCharacters')}</div>
            </Container>
        );
    }

    return (
        <Container variant="centered" streak={streak}>
            <Navigation />

            <OptionsPanel>
                <div className={optionsStyles.toggleContainer}>
                    <Text variant="label" color="muted">{t('alphabet.title')}</Text>
                    <Toggle
                        options={[
                            { id: 'hiragana', label: t('alphabet.hiragana') },
                            { id: 'katakana', label: t('alphabet.katakana') }
                        ]}
                        value={useHiragana ? 'hiragana' : 'katakana'}
                        onChange={(val) => setUseHiragana(val === 'hiragana')}
                        name="alphabet-type"
                    />
                </div>
                <div className={optionsStyles.group}>
                    {Object.values(filters).map((filter) => (
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
                <Timer timeLeft={timeLeft} totalTime={TIME_PER_CHARACTER} />
                <CharacterDisplay
                    character={getDisplayCharacter(currentChar)}
                    entering={isCharacterEntering}
                    correct={isCorrect}
                />
            </CharacterCard>

            <InputSection>
                {isMobile ? (
                    <MultipleChoice
                        options={multipleChoiceOptions}
                        onSelect={handleMultipleChoice}
                        disabled={isProcessing}
                        showCorrect={showMultipleChoiceFeedback}
                        correctIndex={multipleChoiceOptions.indexOf(currentChar?.romaji)}
                    />
                ) : (
                    <Input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={(e) => {
                            setInputValue(e.target.value);
                            setInputState('');
                            checkInput(e.target.value);
                        }}
                        placeholder="..."
                        autoComplete="off"
                        autoCapitalize="off"
                        spellCheck="false"
                        disabled={isProcessing}
                        variant={inputState || 'default'}
                        size="lg"
                        fullWidth
                    />
                )}
                <StatsPanel correct={correct} total={total} streak={streak} />
            </InputSection>
        </Container>
    );
}
