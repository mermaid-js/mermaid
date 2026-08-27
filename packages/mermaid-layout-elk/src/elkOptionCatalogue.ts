/**
 * A catalogue of the ELK options that affect layout, with every valid value
 * listed and one line saying what it does.
 *
 * NOT IMPORTED ANYWHERE, on purpose. It is a reference to copy from, not code
 * that runs: paste an entry into `createRootElkGraph`'s `layoutOptions` (or into
 * `buildSubgraphLayoutOptions` for the container-scoped ones), compare renders,
 * then take it back out.
 *
 * Two things to know before reading a result:
 *
 * - Options set on the ROOT graph do not reach subgraphs. Containers get their
 *   own set from `buildSubgraphLayoutOptions`, so `spacing.*`, `elk.padding` and
 *   `nodeLabels.placement` have to be changed there to affect anything inside a
 *   frame. Several of these were measured as "no effect" until they were moved.
 * - Anything here that names a key already wired to `config.elk.*` silently
 *   disables that config for every diagram while it is live. `elk.cycleBreakingStrategy`
 *   was dead this way, and it took a bisect against the raw ELK option to spot.
 */

export const PLACEMENT_OPTIONS: Record<string, unknown> = {
  // ─── Layering — which layer a node lands in (the column in LR, row in TB) ───
  // Coarsest placement decision there is; relocates 38-48% of nodes.
  // 'elk.layered.layering.strategy': 'COFFMAN_GRAHAM',
  // 'elk.layered.layering.strategy': 'NETWORK_SIMPLEX',      // ELK default: fewest long edges *
  // 'elk.layered.layering.strategy': 'LONGEST_PATH',         // every node as late as possible
  // 'elk.layered.layering.strategy': 'LONGEST_PATH_SOURCE',  // same, measured from sources
  // 'elk.layered.layering.strategy': 'MIN_WIDTH',            // narrower drawing, longer edges
  // 'elk.layered.layering.strategy': 'STRETCH_WIDTH',        // wider drawing, shorter edges
  // 'elk.layered.layering.strategy': 'INTERACTIVE',          // honours positions already on nodes
  // Cap on how many nodes COFFMAN_GRAHAM puts in one layer; ignored by the rest.
  // 'elk.layered.layering.coffmanGraham.layerBound': 2,
  // 'elk.layered.layering.coffmanGraham.layerBound': 4,      // ELK default; taller and narrower
  // Pulls nodes into earlier layers to cut dummy nodes on long edges.
  // 'elk.layered.layering.nodePromotion.strategy': 'NONE',   // ELK default
  // 'elk.layered.layering.nodePromotion.strategy': 'NIKOLOV',
  // 'elk.layered.layering.nodePromotion.strategy': 'NIKOLOV_PIXEL',
  // 'elk.layered.layering.nodePromotion.strategy': 'NIKOLOV_IMPROVED',
  // 'elk.layered.layering.nodePromotion.strategy': 'NIKOLOV_IMPROVED_PIXEL',
  // 'elk.layered.layering.nodePromotion.strategy': 'DUMMYNODE_PERCENTAGE',
  // 'elk.layered.layering.nodePromotion.strategy': 'NODECOUNT_PERCENTAGE',
  // 'elk.layered.layering.nodePromotion.strategy': 'NO_BOUNDARY',
  // ─── Crossing minimisation — the order of nodes within a layer ───
  // How node order inside each layer is chosen.
  // 'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',  // ELK default
  //'elk.layered.crossingMinimization.strategy': 'INTERACTIVE',  // keeps existing order
  // 'elk.layered.crossingMinimization.strategy': 'NONE',         // declaration order, no sweep
  // Extra pass that swaps adjacent node pairs when it removes crossings.
  // 'elk.layered.crossingMinimization.greedySwitch.type': 'TWO_SIDED',  // ELK default
  // 'elk.layered.crossingMinimization.greedySwitch.type': 'ONE_SIDED',
  // 'elk.layered.crossingMinimization.greedySwitch.type': 'OFF',
  // How hard declaration order is defended against crossing reduction.
  // 'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
  // 'elk.layered.considerModelOrder.strategy': 'NONE',          // ignore declaration order
  // 'elk.layered.considerModelOrder.strategy': 'PREFER_EDGES',  // order edges, let nodes move
  // 'elk.layered.considerModelOrder.strategy': 'PREFER_NODES',  // order nodes, let edges move
  // ─── Node placement — the coordinate within the layer ───
  // Wired to `elk.nodePlacementStrategy`; uncomment to override that config.
  // 'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',  // our default: balanced
  // 'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',    // ELK default: straight long edges
  // 'elk.layered.nodePlacement.strategy': 'LINEAR_SEGMENTS',  // keeps chains aligned
  // 'elk.layered.nodePlacement.strategy': 'SIMPLE',           // cheapest, least tidy
  // Shifts nodes to straighten edges rather than centre them in the layer.
  // 'elk.layered.nodePlacement.favorStraightEdges': true,
  // 'elk.layered.nodePlacement.favorStraightEdges': false,
  // Brandes-Koepf only: which of its four candidate alignments to keep.
  // 'elk.layered.nodePlacement.bk.fixedAlignment': 'NONE',      // pick the shortest result
  // 'elk.layered.nodePlacement.bk.fixedAlignment': 'BALANCED',  // average all four
  // 'elk.layered.nodePlacement.bk.fixedAlignment': 'LEFTUP',
  // 'elk.layered.nodePlacement.bk.fixedAlignment': 'RIGHTUP',
  // 'elk.layered.nodePlacement.bk.fixedAlignment': 'LEFTDOWN',
  // 'elk.layered.nodePlacement.bk.fixedAlignment': 'RIGHTDOWN',
  // Brandes-Koepf only: post-pass that trades compactness for straighter edges.
  // 'elk.layered.nodePlacement.bk.edgeStraightening': 'IMPROVE_STRAIGHTNESS',
  // 'elk.layered.nodePlacement.bk.edgeStraightening': 'NONE',   // ELK default
  // Network-simplex only: what the placer is allowed to stretch to straighten edges.
  // 'elk.layered.nodePlacement.networkSimplex.nodeFlexibility': 'NONE',  // ELK default
  // 'elk.layered.nodePlacement.networkSimplex.nodeFlexibility': 'NODE_SIZE',
  // 'elk.layered.nodePlacement.networkSimplex.nodeFlexibility': 'PORT_POSITION',
  // 'elk.layered.nodePlacement.networkSimplex.nodeFlexibility': 'NODE_SIZE_WHERE_SPACE_PERMITS',
  // ─── Cycles and hierarchy ───
  // Which edges get reversed to make the graph acyclic; decides which ones detour.
  // Wired to `elk.cycleBreakingStrategy`; uncomment to override that config.
  // 'elk.layered.cycleBreaking.strategy': 'GREEDY_MODEL_ORDER',  // our default
  // 'elk.layered.cycleBreaking.strategy': 'GREEDY',              // ELK default; short back edges, +20% total
  // 'elk.layered.cycleBreaking.strategy': 'DEPTH_FIRST',         // middle ground, +6% total
  // 'elk.layered.cycleBreaking.strategy': 'MODEL_ORDER',         // reverse purely by declaration order
  // 'elk.layered.cycleBreaking.strategy': 'INTERACTIVE',         // reverse by existing positions
  // Whether subgraphs are laid out with the parent or in their own coordinate system.
  // 'elk.hierarchyHandling': 'INCLUDE_CHILDREN',   // our default, one global pass
  // 'elk.hierarchyHandling': 'SEPARATE_CHILDREN',  // shorter edges, far more constraint violations
  // Post-pass that pulls nodes back towards one side to reclaim space.
  // 'elk.layered.compaction.postCompaction.strategy': 'NONE',   // ELK default
  // 'elk.layered.compaction.postCompaction.strategy': 'LEFT',
  // 'elk.layered.compaction.postCompaction.strategy': 'RIGHT',
  // 'elk.layered.compaction.postCompaction.strategy': 'LEFT_RIGHT_CONSTRAINT_LOCKING',
  // 'elk.layered.compaction.postCompaction.strategy': 'LEFT_RIGHT_CONNECTION_LOCKING',
  // 'elk.layered.compaction.postCompaction.strategy': 'EDGE_LENGTH',
  // ─── Spacing and labels ───
  // Base spacing everything else derives from; the single biggest lever on size.
  // 'spacing.baseValue': 40,
  // 'spacing.baseValue': 20,   // ELK default — collapses this corpus, 13/14 invalid
  // Where a container's own title sits inside its frame.
  // 'nodeLabels.placement': '[H_CENTER V_TOP, INSIDE]',
  // ─── Measured inert on this corpus — a null result here means nothing ───
  // Overwritten straight after createRootElkGraph by the diagram's own direction.
  // 'elk.direction': 'UP',
  // ELK ignores this key in every spelling; the gap derives from spacing.baseValue.
  // 'elk.spacing.edgeNode': 20,
  // Only applies when wrapping.strategy is on, and it is off.
  // 'elk.layered.wrapping.cutting.strategy': 'ARD',
  // Routes reversed edges in their own band. No effect measured here.
  // 'elk.layered.feedbackEdges': true,
  // ─── Tried and parked ───
  // 'elk.layered.wrapping.strategy': 'MULTI_EDGE',
  // 'elk.layered.wrapping.strategy': 'SINGLE_EDGE',
  // 'elk.layered.crossingMinimization.semiInteractive': true,
  // 'elk.layered.edgeRouting.splines.sloppy.layerSpacingFactor': 1,
  // 'elk.layered.edgeRouting.polyline.slopedEdgeZoneWidth': 4.0,
  // 'elk.layered.wrapping.validify.strategy': 'LOOK_BACK',
  // 'elk.insideSelfLoops.activate': true,
  // 'elk.separateConnectedComponents': true,
  // 'elk.alignment': 'LEFT',
};

