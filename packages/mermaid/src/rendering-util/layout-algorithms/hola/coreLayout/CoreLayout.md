# HOLA `coreLayout`

This folder implements the **core (node) layout** portion of the HOLA-based layout pipeline used by Mermaid’s `hola` layout. In broad terms, it:

- Computes a **reasonable initial placement** for nodes (stress-minimizer seeding)
- Improves that placement via **stress minimization** (spring/graph-distance objective)
- “Squares up” the layout via **greedy orthogonalization** (align nodes to \(x/y\) axes)
- Leaves final edge geometry to the downstream **orthogonal routing** stage (outside this folder)

## HOLA theory context

The notes in `hola2015.pdf` describe Section **4.2 Layout of the core** with three major parts:

- **4.2(a) Core stress layout first**  
  Start with unconstrained stress-minimizing placement, then apply overlap-removal constraints to get a natural low-stress distribution.
- **4.2(b) Orthogonalization in two sub-steps**
  1. **Node configuration** for degree \(\ge 3\) nodes (links/degree-2 nodes excluded), with compass-direction assignments and ordering constraints.
  2. **Chain configuration** for degree-2 chains, with bend-sequence selection and projection onto alignment constraints, followed by stress reduction.
- **4.2(c) Route remaining diagonal connectors orthogonally**  
  After node/chain orthogonalization, route unresolved diagonal edges while preserving side usage robustness for later planarization/tree placement.

This folder (`coreLayout`) implements **4.2(a)** and most of **4.2(b)**.  
Step **4.2(c)** is implemented in the sibling folder `orthogonal-routing/`.

## High-level pipeline

Entry point: [`index.ts`](./index.ts) exports `layoutCoreGraph(coreData, edgeLength)`.

The flow is:

1. **Trivial cases**
   - Empty graph → return as-is
   - Single node → place at \((0, 0)\)
2. **Disconnected components**
   - Detect components
   - Layout each component independently
   - Pack components horizontally with spacing
3. **Connected component layout**
   - **Stress-minimizing placement** (seed + iterative minimization)
   - **Greedy orthogonalization** (align endpoints / chains / hubs best-effort)
   - Write final `x/y` back onto `coreData.nodes`

You can see this sequencing directly in:

```6:63:packages/mermaid/src/rendering-util/layout-algorithms/hola/coreLayout/index.ts
export function layoutCoreGraph(coreData: LayoutData, edgeLength: number): LayoutData {
  // ... trivial cases ...
  const components = findConnectedComponents(coreData);
  if (components.length > 1) {
    return layoutDisconnectedComponents(coreData, components, (data) =>
      layoutCoreGraph(data, edgeLength)
    );
  }

  const stressMinimizer = new StressMinimizer(coreData, edgeLength);
  const stressOptimizedNodes = stressMinimizer.minimize();

  const orthogonalLayout = new OrthogonalLayouter(stressOptimizedNodes, coreData.edges ?? [], edgeLength);
  orthogonalLayout.orthogonalizeAllEdges();

  // ... copy positions back into nodes ...
}
```

## Theory-to-code mapping (4.2)

### 4.2(a) Stress-first core placement

- Implemented by `StressMinimizer` in [`stressMinimizer.ts`](./stressMinimizer.ts):
  - initialization/seeding (`initializeNodes`)
  - all-pairs shortest graph distances (Floyd-Warshall)
  - gradient-descent stress minimization (`minimize`)
- Stress math/gradient is in [`stressMinimizationUtils.ts`](./stressMinimizationUtils.ts).

Important note: the theory says stress placement is **followed by overlap removal constraints**.  
Implementation status:

- `StressMinimizer.removeOverlaps()` exists
- In [`index.ts`](./index.ts), the call is currently commented out:
  - `// stressMinimizer.removeOverlaps();`

So overlap removal is available but currently disabled in the orchestrated path.

### 4.2(b) Orthogonalization = node configuration + chain configuration

Implemented primarily in [`orthogonalLayouter.ts`](./orthogonalLayouter.ts):

- Builds adjacency and degree info
- Identifies chains (degree-2 link-node sequences)
- Performs greedy, constraint-style orthogonalization for:
  - higher-degree/core nodes (node configuration)
  - chains/link nodes (chain configuration)
- Attempts to preserve ordering and avoid flips in a best-effort way

This aligns with the theory’s split between non-link node configuration and chain handling.

## Modules

### `index.ts`

**Orchestrator** for core layout. It handles:

- Trivial cases
- Connected component splitting + packing
- Running stress minimization + orthogonalization and emitting final nodes

### `graphUtils.ts`

Graph utilities used by the orchestrator:

- **`calculateUniformEdgeLength(nodes)` / `calculateBaseEdgeLength(nodes, edges)`**: heuristics for an “ideal” edge length used as the target spacing unit
- **`findConnectedComponents(layoutData)`**: DFS-based component detection
- **`layoutDisconnectedComponents(layoutData, components, layoutCoreGraph)`**: calls the layout per component and packs them with offsets

### `stressMinimizer.ts`

Implements stress-based node placement.

- **Initialization / seeding**: `initializeNodes(nodes)`
  - Builds adjacency from edges
  - Chooses a **seed** node (highest degree)
  - BFS assigns nodes to layers
  - Places each layer on a **ring** with spacing derived from node sizes and `uniformEdgeLength`
  - Adds small deterministic jitter (seeded PRNG) to break symmetry
- **Shortest path distances**: all-pairs shortest paths are computed (Floyd–Warshall) to define graph-theoretic distances
- **Optimization**: `minimize()` calls `performStressMinimization()` (gradient descent) to reduce stress
- **Overlap handling**: `removeOverlaps()` exists (theory-aligned), but is currently not enabled by default in the orchestrator (`index.ts`)

### `stressMinimizationUtils.ts`

The math/solver utilities for stress minimization:

- **`computeNodeDistance`**: boundary-to-boundary distance between rectangles (uses widths/heights)
- **`computeStress`**: weighted stress objective based on \((\|p_i - p_j\| - L \* d_G(i,j))^2\)
- **`computeGradient`**: gradient of stress w.r.t. a single node’s position
- **`performStressMinimization`**: gradient descent loop that updates all nodes each iteration

### `orthogonalLayouter.ts`

Greedy orthogonalization and constraint application. At a high level it:

- Builds adjacency and computes graph distances
- Identifies **chains** (sequences of degree-2 “link” nodes)
- Applies best-effort **alignment constraints** so many edges become horizontal/vertical
- Attempts to keep neighbor ordering / avoid flips for high-degree nodes (best-effort)

This corresponds to the theory’s node-configuration + chain-configuration phases.
Actual edge path routing is done afterwards in the orthogonal routing layer.

### `types.ts`

Local type helpers used by the layout implementation (`NodeWithPosition`, chain and constraint types, bend point type, etc.).

## Tests

Unit/integration tests for the core layout live in:

- [`coreLayout.spec.ts`](./coreLayout.spec.ts)

These include tests for stress minimization, orthogonalization, connected components, and integration coverage.
