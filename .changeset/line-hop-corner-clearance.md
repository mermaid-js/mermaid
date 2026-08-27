---
'mermaid': patch
---

fix: don't draw a line hop that has no room next to a bend.

A crossing close to a corner used to get a hop squeezed into whatever space was left — as little as 2.9px against a requested 6px, opening exactly on the corner's tangent point. At that size the arc no longer clears the line it is meant to hop, so the two strokes still touch and the corner's curve runs straight into the arc's. It reads as a rendering fault rather than as a crossing.

Hops now keep a straight run clear of the bend, and one that would still have to shrink below 60% of the requested radius is dropped instead of drawn. An undrawn hop is an ordinary crossing, which is a much better failure than a broken-looking one.

**This changes swimlane diagrams as well as ELK ones.** Swimlanes are the existing consumer of line hops and have them on today, so a swimlane with a crossing near a bend will render differently even for someone not using ELK at all. It shows up wherever a layout stacks edges in narrow lanes: ELK routes subgraph-internal edges 10px apart, and 10px does not hold a 7.07px corner cut plus a 6px hop.

A crossing is also ignored now when it lands inside the stretch where either edge is rounding a bend. Crossings are found on polylines, but a rounded edge is not drawn as its polyline — it leaves the line up to 7.07px before each bend and rejoins it that far after. A crossing found inside that stretch is somewhere the stroke never goes, so the hop was arching over blank paper while the two lines carried on touching beside it.
