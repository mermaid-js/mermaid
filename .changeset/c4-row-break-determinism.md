---
'mermaid': minor
---

fix(c4): break C4 rows on `c4ShapeInRow` alone, not on the viewer's display width

A C4 row used to end when the next element would cross a pixel budget seeded from
`screen.availWidth`, so the same diagram laid out differently depending on the monitor it
was rendered on - and rendered as a single column under jsdom, where `availWidth` is 0. Rows
now end after `c4ShapeInRow` elements (default 4) however wide those elements measure, so the
layout is a function of the diagram and its config alone.

This changes the rendered output of existing C4 diagrams: where a narrow display previously
forced 2 or 3 elements per row, a row now holds up to `c4ShapeInRow`, making diagrams wider
and shorter. Nesting no longer shrinks the budget either, so elements inside boundaries are
no longer stacked one per row. `UpdateLayoutConfig($c4ShapeInRow=...)` above 4 is now
honoured instead of being silently capped by the pixel budget.
