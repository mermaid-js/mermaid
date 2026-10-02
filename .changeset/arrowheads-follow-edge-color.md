---
'mermaid': patch
---

fix: flowchart arrowheads now follow the edge color

Arrow markers declare `fill: context-stroke` / `stroke: context-stroke`, so in browsers that support it (Chromium 119+, Firefox, Edge) arrowheads inherit the color of the edge they belong to, including colors applied through themes and CSS. For explicitly styled edges (`linkStyle`), the existing per-edge colored marker fallback now receives the color correctly (it was previously passed the whole `stroke:...` declaration), which also covers Safari.
