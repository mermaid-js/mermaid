#!/usr/bin/env tsx
/* eslint-disable no-console */

import chokidar from 'chokidar';
import { execSync } from 'child_process';

/**
 * ANTLR Watch Script
 *
 * This script generates ANTLR files and then watches for changes to .g4 grammar files,
 * automatically regenerating the corresponding parsers when changes are detected.
 *
 * Features:
 * - Initial generation of all ANTLR files
 * - Watch .g4 files for changes
 * - Debounced regeneration to avoid multiple builds
 * - Clear logging and progress reporting
 * - Graceful shutdown handling
 */

let isGenerating = false;
let timeoutID: NodeJS.Timeout | undefined = undefined;

/**
 * Generate ANTLR parser files from grammar files
 */
function generateAntlr(): void {
  if (isGenerating) {
    console.log('⏳ ANTLR generation already in progress, skipping...');
    return;
  }

  try {
    isGenerating = true;
    console.log('🎯 ANTLR: Generating parser files...');
    execSync('tsx scripts/antlr-generate.mts', { stdio: 'inherit' });
    console.log('✅ ANTLR: Parser files generated successfully\n');
  } catch (error) {
    console.error('❌ ANTLR: Failed to generate parser files:', error);
  } finally {
    isGenerating = false;
  }
}

/**
 * Handle file change events with debouncing
 */
function handleFileChange(path: string): void {
  if (timeoutID !== undefined) {
    clearTimeout(timeoutID);
  }

  console.log(`🎯 Grammar file changed: ${path}`);

  // Debounce file changes to avoid multiple regenerations
  timeoutID = setTimeout(() => {
    console.log('🔄 Regenerating ANTLR files...\n');
    generateAntlr();
    timeoutID = undefined;
  }, 500); // 500ms debounce
}

/**
 * Setup graceful shutdown
 */
function setupGracefulShutdown(): void {
  const shutdown = () => {
    console.log('\n🛑 Shutting down ANTLR watch...');
    if (timeoutID) {
      clearTimeout(timeoutID);
    }
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

/**
 * Main function
 */
function main(): void {
  console.log('🚀 ANTLR Watch - Generate and watch grammar files for changes\n');

  // Setup graceful shutdown
  setupGracefulShutdown();

  // Initial generation
  generateAntlr();

  // Setup file watcher
  console.log('👀 Watching for .g4 file changes...');
  console.log('📁 Pattern: **/src/**/parser/antlr/*.g4');
  console.log('🛑 Press Ctrl+C to stop watching\n');

  const watcher = chokidar.watch('**/src/**/parser/antlr/*.g4', {
    ignoreInitial: true,
    ignored: [/node_modules/, /dist/, /docs/, /coverage/],
    persistent: true,
  });

  watcher
    .on('change', handleFileChange)
    .on('add', handleFileChange)
    .on('error', (error) => {
      console.error('❌ Watcher error:', error);
    })
    .on('ready', () => {
      console.log('✅ Watcher ready - monitoring grammar files for changes...\n');
    });

  // Keep the process alive
  process.stdin.resume();
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}
