'use client'

import { useState, useEffect, useCallback } from 'react';
import Navigation from '@/components/common/Navigation';
import StatsPanel from '@/components/common/StatsPanel';
import { Container, Card, Text, Button, Chip, Toggle, OptionsPanel, Animated } from '@/components/ui';
import optionsStyles from '@/components/ui/OptionsPanel.module.css';
import { useProgressContext } from '@/context/ProgressProvider';
import { useLanguage } from '@/context/LanguageProvider';
import { useTTS } from '@/hooks/useTTS';
import { getModuleData, saveModuleData, updateModuleStats } from '@/lib/storage';
import { ReadingItem, Filter } from '@/types';
import styles from './reading.module.css';

export default function ReadingPage() {
    const { getModuleData: getModule, updateModuleStats: updateStats } = useProgressContext();
    const { t } = useLanguage();
    const { speak } = useTTS();
    const [readings, setReadings] = useState<ReadingItem[]>([]);
    const [currentReading, setCurrentReading] = useState<ReadingItem | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showFurigana, setShowFurigana] = useState(true);
    const [showQuestions, setShowQuestions] = useState(false);
    const [questionAnswers, setQuestionAnswers] = useState<Record<number, number>>({});
    const [showCorrectness, setShowCorrectness] = useState(false);
    const [stats, setStats] = useState({ correct: 0, total: 0, streak: 0 });

    const [filters, setFilters] = useState<Record<string, Filter>>({
        n5: { id: 'n5', label: 'JLPT N5', checked: true, type: 'checkbox' },
        n4: { id: 'n4', label: 'JLPT N4', checked: true, type: 'checkbox' },
        furigana: { id: 'furigana', label: t('reading.showFurigana'), checked: true, type: 'checkbox' }
    });

    useEffect(() => {
        const loadData = async () => {
            try {
                const response = await fetch('/readings.json');
                const data = await response.json();
                setReadings(data);
                if (data.length > 0) {
                    setCurrentReading(data[0]);
                }
            } catch (error) {
                console.error('Failed to load readings:', error);
            }
        };
        loadData();
    }, []);

    useEffect(() => {
        const moduleData = getModule('reading');
        if (moduleData?.stats) {
            setStats({
                correct: moduleData.stats.correct || 0,
                total: moduleData.stats.total || 0,
                streak: moduleData.stats.streak || 0
            });
        }
    }, [getModule]);

    const handleFilterChange = useCallback((id: string, checked: boolean) => {
        if (id === 'furigana') {
            setShowFurigana(checked);
        }
        setFilters(prev => ({ ...prev, [id]: { ...prev[id], checked } }));
    }, []);

    const handlePlayReading = useCallback(() => {
        if (!currentReading) return;
        speak(currentReading.text, { audioUrl: currentReading.audioUrl });
    }, [currentReading, speak]);

    const handleCheckAnswers = useCallback(() => {
        if (!currentReading || !currentReading.questions) return;
        let correctCount = 0;
        const answers: Record<number, number> = {};
        currentReading.questions.forEach((q, index) => {
            const selected = questionAnswers[index];
            if (selected !== undefined) {
                answers[index] = selected;
                if (selected === q.correct) {
                    correctCount++;
                }
            }
        });

        const allCorrect = correctCount === currentReading.questions.length;
        const newCorrect = stats.correct + correctCount;
        const newTotal = stats.total + (currentReading.questions?.length || 0);
        const newStreak = allCorrect ? stats.streak + 1 : 0;

        setStats({ correct: newCorrect, total: newTotal, streak: newStreak });
        setShowCorrectness(true);
        updateStats('reading', { correct: newCorrect, total: newTotal, streak: newStreak });
    }, [currentReading, questionAnswers, stats, updateStats]);

    const nextReading = useCallback(() => {
        if (readings.length === 0) return;
        const nextIndex = (currentIndex + 1) % readings.length;
        setCurrentIndex(nextIndex);
        setCurrentReading(readings[nextIndex]);
        setQuestionAnswers({});
        setShowCorrectness(false);
        setShowQuestions(false);
    }, [currentIndex, readings]);

    if (!currentReading) {
        return (
            <Container variant="centered">
                <Navigation />
                <Text>{t('reading.noReadings') || 'No readings available.'}</Text>
            </Container>
        );
    }

    return (
        <Container variant="centered" streak={stats.streak}>
            <Navigation />

            <OptionsPanel>
                <div className={optionsStyles.toggleContainer}>
                    <Text variant="label" color="muted">{t('reading.showFurigana')}</Text>
                    <Toggle
                        options={[
                            { id: 'show', label: t('reading.show') },
                            { id: 'hide', label: t('reading.hide') }
                        ]}
                        value={showFurigana ? 'show' : 'hide'}
                        onChange={(val) => {
                            const checked = val === 'show';
                            setShowFurigana(checked);
                            setFilters(prev => ({ ...prev, furigana: { ...prev.furigana, checked } }));
                        }}
                        name="reading-furigana"
                    />
                </div>
                <div className={optionsStyles.group}>
                    {Object.values(filters)
                        .filter(f => f.id !== 'furigana')
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

            <Card className={styles.readingCard} variant="glass">
                <Text variant="h2" color="gold" className={styles.readingTitle}>
                    {currentReading.title}
                </Text>

                <div className={`${styles.readingText} ${showFurigana ? styles.withFurigana : styles.noFurigana}`}>
                    {currentReading.text}
                </div>

                <div className="mt-8 flex justify-center gap-4">
                    <Button onClick={handlePlayReading} variant="secondary">
                        🔊 {t('common.playAudio') || 'Play'}
                    </Button>
                    {currentReading.questions && (
                        <Button onClick={() => setShowQuestions(!showQuestions)} variant="primary">
                            {t('reading.showQuestions')}
                        </Button>
                    )}
                </div>
            </Card>

            {showQuestions && currentReading.questions && (
                <Card className={styles.questionsSection} variant="glass">
                    <Text variant="h2" className={styles.questionsTitle}>{t('reading.comprehensionQuestions')}</Text>
                    <div className={styles.questionsList}>
                        {currentReading.questions.map((q, index) => (
                            <div key={index} className={styles.questionItem}>
                                <Text variant="h3" className={styles.questionText}>
                                    {index + 1}. {q.question}
                                </Text>
                                <div className={styles.optionsGrid}>
                                    {q.options.map((opt, optIndex) => (
                                        <Button
                                            key={optIndex}
                                            variant={questionAnswers[index] === optIndex ? 'primary' : 'ghost'}
                                            onClick={() => setQuestionAnswers(prev => ({ ...prev, [index]: optIndex }))}
                                            className={styles.optionButton}
                                            disabled={showCorrectness}
                                        >
                                            {opt}
                                            {showCorrectness && optIndex === q.correct && ' ✓'}
                                            {showCorrectness && questionAnswers[index] === optIndex && optIndex !== q.correct && ' ✗'}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                    {!showCorrectness ? (
                        <Button onClick={handleCheckAnswers} fullWidth className="mt-6">
                            {t('reading.checkAnswers')}
                        </Button>
                    ) : (
                        <Button onClick={nextReading} fullWidth className="mt-6">
                            {t('common.next')}
                        </Button>
                    )}
                </Card>
            )}

            <StatsPanel correct={stats.correct} total={stats.total} streak={stats.streak} />
        </Container>
    );
}

