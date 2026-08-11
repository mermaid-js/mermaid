---
'mermaid': minor
---

feat: emit theme colors as CSS vars with fallbacks; add webCompatibility SVG normalize

Optional `cssVariableTheme` rewrites rendered theme colors to `var(--mermaid-<slot>, <fallback>)`. Optional `webCompatibility` normalizes SVG for responsive embedding. Background stripping is opt-in via `stripBackground`.
