'use client';

import { Text, Button } from '@/components/ui';
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

const STATUS_OPTIONS: Array<{ value: FilterStatus; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'learned', label: 'Learned' },
  { value: 'unlearned', label: 'Not Learned' },
];

const SRS_OPTIONS: Array<{ value: SrsFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'learning', label: 'Learning' },
  { value: 'review', label: 'Review' },
  { value: 'mastered', label: 'Mastered' },
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
  return (
    <div className={styles.container} role="group" aria-label="Filters">
      <div className={styles.filterGroup}>
        <Text variant="caption" color="muted" className={styles.label} id="status-filter-label">
          Status
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
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {onSrsChange && srsFilter !== undefined && (
        <div className={styles.filterGroup}>
          <Text variant="caption" color="muted" className={styles.label} id="srs-filter-label">
            SRS Status
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
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {levels && levels.length > 0 && onLevelChange && (
        <div className={styles.filterGroup}>
          <label htmlFor="level-select">
            <Text variant="caption" color="muted" className={styles.label}>
              Level
            </Text>
          </label>
          <select
            id="level-select"
            value={selectedLevel || ''}
            onChange={(e) => onLevelChange(e.target.value || undefined)}
            className={styles.select}
          >
            <option value="">All Levels</option>
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
              Lesson
            </Text>
          </label>
          <select
            id="lesson-select"
            value={selectedLesson || ''}
            onChange={(e) => onLessonChange(e.target.value || undefined)}
            className={styles.select}
          >
            <option value="">All Lessons</option>
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
