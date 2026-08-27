---
'mermaid': minor
---

feat(themes): class diagrams and flowchart subgraphs pick up the per-item colour palette under the `redux-color` and `redux-dark-color` themes.

Until now only ER, sequence, git and requirement diagrams read the colour themes' `borderColorArray` / `bkgColorArray`. Class boxes and flowchart subgraph containers rendered in a single uniform colour under those themes.

- **Class diagrams** — each class gets its own border and fill from the palette, cycling every 12, exactly as ER entities do. A class box is the structural twin of an ER entity (a titled box with member rows naming one distinct participant), so the same index-based palette applies. Namespaces and notes stay outside the cycle: a namespace is a container, and a note carries the theme's fixed note colour.
- **Flowchart subgraphs** — each subgraph container gets its own border and fill. Nodes _inside_ the subgraph are deliberately left uniform: a flowchart node is a step in a flow rather than a distinct participant, and node colour is already how `classDef` / `style` convey meaning.

Subgraph colours follow declaration order and are stable across collapse: a subgraph carrying `@{ view: collapsed }` keeps its slot, so collapsing one does not reshuffle the others.

Explicit user styling continues to win over the palette. `classDef` and `style` declarations are applied as inline `style` attributes and none of the new rules are `!important`, so `style MySubgraph fill:#00ff00` still paints the container green.

Other themes are unaffected — the new rules are emitted only for `redux-color` and `redux-dark-color`.
