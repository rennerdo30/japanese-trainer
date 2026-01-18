'use client'

import { useState, useEffect, useCallback, useMemo } from 'react';
import Navigation from '@/components/common/Navigation';
import StatsPanel from '@/components/common/StatsPanel';
import LanguageContentGuard from '@/components/common/LanguageContentGuard';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { Container, Card, Text, Button, Chip, Toggle, OptionsPanel, Animated } from '@/components/ui';
import optionsStyles from '@/components/ui/OptionsPanel.module.css';
import { useProgressContext } from '@/context/ProgressProvider';
import { useLanguage } from '@/context/LanguageProvider';
import { useTargetLanguage } from '@/hooks/useTargetLanguage';
import { useTTS } from '@/hooks/useTTS';
import { ReadingItem, Filter } from '@/types';
import { IoVolumeHigh, IoCheckmark, IoClose, IoStop } from 'react-icons/io5';
import styles from './reading.module.css';

export default function ReadingPage() {
    const { getModuleData: getModule, updateModuleStats: updateStats } = useProgressContext();
    const { t } = useLanguage();
    const { targetLanguage, levels, getDataUrl } = useTargetLanguage();
    const { speak, stop, isPlaying } = useTTS();
    const [readings, setReadings] = useState<ReadingItem[]>([]);
    const [currentReading, setCurrentReading] = useState<ReadingItem | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showFurigana, setShowFurigana] = useState(true);
    const [showQuestions, setShowQuestions] = useState(false);
    const [questionAnswers, setQuestionAnswers] = useState<Record<number, number>>({});
    const [showCorrectness, setShowCorrectness] = useState(false);
    const [stats, setStats] = useState({
        correct: 0,
        total: 0,
        streak: 0,
        textsRead: 0,
        totalAttempts: 0,
        comprehensionScore: 0,
        comprehensionTotal: 0,
        comprehensionCorrect: 0
    });

    // Get first 2 levels from language config for filters
    const displayLevels = useMemo(() => levels.slice(0, 2), [levels]);

    // Furigana is only relevant for Japanese
    const showFuriganaOption = targetLanguage === 'ja';

    const [filters, setFilters] = useState<Record<string, Filter>>({});

    // Update filters when language changes
    useEffect(() => {
        const newFilters: Record<string, Filter> = {};
        displayLevels.forEach((level) => {
            newFilters[level.id] = {
                id: level.id,
                label: level.name,
                checked: true, // Both levels checked by default for reading
                type: 'checkbox'
            };
        });
        setFilters(newFilters);
    }, [targetLanguage, displayLevels]);

    // Filter readings based on selected level filters
    const filteredReadings = useMemo(() => {
        const activeFilters = Object.values(filters)
            .filter(f => f.checked)
            .map(f => f.id);

        // If no filters selected, show all readings
        if (activeFilters.length === 0) return readings;

        return readings.filter(reading => {
            // Handle various level formats (n5, N5, etc.)
            const readingLevel = reading.level?.toLowerCase();
            return activeFilters.some(f => f.toLowerCase() === readingLevel);
        });
    }, [readings, filters]);

    // Update current reading when filters change
    useEffect(() => {
        if (filteredReadings.length > 0) {
            // If current reading is not in filtered list, reset to first filtered item
            const currentInFiltered = currentReading && filteredReadings.some(r => r.id === currentReading.id);
            if (!currentInFiltered) {
                setCurrentIndex(0);
                setCurrentReading(filteredReadings[0]);
                setQuestionAnswers({});
                setShowCorrectness(false);
                setShowQuestions(false);
            }
        } else {
            setCurrentReading(null);
        }
    }, [filteredReadings, currentReading]);

    // Load reading data when language changes (with AbortController to prevent race conditions)
    useEffect(() => {
        const abortController = new AbortController();

        const loadData = async () => {
            try {
                const response = await fetch(getDataUrl('readings.json'), {
                    signal: abortController.signal
                });
                const data = await response.json();

                // Only update state if this request wasn't aborted
                if (!abortController.signal.aborted) {
                    setReadings(data);
                    setCurrentIndex(0);
                    if (data.length > 0) {
                        setCurrentReading(data[0]);
                    } else {
                        setCurrentReading(null);
                    }
                }
            } catch (error) {
                // Ignore abort errors - they're expected when switching languages rapidly
                if (error instanceof Error && error.name === 'AbortError') {
                    return;
                }
                console.error('Failed to load readings:', error);
                if (!abortController.signal.aborted) {
                    setReadings([]);
                    setCurrentReading(null);
                }
            }
        };

        loadData();

        // Cleanup: abort fetch if language changes before fetch completes
        return () => {
            abortController.abort();
        };
    }, [targetLanguage, getDataUrl]);

    useEffect(() => {
        const moduleData = getModule('reading');
        if (moduleData?.stats) {
            setStats({
                correct: moduleData.stats.correct || 0,
                total: moduleData.stats.total || 0,
                streak: moduleData.stats.streak || 0,
                textsRead: moduleData.stats.textsRead || 0,
                totalAttempts: moduleData.stats.totalAttempts || 0,
                comprehensionScore: moduleData.stats.comprehensionScore || 0,
                comprehensionTotal: moduleData.stats.comprehensionTotal || 0,
                comprehensionCorrect: moduleData.stats.comprehensionCorrect || 0
            });
        }
    }, [getModule]);

    const handleFilterChange = useCallback((id: string, checked: boolean) => {
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

        const questionCount = currentReading.questions.length;
        const allCorrect = correctCount === questionCount;
        const newCorrect = stats.correct + correctCount;
        const newTotal = stats.total + questionCount;
        const newStreak = allCorrect ? stats.streak + 1 : 0;

        // Calculate reading-specific stats
        const currentTextsRead = (stats as Record<string, number>).textsRead || 0;
        const currentTotalAttempts = (stats as Record<string, number>).totalAttempts || 0;
        const currentComprehensionTotal = (stats as Record<string, number>).comprehensionTotal || 0;
        const currentComprehensionCorrect = (stats as Record<string, number>).comprehensionCorrect || 0;

        const newTextsRead = currentTextsRead + 1;
        const newTotalAttempts = currentTotalAttempts + 1;
        const newComprehensionCorrect = currentComprehensionCorrect + correctCount;
        const newComprehensionTotal = currentComprehensionTotal + questionCount;
        const comprehensionScore = newComprehensionTotal > 0
            ? Math.round((newComprehensionCorrect / newComprehensionTotal) * 100)
            : 0;

        const updatedStats = {
            correct: newCorrect,
            total: newTotal,
            streak: newStreak,
            textsRead: newTextsRead,
            totalAttempts: newTotalAttempts,
            comprehensionScore,
            comprehensionTotal: newComprehensionTotal,
            comprehensionCorrect: newComprehensionCorrect
        };

        setStats(updatedStats);
        setShowCorrectness(true);
        updateStats('reading', updatedStats);
    }, [currentReading, questionAnswers, stats, updateStats]);

    const nextReading = useCallback(() => {
        if (filteredReadings.length === 0) return;
        const nextIndex = (currentIndex + 1) % filteredReadings.length;
        setCurrentIndex(nextIndex);
        setCurrentReading(filteredReadings[nextIndex]);
        setQuestionAnswers({});
        setShowCorrectness(false);
        setShowQuestions(false);
    }, [currentIndex, filteredReadings]);

    if (!currentReading) {
        return (
            <ErrorBoundary>
            <LanguageContentGuard moduleName="reading">
                <Container variant="centered">
                    <Navigation />
                    <Text>{t('reading.noReadings') || 'No readings available.'}</Text>
                </Container>
            </LanguageContentGuard>
            </ErrorBoundary>
        );
    }

    return (
        <ErrorBoundary>
        <LanguageContentGuard moduleName="reading">
            <Container variant="centered" streak={stats.streak}>
                <Navigation />

            <OptionsPanel>
                {showFuriganaOption && (
                    <div className={optionsStyles.toggleContainer}>
                        <Text variant="label" color="muted">{t('reading.showFurigana')}</Text>
                        <Toggle
                            options={[
                                { id: 'show', label: t('reading.show') },
                                { id: 'hide', label: t('reading.hide') }
                            ]}
                            value={showFurigana ? 'show' : 'hide'}
                            onChange={(val) => setShowFurigana(val === 'show')}
                            name="reading-furigana"
                        />
                    </div>
                )}
                <div className={optionsStyles.group}>
                    <Text variant="label" color="muted">Level</Text>
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

            <Card className={styles.readingCard} variant="glass">
                <Text variant="h2" color="gold" className={styles.readingTitle}>
                    {currentReading.title}
                </Text>

                <div className={`${styles.readingText} ${showFurigana ? styles.withFurigana : styles.noFurigana}`}>
                    {currentReading.text}
                </div>

                <div className="mt-8 flex justify-center gap-4">
                    {isPlaying ? (
                        <Button onClick={stop} variant="danger">
                            <IoStop style={{ marginRight: '0.5rem' }} /> {t('common.stop') || 'Stop'}
                        </Button>
                    ) : (
                        <Button onClick={handlePlayReading} variant="secondary">
                            <IoVolumeHigh style={{ marginRight: '0.5rem' }} /> {t('listening.playAudio')}
                        </Button>
                    )}
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
                                            {showCorrectness && optIndex === q.correct && <IoCheckmark style={{ marginLeft: '0.5rem', color: 'var(--success)' }} />}
                                            {showCorrectness && questionAnswers[index] === optIndex && optIndex !== q.correct && <IoClose style={{ marginLeft: '0.5rem', color: 'var(--error)' }} />}
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
        </LanguageContentGuard>
        </ErrorBoundary>
    );
}

