'use client';

import { useState, useCallback, useEffect } from 'react';
import { IoSearch, IoClose } from 'react-icons/io5';
import { useLanguage } from '@/context/LanguageProvider';
import styles from './LibrarySearch.module.css';

interface LibrarySearchProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  debounceMs?: number;
  resultCount?: number;
}

export default function LibrarySearch({
  placeholder,
  onSearch,
  debounceMs = 300,
  resultCount,
}: LibrarySearchProps) {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const searchPlaceholder = placeholder ?? t('library.search.placeholder');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(query);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs, onSearch]);

  const handleClear = useCallback(() => {
    setQuery('');
    onSearch('');
  }, [onSearch]);

  return (
    <div className={styles.container}>
      <div className={styles.inputWrapper}>
        <IoSearch className={styles.searchIcon} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchPlaceholder}
          className={styles.input}
          aria-label={searchPlaceholder}
          role="searchbox"
        />
        {query && (
          <button
            onClick={handleClear}
            className={styles.clearButton}
            aria-label={t('library.search.clear')}
          >
            <IoClose />
          </button>
        )}
      </div>
      {query && resultCount !== undefined && (
        <span className={styles.resultCount}>
          {t('library.search.results', { count: resultCount })}
        </span>
      )}
    </div>
  );
}
