import { describe, it, expect } from 'vitest';
import {
  anyCommentRegex,
  frontMatterRegex,
  matchFrontMatter,
  stripAnyComments,
} from './regexes.js';

/**
 * Duration of the fastest of several runs. The tests below compare the cost of two input sizes, and
 * the whole suite runs in parallel workers: a mean is skewed by any single scheduling stall, while
 * the minimum reports the run that was not interrupted.
 */
const fastestRun = (run: () => unknown, attempts = 5): number => {
  let fastest = Infinity;
  for (let i = 0; i < attempts; i++) {
    const t0 = performance.now();
    run();
    fastest = Math.min(fastest, performance.now() - t0);
  }
  return fastest;
};

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
    ['deep indents', (n: number) => (' '.repeat(400) + 'classDef x fill:#fff\n').repeat(n)],
  ])('scales linearly on %s', (_label, build) => {
    // Scaling, not a wall-clock bound. The previous version of this test asserted "under 200ms"
    // on one fixed input, which a quadratic implementation passes comfortably — and did, for
    // both shapes above. Doubling the input should roughly double the work; quadratic would
    // quadruple it.
    const measure = (n: number) => {
      const input = build(n);
      // Warm up so the first call does not carry compilation cost into the ratio.
      stripAnyComments(input);
      return fastestRun(() => stripAnyComments(input));
    };

    const small = measure(4000);
    const large = measure(16000);

    // 4x the input. Linear predicts ~4x, quadratic ~16x. The bar is set at 8 so ordinary timing
    // noise on a loaded machine cannot fail it while a return to quadratic still does.
    expect(large / Math.max(small, 0.01)).toBeLessThan(8);
  });
});

// Same arrangement as above: the exported `frontMatterRegex` is the released pattern and the
// equivalence oracle. `matchFrontMatter` must agree with it on which block matches, what the
// indent and body are, and how much text is consumed — the only difference is avoiding the
// O(n²) backtracking on ambiguous whitespace.

const legacyMatch = (text: string) => {
  const matches = text.match(frontMatterRegex);
  return matches ? { indent: matches[1], body: matches[2], length: matches[0].length } : undefined;
};

const FRONT_MATTER_CORPUS: string[] = [
  '---\ntitle: Hello\n---\ngraph TD\n  A-->B\n',
  '---\ntitle: Hello\n---\n',
  '---\r\ntitle: CRLF\r\n---\r\ngraph TD\n',
  '  ---\n  title: indented\n  ---\ngraph TD\n',
  '\t---\n\ttitle: tab indented\n\t---\ngraph TD\n',
  // Indented `---` inside a multi-line scalar must not close the block (#7613).
  '---\ntitle: |\n  ---\n  still the body\n---\ngraph TD\n',
  // The divergence called out in #8200: greedy `\s*` in the opening pushes the body start past a
  // newline, so the block closes at the *last* fence rather than the second one.
  '---\n\n---\n\nMORE\n---\n',
  '---\n\n\n---\ngraph TD\n',
  '---   \ntitle: trailing spaces on the fence\n---   \ngraph TD\n',
  '---\ntitle: many trailing newlines\n---\n\n\n\ngraph TD\n',
  '---\ntitle: no trailing newline after close\n---',
  '---\ntitle: unterminated\ngraph TD\n',
  '---\n',
  '---',
  '----\nfour dashes\n----\n',
  '  ---\nclose at a different indent\n---\n',
  '---\nopen at col0\n  ---\n',
  'graph TD\n---\nnot at the start\n---\n',
  '',
  '\n\n\n',
  'graph TD\n  A-->B\n',
  // The reported quadratic shape, small instance: agreement matters here, speed is asserted below.
  '---\n' + ' \n'.repeat(20),
  '---\n' + ' \n'.repeat(20) + '---\n',
];

describe('matchFrontMatter', () => {
  it('matches identically to frontMatterRegex', () => {
    for (const input of FRONT_MATTER_CORPUS) {
      expect(matchFrontMatter(input), JSON.stringify(input)).toStrictEqual(legacyMatch(input));
    }
  });

  it('matches identically to frontMatterRegex on random fence-and-whitespace strings', () => {
    // The corpus above covers the shapes we reasoned about; this covers the ones we did not.
    // Deterministic PRNG so a failure is reproducible from the printed input alone.
    let seed = 0x2f6e2b1;
    const random = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };
    const pieces = ['---', '----', '\n', '\r\n', '\r', ' ', '\t', 'a', 'title: x', ''];

    for (let i = 0; i < 3000; i++) {
      let input = '';
      const length = 1 + Math.floor(random() * 12);
      for (let j = 0; j < length; j++) {
        input += pieces[Math.floor(random() * pieces.length)];
      }
      expect(matchFrontMatter(input), JSON.stringify(input)).toStrictEqual(legacyMatch(input));
    }
  });

  it('scales linearly on whitespace-heavy input that never closes', () => {
    // `'---\n' + ' \n'.repeat(n)` is the shape from the CodeQL alert: the released regex is
    // quadratic on it (38ms / 161ms / 619ms at n = 4k / 8k / 16k). Ratio rather than a wall-clock
    // bound, for the reason given above.
    const measure = (n: number) => {
      const input = '---\n' + ' \n'.repeat(n);
      matchFrontMatter(input);
      return fastestRun(() => matchFrontMatter(input));
    };

    const small = measure(4000);
    const large = measure(16000);

    expect(large / Math.max(small, 0.01)).toBeLessThan(8);
  });
});
