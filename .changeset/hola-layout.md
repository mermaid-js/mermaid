---
'mermaid': minor
---

feat: add the HOLA layout algorithm, selectable with `layout: hola`

HOLA ("human-like orthogonal layout") decomposes a graph into a core plus the trees hanging off it, lays each out separately, then routes every edge orthogonally with A\* pathfinding. It aims at the shape a person would draw by hand: aligned rows and columns, few bends, and edges that turn at right angles.

```
---
config:
  layout: hola
---
flowchart TB
  A --> B
  A --> C
  B --> D
  C --> D
```

Labelled edges reserve their space up front — each one is split into `start → label → end` around a dummy node that is measured with the rest of the graph — so a label never lands on top of an edge or a node. Subgraphs, self-loops and parallel edges each have their own routing treatment.

`hola.removeCycles` (default `true`) controls whether cycles are broken before the decomposition and restored afterwards. Existing diagrams are unaffected: the layout only runs when it is explicitly selected.
