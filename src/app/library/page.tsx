'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Text, Card } from '@/components/ui';
import { useTargetLanguage } from '@/hooks/useTargetLanguage';
import { useLanguage } from '@/context/LanguageProvider';
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
  const { t } = useLanguage();

  const modules = useMemo((): ModuleInfo[] => {
    // Determine which modules are available based on language
    const hasAlphabet = ['ja', 'ko'].includes(targetLanguage);
    const hasKanji = ['ja'].includes(targetLanguage);
    const hasHanzi = ['zh'].includes(targetLanguage);

    // Get language-specific module title key suffix
    const getModuleTitle = (moduleId: string): string => {
      const langKey = `modules.${moduleId}.title_${targetLanguage}`;
      const defaultKey = `modules.${moduleId}.title`;
      const langTitle = t(langKey);
      // If language-specific title exists (not the key itself), use it
      return langTitle !== langKey ? langTitle : t(defaultKey);
    };

    return [
      {
        id: 'alphabet',
        name: hasAlphabet ? getModuleTitle('alphabet') : t('modules.alphabet.title'),
        description: t('modules.alphabet.description'),
        icon: IoText,
        href: '/alphabet',
        color: 'var(--gold, #FFD700)',
        available: hasAlphabet,
      },
      {
        id: 'vocabulary',
        name: t('modules.vocabulary.title'),
        description: t('modules.vocabulary.description'),
        icon: IoLanguage,
        href: '/vocabulary',
        color: 'var(--accent-blue, #4A90D9)',
        available: true,
      },
      {
        id: 'kanji',
        name: getModuleTitle('kanji'),
        description: t('modules.kanji.description'),
        icon: IoDocumentText,
        href: '/kanji',
        color: 'var(--accent-red, #EF4444)',
        available: hasKanji || hasHanzi,
      },
      {
        id: 'grammar',
        name: t('modules.grammar.title'),
        description: t('modules.grammar.description'),
        icon: IoSchool,
        href: '/grammar',
        color: 'var(--accent-green, #4ADE80)',
        available: true,
      },
      {
        id: 'reading',
        name: t('modules.reading.title'),
        description: t('modules.reading.description'),
        icon: IoBook,
        href: '/reading',
        color: 'var(--accent-purple, #A855F7)',
        available: true,
      },
      {
        id: 'listening',
        name: t('modules.listening.title'),
        description: t('modules.listening.description'),
        icon: IoHeadset,
        href: '/listening',
        color: 'var(--accent-orange, #FFA500)',
        available: true,
      },
    ];
  }, [targetLanguage, t]);

  const availableModules = modules.filter((m) => m.available);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Text variant="h1">{t('dashboard.library.title')}</Text>
        <Text variant="body" color="muted">
          {t('library.browseDescription')}
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
          <Text variant="h3">{t('library.filters.level')}</Text>
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
