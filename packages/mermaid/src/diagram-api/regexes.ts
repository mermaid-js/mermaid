// Match Jekyll-style front matter blocks (https://jekyllrb.com/docs/front-matter/).
// Based on regex used by Jekyll: https://github.com/jekyll/jekyll/blob/6dd3cc21c40b98054851846425af06c64f9fb466/lib/jekyll/document.rb#L10
// Note that JS doesn't support the "\A" anchor, which means we can't use
// multiline mode.
// Relevant YAML spec: https://yaml.org/spec/1.2.2/#914-explicit-documents
// The \1 backreference anchors closing `---` to the same indent as the opening one, guards against indented `---` inside multi-line YAML scalars (#7613).
export const frontMatterRegex = /^([^\S\n\r]*)-{3}\s*[\n\r](.*?)[\n\r]\1-{3}\s*[\n\r]+/s;

export const directiveRegex =
  /%{2}{\s*(?:(\w+)\s*:|(\w+))\s*(?:(\w+)|((?:(?!}%{2}).|\r?\n)*))?\s*(?:}%{2})?/gi;

// PERF: a bare leading `\s*` with the global flag re-scans every indent run from each position —
// O(whitespace²). On a deeply-indented diagram (huge3.mmd, 1.6k-space lines) this `.replace()` inside
// `detectType` / `preprocess` cost ~250ms. The `(?:^|(?<=\S))` guard makes the `\s*` run start only
// where a whitespace run begins (a line start, or right after a non-space), so it is attempted once
// per run instead of from every offset. Output is BYTE-IDENTICAL — it matches at the same positions —
// and drops huge3 from ~250ms to ~1.4ms. Equivalence + O(n) guard in regexes.spec.ts. Core mermaid,
// not chevrotain-specific (the jison path hits it too).
export const anyCommentRegex = /(?:^|(?<=\S))\s*%%.*\n/gm;
