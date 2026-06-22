// Match Jekyll-style front matter blocks (https://jekyllrb.com/docs/front-matter/).
// Based on regex used by Jekyll: https://github.com/jekyll/jekyll/blob/6dd3cc21c40b98054851846425af06c64f9fb466/lib/jekyll/document.rb#L10
// Note that JS doesn't support the "\A" anchor, which means we can't use
// multiline mode.
// Relevant YAML spec: https://yaml.org/spec/1.2.2/#914-explicit-documents
// The \1 backreference anchors closing `---` to the same indent as the opening one, guards against indented `---` inside multi-line YAML scalars (#7613).
export const frontMatterRegex = /^([^\S\n\r]*)-{3}\s*[\n\r](.*?)[\n\r]\1-{3}\s*[\n\r]+/s;

export const directiveRegex =
  /%{2}{\s*(?:(\w+)\s*:|(\w+))\s*(?:(\w+)|((?:(?!}%{2}).|\r?\n)*))?\s*(?:}%{2})?/gi;

// `(?:^|(?<=\S))` only lets the greedy leading `\s*` start where a whitespace run actually begins
// (string/line start, or right after a non-whitespace char). Without it, the global match retries
// `\s*` from every position inside an indent, re-scanning the run each time — O(whitespace²), which
// makes a deeply-indented diagram (1.6k-space lines) cost ~250ms here. The guard makes it O(n) while
// matching at the exact same positions, so the stripped output is byte-identical (see regexes.spec.ts).
// Note: the `(?<=\S)` lookbehind requires a modern engine (Chrome 62+, Firefox 78+, Safari 16.4+,
// Node 9+); this preprocessing runs for every diagram, so on an engine without lookbehind support it
// would throw a module-load SyntaxError. That's well within the project's supported runtimes.
export const anyCommentRegex = /(?:^|(?<=\S))\s*%%.*\n/gm;
