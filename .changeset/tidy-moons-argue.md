---
'mermaid': minor
---

feat: add `flowchart.nodeGroupClearance` to configure the minimum gap between a node and a subgraph frame it does not belong to

Defaults to 20. A node closer than this to a foreign subgraph border reads as though it belongs to that subgraph and leaves no corridor for an edge to route between the two. The value is now read from configuration by both the layout validation and the passes that space nodes off group frames, so the gap that is enforced and the gap that is checked are the same number by construction.
