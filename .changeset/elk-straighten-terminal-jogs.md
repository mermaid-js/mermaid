---
'@mermaid-js/layout-elk': patch
---

fix: an edge no longer leaves a node with a tiny kink.

ELK spreads an edge's port evenly along a node's side, then routes the edge down a channel whose row rarely lines up with that port exactly. The leftover is a staircase of a few pixels right at the border: leave the port, run a short distance, step perpendicular onto the channel, carry on. With rounded corners the two micro-bends sit on top of each other and read as a glitch — one edge in the sample corpus stepped 3.25px and rendered as two quadratic curves with a zero-length segment between them.

The endpoint now moves onto the channel row — still on the node's border — and the step is dropped, so the edge draws as one straight line. Only the step next to a node is touched, only when it is small, and only when the edge continues the same way afterwards, so a real turn is never collapsed and the rest of the route is untouched.

Set `elk.straightenEdges: false` to keep the previous behaviour.
