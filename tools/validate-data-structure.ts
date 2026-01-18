#!/usr/bin/env node

/**
 * Validate Data Structure
 *
 * Validates JSON data files match expected schemas:
 * - Required fields (id, word/kanji, meaning)
 * - Level values match framework (JLPT/CEFR/HSK/TOPIK)
 * - No duplicate IDs
 * - Audio URLs if specified
 *
 * Usage:
 *   npx tsx tools/validate-data-structure.ts
 *   npx tsx tools/validate-data-structure.ts --json
 *   npx tsx tools/validate-data-structure.ts --fix (show suggested fixes)
 */

import * as fs from 'fs';
import * as path from 'path';
import { globSync } from 'glob';

const DATA_DIR = path.join(__dirname, '../src/data');

interface ValidationError {
  file: string;
  itemIndex: number;
  itemId?: string;
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

interface FileValidation {
  file: string;
  itemCount: number;
  errors: ValidationError[];
  warnings: ValidationError[];
}

interface Report {
  filesChecked: number;
  totalItems: number;
  totalErrors: number;
  totalWarnings: number;
  validations: FileValidation[];
}

// Valid level values by framework
const VALID_LEVELS: Record<string, string[]> = {
  JLPT: ['N5', 'N4', 'N3', 'N2', 'N1'],
  CEFR: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
  HSK: ['HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6'],
  TOPIK: ['TOPIK1', 'TOPIK2', 'TOPIK3', 'TOPIK4', 'TOPIK5', 'TOPIK6'],
};

// Get framework for a language code
function getFramework(langCode: string): string {
  const frameworkMap: Record<string, string> = {
    ja: 'JLPT',
    zh: 'HSK',
    ko: 'TOPIK',
    es: 'CEFR',
    de: 'CEFR',
    en: 'CEFR',
    it: 'CEFR',
    fr: 'CEFR',
    pt: 'CEFR',
  };
  return frameworkMap[langCode] || 'CEFR';
}

interface VocabItem {
  id?: string;
  word?: string;
  meaning?: string;
  jlpt?: string;
  level?: string;
  audioUrl?: string;
}

interface KanjiItem {
  id?: string;
  kanji?: string;
  hanzi?: string;
  meaning?: string;
  jlpt?: string;
  hsk?: string;
  level?: string;
  audioUrl?: string;
}

interface GrammarItem {
  id?: string;
  pattern?: string;
  explanation?: string;
  level?: string;
  jlpt?: string;
}

interface ReadingItem {
  id?: string;
  title?: string;
  content?: string;
  level?: string;
}

interface ListeningItem {
  id?: string;
  title?: string;
  text?: string;
  audioUrl?: string;
  level?: string;
}

interface CharacterItem {
  id?: string;
  character?: string;
  romaji?: string;
}

type DataItem = VocabItem | KanjiItem | GrammarItem | ReadingItem | ListeningItem | CharacterItem;

function validateVocabulary(items: VocabItem[], filePath: string, langCode: string): ValidationError[] {
  const errors: ValidationError[] = [];
  const framework = getFramework(langCode);
  const validLevels = VALID_LEVELS[framework] || [];
  const seenIds = new Set<string>();

  items.forEach((item, index) => {
    // Check required fields
    if (!item.id) {
      errors.push({
        file: filePath,
        itemIndex: index,
        field: 'id',
        message: 'Missing required field: id',
        severity: 'error',
      });
    } else {
      if (seenIds.has(item.id)) {
        errors.push({
          file: filePath,
          itemIndex: index,
          itemId: item.id,
          field: 'id',
          message: `Duplicate ID: ${item.id}`,
          severity: 'error',
        });
      }
      seenIds.add(item.id);
    }

    if (!item.word) {
      errors.push({
        file: filePath,
        itemIndex: index,
        itemId: item.id,
        field: 'word',
        message: 'Missing required field: word',
        severity: 'error',
      });
    }

    if (!item.meaning) {
      errors.push({
        file: filePath,
        itemIndex: index,
        itemId: item.id,
        field: 'meaning',
        message: 'Missing required field: meaning',
        severity: 'warning',
      });
    }

    // Check level validity
    const level = item.jlpt || item.level;
    if (level && !validLevels.includes(level)) {
      errors.push({
        file: filePath,
        itemIndex: index,
        itemId: item.id,
        field: 'level',
        message: `Invalid level "${level}" for ${framework}. Valid values: ${validLevels.join(', ')}`,
        severity: 'warning',
      });
    }

    // Check audio URL format
    if (item.audioUrl && !item.audioUrl.startsWith('/audio/')) {
      errors.push({
        file: filePath,
        itemIndex: index,
        itemId: item.id,
        field: 'audioUrl',
        message: `Audio URL should start with /audio/: ${item.audioUrl}`,
        severity: 'warning',
      });
    }
  });

  return errors;
}

function validateKanji(items: KanjiItem[], filePath: string, langCode: string): ValidationError[] {
  const errors: ValidationError[] = [];
  const framework = getFramework(langCode);
  const validLevels = VALID_LEVELS[framework] || [];
  const seenIds = new Set<string>();

  items.forEach((item, index) => {
    if (!item.id) {
      errors.push({
        file: filePath,
        itemIndex: index,
        field: 'id',
        message: 'Missing required field: id',
        severity: 'error',
      });
    } else {
      if (seenIds.has(item.id)) {
        errors.push({
          file: filePath,
          itemIndex: index,
          itemId: item.id,
          field: 'id',
          message: `Duplicate ID: ${item.id}`,
          severity: 'error',
        });
      }
      seenIds.add(item.id);
    }

    const character = item.kanji || item.hanzi;
    if (!character) {
      errors.push({
        file: filePath,
        itemIndex: index,
        itemId: item.id,
        field: 'kanji/hanzi',
        message: 'Missing required field: kanji or hanzi',
        severity: 'error',
      });
    }

    if (!item.meaning) {
      errors.push({
        file: filePath,
        itemIndex: index,
        itemId: item.id,
        field: 'meaning',
        message: 'Missing required field: meaning',
        severity: 'warning',
      });
    }

    const level = item.jlpt || item.hsk || item.level;
    if (level && !validLevels.includes(level)) {
      errors.push({
        file: filePath,
        itemIndex: index,
        itemId: item.id,
        field: 'level',
        message: `Invalid level "${level}" for ${framework}`,
        severity: 'warning',
      });
    }
  });

  return errors;
}

function validateGrammar(items: GrammarItem[], filePath: string, langCode: string): ValidationError[] {
  const errors: ValidationError[] = [];
  const framework = getFramework(langCode);
  const validLevels = VALID_LEVELS[framework] || [];
  const seenIds = new Set<string>();

  items.forEach((item, index) => {
    if (!item.id) {
      errors.push({
        file: filePath,
        itemIndex: index,
        field: 'id',
        message: 'Missing required field: id',
        severity: 'error',
      });
    } else {
      if (seenIds.has(item.id)) {
        errors.push({
          file: filePath,
          itemIndex: index,
          itemId: item.id,
          field: 'id',
          message: `Duplicate ID: ${item.id}`,
          severity: 'error',
        });
      }
      seenIds.add(item.id);
    }

    if (!item.pattern) {
      errors.push({
        file: filePath,
        itemIndex: index,
        itemId: item.id,
        field: 'pattern',
        message: 'Missing required field: pattern',
        severity: 'error',
      });
    }

    if (!item.explanation) {
      errors.push({
        file: filePath,
        itemIndex: index,
        itemId: item.id,
        field: 'explanation',
        message: 'Missing required field: explanation',
        severity: 'warning',
      });
    }

    const level = item.jlpt || item.level;
    if (level && !validLevels.includes(level)) {
      errors.push({
        file: filePath,
        itemIndex: index,
        itemId: item.id,
        field: 'level',
        message: `Invalid level "${level}" for ${framework}`,
        severity: 'warning',
      });
    }
  });

  return errors;
}

function validateReading(items: ReadingItem[], filePath: string): ValidationError[] {
  const errors: ValidationError[] = [];
  const seenIds = new Set<string>();

  items.forEach((item, index) => {
    if (!item.id) {
      errors.push({
        file: filePath,
        itemIndex: index,
        field: 'id',
        message: 'Missing required field: id',
        severity: 'error',
      });
    } else {
      if (seenIds.has(item.id)) {
        errors.push({
          file: filePath,
          itemIndex: index,
          itemId: item.id,
          field: 'id',
          message: `Duplicate ID: ${item.id}`,
          severity: 'error',
        });
      }
      seenIds.add(item.id);
    }

    if (!item.title) {
      errors.push({
        file: filePath,
        itemIndex: index,
        itemId: item.id,
        field: 'title',
        message: 'Missing required field: title',
        severity: 'error',
      });
    }

    if (!item.content) {
      errors.push({
        file: filePath,
        itemIndex: index,
        itemId: item.id,
        field: 'content',
        message: 'Missing required field: content',
        severity: 'error',
      });
    }
  });

  return errors;
}

function validateListening(items: ListeningItem[], filePath: string): ValidationError[] {
  const errors: ValidationError[] = [];
  const seenIds = new Set<string>();

  items.forEach((item, index) => {
    if (!item.id) {
      errors.push({
        file: filePath,
        itemIndex: index,
        field: 'id',
        message: 'Missing required field: id',
        severity: 'error',
      });
    } else {
      if (seenIds.has(item.id)) {
        errors.push({
          file: filePath,
          itemIndex: index,
          itemId: item.id,
          field: 'id',
          message: `Duplicate ID: ${item.id}`,
          severity: 'error',
        });
      }
      seenIds.add(item.id);
    }

    if (!item.text && !item.audioUrl) {
      errors.push({
        file: filePath,
        itemIndex: index,
        itemId: item.id,
        field: 'text/audioUrl',
        message: 'Listening item should have text or audioUrl',
        severity: 'warning',
      });
    }
  });

  return errors;
}

function validateCharacters(items: CharacterItem[], filePath: string): ValidationError[] {
  const errors: ValidationError[] = [];
  const seenIds = new Set<string>();

  items.forEach((item, index) => {
    if (!item.id) {
      errors.push({
        file: filePath,
        itemIndex: index,
        field: 'id',
        message: 'Missing required field: id',
        severity: 'error',
      });
    } else {
      if (seenIds.has(item.id)) {
        errors.push({
          file: filePath,
          itemIndex: index,
          itemId: item.id,
          field: 'id',
          message: `Duplicate ID: ${item.id}`,
          severity: 'error',
        });
      }
      seenIds.add(item.id);
    }

    if (!item.character) {
      errors.push({
        file: filePath,
        itemIndex: index,
        itemId: item.id,
        field: 'character',
        message: 'Missing required field: character',
        severity: 'error',
      });
    }
  });

  return errors;
}

function validateFile(filePath: string): FileValidation | null {
  const relativePath = path.relative(DATA_DIR, filePath);
  const parts = relativePath.split(path.sep);

  if (parts.length < 2) return null;

  const langCode = parts[0];
  const fileName = parts[parts.length - 1];

  if (!fs.existsSync(filePath)) return null;

  let content: DataItem[];
  try {
    content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (!Array.isArray(content)) return null;
  } catch {
    return {
      file: relativePath,
      itemCount: 0,
      errors: [{
        file: relativePath,
        itemIndex: -1,
        field: 'file',
        message: 'Invalid JSON file',
        severity: 'error',
      }],
      warnings: [],
    };
  }

  let errors: ValidationError[] = [];

  if (fileName === 'vocabulary.json') {
    errors = validateVocabulary(content as VocabItem[], relativePath, langCode);
  } else if (fileName === 'kanji.json' || fileName === 'hanzi.json') {
    errors = validateKanji(content as KanjiItem[], relativePath, langCode);
  } else if (fileName === 'grammar.json') {
    errors = validateGrammar(content as GrammarItem[], relativePath, langCode);
  } else if (fileName === 'readings.json') {
    errors = validateReading(content as ReadingItem[], relativePath);
  } else if (fileName === 'listening.json') {
    errors = validateListening(content as ListeningItem[], relativePath);
  } else if (fileName === 'characters.json') {
    errors = validateCharacters(content as CharacterItem[], relativePath);
  } else {
    return null; // Skip unknown file types
  }

  return {
    file: relativePath,
    itemCount: content.length,
    errors: errors.filter(e => e.severity === 'error'),
    warnings: errors.filter(e => e.severity === 'warning'),
  };
}

function generateReport(): Report {
  const files = globSync('**/*.json', {
    cwd: DATA_DIR,
    ignore: ['**/language-configs.json', '**/learning-paths.json', '**/*-additions.json', '**/*-expansion.json'],
  });

  const validations: FileValidation[] = [];
  let totalItems = 0;
  let totalErrors = 0;
  let totalWarnings = 0;

  for (const file of files) {
    const filePath = path.join(DATA_DIR, file);
    const validation = validateFile(filePath);

    if (validation) {
      validations.push(validation);
      totalItems += validation.itemCount;
      totalErrors += validation.errors.length;
      totalWarnings += validation.warnings.length;
    }
  }

  return {
    filesChecked: validations.length,
    totalItems,
    totalErrors,
    totalWarnings,
    validations,
  };
}

function printHumanReadable(report: Report, showFixes: boolean): void {
  console.log('\n=== Data Structure Validation Report ===\n');
  console.log(`Files checked: ${report.filesChecked}`);
  console.log(`Total items: ${report.totalItems}`);
  console.log(`Errors: ${report.totalErrors}`);
  console.log(`Warnings: ${report.totalWarnings}\n`);

  if (report.totalErrors === 0 && report.totalWarnings === 0) {
    console.log('All data files are valid.\n');
    return;
  }

  // Group by file
  for (const validation of report.validations) {
    if (validation.errors.length === 0 && validation.warnings.length === 0) {
      continue;
    }

    console.log(`\n${validation.file} (${validation.itemCount} items)`);
    console.log('-'.repeat(validation.file.length + 20));

    for (const error of validation.errors) {
      const location = error.itemId ? `[${error.itemId}]` : `[index ${error.itemIndex}]`;
      console.log(`  ERROR ${location}: ${error.message}`);
    }

    for (const warning of validation.warnings) {
      const location = warning.itemId ? `[${warning.itemId}]` : `[index ${warning.itemIndex}]`;
      console.log(`  WARN  ${location}: ${warning.message}`);
    }
  }

  if (showFixes) {
    console.log('\n\n--- Suggested Fixes ---\n');
    console.log('For missing IDs: Add unique IDs in format "type-N" (e.g., "vocab-1", "kanji-1")');
    console.log('For duplicate IDs: Rename duplicates to be unique');
    console.log('For invalid levels: Use correct framework levels (JLPT N5-N1, CEFR A1-C2, etc.)');
  }

  console.log('');
}

function main(): void {
  const args = process.argv.slice(2);
  const jsonOutput = args.includes('--json');
  const showFixes = args.includes('--fix');

  const report = generateReport();

  if (jsonOutput) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  printHumanReadable(report, showFixes);

  // Exit with error if there are errors
  if (report.totalErrors > 0) {
    process.exit(1);
  }
}

main();
