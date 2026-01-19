'use client';

import { Card, Text, Button } from '@/components/ui';
import { useLanguage } from '@/context/LanguageProvider';
import type { CurriculumLesson, LessonContext } from '@/types/curriculum';
import { IoPlay, IoArrowBack, IoTime, IoBook, IoLanguage } from 'react-icons/io5';
import styles from './LessonIntro.module.css';

interface LessonIntroProps {
  lesson: CurriculumLesson;
  lessonInfo: LessonContext | null;
  onStart: () => void;
  onBack: () => void;
}

export default function LessonIntro({
  lesson,
  lessonInfo,
  onStart,
  onBack,
}: LessonIntroProps) {
  const { t } = useLanguage();
  const topicsCount = lesson.content.topics.length;
  const vocabCount = lesson.content.vocab_focus.length;
  const grammarCount = lesson.content.grammar_focus?.length || 0;
  const culturalCount = lesson.content.cultural_notes?.length || 0;
  const totalItems = topicsCount + vocabCount + grammarCount + culturalCount;

  return (
    <div className={styles.introContainer}>
      {/* Header */}
      <div className={styles.header}>
        <Button variant="ghost" onClick={onBack} className={styles.backButton}>
          <IoArrowBack /> {t('lessons.intro.back')}
        </Button>

        {lessonInfo && (
          <div className={styles.breadcrumb}>
            <span className={styles.level}>{lessonInfo.level.level}</span>
            <span className={styles.separator}>/</span>
            <span className={styles.unit}>{lessonInfo.unit.title}</span>
          </div>
        )}
      </div>

      {/* Main Content */}
      <Card variant="glass" className={styles.mainCard}>
        <div className={styles.titleSection}>
          <Text variant="h1" color="gold" className={styles.title}>
            {lesson.title}
          </Text>
          <Text color="muted" className={styles.description}>
            {lesson.description}
          </Text>
        </div>

        {/* Stats */}
        <div className={styles.stats}>
          {lesson.estimatedMinutes && (
            <div className={styles.stat}>
              <IoTime className={styles.statIcon} />
              <div className={styles.statContent}>
                <Text variant="h3">{lesson.estimatedMinutes}</Text>
                <Text variant="caption" color="muted">{t('lessons.intro.minutes')}</Text>
              </div>
            </div>
          )}

          <div className={styles.stat}>
            <IoBook className={styles.statIcon} />
            <div className={styles.statContent}>
              <Text variant="h3">{totalItems}</Text>
              <Text variant="caption" color="muted">{t('lessons.intro.items')}</Text>
            </div>
          </div>

          {vocabCount > 0 && (
            <div className={styles.stat}>
              <IoLanguage className={styles.statIcon} />
              <div className={styles.statContent}>
                <Text variant="h3">{vocabCount}</Text>
                <Text variant="caption" color="muted">{t('lessons.intro.vocabulary')}</Text>
              </div>
            </div>
          )}
        </div>

        {/* Content Preview */}
        <div className={styles.preview}>
          <Text variant="label" color="muted" className={styles.previewLabel}>
            {t('lessons.intro.whatYoullLearn')}
          </Text>

          <div className={styles.previewItems}>
            {lesson.content.topics.map((topic, index) => (
              <div key={`topic-${index}`} className={styles.previewItem}>
                <span className={styles.bullet} />
                <Text variant="body">{topic}</Text>
              </div>
            ))}

            {vocabCount > 0 && (
              <div className={styles.previewItem}>
                <span className={styles.bullet} />
                <Text variant="body">{t('lessons.intro.vocabularyWords', { count: vocabCount })}</Text>
              </div>
            )}

            {grammarCount > 0 && (
              <div className={styles.previewItem}>
                <span className={styles.bullet} />
                <Text variant="body">{t('lessons.intro.grammarPoints', { count: grammarCount })}</Text>
              </div>
            )}

            {culturalCount > 0 && (
              <div className={styles.previewItem}>
                <span className={styles.bullet} />
                <Text variant="body">{t('lessons.intro.culturalNotes', { count: culturalCount })}</Text>
              </div>
            )}
          </div>
        </div>

        {/* Start Button */}
        <Button onClick={onStart} size="lg" className={styles.startButton}>
          <IoPlay /> {t('lessons.intro.startLesson')}
        </Button>
      </Card>
    </div>
  );
}
