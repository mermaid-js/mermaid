#!/usr/bin/env tsx
/* eslint-disable no-console */
/* cspell:disable */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join, dirname, basename } from 'path';

/**
 * Generic ANTLR generator script that finds all .g4 files and generates parsers
 * Automatically creates generated folders and runs antlr4ng for each diagram type
 */

interface GrammarInfo {
  lexerFile: string;
  parserFile: string;
  outputDir: string;
  diagramType: string;
}

/**
 * Recursively find all .g4 files in a directory
 */
function findG4Files(dir: string): string[] {
  const files: string[] = [];

  if (!existsSync(dir)) {
    return files;
  }

  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...findG4Files(fullPath));
    } else if (entry.endsWith('.g4')) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Find all ANTLR grammar files in the diagrams directory
 */
function findGrammarFiles(): GrammarInfo[] {
  const grammarFiles: GrammarInfo[] = [];

  // Determine the correct path based on current working directory
  const cwd = process.cwd();
  let diagramsPath: string;

  if (cwd.endsWith('/packages/mermaid')) {
    // Running from mermaid package directory
    diagramsPath = 'src/diagrams';
  } else {
    // Running from project root
    diagramsPath = 'packages/mermaid/src/diagrams';
  }

  // Find all .g4 files
  const g4Files = findG4Files(diagramsPath);

  // Group by directory (each diagram should have a Lexer and Parser pair)
  const grammarDirs = new Map<string, string[]>();

  for (const file of g4Files) {
    const dir = dirname(file);
    if (!grammarDirs.has(dir)) {
      grammarDirs.set(dir, []);
    }
    grammarDirs.get(dir)!.push(file);
  }

  // Process each directory
  for (const [dir, files] of grammarDirs) {
    const lexerFile = files.find((f) => f.includes('Lexer.g4'));
    const parserFile = files.find((f) => f.includes('Parser.g4'));

    if (lexerFile && parserFile) {
      // Extract diagram type from path
      const pathParts = dir.split('/');
      const diagramIndex = pathParts.indexOf('diagrams');
      const diagramType = diagramIndex >= 0 ? pathParts[diagramIndex + 1] : 'unknown';

      grammarFiles.push({
        lexerFile,
        parserFile,
        outputDir: join(dir, 'generated'),
        diagramType,
      });
    } else {
      console.warn(`⚠️  Incomplete grammar pair in ${dir}:`);
      console.warn(`   Lexer: ${lexerFile ?? 'MISSING'}`);
      console.warn(`   Parser: ${parserFile ?? 'MISSING'}`);
    }
  }

  return grammarFiles;
}

/**
 * Clean the generated directory
 */
function cleanGeneratedDir(outputDir: string): void {
  try {
    execSync(`rimraf "${outputDir}"`, { stdio: 'inherit' });
    console.log(`🧹 Cleaned: ${outputDir}`);
  } catch (error) {
    console.warn(`⚠️  Failed to clean ${outputDir}:`, error);
  }
}

/**
 * Create the generated directory if it doesn't exist
 */
function ensureGeneratedDir(outputDir: string): void {
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
    console.log(`📁 Created: ${outputDir}`);
  }
}

/**
 * Generate ANTLR files for a grammar pair
 */
function generateAntlrFiles(grammar: GrammarInfo): void {
  const { lexerFile, parserFile, outputDir, diagramType } = grammar;

  console.log(`\n🎯 Generating ANTLR files for ${diagramType} diagram...`);
  console.log(`   Lexer: ${basename(lexerFile)}`);
  console.log(`   Parser: ${basename(parserFile)}`);
  console.log(`   Output: ${outputDir}`);

  try {
    // Clean and create output directory
    cleanGeneratedDir(outputDir);
    ensureGeneratedDir(outputDir);

    // Determine common header lib path for imported grammars
    const cwd = process.cwd();
    const commonLibPath = cwd.endsWith('/packages/mermaid')
      ? 'src/diagrams/common/parser/antlr'
      : 'packages/mermaid/src/diagrams/common/parser/antlr';

    // Generate ANTLR files
    const command = [
      'antlr-ng',
      '-Dlanguage=TypeScript',
      '-l',
      '-v',
      `--lib "${commonLibPath}"`,
      `-o "${outputDir}"`,
      `"${lexerFile}"`,
      `"${parserFile}"`,
    ].join(' ');

    console.log(`   Command: ${command}`);
    execSync(command, { stdio: 'inherit' });

    console.log(`✅ Successfully generated ANTLR files for ${diagramType}`);
  } catch (error) {
    console.error(`❌ Failed to generate ANTLR files for ${diagramType}:`, error);
    throw error;
  }
}

/**
 * Main function
 */
function main(): void {
  console.log('🚀 ANTLR Generator - Finding and generating all grammar files...\n');

  try {
    // Find all grammar files
    const grammarFiles = findGrammarFiles();

    if (grammarFiles.length === 0) {
      console.log('ℹ️  No ANTLR grammar files found.');
      return;
    }

    console.log(`📋 Found ${grammarFiles.length} diagram(s) with ANTLR grammars:`);
    for (const grammar of grammarFiles) {
      console.log(`   • ${grammar.diagramType}`);
    }

    // Generate files for each grammar
    let successCount = 0;
    let failureCount = 0;

    for (const grammar of grammarFiles) {
      try {
        generateAntlrFiles(grammar);
        successCount++;
      } catch (error) {
        failureCount++;
        console.error(`Failed to process ${grammar.diagramType}:`, error);
      }
    }

    // Summary
    console.log('\n📊 Generation Summary:');
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${failureCount}`);
    console.log(`   📁 Total: ${grammarFiles.length}`);

    if (failureCount > 0) {
      console.error('\n❌ Some ANTLR generations failed. Check the errors above.');
      process.exit(1);
    } else {
      console.log('\n🎉 All ANTLR files generated successfully!');
    }
  } catch (error) {
    console.error('❌ Fatal error during ANTLR generation:', error);
    process.exit(1);
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
