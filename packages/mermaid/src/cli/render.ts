#!/usr/bin/env node
/**
 * CLI tool for rendering mermaid diagrams without a browser.
 *
 * Usage:
 *   npx tsx packages/mermaid/src/cli/render.ts [input-file] [output-file]
 *   echo 'flowchart TD; A--\>B' | npx tsx packages/mermaid/src/cli/render.ts
 *
 * If no output file is specified, SVG is written to stdout.
 * If no input file is specified, reads from stdin.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

// Virtual DOM must be set up BEFORE importing mermaid (D3 reads globals at import time)
import { createVirtualDOMEnvironment } from './virtualDOM.js';

const virtualDOM = createVirtualDOMEnvironment();

// Import the pre-built mermaid bundle (avoids needing YAML/jison custom loaders)
const selfDir = dirname(fileURLToPath(import.meta.url));
const distPath = resolve(selfDir, '../../dist/mermaid.core.mjs');
const { default: mermaid } = await import(distPath);

// ── Helpers ──────────────────────────────────────────────────────────────

function printUsage(): void {
  // eslint-disable-next-line no-console
  console.log(`Usage: render.ts [input-file] [output-file]

Render a mermaid diagram to SVG without a browser.

Arguments:
  input-file   Path to .mmd file (reads from stdin if omitted)
  output-file  Path to write SVG output (writes to stdout if omitted)

Examples:
  npx tsx packages/mermaid/src/cli/render.ts diagram.mmd output.svg
  echo 'packet-beta\\n  0-15: "Header"' | npx tsx packages/mermaid/src/cli/render.ts
`);
}

function parseArgs(argv: string[]): { inputFile?: string; outputFile?: string } {
  let inputFile: string | undefined;
  let outputFile: string | undefined;

  for (const arg of argv) {
    if (arg === '--help' || arg === '-h') {
      printUsage();
      process.exit(0);
    }
    if (!inputFile) {
      inputFile = arg;
    } else {
      outputFile ??= arg;
    }
  }
  return { inputFile, outputFile };
}

function readInput(inputFile?: string): string {
  const text = inputFile ? readFileSync(inputFile, 'utf-8') : readFileSync('/dev/stdin', 'utf-8');
  if (!text.trim()) {
    // eslint-disable-next-line no-console
    console.error('Error: No diagram text provided.');
    process.exit(1);
  }
  return text;
}

// ── Main ─────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const { inputFile, outputFile } = parseArgs(process.argv.slice(2));
  const diagramText = readInput(inputFile);

  try {
    mermaid.initialize({
      htmlLabels: false,
      securityLevel: 'loose',
      logLevel: 'error',
      startOnLoad: false,
    });

    const id = `mermaid-cli-${Date.now()}`;
    const { svg } = await mermaid.render(id, diagramText);

    if (outputFile) {
      writeFileSync(outputFile, svg, 'utf-8');
      // eslint-disable-next-line no-console
      console.error(`SVG written to ${outputFile}`);
    } else {
      process.stdout.write(svg);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error rendering diagram:', error);
    process.exit(1);
  } finally {
    virtualDOM.cleanup();
  }
}

void main();
