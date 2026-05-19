---
'@mermaid-js/layout-elk': patch
---

fix: propagate `elk.mergeEdges` config to subgraphs in ELK layout — previously edges defined inside a subgraph were not merged even when `elk.mergeEdges: true` was set
