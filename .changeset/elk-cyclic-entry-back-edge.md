---
'@mermaid-js/layout-elk': patch
---

fix: `keepEntryNodeOnTop` now pins the cycle's true entry instead of the first-declared node when a back-edge feeds the entry. Source-less cyclic components break cycles greedily in edge declaration order and nominate the first remaining source, so recursive flows read from where they actually start.
