---
'mermaid': patch
---

fix(block): take the node border width from the theme, as every other diagram does.

`block/styles.ts` pinned `stroke-width: 1px` on node shapes while the flowchart, class and
state stylesheets all read `strokeWidth` from the theme. Under a theme that asks for more —
`neo` asks for 2 — a block rendered a visibly thinner border than an identical flowchart
node, and nothing downstream corrected it: the `neo` rules in the shared stylesheet set
`stroke` and `filter`, never `stroke-width`.

The gap was invisible until block began propagating `look` to its nodes, because until then
none of the look-specific rules applied to block at all.

Affects only themes whose `strokeWidth` is not 1. `neo` is 2; `neo-dark`, `base` and the
rest are unchanged.
