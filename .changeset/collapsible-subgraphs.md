---
'mermaid': minor
---

feat: add collapsible flowchart subgraphs via `subgraphId@{ view: collapsed }`

A subgraph annotated with `@{ view: collapsed }` now renders as a single compact node, its internal nodes are hidden, and edges crossing the subgraph boundary are redirected to the collapsed node. Resolves #7784.
