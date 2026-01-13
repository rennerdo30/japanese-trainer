'use client'

import { useState, useEffect, useCallback } from 'react';
import Navigation from '@/components/common/Navigation';
import StatsPanel from '@/components/common/StatsPanel';
import { Container, Card, Text, Button, Chip, OptionsPanel, Animated } from '@/components/ui';
import optionsStyles from '@/components/ui/OptionsPanel.module.css';
import { useProgressContext } from '@/context/ProgressProvider';
import { useLanguage } from '@/context/LanguageProvider';
import { useTTS } from '@/hooks/useTTS';
import { getModuleData, saveModuleData, updateModuleStats } from '@/lib/storage';
import { ListeningExercise, Filter } from '@/types';
import styles from './listening.module.css';

export default function ListeningPage() {
    const { getModuleData: getModule, updateModuleStats: updateStats } = useProgressContext();
    const { t } = useLanguage();
    const { speak } = useTTS();
    const [exercises, setExercises] = useState<ListeningExercise[]>([]);
    const [currentExercise, setCurrentExercise] = useState<ListeningExercise | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [inputValue, setInputValue] = useState('');
    const [showTranscript, setShowTranscript] = useState(false);
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
                const response = await fetch('/listening.json');
                const data = await response.json();
                setExercises(data);
                if (data.length > 0) {
                    setCurrentExercise(data[0]);
                }
            } catch (error) {
                console.error('Failed to load listening exercises:', error);
            }
        };
        loadData();
    }, []);

    useEffect(() => {
        const moduleData = getModule('listening');
        if (moduleData?.stats) {
            setCorrect(moduleData.stats.correct || 0);
            setTotal(moduleData.stats.total || 0);
            setStreak(moduleData.stats.streak || 0);
        }
    }, [getModule]);

    const handleFilterChange = useCallback((id: string, checked: boolean) => {
        setFilters(prev => ({ ...prev, [id]: { ...prev[id], checked } }));
    }, []);

    const handlePlayAudio = useCallback(() => {
        if (!currentExercise) return;
        speak(currentExercise.text, { audioUrl: currentExercise.audioUrl });
    }, [currentExercise, speak]);

    const handleCheckAnswer = useCallback(() => {
        if (!currentExercise) return;
        const isCorrect = inputValue.trim().replace(/\s+/g, '') === currentExercise.text.trim().replace(/\s+/g, '');

        const newCorrect = correct + (isCorrect ? 1 : 0);
        const newTotal = total + 1;
        const newStreak = isCorrect ? streak + 1 : 0;

        setCorrect(newCorrect);
        setTotal(newTotal);
        setStreak(newStreak);
        setShowFeedback(true);
        updateStats('listening', { correct: newCorrect, total: newTotal, streak: newStreak });
    }, [currentExercise, inputValue, correct, total, streak, updateStats]);

    const nextExercise = useCallback(() => {
        if (exercises.length === 0) return;
        const nextIndex = (currentIndex + 1) % exercises.length;
        setCurrentIndex(nextIndex);
        setCurrentExercise(exercises[nextIndex]);
        setInputValue('');
        setShowFeedback(false);
        setShowTranscript(false);
    }, [currentIndex, exercises]);

    if (!currentExercise) {
        return (
            <Container variant="centered">
                <Navigation />
                <Text>{t('listening.noExercises')}</Text>
            </Container>
        );
    }

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

            <Card className={styles.listeningCard} variant="glass">
                <Text variant="h2" color="gold" className={styles.listeningTitle}>
                    {currentExercise.title}
                </Text>

                <div className={styles.audioControls}>
                    <Button onClick={handlePlayAudio} variant="primary" size="lg" className={styles.playButton}>
                        🔊 {t('listening.playAudio')}
                    </Button>
                </div>

                <div className="mt-6">
                    <Button variant="ghost" onClick={() => setShowTranscript(!showTranscript)}>
                        {showTranscript ? t('listening.hideTranscript') : t('listening.showTranscript')}
                    </Button>
                    {showTranscript && (
                        <Animated animation="fadeInUp">
                            <Text className={styles.transcriptText}>{currentExercise.transcript}</Text>
                        </Animated>
                    )}
                </div>
            </Card>

            <Card className={styles.dictationSection} variant="glass">
                <Text className={styles.dictationLabel}>{t('listening.typeWhatYouHear')}</Text>
                <textarea
                    className={styles.dictationInput}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={t('listening.typeJapaneseText')}
                    disabled={showFeedback}
                />

                {!showFeedback ? (
                    <Button onClick={handleCheckAnswer} fullWidth className="mt-4">
                        {t('listening.checkAnswer')}
                    </Button>
                ) : (
                    <Button onClick={nextExercise} fullWidth className="mt-4">
                        {t('common.next')}
                    </Button>
                )}

                {showFeedback && (
                    <Animated animation="pulse">
                        <div className={`${styles.dictationFeedback} ${inputValue.trim().replace(/\s+/g, '') === currentExercise.text.trim().replace(/\s+/g, '') ? styles.correct : styles.incorrect}`}>
                            <Text variant="h3" color={inputValue.trim().replace(/\s+/g, '') === currentExercise.text.trim().replace(/\s+/g, '') ? 'success' : 'error'}>
                                {inputValue.trim().replace(/\s+/g, '') === currentExercise.text.trim().replace(/\s+/g, '')
                                    ? `${t('common.correct')}! ✓`
                                    : `${t('common.incorrect')}. ${t('common.correct')}: ${currentExercise.text}`}
                            </Text>
                        </div>
                    </Animated>
                )}
            </Card>

            <StatsPanel correct={correct} total={total} streak={streak} />
        </Container>
    );
}
