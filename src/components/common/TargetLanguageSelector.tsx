'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Text } from '@/components/ui';
import { useLanguage } from '@/context/LanguageProvider';
import { useTargetLanguage } from '@/hooks/useTargetLanguage';
import { getLanguageConfig, LanguageCode } from '@/lib/language';
import { IoGlobe, IoChevronDown, IoCheckmark } from 'react-icons/io5';
import styles from './TargetLanguageSelector.module.css';

interface TargetLanguageSelectorProps {
  className?: string;
}

export default function TargetLanguageSelector({ className }: TargetLanguageSelectorProps) {
  const { t } = useLanguage();
  const {
    targetLanguage,
    languageConfig,
    setTargetLanguage,
    availableLanguages,
  } = useTargetLanguage();

  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const currentConfig = languageConfig;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Focus the appropriate option when focusedIndex changes
  useEffect(() => {
    if (isOpen && focusedIndex >= 0 && optionRefs.current[focusedIndex]) {
      optionRefs.current[focusedIndex]?.focus();
    }
  }, [focusedIndex, isOpen]);

  const handleSelect = useCallback((langCode: LanguageCode) => {
    setTargetLanguage(langCode);
    setIsOpen(false);
    setFocusedIndex(-1);
  }, [setTargetLanguage]);

  // Keyboard navigation handler
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (!isOpen) {
      // Open dropdown on Enter, Space, ArrowDown, or ArrowUp
      if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(event.key)) {
        event.preventDefault();
        setIsOpen(true);
        setFocusedIndex(0);
      }
      return;
    }

    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        setIsOpen(false);
        setFocusedIndex(-1);
        break;
      case 'ArrowDown':
        event.preventDefault();
        setFocusedIndex(prev =>
          prev < availableLanguages.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        setFocusedIndex(prev =>
          prev > 0 ? prev - 1 : availableLanguages.length - 1
        );
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < availableLanguages.length) {
          handleSelect(availableLanguages[focusedIndex]);
        }
        break;
      case 'Tab':
        // Close on tab out
        setIsOpen(false);
        setFocusedIndex(-1);
        break;
      case 'Home':
        event.preventDefault();
        setFocusedIndex(0);
        break;
      case 'End':
        event.preventDefault();
        setFocusedIndex(availableLanguages.length - 1);
        break;
    }
  }, [isOpen, focusedIndex, availableLanguages, handleSelect]);

  return (
    <div
      className={`${styles.selector} ${className || ''}`}
      ref={dropdownRef}
      onKeyDown={handleKeyDown}
    >
      <button
        className={styles.trigger}
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) setFocusedIndex(0);
        }}
        aria-label={t('dashboard.targetLanguage.selectLabel')}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <IoGlobe className={styles.icon} aria-hidden="true" />
        <span className={styles.languageName}>
          {currentConfig?.nativeName || currentConfig?.name || targetLanguage.toUpperCase()}
        </span>
        <IoChevronDown className={`${styles.chevron} ${isOpen ? styles.open : ''}`} aria-hidden="true" />
      </button>

      {isOpen && (
        <div
          className={styles.dropdown}
          role="listbox"
          aria-label={t('dashboard.targetLanguage.selectLabel')}
          aria-activedescendant={focusedIndex >= 0 ? `target-lang-option-${availableLanguages[focusedIndex]}` : undefined}
        >
          <Text variant="label" color="muted" className={styles.dropdownTitle}>
            {t('dashboard.targetLanguage.title')}
          </Text>
          <div className={styles.options}>
            {availableLanguages.map((langCode, index) => {
              const config = getLanguageConfig(langCode);
              if (!config) return null;

              const isSelected = langCode === targetLanguage;

              return (
                <button
                  key={langCode}
                  id={`target-lang-option-${langCode}`}
                  ref={el => { optionRefs.current[index] = el; }}
                  className={`${styles.option} ${isSelected ? styles.selected : ''}`}
                  onClick={() => handleSelect(langCode)}
                  role="option"
                  aria-selected={isSelected}
                  tabIndex={focusedIndex === index ? 0 : -1}
                >
                  <div className={styles.optionContent}>
                    <span className={styles.optionNative}>{config.nativeName}</span>
                    <span className={styles.optionName}>{config.name}</span>
                  </div>
                  {isSelected && <IoCheckmark className={styles.checkmark} aria-hidden="true" />}
                </button>
              );
            })}
          </div>
          <div className={styles.dropdownFooter}>
            <Text variant="caption" color="muted">
              {t('dashboard.targetLanguage.levelsAvailable', { count: currentConfig?.levels.length || 0 })}
            </Text>
          </div>
        </div>
      )}
    </div>
  );
}
