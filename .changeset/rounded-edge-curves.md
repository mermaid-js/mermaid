---
'mermaid': minor
---

fix: replace smooth curve edges with rounded right-angle edges

The default flowchart edge curve changes from `basis` (smooth splines) to `rounded` (right-angle segments with rounded corners). This fixes ELK layout edges that were curving instead of routing at right angles (#7213) and applies consistently across all diagram types using the shared rendering pipeline.

To restore the previous smooth curve behavior, set `flowchart.curve: 'basis'` in your config.
