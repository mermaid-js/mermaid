> **ARCHIVED — 2026-04-17.** This document is the _previous_ plan (OCR integration on top of DOMUS). It was written before root cause R1 (shape-discarding `createEdgePathsFromShape` in `domus/edgePaths.ts`) was identified. Its premise — "existing DOMUS routing works well for most diagrams" — does not match the 2026-04-17 test baseline (18 failed / 189 passed).
>
> **Current plan:** see `README.md` in this folder, or `~/.claude/projects/-home-knsv-repos-alana-mermaid/memory/domus_plan_in_progress.md`. The current approach is to fix DOMUS's own shape → polyline handoff (Phase A) and rectangle compaction (Phase B) before adding OCR; when DOMUS's shape phase works end-to-end the "prefer the straight corridor" property falls out of the shape for free.
>
> Keep this file for the OCR rationale (§2.2, §4, §5) — the OVG / bend-aware A\* / shared-edge ordering descriptions are still useful reference material.

---

# DOMUS Analysis + Orthogonal Connector Routing (OCR) Integration

## Executive Summary

This document provides a comprehensive implementation plan for integrating the **Orthogonal Connector Routing (OCR)** algorithm into the existing DOMUS-based orthogonal layout pipeline. The integration is designed to be:

- **Non-invasive**: The existing routing works well for most diagrams; OCR only activates when needed
- **DOMUS-friendly**: OCR slots into the pipeline as an alternative/fallback edge router
- **Validation-gated**: Uses the existing `validateLayout()` as the single source of truth
- **Deterministic**: Same input always produces the same output

---

## 1. Current State Summary

### 1.1 Pipeline Architecture (DOMUS-based)

The current orthogonal pipeline in `/domus/` follows a DOMUS-inspired multi-phase approach:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         runOrthogonalEdgePipeline()                         │
│                              (pipeline.ts)                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Phase 0: Graph Analysis                                                    │
│  └── analyzeGraph() → detect cycles, anti-parallel pairs, multi-edges      │
│                                                                             │
│  Phase 1: Cluster Preprocessing                                             │
│  └── preprocessClusters() → compute group bounds bottom-up                  │
│                                                                             │
│  Phase 2: Backend Selection & Node Placement                                │
│  ├── 'domus' → runDomusRouting() (SAT-based shape + coordinate assignment)  │
│  ├── 'routing-graph' → use existing positions, build routing graph          │
│  └── 'aligned' → simple L-shape / straight segment fallback                 │
│                                                                             │
│  Phase 3: Edge Routing                                                      │
│  ├── Port Assignment → assignPortsForEdge() (core/portAssignment.ts)        │
│  ├── Routing Graph Construction → buildRoutingGraphFromChannels/Reps/Grid   │
│  ├── Path Finding → findShortestOrthogonalPathOnGraph() (A*/Dijkstra)       │
│  └── Compound Routing → cluster boundary waypoints for cross-group edges    │
│                                                                             │
│  Phase 4: Validation Gate + Fallback Repairs                                │
│  ├── validateLayout() → check geometric invariants                          │
│  ├── nudgeOverlappingLeafNodes() → fix node overlaps                        │
│  ├── applyPortDirectionStubs() → fix port mismatches                        │
│  └── Re-route if validation fails                                           │
│                                                                             │
│  Phase 5: Post-Processing                                                   │
│  ├── Path Ordering → applyPathOrderingAndSpacing() (bundle separation)      │
│  ├── Nudging → applyNudgingConstraints() (LP-style segment balancing)       │
│  ├── Multi-Crossing Cleanup → cleanupMultipleCrossingsBetweenTwoPaths()     │
│  └── Option-B Milestone-1 → postProcessDomusOptionBMilestone1()             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Key Modules and Hook Points

| Module              | File                             | Purpose                              | OCR Hook Point                    |
| ------------------- | -------------------------------- | ------------------------------------ | --------------------------------- |
| **Port Assignment** | `core/portAssignment.ts`         | Assigns start/end ports to box sides | Use OCR's port/anchor selection   |
| **Routing Graph**   | `core/routing.ts`                | Builds visibility/channel graph      | **Replace with OCR's OVG**        |
| **Path Finding**    | `core/routing.ts`                | Dijkstra/A\* on routing graph        | **Replace with OCR's A\* search** |
| **Obstacle Model**  | `core/routing.ts`                | `collectObstacleRects()`             | Extend for OCR's interval model   |
| **Validation**      | `layout-utils/validateLayout.ts` | Checks layout correctness            | **Gating condition for OCR**      |
| **Nudging**         | `optionB/postprocess.ts`         | Segment balancing                    | Keep existing (post-OCR)          |
| **Pipeline Entry**  | `pipeline.ts`                    | Main orchestration                   | Add OCR routing selection         |

