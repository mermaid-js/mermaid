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

  it.each([
    ['all-whitespace lines', (n: number) => ('\n' + ' '.repeat(4)).repeat(n)],
    ['`%%` runs with no terminating newline', (n: number) => '%%' + 'x%%'.repeat(n)],
  ])('scales linearly on %s', (_label, build) => {
    // Scaling, not a wall-clock bound. The previous version of this test asserted "under 200ms"
    // on one fixed input, which a quadratic implementation passes comfortably — and did, for
    // both shapes above. Doubling the input should roughly double the work; quadratic would
    // quadruple it.
    //
    // Only shapes that are quadratic in the line count belong here. A deeply indented document
    // (hundreds of spaces per line, no `%%`) is quadratic in the indent width but linear in the
    // number of lines, so the released regex passes this ratio on it too; it proves nothing, and
    // at several megabytes per input it turns the ratio into a memory-bandwidth measurement that
    // flakes on shared runners.
    const measure = (n: number) => {
      const input = build(n);
      // Warm up so the first call does not carry compilation cost into the ratio.
      stripAnyComments(input);
      // A single pass over the small input takes tens of microseconds, so one GC pause or
      // scheduler hiccup on a shared CI runner can inflate an averaged sample several-fold.
      // Noise only ever adds time, so the minimum over repeated trials is the stable estimate
      // of the true cost; it is what keeps this ratio from flaking on a loaded machine.
      let best = Infinity;
      for (let trial = 0; trial < 5; trial++) {
        const t0 = performance.now();
        for (let i = 0; i < 5; i++) {
          stripAnyComments(input);
        }
        best = Math.min(best, (performance.now() - t0) / 5);
      }
      return best;
    };

    const small = measure(4000);
    const large = measure(16000);

    // 4x the input. Linear predicts ~4x, quadratic ~16x. The bar is set at 8 so ordinary timing
    // noise on a loaded machine cannot fail it while a return to quadratic still does.
    expect(large / Math.max(small, 0.01)).toBeLessThan(8);
  });
});
