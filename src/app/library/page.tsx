'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Text, Card } from '@/components/ui';
import { useTargetLanguage } from '@/hooks/useTargetLanguage';
import {
  IoText,
  IoLanguage,
  IoDocumentText,
  IoSchool,
  IoBook,
  IoHeadset,
  IoChevronForward,
} from 'react-icons/io5';
import styles from './library.module.css';

interface ModuleInfo {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  href: string;
  color: string;
  available: boolean;
}

export default function LibraryPage() {
  const { targetLanguage, levels } = useTargetLanguage();

  const modules = useMemo((): ModuleInfo[] => {
    // Determine which modules are available based on language
    const hasAlphabet = ['ja', 'ko'].includes(targetLanguage);
    const hasKanji = ['ja'].includes(targetLanguage);
    const hasHanzi = ['zh'].includes(targetLanguage);

    return [
      {
        id: 'alphabet',
        name: hasAlphabet ? (targetLanguage === 'ja' ? 'Hiragana & Katakana' : 'Hangul') : 'Alphabet',
        description: 'Learn the writing system',
        icon: IoText,
        href: '/alphabet',
        color: 'var(--gold, #FFD700)',
        available: hasAlphabet,
      },
      {
        id: 'vocabulary',
        name: 'Vocabulary',
        description: 'Essential words and phrases',
        icon: IoLanguage,
        href: '/vocabulary',
        color: 'var(--accent-blue, #4A90D9)',
        available: true,
      },
      {
        id: 'kanji',
        name: hasHanzi ? 'Hanzi' : 'Kanji',
        description: hasHanzi ? 'Chinese characters' : 'Japanese characters',
        icon: IoDocumentText,
        href: '/kanji',
        color: 'var(--accent-red, #EF4444)',
        available: hasKanji || hasHanzi,
      },
      {
        id: 'grammar',
        name: 'Grammar',
        description: 'Sentence patterns and structures',
        icon: IoSchool,
        href: '/grammar',
        color: 'var(--accent-green, #4ADE80)',
        available: true,
      },
      {
        id: 'reading',
        name: 'Reading',
        description: 'Practice reading comprehension',
        icon: IoBook,
        href: '/reading',
        color: 'var(--accent-purple, #A855F7)',
        available: true,
      },
      {
        id: 'listening',
        name: 'Listening',
        description: 'Improve listening skills',
        icon: IoHeadset,
        href: '/listening',
        color: 'var(--accent-orange, #FFA500)',
        available: true,
      },
    ];
  }, [targetLanguage]);

  const availableModules = modules.filter((m) => m.available);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Text variant="h1">Library</Text>
        <Text variant="body" color="muted">
          Browse and review all learning materials
        </Text>
      </header>

      <section className={styles.modulesSection}>
        <div className={styles.modulesGrid}>
          {availableModules.map((module) => (
            <Link key={module.id} href={module.href} className={styles.moduleLink}>
              <Card variant="glass" className={styles.moduleCard}>
                <div
                  className={styles.moduleIcon}
                  style={{
                    backgroundColor: `${module.color}20`,
                    color: module.color,
                  }}
                >
                  <module.icon />
                </div>
                <div className={styles.moduleContent}>
                  <Text variant="h3">{module.name}</Text>
                  <Text variant="caption" color="muted">
                    {module.description}
                  </Text>
                </div>
                <IoChevronForward className={styles.chevron} />
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {levels && levels.length > 0 && (
        <section className={styles.levelsSection}>
          <Text variant="h3">Levels</Text>
          <div className={styles.levelsTags}>
            {levels.map((level) => (
              <span key={String(level)} className={styles.levelTag}>
                {String(level)}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
