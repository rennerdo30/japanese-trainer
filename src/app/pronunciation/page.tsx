'use client';

import React, { useState, useEffect, useMemo } from 'react';
import styles from './pronunciation.module.css';
import { Shadowing, MinimalPair, ListenRepeat } from '@/components/exercises';
import type {
  PronunciationDrill,
  ShadowingContent,
  MinimalPairContent,
  ListenRepeatContent,
} from '@/types/pronunciation';

type DrillType = 'shadowing' | 'minimal_pair' | 'listen_repeat' | 'all';
type DifficultyFilter = 'all' | 'easy' | 'medium' | 'hard';

// Sample drills for demonstration
const SAMPLE_DRILLS: PronunciationDrill[] = [
  {
    id: '1',
    type: 'minimal_pair',
    level: 'N5',
    title: 'Long vs Short Vowels',
    description: 'Practice distinguishing long and short vowel sounds',
    content: {
      pairs: [
        {
          word1: 'おばさん',
          word1Meaning: 'aunt',
          word2: 'おばあさん',
          word2Meaning: 'grandmother',
          distinction: 'long vs short vowel (a)',
          explanation: 'The double あ makes the vowel sound longer',
        },
        {
          word1: 'ここ',
          word1Meaning: 'here',
          word2: 'こうこう',
          word2Meaning: 'high school',
          distinction: 'long vs short vowel (o)',
          explanation: 'The う extends the お sound',
        },
      ],
      category: 'long_vowels',
    } as MinimalPairContent,
    difficulty: 'easy',
  },
  {
    id: '2',
    type: 'shadowing',
    level: 'N5',
    title: 'Basic Greetings',
    description: 'Shadow common Japanese greetings',
    content: {
      text: 'おはようございます。今日はいい天気ですね。',
      reading: 'おはようございます。きょうはいいてんきですね。',
      translation: 'Good morning. The weather is nice today, isn\'t it?',
      audioUrl: '',
      segments: [
        { start: 0, end: 2000, text: 'おはようございます', reading: 'おはようございます', translation: 'Good morning' },
        { start: 2000, end: 5000, text: '今日はいい天気ですね', reading: 'きょうはいいてんきですね', translation: 'The weather is nice today' },
      ],
      speed: 'normal',
    } as ShadowingContent,
    difficulty: 'easy',
  },
  {
    id: '3',
    type: 'listen_repeat',
    level: 'N5',
    title: 'Self-Introduction Phrases',
    description: 'Practice common self-introduction phrases',
    content: {
      phrases: [
        { text: '私の名前は田中です', reading: 'わたしのなまえはたなかです', translation: 'My name is Tanaka', audioUrl: '', pauseDuration: 3000 },
        { text: 'よろしくお願いします', reading: 'よろしくおねがいします', translation: 'Nice to meet you', audioUrl: '', pauseDuration: 3000 },
        { text: '日本語を勉強しています', reading: 'にほんごをべんきょうしています', translation: 'I am studying Japanese', audioUrl: '', pauseDuration: 3000 },
      ],
      repeatCount: 2,
    } as ListenRepeatContent,
    difficulty: 'easy',
  },
];

