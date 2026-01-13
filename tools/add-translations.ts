#!/usr/bin/env tsx
/**
 * Script to add multi-language translations to vocabulary, kanji, grammar, and reading data
 * 
 * Usage:
 *   tsx tools/add-translations.ts --type vocabulary
 *   tsx tools/add-translations.ts --type all
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { program } from 'commander';

// Translation mappings for common vocabulary
// This is a simplified version - in production, you'd want to use a translation API
// or have native speakers provide translations

const COMMON_TRANSLATIONS: Record<string, Record<string, string>> = {
  'to eat': {
    en: 'to eat',
    es: 'comer',
    'zh-CN': '吃',
    pt: 'comer',
    fr: 'manger',
    de: 'essen',
    ru: 'есть',
    ja: '食べる',
    ko: '먹다',
    it: 'mangiare',
    ar: 'يأكل',
    hi: 'खाना'
  },
  'to drink': {
    en: 'to drink',
    es: 'beber',
    'zh-CN': '喝',
    pt: 'beber',
    fr: 'boire',
    de: 'trinken',
    ru: 'пить',
    ja: '飲む',
    ko: '마시다',
    it: 'bere',
    ar: 'يشرب',
    hi: 'पीना'
  },
  'to go': {
    en: 'to go',
    es: 'ir',
    'zh-CN': '去',
    pt: 'ir',
    fr: 'aller',
    de: 'gehen',
    ru: 'идти',
    ja: '行く',
    ko: '가다',
    it: 'andare',
    ar: 'يذهب',
    hi: 'जाना'
  },
  'to come': {
    en: 'to come',
    es: 'venir',
    'zh-CN': '来',
    pt: 'vir',
    fr: 'venir',
    de: 'kommen',
    ru: 'приходить',
    ja: '来る',
    ko: '오다',
    it: 'venire',
    ar: 'يأتي',
    hi: 'आना'
  },
  'to see, to watch': {
    en: 'to see, to watch',
    es: 'ver, mirar',
    'zh-CN': '看',
    pt: 'ver, assistir',
    fr: 'voir, regarder',
    de: 'sehen, schauen',
    ru: 'видеть, смотреть',
    ja: '見る',
    ko: '보다',
    it: 'vedere, guardare',
    ar: 'يرى، يشاهد',
    hi: 'देखना'
  }
};

// Fallback translation function - uses a simple mapping
// In production, you'd want to use a proper translation service
function getTranslation(englishText: string): Record<string, string> {
  // Check if we have a direct mapping
  if (COMMON_TRANSLATIONS[englishText]) {
    return COMMON_TRANSLATIONS[englishText];
  }

  // For now, return English as fallback for all languages
  // In production, you'd call a translation API here
  const languages = ['en', 'es', 'zh-CN', 'pt', 'fr', 'de', 'ru', 'ja', 'ko', 'it', 'ar', 'hi'];
  const translations: Record<string, string> = {};
  
  languages.forEach(lang => {
    translations[lang] = englishText; // Fallback to English
  });

  return translations;
}

async function addTranslationsToVocabulary() {
  const filePath = path.join(process.cwd(), 'src/data/vocabulary.json');
  const data = await fs.readJson(filePath);

  let updated = 0;
  for (const item of data) {
    if (!item.meanings && item.meaning) {
      item.meanings = getTranslation(item.meaning);
      updated++;
    }
  }

  await fs.writeJson(filePath, data, { spaces: 2 });
  console.log(`✓ Updated ${updated} vocabulary items with translations`);
}

async function addTranslationsToKanji() {
  const filePath = path.join(process.cwd(), 'src/data/kanji.json');
  const data = await fs.readJson(filePath);

  let updated = 0;
  for (const item of data) {
    if (!item.meanings && item.meaning) {
      item.meanings = getTranslation(item.meaning);
      updated++;
    }

    // Update examples too
    if (item.examples) {
      for (const example of item.examples) {
        if (!example.meanings && example.meaning) {
          example.meanings = getTranslation(example.meaning);
        }
      }
    }
  }

  await fs.writeJson(filePath, data, { spaces: 2 });
  console.log(`✓ Updated ${updated} kanji items with translations`);
}

async function addTranslationsToGrammar() {
  const filePath = path.join(process.cwd(), 'src/data/grammar.json');
  const data = await fs.readJson(filePath);

  let updated = 0;
  for (const item of data) {
    // Add explanation translations
    if (!item.explanations && item.explanation) {
      item.explanations = getTranslation(item.explanation);
      updated++;
    }

    // Add example translations
    if (item.examples) {
      for (const example of item.examples) {
        if (!example.translations && example.english) {
          example.translations = getTranslation(example.english);
        }
      }
    }
  }

  await fs.writeJson(filePath, data, { spaces: 2 });
  console.log(`✓ Updated ${updated} grammar items with translations`);
}

async function addTranslationsToReadings() {
  const filePath = path.join(process.cwd(), 'src/data/readings.json');
  const data = await fs.readJson(filePath);

  let updated = 0;
  for (const item of data) {
    // Add vocabulary translations
    if (item.vocabulary) {
      for (const vocab of item.vocabulary) {
        if (!vocab.meanings && vocab.meaning) {
          vocab.meanings = getTranslation(vocab.meaning);
          updated++;
        }
      }
    }
  }

  await fs.writeJson(filePath, data, { spaces: 2 });
  console.log(`✓ Updated reading items with translations`);
}

async function main() {
  program
    .option('-t, --type <type>', 'Type of data to update (vocabulary, kanji, grammar, reading, all)', 'all')
    .parse();

  const { type } = program.opts();

  console.log('Adding translations to data files...\n');

  try {
    if (type === 'vocabulary' || type === 'all') {
      await addTranslationsToVocabulary();
    }
    if (type === 'kanji' || type === 'all') {
      await addTranslationsToKanji();
    }
    if (type === 'grammar' || type === 'all') {
      await addTranslationsToGrammar();
    }
    if (type === 'reading' || type === 'all') {
      await addTranslationsToReadings();
    }

    console.log('\n✓ Translation update complete!');
    console.log('\nNote: This script uses fallback translations.');
    console.log('For production, consider using a translation API or native speaker review.');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
