'use client'

import { useState, useEffect, useCallback } from 'react';
import Navigation from '@/components/common/Navigation';
import StatsPanel from '@/components/common/StatsPanel';
import { Container, Card, Text, Button, Chip, Animated, OptionsPanel } from '@/components/ui';
import optionsStyles from '@/components/ui/OptionsPanel.module.css';
import { useProgressContext } from '@/context/ProgressProvider';
import { useLanguage } from '@/context/LanguageProvider';
import { GrammarItem, Filter } from '@/types';
import styles from './grammar.module.css';

export default function GrammarPage() {
    const { getModuleData: getModule, updateModuleStats: updateStats } = useProgressContext();
    const { t } = useLanguage();
    const [grammarPoints, setGrammarPoints] = useState<GrammarItem[]>([]);
    const [currentGrammar, setCurrentGrammar] = useState<GrammarItem | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [showFeedback, setShowFeedback] = useState(false);
    const [correct, setCorrect] = useState(0);
    const [total, setTotal] = useState(0);
    const [streak, setStreak] = useState(0);

    const [filters, setFilters] = useState<Record<string, Filter>>({
        n5: { id: 'n5', label: 'JLPT N5', checked: true, type: 'checkbox' },
        n4: { id: 'n4', label: 'JLPT N4', checked: true, type: 'checkbox' }
    });

    useEffect(() => {
        const loadData = async () => {
            try {
                const response = await fetch('/grammar.json');
                const data = await response.json();
                setGrammarPoints(data);
                if (data.length > 0) {
                    setCurrentGrammar(data[0]);
                }
            } catch (error) {
                console.error('Failed to load grammar points:', error);
            }
        };
        loadData();
    }, []);

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
            <Container variant="centered">
                <Navigation />
                <Text>{t('grammar.noGrammar')}</Text>
            </Container>
        );
    }

    const exercise = currentGrammar.exercises?.[0];

    return (
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
                    {currentGrammar.examples.slice(0, 2).map((example, i) => (
                        <div key={i} className={styles.exampleItem}>
                            <Text color="primary" className={styles.exampleJa}>{example.japanese}</Text>
                            <Text color="secondary" className={styles.exampleEn}>{example.translations?.en || example.english}</Text>
                        </div>
                    ))}
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
                                    ? `${t('common.correct')}! ✓`
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
    );
}
