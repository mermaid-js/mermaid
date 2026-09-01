import { describe, it, expect } from 'vitest';
import { anyCommentRegex, stripAnyComments } from './regexes.js';

// The exported `anyCommentRegex` is the published, pre-optimization pattern and serves as the
// equivalence oracle: `stripAnyComments` must strip comments byte-for-byte identically to
// `replace(anyCommentRegex, '\n')` — the only difference is avoiding O(whitespace²) backtracking
// on deeply-indented input, not the matched text.

// Fresh regex per call so the global `lastIndex` never leaks between assertions.
const legacyStrip = (text: string) =>
  text.replace(new RegExp(anyCommentRegex.source, anyCommentRegex.flags), '\n');

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

describe('stripAnyComments', () => {
  it('strips comments byte-identically to replace(anyCommentRegex, "\\n")', () => {
    for (const input of CORPUS) {
      expect(stripAnyComments(input)).toBe(legacyStrip(input));
    }
  });

  it('is O(n) on deeply-indented input (no catastrophic backtracking)', () => {
    // Deep indentation with no comments is the worst case for the leading-`\s*` pattern: the
    // global match re-scans each indent run from every position — O(whitespace²), ~250ms+ on the
    // perf fixture huge3 (1.6k-space lines). The guarded pattern is O(n).
    const pathological =
      Array.from({ length: 300 }, () => ' '.repeat(1672) + 'classDef x fill:#fff').join('\n') +
      '\n';
    const t0 = performance.now();
    const out = stripAnyComments(pathological);
    const ms = performance.now() - t0;
    expect(out).toBe(pathological); // no `%%` → nothing stripped
    expect(ms).toBeLessThan(200); // the unguarded pattern takes seconds on this input
  });
});
