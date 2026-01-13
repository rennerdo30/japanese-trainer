#!/usr/bin/env node

/**
 * Find Missing i18n Keys
 * 
 * Scans the codebase for translation key usage and compares
 * against locale files to find keys that are used but not defined.
 */

import * as fs from 'fs';
import * as path from 'path';
import { globSync } from 'glob';

const LOCALES_DIR = path.join(__dirname, '../src/locales');
const REFERENCE_LOCALE = 'en.json';
const SOURCE_DIR = path.join(__dirname, '../src');

interface UsedKey {
  key: string;
  file: string;
  line: number;
}

function getAllKeysFromLocale(localePath: string): Set<string> {
  const content = JSON.parse(fs.readFileSync(localePath, 'utf8'));
  const keys = new Set<string>();
  
  function extractKeys(obj: any, prefix: string = ''): void {
    for (const key in obj) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        extractKeys(obj[key], fullKey);
      } else {
        keys.add(fullKey);
      }
    }
  }
  
  extractKeys(content);
  return keys;
}

function findUsedKeys(): UsedKey[] {
  const usedKeys: UsedKey[] = [];
  const sourceFiles = globSync('**/*.{ts,tsx}', {
    cwd: SOURCE_DIR,
    ignore: ['**/*.d.ts', '**/node_modules/**', '**/_generated/**']
  });
  
  // Pattern to match t('key') or t("key")
  const translationPattern = /t\(['"]([^'"]+)['"]\)/g;
  
  for (const file of sourceFiles) {
    const filePath = path.join(SOURCE_DIR, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      let match;
      while ((match = translationPattern.exec(line)) !== null) {
        const key = match[1];
        // Filter out false positives (single characters, punctuation, etc.)
        if (key.length > 1 && key.includes('.')) {
          usedKeys.push({
            key,
            file: filePath,
            line: index + 1
          });
        }
      }
    });
  }
  
  return usedKeys;
}

function findMissingKeys(): void {
  const referencePath = path.join(LOCALES_DIR, REFERENCE_LOCALE);
  
  if (!fs.existsSync(referencePath)) {
    console.error(`❌ Reference file not found: ${referencePath}`);
    process.exit(1);
  }
  
  const definedKeys = getAllKeysFromLocale(referencePath);
  const usedKeys = findUsedKeys();
  const uniqueUsedKeys = new Set(usedKeys.map(k => k.key));
  
  console.log(`📋 Scanning codebase for translation key usage...\n`);
  console.log(`📊 Found ${usedKeys.length} translation key usage(s) in code\n`);
  
  const missingKeys: UsedKey[] = [];
  
  for (const usedKey of usedKeys) {
    if (!definedKeys.has(usedKey.key)) {
      missingKeys.push(usedKey);
    }
  }
  
  if (missingKeys.length === 0) {
    console.log('✨ All translation keys used in code are defined in locale files!');
    return;
  }
  
  // Group by key
  const missingByKey = new Map<string, UsedKey[]>();
  for (const missing of missingKeys) {
    if (!missingByKey.has(missing.key)) {
      missingByKey.set(missing.key, []);
    }
    missingByKey.get(missing.key)!.push(missing);
  }
  
  console.log(`❌ Found ${missingByKey.size} missing translation key(s):\n`);
  
  for (const [key, usages] of missingByKey.entries()) {
    console.log(`   ${key}`);
    usages.forEach(usage => {
      const relativePath = path.relative(process.cwd(), usage.file);
      console.log(`      → ${relativePath}:${usage.line}`);
    });
    console.log('');
  }
  
  console.log(`\n💡 Add these keys to ${REFERENCE_LOCALE} and all other locale files.`);
}

// Run the check
findMissingKeys();
