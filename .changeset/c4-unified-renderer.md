---
'mermaid': minor
---

feat(c4): opt-in unified renderer for C4 diagrams via the `c4.useUnifiedRenderer` config flag. C4 diagrams can now be laid out by a real layout algorithm (dagre by default, ELK via `@mermaid-js/layout-elk`) instead of the legacy statement-order grid, with a new `c4-person` shape for Person elements. The legacy renderer remains the default; existing diagrams are unaffected.
