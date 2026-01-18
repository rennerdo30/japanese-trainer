// Path progress types for curriculum-driven learning

import type { LessonStatus } from './curriculum';

// Learning path definition
export interface LearningPath {
  id: string;                    // "jlpt-mastery", "cefr-spanish"
  languageCode: string;          // "ja", "es", "de"
  name: string;
  description: string;
  targetProficiency: string;     // "N5", "A1", "HSK1"
  estimatedHours: number;
  milestones: PathMilestone[];
}

// Milestone within a path
export interface PathMilestone {
  id: string;                    // "N5-basics", "A1-greetings"
  name: string;
  description: string;
  order: number;
  lessons: string[];             // Lesson IDs
  testId?: string;               // Optional milestone test
  requirements?: {
    previousMilestone?: string;
    minimumScore?: number;
  };
}

// User's progress on a specific path
export interface PathProgress {
  pathId: string;
  languageCode: string;
  userId?: string;
  currentMilestoneId: string;
  currentLessonId: string;
  overallProgress: number;       // 0-100
  startedAt: number;
  lastActivityAt: number;
  completedAt?: number;
  milestoneProgress: Record<string, MilestoneProgress>;
  lessonProgress: Record<string, LessonProgressData>;
}

// Progress on a single milestone
export interface MilestoneProgress {
  milestoneId: string;
  status: MilestoneStatus;
  lessonsCompleted: number;
  lessonsTotal: number;
  testPassed: boolean;
  testScore?: number;
  testAttempts: number;
  startedAt?: number;
  completedAt?: number;
}

export type MilestoneStatus = 'locked' | 'available' | 'in_progress' | 'completed';

// Detailed lesson progress data
export interface LessonProgressData {
  lessonId: string;
  status: LessonStatus;
  startedAt?: number;
  completedAt?: number;
  score?: number;
  xpEarned: number;
  timeSpentMinutes: number;
  attempts: number;
  exerciseResults?: PathExerciseResult[];
}

// Individual exercise result for path tracking
export interface PathExerciseResult {
  exerciseId: string;
  correct: boolean;
  attempts: number;
  timeSpentSeconds: number;
  xpEarned: number;
  answeredAt: number;
}

// Lesson session tracking
export interface LessonSession {
  sessionId: string;
  lessonId: string;
  pathId: string;
  userId: string;
  startedAt: number;
  completedAt?: number;
  exerciseResults: PathExerciseResult[];
  totalXPEarned: number;
  score?: number;
  isPaused: boolean;
  currentStep: number;
  totalSteps: number;
}

// Path enrollment data
export interface PathEnrollment {
  pathId: string;
  languageCode: string;
  enrolledAt: number;
  isActive: boolean;
  lastAccessedAt: number;
}

// Summary of user's path progress for dashboard
export interface PathProgressSummary {
  pathId: string;
  pathName: string;
  languageCode: string;
  overallProgress: number;
  currentMilestoneName: string;
  currentLessonTitle: string;
  nextLessonId?: string;
  lessonsCompleted: number;
  lessonsTotal: number;
  lastActivityAt: number;
}

// Continue learning card data
export interface ContinueLearningData {
  pathId: string;
  lessonId: string;
  lessonTitle: string;
  lessonDescription: string;
  estimatedMinutes: number;
  milestoneProgress: number;
  pathProgress: number;
  isResuming: boolean;          // True if resuming mid-lesson
  resumeStep?: number;
}
