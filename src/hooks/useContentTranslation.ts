/**
 * useContentTranslation Hook
 *
 * Provides helper functions for displaying content in the user's UI language.
 * Used for translating lesson content (explanations, questions, etc.) based on
 * the user's selected UI language.
 *
 * Fallback chain: user's language -> English -> fallback value
 */

import { useCallback } from 'react';
import { useLanguage } from '@/context/LanguageProvider';

/**
 * Hook to get translated content based on user's UI language.
 */
export function useContentTranslation() {
  const { language } = useLanguage();

  /**
   * Get translated text from a translations object.
   * Falls back to English, then to the fallback value.
   *
   * @param translations - Object mapping language codes to translated strings
   * @param fallback - Fallback value if no translation found
   * @returns The translated string or fallback
   */
  const getText = useCallback(
    (
      translations?: Record<string, string> | null,
      fallback?: string
    ): string => {
      if (!translations) return fallback || '';
      return translations[language] || translations.en || fallback || '';
    },
    [language]
  );

  /**
   * Get translated array from a translations object.
   * Falls back to English, then to the fallback array.
   *
   * @param translations - Object mapping language codes to translated arrays
   * @param fallback - Fallback array if no translation found
   * @returns The translated array or fallback
   */
  const getArray = useCallback(
    (
      translations?: Record<string, string[]> | null,
      fallback?: string[]
    ): string[] => {
      if (!translations) return fallback || [];
      return translations[language] || translations.en || fallback || [];
    },
    [language]
  );

  /**
   * Get meaning from a meanings object.
   * Handles both string and string[] formats.
   *
   * @param meanings - Object mapping language codes to meanings (string or string[])
   * @param fallbackMeaning - Fallback meaning string
   * @returns The meaning as a string (joined if array)
   */
  const getMeaning = useCallback(
    (
      meanings?: Record<string, string | string[]> | null,
      fallbackMeaning?: string
    ): string => {
      if (!meanings) return fallbackMeaning || '';

      const meaning = meanings[language] || meanings.en;
      if (!meaning) return fallbackMeaning || '';

      if (Array.isArray(meaning)) {
        return meaning.join(', ');
      }
      return meaning;
    },
    [language]
  );

  /**
   * Get example translation based on UI language.
   * Handles both old format { sentence, translation } and new format with translations object.
   *
   * @param example - Example object from vocabulary/grammar data
   * @returns The translated example text
   */
  const getExampleTranslation = useCallback(
    (example: {
      sentence?: string;
      translation?: string;
      translations?: Record<string, string>;
    }): string => {
      // Try translations object first
      if (example.translations) {
        const translated = example.translations[language] || example.translations.en;
        if (translated) return translated;
      }
      // Fall back to translation field
      return example.translation || '';
    },
    [language]
  );

  /**
   * Get question translation based on UI language.
   *
   * @param question - Question text
   * @param questionTranslations - Object mapping language codes to translated questions
   * @returns The translated question text
   */
  const getQuestion = useCallback(
    (
      question: string,
      questionTranslations?: Record<string, string> | null
    ): string => {
      if (!questionTranslations) return question;
      return questionTranslations[language] || questionTranslations.en || question;
    },
    [language]
  );

  /**
   * Get option translations based on UI language.
   *
   * @param options - Array of option strings
   * @param optionTranslations - Object mapping language codes to translated option arrays
   * @returns The translated options array
   */
  const getOptions = useCallback(
    (
      options: string[],
      optionTranslations?: Record<string, string[]> | null
    ): string[] => {
      if (!optionTranslations) return options;
      return optionTranslations[language] || optionTranslations.en || options;
    },
    [language]
  );

  return {
    language,
    getText,
    getArray,
    getMeaning,
    getExampleTranslation,
    getQuestion,
    getOptions,
  };
}

export default useContentTranslation;
