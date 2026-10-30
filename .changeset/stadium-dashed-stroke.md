---
'mermaid': patch
---

fix(flowchart): stroke-dasharray now applies to the straight sides of stadium nodes. The default (non hand-drawn) stadium is rendered as a single SVG path instead of rough.js segments, and user styles are merged with compiled node styles instead of being overwritten.
