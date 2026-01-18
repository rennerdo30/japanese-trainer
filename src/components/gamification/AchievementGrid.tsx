'use client';

import { useState, useMemo } from 'react';
import { Text, Button } from '@/components/ui';
import AchievementCard from './AchievementCard';
import type { Achievement, AchievementCategory, AchievementRarity } from '@/types/gamification';
import styles from './AchievementGrid.module.css';

interface UserAchievementData {
  achievementId: string;
  unlockedAt: number | null;
  progress?: number;
}

interface AchievementGridProps {
  achievements: Achievement[];
  userAchievements: UserAchievementData[];
  showFilters?: boolean;
  compact?: boolean;
}

type FilterCategory = 'all' | AchievementCategory;
type FilterStatus = 'all' | 'unlocked' | 'locked';

export default function AchievementGrid({
  achievements,
  userAchievements,
  showFilters = true,
  compact = false,
}: AchievementGridProps) {
  const [categoryFilter, setCategoryFilter] = useState<FilterCategory>('all');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');

  // Create a map for quick lookup
  const userAchievementMap = useMemo(() => {
    const map = new Map<string, UserAchievementData>();
    userAchievements.forEach((ua) => {
      map.set(ua.achievementId, ua);
    });
    return map;
  }, [userAchievements]);

  // Filter achievements
  const filteredAchievements = useMemo(() => {
    return achievements.filter((achievement) => {
      // Category filter
      if (categoryFilter !== 'all' && achievement.category !== categoryFilter) {
        return false;
      }

      // Status filter
      const userAchievement = userAchievementMap.get(achievement.id);
      const isUnlocked = userAchievement?.unlockedAt && userAchievement.unlockedAt > 0;

      if (statusFilter === 'unlocked' && !isUnlocked) {
        return false;
      }
      if (statusFilter === 'locked' && isUnlocked) {
        return false;
      }

      return true;
    });
  }, [achievements, categoryFilter, statusFilter, userAchievementMap]);

  // Sort achievements: unlocked first, then by rarity
  const sortedAchievements = useMemo(() => {
    const rarityOrder: Record<AchievementRarity, number> = {
      legendary: 0,
      epic: 1,
      rare: 2,
      common: 3,
    };

    return [...filteredAchievements].sort((a, b) => {
      const aUnlocked = userAchievementMap.get(a.id)?.unlockedAt;
      const bUnlocked = userAchievementMap.get(b.id)?.unlockedAt;

      // Unlocked first
      if (aUnlocked && !bUnlocked) return -1;
      if (!aUnlocked && bUnlocked) return 1;

      // Then by rarity
      return rarityOrder[a.rarity] - rarityOrder[b.rarity];
    });
  }, [filteredAchievements, userAchievementMap]);

  // Count stats
  const stats = useMemo(() => {
    const total = achievements.length;
    const unlocked = userAchievements.filter((ua) => ua.unlockedAt && ua.unlockedAt > 0).length;
    return { total, unlocked, percentage: total > 0 ? Math.round((unlocked / total) * 100) : 0 };
  }, [achievements, userAchievements]);

  const categories: { value: FilterCategory; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'learning', label: 'Learning' },
    { value: 'streak', label: 'Streak' },
    { value: 'mastery', label: 'Mastery' },
    { value: 'explorer', label: 'Explorer' },
    { value: 'special', label: 'Special' },
  ];

  return (
    <div className={styles.container}>
      {showFilters && (
        <div className={styles.header}>
          <div className={styles.stats}>
            <Text variant="h3">
              {stats.unlocked} / {stats.total}
            </Text>
            <Text variant="caption" color="muted">
              Achievements ({stats.percentage}%)
            </Text>
          </div>

          <div className={styles.filters}>
            <div className={styles.filterGroup}>
              {categories.map((cat) => (
                <Button
                  key={cat.value}
                  variant={categoryFilter === cat.value ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setCategoryFilter(cat.value)}
                  className={styles.filterButton}
                >
                  {cat.label}
                </Button>
              ))}
            </div>

            <div className={styles.filterGroup}>
              <Button
                variant={statusFilter === 'all' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setStatusFilter('all')}
              >
                All
              </Button>
              <Button
                variant={statusFilter === 'unlocked' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setStatusFilter('unlocked')}
              >
                Unlocked
              </Button>
              <Button
                variant={statusFilter === 'locked' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setStatusFilter('locked')}
              >
                Locked
              </Button>
            </div>
          </div>
        </div>
      )}

      {sortedAchievements.length === 0 ? (
        <div className={styles.empty}>
          <Text color="muted">No achievements found</Text>
        </div>
      ) : (
        <div className={compact ? styles.compactGrid : styles.grid}>
          {sortedAchievements.map((achievement) => {
            const userAchievement = userAchievementMap.get(achievement.id);
            const isUnlocked = !!(userAchievement?.unlockedAt && userAchievement.unlockedAt > 0);

            return (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
                unlocked={isUnlocked}
                progress={userAchievement?.progress}
                unlockedAt={userAchievement?.unlockedAt ? new Date(userAchievement.unlockedAt).toISOString() : null}
                compact={compact}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
