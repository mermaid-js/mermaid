---
'mermaid': minor
---

feat: add the `elk.orientFeedbackEdges` option, enabled by default. With the ELK layout, an edge from a node that a subgraph feeds back into that subgraph is now routed downstream instead of around the subgraph. This changes the layout of existing ELK diagrams that contain such edges; set `elk.orientFeedbackEdges: false` to keep the previous routing.