export default function PronunciationPage() {
  const [drills, setDrills] = useState<PronunciationDrill[]>(SAMPLE_DRILLS);
  const [selectedDrill, setSelectedDrill] = useState<PronunciationDrill | null>(null);
  const [typeFilter, setTypeFilter] = useState<DrillType>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>('all');
  const [loading, setLoading] = useState(true);

  // Load drills from data
  useEffect(() => {
    async function loadDrills() {
      try {
        const response = await fetch('/data/ja/pronunciation.json');
        if (response.ok) {
          const data = await response.json();
          if (data.drills && data.drills.length > 0) {
            setDrills(data.drills);
          }
        }
      } catch (err) {
        console.error('Failed to load pronunciation drills:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDrills();
  }, []);

  const filteredDrills = useMemo(() => {
    return drills.filter(drill => {
      if (typeFilter !== 'all' && drill.type !== typeFilter) return false;
      if (difficultyFilter !== 'all' && drill.difficulty !== difficultyFilter) return false;
      return true;
    });
  }, [drills, typeFilter, difficultyFilter]);

  const handleDrillComplete = (score?: number, total?: number) => {
    console.log('Drill complete:', { score, total });
    setSelectedDrill(null);
  };

  if (selectedDrill) {
    return (
      <div className={styles.container}>
        <div className={styles.drillHeader}>
          <button className={styles.backButton} onClick={() => setSelectedDrill(null)}>
            &#8592; Back
          </button>
          <h2>{selectedDrill.title}</h2>
        </div>

        <div className={styles.drillContainer}>
          {selectedDrill.type === 'shadowing' && (
            <Shadowing
              content={selectedDrill.content as ShadowingContent}
              onComplete={handleDrillComplete}
            />
          )}

          {selectedDrill.type === 'minimal_pair' && (
            <MinimalPair
              pairs={(selectedDrill.content as MinimalPairContent).pairs}
              onComplete={handleDrillComplete}
            />
          )}

          {selectedDrill.type === 'listen_repeat' && (
            <ListenRepeat
              phrases={(selectedDrill.content as ListenRepeatContent).phrases}
              repeatCount={(selectedDrill.content as ListenRepeatContent).repeatCount}
              onComplete={handleDrillComplete}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Pronunciation Practice</h1>
        <p>Improve your speaking skills with targeted exercises</p>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label>Type:</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as DrillType)}
          >
            <option value="all">All Types</option>
            <option value="shadowing">Shadowing</option>
            <option value="minimal_pair">Minimal Pairs</option>
            <option value="listen_repeat">Listen & Repeat</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>Difficulty:</label>
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value as DifficultyFilter)}
          >
            <option value="all">All Levels</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      </div>

      {/* Drill Categories */}
      <div className={styles.categories}>
        <div className={styles.categoryCard} onClick={() => setTypeFilter('shadowing')}>
          <span className={styles.categoryIcon}>&#127908;</span>
          <h3>Shadowing</h3>
          <p>Listen and repeat along with native speakers</p>
        </div>
        <div className={styles.categoryCard} onClick={() => setTypeFilter('minimal_pair')}>
          <span className={styles.categoryIcon}>&#128066;</span>
          <h3>Minimal Pairs</h3>
          <p>Train your ear to distinguish similar sounds</p>
        </div>
        <div className={styles.categoryCard} onClick={() => setTypeFilter('listen_repeat')}>
          <span className={styles.categoryIcon}>&#128483;</span>
          <h3>Listen & Repeat</h3>
          <p>Practice phrases with guided repetition</p>
        </div>
      </div>

      {/* Drill List */}
      {loading ? (
        <div className={styles.loading}>Loading drills...</div>
      ) : (
        <div className={styles.drillList}>
          {filteredDrills.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No drills found for the selected filters</p>
            </div>
          ) : (
            filteredDrills.map(drill => (
              <div
                key={drill.id}
                className={styles.drillCard}
                onClick={() => setSelectedDrill(drill)}
              >
                <div className={styles.drillIcon}>
                  {drill.type === 'shadowing' && '🎙️'}
                  {drill.type === 'minimal_pair' && '👂'}
                  {drill.type === 'listen_repeat' && '🗣️'}
                </div>
                <div className={styles.drillInfo}>
                  <h4>{drill.title}</h4>
                  <p>{drill.description}</p>
                  <div className={styles.drillMeta}>
                    <span className={styles.levelBadge}>{drill.level}</span>
                    <span className={`${styles.difficultyBadge} ${styles[drill.difficulty]}`}>
                      {drill.difficulty}
                    </span>
                  </div>
                </div>
                <div className={styles.drillArrow}>&#8594;</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
