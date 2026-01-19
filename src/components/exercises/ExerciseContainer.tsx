'use client';

import type { Exercise } from '@/types/exercises';
import FillBlank from './FillBlank';
import MultipleChoice from './MultipleChoice';
import Matching from './Matching';
import WordOrder from './WordOrder';
import Listening from './Listening';
import Translation from './Translation';
import StrokeOrder from './StrokeOrder';
import { Text } from '@/components/ui';
import { useLanguage } from '@/context/LanguageProvider';
import styles from './ExerciseContainer.module.css';

interface ExerciseContainerProps {
  exercise: Exercise;
  onAnswer: (isCorrect: boolean) => void;
}

export default function ExerciseContainer({ exercise, onAnswer }: ExerciseContainerProps) {
  const { t } = useLanguage();

  const renderExercise = () => {
    switch (exercise.type) {
      case 'multiple_choice':
        return <MultipleChoice exercise={exercise} onAnswer={onAnswer} />;
      case 'fill_blank':
        return <FillBlank exercise={exercise} onAnswer={onAnswer} />;
      case 'matching':
        return <Matching exercise={exercise} onAnswer={onAnswer} />;
      case 'word_order':
        return <WordOrder exercise={exercise} onAnswer={onAnswer} />;
      case 'listening':
        return <Listening exercise={exercise} onAnswer={onAnswer} />;
      case 'translation':
        return <Translation exercise={exercise} onAnswer={onAnswer} />;
      case 'stroke_order':
        return <StrokeOrder exercise={exercise} onAnswer={onAnswer} />;
      default:
        return (
          <div className={styles.unsupported}>
            <Text color="muted">
              {t('exercises.common.unsupported')}
            </Text>
          </div>
        );
    }
  };

  return (
    <div className={styles.container}>
      {exercise.difficulty && (
        <div className={styles.difficultyBadge}>
          <span className={`${styles.difficulty} ${styles[exercise.difficulty]}`}>
            {exercise.difficulty}
          </span>
        </div>
      )}
      {renderExercise()}
    </div>
  );
}
