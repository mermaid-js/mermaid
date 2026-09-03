// Match Jekyll-style front matter blocks (https://jekyllrb.com/docs/front-matter/).
// Based on regex used by Jekyll: https://github.com/jekyll/jekyll/blob/6dd3cc21c40b98054851846425af06c64f9fb466/lib/jekyll/document.rb#L10
// Note that JS doesn't support the "\A" anchor, which means we can't use
// multiline mode.
// Relevant YAML spec: https://yaml.org/spec/1.2.2/#914-explicit-documents
// The \1 backreference anchors closing `---` to the same indent as the opening one, guards against indented `---` inside multi-line YAML scalars (#7613).
// Kept byte-for-byte as released: it is part of the published surface. It backtracks quadratically
// (see `matchFrontMatter` below), so internal hot paths must use `matchFrontMatter` instead of
// matching with this regex directly.
export const frontMatterRegex = /^([^\S\n\r]*)-{3}\s*[\n\r](.*?)[\n\r]\1-{3}\s*[\n\r]+/s;

export const directiveRegex =
  /%{2}{\s*(?:(\w+)\s*:|(\w+))\s*(?:(\w+)|((?:(?!}%{2}).|\r?\n)*))?\s*(?:}%{2})?/gi;

// Kept byte-for-byte as released: it is part of the published surface, and consumers replace with
// `'\n'` — a pattern change (capture groups, lookbehind) would silently change their output or throw
// at module load on older engines. It backtracks quadratically on deep indents, so internal hot
// paths must use `stripAnyComments` below instead of replacing with this regex directly.
export const anyCommentRegex = /\s*%%.*\n/gm;

/** One character, tested against the same class `\s` means inside `anyCommentRegex`. */
const whitespace = /\s/;

/**
 * Strip `%%` comment runs exactly like `text.replace(anyCommentRegex, '\n')`, in linear time.
 *
 * A scanner rather than a regex, because no variant of this pattern is linear. Every regex form
 * carries a `\s*` that can cross newlines, and `/m` gives the engine a candidate start at each
 * line, so an all-whitespace document has the match attempt rescan the remaining run once per
 * line. Two shapes are quadratic in the released pattern and in the guarded `(^|\S)\s*%%.*\n`
 * that replaced it, both inside the default 50k `maxTextSize`:
 *
 * ```
 *   ('\n' + ' '.repeat(4)).repeat(10_000)   all whitespace, many lines   256ms
 *   '%%' + 'x%%'.repeat(16_000)             no terminating newline       339ms
 * ```
 *
 * against 0.1ms for ordinary diagram text of the same size. The guard cut the constant roughly
 * 40x but left the exponent alone, which is what CodeQL and the CWE-1333 review both caught.
 *
 * The scan walks forward once. For each `%%` it takes the line's terminating newline as the end
 * of the match — `.` never matches a newline, so the regex ends at that same character — and
 * extends left over the preceding whitespace run, never past the previous match. Each character
 * is visited at most twice, so the work is linear in the input and independent of how the
 * whitespace is arranged.
 *
 * A `%%` with no newline after it is left alone, because `%%.*\n` cannot match without one.
 */
export const stripAnyComments = (text: string): string => {
  let out = '';
  // Everything before this index has been emitted or dropped; also the floor for the leftward
  // whitespace scan, which is what `lastIndex` does for the global regex.
  let consumed = 0;
  let searchFrom = 0;

  while (searchFrom < text.length) {
    const marker = text.indexOf('%%', searchFrom);
    if (marker === -1) {
      break;
    }
    const lineEnd = text.indexOf('\n', marker);
    if (lineEnd === -1) {
      // No newline left in the string, so this `%%` and every later one cannot match.
      break;
    }
    let start = marker;
    while (start > consumed && whitespace.test(text[start - 1])) {
      start--;
    }
    out += text.slice(consumed, start) + '\n';
    consumed = lineEnd + 1;
    searchFrom = consumed;
  }

  return out + text.slice(consumed);
};

/** True for the characters `[\n\r]` means in `frontMatterRegex`. */
const isLineBreak = (char: string | undefined): boolean => char === '\n' || char === '\r';

/**
 * Index of the last `[\n\r]` in the whitespace run starting at `from`, or `-1` if the run holds
 * none. This is where a greedy `\s*[\n\r]+` stops: `\s*` takes the whole run, then gives
 * characters back until the next one is a line break.
 */
