/**
 * Single entry point for the e2e screenshot → composite-sheet pipeline.
 *
 *   pnpm screenshots canonicalize     # re-root shard-dependent screenshot paths
 *   pnpm screenshots sheets           # composite screenshots into Argos sheets
 *   pnpm screenshots order [--check]  # regenerate (or verify) the tile order manifest
 *
 * Each subcommand delegates to its module; see canonicalize-screenshots.ts and
 * screenshot-sheets.ts for the logic and the env vars each reads.
 */

/* eslint-disable no-console */
import { canonicalizeScreenshots } from './canonicalize-screenshots.ts';
import { buildSheets, regenerateOrder } from './screenshot-sheets.ts';

const COMMANDS = ['canonicalize', 'sheets', 'order'] as const;
type Command = (typeof COMMANDS)[number];

async function main(): Promise<void> {
  const [command, ...rest] = process.argv.slice(2);

  switch (command as Command) {
    case 'canonicalize':
      await canonicalizeScreenshots();
      break;
    case 'sheets':
      await buildSheets();
      break;
    case 'order':
      await regenerateOrder({ check: rest.includes('--check') });
      break;
    default:
      console.error(
        `Unknown command "${command ?? ''}". Usage: pnpm screenshots <${COMMANDS.join('|')}> [--check]`
      );
      process.exitCode = 1;
  }
}

void main();
