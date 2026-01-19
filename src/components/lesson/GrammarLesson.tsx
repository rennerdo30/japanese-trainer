'use client';

import { useCallback, useState } from 'react';
import { Text, Button } from '@/components/ui';
import { useLanguage } from '@/context/LanguageProvider';
import { IoVolumeHigh, IoStop, IoInformationCircle, IoCheckmark } from 'react-icons/io5';
import { useTTS } from '@/hooks/useTTS';
import styles from './GrammarLesson.module.css';

interface GrammarLessonProps {
  title: string;              // Grammar point title
  pattern?: string;           // Grammar pattern (e.g., "〜ている", "estar + gerundio")
  explanation: string;        // Explanation of the grammar
  examples: Array<{
    sentence: string;
    translation: string;
    audioUrl?: string;
  }>;
  usageNotes?: string[];
  onMastered?: () => void;
}

export default function GrammarLesson({
  title,
  pattern,
  explanation,
  examples,
  usageNotes,
  onMastered,
}: GrammarLessonProps) {
  const { t } = useLanguage();
  const { speak, stop, isPlaying } = useTTS();
  const [showExplanation, setShowExplanation] = useState(true);
  const [activeExample, setActiveExample] = useState<number | null>(null);

  const handleExampleSpeak = useCallback((index: number) => {
    if (activeExample === index && isPlaying) {
      stop();
      setActiveExample(null);
    } else {
      setActiveExample(index);
      speak(examples[index].sentence, { audioUrl: examples[index].audioUrl });
    }
  }, [examples, activeExample, isPlaying, speak, stop]);

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <Text variant="h2" className={styles.title}>{title}</Text>
        {pattern && (
          <Text className={styles.pattern}>{pattern}</Text>
        )}
      </div>

      <div className={styles.explanationSection}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowExplanation(!showExplanation)}
          className={styles.explanationToggle}
        >
          <IoInformationCircle />
          <span>{showExplanation ? t('lessons.grammar.hideExplanation') : t('lessons.grammar.showExplanation')}</span>
        </Button>

        {showExplanation && (
          <div className={styles.explanation}>
            <Text variant="body">{explanation}</Text>
          </div>
        )}
      </div>

      <div className={styles.examplesSection}>
        <Text variant="label" color="muted">{t('lessons.grammar.examples')}</Text>
        <div className={styles.examples}>
          {examples.map((example, idx) => (
            <div key={idx} className={styles.example}>
              <div className={styles.exampleMain}>
                <Text variant="body" className={styles.exampleSentence}>
                  {example.sentence}
                </Text>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleExampleSpeak(idx)}
                  className={styles.exampleAudio}
                  aria-label={t('common.listen')}
                >
                  {activeExample === idx && isPlaying ? <IoStop /> : <IoVolumeHigh />}
                </Button>
              </div>
              <Text variant="caption" color="muted" className={styles.exampleTranslation}>
                {example.translation}
              </Text>
            </div>
          ))}
        </div>
      </div>

      {usageNotes && usageNotes.length > 0 && (
        <div className={styles.notesSection}>
          <Text variant="label" color="muted">{t('lessons.grammar.usageNotes')}</Text>
          <ul className={styles.notesList}>
            {usageNotes.map((note, idx) => (
              <li key={idx}>
                <Text variant="caption">{note}</Text>
              </li>
            ))}
          </ul>
        </div>
      )}

      {onMastered && (
        <div className={styles.actions}>
          <Button
            variant="primary"
            onClick={onMastered}
            className={styles.masteredButton}
          >
            <IoCheckmark /> {t('lessons.grammar.iUnderstand')}
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
