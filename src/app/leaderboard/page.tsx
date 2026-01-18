'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import Navigation from '@/components/common/Navigation';
import { Container, Card, Text, Button, Animated } from '@/components/ui';
import { useLanguage } from '@/context/LanguageProvider';
import { useTargetLanguage } from '@/hooks/useTargetLanguage';
import languageConfigs from '@/data/language-configs.json';
import {
  IoTrophy,
  IoFlame,
  IoGlobe,
  IoChevronDown,
  IoEyeOff,
  IoEye,
  IoSparkles,
  IoMedal,
} from 'react-icons/io5';
import styles from './leaderboard.module.css';

type TimePeriod = 'daily' | 'weekly' | 'allTime';

interface LeaderboardEntry {
  rank: number;
  anonymousName: string;
  xp: number;
  streak: number;
  isCurrentUser: boolean;
}

interface XPBreakdown {
  anonymousName: string | null;
  total: number;
  breakdown: {
    studyTime?: number;
    accuracy?: number;
    streaks?: number;
    mastery?: number;
  };
  details: {
    studyMinutes?: number;
    totalCorrect?: number;
    currentStreak?: number;
    bestStreak?: number;
    wordsMastered?: number;
    kanjiMastered?: number;
    pointsMastered?: number;
    textsRead?: number;
    exercisesCompleted?: number;
  };
}

const LANGUAGES = [
  { code: '', name: 'Global' },
  ...languageConfigs.availableLanguages.map(code => ({
    code,
    name: languageConfigs.languages[code as keyof typeof languageConfigs.languages]?.name || code,
  })),
];

const PERIODS: { id: TimePeriod; label: string }[] = [
  { id: 'daily', label: 'Today' },
  { id: 'weekly', label: 'This Week' },
  { id: 'allTime', label: 'All Time' },
];

