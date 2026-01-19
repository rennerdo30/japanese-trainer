'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Navigation from '@/components/common/Navigation';
import { Container, Card, Text, Button, Animated } from '@/components/ui';
import { useRecommendations } from '@/hooks/useRecommendations';
import { usePathProgress } from '@/hooks/usePathProgress';
import { useLanguage } from '@/context/LanguageProvider';
import {
  IoRocket,
  IoSchool,
  IoRestaurant,
  IoAirplane,
  IoBriefcase,
  IoChatbubbles,
  IoTv,
  IoFilter,
  IoSparkles,
  IoCheckmarkCircle,
  IoLockClosed,
  IoTime,
  IoTrendingUp,
  IoPlay,
} from 'react-icons/io5';
import styles from './paths.module.css';

type PathType = 'all' | 'linear' | 'topic' | 'adaptive';
type DifficultyFilter = 'all' | 'beginner' | 'intermediate' | 'advanced';

const PATH_ICONS: Record<string, React.ReactNode> = {
  'jlpt-mastery': <IoSchool />,
  'restaurant-japanese': <IoRestaurant />,
  'travel-essentials': <IoAirplane />,
  'business-japanese': <IoBriefcase />,
  'daily-conversation': <IoChatbubbles />,
  'anime-manga': <IoTv />,
};

