---
'mermaid': patch
---

fix: Stop an edge from a node inside a subgraph from crossing an edge from the subgraph itself to the same node with ELK 0.10+ (e.g. `outer --> a` with `da --> a`, or `three --> two` with `two --> c2`)
