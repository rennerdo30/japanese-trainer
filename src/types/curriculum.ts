// Curriculum types for lesson-based learning paths

import type { Exercise } from './exercises';

export interface LessonContent {
  topics: string[];
  vocab_focus: string[];
  kanji_focus?: string[];
  grammar_focus?: string[];
  cultural_notes?: string[];
}

export interface CurriculumLesson {
  id: string;              // "A1-U1-L1" or "es-a1-vocab-l1"
  milestoneId?: string;    // Parent milestone reference
  title: string;
  description: string;
  content: LessonContent;
  exercises?: Exercise[];  // Exercises for this lesson
  estimatedMinutes?: number;
}

export interface CurriculumUnit {
  id: string;              // "A1-U1"
  title: string;
  description: string;
  lessons: CurriculumLesson[];
}

export interface CurriculumLevel {
  level: string;           // "A1", "N5", etc.
  description: string;
  units: CurriculumUnit[];
}

export interface Curriculum {
  language_code: string;
  levels: CurriculumLevel[];
}

export type LessonStatus = 'locked' | 'available' | 'in_progress' | 'completed';

export interface LessonProgress {
  lessonId: string;
  status: LessonStatus;
  startedAt?: number;
  completedAt?: number;
  score?: number;
  xpEarned?: number;
  attempts: number;
}

// Context info returned when looking up a lesson
export interface LessonContext {
  level: CurriculumLevel;
  unit: CurriculumUnit;
  lesson: CurriculumLesson;
  levelIndex: number;
  unitIndex: number;
  lessonIndex: number;
}

// Flattened lesson with context
export interface FlattenedLesson {
  lesson: CurriculumLesson;
  levelId: string;
  unitId: string;
  levelIndex: number;
  unitIndex: number;
  lessonIndex: number;
}
