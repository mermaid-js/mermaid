---
'mermaid': patch
---

fix(agentflow): redirect cross-boundary edges to the collapsed parent instead of dropping them. When a subgraph (or the synthesized `agentflow-connectors-group`) is collapsed, edges with one endpoint inside and one outside now terminate at the collapsed node. Edges whose endpoints both collapse to the same ancestor are still dropped (would otherwise be self-loops). Nested collapses redirect to the outermost collapsed ancestor.
