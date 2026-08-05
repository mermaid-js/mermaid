# HOLA `treeLayout`

This folder implements **HOLA Step 3: Tree layout + placement around the core**. In Mermaid’s `hola` layout, the algorithm first lays out the _core graph_ (handled in `coreLayout/`), then extracts “tree” subgraphs that attach to the core and places those trees into available faces around the core.

At a high level this folder provides:

- **Step 3a**: Symmetric layout for each tree (draw each tree cleanly on its own)
- **Step 3b**: Core planarization + face detection (find regions / faces where trees can fit)
- **Step 3c**: Intelligent tree placement into faces (choose direction + face + rotation/flip)
- **Step 3d**: Global post-placement stress relaxation (lightly relax the combined graph)

## HOLA theory context (from `hola2015.pdf`)

The notes in `hola2015.pdf` describe Section **4.3 Tree layout and placement**:

- **4.3(a) Symmetric tree layout**  
  Each tree is first laid out independently with default **SOUTH** growth (ranks horizontally aligned, deeper levels below the root), favoring symmetry around a vertical axis through the root.
- **4.3(b) Core planarization in two sweep-style passes**
  1. remove overlaps/multiplicity artifacts by introducing bend dummies and reducing multi-edges,
  2. remove crossings by inserting crossing dummies.
- **4.3(c) Greedy tree placement into faces**  
  For each tree root, choose `(face, placementDirection, growthDirection, flipBit)` from candidate options, guided by stress increase and optional preferences (favor cardinal directions and/or external face).
- **4.3(d) Post-placement stress dissipation**  
  After all trees are attached, run gradient-projection/stress relaxation to reduce accumulated stress.

This folder is the implementation of those Step 3 responsibilities.

## Entry point and pipeline

Entry point: [`index.ts`](./index.ts) exports `layoutAndPlaceTrees(coreWithCoordinates, trees, uniformEdgeLength)`.

The pipeline is:

1. **Layout each tree independently** using [`SymmetricTreeLayouter`](./symmetricTreeLayouter.ts)
2. **If there is no core**:
   - If there is exactly one tree, return the tree’s nodes (with copy-node filtering/renaming)
   - If there are multiple trees, lay them out independently and pack horizontally with padding
3. **If there is a core**:
   - Planarize the core with [`CorePlanarizer`](./corePlanarizer.ts) to identify faces
   - Place trees into faces with [`TreePlacer`](./treePlacer.ts)
   - Run global post-placement stress minimization with [`performGlobalStressMinimization`](./stressMinimization.ts)
   - Convert back to Mermaid `LayoutData` with [`convertPlanarizedToLayoutData`](./utils.ts)

## Theory-to-code mapping (4.3)

### 4.3(a) Symmetric tree layout

Implemented by [`symmetricTreeLayouter.ts`](./symmetricTreeLayouter.ts):

- Builds tree structure (`children`, `parent`, `levels`)
- Computes subtree widths and level heights
- Performs top-down symmetric placement
- Emits `TreeLayout` (nodes/edges/bounds/root position)

### 4.3(b) Planarize core and identify faces

Implemented by [`corePlanarizer.ts`](./corePlanarizer.ts):

- Converts core edges to axis-aligned planar edges
- Removes parallel edges
- Inserts dummy bend nodes and crossing nodes
- Computes embedding and face set

### 4.3(c) Greedy tree placement with direction/face choices

Implemented by [`treePlacer.ts`](./treePlacer.ts):

- Enumerates face/direction/growth/flip candidates
- Scores candidates with fit/distribution/stress heuristics
- Applies selected placement transform to each tree

Theory notes mention descending tree perimeter order.  
Current implementation detail: `sortTreesBySize()` currently sorts in **ascending** perimeter (`perimeterA - perimeterB`).

Theory notes mention configurable preferences for:

- favoring cardinal placement directions
- favoring external face placement

Current implementation includes these preference flags (`favorCardinal`, `favorExternal`) in `TreePlacer`.

### 4.3(d) Post-placement stress minimization

Implemented by [`stressMinimization.ts`](./stressMinimization.ts) as `performGlobalStressMinimization(planarizedCore)`:

- Runs bounded iterative relaxation on the combined graph
- Uses damping + convergence thresholds
- Computes stress over the current routed/planarized structure while skipping dummy artifacts where needed

## Core concepts

### “Core” vs “Trees”

- **Core**: the central connected component that is not a tree-like attachment (typically cyclic / dense)
- **Tree**: a subgraph that attaches to the core at a single core node (often acyclic / hierarchical)

In `layoutAndPlaceTrees`, the trees are passed in as a `Map<string, LayoutData>` where the key is the **tree root id** (often the core attachment node).

### Copy-node logic (`*_copy`)

Tree extraction/attachment sometimes uses “copy nodes” (IDs containing `'_copy'`) to represent a core attachment inside the standalone tree layout.

`index.ts` contains filtering/renaming logic so that:

- Intermediate `*_copy` nodes are removed from final output when appropriate
- A single `${rootId}_copy` is sometimes kept, then renamed back to `rootId`

This avoids duplicating core nodes in the output while still allowing the tree layout algorithm to treat the attachment point as a root.

## Modules

### `symmetricTreeLayouter.ts` (Step 3a)

