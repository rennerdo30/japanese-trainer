/**
 * TargetLanguageProvider
 * Provides global state for the target language being learned
 * All components consuming useTargetLanguage will re-render when language changes
 */

'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import {
  LanguageCode,
  LanguageConfig,
  LanguageLevel,
  ModuleName,
  getLanguageConfig,
  getDefaultLanguage,
  getAvailableLanguages,
  isModuleAvailable,
  getAvailableModules,
  getLanguageLevels,
  getLanguageDataPath,
  requiresScriptLearning,
  getTTSVoices,
  isLanguageAvailable,
} from '@/lib/language';
import { useSettings } from './SettingsProvider';

const TARGET_LANGUAGE_KEY = 'murmura_target_language';

export interface TargetLanguageContextType {
  // Current state
  targetLanguage: LanguageCode;
  languageConfig: LanguageConfig | null;
  isLoading: boolean;

  // Language switching
  setTargetLanguage: (code: LanguageCode) => void;

  // Configuration helpers
  availableLanguages: LanguageCode[];
  availableModules: ModuleName[];
  levels: LanguageLevel[];
  dataPath: string;

  // Utility functions
  isModuleEnabled: (module: ModuleName) => boolean;
  needsScriptLearning: boolean;
  ttsVoice: string;

  // Data fetching helper
  getDataUrl: (filename: string) => string;
}

const TargetLanguageContext = createContext<TargetLanguageContextType | null>(null);

interface TargetLanguageProviderProps {
  children: ReactNode;
}

export function TargetLanguageProvider({ children }: TargetLanguageProviderProps) {
  const { settings } = useSettings();
  const [targetLanguage, setTargetLanguageState] = useState<LanguageCode>(getDefaultLanguage());
  const [isLoading, setIsLoading] = useState(true);

  // Load saved language from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(TARGET_LANGUAGE_KEY);
      if (saved && isLanguageAvailable(saved)) {
        setTargetLanguageState(saved);
      }
    } catch (error) {
      console.error('Failed to load target language from localStorage:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Apply theme based on target language (for dynamic theme switching)
  // Or override if user has selected a specific global or per-language theme
  useEffect(() => {
    if (typeof document !== 'undefined') {
      let themeToApply: string = targetLanguage;

      // 1. Check for global override
      if (settings.globalTheme && settings.globalTheme !== 'auto') {
        themeToApply = settings.globalTheme;
      }
      // 2. Check for per-language override
      else if (settings.languageThemes && settings.languageThemes[targetLanguage] && settings.languageThemes[targetLanguage] !== 'auto') {
        themeToApply = settings.languageThemes[targetLanguage];
      }

      document.documentElement.setAttribute('data-theme', themeToApply);
    }
  }, [targetLanguage, settings.globalTheme, settings.languageThemes]);

  // Set and persist target language
  const setTargetLanguage = useCallback((code: LanguageCode) => {
    if (!isLanguageAvailable(code)) {
      console.error(`Language ${code} is not available`);
      return;
    }

    setTargetLanguageState(code);
    try {
      localStorage.setItem(TARGET_LANGUAGE_KEY, code);
    } catch (error) {
      console.error('Failed to save target language to localStorage:', error);
    }
  }, []);

  // Memoized configuration
  const languageConfig = useMemo(() => getLanguageConfig(targetLanguage), [targetLanguage]);
  const availableLanguages = useMemo(() => getAvailableLanguages(), []);
  const availableModules = useMemo(() => getAvailableModules(targetLanguage), [targetLanguage]);
  const levels = useMemo(() => getLanguageLevels(targetLanguage), [targetLanguage]);
  const dataPath = useMemo(() => getLanguageDataPath(targetLanguage), [targetLanguage]);
  const needsScriptLearning = useMemo(() => requiresScriptLearning(targetLanguage), [targetLanguage]);
  const ttsVoices = useMemo(() => getTTSVoices(targetLanguage), [targetLanguage]);

  // Check if a specific module is enabled for current language
  const isModuleEnabled = useCallback(
    (module: ModuleName) => isModuleAvailable(targetLanguage, module),
    [targetLanguage]
  );

  // Get the appropriate TTS voice (prefer web speech for simplicity)
  const ttsVoice = useMemo(() => ttsVoices?.webSpeech || 'en-US', [ttsVoices]);

  // Helper to construct data URLs for the current language
  const getDataUrl = useCallback(
    (filename: string) => `${dataPath}/${filename}`,
    [dataPath]
  );

  const contextValue: TargetLanguageContextType = useMemo(() => ({
    targetLanguage,
    languageConfig,
    isLoading,
    setTargetLanguage,
    availableLanguages,
    availableModules,
    levels,
    dataPath,
    isModuleEnabled,
    needsScriptLearning,
    ttsVoice,
    getDataUrl,
  }), [
    targetLanguage,
    languageConfig,
    isLoading,
    setTargetLanguage,
    availableLanguages,
    availableModules,
    levels,
    dataPath,
    isModuleEnabled,
    needsScriptLearning,
    ttsVoice,
    getDataUrl,
  ]);

  return (
    <TargetLanguageContext.Provider value={contextValue}>
      {children}
    </TargetLanguageContext.Provider>
  );
}

/**
 * Hook to access target language context
 * Must be used within TargetLanguageProvider
 */
export function useTargetLanguage(): TargetLanguageContextType {
  const context = useContext(TargetLanguageContext);
  if (!context) {
    throw new Error('useTargetLanguage must be used within TargetLanguageProvider');
  }
  return context;
}

// Re-export the type for backward compatibility
export type UseTargetLanguageReturn = TargetLanguageContextType;
