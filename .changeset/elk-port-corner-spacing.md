---
'@mermaid-js/layout-elk': patch
---

fix: an edge no longer leaves a subgraph from the frame's corner.

`elk.spacing.portsSurrounding` was left at ELK's default of `0`, which permits a
port to sit exactly on a node's corner. A corner is the one boundary point with
no side to leave from, so the edge came out of the vertex and then ran ALONG the
frame's own edge before turning away from it. Subgraphs showed it first, because
an edge that crosses a subgraph boundary attaches to the frame rather than to a
node inside it, and a frame is large enough for the result to be obvious.

A margin is now reserved at the ends of every side, so ELK keeps ports off the
corners itself rather than the renderer correcting them afterwards. Over the
`elk-edge-cases` corpus this takes the fixtures with a corner endpoint from 8 of
30 down to 3.

The value is 12, chosen by measurement: it is the smallest that clears the
corner on that corpus. It is not a free parameter — 30 was tried and reorders
layers.
