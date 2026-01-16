'use client'

import { useState, useEffect, useCallback, useMemo } from 'react';
import Navigation from '@/components/common/Navigation';
import StatsPanel from '@/components/common/StatsPanel';
import LanguageContentGuard from '@/components/common/LanguageContentGuard';
import { Container, Card, Text, Button, Chip, Animated, OptionsPanel } from '@/components/ui';
import optionsStyles from '@/components/ui/OptionsPanel.module.css';
import { useProgressContext } from '@/context/ProgressProvider';
import { useLanguage } from '@/context/LanguageProvider';
import { useTargetLanguage } from '@/hooks/useTargetLanguage';
import { GrammarItem, Filter } from '@/types';
import { IoCheckmark } from 'react-icons/io5';
import styles from './grammar.module.css';

// Helper to get example text - handles different language data structures
function getExampleText(example: Record<string, unknown>): { primary: string; secondary: string } {
    // Try language-specific fields first, then fall back to generic
    const primary = (example.japanese || example.korean || example.chinese ||
                    example.spanish || example.german || example.italian ||
                    example.english || '') as string;
    const secondary = (example.english || example.translation || '') as string;
    return { primary, secondary };
}

export default function GrammarPage() {
    const { getModuleData: getModule, updateModuleStats: updateStats } = useProgressContext();
    const { t } = useLanguage();
    const { targetLanguage, levels, getDataUrl } = useTargetLanguage();
    const [grammarPoints, setGrammarPoints] = useState<GrammarItem[]>([]);
    const [currentGrammar, setCurrentGrammar] = useState<GrammarItem | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [showFeedback, setShowFeedback] = useState(false);
    const [correct, setCorrect] = useState(0);
    const [total, setTotal] = useState(0);
    const [streak, setStreak] = useState(0);

    // Get first 2 levels from language config for filters
    const displayLevels = useMemo(() => levels.slice(0, 2), [levels]);

    const [filters, setFilters] = useState<Record<string, Filter>>({});

    // Update filters when language changes
    useEffect(() => {
        const newFilters: Record<string, Filter> = {};
        displayLevels.forEach((level, index) => {
            newFilters[level.id] = {
                id: level.id,
                label: level.name,
                checked: true, // Both levels checked by default for grammar
                type: 'checkbox'
            };
        });
        setFilters(newFilters);
    }, [targetLanguage, displayLevels]);

    // Load grammar data when language changes
    useEffect(() => {
        const loadData = async () => {
            try {
                const response = await fetch(getDataUrl('grammar.json'));
                const data = await response.json();
                setGrammarPoints(data);
                setCurrentIndex(0);
                if (data.length > 0) {
                    setCurrentGrammar(data[0]);
                } else {
                    setCurrentGrammar(null);
                }
            } catch (error) {
                console.error('Failed to load grammar points:', error);
                setGrammarPoints([]);
                setCurrentGrammar(null);
            }
        };
        loadData();
    }, [targetLanguage, getDataUrl]);

    useEffect(() => {
        const moduleData = getModule('grammar');
        if (moduleData?.stats) {
            setCorrect(moduleData.stats.correct || 0);
            setTotal(moduleData.stats.total || 0);
            setStreak(moduleData.stats.streak || 0);
        }
    }, [getModule]);

    const handleFilterChange = useCallback((id: string, checked: boolean) => {
        setFilters(prev => ({ ...prev, [id]: { ...prev[id], checked } }));
    }, []);

    const handleAnswerSelect = useCallback((index: number) => {
        if (showFeedback || !currentGrammar?.exercises?.[0]) return;
        setSelectedAnswer(index);
        setShowFeedback(true);

        const isCorrect = index === currentGrammar.exercises[0].correct;
        const newCorrect = correct + (isCorrect ? 1 : 0);
        const newTotal = total + 1;
        const newStreak = isCorrect ? streak + 1 : 0;

        setCorrect(newCorrect);
        setTotal(newTotal);
        setStreak(newStreak);
        updateStats('grammar', { correct: newCorrect, total: newTotal, streak: newStreak });
    }, [showFeedback, currentGrammar, correct, total, streak, updateStats]);

    const nextGrammar = useCallback(() => {
        if (grammarPoints.length === 0) return;
        const nextIndex = (currentIndex + 1) % grammarPoints.length;
        setCurrentIndex(nextIndex);
        setCurrentGrammar(grammarPoints[nextIndex]);
        setSelectedAnswer(null);
        setShowFeedback(false);
    }, [currentIndex, grammarPoints]);

    if (!currentGrammar) {
        return (
            <LanguageContentGuard moduleName="grammar">
                <Container variant="centered">
                    <Navigation />
                    <Text>{t('grammar.noGrammar')}</Text>
                </Container>
            </LanguageContentGuard>
        );
    }

    const exercise = currentGrammar.exercises?.[0];

    return (
        <LanguageContentGuard moduleName="grammar">
            <Container variant="centered" streak={streak}>
                <Navigation />

            <OptionsPanel>
                <div className={optionsStyles.toggleContainer}>
                    <Text variant="label" color="muted">Level</Text>
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
                </div>
            </OptionsPanel>

            <Card className={styles.grammarCard} variant="glass">
                <Text variant="h2" color="gold" className={styles.grammarTitle}>
                    {currentGrammar.title}
                </Text>
                <div className={styles.explanationSection}>
                    <Text className={styles.explanationText}>
                        {currentGrammar.explanations?.en || currentGrammar.explanation}
                    </Text>
                </div>

                <div className={styles.examplesList}>
                    {currentGrammar.examples.slice(0, 2).map((example, i) => {
                        const { primary, secondary } = getExampleText(example as Record<string, unknown>);
                        return (
                            <div key={i} className={styles.exampleItem}>
                                <Text color="primary" className={styles.exampleJa}>{primary}</Text>
                                <Text color="secondary" className={styles.exampleEn}>{secondary}</Text>
                            </div>
                        );
                    })}
                </div>
            </Card>

            {exercise && (
                <Card className={styles.exerciseSection} variant="glass">
                    <Text variant="h3" className={styles.exerciseQuestion}>
                        {exercise.question}
                    </Text>
                    <div className={styles.optionsGrid}>
                        {exercise.options.map((option, i) => (
                            <Button
                                key={i}
                                variant={selectedAnswer === i ? (selectedAnswer === exercise.correct ? 'success' : 'danger') : 'ghost'}
                                onClick={() => handleAnswerSelect(i)}
                                disabled={showFeedback}
                                className={styles.optionButton}
                            >
                                {option}
                            </Button>
                        ))}
                    </div>
                    {showFeedback && (
                        <Animated animation="fadeInUp">
                            <Text
                                variant="h3"
                                color={selectedAnswer === exercise.correct ? 'success' : 'error'}
                                className={styles.exerciseFeedback}
                            >
                                {selectedAnswer === exercise.correct
                                    ? <>{t('common.correct')}! <IoCheckmark style={{ display: 'inline-block', verticalAlign: 'middle' }} /></>
                                    : `${t('common.incorrect')}. ${t('common.correct')}: ${exercise.options[exercise.correct]}`}
                            </Text>
                            <Button onClick={nextGrammar} className="mt-4" fullWidth>
                                {t('common.next')}
                            </Button>
                        </Animated>
                    )}
                </Card>
            )}

            <StatsPanel correct={correct} total={total} streak={streak} />
            </Container>
        </LanguageContentGuard>
    );
}
