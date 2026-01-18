'use client'

import styles from './LearnModeToggle.module.css';

export type AlphabetMode = 'learn' | 'practice';

interface LearnModeToggleProps {
    mode: AlphabetMode;
    onChange: (mode: AlphabetMode) => void;
    learnLabel: string;
    practiceLabel: string;
}

export default function LearnModeToggle({
    mode,
    onChange,
    learnLabel,
    practiceLabel
}: LearnModeToggleProps) {
    return (
        <div className={styles.toggle} role="tablist" aria-label="Learning mode">
            <button
                role="tab"
                aria-selected={mode === 'learn'}
                className={`${styles.option} ${mode === 'learn' ? styles.active : ''}`}
                onClick={() => onChange('learn')}
            >
                {learnLabel}
            </button>
            <button
                role="tab"
                aria-selected={mode === 'practice'}
                className={`${styles.option} ${mode === 'practice' ? styles.active : ''}`}
                onClick={() => onChange('practice')}
            >
                {practiceLabel}
            </button>
        </div>
    );
}
