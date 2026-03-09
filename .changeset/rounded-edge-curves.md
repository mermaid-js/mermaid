---
'mermaid': patch
'@mermaid-js/mermaid-layout-elk': patch
---

fix: use rounded right-angle edges for ELK layout

ELK layout edges now default to `rounded` curve (right-angle segments with rounded corners) instead of inheriting the global `basis` default. This fixes ELK edges that were curving instead of routing at right angles (#7213). Non-ELK layouts are unaffected and keep their existing `basis` default.
