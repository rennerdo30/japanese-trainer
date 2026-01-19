'use client';

import { useCallback, useState } from 'react';
import { Text, Button } from '@/components/ui';
import { useLanguage } from '@/context/LanguageProvider';
import { IoVolumeHigh, IoStop, IoRefresh, IoCheckmark } from 'react-icons/io5';
import { useTTS } from '@/hooks/useTTS';
import styles from './CharacterLesson.module.css';

interface CharacterLessonProps {
  character: string;          // The character to learn (あ, ㄱ, etc.)
  reading: string;            // Romanization/pronunciation (a, ga, etc.)
  name?: string;              // Character name
  mnemonic?: string;          // Memory aid
  strokeHints?: string[];     // Stroke order hints
  audioUrl?: string;
  onMastered?: () => void;
}

export default function CharacterLesson({
  character,
  reading,
  name,
  mnemonic,
  strokeHints,
  audioUrl,
  onMastered,
}: CharacterLessonProps) {
  const { t } = useLanguage();
  const { speak, stop, isPlaying } = useTTS();
  const [showMnemonic, setShowMnemonic] = useState(false);

  const handleSpeak = useCallback(() => {
    if (isPlaying) {
      stop();
    } else {
      speak(reading, { audioUrl });
    }
  }, [reading, audioUrl, speak, stop, isPlaying]);

  return (
    <div className={styles.card}>
      <div className={styles.characterDisplay}>
        <Text className={styles.character}>{character}</Text>
        <Text variant="h2" className={styles.reading}>{reading}</Text>
        {name && (
          <Text variant="caption" color="muted" className={styles.name}>
            {name}
          </Text>
        )}
      </div>

      <div className={styles.controls}>
        <Button
          variant="ghost"
          size="md"
          onClick={handleSpeak}
          className={styles.audioButton}
          aria-label={isPlaying ? t('common.stop') : t('common.listen')}
        >
          {isPlaying ? <IoStop /> : <IoVolumeHigh />}
          <span>{isPlaying ? t('common.stop') : t('common.listen')}</span>
        </Button>
      </div>

      {strokeHints && strokeHints.length > 0 && (
        <div className={styles.strokeSection}>
          <Text variant="label" color="muted">{t('lessons.character.strokeOrder')}</Text>
          <div className={styles.strokeHints}>
            {strokeHints.map((hint, idx) => (
              <div key={idx} className={styles.strokeHint}>
                <span className={styles.strokeNumber}>{idx + 1}</span>
                <Text variant="caption">{hint}</Text>
              </div>
            ))}
          </div>
        </div>
      )}

      {mnemonic && (
        <div className={styles.mnemonicSection}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowMnemonic(!showMnemonic)}
            className={styles.mnemonicToggle}
          >
            {showMnemonic ? t('common.hide') : t('common.show')} {t('lessons.character.memoryTip')}
          </Button>
          {showMnemonic && (
            <div className={styles.mnemonic}>
              <Text variant="body">{mnemonic}</Text>
            </div>
          )}
        </div>
      )}

      {onMastered && (
        <div className={styles.actions}>
          <Button
            variant="primary"
            onClick={onMastered}
            className={styles.masteredButton}
          >
            <IoCheckmark /> {t('common.iKnowThis')}
          </Button>
        </div>
      )}

      <div className={styles.footer}>
        <Text variant="caption" color="muted">
          {t('common.tapToContinue')}
        </Text>
      </div>
    </div>
  );
}
