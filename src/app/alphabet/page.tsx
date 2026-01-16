'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Navigation from '@/components/common/Navigation';
import StatsPanel from '@/components/common/StatsPanel';
import Timer from '@/components/common/Timer';
import MultipleChoice from '@/components/common/MultipleChoice';
import LanguageContentGuard from '@/components/common/LanguageContentGuard';
import { Container, Input, CharacterCard, CharacterDisplay, OptionsPanel, InputSection, Toggle, Chip, Text } from '@/components/ui';
import optionsStyles from '@/components/ui/OptionsPanel.module.css';
import { useProgressContext } from '@/context/ProgressProvider';
import { useLanguage } from '@/context/LanguageProvider';
import { useTargetLanguage } from '@/hooks/useTargetLanguage';
import { useMobile } from '@/hooks/useMobile';
import { useTTS } from '@/hooks/useTTS';
import { useTimer } from '@/hooks/useTimer';
import { Character, Filter } from '@/types';
import { toKatakana } from 'wanakana';
import styles from './alphabet.module.css';

// Import character data for each language
import jaCharactersJson from '@/data/ja/characters.json';
import koCharactersJson from '@/data/ko/characters.json';

const TIME_PER_CHARACTER = 5;

// Define extended character type for Korean
interface KoreanCharacter {
    romaji: string;
    character: string;
    type: 'consonant' | 'vowel' | 'double_consonant' | 'compound_vowel';
    name: string;
}

// Normalize Korean characters to match the Character interface
const normalizeKoreanCharacter = (char: KoreanCharacter): Character => ({
    romaji: char.romaji,
    hiragana: char.character, // Use 'hiragana' field for the character display
    type: char.type,
    audioUrl: undefined, // No audio yet for Korean
});

// Get characters based on target language
const getCharacterData = (lang: string): Character[] => {
    switch (lang) {
        case 'ko':
            return (koCharactersJson as KoreanCharacter[]).map(normalizeKoreanCharacter);
        case 'ja':
        default:
            return jaCharactersJson as Character[];
    }
};

// Filter configurations per language
interface FilterConfig {
    id: string;
    labelKey: string;
    types: string[];
}

const FILTER_CONFIGS: Record<string, FilterConfig[]> = {
    ja: [
        { id: 'gojuon', labelKey: 'alphabet.filters.gojuon', types: ['gojuon'] },
        { id: 'yoon', labelKey: 'alphabet.filters.yoon', types: ['yoon'] },
        { id: 'dakuten', labelKey: 'alphabet.filters.dakuten', types: ['dakuten', 'handakuten'] },
    ],
    ko: [
        { id: 'consonant', labelKey: 'alphabet.filters.consonant', types: ['consonant'] },
        { id: 'vowel', labelKey: 'alphabet.filters.vowel', types: ['vowel'] },
        { id: 'double_consonant', labelKey: 'alphabet.filters.doubleConsonant', types: ['double_consonant'] },
        { id: 'compound_vowel', labelKey: 'alphabet.filters.compoundVowel', types: ['compound_vowel'] },
    ],
};

// Toggle configurations per language
interface ToggleConfig {
    enabled: boolean;
    options: { id: string; labelKey: string }[];
}

const TOGGLE_CONFIGS: Record<string, ToggleConfig> = {
    ja: {
        enabled: true,
        options: [
            { id: 'hiragana', labelKey: 'alphabet.hiragana' },
            { id: 'katakana', labelKey: 'alphabet.katakana' },
        ],
    },
    ko: {
        enabled: false, // Korean Hangul doesn't have a hiragana/katakana equivalent
        options: [],
    },
};

type InputState = '' | 'error' | 'success';

