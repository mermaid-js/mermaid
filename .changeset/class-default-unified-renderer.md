---
'mermaid': minor
---

feat: route `classDiagram` to the unified (v2) renderer by default

`class.defaultRenderer` now defaults to `dagre-wrapper`, so plain `classDiagram`
documents (without the `-v2` suffix) render through the unified renderer and the
shared dagre layout/paint pipeline instead of the legacy class renderer. Set
`class: { defaultRenderer: 'dagre-d3' }` in the config to restore the legacy
renderer. Self-referential edges in class and ER diagrams now render as compact
merged self-loops.
