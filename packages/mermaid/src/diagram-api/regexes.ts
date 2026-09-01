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

// The fast equivalent. `(^|\S)` only lets the greedy `\s*` start where a whitespace run actually
// begins (string/line start, or right after a non-whitespace char, re-emitted by `$1`). Without
// that, the global match retries `\s*` from every position inside an indent, re-scanning the run
// each time — O(whitespace²), ~250ms on a deeply-indented diagram (1.6k-space lines). The guard
// makes it O(n) while stripping byte-identically to `replace(anyCommentRegex, '\n')` (proven
// against it in regexes.spec.ts). Written without a `(?<=\S)` lookbehind on purpose: the project
// supports Safari 15.4, and lookbehind ships in 16.4 — and since this module loads for every
// diagram, an unsupported construct would be a module-load SyntaxError.
const linearAnyCommentRegex = /(^|\S)\s*%%.*\n/gm;

/**
 * Strip `%%` comment runs exactly like `text.replace(anyCommentRegex, '\n')`, in linear time.
 */
export const stripAnyComments = (text: string): string =>
  text.replace(linearAnyCommentRegex, '$1\n');
