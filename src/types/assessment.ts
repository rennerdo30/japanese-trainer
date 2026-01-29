/**
 * Assessment Types for Frontend
 *
 * Types for placement tests, checkpoint assessments, and mastery tests.
 */

export type AssessmentType = 'placement' | 'checkpoint' | 'mastery';
export type SkillType = 'vocabulary' | 'grammar' | 'reading' | 'listening';
export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface ExerciseData {
  id: string;
  type: string;
  question: string;
  options?: string[];
  correctIndex?: number;
  correctAnswer?: string;
  acceptableAnswers?: string[];
  hint?: string;
  explanation?: string;
  audioUrl?: string;
}

export interface AssessmentQuestion {
  id: string;
  sectionIndex: number;
  questionIndex: number;
  skill: SkillType;
  difficulty: DifficultyLevel;
  questionData: ExerciseData;
  points: number;
}

export interface AssessmentSection {
  name: string;
  skill: SkillType;
  weight: number;
  questions: AssessmentQuestion[];
}

export interface ScoringRubric {
  levelThresholds: Record<string, number>;
  recommendations: Record<string, string>;
  sectionWeights: Record<SkillType, number>;
}

export interface Assessment {
  id: string;
  type: AssessmentType;
  name: string;
  description?: string;
  targetLevel?: string;
  sections: AssessmentSection[];
  scoringRubric: ScoringRubric;
  estimatedMinutes: number;
}

export interface SectionScore {
  score: number;
  maxScore: number;
  percent: number;
}

export interface AnsweredQuestion {
  questionId: string;
  correct: boolean;
  userAnswer: string | number;
}

export interface AssessmentResult {
  assessmentId: string;
  totalScore: number;
  maxScore: number;
  percentScore: number;
  sectionScores: Record<string, SectionScore>;
  recommendedLevel: string;
  recommendedPath: string;
  answeredQuestions: AnsweredQuestion[];
  completedAt: string;
}

export interface AssessmentProgress {
  currentSectionIndex: number;
  currentQuestionIndex: number;
  totalQuestions: number;
  answeredCount: number;
  answers: Map<string, string | number>;
}

// State for assessment UI
export interface AssessmentState {
  assessment: Assessment | null;
  progress: AssessmentProgress;
  result: AssessmentResult | null;
  isLoading: boolean;
  error: string | null;
}

// Actions for assessment flow
export type AssessmentAction =
  | { type: 'LOAD_ASSESSMENT'; payload: Assessment }
  | { type: 'ANSWER_QUESTION'; payload: { questionId: string; answer: string | number } }
  | { type: 'NEXT_QUESTION' }
  | { type: 'PREVIOUS_QUESTION' }
  | { type: 'SUBMIT_ASSESSMENT'; payload: AssessmentResult }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'RESET' };
