---
'mermaid': patch
---

fix(flowchart): render nested subgraphs with numeric ids without dagre rank crash. The dagre extractor now reorders nodes only when an actual parent-before-child violation is detected, so class, state, and other dagre-laid-out diagrams keep their existing iteration order and layout. Applied in both the legacy `dagre-wrapper` and the current `rendering-util/layout-algorithms/dagre` paths. (#7609)
