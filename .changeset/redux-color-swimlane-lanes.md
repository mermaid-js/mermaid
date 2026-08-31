---
'mermaid': minor
---

feat(themes): swimlane lanes now take a per-lane colour under the `redux-color` and `redux-dark-color` themes, cycling every 12 as flowchart subgraph containers already do. The lane a diagram gets for its ungrouped nodes takes its own slot rather than sharing the first lane's, and it now also follows the diagram's `look` instead of always rendering classic. Explicit `style` on a lane still wins over the palette.
