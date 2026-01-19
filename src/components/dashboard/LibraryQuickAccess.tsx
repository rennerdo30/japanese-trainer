'use client';

import Link from 'next/link';
import { Text, Card } from '@/components/ui';
import { useLanguage } from '@/context/LanguageProvider';
import {
  IoText,
  IoLanguage,
  IoSchool,
  IoBook,
  IoHeadset,
  IoDocumentText,
} from 'react-icons/io5';
import styles from './LibraryQuickAccess.module.css';

interface ModuleInfo {
  id: string;
  name: string;
  icon: React.ElementType;
  href: string;
  color: string;
  itemCount?: number;
}

interface LibraryQuickAccessProps {
  availableModules: string[];   // e.g., ['alphabet', 'vocabulary', 'grammar']
  moduleCounts?: Record<string, number>;
}

const MODULE_CONFIG: Record<string, Omit<ModuleInfo, 'itemCount'>> = {
  alphabet: {
    id: 'alphabet',
    name: 'Alphabet',
    icon: IoText,
    href: '/alphabet',
    color: 'var(--gold, #FFD700)',
  },
  vocabulary: {
    id: 'vocabulary',
    name: 'Vocabulary',
    icon: IoLanguage,
    href: '/vocabulary',
    color: 'var(--accent-blue, #4A90D9)',
  },
  kanji: {
    id: 'kanji',
    name: 'Kanji',
    icon: IoDocumentText,
    href: '/kanji',
    color: 'var(--accent-red, #EF4444)',
  },
  grammar: {
    id: 'grammar',
    name: 'Grammar',
    icon: IoSchool,
    href: '/grammar',
    color: 'var(--accent-green, #4ADE80)',
  },
  reading: {
    id: 'reading',
    name: 'Reading',
    icon: IoBook,
    href: '/reading',
    color: 'var(--accent-purple, #A855F7)',
  },
  listening: {
    id: 'listening',
    name: 'Listening',
    icon: IoHeadset,
    href: '/listening',
    color: 'var(--accent-orange, #FFA500)',
  },
};

export default function LibraryQuickAccess({
  availableModules,
  moduleCounts,
}: LibraryQuickAccessProps) {
  const { t } = useLanguage();
  const modules = availableModules
    .filter((m) => MODULE_CONFIG[m])
    .map((m) => ({
      ...MODULE_CONFIG[m],
      name: t(`modules.${m}.title`), // Localize module names
      itemCount: moduleCounts?.[m],
    }));

  return (
    <Card variant="glass" className={styles.container}>
      <div className={styles.header}>
        <Text variant="h3" className={styles.headerTitle}>{t('dashboard.library.title')}</Text>
        <Link href="/library" className={styles.viewAll}>
          <Text variant="caption" color="muted">{t('dashboard.library.viewAll')}</Text>
        </Link>
      </div>

      <div className={styles.modules}>
        {modules.map((module) => (
          <Link
            key={module.id}
            href={module.href}
            className={styles.moduleLink}
          >
            <div
              className={styles.moduleCard}
              style={{ '--module-color': module.color } as React.CSSProperties}
            >
              <div className={styles.moduleIcon}>
                <module.icon />
              </div>
              <Text variant="caption" className={styles.moduleName}>
                {module.name}
              </Text>
              {module.itemCount !== undefined && (
                <Text variant="caption" color="muted" className={styles.moduleCount}>
                  {module.itemCount}
                </Text>
              )}
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
}
