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
}

export default function Toggle({ options, value, onChange, name }: ToggleProps) {
    return (
        <div className={styles.toggle}>
            {options.map((option) => (
                <div key={option.id} className={styles.option}>
                    <input
                        type="radio"
                        id={`${name}-${option.id}`}
                        name={name}
                        checked={value === option.id}
                        onChange={() => onChange(option.id)}
                        className={styles.input}
                    />
                    <label htmlFor={`${name}-${option.id}`} className={styles.label}>
                        {option.label}
                    </label>
                </div>
            ))}
        </div>
    );
}
