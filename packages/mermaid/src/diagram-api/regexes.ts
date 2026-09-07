// Match Jekyll-style front matter blocks (https://jekyllrb.com/docs/front-matter/).
// Based on regex used by Jekyll: https://github.com/jekyll/jekyll/blob/6dd3cc21c40b98054851846425af06c64f9fb466/lib/jekyll/document.rb#L10
// Note that JS doesn't support the "\A" anchor, which means we can't use
// multiline mode.
// Relevant YAML spec: https://yaml.org/spec/1.2.2/#914-explicit-documents
// The \1 backreference anchors closing `---` to the same indent as the opening one, guards against indented `---` inside multi-line YAML scalars (#7613).
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
