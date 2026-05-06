#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * mermaid-interactive CLI
 *
 * Preprocesses extended Mermaid syntax (.mermid files) into standard Mermaid.
 *
 * Usage:
 *   mermaid-interactive <input.mermid>           # outputs to stdout
 *   mermaid-interactive <input.mermid> <out.mmd> # writes to file
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

async function main() {
  const [, , inputArg, outputArg] = process.argv;

  if (!inputArg || inputArg === '--help' || inputArg === '-h') {
    console.error(
      [
        'Usage: mermaid-interactive <input.mermid> [output.mmd]',
        '',
        'Options:',
        '  --help, -h   Show this help message',
        '',
        'Reads extended Mermaid syntax from <input.mermid> and writes',
        'standard Mermaid (with encoded interaction metadata) to stdout',
        'or to [output.mmd] if provided.',
      ].join('\n')
    );
    process.exit(inputArg ? 0 : 1);
  }

  const inputPath = resolve(process.cwd(), inputArg);
  let source;
  try {
    source = readFileSync(inputPath, 'utf8');
  } catch {
    console.error(`Error: Cannot read file: ${inputPath}`);
    process.exit(1);
  }

  // Dynamically import the preprocessor from compiled dist
  const { preprocess } = await import('../dist/index.js');
  const { diagram, interactions } = preprocess(source);

  if (outputArg) {
    const outputPath = resolve(process.cwd(), outputArg);
    writeFileSync(outputPath, diagram, 'utf8');
    console.error(`Written to ${outputPath}`);
    if (interactions.length > 0) {
      console.error(`Encoded ${interactions.length} interaction(s).`);
    }
  } else {
    process.stdout.write(diagram);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
