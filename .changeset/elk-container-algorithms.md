---
'mermaid': minor
---

feat: let a container pick its own ELK algorithm with `@{ algorithm: … }`, and add `elk.box` and `elk.rectpacking` to the selectable `layout` values.

A subgraph carrying `@{ algorithm: elk.box }` is laid out with that algorithm in its own coordinate system instead of inheriting the diagram's. Supported values are `elk.layered`, `elk.box`, `elk.rectpacking`, `elk.stress`, `elk.force`, `elk.mrtree`, `elk.radial`, and `elk.sporeOverlap`; anything else is ignored with a warning rather than handed to ELK, where an unknown id would abort the layout. Containers with edges crossing their boundary fall back to the inherited algorithm, since isolated layout and cross-boundary edges are incompatible.

Also in this release:

- ELK cluster labels are measured unwrapped, so a compound node is sized to fit its label instead of to a 200px wrapping width. **This changes the size — and therefore the layout — of existing ELK diagrams that have labelled subgraphs.**
- `elk.box` and `elk.rectpacking` place nodes but never route edges. Edges they leave unrouted now fall back to a straight line between the two node centres instead of failing the render.
- `keepEntryNodeOnTop` pins a cycle's true entry rather than the first-declared node when a back-edge feeds the entry, so recursive flows read from where they actually start.
