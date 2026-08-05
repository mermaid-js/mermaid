# HOLA `orthogonal-routing`

This folder implements **orthogonal edge routing** for the `hola` layout: given node positions (already computed by core/tree layout) and per-edge **connection points** on node sides, it computes **axis-aligned (Manhattan) polyline paths** for edges that:

- Avoid node bodies (and optionally keep clearance from them)
- Avoid or reduce overlap with already-routed edge segments
- Minimize bends and crossings when possible
- Handle special cases like **self-loops**
- Optionally apply **crossing curves** to make crossings visually clearer
- Optionally nudge paths away from **subgraph (group) boundaries**

## How it integrates with the overall HOLA pipeline

`coreLayout/` is responsible for positioning nodes and “orthogonalizing” the node arrangement (making many endpoints share x/y alignment). This folder then routes edges **between computed endpoints**.

The primary integration entry is [`index.ts`](./index.ts):

1. Assign node sides + connection points for each edge (delegates to `edgeRouting`, outside this folder)
2. Compute orthogonal paths for edges (`orthogonalEdgeRouting`)

```5:22:packages/mermaid/src/rendering-util/layout-algorithms/hola/orthogonal-routing/index.ts
export default function routing(data4Layout: LayoutData, logStep: (stepName: string) => void): Edge[] {
  const updatedLayout = edgeRouting(data4Layout);
  logStep('Assigning node sides to edges');

  const orthogonalLayout = orthogonalEdgeRouting(updatedLayout, logStep);
  return orthogonalLayout.edges;
}
```

## Routing strategy (two-pass)

Main router: [`orthogonalEdgeRouting.ts`](./orthogonalEdgeRouting.ts) exports `orthogonalEdgeRouting(layoutData, logStep, config)`.

It uses a **two-pass** approach:

### Pass 1: fast “simple patterns”

For each edge with endpoints defined (`edge.points` contains at least start/end points):

- Try straight path (horizontal/vertical)
- Try L-shape
- Try Z-shape / small detours

This logic is implemented in [`pathfinding.ts`](./pathfinding.ts) via functions like `tryStraightPath` and helpers that generate candidates and validate them against the grid.

If a path is found, it is **registered** into the grid as “occupied” so later edges can avoid segment overlaps:

- `grid.markPathOccupied(points)`
- `grid.registerRoutedEdge(edgeInfo)`

### Pass 2: A\* fallback for failures

Edges that fail the pattern routing (or have missing/insufficient endpoints) are routed using
an A\* grid search implemented in [`Astar.ts`](./Astar.ts):

- Generates multiple candidate connection points on source/target node sides
- Tries multiple start/end combinations (bounded) to find high-quality paths
- Scores paths with metrics (bends/crossings/overlaps/endpoint reuse)
- Rejects paths that would cross node bodies

In `orthogonalEdgeRouting.ts`, A\* uses conservative defaults like high bend/crossing penalties
and an iteration cap to avoid runaway searches.

## The routing grid (`grid.ts`)

[`grid.ts`](./grid.ts) defines `RoutingGrid`, a cell-based collision and bookkeeping structure used
by both the simple path finder and A\*.

Key responsibilities:

- **Bounds calculation**: computes a padded world-space bounding box that covers all nodes
- **Obstacle marking**: marks node rectangles as blocked cells (`CellState.BLOCKED`)
- **Node clearance**: optionally expands “clearance bounds” around non-group nodes so edges keep a minimum distance
- **Subgraph handling**:
  - Builds a node → parent-subgraph mapping (`parentId`)
  - Stores subgraph bounds for group nodes (`node.isGroup`)
  - Tracks perimeter cells to support boundary-crossing rules / constraints
- **Edge occupancy**: after routing an edge, path cells are marked occupied (`CellState.OCCUPIED_BY_EDGE`)
- **Segment indexing**: maintains a segment index for crossing/overlap detection and scoring

This is also where endpoint buffer zones and connection point candidate generation live.

## Pathfinding and validation (`pathfinding.ts`)

[`pathfinding.ts`](./pathfinding.ts) implements the “pattern router” (straight/L/Z) and the clearance validation logic.

Notable behaviors:

- **Side-aware routing**: optional `startSide`/`endSide` constraints prevent invalid “exit directions”
- **Parallel edges**: an `EdgeContext` with `parallelIndex`/`parallelCount` enables per-edge offsets to prevent edges stacking perfectly
- **Node overlap bands**: logic like `getOverlapAxisCandidates` tries to route through the overlapping band when two nodes overlap on the orthogonal axis (helps avoid unnecessary detours)

The output is a `PathValidationResult` with a point list and a `type` (`straight`, `lshape`, `zshape`, `astar`).

## Special cases and post-processing

### `selfloop.ts`

Routes self-loop edges (`start === end`) by:

- Inspecting which directions around the node are already “busy”
- Choosing the least-used direction
- Generating a small loop path with control points, offsetting multiple self-loops to reduce overlap

### `crossingCurves.ts`

Optional crossing styling: detects crossings among already-routed edges and applies a visual treatment:

- **Arc** curves (default) or **offset** detours at the crossing segment
- Configured by `GridConfig.crossingCurves` (enabled by default in `orthogonalEdgeRouting.ts`)

This is _visual_ post-processing: it modifies points to make crossings more readable, it does not re-run routing.

### `subgraphBoundaryNudge.ts`

Post-pass nudging to keep edge segments from visually “hugging” group/subgraph boundaries:

- Only considers **ancestor subgraphs** of the edge’s endpoints
- Only nudges intermediate points (keeps endpoints stable)
- Preserves orthogonality and does not invalidate the route

## Configuration

The main knobs are in `GridConfig` (see [`types.ts`](./types.ts)):

- `cellSize`: routing resolution (smaller = more precise, slower)
- `nodeClearance`: keep edges away from node bodies (except at endpoints)
- `subgraphBoundaryClearance`: keep edges away from group boundaries
- `crossingCurves`: enable/disable and configure crossing curve behavior

`orthogonalEdgeRouting.ts` defines defaults (cell size, clearances, curve config).

## Types

All primary types are in [`types.ts`](./types.ts):

- Geometry: `Point`, `Bounds`, `PathSegment`
- Grid: `GridCell`, `CellState`, `GridConfig`
- Routing: `EdgeContext`, `PathValidationResult`, `RoutedEdgeInfo`
- A\*: `AStarNode`, `EnhancedAStarNode`, `AStarOptions`
- Metrics: `PathMetrics`, `PathCandidate`
- Node sides: `Side`

## Debugging tips

- **Edges not routed / falling back**: inspect whether `edge.points` contains endpoints before routing (connection points come from the upstream `edgeRouting` step).
- **Edges hugging nodes**: increase `nodeClearance` or `nodeMargin` (and/or lower `cellSize` for more resolution).
- **Edges hugging subgraphs**: increase `subgraphBoundaryClearance` and keep `subgraphBoundaryNudge` enabled.
- **Too many crossings**: increase bend/crossing penalties for A\*, or disable crossing curves to see true crossings.