### 1.3 Existing Routing Graph Models

The current implementation offers three routing graph models (`routingGraphModel` option):

1. **`grid`** (default): Dense Hanan-style grid from obstacle coordinates
2. **`representatives`**: Sparser representative-lines visibility graph
3. **`channels`**: Channel-based representatives (minimum-width channels per obstacle side)

All three use the same path-finding algorithm but differ in graph sparsity.

---

## 2. Paper-to-Code Mapping

### 2.1 DOMUS Concepts → Current Code

| DOMUS Paper Concept          | Current Implementation                                          | Location                       |
| ---------------------------- | --------------------------------------------------------------- | ------------------------------ |
| Shape Construction (SAT)     | `solveShapeSAT()`, `generateShapeSATFormula()`                  | `domus/satEncoding.ts`         |
| Drawing Construction (Gx/Gy) | `testRectilinearDrawability()`, `computeCoordinatesFromShape()` | `domus/drawability.ts`         |
| Cycle Set C                  | `computeInitialCycleSet()`                                      | `domus/graphAnalysis.ts`       |
| Edge Splitting               | `splitEdge()`                                                   | `domus/types.ts`               |
| Vertex Expansion             | `expandHighDegreeVerticesPostSat()`                             | `domus/vertexExpansion.ts`     |
| Nudging (LP)                 | `longestPathCompaction()`, `applyNudgingConstraints()`          | `compaction.ts`, `pipeline.ts` |

### 2.2 OCR Concepts → Proposed Code Artifacts

| OCR Paper Concept                     | Proposed Implementation         | Target Location             |
| ------------------------------------- | ------------------------------- | --------------------------- |
| **Orthogonal Visibility Graph (OVG)** | `buildOVGFromObstacles()`       | NEW: `core/ocr/ovg.ts`      |
| **Interesting Points**                | Corner + port coordinates       | In OVG builder              |
| **A\* Search (bend-aware)**           | `findOCROptimalPath()`          | NEW: `core/ocr/search.ts`   |
| **Remaining Bends Heuristic**         | `estimateRemainingBends()`      | In A\* search               |
| **Shared Edge Ordering**              | `orderSharedEdges()`            | NEW: `core/ocr/ordering.ts` |
| **Nudging (Final Placement)**         | Reuse existing `postprocess.ts` | `optionB/postprocess.ts`    |
| **Free-Space Intervals**              | `computeIntervals()`            | In OVG builder              |
| **Corridor Centering**                | `centerInCorridor()`            | In nudging pass             |

---

## 3. Integration Architecture

### 3.1 OCR as a Routing Backend

OCR will be integrated as an **alternative routing backend** that can be selected via the `routingGraphModel` option or activated automatically when validation fails.

```typescript
// In OrthogonalOptions (types.ts)
export interface OrthogonalOptions {
  // ... existing options ...

  /**
   * Routing graph model to use for edge routing.
   * - 'grid': Dense Hanan-style grid (default)
   * - 'representatives': Sparser visibility graph
   * - 'channels': Channel-based representatives
   * - 'ocr': Orthogonal Connector Routing (bend-optimal)
   */
  routingGraphModel?: 'grid' | 'representatives' | 'channels' | 'ocr';

  /**
   * Whether to automatically fall back to OCR when validation fails.
   * Default: true
   */
  ocrFallback?: boolean;
}
```

### 3.2 Pipeline Integration Points

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Modified Pipeline with OCR Integration                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [Existing Phases 0-2: Graph Analysis, Clusters, Node Placement]            │
│                                                                             │
│  Phase 3: Edge Routing (MODIFIED)                                           │
│  ├── if (routingGraphModel === 'ocr') {                                     │
│  │     // Use OCR directly                                                  │
│  │     buildOVGFromObstacles()                                              │
│  │     for each edge: findOCROptimalPath()                                  │
│  │     orderSharedEdges()                                                   │
│  │   } else {                                                               │
│  │     // Use existing routing (grid/representatives/channels)              │
│  │   }                                                                      │
│  │                                                                          │
│  Phase 4: Validation Gate (MODIFIED)                                        │
│  ├── validateLayout()                                                       │
│  ├── if (validation fails && ocrFallback && !alreadyUsedOCR) {              │
│  │     // Re-route failed edges with OCR                                    │
│  │     rerouteWithOCR(failedEdges)                                          │
│  │   }                                                                      │
│  │                                                                          │
│  [Existing Phase 5: Post-Processing]                                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.3 File Structure

