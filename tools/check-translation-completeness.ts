#!/usr/bin/env node

/**
 * Check Translation Completeness
 *
 * Enhanced version of check-i18n.ts with:
 * - Percentage completeness per locale
 * - Detection of potentially untranslated keys (same value as English)
 * - JSON output mode for automation
 * - Summary statistics
 *
 * Usage:
 *   npx tsx tools/check-translation-completeness.ts
 *   npx tsx tools/check-translation-completeness.ts --json
 *   npx tsx tools/check-translation-completeness.ts --verbose
 */

import * as fs from 'fs';
import * as path from 'path';

const LOCALES_DIR = path.join(__dirname, '../src/locales');
const REFERENCE_LOCALE = 'en.json';
const SUPPORTED_LOCALES = [
  'en.json',
  'ja.json',
  'de.json',
  'es.json',
  'fr.json',
  'ar.json',
  'hi.json',
  'it.json',
  'ko.json',
  'pt.json',
  'ru.json',
  'zh.json',
];

interface LocaleStats {
  locale: string;
  totalKeys: number;
  presentKeys: number;
  missingKeys: string[];
  potentiallyUntranslated: string[]; // Keys with same value as English
  percentComplete: number;
}

interface Report {
  referenceLocale: string;
  totalReferenceKeys: number;
  locales: LocaleStats[];
  overallPercentComplete: number;
  summary: {
    complete: string[];
    partial: string[];
    needsAttention: string[];
  };
}

function getNestedKeys(obj: Record<string, unknown>, prefix: string = ''): string[] {
  const keys: string[] = [];

  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys.push(...getNestedKeys(value as Record<string, unknown>, fullKey));
    } else {
      keys.push(fullKey);
    }
  }

  return keys;
}

