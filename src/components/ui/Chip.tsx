'use client'

import styles from './Chip.module.css';

interface ChipProps {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    id: string;
}

export default function Chip({ label, checked, onChange, id }: ChipProps) {
    return (
        <div className={styles.chip}>
            <input
                type="checkbox"
                id={id}
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className={styles.input}
            />
            <label htmlFor={id} className={styles.label}>
                {label}
            </label>
        </div>
    );
}