```
domus/
├── core/
│   ├── ocr/                          # NEW: OCR implementation
│   │   ├── index.ts                  # Public API
│   │   ├── ovg.ts                    # Orthogonal Visibility Graph builder
│   │   ├── search.ts                 # A* search with bend-aware heuristic
│   │   ├── ordering.ts               # Shared edge ordering
│   │   └── types.ts                  # OCR-specific types
│   ├── helpers.ts                    # Shared utilities (existing)
│   ├── portAssignment.ts             # Port assignment (existing)
│   └── routing.ts                    # Existing routing (grid/reps/channels)
├── domus/                            # DOMUS implementation (unchanged)
├── optionB/                          # Post-processing (unchanged)
├── pipeline.ts                       # Main pipeline (modified)
├── types.ts                          # Types (extended)
└── instruction.md                    # This document
```

---

## 4. Detailed Implementation Plan

### 4.1 Phase 1: OCR Core Types (core/ocr/types.ts)

```typescript
/**
 * OCR-specific type definitions.
 */

import type { Point, Rect } from '../../types.js';

/** Direction of movement in the OVG */
export type OVGDirection = 'N' | 'E' | 'S' | 'W';

/** A node in the Orthogonal Visibility Graph */
export interface OVGNode {
  id: string;
  point: Point;
  /** Edges to adjacent nodes, keyed by direction */
  neighbors: Map<OVGDirection, OVGEdge[]>;
  /** Whether this is a port/anchor point */
  isPort: boolean;
  /** Associated obstacle ID if on obstacle boundary */
  obstacleId?: string;
}

/** An edge in the OVG */
export interface OVGEdge {
  targetId: string;
  direction: OVGDirection;
  /** Manhattan distance to target */
  distance: number;
  /** Free-space interval along this edge */
  interval: Interval;
}

/** A 1D interval representing free space */
export interface Interval {
  min: number;
  max: number;
}

/** A* search state */
export interface SearchState {
  nodeId: string;
  /** Direction we arrived from (null for start) */
  arrivalDirection: OVGDirection | null;
  /** Number of bends so far */
  bendCount: number;
  /** Total Manhattan distance so far */
  distance: number;
  /** Estimated total cost (g + h) */
  fScore: number;
  /** Parent state for path reconstruction */
  parent: SearchState | null;
}

/** OCR routing result for a single edge */
export interface OCRRouteResult {
  edgeId: string;
  path: Point[];
  bendCount: number;
  success: boolean;
}
```

### 4.2 Phase 2: OVG Builder (core/ocr/ovg.ts)

The OVG builder creates the visibility graph from obstacles:

```typescript
/**
 * Build an Orthogonal Visibility Graph from obstacles.
 *
 * Algorithm:
 * 1. Collect all "interesting points" (obstacle corners + port locations)
 * 2. For each point, extend rays in 4 cardinal directions
 * 3. Stop rays at obstacle boundaries or canvas edges
 * 4. Create edges between visible points
 *
 * @param obstacles - Array of obstacle rectangles
 * @param ports - Array of port points (edge endpoints)
 * @param bounds - Canvas bounds
 * @returns The OVG as a map of node IDs to OVGNodes
 */
export function buildOVGFromObstacles(
  obstacles: Rect[],
  ports: Point[],
  bounds: Rect
): Map<string, OVGNode> {
  // Implementation details...
}
```

Key implementation considerations:

- Use interval trees for efficient ray-obstacle intersection
- Handle degenerate cases (overlapping obstacles, ports on boundaries)
- Prune unreachable nodes to keep graph sparse

### 4.3 Phase 3: A\* Search (core/ocr/search.ts)

The A\* search finds bend-optimal paths:

