---
'mermaid': patch
---

fix: lay out disconnected parts of a flowchart side by side instead of on top of each other

A diagram containing several unconnected graphs could draw them overlapping,
because nothing in the layout constrained where one part sat relative to
another. Each connected part is now packed into its own area of the drawing,
which also removes the edge routing artefacts the overlap caused.
