'use client'

import styles from './Toggle.module.css';

interface ToggleOption {
    id: string;
    label: string;
}

interface ToggleProps {
    options: [ToggleOption, ToggleOption];
    value: string;
    onChange: (value: string) => void;
    name: string;
    disabled?: boolean;
}

export default function Toggle({ options, value, onChange, name, disabled = false }: ToggleProps) {
    return (
        <div className={`${styles.toggle} ${disabled ? styles.disabled : ''}`}>
            {options.map((option) => (
                <div key={option.id} className={styles.option}>
                    <input
                        type="radio"
                        id={`${name}-${option.id}`}
                        name={name}
                        checked={value === option.id}
                        onChange={() => onChange(option.id)}
                        className={styles.input}
                        disabled={disabled}
                    />
                    <label htmlFor={`${name}-${option.id}`} className={styles.label}>
                        {option.label}
                    </label>
                </div>
            ))}
        </div>
    );
}
