'use client';

import { useState, useEffect, useRef } from 'react';
import { Text } from '@/components/ui';
import { useTargetLanguage } from '@/hooks/useTargetLanguage';
import { getLanguageConfig, LanguageCode } from '@/lib/language';
import { IoGlobe, IoChevronDown, IoCheckmark } from 'react-icons/io5';
import styles from './TargetLanguageSelector.module.css';

interface TargetLanguageSelectorProps {
  className?: string;
}

export default function TargetLanguageSelector({ className }: TargetLanguageSelectorProps) {
  const {
    targetLanguage,
    languageConfig,
    setTargetLanguage,
    availableLanguages,
  } = useTargetLanguage();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentConfig = languageConfig;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (langCode: LanguageCode) => {
    setTargetLanguage(langCode);
    setIsOpen(false);
  };

  return (
    <div className={`${styles.selector} ${className || ''}`} ref={dropdownRef}>
      <button
        className={styles.trigger}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <IoGlobe className={styles.icon} />
        <span className={styles.languageName}>
          {currentConfig?.nativeName || currentConfig?.name || targetLanguage.toUpperCase()}
        </span>
        <IoChevronDown className={`${styles.chevron} ${isOpen ? styles.open : ''}`} />
      </button>

      {isOpen && (
        <div className={styles.dropdown} role="listbox">
          <Text variant="label" color="muted" className={styles.dropdownTitle}>
            Learning Target
          </Text>
          <div className={styles.options}>
            {availableLanguages.map((langCode) => {
              const config = getLanguageConfig(langCode);
              if (!config) return null;

              const isSelected = langCode === targetLanguage;

              return (
                <button
                  key={langCode}
                  className={`${styles.option} ${isSelected ? styles.selected : ''}`}
                  onClick={() => handleSelect(langCode)}
                  role="option"
                  aria-selected={isSelected}
                >
                  <div className={styles.optionContent}>
                    <span className={styles.optionNative}>{config.nativeName}</span>
                    <span className={styles.optionName}>{config.name}</span>
                  </div>
                  {isSelected && <IoCheckmark className={styles.checkmark} />}
                </button>
              );
            })}
          </div>
          <div className={styles.dropdownFooter}>
            <Text variant="caption" color="muted">
              {currentConfig?.levels.length || 0} levels available
            </Text>
          </div>
        </div>
      )}
    </div>
  );
}
