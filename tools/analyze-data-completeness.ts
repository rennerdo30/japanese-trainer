#!/usr/bin/env node

/**
 * Analyze Data Completeness
 *
 * Reports on learning data coverage per language, showing item counts
 * for each module (vocabulary, grammar, kanji, reading, listening, characters).
 *
 * Usage:
 *   npx tsx tools/analyze-data-completeness.ts
 *   npx tsx tools/analyze-data-completeness.ts --json
 */

import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = path.join(__dirname, '../src/data');
const CONFIG_PATH = path.join(DATA_DIR, 'language-configs.json');

interface ModuleData {
  vocabulary: number | null;
  grammar: number | null;
  kanji: number | null;
  reading: number | null;
  listening: number | null;
  characters: number | null;
}

interface LanguageData {
  code: string;
  name: string;
  framework: string;
  modules: ModuleData;
  totalItems: number;
}

interface Report {
  languages: LanguageData[];
  totals: {
    vocabulary: number;
    grammar: number;
    kanji: number;
    reading: number;
    listening: number;
    characters: number;
    overall: number;
  };
  availableLanguages: number;
}

interface LanguageConfig {
  code: string;
  name: string;
  levels: Array<{ framework: string }>;
  modules: {
    alphabet: boolean;
    vocabulary: boolean;
    kanji: boolean;
    grammar: boolean;
    reading: boolean;
    listening: boolean;
  };
}

interface ConfigFile {
  languages: Record<string, LanguageConfig>;
  availableLanguages: string[];
}

function countJsonArrayItems(filePath: string): number | null {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (Array.isArray(content)) {
      return content.length;
    }
    // For nested structures, try to find the main array
    if (content.items && Array.isArray(content.items)) {
      return content.items.length;
    }
    if (content.exercises && Array.isArray(content.exercises)) {
      return content.exercises.length;
    }
    return null;
  } catch {
    return null;
  }
}

function analyzeLanguage(langCode: string, config: LanguageConfig): LanguageData {
  const langDir = path.join(DATA_DIR, langCode);
  const framework = config.levels?.[0]?.framework || 'Unknown';

  const modules: ModuleData = {
    vocabulary: countJsonArrayItems(path.join(langDir, 'vocabulary.json')),
    grammar: countJsonArrayItems(path.join(langDir, 'grammar.json')),
    kanji: langCode === 'ja'
      ? countJsonArrayItems(path.join(langDir, 'kanji.json'))
      : langCode === 'zh'
        ? countJsonArrayItems(path.join(langDir, 'hanzi.json'))
        : null,
    reading: countJsonArrayItems(path.join(langDir, 'readings.json')),
    listening: countJsonArrayItems(path.join(langDir, 'listening.json')),
    characters: countJsonArrayItems(path.join(langDir, 'characters.json')),
  };

  // Count total items
  const totalItems = Object.values(modules).reduce((sum, val) => sum + (val || 0), 0);

  return {
    code: langCode,
    name: config.name,
    framework,
    modules,
    totalItems,
  };
}

function generateReport(): Report {
  if (!fs.existsSync(CONFIG_PATH)) {
    console.error(`Config file not found: ${CONFIG_PATH}`);
    process.exit(1);
  }

  const config: ConfigFile = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  const languages: LanguageData[] = [];

  for (const langCode of config.availableLanguages) {
    const langConfig = config.languages[langCode];
    if (langConfig) {
      languages.push(analyzeLanguage(langCode, langConfig));
    }
  }

  // Sort by total items (most content first)
  languages.sort((a, b) => b.totalItems - a.totalItems);

  // Calculate totals
  const totals = {
    vocabulary: languages.reduce((sum, l) => sum + (l.modules.vocabulary || 0), 0),
    grammar: languages.reduce((sum, l) => sum + (l.modules.grammar || 0), 0),
    kanji: languages.reduce((sum, l) => sum + (l.modules.kanji || 0), 0),
    reading: languages.reduce((sum, l) => sum + (l.modules.reading || 0), 0),
    listening: languages.reduce((sum, l) => sum + (l.modules.listening || 0), 0),
    characters: languages.reduce((sum, l) => sum + (l.modules.characters || 0), 0),
    overall: languages.reduce((sum, l) => sum + l.totalItems, 0),
  };

  return {
    languages,
    totals,
    availableLanguages: languages.length,
  };
}

function formatCell(value: number | null, width: number): string {
  if (value === null) {
    return '-'.padStart(width);
  }
  return value.toString().padStart(width);
}

function printHumanReadable(report: Report): void {
  console.log('\n=== Learning Data Completeness Report ===\n');

  // Table header
  const headers = ['Language', 'Framework', 'Vocab', 'Grammar', 'Kanji', 'Reading', 'Listen', 'Chars', 'Total'];
  const widths = [12, 10, 8, 8, 8, 8, 8, 8, 8];

  console.log(headers.map((h, i) => h.padEnd(widths[i])).join('  '));
  console.log('-'.repeat(headers.reduce((sum, _, i) => sum + widths[i] + 2, 0)));

  for (const lang of report.languages) {
    const row = [
      `${lang.name}`.padEnd(widths[0]),
      lang.framework.padEnd(widths[1]),
      formatCell(lang.modules.vocabulary, widths[2]),
      formatCell(lang.modules.grammar, widths[3]),
      formatCell(lang.modules.kanji, widths[4]),
      formatCell(lang.modules.reading, widths[5]),
      formatCell(lang.modules.listening, widths[6]),
      formatCell(lang.modules.characters, widths[7]),
      lang.totalItems.toString().padStart(widths[8]),
    ];
    console.log(row.join('  '));
  }

  console.log('-'.repeat(headers.reduce((sum, _, i) => sum + widths[i] + 2, 0)));

  // Totals row
  const totalsRow = [
    'TOTAL'.padEnd(widths[0]),
    ''.padEnd(widths[1]),
    report.totals.vocabulary.toString().padStart(widths[2]),
    report.totals.grammar.toString().padStart(widths[3]),
    report.totals.kanji.toString().padStart(widths[4]),
    report.totals.reading.toString().padStart(widths[5]),
    report.totals.listening.toString().padStart(widths[6]),
    report.totals.characters.toString().padStart(widths[7]),
    report.totals.overall.toString().padStart(widths[8]),
  ];
  console.log(totalsRow.join('  '));

  console.log('\n--- Summary ---\n');
  console.log(`Available languages: ${report.availableLanguages}`);
  console.log(`Total learning items: ${report.totals.overall}`);

  // Find languages missing content
  const missingVocab = report.languages.filter(l => !l.modules.vocabulary).map(l => l.code);
  const missingGrammar = report.languages.filter(l => !l.modules.grammar).map(l => l.code);
  const missingReading = report.languages.filter(l => !l.modules.reading).map(l => l.code);
  const missingListening = report.languages.filter(l => !l.modules.listening).map(l => l.code);

  if (missingVocab.length > 0) {
    console.log(`\nMissing vocabulary: ${missingVocab.join(', ')}`);
  }
  if (missingGrammar.length > 0) {
    console.log(`Missing grammar: ${missingGrammar.join(', ')}`);
  }
  if (missingReading.length > 0) {
    console.log(`Missing reading: ${missingReading.join(', ')}`);
  }
  if (missingListening.length > 0) {
    console.log(`Missing listening: ${missingListening.join(', ')}`);
  }

  console.log('\nNote: "-" indicates no data file exists for that module.\n');
}

function main(): void {
  const args = process.argv.slice(2);
  const jsonOutput = args.includes('--json');

  const report = generateReport();

  if (jsonOutput) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  printHumanReadable(report);
}

main();
