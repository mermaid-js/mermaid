---
'mermaid': patch
---

feat: layout validation catches an edge that passes through another edge's attachment point.

An edge that has nothing to do with a node, but runs through the exact spot where some other edge attaches to it, is read as leaving that node — a reader cannot tell a line that touches a node from one that starts there. The diagram then shows a connection its source never declared.

It shows up when edges are bundled: a trunk from an upstream node brushes past a node on its way, and its continuation beyond that point looks like the node's own outgoing edge. The bundle checks cannot see it, because they only ask whether the bundled edges share a source and travel the same way — not what happens after they split.

Reported as `edge-passes-node-attachment`, hard, within the same tolerance two attachment points must already differ by. It is narrow on purpose: passing _near_ a node is `edge-border-hugging`'s business, and this only fires on coinciding with a real attachment point. No fixture in the existing corpora trips it.