Implements a **symmetric tree drawing** algorithm:

- Builds a `TreeStructure` (children/parent relationships + BFS levels)
- Computes per-level heights
- Computes subtree widths bottom-up
- Positions nodes top-down to keep the layout symmetric and well-spaced
- Produces a `TreeLayout` (nodes + edges + bounding box + root position)

Types are defined in [`types.ts`](./types.ts) (e.g. `TreeNode`, `TreeLayout`, `TreeStructure`).

### `corePlanarizer.ts` (Step 3b)

Planarizes the already-laid-out core graph so the algorithm can identify **faces** (regions)
where trees can be placed.

Main responsibilities:

- Convert core edges to an axis-aligned representation (`PlanarEdge`)
- **Remove parallel edges** (HOLA requirement: simplify multi-edges before planarization)
- Insert **dummy nodes** at:
  - **Bend points** (`bend_*`) when an edge has polyline points
  - **Crossings** (`cross_*`) to make the embedding planar
- Compute a **planar embedding** (clockwise neighbor order) and enumerate **faces**

Output type: `PlanarizedCore` (see [`types.ts`](./types.ts)) containing:

- `nodes`: core nodes + dummy nodes
- `edges`: planarized edge segments
- `faces`: detected faces (including external face)
- `embedding`: neighbor order used for face traversal

### `treePlacer.ts` (Step 3c)

Places each already-laid-out tree into a selected face of the planarized core.

What it does:

- Sort trees (by size) so placement is stable and larger trees get better choice of space
- For each tree:
  - Find its attachment core node (`*_copy` handling included)
  - Find faces adjacent to the attachment node
  - Generate placement candidates over:
    - Face choice (prefer unused/external, consider area)
    - Direction choice (cardinal/ordinal directions, configurable preference)
    - Rotation/flip of the tree to align “natural” growth direction to chosen direction
  - Score candidates using fit + stress-cost heuristics and pick best
  - Apply the placement (translate + rotate/flip nodes, update the planarized core)
  - Optionally run a local stress relaxation pass for the placed tree to settle it

Placement uses direction vectors and angles (N/S/E/W + diagonals) defined inside the class.

Notes relative to theory:

- Supports both **cardinal** and **ordinal** placement directions.
- Implements configurable preference behavior that can prioritize cardinal placement and/or external faces.

### `stressMinimization.ts` (Step 3d)

After all trees are attached, runs a **global stress relaxation** over the combined graph
(core + placed trees) to reduce tension and edge-length variance.

This is intentionally light-weight compared to the core stress minimizer:

- Works on the planarized structure (`PlanarizedCore`)
- Skips dummy bend/crossing nodes for stress where appropriate
- Uses a bounded iteration count and damping
- Computes an “ideal” edge length using `calculateBaseEdgeLength` from `coreLayout/graphUtils.ts`

Main export: `performGlobalStressMinimization(planarizedCore)`.

### `utils.ts`

Conversion utilities, primarily:

- `convertPlanarizedToLayoutData(planarizedCore, config)`: converts the planarized core (plus any
  placed tree nodes) back into Mermaid’s `LayoutData` shape, filtering out dummy nodes and edges.

### `utils.ts` and `types.ts`

`types.ts` defines the data model used across Step 3:

- Tree model: `TreeNode`, `TreeEdge`, `TreeStructure`, `TreeLayout`
- Planarization model: `DummyNode`, `PlanarEdge`, `Face`, `PlanarizedCore`
- Placement model: `PlacementDirection`, `TreePlacement`, `PlacementCandidate`, plus space/cost helpers

`utils.ts` provides adapter/conversion logic between these representations and Mermaid’s `LayoutData`.

### `treePlacer.ts` and `utils.ts` are intentionally “layout glue”

The tree stage has to bridge multiple representations:

- `LayoutData` (Mermaid)
- `TreeLayout` (tree drawing)
- `PlanarizedCore` (planar graph with faces)
- Back to `LayoutData`

Keeping conversion in `utils.ts` helps keep the algorithm steps readable in `index.ts`.

## Files not covered above

- `treePlacer.ts`: the bulk of placement heuristics and scoring
- `utils.ts`: conversion helpers (planarized → layout)
- `corePlanarizer.ts`: planarization + face enumeration
- `stressMinimization.ts`: post-placement stress relaxation

## Tests

Tests live in:

- [`treeLayout.spec.ts`](./treeLayout.spec.ts)

Coverage includes:

- Pure-tree cases when core is empty (single tree, multiple trees, chains)
- Copy-node behavior (`*_copy`)
- Planarization and face identification on small known graphs
- Integration coverage for `layoutAndPlaceTrees`

## Debugging tips

- If trees appear duplicated or missing, check **`*_copy` filtering/renaming** in `index.ts`.
- If trees overlap the core, inspect `CorePlanarizer` face bounding boxes and
  `TreePlacer` fit checks / required-space computations.
- If final layout “drifts” after placement, tune constants used in `stressMinimization.ts`
  (iterations/damping/factors) and the candidate scoring thresholds in `treePlacer.ts`.
- If tree ordering seems counterintuitive for dense inputs, inspect `TreePlacer.sortTreesBySize()`
  and verify the current ascending/descending perimeter strategy is what you want.
