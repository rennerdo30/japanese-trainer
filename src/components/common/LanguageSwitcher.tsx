'use client'

import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageProvider';
import styles from './LanguageSwitcher.module.css';

export default function LanguageSwitcher() {
    const { language, changeLanguage, supportedLanguages } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const currentLanguage = supportedLanguages.find(l => l.code === language) || supportedLanguages[0];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleLanguageChange = (langCode: string) => {
        changeLanguage(langCode);
        setIsOpen(false);
    };

    return (
        <div className={styles.languageSwitcher} ref={dropdownRef}>
            <button
                className={styles.button}
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Change language"
                aria-expanded={isOpen}
            >
                <span className={styles.flag}>{currentLanguage.flag}</span>
                <span className={styles.code}>{currentLanguage.code.toUpperCase()}</span>
                <span className={styles.arrow} style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }}>▼</span>
            </button>
            {isOpen && (
                <div className={styles.dropdown}>
                    {supportedLanguages.map((lang) => (
                        <button
                            key={lang.code}
                            className={`${styles.option} ${language === lang.code ? styles.active : ''}`}
                            onClick={() => handleLanguageChange(lang.code)}
                        >
                            <span className={styles.flag}>{lang.flag}</span>
                            <span className={styles.optionName}>{lang.name}</span>
                            {language === lang.code && <span className={styles.check}>✓</span>}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
