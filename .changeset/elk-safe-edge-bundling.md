---
'@mermaid-js/layout-elk': minor
---

fix: `elk.mergeEdges` no longer lets a diagram show a connection that does not exist.

Bundling used to be handed to ELK's own `elk.layered.mergeEdges`, which collapses a node's edges onto one handle per side — arriving and leaving alike. Given

```
flowchart LR
  A --> B & C & D
  C --> A
  F --> A
  D --> A
```

every one of A's edges attached at the same point on its east border, under a double-headed arrow. There is no edge between B and A, but the picture read as though there were: B hung off the same handle the incoming trunk arrived at. A reader could not tell which of A's neighbours were connected in which direction.

Bundling is now done by giving each node one port for arriving edges and another for leaving ones. Edges that share a port still share a trunk, so the reason to turn the option on is unchanged, but the two roles get separate handles and the arrows say what they mean. `elk.layered.mergeEdges` is never enabled, at the root or in a subgraph.

One trade-off comes with it: a node has a single handle per role, so an edge arriving from the opposite side of a node may take a longer route to reach it than it did before.
