'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card, Text, Button } from '@/components/ui';
import LessonIntro from './LessonIntro';
import LessonCard from './LessonCard';
import LessonProgressBar from './LessonProgress';
import { FillBlank } from '@/components/exercises';
import { useTTS } from '@/hooks/useTTS';
import { getVocabularyData } from '@/lib/dataLoader';
import { useTargetLanguage } from '@/hooks/useTargetLanguage';
import type { CurriculumLesson, LessonContext } from '@/types/curriculum';
import type { FillBlankExercise } from '@/types/exercises';
import { IoArrowBack, IoArrowForward, IoCheckmark } from 'react-icons/io5';
import styles from './LessonView.module.css';

type LessonPhase = 'intro' | 'learning' | 'exercises';

import { useLanguage } from '@/context/LanguageProvider';

interface LessonViewProps {
  lesson: CurriculumLesson;
  lessonInfo: LessonContext | null;
  phase: string;
  onStart: () => void;
  onCompleteLearning: () => void;
  onCompleteExercises: (correct: number, total: number) => void;
  onBack: () => void;
}

interface LearningCard {
  type: 'topic' | 'vocabulary' | 'grammar' | 'cultural';
  titleKey: string;
  content: string;
  audioUrl?: string;
}

export default function LessonView({
  lesson,
  lessonInfo,
  phase,
  onStart,
  onCompleteLearning,
  onCompleteExercises,
  onBack,
}: LessonViewProps) {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [exerciseAnswers, setExerciseAnswers] = useState<boolean[]>([]);
  const { preloadBatch } = useTTS();
  const { targetLanguage } = useTargetLanguage();
  const { t } = useLanguage();

  // Get vocabulary data to find audio URLs
  const vocabularyData = getVocabularyData(targetLanguage);

  // Generate learning cards from lesson content
  const learningCards: LearningCard[] = [
    // Topics
    ...lesson.content.topics.map((topic) => ({
      type: 'topic' as const,
      titleKey: 'lessons.card.topic',
      content: topic,
    })),
    // Vocabulary focus
    ...lesson.content.vocab_focus.map((vocab) => {
      // Find audio URL for vocabulary item
      const item = vocabularyData.find(
        v => v.word?.toLowerCase() === vocab.toLowerCase() ||
          v.reading?.toLowerCase() === vocab.toLowerCase()
      );
      return {
        type: 'vocabulary' as const,
        titleKey: 'lessons.card.vocabulary',
        content: vocab,
        audioUrl: item?.audioUrl
      };
    }),
    // Grammar focus
    ...(lesson.content.grammar_focus || []).map((grammar) => ({
      type: 'grammar' as const,
      titleKey: 'lessons.card.grammar',
      content: grammar,
    })),
    // Cultural notes
    ...(lesson.content.cultural_notes || []).map((note) => ({
      type: 'cultural' as const,
      titleKey: 'lessons.card.cultural',
      content: note,
    })),
  ];


  // Preload audio for vocabulary items in this lesson (non-blocking)
  // Runs after initial render to avoid blocking
  useEffect(() => {
    // Skip if no vocab focus or preloadBatch not available
    if (!lesson.content.vocab_focus || lesson.content.vocab_focus.length === 0) {
      return;
    }

    // Use requestIdleCallback if available, otherwise setTimeout
    const schedulePreload = () => {
      const vocabularyData = getVocabularyData(targetLanguage);
      if (vocabularyData.length === 0) {
        // Data not loaded yet, retry after a delay
        return;
      }

      // Match vocabulary strings to vocabulary items and get their audio URLs
      const audioUrls = lesson.content.vocab_focus
        .map(vocabWord => {
          const item = vocabularyData.find(
            v => v.word?.toLowerCase() === vocabWord.toLowerCase() ||
              v.reading?.toLowerCase() === vocabWord.toLowerCase()
          );
          return item?.audioUrl;
        })
        .filter((url): url is string => !!url);

      if (audioUrls.length > 0) {
        preloadBatch(audioUrls);
      }
    };

    // Delay preloading significantly to not interfere with page load
    const timeoutId = setTimeout(schedulePreload, 500);

    return () => clearTimeout(timeoutId);
  }, [lesson.content.vocab_focus, targetLanguage, preloadBatch]);

  const totalLearningCards = learningCards.length;
  const totalExerciseCards = lesson.exercises?.length || 0;

  const handleNextCard = useCallback(() => {
    if (phase === 'learning') {
      if (currentCardIndex < totalLearningCards - 1) {
        setCurrentCardIndex(currentCardIndex + 1);
      } else {
        setCurrentCardIndex(0);
        onCompleteLearning();
      }
    } else if (phase === 'exercises') {
      if (currentCardIndex < totalExerciseCards - 1) {
        setCurrentCardIndex(currentCardIndex + 1);
      } else {
        const correctCount = exerciseAnswers.filter(Boolean).length;
        onCompleteExercises(correctCount, totalExerciseCards);
      }
    }
  }, [
    phase,
    currentCardIndex,
    totalLearningCards,
    totalExerciseCards,
    exerciseAnswers,
    onCompleteLearning,
    onCompleteExercises,
  ]);

  const handlePrevCard = useCallback(() => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
    }
  }, [currentCardIndex]);

  const handleAnswerExercise = useCallback(
    (isCorrect: boolean) => {
      setExerciseAnswers([...exerciseAnswers, isCorrect]);
      handleNextCard();
    },
    [exerciseAnswers, handleNextCard]
  );

  // Render intro phase
  if (phase === 'intro') {
    return (
      <LessonIntro
        lesson={lesson}
        lessonInfo={lessonInfo}
        onStart={onStart}
        onBack={onBack}
      />
    );
  }

  // Render learning phase
  if (phase === 'learning') {
    const currentCard = learningCards[currentCardIndex];

    return (
      <div className={styles.lessonContainer}>
        <LessonProgressBar
          current={currentCardIndex + 1}
          total={totalLearningCards}
          phase="learning"
        />

        <Card variant="glass" className={styles.cardContainer}>
          {currentCard ? (
            <LessonCard
              type={currentCard.type}
              title={t(currentCard.titleKey)}
              content={currentCard.content}
              audioUrl={currentCard.audioUrl}
            />
          ) : (
            <Text color="muted">{t('lessons.view.noContent')}</Text>
          )}
        </Card>

        <div className={styles.navigation}>
          <Button
            variant="ghost"
            onClick={handlePrevCard}
            disabled={currentCardIndex === 0}
          >
            <IoArrowBack /> {t('lessons.view.previous')}
          </Button>

          <Text variant="caption" color="muted">
            {currentCardIndex + 1} / {totalLearningCards}
          </Text>

          <Button onClick={handleNextCard}>
            {currentCardIndex === totalLearningCards - 1 ? (
              <>
                {t('lessons.view.startExercises')} <IoCheckmark />
              </>
            ) : (
              <>
                {t('lessons.view.next')} <IoArrowForward />
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  // Render exercises phase
  if (phase === 'exercises') {
    const currentExercise = lesson.exercises?.[currentCardIndex];

    if (!currentExercise) {
      return (
        <div className={styles.lessonContainer}>
          <Card variant="glass" className={styles.cardContainer}>
            <Text>{t('lessons.view.noExercises')}</Text>
            <Button onClick={() => onCompleteExercises(0, 0)}>
              {t('lessons.view.completeLesson')}
            </Button>
          </Card>
        </div>
      );
    }

    // Render based on exercise type
    const renderExercise = () => {
      const exerciseType = currentExercise.type || 'multiple_choice';

      switch (exerciseType) {
        case 'fill_blank':
          return (
            <FillBlank
              exercise={currentExercise as FillBlankExercise}
              onAnswer={handleAnswerExercise}
            />
          );

        case 'multiple_choice':
        default:
          // Handle multiple choice exercises (default)
          const mcExercise = currentExercise as {
            question: string;
            options: string[];
            correctIndex: number;
          };
          return (
            <div className={styles.exerciseCard}>
              <Text variant="h3" className={styles.question}>
                {mcExercise.question || 'Complete the exercise'}
              </Text>

              <div className={styles.options}>
                {(mcExercise.options || []).map((option, index) => (
                  <Button
                    key={index}
                    variant="secondary"
                    className={styles.optionButton}
                    onClick={() =>
                      handleAnswerExercise(index === mcExercise.correctIndex)
                    }
                  >
                    {option}
                  </Button>
                ))}
              </div>
            </div>
          );
      }
    };

    return (
      <div className={styles.lessonContainer}>
        <LessonProgressBar
          current={currentCardIndex + 1}
          total={totalExerciseCards}
          phase="exercises"
        />

        <Card variant="glass" className={styles.cardContainer}>
          {renderExercise()}
        </Card>

        <div className={styles.navigation}>
          <Text variant="caption" color="muted">
            Exercise {currentCardIndex + 1} of {totalExerciseCards}
          </Text>
        </div>
      </div>
    );
  }

  return null;
}
