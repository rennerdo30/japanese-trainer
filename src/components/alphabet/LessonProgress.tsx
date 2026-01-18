'use client'

import { IoChevronBack, IoChevronForward } from 'react-icons/io5';
import styles from './LessonProgress.module.css';

interface LessonProgressProps {
    currentIndex: number;
    totalCount: number;
    learnedCount: number;
    onPrevious: () => void;
    onNext: () => void;
    hasPrevious: boolean;
    hasNext: boolean;
    lessonName?: string;
    progressLabel: string;
    learnedLabel: string;
}

export default function LessonProgress({
    currentIndex,
    totalCount,
    learnedCount,
    onPrevious,
    onNext,
    hasPrevious,
    hasNext,
    lessonName,
    progressLabel,
    learnedLabel,
}: LessonProgressProps) {
    const progressPercentage = totalCount > 0 ? (learnedCount / totalCount) * 100 : 0;

    return (
        <div className={styles.container}>
            {lessonName && (
                <div className={styles.lessonName}>{lessonName}</div>
            )}

            <div className={styles.progressBar}>
                <div
                    className={styles.progressFill}
                    style={{ width: `${progressPercentage}%` }}
                    role="progressbar"
                    aria-valuenow={learnedCount}
                    aria-valuemin={0}
                    aria-valuemax={totalCount}
                />
            </div>

            <div className={styles.stats}>
                <span className={styles.progressText}>
                    {progressLabel}: {currentIndex + 1} / {totalCount}
                </span>
                <span className={styles.learnedText}>
                    {learnedLabel}: {learnedCount}
                </span>
            </div>

            <div className={styles.navigation}>
                <button
                    className={styles.navButton}
                    onClick={onPrevious}
                    disabled={!hasPrevious}
                    aria-label="Previous character"
                >
                    <IoChevronBack />
                </button>

                <div className={styles.dots}>
                    {Array.from({ length: Math.min(totalCount, 10) }, (_, i) => {
                        const dotIndex = totalCount <= 10
                            ? i
                            : Math.floor((i / 9) * (totalCount - 1));
                        const isCurrentDot = dotIndex === currentIndex ||
                            (i === 9 && currentIndex >= dotIndex);
                        return (
                            <span
                                key={i}
                                className={`${styles.dot} ${isCurrentDot ? styles.activeDot : ''}`}
                                aria-hidden="true"
                            />
                        );
                    })}
                </div>

                <button
                    className={styles.navButton}
                    onClick={onNext}
                    disabled={!hasNext}
                    aria-label="Next character"
                >
                    <IoChevronForward />
                </button>
            </div>
        </div>
    );
}
