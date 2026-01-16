#!/usr/bin/env node

/**
 * i18n Key Checker
 * 
 * Verifies that all translation keys from the English reference file
 * are present in all other locale files.
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
  'zh.json'
];

interface MissingKey {
  locale: string;
  keys: string[];
}

function getNestedKeys(obj: any, prefix: string = ''): string[] {
  const keys: string[] = [];
  
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      // Recursively get nested keys
      keys.push(...getNestedKeys(obj[key], fullKey));
    } else {
      // Leaf key
      keys.push(fullKey);
    }
  }
  
  return keys;
}

function getValueByPath(obj: any, path: string): any {
  const keys = path.split('.');
  let value = obj;
  
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return undefined;
    }
  }
  
  return value;
}

function findMissingKeys(reference: any, target: any, prefix: string = ''): string[] {
  const missing: string[] = [];
  
  for (const key in reference) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof reference[key] === 'object' && reference[key] !== null && !Array.isArray(reference[key])) {
      // Check if nested object exists in target
      if (!target || typeof target !== 'object' || !(key in target)) {
        // Missing entire nested object - add all nested keys
        missing.push(...getNestedKeys(reference[key], fullKey));
      } else {
        // Recursively check nested object
        missing.push(...findMissingKeys(reference[key], target[key], fullKey));
      }
    } else {
      // Check if leaf key exists
      if (!target || typeof target !== 'object' || !(key in target)) {
        missing.push(fullKey);
      }
    }
  }
  
  return missing;
}

function checkI18nKeys(): { success: boolean; missing: MissingKey[] } {
  const referencePath = path.join(LOCALES_DIR, REFERENCE_LOCALE);
  
  if (!fs.existsSync(referencePath)) {
    console.error(`❌ Reference file not found: ${referencePath}`);
    process.exit(1);
  }
  
  const reference = JSON.parse(fs.readFileSync(referencePath, 'utf8'));
  const missing: MissingKey[] = [];
  
  console.log(`📋 Checking i18n keys against reference: ${REFERENCE_LOCALE}\n`);
  
  for (const localeFile of SUPPORTED_LOCALES) {
    if (localeFile === REFERENCE_LOCALE) {
      continue; // Skip reference file
    }
    
    const localePath = path.join(LOCALES_DIR, localeFile);
    
    if (!fs.existsSync(localePath)) {
      console.warn(`⚠️  Locale file not found: ${localeFile}`);
      missing.push({ locale: localeFile, keys: ['FILE_MISSING'] });
      continue;
    }
    
    try {
      const locale = JSON.parse(fs.readFileSync(localePath, 'utf8'));
      const missingKeys = findMissingKeys(reference, locale);
      
      if (missingKeys.length > 0) {
        missing.push({ locale: localeFile, keys: missingKeys });
        console.log(`❌ ${localeFile}: ${missingKeys.length} missing key(s)`);
        missingKeys.forEach(key => console.log(`   - ${key}`));
      } else {
        console.log(`✅ ${localeFile}: All keys present`);
      }
    } catch (error) {
      console.error(`❌ Error parsing ${localeFile}:`, error);
      missing.push({ locale: localeFile, keys: ['PARSE_ERROR'] });
    }
  }
  
  console.log('');
  
  if (missing.length === 0) {
    console.log('✨ All locale files are complete!');
    return { success: true, missing: [] };
  } else {
    const totalMissing = missing.reduce((sum, m) => sum + m.keys.length, 0);
    console.log(`❌ Found ${totalMissing} missing key(s) across ${missing.length} locale file(s)`);
    return { success: false, missing };
  }
}

// Run the check
const result = checkI18nKeys();
process.exit(result.success ? 0 : 1);
