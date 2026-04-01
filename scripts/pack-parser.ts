/**
 * Creates a tarball containing only the files needed for parse-only usage of mermaid.
 * Uses the ESM build which bundles all dependencies (no external requires).
 * No source maps, no type definitions, no IIFE bundles.
 *
 * Usage: pnpm pack:parser
 * Output: mermaid-parser.tar.gz in the repo root
 */

/* eslint-disable no-console */
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const dist = resolve(root, 'packages/mermaid/dist');

if (!existsSync(resolve(dist, 'mermaid.esm.mjs'))) {
  console.error('dist not found — run `pnpm build` first');
  process.exit(1);
}

const outFile = resolve(root, 'mermaid-parser.tar.gz');

console.log('Packing parse-only build...');
execSync(
  [
    `tar -czf ${JSON.stringify(outFile)}`,
    `-C ${JSON.stringify(dist)}`,
    `--exclude='*.map'`,
    `mermaid.esm.mjs`,
    `chunks/mermaid.esm`,
  ].join(' '),
  { stdio: 'inherit' }
);

console.log(`\nCreated ${outFile}`);
execSync(`ls -lh ${JSON.stringify(outFile)}`, { stdio: 'inherit' });
