import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * CodeMirror keeps extension identity (facets, state fields) per module instance.
 * If two copies of `@codemirror/state` end up in the dev-explorer bundle, extensions
 * created by one copy are rejected by the other with:
 *
 *   Uncaught Error: Unrecognized extension value in extension set ([object Object]).
 *
 * That breaks the dev-explorer code editor entirely, and only at runtime — nothing
 * in lint, types, or unit tests notices. Guard the invariant at the lockfile level.
 */
const readLockfile = () => readFileSync(resolve(process.cwd(), 'pnpm-lock.yaml'), 'utf8');

const resolvedVersionsOf = (lockfile: string, packageName: string) => {
  const escaped = packageName.replace(/[$()*+./?[\\\]^{|}]/g, '\\$&');
  const matches = lockfile.matchAll(new RegExp(`^  '?${escaped}@([^':]+)'?:`, 'gm'));
  return [...new Set([...matches].map((m) => m[1]))];
};

describe('CodeMirror dependency deduplication', () => {
  it('resolves @codemirror/state to exactly one version', () => {
    expect(resolvedVersionsOf(readLockfile(), '@codemirror/state')).toHaveLength(1);
  });

  it('detects the duplicate-instance regression', () => {
    const duplicated = ["  '@codemirror/state@6.6.0':", "  '@codemirror/state@6.7.1':"].join('\n');
    expect(resolvedVersionsOf(duplicated, '@codemirror/state')).toHaveLength(2);
  });
});
