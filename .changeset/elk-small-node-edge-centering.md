---
'@mermaid-js/layout-elk': patch
---

fix: center edges attached to small nodes such as start/end state circles. ELK's ports-surrounding margin exceeded the side length of nodes narrower than 24px, parking the edge anchor off-center; such anchors are now discarded so the edge aims at the node center.
