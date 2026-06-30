---
'@mermaid-js/layout-elk': minor
'mermaid': minor
---

feat(elk): add `elk.keepEntryNodeOnTop` config option to keep a recursive flow's entry node on top

`elk.layered` must break cycles before it can rank nodes, and its default cycle-breaking heuristic is purely degree-based — it has no notion of an "entry point". So when a flow loops back on itself (a back-edge to an earlier node), the first-declared node could be ranked in the middle of the layout, scrambling the reading order and hiding where the flow starts.

The new opt-in `elk.keepEntryNodeOnTop` option (default `false`) detects the entry node of each recursive flow — grouped per container, ignoring self-loops, by finding weakly-connected components with no natural source — and pins it to the first layer with `elk.layered.layering.layerConstraint = FIRST`. Acyclic flows always have a natural source, so nothing is nominated and their layout is unchanged. With the option off (the default), all existing ELK-laid-out diagrams are unaffected.
