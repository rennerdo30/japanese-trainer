'use client';

import { useState, useCallback, useEffect } from 'react';
import { IoSearch, IoClose } from 'react-icons/io5';
import styles from './LibrarySearch.module.css';

interface LibrarySearchProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  debounceMs?: number;
  resultCount?: number;
}

export default function LibrarySearch({
  placeholder = 'Search...',
  onSearch,
  debounceMs = 300,
  resultCount,
}: LibrarySearchProps) {
  const [query, setQuery] = useState('');

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
          placeholder={placeholder}
          className={styles.input}
          aria-label={placeholder}
          role="searchbox"
        />
        {query && (
          <button
            onClick={handleClear}
            className={styles.clearButton}
            aria-label="Clear search"
          >
            <IoClose />
          </button>
        )}
      </div>
      {query && resultCount !== undefined && (
        <span className={styles.resultCount}>
          {resultCount} result{resultCount !== 1 ? 's' : ''}
        </span>
      )}
    </div>
  );
}
