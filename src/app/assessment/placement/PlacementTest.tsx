'use client';

import React, { useState, useCallback, useMemo } from 'react';
import styles from './PlacementTest.module.css';
import type { Assessment, AssessmentResult, AssessmentSection } from '@/types/assessment';

interface PlacementTestProps {
  assessment: Assessment | null;
  onComplete: (result: AssessmentResult) => void;
  onCancel: () => void;
}

interface QuestionAnswer {
  sectionIndex: number;
  questionIndex: number;
  answer: number | string;
  correct: boolean;
}

// Sample questions for when no assessment data is loaded
const SAMPLE_SECTIONS: AssessmentSection[] = [
  {
    skill: 'vocabulary',
    name: 'Vocabulary',
    weight: 25,
    questions: [
      {
        id: 'v1',
        sectionIndex: 0,
        questionIndex: 0,
        skill: 'vocabulary',
        difficulty: 'easy',
        questionData: {
          id: 'v1-q',
          type: 'multiple_choice',
          question: 'What does "ありがとう" mean?',
          options: ['Hello', 'Thank you', 'Goodbye', 'Sorry'],
          correctIndex: 1,
        },
        points: 1,
      },
      {
        id: 'v2',
        sectionIndex: 0,
        questionIndex: 1,
        skill: 'vocabulary',
        difficulty: 'medium',
        questionData: {
          id: 'v2-q',
          type: 'multiple_choice',
          question: 'What does "食べる" (taberu) mean?',
          options: ['To drink', 'To eat', 'To sleep', 'To walk'],
          correctIndex: 1,
        },
        points: 1,
      },
    ],
  },
  {
    skill: 'grammar',
    name: 'Grammar',
    weight: 25,
    questions: [
      {
        id: 'g1',
        sectionIndex: 1,
        questionIndex: 0,
        skill: 'grammar',
        difficulty: 'easy',
        questionData: {
          id: 'g1-q',
          type: 'multiple_choice',
          question: 'Which particle marks the topic of a sentence?',
          options: ['を', 'は', 'に', 'で'],
          correctIndex: 1,
        },
        points: 1,
      },
      {
        id: 'g2',
        sectionIndex: 1,
        questionIndex: 1,
        skill: 'grammar',
        difficulty: 'medium',
        questionData: {
          id: 'g2-q',
          type: 'multiple_choice',
          question: 'How do you say "I want to eat" in Japanese?',
          options: ['食べます', '食べたい', '食べて', '食べた'],
          correctIndex: 1,
        },
        points: 1,
      },
    ],
  },
];

