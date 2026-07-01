---
'mermaid': minor
---

feat(flowchart): add `subGraphTitlePosition` for subgraph titles with an `auto` default

Flowchart subgraph titles can now be positioned via the new `flowchart.subGraphTitlePosition`
config. It accepts `top`, `top-left`, `top-right`, `bottom`, `bottom-left`, `bottom-right`, and
`auto` (the new default). `auto` keeps the title at the top-center but, when a routed edge would
cross it, moves it to the first free position in this order: `top` → `top-left` → `bottom` →
`bottom-left` → `top-right` → `bottom-right`, falling back to `top` if every position is blocked.

Diagrams whose subgraph titles are not crossed by an edge render unchanged. Resolves #2977.
