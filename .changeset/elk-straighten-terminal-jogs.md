---
'@mermaid-js/layout-elk': patch
---

fix: an edge no longer leaves a node with a tiny kink.

ELK spreads an edge's port evenly along a node's side, then routes the edge down a channel whose row rarely lines up with that port exactly. The leftover is a staircase of a few pixels right at the border: leave the port, run a short distance, step perpendicular onto the channel, carry on. With rounded corners the two micro-bends sit on top of each other and read as a glitch — one edge in the sample corpus stepped 3.25px and rendered as two quadratic curves with a zero-length segment between them.

The step is now removed by moving the channel onto the port's row, so the edge draws as one straight line and **both ports stay exactly where the layout put them** — sliding an attachment along a node's border leaves a node whose other edges are still evenly spread looking lopsided. Only a step next to a node is touched, and only when it is small and the edge continues the same way afterwards, so a real turn is never collapsed. An edge is left alone entirely when moving its run would drag the far port, or would buy a crossing.

Set `elk.straightenEdges: false` to keep the previous behaviour.