const lastLineBreakInWhitespaceRun = (text: string, from: number): number => {
  let index = -1;
  for (let i = from; i < text.length && whitespace.test(text[i]); i++) {
    if (isLineBreak(text[i])) {
      index = i;
    }
  }
  return index;
};

export interface FrontMatterMatch {
  /** The horizontal indent of the opening fence — `frontMatterRegex`'s capture group 1. */
  indent: string;
  /** The YAML body between the fences — capture group 2. */
  body: string;
  /** Length of the whole match, so callers can slice the front matter off. */
  length: number;
}

/**
 * Locate a front matter block exactly like `text.match(frontMatterRegex)`, in linear time.
 *
 * A scanner rather than a regex, because `frontMatterRegex` is ambiguous: the opening `\s*[\n\r]`
 * lets `\s*` consume line breaks as well, so every failed search for a closing fence backtracks
 * into it. Each of the O(n) split points then rescans the lazy body, which is quadratic overall —
 * on `'---\n' + ' \n'.repeat(n)`, well inside the default 50k `maxTextSize`:
 *
 * ```
 *   n =  4_000    38ms
 *   n =  8_000   161ms
 *   n = 16_000   619ms
 * ```
 *
 * Removing the ambiguity is not behaviour-preserving, so the scanner reproduces the
 * backtracking result rather than a tidier reading of it. The engine tries the *longest* opening
 * first and shortens it one line break at a time until the rest matches, which is equivalent to:
 *
 * 1. Take the closing fences that could terminate a block — a line break, `indent---`, then at
 *    least one more line break in the following whitespace run.
 * 2. The opening ends at the **last** line break of the run after `---` that still leaves a
 *    closing fence after it, since a longer opening is preferred but must leave one behind.
 * 3. The body ends at the **first** closing fence after that, because the body is lazy.
 *
 * This is why `'---\n\n---\n\nMORE\n---\n'` is stripped whole: the opening swallows both leading
 * line breaks, so the second `---` lands inside the body and only the third one can close.
 *
 * Two forward passes, each visiting a character a bounded number of times: the trailing
 * whitespace runs of two closing fences cannot overlap, since `---` separates them.
 */
export const matchFrontMatter = (text: string): FrontMatterMatch | undefined => {
  let cursor = 0;
  while (cursor < text.length && whitespace.test(text[cursor]) && !isLineBreak(text[cursor])) {
    cursor++;
  }
  const indent = text.slice(0, cursor);

  if (!text.startsWith('---', cursor)) {
    return undefined;
  }

  // Candidate opening ends: the line breaks of the whitespace run after the opening `---`.
  const openingEnds: number[] = [];
  for (let i = cursor + 3; i < text.length && whitespace.test(text[i]); i++) {
    if (isLineBreak(text[i])) {
      openingEnds.push(i);
    }
  }
  if (openingEnds.length === 0) {
    return undefined;
  }

  const closingFence = `${indent}---`;
  // A closing fence is only usable if the trailing `\s*[\n\r]+` matches too.
  const closingEnd = (i: number): number =>
    isLineBreak(text[i]) && text.startsWith(closingFence, i + 1)
      ? lastLineBreakInWhitespaceRun(text, i + 1 + closingFence.length)
      : -1;

  const earliestBodyStart = openingEnds[0] + 1;

  let lastClosingFence = -1;
  for (let i = earliestBodyStart; i < text.length; i++) {
    if (closingEnd(i) !== -1) {
      lastClosingFence = i;
    }
  }
  if (lastClosingFence === -1) {
    return undefined;
  }

  // Longest opening that still leaves a closing fence behind. One always exists: every closing
  // fence sits at or after `earliestBodyStart`, which is past `openingEnds[0]`.
  let openingEnd = openingEnds[0];
  for (const candidate of openingEnds) {
    if (candidate < lastClosingFence) {
      openingEnd = candidate;
    }
  }

  const bodyStart = openingEnd + 1;
  for (let i = bodyStart; i <= lastClosingFence; i++) {
    const matchEnd = closingEnd(i);
    if (matchEnd !== -1) {
      return { indent, body: text.slice(bodyStart, i), length: matchEnd + 1 };
    }
  }

  return undefined;
};
