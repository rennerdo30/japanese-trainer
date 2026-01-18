'use client';

import { useState, useCallback } from 'react';
import { Card, Text, Button } from '@/components/ui';
import { IoInformationCircle, IoChevronDown, IoChevronUp, IoGlobe, IoSparkles } from 'react-icons/io5';
import styles from './CulturalNote.module.css';

interface CulturalNoteProps {
  note: string;
  title?: string;
  expanded?: boolean;
  icon?: 'info' | 'globe' | 'sparkle';
  variant?: 'inline' | 'card';
  onDismiss?: () => void;
}

const ICON_MAP = {
  info: IoInformationCircle,
  globe: IoGlobe,
  sparkle: IoSparkles,
};

export default function CulturalNote({
  note,
  title = 'Cultural Note',
  expanded: initialExpanded = false,
  icon = 'info',
  variant = 'card',
  onDismiss,
}: CulturalNoteProps) {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  const IconComponent = ICON_MAP[icon];

  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  if (variant === 'inline') {
    return (
      <div className={styles.inlineNote}>
        <IconComponent className={styles.inlineIcon} />
        <Text variant="body" color="muted" className={styles.inlineText}>
          {note}
        </Text>
      </div>
    );
  }

  return (
    <Card variant="glass" className={styles.card}>
      <button
        className={styles.header}
        onClick={toggleExpanded}
        aria-expanded={isExpanded}
        aria-controls="cultural-note-content"
      >
        <div className={styles.headerLeft}>
          <div className={styles.iconWrapper}>
            <IconComponent className={styles.icon} />
          </div>
          <Text variant="label" className={styles.title}>
            {title}
          </Text>
        </div>
        <div className={styles.headerRight}>
          {isExpanded ? (
            <IoChevronUp className={styles.chevron} />
          ) : (
            <IoChevronDown className={styles.chevron} />
          )}
        </div>
      </button>

      <div
        id="cultural-note-content"
        className={`${styles.content} ${isExpanded ? styles.expanded : ''}`}
      >
        <div className={styles.contentInner}>
          <Text variant="body" className={styles.noteText}>
            {note}
          </Text>
          {onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className={styles.dismissButton}
            >
              Got it
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

// Multiple cultural notes component
interface CulturalNotesListProps {
  notes: string[];
  title?: string;
}

export function CulturalNotesList({ notes, title = 'Cultural Notes' }: CulturalNotesListProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (notes.length === 0) return null;

  if (notes.length === 1) {
    return <CulturalNote note={notes[0]} title={title} />;
  }

  return (
    <div className={styles.notesList}>
      <Text variant="label" color="gold" className={styles.notesListTitle}>
        {title} ({notes.length})
      </Text>
      <div className={styles.notesGrid}>
        {notes.map((note, index) => (
          <button
            key={index}
            className={`${styles.noteItem} ${expandedIndex === index ? styles.expanded : ''}`}
            onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
          >
            <div className={styles.noteItemHeader}>
              <div className={styles.noteItemNumber}>{index + 1}</div>
              <Text
                variant="body"
                className={styles.noteItemPreview}
              >
                {expandedIndex === index ? note : note.slice(0, 60) + (note.length > 60 ? '...' : '')}
              </Text>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
