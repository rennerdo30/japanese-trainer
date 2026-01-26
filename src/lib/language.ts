/**
 * Language Configuration System
 * Provides a language-agnostic abstraction layer for multi-language support
 *
 * This module provides static functions that work with the static config for SSR.
 * For dynamic config in client components, use the LanguageConfigProvider context.
 */

import languageConfigs from '@/data/language-configs.json';

// Type definitions - LanguageCode is now dynamic (string) instead of a fixed union
export type LanguageCode = string;
export type LevelFramework = 'JLPT' | 'CEFR' | 'TOPIK' | 'HSK' | 'custom' | string;
export type ScriptType = 'alphabet' | 'syllabary' | 'logographic' | 'romanization' | string;
export type ModuleName = 'alphabet' | 'vocabulary' | 'kanji' | 'grammar' | 'reading' | 'listening';

export interface LanguageLevel {
  id: string;
  name: string;
  framework: LevelFramework;
  order: number;
  description: string;
}

export interface LanguageScript {
  name: string;
  type: ScriptType;
  required: boolean;
}

export interface TTSVoices {
  elevenlabs?: string;
  webSpeech: string;
}

export interface ModuleAvailability {
  alphabet: boolean;
  vocabulary: boolean;
  kanji: boolean;
  grammar: boolean;
  reading: boolean;
  listening: boolean;
}

export interface LanguageConfig {
  code: LanguageCode;
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
  defaultLanguage: LanguageCode;
  availableLanguages: LanguageCode[];
}

// Static config for SSR and initial render
// For dynamic config, use LanguageConfigProvider context
const configs = languageConfigs as unknown as LanguageConfigsData;

/**
 * Get the configuration for a specific language
 */
export function getLanguageConfig(code: LanguageCode): LanguageConfig | null {
  return configs.languages[code] || null;
}

/**
 * Get all available language configurations
 */
export function getAllLanguageConfigs(): Record<LanguageCode, LanguageConfig> {
  return configs.languages as Record<LanguageCode, LanguageConfig>;
}

/**
 * Get the default language code
 */
export function getDefaultLanguage(): LanguageCode {
  return configs.defaultLanguage;
}

/**
 * Get all available language codes
 */
export function getAvailableLanguages(): LanguageCode[] {
  return configs.availableLanguages;
}

/**
 * Check if a module is available for a language
 */
export function isModuleAvailable(languageCode: LanguageCode, module: ModuleName): boolean {
  const config = getLanguageConfig(languageCode);
  if (!config) return false;
  return config.modules[module];
}

/**
 * Get available modules for a language
 */
export function getAvailableModules(languageCode: LanguageCode): ModuleName[] {
  const config = getLanguageConfig(languageCode);
  if (!config) return [];

  const modules: ModuleName[] = [];
  (Object.entries(config.modules) as [ModuleName, boolean][]).forEach(([module, available]) => {
    if (available) modules.push(module);
  });
  return modules;
}

/**
 * Get proficiency levels for a language
 */
export function getLanguageLevels(languageCode: LanguageCode): LanguageLevel[] {
  const config = getLanguageConfig(languageCode);
  return config?.levels || [];
}

/**
 * Get the first (beginner) level for a language
 */
export function getBeginnerLevel(languageCode: LanguageCode): LanguageLevel | null {
  const levels = getLanguageLevels(languageCode);
  return levels.length > 0 ? levels[0] : null;
}

/**
 * Get the data path for a language
 */
export function getLanguageDataPath(languageCode: LanguageCode): string {
  const config = getLanguageConfig(languageCode);
  return config?.dataPath || `/data/${languageCode}`;
}

/**
 * Get scripts for a language
 */
export function getLanguageScripts(languageCode: LanguageCode): LanguageScript[] {
  const config = getLanguageConfig(languageCode);
  return config?.scripts || [];
}

/**
 * Check if a language requires script learning (e.g., Japanese Hiragana, Korean Hangul)
 */
export function requiresScriptLearning(languageCode: LanguageCode): boolean {
  const scripts = getLanguageScripts(languageCode);
  return scripts.some(script => script.required);
}

/**
 * Get TTS voice configuration for a language
 */
export function getTTSVoices(languageCode: LanguageCode): TTSVoices | null {
  const config = getLanguageConfig(languageCode);
  return config?.ttsVoices || null;
}

/**
 * Get the level framework used by a language (JLPT, CEFR, etc.)
 */
export function getLevelFramework(languageCode: LanguageCode): LevelFramework | null {
  const levels = getLanguageLevels(languageCode);
  return levels.length > 0 ? levels[0].framework : null;
}

/**
 * Find a level by ID within a language
 */
export function findLevelById(languageCode: LanguageCode, levelId: string): LanguageLevel | null {
  const levels = getLanguageLevels(languageCode);
  return levels.find(level => level.id === levelId) || null;
}

/**
 * Get the next level after a given level
 */
export function getNextLevel(languageCode: LanguageCode, currentLevelId: string): LanguageLevel | null {
  const levels = getLanguageLevels(languageCode);
  const currentIndex = levels.findIndex(level => level.id === currentLevelId);
  if (currentIndex === -1 || currentIndex >= levels.length - 1) return null;
  return levels[currentIndex + 1];
}

/**
 * Check if a language is available
 */
export function isLanguageAvailable(code: string): code is LanguageCode {
  return configs.availableLanguages.includes(code as LanguageCode);
}

/**
 * Get language display info (name and native name)
 */
export function getLanguageDisplayInfo(code: LanguageCode): { name: string; nativeName: string } | null {
  const config = getLanguageConfig(code);
  if (!config) return null;
  return { name: config.name, nativeName: config.nativeName };
}

// Default export for convenience
export default {
  getLanguageConfig,
  getAllLanguageConfigs,
  getDefaultLanguage,
  getAvailableLanguages,
  isModuleAvailable,
  getAvailableModules,
  getLanguageLevels,
  getBeginnerLevel,
  getLanguageDataPath,
  getLanguageScripts,
  requiresScriptLearning,
  getTTSVoices,
  getLevelFramework,
  findLevelById,
  getNextLevel,
  isLanguageAvailable,
  getLanguageDisplayInfo,
};
