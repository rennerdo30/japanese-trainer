// Gamification types for XP, levels, streaks, and daily goals

export interface UserLevel {
  level: number;
  currentXP: number;
  xpToNextLevel: number;
  totalXP: number;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;  // YYYY-MM-DD format
}

export type DailyGoalType = 'xp' | 'lessons' | 'time';

export interface DailyGoal {
  type: DailyGoalType;
  target: number;
  current: number;
  completed: boolean;
}

export interface GamificationState {
  level: UserLevel;
  streak: StreakData;
  dailyGoal: DailyGoal;
  todayXP: number;
}

// XP award sources for tracking
export type XPSource =
  | 'lesson_complete'
  | 'lesson_perfect'
  | 'review_correct'
  | 'streak_bonus'
  | 'daily_goal'
  | 'achievement';

export interface XPAward {
  amount: number;
  source: XPSource;
  timestamp: number;
  lessonId?: string;
}

// Level up event
export interface LevelUpEvent {
  previousLevel: number;
  newLevel: number;
  totalXP: number;
}

// Streak milestone
export interface StreakMilestone {
  days: number;
  label: string;
  achieved: boolean;
}

// Achievement categories
export type AchievementCategory =
  | 'learning'      // Lesson and exercise related
  | 'streak'        // Streak related
  | 'mastery'       // Skill mastery
  | 'explorer'      // Exploring content
  | 'social'        // Social features
  | 'special';      // Special/seasonal

// Achievement rarity
export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';

// Achievement definition
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;  // Icon name from react-icons
  category: AchievementCategory;
  rarity: AchievementRarity;
  xpReward: number;
  criteria: {
    type: string;
    value: number;
  };
  hidden?: boolean;  // Secret achievements
}

// User's achievement progress
export interface UserAchievement {
  achievementId: string;
  unlockedAt: string | null;  // ISO date string or null if not unlocked
  progress?: number;  // Current progress towards achievement (0-100)
}

// Achievement unlock event
export interface AchievementUnlockEvent {
  achievement: Achievement;
  xpAwarded: number;
  timestamp: number;
}
