#!/usr/bin/env node
/*
 * CLI tool for rendering mermaid diagrams without a browser.
 *
 * Usage:
 *   pnpm --filter @mermaid-js/mermaid-ssr render [input-file] [output-file]
 *   echo 'flowchart TD; A--\>B' | pnpm --filter @mermaid-js/mermaid-ssr render
 *
 * If no output file is specified, SVG is written to stdout.
 * If no input file is specified, reads from stdin.
 */
import { readFileSync, writeFileSync } from 'node:fs';

// Virtual DOM must be set up BEFORE importing mermaid (D3 reads globals at import time)
import { createVirtualDOMEnvironment } from './virtualDOM.js';

const virtualDOM = createVirtualDOMEnvironment();

const { default: mermaid } = await import('mermaid');

// ── Helpers ──────────────────────────────────────────────────────────────

function printUsage(): void {
  // eslint-disable-next-line no-console
  console.log(`Usage: render.ts [input-file] [output-file]

Render a mermaid diagram to SVG without a browser.

Arguments:
  input-file   Path to .mmd file (reads from stdin if omitted)
  output-file  Path to write SVG output (writes to stdout if omitted)

Examples:
  pnpm --filter @mermaid-js/mermaid-ssr render diagram.mmd output.svg
  echo 'packet-beta\\n  0-15: "Header"' | pnpm --filter @mermaid-js/mermaid-ssr render
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