export default function PlacementTest({ assessment, onComplete, onCancel }: PlacementTestProps) {
  const sections = useMemo(() => {
    return assessment?.sections ?? SAMPLE_SECTIONS;
  }, [assessment]);

  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<QuestionAnswer[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const currentSection = sections[currentSectionIndex];
  const currentQuestion = currentSection?.questions[currentQuestionIndex];
  const totalQuestions = sections.reduce((sum, s) => sum + s.questions.length, 0);
  const answeredCount = answers.length;

  const progress = useMemo(() => {
    let count = 0;
    for (let i = 0; i < currentSectionIndex; i++) {
      count += sections[i].questions.length;
    }
    count += currentQuestionIndex;
    return ((count + 1) / totalQuestions) * 100;
  }, [currentSectionIndex, currentQuestionIndex, sections, totalQuestions]);

  const handleSelectAnswer = useCallback((index: number) => {
    if (showFeedback) return;
    setSelectedAnswer(index);
  }, [showFeedback]);

  const handleSubmitAnswer = useCallback(() => {
    if (selectedAnswer === null || !currentQuestion) return;

    const isCorrect = selectedAnswer === currentQuestion.questionData.correctIndex;

    setAnswers(prev => [
      ...prev,
      {
        sectionIndex: currentSectionIndex,
        questionIndex: currentQuestionIndex,
        answer: selectedAnswer,
        correct: isCorrect,
      },
    ]);

    setShowFeedback(true);
  }, [selectedAnswer, currentQuestion, currentSectionIndex, currentQuestionIndex]);

  const handleNext = useCallback(() => {
    setShowFeedback(false);
    setSelectedAnswer(null);

    // Check if there are more questions in current section
    if (currentQuestionIndex < currentSection.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else if (currentSectionIndex < sections.length - 1) {
      // Move to next section
      setCurrentSectionIndex(prev => prev + 1);
      setCurrentQuestionIndex(0);
    } else {
      // Test complete - calculate results
      const sectionScores: Record<string, { score: number; total: number }> = {};
      let totalScore = 0;
      let totalPossible = 0;

      sections.forEach((section, sIdx) => {
        const sectionAnswers = answers.filter(a => a.sectionIndex === sIdx);
        // Include current answer if we just answered the last question
        if (sIdx === currentSectionIndex && selectedAnswer !== null) {
          const lastCorrect = selectedAnswer === currentQuestion?.questionData.correctIndex;
          sectionAnswers.push({
            sectionIndex: sIdx,
            questionIndex: currentQuestionIndex,
            answer: selectedAnswer,
            correct: lastCorrect,
          });
        }

        const correct = sectionAnswers.filter(a => a.correct).length;
        const total = section.questions.length;
        sectionScores[section.skill] = { score: correct, total };
        totalScore += correct * section.weight;
        totalPossible += total * section.weight;
      });

      const percentScore = Math.round((totalScore / totalPossible) * 100);

      // Determine recommended level based on score
      let recommendedLevel = 'N5';
      let recommendedPath = 'beginner';
      if (percentScore >= 90) {
        recommendedLevel = 'N2';
        recommendedPath = 'advanced';
      } else if (percentScore >= 75) {
        recommendedLevel = 'N3';
        recommendedPath = 'intermediate';
      } else if (percentScore >= 60) {
        recommendedLevel = 'N4';
        recommendedPath = 'elementary';
      }

      const result: AssessmentResult = {
        assessmentId: assessment?.id ?? 'sample',
        totalScore: totalScore,
        maxScore: totalPossible,
        percentScore,
        sectionScores: Object.fromEntries(
          Object.entries(sectionScores).map(([key, val]) => [
            key,
            {
              score: val.score,
              maxScore: val.total,
              percent: Math.round((val.score / val.total) * 100),
            },
          ])
        ),
        recommendedLevel,
        recommendedPath,
        answeredQuestions: answers.map(a => ({
          questionId: `${a.sectionIndex}-${a.questionIndex}`,
          correct: a.correct,
          userAnswer: a.answer,
        })),
        completedAt: new Date().toISOString(),
      };

      onComplete(result);
    }
  }, [
    currentQuestionIndex,
    currentSection,
    currentSectionIndex,
    sections,
    answers,
    selectedAnswer,
    currentQuestion,
    assessment,
    onComplete,
  ]);

  if (!currentQuestion) {
    return (
      <div className={styles.container}>
        <p>No questions available</p>
        <button onClick={onCancel}>Go Back</button>
      </div>
    );
  }

  const isCorrect = selectedAnswer === currentQuestion.questionData.correctIndex;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.cancelButton} onClick={onCancel}>
          &#10005;
        </button>
        <div className={styles.progressInfo}>
          <span className={styles.sectionName}>{currentSection.name}</span>
          <span className={styles.questionCount}>
            Question {answeredCount + 1} of {totalQuestions}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${progress}%` }} />
      </div>

      {/* Section indicators */}
      <div className={styles.sectionIndicators}>
        {sections.map((section, idx) => (
          <div
            key={section.skill}
            className={`${styles.sectionDot} ${
              idx < currentSectionIndex ? styles.completed : ''
            } ${idx === currentSectionIndex ? styles.active : ''}`}
          >
            {section.name.charAt(0)}
          </div>
        ))}
      </div>

      {/* Question */}
      <div className={styles.questionCard}>
        <div className={styles.difficultyBadge} data-difficulty={currentQuestion.difficulty}>
          {currentQuestion.difficulty}
        </div>

        <h2 className={styles.question}>{currentQuestion.questionData.question}</h2>

        <div className={styles.options}>
          {currentQuestion.questionData.options?.map((option: string, idx: number) => (
            <button
              key={idx}
              className={`${styles.option} ${
                selectedAnswer === idx ? styles.selected : ''
              } ${
                showFeedback && idx === currentQuestion.questionData.correctIndex
                  ? styles.correct
                  : ''
              } ${
                showFeedback && selectedAnswer === idx && !isCorrect
                  ? styles.incorrect
                  : ''
              }`}
              onClick={() => handleSelectAnswer(idx)}
              disabled={showFeedback}
            >
              <span className={styles.optionLetter}>
                {String.fromCharCode(65 + idx)}
              </span>
              <span className={styles.optionText}>{option}</span>
            </button>
          ))}
        </div>

        {/* Feedback */}
        {showFeedback && (
          <div className={`${styles.feedback} ${isCorrect ? styles.feedbackCorrect : styles.feedbackIncorrect}`}>
            <span className={styles.feedbackIcon}>
              {isCorrect ? '✓' : '✗'}
            </span>
            <span>{isCorrect ? 'Correct!' : 'Not quite right'}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        {!showFeedback ? (
          <button
            className={styles.submitButton}
            onClick={handleSubmitAnswer}
            disabled={selectedAnswer === null}
          >
            Check Answer
          </button>
        ) : (
          <button className={styles.nextButton} onClick={handleNext}>
            {currentSectionIndex === sections.length - 1 &&
            currentQuestionIndex === currentSection.questions.length - 1
              ? 'See Results'
              : 'Next Question'}
          </button>
        )}
      </div>
    </div>
  );
}
