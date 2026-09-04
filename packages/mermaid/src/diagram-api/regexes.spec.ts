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
  // The two shapes CodeQL and the CWE-1333 review flagged. Small instances here: the point is
  // that the scanner still agrees with the released regex on them, not how fast it is.
  ('\n' + ' '.repeat(4)).repeat(20),
  '%%' + 'x%%'.repeat(20),
  '%%' + 'x%%'.repeat(20) + '\n',
  ' \n \n %% after blank indented lines\n',
];

describe('stripAnyComments', () => {
  it('strips comments byte-identically to replace(anyCommentRegex, "\\n")', () => {
    for (const input of CORPUS) {
      expect(stripAnyComments(input)).toBe(legacyStrip(input));
    }
  });

  // A ratio between two sub-millisecond measurements is mostly scheduler noise, which is how this
  // test used to fail on loaded runners. Each fixture below is instead sized so the released regex
  // needs seconds on it where the scanner needs microseconds, leaving one generous bound to
  // separate them with several orders of magnitude to spare:
  //
  //   all-whitespace lines      80,000 chars   scanner 0.006ms   regex 6932ms
  //   `%%` runs, no newline     96,002 chars   scanner 0.007ms   regex 3082ms
  //   deep indents             644,200 chars   scanner 0.043ms   regex 2322ms
  //
  // The third shape grows by indent width, not by line count. It contains no `%%` at all and the
  // regex is linear in its line count, so scaling it by line count, as this test did, proves
  // nothing about the blowup it is meant to guard.
  const BUDGET_MS = 250;

  it.each([
    ['all-whitespace lines', ('\n' + ' '.repeat(4)).repeat(16000)],
    ['`%%` runs with no terminating newline', '%%' + 'x%%'.repeat(32000)],
    ['deep indents', (' '.repeat(3200) + 'classDef x fill:#fff\n').repeat(200)],
  ])('does not backtrack catastrophically on %s', (_label, input) => {
    // Best of three: catastrophic backtracking is deterministic and shows up in every run, while
    // a GC pause or a busy runner hits one.
    let fastest = Infinity;
    for (let i = 0; i < 3; i++) {
      const t0 = performance.now();
      stripAnyComments(input);
      fastest = Math.min(fastest, performance.now() - t0);
    }

    expect(fastest).toBeLessThan(BUDGET_MS);
  });
});