/**
 * Scratch overrides for edge ROUTING. MUST be empty on `develop`, same as
 * {@link TEST_OVERRIDES}, and spread after it so these win.
 *
 * Routing decides how an edge is drawn between the layers it was already
 * assigned to. It cannot change which way round the graph an edge travels — a
 * long detour is a back edge, and that is settled in cycle breaking and
 * layering, both of which live in `TEST_OVERRIDES`.
 *
 * Everything here is commented out, so the block is inert until something is
 * enabled. The routing options actually in force ship in the literal below:
 * `edgeRouting.selfLoopDistribution`, `unnecessaryBendpoints` and
 * `mergeHierarchyEdges`.
 */
export const EDGE_ROUTING_OPTIONS: Record<string, unknown> = {
  // Shape of every edge. ORTHOGONAL is ELK's default and what the adapter expects.
  // 'elk.edgeRouting': 'ORTHOGONAL',
  // 'elk.edgeRouting': 'POLYLINE',   // diagonal runs, fewer bends
  // 'elk.edgeRouting': 'SPLINES',    // curved; validateLayout treats these as non-orthogonal
  // 'elk.edgeRouting': 'UNDEFINED',  // let the algorithm decide

  // Drops bends that do not change the path. Already on in the literal below.
  // 'elk.layered.unnecessaryBendpoints': true,
  // 'elk.layered.unnecessaryBendpoints': false,

  // Routes reversed edges in their own band instead of among the forward ones.
  // The obvious candidate for a back-edge detour — measured inert on this corpus.
  // 'elk.layered.feedbackEdges': true,
  // 'elk.layered.feedbackEdges': false,

  // Lets edges that meet at a node share a trunk. Collapses arriving and leaving
  // onto ONE handle, which can imply a connection that does not exist.
  // 'elk.layered.mergeEdges': true,
  // 'elk.layered.mergeEdges': false,

  // Same, for edges that cross a subgraph boundary. On in the literal below.
  // 'elk.layered.mergeHierarchyEdges': true,
  // 'elk.layered.mergeHierarchyEdges': false,

  // How much straightening an edge is worth relative to other objectives.
  // Also settable per edge, which is the targeted way to rescue one bad route.
  // 'elk.layered.priority.straightness': 0,
  // 'elk.layered.priority.shortness': 0,
  // 'elk.layered.priority.direction': 1,

  // ─── Self loops ───

  // Which sides a node's self loops are spread across. EQUALLY ships below.
  // 'elk.layered.edgeRouting.selfLoopDistribution': 'EQUALLY',
  // 'elk.layered.edgeRouting.selfLoopDistribution': 'NORTH',
  // 'elk.layered.edgeRouting.selfLoopDistribution': 'NORTH_SOUTH',

  // Whether stacked self loops nest or sit side by side.
  // 'elk.layered.edgeRouting.selfLoopOrdering': 'STACKED',
  // 'elk.layered.edgeRouting.selfLoopOrdering': 'SEQUENCED',

  // Draw self loops inside the node rather than hanging off it.
  // 'elk.insideSelfLoops.activate': true,

  // ─── Spline and polyline tuning (only read by the matching edgeRouting) ───

  // How closely splines hug the orthogonal path they replace.
  // 'elk.layered.edgeRouting.splines.mode': 'CONSERVATIVE',
  // 'elk.layered.edgeRouting.splines.mode': 'CONSERVATIVE_SOFT',
  // 'elk.layered.edgeRouting.splines.mode': 'SLOPPY',
  // 'elk.layered.edgeRouting.splines.sloppy.layerSpacingFactor': 1,

  // Width of the band a POLYLINE edge may slope through.
  'elk.layered.edgeRouting.polyline.slopedEdgeZoneWidth': 4.0,

  // ─── Lanes and clearance ───

  // Gap between two edges sharing a lane; too small trips the proximity checks.
  // 'spacing.edgeEdge': 10,
  // 'elk.layered.spacing.edgeEdgeBetweenLayers': 20,

  // Gap between an edge and a node it passes. Ignored at root; the subgraph
  // value derives from `spacing.baseValue` at roughly half.
  // 'spacing.edgeNode': 20,
  // 'elk.layered.spacing.edgeNodeBetweenLayers': 80,

  // ─── Edge labels ───

  // Which side of its edge a label sits on.
  // 'elk.layered.edgeLabels.sideSelection': 'SMART_DOWN',
  // 'elk.layered.edgeLabels.sideSelection': 'SMART_UP',
  // 'elk.layered.edgeLabels.sideSelection': 'ALWAYS_UP',
  // 'elk.layered.edgeLabels.sideSelection': 'ALWAYS_DOWN',
  // 'elk.layered.edgeLabels.sideSelection': 'DIRECTION_UP',
  // 'elk.layered.edgeLabels.sideSelection': 'DIRECTION_DOWN',

  // Which layer a centre label is parked in when the edge spans several.
  // 'elk.layered.edgeLabels.centerLabelPlacementStrategy': 'MEDIAN_LAYER',
  // 'elk.layered.edgeLabels.centerLabelPlacementStrategy': 'HEAD_LAYER',
  // 'elk.layered.edgeLabels.centerLabelPlacementStrategy': 'TAIL_LAYER',
  // 'elk.layered.edgeLabels.centerLabelPlacementStrategy': 'SPACE_EFFICIENT_LAYER',
  // 'elk.layered.edgeLabels.centerLabelPlacementStrategy': 'WIDEST_LAYER',
  // 'elk.layered.edgeLabels.centerLabelPlacementStrategy': 'CENTER_LAYER',
};
