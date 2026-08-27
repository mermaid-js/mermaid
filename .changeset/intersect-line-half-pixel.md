---
'mermaid': patch
---

fix: edges attach to non-rectangular shapes on the outline instead of half a pixel off it.

`intersectLine` comes from Graphics Gems, where the coordinates were integers and `denom / 2` was added to the numerator so the integer division rounded instead of truncating. JavaScript division does neither, so the term was never a rounding correction: `(num + denom / 2) / denom` is `num / denom + 0.5`. Every intersection came back displaced half a unit on both axes.

`intersectPolygon` is how every non-rectangular shape finds its edge attachment — diamond, stadium, hexagon, trapezoid, subroutine — so a vertical ray leaving a node's bottom border returned a point half a pixel to the right of it and half a pixel below it. Enough to give an otherwise orthogonal edge a tiny diagonal opening segment, and, when the ray pointed the other way, to put the attachment just inside the node it was meant to touch.

`question.ts` had been subtracting the 0.5 back off for diamonds; that compensation is removed along with the cause. **Rendered output moves by half a pixel wherever a polygon shape terminates an edge.**