export default function AlphabetPage() {
    const { updateModuleStats: updateStats } = useProgressContext();
    const { t } = useLanguage();
    const { targetLanguage } = useTargetLanguage();
    const isMobile = useMobile();
    const { speakAndWait, preloadAudio } = useTTS();
    const preloadedAudioRef = useRef<HTMLAudioElement | null>(null);
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

    // Get characters and filter configuration for current language
    const characters = useMemo(() => getCharacterData(targetLanguage), [targetLanguage]);
    const filterConfig = useMemo(() => FILTER_CONFIGS[targetLanguage] || FILTER_CONFIGS.ja, [targetLanguage]);
    const toggleConfig = useMemo(() => TOGGLE_CONFIGS[targetLanguage] || TOGGLE_CONFIGS.ja, [targetLanguage]);

    // Initialize filters based on language
    const [filters, setFilters] = useState<Record<string, Filter>>(() => {
        const config = FILTER_CONFIGS[targetLanguage] || FILTER_CONFIGS.ja;
        const initialFilters: Record<string, Filter> = {};
        config.forEach((fc, index) => {
            initialFilters[fc.id] = {
                id: fc.id,
                label: t(fc.labelKey) || fc.id,
                checked: index === 0, // First filter is checked by default
                type: 'checkbox',
            };
        });
        return initialFilters;
    });

    const getDisplayCharacter = useCallback((char: Character | null): string => {
        if (!char) return '';
        // Only apply hiragana/katakana conversion for Japanese
        if (targetLanguage === 'ja') {
            return useHiragana ? char.hiragana : toKatakana(char.hiragana);
        }
        // For other languages, just return the character as-is
        return char.hiragana;
    }, [useHiragana, targetLanguage]);

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
            // Check each filter configuration for the current language
            for (const fc of filterConfig) {
                if (filters[fc.id]?.checked && fc.types.includes(char.type)) {
                    return true;
                }
            }
            return false;
        });
    }, [filters, filterConfig, characters]);

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

    const handleTimeout = useCallback(async () => {
        if (isProcessing || !currentChar) return;
        setIsProcessing(true);
        setInputState('error');
        setTotal(prev => prev + 1);
        setStreak(0);
        await speakAndWait(getDisplayCharacter(currentChar), { audioUrl: currentChar.audioUrl });
        nextCharacter();
        setIsProcessing(false);
    }, [isProcessing, currentChar, speakAndWait, getDisplayCharacter, nextCharacter]);

    const { timeLeft, start, reset } = useTimer(TIME_PER_CHARACTER, handleTimeout);

    const handleCorrect = useCallback(async () => {
        if (!currentChar) return;
        setIsProcessing(true);
        setIsCorrect(true);
        setInputState('success');
        setCorrect(prev => prev + 1);
        setTotal(prev => prev + 1);
        setStreak(prev => prev + 1);
        await speakAndWait(getDisplayCharacter(currentChar), { audioUrl: currentChar.audioUrl });
        updateStats('alphabet', { correct: correct + 1, total: total + 1, streak: streak + 1 });
        nextCharacter();
        reset();
        start();
        setIsProcessing(false);
    }, [currentChar, correct, total, streak, speakAndWait, getDisplayCharacter, updateStats, nextCharacter, reset, start]);

    const handleIncorrect = useCallback(async () => {
        if (!currentChar) return;
        setIsProcessing(true);
        setInputState('error');
        setTotal(prev => prev + 1);
        setStreak(0);
        await speakAndWait(getDisplayCharacter(currentChar), { audioUrl: currentChar.audioUrl });
        updateStats('alphabet', { correct, total: total + 1, streak: 0 });
        nextCharacter();
        reset();
        start();
        setIsProcessing(false);
    }, [currentChar, correct, total, speakAndWait, getDisplayCharacter, updateStats, nextCharacter, reset, start]);

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

    // Update filter labels when translation changes
    useEffect(() => {
        setFilters(prev => {
            const updated: Record<string, Filter> = {};
            for (const fc of filterConfig) {
                if (prev[fc.id]) {
                    updated[fc.id] = { ...prev[fc.id], label: t(fc.labelKey) || fc.id };
                }
            }
            return updated;
        });
    }, [t, filterConfig]);

    // Reset filters when language changes
    useEffect(() => {
        const newFilters: Record<string, Filter> = {};
        filterConfig.forEach((fc, index) => {
            newFilters[fc.id] = {
                id: fc.id,
                label: t(fc.labelKey) || fc.id,
                checked: index === 0,
                type: 'checkbox',
            };
        });
        setFilters(newFilters);
    }, [targetLanguage, filterConfig, t]);

    useEffect(() => {
        const moduleData = getModuleData('alphabet');
        setCorrect(moduleData?.stats?.correct || 0);
        setTotal(moduleData?.stats?.total || 0);
        setStreak(moduleData?.stats?.streak || 0);
    }, [getModuleData]);

    // Create a stable string of filter states for dependency tracking
    const filterStates = useMemo(() => {
        return Object.entries(filters).map(([id, f]) => `${id}:${f.checked}`).join(',');
    }, [filters]);

    useEffect(() => {
        if (characters.length > 0) {
            nextCharacter();
            start();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterStates, useHiragana, targetLanguage]);

    useEffect(() => {
        if (!isMobile && currentChar && inputRef.current && !isProcessing) {
            const timeoutId = setTimeout(() => {
                inputRef.current?.focus();
            }, 50);
            return () => clearTimeout(timeoutId);
        }
    }, [currentChar, isMobile, isProcessing]);

    useEffect(() => {
        if (currentChar?.audioUrl) {
            preloadedAudioRef.current = preloadAudio(currentChar.audioUrl);
        }
        return () => {
            if (preloadedAudioRef.current) {
                preloadedAudioRef.current = null;
            }
        };
    }, [currentChar?.audioUrl, preloadAudio]);

    const handleFilterChange = useCallback((id: string, checked: boolean) => {
        setFilters(prev => ({ ...prev, [id]: { ...prev[id], checked } }));
    }, []);

    if (!currentChar) {
        return (
            <LanguageContentGuard moduleName="alphabet">
                <Container variant="centered">
                    <Navigation />
                    <div>{t('alphabet.noCharacters')}</div>
                </Container>
            </LanguageContentGuard>
        );
    }

    return (
        <LanguageContentGuard moduleName="alphabet">
            <Container variant="centered" streak={streak}>
                <Navigation />

            <OptionsPanel>
                {toggleConfig.enabled && (
                    <div className={optionsStyles.toggleContainer}>
                        <Text variant="label" color="muted">{t('alphabet.title')}</Text>
                        <Toggle
                            options={toggleConfig.options.map(opt => ({
                                id: opt.id,
                                label: t(opt.labelKey)
                            })) as [{ id: string; label: string }, { id: string; label: string }]}
                            value={useHiragana ? 'hiragana' : 'katakana'}
                            onChange={(val) => setUseHiragana(val === 'hiragana')}
                            name="alphabet-type"
                        />
                    </div>
                )}
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
        </LanguageContentGuard>
    );
}
