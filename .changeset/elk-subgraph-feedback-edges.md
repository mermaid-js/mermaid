---
'mermaid': patch
---

fix: with the ELK layout, an edge from a node that a subgraph feeds back into that subgraph is routed downstream instead of around the subgraph. Set `elk.orientFeedbackEdges: false` to keep the previous routing.
