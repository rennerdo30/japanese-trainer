'use client'

import { useState, useCallback } from 'react';
import { IoVolumeHigh, IoCheckmarkCircle } from 'react-icons/io5';
import { Button } from '@/components/ui';
import styles from './CharacterLesson.module.css';

export interface LessonCharacter {
    romaji: string;
    character: string;
    type: string;
    group?: string;
    name?: string;
    mnemonic?: string;
    audioUrl?: string;
}

interface CharacterLessonProps {
    character: LessonCharacter;
    languageCode: string;
    onMarkLearned: () => void;
    onPlayAudio: () => Promise<void>;
    isPlaying: boolean;
    isLearned: boolean;
    typeLabel: string;
    groupLabel?: string;
    soundLabel: string;
    markLearnedLabel: string;
    learnedLabel: string;
    mnemonicLabel: string;
}

export default function CharacterLesson({
    character,
    onMarkLearned,
    onPlayAudio,
    isPlaying,
    isLearned,
    typeLabel,
    groupLabel,
    soundLabel,
    markLearnedLabel,
    learnedLabel,
    mnemonicLabel,
}: CharacterLessonProps) {
    const [isAnimating, setIsAnimating] = useState(false);

    const handlePlayAudio = useCallback(async () => {
        if (isPlaying) return;
        setIsAnimating(true);
        await onPlayAudio();
        setIsAnimating(false);
    }, [isPlaying, onPlayAudio]);

    return (
        <div className={styles.lessonCard}>
            <div className={styles.characterSection}>
                <div className={`${styles.characterDisplay} ${isAnimating ? styles.pulse : ''}`}>
                    {character.character}
                </div>
                <div className={styles.soundRow}>
                    <span className={styles.romaji}>{character.romaji}</span>
                    <button
                        className={`${styles.audioButton} ${isPlaying ? styles.playing : ''}`}
                        onClick={handlePlayAudio}
                        disabled={isPlaying}
                        aria-label={soundLabel}
                    >
                        <IoVolumeHigh />
                    </button>
                </div>
            </div>

            <div className={styles.infoSection}>
                {character.name && (
                    <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Name:</span>
                        <span className={styles.infoValue}>{character.name}</span>
                    </div>
                )}
                <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>{typeLabel}:</span>
                    <span className={styles.infoValue}>{character.type}</span>
                </div>
                {groupLabel && character.group && (
                    <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>{groupLabel}:</span>
                        <span className={styles.infoValue}>{character.group}</span>
                    </div>
                )}
            </div>

            {character.mnemonic && (
                <div className={styles.mnemonicSection}>
                    <span className={styles.mnemonicLabel}>{mnemonicLabel}</span>
                    <p className={styles.mnemonicText}>{character.mnemonic}</p>
                </div>
            )}

            <div className={styles.actionSection}>
                {isLearned ? (
                    <div className={styles.learnedBadge}>
                        <IoCheckmarkCircle />
                        <span>{learnedLabel}</span>
                    </div>
                ) : (
                    <Button
                        variant="success"
                        size="md"
                        onClick={onMarkLearned}
                        fullWidth
                    >
                        <IoCheckmarkCircle />
                        {markLearnedLabel}
                    </Button>
                )}
            </div>
        </div>
    );
}
