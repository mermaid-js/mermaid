---
'mermaid': minor
'@mermaid-js/layout-elk': minor
---

feat: move ELK onto the shared layout renderer pipeline

ELK layout now uses the same prepare, measure, layout-core, and paint pipeline as the
built-in layout renderers. This keeps DOM measurement and SVG painting in the common
renderer while the ELK layout core operates on layout data, so edge paths, labels, markers,
styles, and shape intersections are handled consistently with the shared rendering flow.

This also exposes `elk.nodePlacementAlignment` for configuring Brandes-Koepf fixed
alignment. The default is `NONE`, preserving ELK's built-in alignment selection. Set it to
another supported value, such as `BALANCED` or `RIGHTDOWN`, to opt into a fixed ELK
alignment strategy.
