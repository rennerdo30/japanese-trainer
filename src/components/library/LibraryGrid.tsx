'use client';

import { useMemo, useState } from 'react';
import { Text } from '@/components/ui';
import LibraryCard from './LibraryCard';
import LibrarySearch from './LibrarySearch';
import LibraryFilters, { type FilterStatus, type SrsFilter } from './LibraryFilters';
import { IoGrid, IoList } from 'react-icons/io5';
import styles from './LibraryGrid.module.css';

export interface LibraryItem {
  id: string;
  primary: string;
  secondary?: string;
  meaning: string;
  lessonSource?: string;
  srsStatus?: 'new' | 'learning' | 'review' | 'mastered';
  masteryPercent?: number;
  audioUrl?: string;
  category?: string;
  tags?: string[];
}

interface LibraryGridProps {
  items: LibraryItem[];
  onQuickReview?: (id: string) => void;
  showFilters?: boolean;
  showSearch?: boolean;
  emptyMessage?: string;
  title?: string;
}

export default function LibraryGrid({
  items,
  onQuickReview,
  showFilters = true,
  showSearch = true,
  emptyMessage = 'No items found',
  title,
}: LibraryGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [srsFilter, setSrsFilter] = useState<SrsFilter>('all');

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesPrimary = item.primary.toLowerCase().includes(query);
        const matchesSecondary = item.secondary?.toLowerCase().includes(query) ?? false;
        const matchesMeaning = item.meaning.toLowerCase().includes(query);
        const matchesTags = item.tags?.some((tag) => tag.toLowerCase().includes(query)) ?? false;

        if (!matchesPrimary && !matchesSecondary && !matchesMeaning && !matchesTags) {
          return false;
        }
      }

      // Status filter (learned/not learned)
      if (statusFilter !== 'all') {
        const isLearned = item.srsStatus && item.srsStatus !== 'new';
        if (statusFilter === 'learned' && !isLearned) return false;
        if (statusFilter === 'unlearned' && isLearned) return false;
      }

      // SRS filter
      if (srsFilter !== 'all' && item.srsStatus !== srsFilter) {
        return false;
      }

      return true;
    });
  }, [items, searchQuery, statusFilter, srsFilter]);

  // Stats
  const stats = useMemo(() => {
    const total = items.length;
    const learned = items.filter(
      (item) => item.srsStatus && item.srsStatus !== 'new'
    ).length;
    const mastered = items.filter((item) => item.srsStatus === 'mastered').length;

    return {
      total,
      learned,
      mastered,
      percentLearned: total > 0 ? Math.round((learned / total) * 100) : 0,
    };
  }, [items]);

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        {title && <Text variant="h2">{title}</Text>}
        <div className={styles.statsBar}>
          <Text variant="caption" color="muted">
            {stats.learned} / {stats.total} learned ({stats.percentLearned}%)
          </Text>
          {stats.mastered > 0 && (
            <Text variant="caption" color="gold">
              {stats.mastered} mastered
            </Text>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className={styles.controls}>
        {showSearch && (
          <LibrarySearch
            onSearch={setSearchQuery}
            placeholder="Search vocabulary..."
            resultCount={filteredItems.length}
          />
        )}

        <div className={styles.viewToggle}>
          <button
            onClick={() => setViewMode('grid')}
            className={`${styles.viewButton} ${viewMode === 'grid' ? styles.active : ''}`}
            aria-label="Grid view"
          >
            <IoGrid />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`${styles.viewButton} ${viewMode === 'list' ? styles.active : ''}`}
            aria-label="List view"
          >
            <IoList />
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <LibraryFilters
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          srsFilter={srsFilter}
          onSrsChange={setSrsFilter}
        />
      )}

      {/* Results count */}
      <div className={styles.resultsCount}>
        <Text variant="caption" color="muted">
          {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
          {searchQuery && ` matching "${searchQuery}"`}
        </Text>
      </div>

      {/* Grid/List */}
      {filteredItems.length > 0 ? (
        <div className={`${styles.grid} ${styles[viewMode]}`}>
          {filteredItems.map((item) => (
            <LibraryCard
              key={item.id}
              id={item.id}
              primary={item.primary}
              secondary={item.secondary}
              meaning={item.meaning}
              lessonSource={item.lessonSource}
              srsStatus={item.srsStatus}
              masteryPercent={item.masteryPercent}
              audioUrl={item.audioUrl}
              onQuickReview={onQuickReview}
            />
          ))}
        </div>
      ) : (
        <div className={styles.empty}>
          <Text variant="body" color="muted">
            {emptyMessage}
          </Text>
        </div>
      )}
    </div>
  );
}
