---
'mermaid': patch
---

fix: fallback to raw text instead of rendering _Unsupported markdown_

Instead of printing **Unsupported markdown: XXX** when using a markdown feature
that Mermaid does not yet support when `htmlLabels: true` (default),
fallback to the raw markdown text.
