---
'mermaid': patch
---

fix: sequence `box` keeps a valid color written in a non-canonical form (`Purple`, `rgb(33,66,99)`, `hsl(10, 40%, 90%)`) when `CSS.supports` is unavailable, as in JSDOM
