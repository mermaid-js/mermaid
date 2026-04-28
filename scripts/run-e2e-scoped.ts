/**
 * Local development runner for scoped e2e tests.
 *
 * Detects which diagrams changed (comparing HEAD against a base ref) and
 * invokes Cypress with only the matching spec files. Falls back to the full
 * suite when shared code is touched.
 *
 * The dev server must already be running (started by start-server-and-test).
 *
 * Usage via pnpm:
 *   pnpm e2e:scope                         # base ref defaults to 'develop'
 *   E2E_BASE_REF=main pnpm e2e:scope       # override base ref
 */

import { execSync, spawn } from 'child_process';
import { detectScope } from './e2e-diagram-scope.mjs';

const base = process.argv[2] ?? process.env.E2E_BASE_REF ?? 'develop';

let changedFiles: string[] = [];
try {
  const output = execSync(`git diff --name-only ${base} HEAD`, { encoding: 'utf8' });
  changedFiles = output.split('\n').filter(Boolean);
} catch {
  /* eslint-disable no-console */
  console.warn(`[e2e:scope] Could not diff against "${base}" — running full suite.`);
}

const spec = detectScope(changedFiles);

const cypressArgs = ['run'];
if (spec) {
  /* eslint-disable no-console */
  console.log(`[e2e:scope] Scoped run:\n  ${spec.split(',').join('\n  ')}`);
  cypressArgs.push('--spec', spec);
} else {
  /* eslint-disable no-console */
  console.log('[e2e:scope] Running full e2e suite (shared code changed or scope undetermined).');
}

const child = spawn('cypress', cypressArgs, { stdio: 'inherit' });
child.on('exit', (code) => process.exit(code ?? 0));
