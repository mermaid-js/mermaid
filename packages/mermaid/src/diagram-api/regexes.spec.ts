import { describe, it, expect } from 'vitest';
import { anyCommentRegex } from './regexes.js';

// The pre-optimization pattern, kept here as the equivalence oracle. The optimized
// `anyCommentRegex` must strip comments byte-for-byte identically to this — the only change is
// avoiding O(whitespace²) backtracking on deeply-indented input, not the matched text.
const LEGACY_ANY_COMMENT = /\s*%%.*\n/gm;

// Fresh regex per call so the global `lastIndex` never leaks between assertions.
const strip = (re: RegExp, text: string) => text.replace(new RegExp(re.source, re.flags), '\n');

const CORPUS: string[] = [
  '%% a line comment\n',
  'A\n%% comment between\nB\n',
  '   %% indented comment\n',
  'A --> B %% inline comment\n',
  'A\n\n%% comment after a blank line\n',
  '%% first\n%% second\n',
  'graph TD\n  A %% trailing\n  B\n',
  '   \n   %% comment after whitespace-only line\n',
  'no comments here\nA-->B\nC-->D\n',
  'A\n%% comment with no trailing newline',
  '  \n%% comment at col0 after a ws line\n',
  'X\n   \n   %% deep\n   \nY\n',
  '%%nospaceaftermarker\n',
  'a%%b\n', // `%%` mid-token, no leading whitespace
  'graph TD\n%% top\nA-->B %% mid\n%% bottom\n',
  '\t\t%% tab indented\n',
  'flowchart LR\n    subgraph S\n      %% inside subgraph\n      a-->b\n    end\n',
  '',
  '\n\n\n',
  '%%\n', // empty comment
];

describe('anyCommentRegex', () => {
  it('strips comments byte-identically to the legacy /\\s*%%.*\\n/gm pattern', () => {
    for (const input of CORPUS) {
      expect(strip(anyCommentRegex, input)).toBe(strip(LEGACY_ANY_COMMENT, input));
    }
  });

  it('is O(n) on deeply-indented input (no catastrophic backtracking)', () => {
    // Deep indentation with no comments is the worst case for the old leading-`\s*` pattern: the
    // global match re-scanned each indent run from every position — O(whitespace²), ~250ms+ on the
    // perf fixture huge3 (1.6k-space lines). The guarded pattern is O(n).
    const pathological =
      Array.from({ length: 300 }, () => ' '.repeat(1672) + 'classDef x fill:#fff').join('\n') +
      '\n';
    const t0 = performance.now();
    const out = strip(anyCommentRegex, pathological);
    const ms = performance.now() - t0;
    expect(out).toBe(pathological); // no `%%` → nothing stripped
    expect(ms).toBeLessThan(200); // legacy pattern takes seconds on this input
  });
});
