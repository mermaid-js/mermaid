---
'mermaid': patch
---

fix(c4): honour the root `wrap` option in C4 diagrams and apply the wrap setting to relationship labels, so `wrap: false` or `c4.wrap: false` stops both element and relationship labels from wrapping. When both are set, the root `wrap` wins.
