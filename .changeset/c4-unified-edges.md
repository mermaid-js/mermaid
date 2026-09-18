---
'mermaid': minor
---

feat(c4): render C4 relationships through the unified edge rendering

C4 relationships are drawn by mermaid's shared edge renderer instead of bespoke SVG: a dashed line with an arrowhead (both ends for `BiRel`) and a label carrying the relationship name, its optional `[technology]` and its description. `UpdateRelStyle`'s `$offsetX`/`$offsetY` still nudge the label and `$textColor`/`$lineColor` still recolour it. Element geometry is unchanged - the line runs between the two shapes' boundary intersection points, so it stays in the gap between boxes.