export default function LeaderboardPage() {
  const { t } = useLanguage();
  const { targetLanguage } = useTargetLanguage();

  const [period, setPeriod] = useState<TimePeriod>('allTime');
  const [languageFilter, setLanguageFilter] = useState<string>('');
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

  // Convex queries and mutations
  const leaderboardData = useQuery(api.leaderboard.getLeaderboard, {
    period,
    language: languageFilter || undefined,
    limit: 50,
  });

  const myXPData = useQuery(api.leaderboard.getMyXPBreakdown);
  const visibility = useQuery(api.leaderboard.getLeaderboardVisibility);
  const setVisibility = useMutation(api.leaderboard.setLeaderboardVisibility);
  const getOrCreateName = useMutation(api.leaderboard.getOrCreateAnonymousName);

  // Ensure user has anonymous name when they visit
  useEffect(() => {
    if (myXPData && !myXPData.anonymousName) {
      getOrCreateName();
    }
  }, [myXPData, getOrCreateName]);

  // Format XP number
  const formatXP = (xp: number) => {
    if (xp >= 1000000) return `${(xp / 1000000).toFixed(1)}M`;
    if (xp >= 1000) return `${(xp / 1000).toFixed(1)}K`;
    return xp.toLocaleString();
  };

  // Get medal for top 3
  const getMedal = (rank: number) => {
    switch (rank) {
      case 1: return <IoMedal className={styles.goldMedal} />;
      case 2: return <IoMedal className={styles.silverMedal} />;
      case 3: return <IoMedal className={styles.bronzeMedal} />;
      default: return null;
    }
  };

  // Get selected language name
  const selectedLanguageName = useMemo(() => {
    if (!languageFilter) return 'Global';
    return LANGUAGES.find(l => l.code === languageFilter)?.name || 'Global';
  }, [languageFilter]);

  const isLoading = leaderboardData === undefined;

  return (
    <Container variant="centered">
      <Navigation />

      <Animated animation="fadeInDown">
        <div className={styles.pageHeader}>
          <IoTrophy className={styles.headerIcon} />
          <Text variant="h1" color="gold" className={styles.pageTitle}>
            Leaderboard
          </Text>
        </div>
        <Text color="muted" align="center" className={styles.pageSubtitle}>
          Compete with learners worldwide
        </Text>
      </Animated>

      {/* Time Period Tabs */}
      <div className={styles.periodTabs}>
        {PERIODS.map(({ id, label }) => (
          <button
            key={id}
            className={`${styles.periodTab} ${period === id ? styles.active : ''}`}
            onClick={() => setPeriod(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Language Filter */}
      <div className={styles.filterRow}>
        <div className={styles.languageDropdownContainer}>
          <button
            className={styles.languageDropdownButton}
            onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
          >
            <IoGlobe />
            <span>{selectedLanguageName}</span>
            <IoChevronDown className={showLanguageDropdown ? styles.rotated : ''} />
          </button>
          {showLanguageDropdown && (
            <div className={styles.languageDropdown}>
              {LANGUAGES.map(({ code, name }) => (
                <button
                  key={code}
                  className={`${styles.languageOption} ${languageFilter === code ? styles.selected : ''}`}
                  onClick={() => {
                    setLanguageFilter(code);
                    setShowLanguageDropdown(false);
                  }}
                >
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Visibility Toggle */}
        {visibility !== undefined && (
          <Button
            variant="ghost"
            onClick={() => setVisibility({ visible: !visibility })}
            className={styles.visibilityButton}
          >
            {visibility ? <IoEye /> : <IoEyeOff />}
            {visibility ? 'Visible' : 'Hidden'}
          </Button>
        )}
      </div>

      {/* My Stats Card */}
      {myXPData && (
        <Card variant="glass" className={styles.myStatsCard}>
          <div className={styles.myStatsHeader}>
            <IoSparkles className={styles.myStatsIcon} />
            <Text variant="h3">Your Stats</Text>
            <Text color="gold" className={styles.anonymousName}>
              {myXPData.anonymousName || 'Generating...'}
            </Text>
          </div>
          <div className={styles.xpBreakdown}>
            <div className={styles.xpRow}>
              <span className={styles.xpLabel}>Study Time</span>
              <span className={styles.xpValue}>{formatXP(myXPData.breakdown.studyTime ?? 0)} XP</span>
            </div>
            <div className={styles.xpRow}>
              <span className={styles.xpLabel}>Accuracy</span>
              <span className={styles.xpValue}>{formatXP(myXPData.breakdown.accuracy ?? 0)} XP</span>
            </div>
            <div className={styles.xpRow}>
              <span className={styles.xpLabel}>Streaks</span>
              <span className={styles.xpValue}>{formatXP(myXPData.breakdown.streaks ?? 0)} XP</span>
            </div>
            <div className={styles.xpRow}>
              <span className={styles.xpLabel}>Mastery</span>
              <span className={styles.xpValue}>{formatXP(myXPData.breakdown.mastery ?? 0)} XP</span>
            </div>
            <div className={`${styles.xpRow} ${styles.xpTotal}`}>
              <span className={styles.xpLabel}>Total</span>
              <span className={styles.xpTotalValue}>{formatXP(myXPData.total)} XP</span>
            </div>
          </div>
          {leaderboardData?.currentUserRank && (
            <div className={styles.myRank}>
              <Text variant="label" color="muted">Your Rank</Text>
              <Text variant="h2" color="gold">#{leaderboardData.currentUserRank.rank}</Text>
              <Text variant="caption" color="muted">
                of {leaderboardData.totalParticipants} learners
              </Text>
            </div>
          )}
        </Card>
      )}

      {/* Leaderboard List */}
      <Card variant="glass" className={styles.leaderboardCard}>
        {isLoading ? (
          <div className={styles.loading}>
            <Text color="muted">Loading leaderboard...</Text>
          </div>
        ) : leaderboardData?.entries.length === 0 ? (
          <div className={styles.emptyState}>
            <IoTrophy className={styles.emptyIcon} />
            <Text variant="h3" color="muted">No entries yet</Text>
            <Text color="muted">
              {period === 'daily' ? "No one has studied today yet. Be the first!" :
               period === 'weekly' ? "No activity this week yet. Start learning!" :
               "No learners on the leaderboard yet."}
            </Text>
          </div>
        ) : (
          <div className={styles.leaderboardList}>
            {leaderboardData?.entries.map((entry) => (
              <div
                key={`${entry.rank}-${entry.anonymousName}`}
                className={`${styles.leaderboardRow} ${entry.isCurrentUser ? styles.currentUser : ''} ${entry.rank <= 3 ? styles.topThree : ''}`}
              >
                <div className={styles.rankCell}>
                  {getMedal(entry.rank) || <span className={styles.rankNumber}>#{entry.rank}</span>}
                </div>
                <div className={styles.nameCell}>
                  <span className={styles.playerName}>{entry.anonymousName}</span>
                  {entry.isCurrentUser && <span className={styles.youBadge}>You</span>}
                </div>
                <div className={styles.streakCell}>
                  <IoFlame className={styles.streakIcon} />
                  <span>{entry.streak}</span>
                </div>
                <div className={styles.xpCell}>
                  <span className={styles.xpAmount}>{formatXP(entry.xp)}</span>
                  <span className={styles.xpSuffix}>XP</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Current User Outside Top 50 */}
      {leaderboardData?.currentUserRank &&
       !leaderboardData.entries.find(e => e.isCurrentUser) && (
        <Card variant="glass" className={styles.currentUserOutside}>
          <Text variant="caption" color="muted">Your Position</Text>
          <div className={`${styles.leaderboardRow} ${styles.currentUser}`}>
            <div className={styles.rankCell}>
              <span className={styles.rankNumber}>#{leaderboardData.currentUserRank.rank}</span>
            </div>
            <div className={styles.nameCell}>
              <span className={styles.playerName}>{leaderboardData.currentUserRank.anonymousName}</span>
              <span className={styles.youBadge}>You</span>
            </div>
            <div className={styles.streakCell}>
              <IoFlame className={styles.streakIcon} />
              <span>{leaderboardData.currentUserRank.streak}</span>
            </div>
            <div className={styles.xpCell}>
              <span className={styles.xpAmount}>{formatXP(leaderboardData.currentUserRank.xp)}</span>
              <span className={styles.xpSuffix}>XP</span>
            </div>
          </div>
        </Card>
      )}

      {/* Back Button */}
      <Button variant="ghost" onClick={() => window.history.back()} className={styles.backButton}>
        Back to Dashboard
      </Button>
    </Container>
  );
}
