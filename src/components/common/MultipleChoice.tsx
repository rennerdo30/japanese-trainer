'use client'

import { useState } from 'react';
import Button from '@/components/ui/Button';
import styles from './MultipleChoice.module.css';

interface MultipleChoiceProps {
    options: string[];
    onSelect: (selected: string, index: number) => void;
    disabled?: boolean;
    showCorrect?: boolean;
    correctIndex?: number | null;
}

export default function MultipleChoice({ 
    options, 
    onSelect, 
    disabled = false,
    showCorrect = false,
    correctIndex = null 
}: MultipleChoiceProps) {
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

    const handleClick = (index: number) => {
        if (disabled) return;
        setSelectedIndex(index);
        if (onSelect) {
            onSelect(options[index], index);
        }
    };

    return (
        <div className={styles.container}>
            {options.map((option, index) => {
                const isSelected = selectedIndex === index;
                const isCorrectAnswer = showCorrect && correctIndex !== null && correctIndex === index;
                const isIncorrect = showCorrect && isSelected && correctIndex !== null && correctIndex !== index;
                
                let variant: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost' = 'secondary';
                if (isCorrectAnswer) {
                    variant = 'success';
                } else if (isIncorrect) {
                    variant = 'danger';
                }

                const isButtonDisabled = disabled || (showCorrect && !isCorrectAnswer && !isIncorrect);

                return (
                    <Button
                        key={index}
                        variant={variant}
                        size="lg"
                        onClick={() => handleClick(index)}
                        disabled={isButtonDisabled}
                        className={styles.choiceButton}
                    >
                        {option}
                    </Button>
                );
            })}
        </div>
    );
}