export default function PathsPage() {
  const { t } = useLanguage();
  const { paths, adaptiveRecommendations, isLoading, hasPathsData } = useRecommendations();
  const { isEnrolled, enrollInPath, checkPrerequisites } = usePathProgress();

  const [typeFilter, setTypeFilter] = useState<PathType>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Filter paths
  const filteredPaths = useMemo(() => {
    return paths.filter((path) => {
      // Type filter
      if (typeFilter !== 'all' && path.pathType !== typeFilter) {
        return false;
      }

      // Difficulty filter
      if (difficultyFilter !== 'all') {
        const pathDifficulty = path.difficulty?.toLowerCase() || 'beginner';
        if (!pathDifficulty.includes(difficultyFilter)) {
          return false;
        }
      }

      return true;
    });
  }, [paths, typeFilter, difficultyFilter]);

  // Separate linear paths (JLPT) and topic tracks
  const linearPaths = filteredPaths.filter(p => p.pathType === 'linear');
  const topicPaths = filteredPaths.filter(p => p.pathType === 'topic');

  // Get difficulty badge color
  const getDifficultyColor = (difficulty: string) => {
    if (difficulty.includes('beginner')) return 'var(--success)';
    if (difficulty.includes('intermediate')) return 'var(--accent-gold)';
    if (difficulty.includes('advanced')) return 'var(--accent-red)';
    return 'var(--text-muted)';
  };

  if (isLoading) {
    return (
      <Container variant="centered">
        <Navigation />
        <Text variant="body" color="muted">Loading paths...</Text>
      </Container>
    );
  }

  return (
    <Container variant="centered">
      <Navigation />

      <Animated animation="fadeInDown">
        <Text variant="h1" color="gold" align="center" className={styles.pageTitle}>
          Learning Paths
        </Text>
        <Text color="muted" align="center" className={styles.pageSubtitle}>
          Choose your journey to Japanese mastery
        </Text>
      </Animated>

      {/* Filters */}
      <div className={styles.filterBar}>
        <Button
          variant="ghost"
          onClick={() => setShowFilters(!showFilters)}
          className={styles.filterToggle}
        >
          <IoFilter /> Filters
        </Button>

        {showFilters && (
          <Animated animation="fadeInDown" className={styles.filterOptions}>
            <div className={styles.filterGroup}>
              <Text variant="label" color="muted">Type</Text>
              <div className={styles.filterButtons}>
                {(['all', 'linear', 'topic'] as PathType[]).map((type) => (
                  <button
                    key={type}
                    className={`${styles.filterButton} ${typeFilter === type ? styles.active : ''}`}
                    onClick={() => setTypeFilter(type)}
                  >
                    {type === 'all' ? 'All' : type === 'linear' ? 'JLPT Path' : 'Topics'}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.filterGroup}>
              <Text variant="label" color="muted">Difficulty</Text>
              <div className={styles.filterButtons}>
                {(['all', 'beginner', 'intermediate', 'advanced'] as DifficultyFilter[]).map((diff) => (
                  <button
                    key={diff}
                    className={`${styles.filterButton} ${difficultyFilter === diff ? styles.active : ''}`}
                    onClick={() => setDifficultyFilter(diff)}
                  >
                    {diff.charAt(0).toUpperCase() + diff.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </Animated>
        )}
      </div>

      {/* Adaptive Path Section */}
      {adaptiveRecommendations && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <IoSparkles className={styles.sectionIcon} />
            <Text variant="h2">Your Personalized Path</Text>
          </div>
          <Card variant="glass" className={styles.adaptiveCard}>
            <div className={styles.adaptiveHeader}>
              <div className={styles.adaptiveIcon}>
                <IoRocket />
              </div>
              <div className={styles.adaptiveInfo}>
                <Text variant="h3">AI-Powered Recommendations</Text>
                <Text variant="body" color="muted">
                  Tailored to your learning patterns and goals
                </Text>
              </div>
            </div>
            <div className={styles.adaptiveContent}>
              <Text variant="body" className={styles.adaptiveRationale}>
                {adaptiveRecommendations.rationale}
              </Text>
              <div className={styles.adaptiveStats}>
                <div className={styles.adaptiveStat}>
                  <Text variant="h3" color="gold">{adaptiveRecommendations.dailyGoalMinutes}</Text>
                  <Text variant="label" color="muted">min/day</Text>
                </div>
                <div className={styles.adaptiveStat}>
                  <Text variant="h3" color="gold">{adaptiveRecommendations.weeklyGoal.newItems}</Text>
                  <Text variant="label" color="muted">new/week</Text>
                </div>
                <div className={styles.adaptiveStat}>
                  <Text variant="h3" color="gold">{adaptiveRecommendations.suggestedPace}</Text>
                  <Text variant="label" color="muted">pace</Text>
                </div>
              </div>
              {adaptiveRecommendations.focusAreas.length > 0 && (
                <div className={styles.focusAreas}>
                  <Text variant="label" color="muted">Focus Areas:</Text>
                  <div className={styles.focusTags}>
                    {adaptiveRecommendations.focusAreas.slice(0, 3).map((area, idx) => (
                      <span key={idx} className={styles.focusTag}>
                        {area.module}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <Link href="/review" className={styles.adaptiveAction}>
              <Button>
                <IoPlay /> Start Learning
              </Button>
            </Link>
          </Card>
        </section>
      )}

      {/* Linear Paths (JLPT) */}
      {linearPaths.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <IoSchool className={styles.sectionIcon} />
            <Text variant="h2">Structured Paths</Text>
          </div>
          <div className={styles.pathsGrid}>
            {linearPaths.map((path) => {
              const enrolled = isEnrolled(path.pathId);
              return (
                <Link key={path.pathId} href={`/paths/${path.pathId}`}>
                  <Card variant="glass" hover className={styles.pathCard}>
                    <div className={styles.pathIcon}>
                      {PATH_ICONS[path.pathId] || <IoSchool />}
                    </div>
                    <div className={styles.pathContent}>
                      <Text variant="h3">{path.name}</Text>
                      <Text variant="body" color="muted" className={styles.pathDescription}>
                        {path.description}
                      </Text>
                      <div className={styles.pathProgress}>
                        <div
                          className={styles.pathProgressBar}
                          style={{ width: `${path.percentComplete}%` }}
                        />
                      </div>
                      <div className={styles.pathMeta}>
                        <span className={styles.pathStat}>
                          <IoTrendingUp /> {path.percentComplete}%
                        </span>
                        <span className={styles.pathStat}>
                          <IoCheckmarkCircle /> {path.completedMilestones}/{path.totalMilestones}
                        </span>
                      </div>
                    </div>
                    {enrolled && (
                      <div className={styles.enrolledBadge}>
                        <IoCheckmarkCircle /> Enrolled
                      </div>
                    )}
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Topic Tracks */}
      {topicPaths.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <IoRocket className={styles.sectionIcon} />
            <Text variant="h2">Topic Tracks</Text>
          </div>
          <div className={styles.topicGrid}>
            {topicPaths.map((path) => {
              const enrolled = isEnrolled(path.pathId);
              const prereqs = checkPrerequisites(path.pathId);
              const isLocked = !prereqs.met;

              return (
                <Link key={path.pathId} href={`/paths/${path.pathId}`}>
                  <Card
                    variant="glass"
                    hover={!isLocked}
                    className={`${styles.topicCard} ${isLocked ? styles.locked : ''}`}
                  >
                    <div className={styles.topicHeader}>
                      <div className={styles.topicIcon}>
                        {PATH_ICONS[path.pathId] || <IoSparkles />}
                      </div>
                      {isLocked && (
                        <div className={styles.lockIcon}>
                          <IoLockClosed />
                        </div>
                      )}
                    </div>
                    <Text variant="h3" className={styles.topicTitle}>{path.name}</Text>
                    <Text variant="caption" color="muted" className={styles.topicDescription}>
                      {path.description}
                    </Text>
                    <div className={styles.topicProgress}>
                      <div
                        className={styles.topicProgressBar}
                        style={{ width: `${path.percentComplete}%` }}
                      />
                    </div>
                    <div className={styles.topicMeta}>
                      <span
                        className={styles.difficultyBadge}
                        style={{ color: getDifficultyColor(path.difficulty) }}
                      >
                        {path.difficulty}
                      </span>
                      {path.tags && path.tags.length > 0 && (
                        <div className={styles.topicTags}>
                          {path.tags.slice(0, 2).map((tag) => (
                            <span key={tag} className={styles.tag}>{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    {enrolled && !isLocked && (
                      <div className={styles.topicProgress}>
                        <Text variant="caption" color="gold">
                          {path.percentComplete}% complete
                        </Text>
                      </div>
                    )}
                    {isLocked && prereqs.missing.length > 0 && (
                      <Text variant="caption" color="muted" className={styles.prereqText}>
                        Requires: {prereqs.missing[0]}
                      </Text>
                    )}
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Empty State - No paths available for this language */}
      {!hasPathsData && !isLoading && (
        <Card variant="glass" className={styles.emptyState}>
          <IoSparkles style={{ fontSize: '3rem', color: 'var(--accent-gold)', marginBottom: '1rem' }} />
          <Text variant="h3" color="muted">No Learning Paths Yet</Text>
          <Text variant="body" color="muted" style={{ marginTop: '0.5rem', maxWidth: '400px', textAlign: 'center' }}>
            Learning paths for this language are coming soon. Generate curriculum in the admin panel to create structured learning paths.
          </Text>
        </Card>
      )}

      {/* Empty State - No matches */}
      {hasPathsData && filteredPaths.length === 0 && (
        <Card variant="glass" className={styles.emptyState}>
          <Text variant="h3" color="muted">No paths match your filters</Text>
          <Button variant="ghost" onClick={() => {
            setTypeFilter('all');
            setDifficultyFilter('all');
          }}>
            Clear Filters
          </Button>
        </Card>
      )}

      {/* Back to Dashboard */}
      <div className={styles.backLink}>
        <Button variant="ghost" onClick={() => window.history.back()}>
          Back to Dashboard
        </Button>
      </div>
    </Container>
  );
}
