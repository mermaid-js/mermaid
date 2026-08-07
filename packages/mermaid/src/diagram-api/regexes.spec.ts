import { describe, it, expect } from 'vitest';
import { anyCommentRegex } from './regexes.js';

/**
 * `anyCommentRegex` got a perf guard (`(?:^|(?<=\S))`) so its leading `\s*` is attempted once per
 * whitespace run instead of from every offset (O(whitespace) instead of O(whitespace²)). The guard is
 * placed exactly where a whitespace run can begin — a line start, or immediately after a non-space —
 * so the match positions, and therefore the stripped output, are byte-identical to the original. These
 * tests pin that equivalence and the O(n) behaviour.
 */

// The original, un-guarded pattern these comments were stripped with before the perf fix.
const originalCommentRegex = /\s*%%.*\n/gm;

const stripOld = (input: string) => input.replace(originalCommentRegex, '');
const stripNew = (input: string) => input.replace(anyCommentRegex, '');

describe('anyCommentRegex', () => {
  describe('strips identically to the original /\\s*%%.*\\n/gm', () => {
    const corpus: [name: string, input: string][] = [
      ['empty', ''],
      ['no comment', 'graph TD\n  A --> B\n'],
      ['line-start comment', '%% a comment\ngraph TD\n'],
      ['inline comment after content', 'graph TD\n  A --> B %% inline\n'],
      ['indented comment', 'graph TD\n     %% indented comment\n  A --> B\n'],
      ['tab-indented comment', 'graph TD\n\t\t%% tabbed comment\n'],
      ['blank line before comment', 'graph TD\n\n%% after a blank line\nA-->B\n'],
      ['blank lines + indented comment', 'A\n\n   \n   %% c\nB\n'],
      ['no trailing newline (unmatched)', 'graph TD\n  A --> B %% no newline'],
      ['comment-only no newline', '%% just a comment'],
      ['consecutive comments', '%% one\n%% two\n  %% three\n'],
      ['comment with %% inside', 'A %% see 50%% off\n'],
      [
        'multi-line diagram',
        'graph TD\n%% header\n  A-->B  %% edge one\n    %% indented\n  B-->C\n',
      ],
    ];

    it.each(corpus)('%s', (_name, input) => {
      expect(stripNew(input)).toBe(stripOld(input));
    });
  });

  it('strips deeply-indented input in O(n) time (no O(whitespace^2) regression)', () => {
    // 200 lines of ~2k leading spaces with no comment — the degenerate case the guard fixes. The old
    // pattern re-scans each indent run from every offset (seconds); the guarded pattern is linear.
    const input = `${' '.repeat(2000)}A --> B\n`.repeat(200);
    const start = performance.now();
    const out = stripNew(input);
    const elapsed = performance.now() - start;
    expect(out).toBe(input); // nothing to strip — output unchanged
    expect(elapsed).toBeLessThan(200); // would be seconds if quadratic
  });
});
