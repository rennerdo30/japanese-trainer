'use client';

import { useCallback } from 'react';
import { Text, Button } from '@/components/ui';
import { IoBook, IoLanguage, IoSchool, IoGlobe, IoVolumeHigh, IoStop } from 'react-icons/io5';
import { useTTS } from '@/hooks/useTTS';
import styles from './LessonCard.module.css';

interface LessonCardProps {
  type: 'topic' | 'vocabulary' | 'grammar' | 'cultural';
  title: string;
  content: string;
  audioUrl?: string;
  speakable?: boolean;
}

const TYPE_ICONS = {
  topic: IoBook,
  vocabulary: IoLanguage,
  grammar: IoSchool,
  cultural: IoGlobe,
};

const TYPE_COLORS = {
  topic: 'var(--gold, #FFD700)',
  vocabulary: 'var(--accent-blue, #4A90D9)',
  grammar: 'var(--accent-green, #4ADE80)',
  cultural: 'var(--accent-purple, #A855F7)',
};

export default function LessonCard({
  type,
  title,
  content,
  audioUrl,
  speakable = false,
}: LessonCardProps) {
  const Icon = TYPE_ICONS[type];
  const color = TYPE_COLORS[type];
  const { speak, stop, isPlaying } = useTTS();

  // Check if this card type should be speakable by default
  const shouldShowTTS = speakable || type === 'vocabulary';

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
      </div>

      {shouldShowTTS && (
        <div className={styles.ttsControls}>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSpeak}
            className={styles.ttsButton}
            aria-label={isPlaying ? 'Stop audio' : 'Play audio'}
          >
            {isPlaying ? (
              <>
                <IoStop /> Stop
              </>
            ) : (
              <>
                <IoVolumeHigh /> Listen
              </>
            )}
          </Button>
        </div>
      )}

      <div className={styles.footer}>
        <Text variant="caption" color="muted">
          Tap or swipe to continue
        </Text>
      </div>
    </div>
  );
}
