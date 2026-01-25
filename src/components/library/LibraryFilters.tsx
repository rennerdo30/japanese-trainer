'use client';

import { Text, Button } from '@/components/ui';
import { useLanguage } from '@/context/LanguageProvider';
import styles from './LibraryFilters.module.css';

export type FilterStatus = 'all' | 'learned' | 'unlearned';
export type SrsFilter = 'all' | 'new' | 'learning' | 'review' | 'mastered';

interface LibraryFiltersProps {
  statusFilter: FilterStatus;
  onStatusChange: (status: FilterStatus) => void;
  srsFilter?: SrsFilter;
  onSrsChange?: (srs: SrsFilter) => void;
  levels?: string[];
  selectedLevel?: string;
  onLevelChange?: (level: string | undefined) => void;
  lessons?: Array<{ id: string; title: string }>;
  selectedLesson?: string;
  onLessonChange?: (lessonId: string | undefined) => void;
}

// Keys for status options - labels will be looked up via t()
const STATUS_OPTIONS: Array<{ value: FilterStatus; labelKey: string }> = [
  { value: 'all', labelKey: 'library.filters.all' },
  { value: 'learned', labelKey: 'library.filters.learned' },
  { value: 'unlearned', labelKey: 'library.filters.notLearned' },
];

// Keys for SRS options - labels will be looked up via t()
const SRS_OPTIONS: Array<{ value: SrsFilter; labelKey: string }> = [
  { value: 'all', labelKey: 'library.filters.all' },
  { value: 'new', labelKey: 'review.mastery.new' },
  { value: 'learning', labelKey: 'review.mastery.learning' },
  { value: 'review', labelKey: 'review.mastery.review' },
  { value: 'mastered', labelKey: 'review.mastery.mastered' },
];

export default function LibraryFilters({
  statusFilter,
  onStatusChange,
  srsFilter,
  onSrsChange,
  levels,
  selectedLevel,
  onLevelChange,
  lessons,
  selectedLesson,
  onLessonChange,
}: LibraryFiltersProps) {
  const { t } = useLanguage();

  return (
    <div className={styles.container} role="group" aria-label={t('library.filters.title')}>
      <div className={styles.filterGroup}>
        <Text variant="caption" color="muted" className={styles.label} id="status-filter-label">
          {t('library.filters.status')}
        </Text>
        <div className={styles.toggleGroup} role="group" aria-labelledby="status-filter-label">
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              className={`${styles.toggleButton} ${statusFilter === option.value ? styles.active : ''}`}
              onClick={() => onStatusChange(option.value)}
              aria-pressed={statusFilter === option.value}
              type="button"
            >
              {t(option.labelKey)}
            </button>
          ))}
        </div>
      </div>

      {onSrsChange && srsFilter !== undefined && (
        <div className={styles.filterGroup}>
          <Text variant="caption" color="muted" className={styles.label} id="srs-filter-label">
            {t('library.filters.srsStatus')}
          </Text>
          <div className={styles.toggleGroup} role="group" aria-labelledby="srs-filter-label">
            {SRS_OPTIONS.map((option) => (
              <button
                key={option.value}
                className={`${styles.toggleButton} ${srsFilter === option.value ? styles.active : ''}`}
                onClick={() => onSrsChange(option.value)}
                aria-pressed={srsFilter === option.value}
                type="button"
              >
                {t(option.labelKey)}
              </button>
            ))}
          </div>
        </div>
      )}

      {levels && levels.length > 0 && onLevelChange && (
        <div className={styles.filterGroup}>
          <label htmlFor="level-select">
            <Text variant="caption" color="muted" className={styles.label}>
              {t('library.filters.level')}
            </Text>
          </label>
          <select
            id="level-select"
            value={selectedLevel || ''}
            onChange={(e) => onLevelChange(e.target.value || undefined)}
            className={styles.select}
          >
            <option value="">{t('library.filters.allLevels')}</option>
            {levels.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </div>
      )}

      {lessons && lessons.length > 0 && onLessonChange && (
        <div className={styles.filterGroup}>
          <label htmlFor="lesson-select">
            <Text variant="caption" color="muted" className={styles.label}>
              {t('library.filters.lesson')}
            </Text>
          </label>
          <select
            id="lesson-select"
            value={selectedLesson || ''}
            onChange={(e) => onLessonChange(e.target.value || undefined)}
            className={styles.select}
          >
            <option value="">{t('library.filters.allLessons')}</option>
            {lessons.map((lesson) => (
              <option key={lesson.id} value={lesson.id}>
                {lesson.title}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
