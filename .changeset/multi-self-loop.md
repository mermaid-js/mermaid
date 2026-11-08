---
'mermaid': patch
---

fix(flowchart, stateDiagram): draw every self-loop on a node instead of only the last one

A node with several self-loops (e.g. two `Ready --> Ready` transitions with different labels)
only rendered one arc. The dummy nodes and edges the DAGRE self-loop workaround creates were
named after the node alone, so each additional loop overwrote the previous loop's segments in
the graph and only the last one survived to rendering.

The dummy ids now derive from the edge id, so every self-loop keeps its own segments. Loops
that land on the same side of the node are nested: each extra loop reaches past the label of
the loop inside it and is wide enough for its legs to pass beside that label, so arcs and
labels don't overlap.
