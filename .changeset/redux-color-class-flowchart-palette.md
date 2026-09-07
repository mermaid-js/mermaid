---
'mermaid': minor
---

feat(themes): class boxes and flowchart subgraph containers now take a per-item colour under the `redux-color` and `redux-dark-color` themes, cycling every 12 as ER entities already do. Collapsed subgraphs keep the slot they would have had expanded; nodes inside a subgraph stay uniform, and explicit `classDef` or `style` still wins over the palette.
