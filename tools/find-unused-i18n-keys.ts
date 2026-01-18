#!/usr/bin/env node

/**
 * Find Unused i18n Keys
 *
 * Identifies keys defined in locale files that are never used in the codebase.
 * These orphaned keys can be safely removed to reduce translation burden.
 *
 * Usage:
 *   npx tsx tools/find-unused-i18n-keys.ts
 *   npx tsx tools/find-unused-i18n-keys.ts --json
 *   npx tsx tools/find-unused-i18n-keys.ts --delete (show deletion commands)
 */

import * as fs from 'fs';
import * as path from 'path';
import { globSync } from 'glob';

const LOCALES_DIR = path.join(__dirname, '../src/locales');
const REFERENCE_LOCALE = 'en.json';
const SOURCE_DIR = path.join(__dirname, '../src');

interface UnusedKeyReport {
  totalDefinedKeys: number;
  totalUsedKeys: number;
  unusedKeys: string[];
  usedKeys: string[];
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

function findUsedKeys(): Set<string> {
  const usedKeys = new Set<string>();

  const sourceFiles = globSync('**/*.{ts,tsx}', {
    cwd: SOURCE_DIR,
    ignore: ['**/*.d.ts', '**/node_modules/**', '**/_generated/**'],
  });

  // Multiple patterns to catch different usage styles
  const patterns = [
    /t\(['"]([^'"]+)['"]\)/g,           // t('key') or t("key")
    /t\(['"]([^'"]+)['"],\s*\{/g,       // t('key', { interpolation })
    /\bt\(['"`]([^'"`]+)['"`]/g,        // More general t() calls
  ];

  for (const file of sourceFiles) {
    const filePath = path.join(SOURCE_DIR, file);
    const content = fs.readFileSync(filePath, 'utf8');

    for (const pattern of patterns) {
      let match;
      // Reset lastIndex for global regex
      pattern.lastIndex = 0;
      while ((match = pattern.exec(content)) !== null) {
        const key = match[1];
        // Validate key format (should contain at least one dot for nested keys)
        if (key && key.includes('.')) {
          usedKeys.add(key);
        }
      }
    }
  }

  return usedKeys;
}

function generateReport(): UnusedKeyReport {
  const referencePath = path.join(LOCALES_DIR, REFERENCE_LOCALE);

  if (!fs.existsSync(referencePath)) {
    console.error(`Reference file not found: ${referencePath}`);
    process.exit(1);
  }

  const reference = JSON.parse(fs.readFileSync(referencePath, 'utf8'));
  const definedKeys = getNestedKeys(reference);
  const usedKeys = findUsedKeys();

  const unusedKeys: string[] = [];
  const usedKeysList: string[] = [];

  for (const key of definedKeys) {
    if (usedKeys.has(key)) {
      usedKeysList.push(key);
    } else {
      unusedKeys.push(key);
    }
  }

  return {
    totalDefinedKeys: definedKeys.length,
    totalUsedKeys: usedKeysList.length,
    unusedKeys: unusedKeys.sort(),
    usedKeys: usedKeysList.sort(),
  };
}

function groupBySection(keys: string[]): Map<string, string[]> {
  const grouped = new Map<string, string[]>();

  for (const key of keys) {
    const section = key.split('.')[0];
    if (!grouped.has(section)) {
      grouped.set(section, []);
    }
    grouped.get(section)!.push(key);
  }

  return grouped;
}

function main(): void {
  const args = process.argv.slice(2);
  const jsonOutput = args.includes('--json');
  const showDelete = args.includes('--delete');

  console.log('\n=== Unused i18n Keys Finder ===\n');
  console.log('Scanning codebase for translation key usage...\n');

  const report = generateReport();

  if (jsonOutput) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  console.log(`Defined keys: ${report.totalDefinedKeys}`);
  console.log(`Used keys: ${report.totalUsedKeys}`);
  console.log(`Unused keys: ${report.unusedKeys.length}\n`);

  if (report.unusedKeys.length === 0) {
    console.log('All defined keys are being used.\n');
    return;
  }

  // Group by section
  const grouped = groupBySection(report.unusedKeys);

  console.log('Unused keys by section:');
  console.log('-'.repeat(40));

  for (const [section, keys] of grouped.entries()) {
    console.log(`\n${section} (${keys.length}):`);
    for (const key of keys) {
      console.log(`  - ${key}`);
    }
  }

  if (showDelete) {
    console.log('\n\n--- Removal Instructions ---\n');
    console.log('To remove these keys, delete them from all locale files:');
    console.log(`  - ${REFERENCE_LOCALE} (and all other locale files)\n`);

    console.log('Keys to remove:');
    for (const key of report.unusedKeys) {
      console.log(`  "${key}"`);
    }
  }

  console.log('\n---');
  console.log('Notes:');
  console.log('  - Some keys may be used dynamically (e.g., t(`module.${type}`))');
  console.log('  - Review each key before removing to avoid breaking the app');
  console.log('  - Keys used in data files (JSON) are not detected by this tool\n');

  // Exit with non-zero if unused keys found
  process.exit(1);
}

main();
