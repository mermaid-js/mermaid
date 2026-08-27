---
'@mermaid-js/layout-elk': patch
---

fix: draw ELK subgraph frames an even distance from their contents.

A subgraph could sit 76px from its nodes on one side and 24px on the other, with nothing visible in the gap. ELK sizes a container around everything it put inside, edges included, and an edge that runs against the flow of the layout is routed back around the outside — so a group holding one grew on whichever side that edge left by, and a group without one did not.

The lane is real and the edge still needs it, so the space is not reclaimed. What changes is that the frame is no longer drawn around it: the frame is pulled in to an even distance from the group's own children, and the edge keeps its lane just outside, which is what an edge routed around a group should look like anyway.

The top is left as ELK set it, since it carries the subgraph's title strip and there is no way to tell how much of that padding is the title and how much is spare.

**Subgraphs render tighter, and groups that used to be visibly lopsided are now even.**
