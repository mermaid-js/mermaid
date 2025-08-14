---
'mermaid': patch
---

fix: fallback to raw text instead of rendering _Unsupported markdown_ or empty blocks

Instead of printing **Unsupported markdown: XXX**, or empty blocks when using a markdown feature
that Mermaid does not yet support when `htmlLabels: true`(default) or `htmlLabels: false`,
fallback to the raw markdown text.
