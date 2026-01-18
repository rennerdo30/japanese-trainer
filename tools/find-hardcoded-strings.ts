#!/usr/bin/env node

/**
 * Find Hardcoded Strings
 *
 * Scans TSX/TS files for string literals that should use i18n.
 * Detects strings in JSX text, placeholder, title, aria-label attributes.
 *
 * Usage:
 *   npx tsx tools/find-hardcoded-strings.ts
 *   npx tsx tools/find-hardcoded-strings.ts --json
 *   npx tsx tools/find-hardcoded-strings.ts --file src/app/page.tsx
 */

import * as fs from 'fs';
import * as path from 'path';
import { globSync } from 'glob';

const SOURCE_DIR = path.join(__dirname, '../src');

interface HardcodedString {
  file: string;
  line: number;
  column: number;
  string: string;
  context: string;
  suggestedKey: string;
}

interface Report {
  totalFiles: number;
  filesWithHardcodedStrings: number;
  totalHardcodedStrings: number;
  findings: HardcodedString[];
}

// Patterns to exclude (not needing i18n)
const EXCLUDE_PATTERNS = [
  // CSS classes and styles
  /^[a-z][a-zA-Z0-9]*$/,  // camelCase (likely CSS class or variable)
  /^[a-z]+(-[a-z]+)*$/,   // kebab-case
  /^[a-z]+_[a-z]+$/,      // snake_case
  /^styles\./,            // styles.something
  /^[#.]/,                // CSS selectors
  // URLs and paths
  /^https?:\/\//,
  /^\/[a-z]/,             // paths starting with /
  /^data:/,               // data URLs
  /\.(css|js|tsx?|png|jpg|svg|ico|mp3|wav|json)$/i,
  // Code/technical strings
  /^[A-Z][A-Z0-9_]+$/,    // CONSTANTS
  /^\d+$/,                // pure numbers
  /^[a-z]+:\/\//,         // protocols
  /^#[0-9a-fA-F]{3,8}$/,  // hex colors
  /^rgb/,                 // rgb colors
  /^[a-z]+\.[a-z]+$/,     // dot notation (object.property)
  // Single characters and punctuation
  /^.$/,                  // single character
  /^[^\w\s]*$/,           // only punctuation
  // Import/export patterns
  /^@/,                   // @imports
  /^\.{1,2}\//,           // relative imports
  // Common technical strings
  /^(true|false|null|undefined|NaN)$/,
  /^(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)$/,
  /^(px|em|rem|vh|vw|%|ms|s)$/,
  /^(auto|none|flex|grid|block|inline|inherit|initial|unset)$/,
  // Event handlers
  /^on[A-Z]/,
  // Data attributes
  /^data-/,
  // Common code patterns
  /^[a-zA-Z]+:$/,         // Object keys with colon
  /\$\{/,                 // Template literal variables
];

// Attributes to check for hardcoded strings
const TEXT_ATTRIBUTES = [
  'placeholder',
  'title',
  'aria-label',
  'aria-description',
  'aria-placeholder',
  'alt',
];

// Minimum length for strings to consider (very short strings are often not translatable)
const MIN_STRING_LENGTH = 2;

function shouldExclude(str: string): boolean {
  // Too short
  if (str.length < MIN_STRING_LENGTH) return true;

  // Empty or whitespace only
  if (!str.trim()) return true;

  // Check against exclude patterns
  for (const pattern of EXCLUDE_PATTERNS) {
    if (pattern.test(str)) return true;
  }

  // Check if it looks like it's already using i18n
  if (str.includes('t(') || str.includes('t\'') || str.includes('t"')) return true;

  return false;
}

function suggestI18nKey(str: string, context: string): string {
  // Create a suggested key based on the string content
  const base = str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .substring(0, 30);

  // Try to infer section from context
  let section = 'common';
  if (context.includes('placeholder')) section = 'form';
  else if (context.includes('aria-')) section = 'accessibility';
  else if (context.includes('title')) section = 'labels';
  else if (context.includes('alt')) section = 'images';

  return `${section}.${base}`;
}

function findHardcodedStrings(filePath: string): HardcodedString[] {
  const findings: HardcodedString[] = [];
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const relativePath = path.relative(process.cwd(), filePath);

  lines.forEach((line, lineIndex) => {
    // Skip import/export lines
    if (line.trim().startsWith('import ') || line.trim().startsWith('export ')) return;
    // Skip comments
    if (line.trim().startsWith('//') || line.trim().startsWith('/*') || line.trim().startsWith('*')) return;
    // Skip console.log and similar
    if (/console\.(log|warn|error|info|debug)/.test(line)) return;

    // Pattern 1: JSX text content - >text<
    const jsxTextPattern = />([^<>{]+)</g;
    let match;
    while ((match = jsxTextPattern.exec(line)) !== null) {
      const text = match[1].trim();
      if (text && !shouldExclude(text)) {
        // Check if it's a JSX expression {variable}
        if (text.startsWith('{') && text.endsWith('}')) continue;
        // Check if it looks like a variable or expression result
        if (/^\{.*\}$/.test(text)) continue;

        findings.push({
          file: relativePath,
          line: lineIndex + 1,
          column: match.index + 1,
          string: text,
          context: 'JSX text content',
          suggestedKey: suggestI18nKey(text, 'text'),
        });
      }
    }

    // Pattern 2: Text attributes - placeholder="text", title="text", etc.
    for (const attr of TEXT_ATTRIBUTES) {
      const attrPattern = new RegExp(`${attr}=["']([^"']+)["']`, 'g');
      while ((match = attrPattern.exec(line)) !== null) {
        const text = match[1].trim();
        if (text && !shouldExclude(text)) {
          findings.push({
            file: relativePath,
            line: lineIndex + 1,
            column: match.index + 1,
            string: text,
            context: `${attr} attribute`,
            suggestedKey: suggestI18nKey(text, attr),
          });
        }
      }
    }

    // Pattern 3: Common UI patterns - button text, label text
    // Look for patterns like: <button>Text</button>, <label>Text</label>
    const uiElementPattern = /<(button|label|h[1-6]|p|span|div)[^>]*>([^<{]+)<\//g;
    while ((match = uiElementPattern.exec(line)) !== null) {
      const text = match[2].trim();
      // Don't duplicate findings from Pattern 1
      if (text && !shouldExclude(text) && !findings.some(f => f.line === lineIndex + 1 && f.string === text)) {
        findings.push({
          file: relativePath,
          line: lineIndex + 1,
          column: match.index + 1,
          string: text,
          context: `${match[1]} element content`,
          suggestedKey: suggestI18nKey(text, 'ui'),
        });
      }
    }
  });

  return findings;
}

function generateReport(targetFile?: string): Report {
  let files: string[];

  if (targetFile) {
    const fullPath = path.isAbsolute(targetFile) ? targetFile : path.join(process.cwd(), targetFile);
    if (!fs.existsSync(fullPath)) {
      console.error(`File not found: ${targetFile}`);
      process.exit(1);
    }
    files = [fullPath];
  } else {
    files = globSync('**/*.{ts,tsx}', {
      cwd: SOURCE_DIR,
      ignore: ['**/*.d.ts', '**/node_modules/**', '**/_generated/**'],
    }).map(f => path.join(SOURCE_DIR, f));
  }

  const allFindings: HardcodedString[] = [];
  let filesWithFindings = 0;

  for (const file of files) {
    const findings = findHardcodedStrings(file);
    if (findings.length > 0) {
      filesWithFindings++;
      allFindings.push(...findings);
    }
  }

  return {
    totalFiles: files.length,
    filesWithHardcodedStrings: filesWithFindings,
    totalHardcodedStrings: allFindings.length,
    findings: allFindings,
  };
}

function main(): void {
  const args = process.argv.slice(2);
  const jsonOutput = args.includes('--json');
  const fileIndex = args.indexOf('--file');
  const targetFile = fileIndex !== -1 ? args[fileIndex + 1] : undefined;

  const report = generateReport(targetFile);

  if (jsonOutput) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  // Human-readable output
  console.log('\n=== Hardcoded String Finder ===\n');
  console.log(`Scanned ${report.totalFiles} file(s)`);
  console.log(`Found ${report.totalHardcodedStrings} potential hardcoded string(s) in ${report.filesWithHardcodedStrings} file(s)\n`);

  if (report.findings.length === 0) {
    console.log('No hardcoded strings found.\n');
    return;
  }

  // Group by file
  const byFile = new Map<string, HardcodedString[]>();
  for (const finding of report.findings) {
    if (!byFile.has(finding.file)) {
      byFile.set(finding.file, []);
    }
    byFile.get(finding.file)!.push(finding);
  }

  for (const [file, findings] of byFile.entries()) {
    console.log(`\n${file} (${findings.length} finding(s))`);
    console.log('-'.repeat(file.length + 20));

    for (const finding of findings) {
      console.log(`  Line ${finding.line}: "${finding.string}"`);
      console.log(`    Context: ${finding.context}`);
      console.log(`    Suggested key: ${finding.suggestedKey}`);
    }
  }

  console.log('\n---');
  console.log('Tips:');
  console.log('  - Review each finding to determine if i18n is needed');
  console.log('  - Some strings may be intentionally hardcoded (technical IDs, etc.)');
  console.log('  - Use t("key") from useTranslation() for translatable strings\n');
}

main();
