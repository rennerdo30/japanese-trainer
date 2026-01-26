'use client';

import { useCallback } from 'react';
import { Text, Button } from '@/components/ui';
import { IoBook, IoLanguage, IoSchool, IoGlobe, IoVolumeHigh, IoStop, IoText } from 'react-icons/io5';
import { useTTS } from '@/hooks/useTTS';
import { useLanguage } from '@/context/LanguageProvider';
import styles from './LessonCard.module.css';

interface LessonCardProps {
  type: 'topic' | 'vocabulary' | 'grammar' | 'cultural' | 'example';
  title: string;
  content: string;
  meaning?: string;
  audioUrl?: string;
  speakable?: boolean;
  usageNote?: string;
  formation?: string;
  reading?: string;
  translation?: string;
}

const TYPE_ICONS = {
  topic: IoBook,
  vocabulary: IoLanguage,
  grammar: IoSchool,
  cultural: IoGlobe,
  example: IoText,
};

const TYPE_COLORS = {
  topic: 'var(--gold, #FFD700)',
  vocabulary: 'var(--accent-blue, #4A90D9)',
  grammar: 'var(--accent-green, #4ADE80)',
  cultural: 'var(--accent-purple, #A855F7)',
  example: 'var(--accent-cyan, #22D3EE)',
};

export default function LessonCard({
  type,
  title,
  content,
  meaning,
  audioUrl,
  speakable = false,
  usageNote,
  formation,
  reading,
  translation,
}: LessonCardProps) {
  const { t } = useLanguage();
  const Icon = TYPE_ICONS[type];
  const color = TYPE_COLORS[type];
  const { speak, stop, isPlaying } = useTTS();

  // Check if this card type should be speakable by default
  const shouldShowTTS = speakable || type === 'vocabulary' || type === 'example';

  const handleSpeak = useCallback(() => {
    if (isPlaying) {
      stop();
    } else {
      speak(content, { audioUrl });
    }
  }, [content, audioUrl, speak, stop, isPlaying]);

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.iconWrapper} style={{ backgroundColor: `${color}20` }}>
          <Icon className={styles.icon} style={{ color }} />
        </div>
        <Text variant="label" color="muted" className={styles.type}>
          {title}
        </Text>
      </div>

      <div className={styles.content}>
        <Text variant="h2" className={styles.mainContent}>
          {content}
        </Text>
        {meaning && (
          <Text variant="body" color="muted" className={styles.meaning}>
            {meaning}
          </Text>
        )}
        {/* Reading (for examples) */}
        {reading && (
          <Text variant="body" color="muted" className={styles.reading}>
            {reading}
          </Text>
        )}
        {/* Translation (for examples) */}
        {translation && (
          <Text variant="body" className={styles.translation}>
            {translation}
          </Text>
        )}
        {/* Formation (for grammar) */}
        {formation && type === 'grammar' && (
          <div className={styles.formation}>
            <Text variant="label" color="muted">{t('lessons.card.formation')}</Text>
            <Text variant="body" className={styles.formationText}>
              {formation}
            </Text>
          </div>
        )}
        {/* Usage Note (for vocab and grammar) */}
        {usageNote && (
          <div className={styles.usageNote}>
            <Text variant="caption" color="muted">
              {usageNote}
            </Text>
          </div>
        )}
      </div>

      {shouldShowTTS && (
        <div className={styles.ttsControls}>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSpeak}
            className={styles.ttsButton}
            aria-label={isPlaying ? t('common.stop') : t('common.listen')}
          >
            {isPlaying ? (
              <>
                <IoStop /> {t('lessons.view.stop')}
              </>
            ) : (
              <>
                <IoVolumeHigh /> {t('common.listen')}
              </>
            )}
          </Button>
        </div>
      )}

      <div className={styles.footer}>
        <Text variant="caption" color="muted">
          {t('lessons.view.tapToContinueHint')}
        </Text>
      </div>
    </div>
  );
}
