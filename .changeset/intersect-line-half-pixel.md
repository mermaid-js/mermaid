---
'mermaid': patch
---

fix: edges attach to non-rectangular shapes on the outline instead of half a pixel off it.

**This is not ELK-specific.** `intersectPolygon` is how every non-rectangular shape finds its edge attachment — diamond, stadium, hexagon, trapezoid, subroutine — in every layout, so a dagre-rendered flowchart with a decision diamond is affected exactly as much as an ELK one.

`intersectLine` comes from Graphics Gems, where the coordinates were integers and the numerator was nudged half a denominator away from zero so the integer division rounded instead of truncating. JavaScript division does neither, so the nudge stopped being a correction and became the whole error: every result came back displaced by `0.5 * sign(num) * sign(denom)`. The magnitude is always exactly half a unit, but the sign is per axis, because the numerator is computed separately for x and y while the denominator is shared — so the two axes could move the same way or opposite ways depending on the geometry, which is why it never looked like a constant offset anyone could spot by eye.

That was enough to give an otherwise orthogonal edge a tiny diagonal opening segment, and to put an attachment just inside the node it was meant to touch.

`question.ts` had been subtracting a flat 0.5 from both axes to compensate for diamonds. That only cancelled the bias when both signs came out positive, and doubled the error to a full unit when they did not — so the compensation goes along with the cause. **Rendered output moves by up to a pixel wherever a polygon shape terminates an edge.**
