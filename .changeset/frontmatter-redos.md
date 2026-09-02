---
'mermaid': patch
---

perf(frontmatter): replace the quadratic front matter regex on hot paths

`frontMatterRegex` backtracks polynomially on whitespace-heavy input, so a
diagram well inside the default `maxTextSize` could stall parsing for over a
second. `detectType` and `extractFrontMatter` now use a linear scanner that
matches the regex result exactly, leaving no document stripped differently.