function getValueByPath(obj: Record<string, unknown>, pathStr: string): unknown {
  const keys = pathStr.split('.');
  let value: unknown = obj;

  for (const key of keys) {
    if (value && typeof value === 'object' && key in (value as Record<string, unknown>)) {
      value = (value as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }

  return value;
}

function analyzeLocale(
  reference: Record<string, unknown>,
  locale: Record<string, unknown>,
  referenceKeys: string[],
  localeName: string
): LocaleStats {
  const missingKeys: string[] = [];
  const potentiallyUntranslated: string[] = [];

  for (const key of referenceKeys) {
    const localeValue = getValueByPath(locale, key);
    const referenceValue = getValueByPath(reference, key);

    if (localeValue === undefined) {
      missingKeys.push(key);
    } else if (
      localeName !== 'en.json' &&
      typeof localeValue === 'string' &&
      typeof referenceValue === 'string' &&
      localeValue === referenceValue &&
      // Exclude very short strings that might legitimately be the same
      referenceValue.length > 3
    ) {
      potentiallyUntranslated.push(key);
    }
  }

  const presentKeys = referenceKeys.length - missingKeys.length;
  const percentComplete = Math.round((presentKeys / referenceKeys.length) * 100);

  return {
    locale: localeName.replace('.json', ''),
    totalKeys: referenceKeys.length,
    presentKeys,
    missingKeys,
    potentiallyUntranslated,
    percentComplete,
  };
}

function generateReport(): Report {
  const referencePath = path.join(LOCALES_DIR, REFERENCE_LOCALE);

  if (!fs.existsSync(referencePath)) {
    console.error(`Reference file not found: ${referencePath}`);
    process.exit(1);
  }

  const reference = JSON.parse(fs.readFileSync(referencePath, 'utf8'));
  const referenceKeys = getNestedKeys(reference);
  const localeStats: LocaleStats[] = [];

  for (const localeFile of SUPPORTED_LOCALES) {
    const localePath = path.join(LOCALES_DIR, localeFile);

    if (!fs.existsSync(localePath)) {
      localeStats.push({
        locale: localeFile.replace('.json', ''),
        totalKeys: referenceKeys.length,
        presentKeys: 0,
        missingKeys: ['FILE_MISSING'],
        potentiallyUntranslated: [],
        percentComplete: 0,
      });
      continue;
    }

    try {
      const locale = JSON.parse(fs.readFileSync(localePath, 'utf8'));
      localeStats.push(analyzeLocale(reference, locale, referenceKeys, localeFile));
    } catch {
      localeStats.push({
        locale: localeFile.replace('.json', ''),
        totalKeys: referenceKeys.length,
        presentKeys: 0,
        missingKeys: ['PARSE_ERROR'],
        potentiallyUntranslated: [],
        percentComplete: 0,
      });
    }
  }

  // Calculate overall percentage (excluding reference)
  const nonReference = localeStats.filter(s => s.locale !== 'en');
  const overallPercentComplete = Math.round(
    nonReference.reduce((sum, s) => sum + s.percentComplete, 0) / nonReference.length
  );

  // Categorize locales
  const complete = localeStats.filter(s => s.percentComplete === 100).map(s => s.locale);
  const partial = localeStats.filter(s => s.percentComplete >= 80 && s.percentComplete < 100).map(s => s.locale);
  const needsAttention = localeStats.filter(s => s.percentComplete < 80).map(s => s.locale);

  return {
    referenceLocale: REFERENCE_LOCALE.replace('.json', ''),
    totalReferenceKeys: referenceKeys.length,
    locales: localeStats,
    overallPercentComplete,
    summary: {
      complete,
      partial,
      needsAttention,
    },
  };
}

function printHumanReadable(report: Report, verbose: boolean): void {
  console.log('\n=== Translation Completeness Report ===\n');
  console.log(`Reference locale: ${report.referenceLocale} (${report.totalReferenceKeys} keys)`);
  console.log(`Overall completeness: ${report.overallPercentComplete}%\n`);

  // Table header
  console.log('Locale    Complete    Missing    Untranslated?    Status');
  console.log('-'.repeat(65));

  for (const stats of report.locales) {
    const completeStr = `${stats.percentComplete}%`.padEnd(12);
    const missingStr = stats.missingKeys.length.toString().padEnd(11);
    const untranslatedStr = stats.potentiallyUntranslated.length.toString().padEnd(17);

    let status = '';
    if (stats.percentComplete === 100) status = 'Complete';
    else if (stats.percentComplete >= 80) status = 'Partial';
    else status = 'Needs work';

    console.log(`${stats.locale.padEnd(10)}${completeStr}${missingStr}${untranslatedStr}${status}`);
  }

  console.log('');

  // Summary
  if (report.summary.complete.length > 0) {
    console.log(`Complete (${report.summary.complete.length}): ${report.summary.complete.join(', ')}`);
  }
  if (report.summary.partial.length > 0) {
    console.log(`Partial (${report.summary.partial.length}): ${report.summary.partial.join(', ')}`);
  }
  if (report.summary.needsAttention.length > 0) {
    console.log(`Needs attention (${report.summary.needsAttention.length}): ${report.summary.needsAttention.join(', ')}`);
  }

  if (verbose) {
    console.log('\n--- Detailed Missing Keys ---\n');

    for (const stats of report.locales) {
      if (stats.missingKeys.length > 0 && stats.missingKeys[0] !== 'FILE_MISSING' && stats.missingKeys[0] !== 'PARSE_ERROR') {
        console.log(`\n${stats.locale} (${stats.missingKeys.length} missing):`);
        stats.missingKeys.forEach(key => console.log(`  - ${key}`));
      }
    }

    console.log('\n--- Potentially Untranslated Keys ---\n');
    console.log('(Keys with same value as English - may need translation)\n');

    for (const stats of report.locales) {
      if (stats.potentiallyUntranslated.length > 0) {
        console.log(`\n${stats.locale} (${stats.potentiallyUntranslated.length} potentially untranslated):`);
        stats.potentiallyUntranslated.forEach(key => console.log(`  - ${key}`));
      }
    }
  }

  console.log('');
}

function main(): void {
  const args = process.argv.slice(2);
  const jsonOutput = args.includes('--json');
  const verbose = args.includes('--verbose') || args.includes('-v');

  const report = generateReport();

  if (jsonOutput) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  printHumanReadable(report, verbose);

  // Exit with error if not complete
  if (report.overallPercentComplete < 100) {
    process.exit(1);
  }
}

main();
