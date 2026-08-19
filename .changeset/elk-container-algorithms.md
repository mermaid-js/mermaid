---
'@mermaid-js/layout-elk': minor
---

feat: let a container pick its own ELK algorithm with `@{ algorithm: … }`, and add `elk.box` and `elk.rectpacking` to the selectable `layout` values.

A subgraph carrying `@{ algorithm: elk.box }` is laid out with that algorithm in its own coordinate system instead of inheriting the diagram's. Supported values are `elk.layered`, `elk.box`, `elk.rectpacking`, `elk.stress`, `elk.force`, `elk.mrtree`, `elk.radial`, and `elk.sporeOverlap`; anything else is ignored with a warning rather than handed to ELK, where an unknown id would abort the layout. Containers with edges crossing their boundary fall back to the inherited algorithm, since isolated layout and cross-boundary edges are incompatible.

Also in this release:

- `elk.layered.mergeEdges` and `nodePlacement.strategy` now apply to every subgraph. They were previously scoped to subgraphs with an explicit direction, so subgraphs without one — the common case — silently lost edge merging and node alignment. **This changes the layout of existing diagrams that use ELK with subgraphs.**
- ELK cluster labels are measured unwrapped, so a compound node is sized to fit its label.
- `keepEntryNodeOnTop` pins a cycle's true entry rather than the first-declared node when a back-edge feeds the entry, so recursive flows read from where they actually start.