```typescript
/**
 * Find the optimal orthogonal path between two ports.
 *
 * Uses A* search with a bend-aware heuristic:
 * - Primary cost: number of bends
 * - Secondary cost: Manhattan distance (tie-breaker)
 *
 * The heuristic estimates remaining bends based on:
 * - Current direction vs. target direction
 * - Whether we need to go around obstacles
 *
 * @param ovg - The Orthogonal Visibility Graph
 * @param startPort - Starting port point
 * @param endPort - Ending port point
 * @param startDirection - Required exit direction from start (or null)
 * @param endDirection - Required entry direction to end (or null)
 * @returns The optimal path as an array of points
 */
export function findOCROptimalPath(
  ovg: Map<string, OVGNode>,
  startPort: Point,
  endPort: Point,
  startDirection?: OVGDirection,
  endDirection?: OVGDirection
): OCRRouteResult {
  // Implementation details...
}

/**
 * Estimate remaining bends to reach target.
 *
 * This is the admissible heuristic for A* search.
 * Returns 0 if we can reach target in current direction,
 * 1 if we need one turn, 2 if we need two turns.
 */
function estimateRemainingBends(
  current: Point,
  target: Point,
  currentDirection: OVGDirection | null
): number {
  // Implementation details...
}
```

### 4.4 Phase 4: Edge Ordering (core/ocr/ordering.ts)

When multiple edges share a corridor, they need to be ordered to minimize crossings:

```typescript
/**
 * Order edges that share corridor segments.
 *
 * This implements the "shared edge ordering" from the OCR paper:
 * - Group edges by shared corridor segments
 * - Order edges within each group to minimize crossings
 * - Apply consistent spacing between parallel edges
 *
 * @param routes - Array of routed edges
 * @param spacing - Minimum spacing between parallel edges
 * @returns Updated routes with ordered positions
 */
export function orderSharedEdges(routes: OCRRouteResult[], spacing: number): OCRRouteResult[] {
  // Implementation details...
}
```

### 4.5 Phase 5: Pipeline Integration (pipeline.ts modifications)

```typescript
// In runOrthogonalEdgePipeline():

// After node placement, before edge routing:
if (options.routingGraphModel === 'ocr') {
  // Use OCR for all edges
  const ocrRoutes = routeAllEdgesWithOCR(layout, options);
  applyOCRRoutesToLayout(layout, ocrRoutes);
} else {
  // Use existing routing
  // ... existing code ...
}

// After validation:
if (!validationResult.valid && options.ocrFallback && !usedOCR) {
  // Re-route failed edges with OCR
  const failedEdgeIds = validationResult.failedEdges;
  const ocrRoutes = rerouteEdgesWithOCR(layout, failedEdgeIds, options);
  applyOCRRoutesToLayout(layout, ocrRoutes);

  // Re-validate
  validationResult = validateLayout(layout);
}
```

---

## 5. Validation Integration

### 5.1 Using validateLayout() as the Gate

The existing `validateLayout()` function in `layout-utils/validateLayout.ts` serves as the single source of truth for layout correctness. OCR integration respects this:

```typescript
// Validation checks (from validateLayout.ts):
// 1. Node overlap detection
// 2. Edge-node intersection detection
// 3. Edge-edge crossing detection (optional)
// 4. Port direction consistency
// 5. Polyline orthogonality verification

interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  failedEdges: string[]; // Edge IDs that have issues
  failedNodes: string[]; // Node IDs that have issues
}
```

### 5.2 OCR Fallback Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                    OCR Fallback Decision Tree                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Route all edges with primary backend (grid/reps/channels)  │
│                          ↓                                      │
│  2. Run validateLayout()                                        │
│                          ↓                                      │
│  3. If valid → Done                                             │
│     If invalid:                                                 │
│                          ↓                                      │
│  4. Identify failed edges from validation issues                │
│                          ↓                                      │
│  5. Re-route ONLY failed edges with OCR                         │
│     (keep successful routes unchanged)                          │
│                          ↓                                      │
│  6. Run validateLayout() again                                  │
│                          ↓                                      │
│  7. If still invalid → Apply nudging repairs                    │
│                          ↓                                      │
│  8. Final validation                                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.3 Extending ValidationResult for OCR

```typescript
// Extended validation result to support OCR fallback
interface ExtendedValidationResult extends ValidationResult {
  /** Edges that intersect nodes (candidates for OCR re-routing) */
  edgeNodeIntersections: Array<{
    edgeId: string;
    nodeId: string;
    segmentIndex: number;
  }>;

  /** Edges with port direction mismatches */
  portMismatches: Array<{
    edgeId: string;
    endpoint: 'start' | 'end';
    expected: PortSide;
    actual: PortSide;
  }>;
}
```

---

## 6. Testing Strategy

### 6.1 Unit Tests (core/ocr/\*.spec.ts)

