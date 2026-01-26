/**
 * LanguageConfigProvider
 *
 * Provides dynamic language configuration fetched from the admin API.
 * This replaces the static language-configs.json import with API-based loading.
 *
 * Features:
 * - Fetches configuration from /api/public/language-configs
 * - Caches in localStorage with TTL
 * - Falls back to embedded config if API is unavailable
 * - Provides loading state for initial fetch
 */

'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';

// Import static config as fallback
import staticConfigs from '@/data/language-configs.json';

// Types matching the frontend expectations
export interface LanguageLevel {
  id: string;
  name: string;
  framework: string;
  order: number;
  description: string;
}

export interface LanguageScript {
  name: string;
  type: string;
  required: boolean;
}

export interface ModuleAvailability {
  alphabet: boolean;
  vocabulary: boolean;
  kanji: boolean;
  grammar: boolean;
  reading: boolean;
  listening: boolean;
}

export interface TTSVoices {
  elevenlabs?: string;
  webSpeech: string;
}

export interface LanguageConfig {
  code: string;
  name: string;
  nativeName: string;
  modules: ModuleAvailability;
  levels: LanguageLevel[];
  scripts: LanguageScript[];
  ttsVoices: TTSVoices;
  dataPath: string;
  display?: {
    icon?: string;
    flagEmoji?: string;
    backgroundDecoration?: string;
    themeColors?: Record<string, string>;
  };
}

export interface LanguageConfigsData {
  languages: Record<string, LanguageConfig>;
  defaultLanguage: string;
  availableLanguages: string[];
}

interface LanguageConfigContextType {
  configs: LanguageConfigsData;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const LanguageConfigContext = createContext<LanguageConfigContextType | null>(null);

// Cache configuration
const CACHE_KEY = 'murmura_language_configs';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Admin API URL - can be configured via environment variable
const API_BASE_URL = process.env.NEXT_PUBLIC_ADMIN_API_URL || '';

interface CachedData {
  data: LanguageConfigsData;
  timestamp: number;
}

function getCachedConfigs(): LanguageConfigsData | null {
  if (typeof window === 'undefined') return null;

  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const { data, timestamp }: CachedData = JSON.parse(cached);
    if (Date.now() - timestamp > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

function setCachedConfigs(data: LanguageConfigsData): void {
  if (typeof window === 'undefined') return;

  try {
    const cached: CachedData = { data, timestamp: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cached));
  } catch {
    // Ignore storage errors
  }
}

async function fetchLanguageConfigs(): Promise<LanguageConfigsData> {
  // If no API URL configured, use static configs
  if (!API_BASE_URL) {
    return staticConfigs as unknown as LanguageConfigsData;
  }

  const response = await fetch(`${API_BASE_URL}/api/public/language-configs`, {
    headers: { Accept: 'application/json' },
    cache: 'no-store', // We handle caching ourselves
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch language configs: ${response.status}`);
  }

  const result = await response.json();

  if (!result.success || !result.data) {
    throw new Error('Invalid response from language configs API');
  }

  return result.data;
}

interface LanguageConfigProviderProps {
  children: ReactNode;
}

export function LanguageConfigProvider({ children }: LanguageConfigProviderProps) {
  const [configs, setConfigs] = useState<LanguageConfigsData>(staticConfigs as unknown as LanguageConfigsData);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadConfigs = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Check cache first
      const cached = getCachedConfigs();
      if (cached) {
        setConfigs(cached);
        setIsLoading(false);
        return;
      }

      // Fetch from API
      const data = await fetchLanguageConfigs();
      setConfigs(data);
      setCachedConfigs(data);
    } catch (err) {
      console.error('Failed to fetch language configs:', err);
      setError(err instanceof Error ? err.message : 'Failed to load language configs');
      // Keep using static configs as fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConfigs();
  }, []);

  const contextValue = useMemo(
    () => ({
      configs,
      isLoading,
      error,
      refetch: loadConfigs,
    }),
    [configs, isLoading, error]
  );

  return (
    <LanguageConfigContext.Provider value={contextValue}>
      {children}
    </LanguageConfigContext.Provider>
  );
}

/**
 * Hook to access language configuration context
 * Must be used within LanguageConfigProvider
 */
export function useLanguageConfigs(): LanguageConfigContextType {
  const context = useContext(LanguageConfigContext);
  if (!context) {
    throw new Error('useLanguageConfigs must be used within LanguageConfigProvider');
  }
  return context;
}

/**
 * Hook to get a specific language's configuration
 */
export function useLanguageConfig(code: string): LanguageConfig | null {
  const { configs } = useLanguageConfigs();
  return configs.languages[code] || null;
}

/**
 * Hook to get list of available language codes
 */
export function useAvailableLanguages(): string[] {
  const { configs } = useLanguageConfigs();
  return configs.availableLanguages;
}

/**
 * Hook to check if a language is available
 */
export function useIsLanguageAvailable(code: string): boolean {
  const { configs } = useLanguageConfigs();
  return configs.availableLanguages.includes(code);
}
