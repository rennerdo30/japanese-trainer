'use client';

import { useCallback } from 'react';
import { Card, Text, Button, Animated } from '@/components/ui';
import { ReviewItem } from '@/lib/reviewQueue';
import { useTTS } from '@/hooks/useTTS';
import { IoVolumeHigh, IoBook, IoSchool, IoDocumentText } from 'react-icons/io5';
import styles from './ReviewCard.module.css';

interface ReviewCardProps {
  item: ReviewItem;
  showAnswer: boolean;
  onShowAnswer: () => void;
  onRate: (quality: number) => void;
}

const moduleIcons = {
  vocabulary: IoBook,
  kanji: IoSchool,
  grammar: IoDocumentText,
};

const moduleLabels = {
  vocabulary: 'Vocabulary',
  kanji: 'Kanji',
  grammar: 'Grammar',
};

const qualityButtons = [
  { quality: 0, label: 'Again', color: 'danger', description: 'Completely forgot' },
  { quality: 2, label: 'Hard', color: 'warning', description: 'Struggled to remember' },
  { quality: 3, label: 'Good', color: 'primary', description: 'Correct with effort' },
  { quality: 4, label: 'Easy', color: 'success', description: 'Remembered easily' },
  { quality: 5, label: 'Perfect', color: 'success', description: 'Instant recall' },
];

export default function ReviewCard({
  item,
  showAnswer,
  onShowAnswer,
  onRate,
}: ReviewCardProps) {
  const { speak } = useTTS();
  const ModuleIcon = moduleIcons[item.module];

  const handlePlayAudio = useCallback(() => {
    if (item.data?.front) {
      speak(item.data.front, { audioUrl: item.data.audioUrl });
    }
  }, [item, speak]);

  return (
    <Card variant="glass" className={styles.reviewCard}>
      {/* Module badge */}
      <div className={styles.moduleBadge}>
        <ModuleIcon className={styles.moduleIcon} />
        <span>{moduleLabels[item.module]}</span>
      </div>

      {/* Front of card */}
      <Animated animation="fadeInUp" key={item.id + '-front'}>
        <div className={styles.cardFront}>
          <Text variant="h1" className={styles.frontText}>
            {item.data?.front || item.id}
          </Text>

          {item.data?.audioUrl && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePlayAudio}
              className={styles.audioButton}
            >
              <IoVolumeHigh /> Play
            </Button>
          )}
        </div>
      </Animated>

      {/* Back of card / Show Answer */}
      {!showAnswer ? (
        <div className={styles.showAnswerSection}>
          <Button onClick={onShowAnswer} size="lg" fullWidth>
            Show Answer
          </Button>
        </div>
      ) : (
        <Animated animation="fadeInUp" key={item.id + '-back'}>
          <div className={styles.cardBack}>
            <div className={styles.answerSection}>
              <Text variant="h2" color="gold" className={styles.backText}>
                {item.data?.back || 'Unknown'}
              </Text>

              {item.data?.reading && (
                <Text color="muted" className={styles.readingText}>
                  {item.data.reading}
                </Text>
              )}
            </div>

            <div className={styles.ratingSection}>
              <Text variant="label" color="muted" className={styles.ratingLabel}>
                How well did you remember?
              </Text>

              <div className={styles.ratingButtons}>
                {qualityButtons.map((btn) => (
                  <button
                    key={btn.quality}
                    onClick={() => onRate(btn.quality)}
                    className={`${styles.ratingButton} ${styles[btn.color]}`}
                    title={btn.description}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Animated>
      )}

      {/* Mastery indicator */}
      <div className={styles.masteryIndicator}>
        <span className={`${styles.masteryDot} ${styles[item.masteryStatus]}`} />
        <Text variant="label" color="muted">
          {item.masteryStatus.charAt(0).toUpperCase() + item.masteryStatus.slice(1)}
        </Text>
      </div>
    </Card>
  );
}
