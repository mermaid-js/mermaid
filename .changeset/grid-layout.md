---
'mermaid': minor
---

feat: add a grid layout with configurable row and column placement, recursive subgraphs, alignment, and orthogonal edge routing

Flowchart subgraph metadata forwarded to layout engines is now limited to `row`, `column`, `horizontalAlign`, `verticalAlign`, and `algorithm`. Custom layouts registered through `registerLayoutLoaders` no longer receive other authored subgraph metadata fields.
