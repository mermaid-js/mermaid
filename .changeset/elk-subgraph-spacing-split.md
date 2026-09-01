---
'@mermaid-js/layout-elk': patch
---

fix: stop ELK subgraphs padding one side more than the other.

A subgraph could end up with far more space on one side than the other for no reason a reader could see — 74px on the right of one group against 24px everywhere else. The extra space was a routing lane held open for an edge that runs against the flow of the layout and has to be routed back around, and its width came from `spacing.baseValue`.

That base value was doing two jobs at once. Every unset ELK spacing derives from it, so it had to stay large enough that an edge got a straight run before the node it enters — below about 40 the approach came out shorter than the arrowhead and the turn read as happening underneath it. But an edge routed down the inside of a frame claims a lane the same width, so paying for the approach out of the base value also pushed groups clear of their own borders.

The two are now bought separately. The base value drops to 24, and the approach run, node separation and edge separation are set explicitly, so edges keep the run they had without the frame paying for it.

`elk.layered.spacing.edgeNodeBetweenLayers` is the key that buys the approach. An earlier attempt used `elk.layered.spacing.edgeEdgeBetweenLayers`, which is edge-to-edge and a different quantity, and a note in the source concluded from it that ELK ignored edge-node spacing "in every key form". It does not; that note was wrong and is corrected.

Subgraph contents also gain `PORT_POSITION` node flexibility, which lets a node shift so an edge can leave straight rather than bending off the port. (Their placement strategy is covered in the `elk.preset` note.)

**Existing diagrams with subgraphs will render differently** — groups get tighter and more even.