```typescript
// ovg.spec.ts
describe('OVG Builder', () => {
  it('should create nodes for all obstacle corners', () => { ... });
  it('should create edges between visible points', () => { ... });
  it('should handle overlapping obstacles', () => { ... });
  it('should include port points in the graph', () => { ... });
});

// search.spec.ts
describe('OCR A* Search', () => {
  it('should find straight path when possible', () => { ... });
  it('should find L-shaped path with one bend', () => { ... });
  it('should route around obstacles', () => { ... });
  it('should respect port direction constraints', () => { ... });
  it('should minimize bends over distance', () => { ... });
});

// ordering.spec.ts
describe('Edge Ordering', () => {
  it('should order parallel edges to minimize crossings', () => { ... });
  it('should maintain consistent spacing', () => { ... });
});
```

### 6.2 Integration Tests

```typescript
// ocr-integration.spec.ts
describe('OCR Pipeline Integration', () => {
  it('should use OCR when routingGraphModel is "ocr"', () => { ... });
  it('should fall back to OCR when validation fails', () => { ... });
  it('should not use OCR when ocrFallback is false', () => { ... });
  it('should produce valid layouts for complex graphs', () => { ... });
});
```

### 6.3 Visual Regression Tests

Use existing Mermaid visual testing infrastructure to verify:

- Edge paths are orthogonal
- No edge-node intersections
- Consistent spacing between parallel edges
- Bend counts are minimized

---

## 7. Implementation Milestones

### Milestone 1: OCR Core (Week 1-2)

- [ ] Create `core/ocr/types.ts` with type definitions
- [ ] Implement `core/ocr/ovg.ts` (OVG builder)
- [ ] Implement `core/ocr/search.ts` (A\* search)
- [ ] Unit tests for OVG and search

### Milestone 2: Pipeline Integration (Week 3)

- [ ] Add `'ocr'` option to `routingGraphModel`
- [ ] Integrate OCR into `pipeline.ts`
- [ ] Implement OCR fallback logic
- [ ] Integration tests

### Milestone 3: Edge Ordering (Week 4)

- [ ] Implement `core/ocr/ordering.ts`
- [ ] Integrate with existing nudging pass
- [ ] Visual regression tests

### Milestone 4: Optimization & Polish (Week 5)

- [ ] Performance optimization (interval trees, caching)
- [ ] Edge case handling
- [ ] Documentation updates
- [ ] Final testing and bug fixes

---

## 8. Appendix: Key Code References

### 8.1 Existing Routing Graph Construction

<augment_code_snippet path="packages/mermaid/src/rendering-util/layout-algorithms/domus/core/routing.ts" mode="EXCERPT">

```typescript
// buildRoutingGraphFromGrid() - Dense Hanan-style grid
// buildRoutingGraphFromRepresentatives() - Sparser visibility graph
// buildRoutingGraphFromChannels() - Channel-based representatives
// findShortestOrthogonalPathOnGraph() - Dijkstra/A* path finding
```

</augment_code_snippet>

### 8.2 Obstacle Collection

<augment_code_snippet path="packages/mermaid/src/rendering-util/layout-algorithms/domus/core/routing.ts" mode="EXCERPT">

```typescript
// collectObstacleRects() - Collects node rectangles as obstacles
// This will be reused by OCR's OVG builder
```

</augment_code_snippet>

### 8.3 Validation

<augment_code_snippet path="packages/mermaid/src/rendering-util/layout-algorithms/domus/layout-utils/validateLayout.ts" mode="EXCERPT">

```typescript
// validateLayout() - Main validation entry point
// checkEdgeNodeIntersections() - Detects edge-node collisions
// checkNodeOverlaps() - Detects node-node overlaps
```

</augment_code_snippet>

### 8.4 Post-Processing

<augment_code_snippet path="packages/mermaid/src/rendering-util/layout-algorithms/domus/optionB/postprocess.ts" mode="EXCERPT">

```typescript
// postProcessDomusOptionBMilestone1() - Main post-processing entry
// applyNudgingConstraints() - LP-style segment balancing
// applyPathOrderingAndSpacing() - Bundle separation
```

</augment_code_snippet>

---

## 9. References

1. **DOMUS Paper**: "Orthogonal Graph Drawing with Flexibility Constraints" - Tamassia et al.
2. **OCR Paper**: "Orthogonal Connector Routing" - Wybrow et al.
3. **Mermaid Orthogonal Layout**: Current implementation in `/domus/`
4. **Validation Framework**: `layout-utils/validateLayout.ts`
