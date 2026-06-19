---
'mermaid': patch
---

Fix a `RangeError: Invalid array length` crash when rendering certain edges.
`generateDashArray` could compute a negative dash-gap pair count for a short edge
(whose length is below the combined start/end marker offsets) or a `NaN` count for
a degenerate path (where `getTotalLength()` returns `NaN`); either threw from
`Array(numberOfPairs)`. The count is now clamped to a non-negative, finite integer.
