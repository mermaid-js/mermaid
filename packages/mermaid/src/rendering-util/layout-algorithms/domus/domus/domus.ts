/**
 * DOMUS - Drawing Orthogonal Metrics Using Shape
 *
 * Main entry point for the DOMUS shape-first orthogonal drawing algorithm.
 *
 * The algorithm alternates between Shape Construction (SAT solving) and
 * Drawing Construction (drawability testing via Gx/Gy), with two refinement
 * mechanisms:
 * - Add a non-complete witness cycle to C when SAT succeeds but shape fails
 * - Split an edge when SAT returns UNSAT
 *
 * Reference: (DOMUS, p.7-10, §4, Fig.4)
 */

import type {
  DomusGraph,
  DomusState,
  DomusOptions,
  DomusResult,
  Shape,
  SimpleCycle,
  Point,
} from './types.js';
import { createDomusGraph, splitEdge } from './types.js';
import { computeInitialCycleSet, findBiconnectedComponents } from './graphAnalysis.js';
import { testRectilinearDrawability, computeCoordinatesFromShape } from './drawability.js';
import {
  generateShapeSATFormula,
  extractShapeFromAssignment,
  identifyEdgeToSplit,
  buildPreferenceVariableBias,
  solveShapeSAT,
} from './satEncoding.js';
import {
  augmentNodeSizesForPostSatExpansion,
  collapseExpandedVertices,
  expandHighDegreeVerticesPostSat,
} from './vertexExpansion.js';
import { log } from '../../../../logger.js';
import { ORTHO_DEBUG } from '../debug.js';

const DOMUS_DEBUG = ORTHO_DEBUG;

/**
 * Default options for the DOMUS algorithm.
 */
const DEFAULT_OPTIONS = {
  maxSatInvocations: 500,
  maxEdgeSplits: 50,
  debug: false,
} satisfies Partial<DomusOptions>;

/**
 * Run the DOMUS algorithm on a graph.
 *
 * This is the main entry point that implements the iterative
 * Shape Construction ↔ Drawing Construction loop.
 *
 * Reference: (DOMUS, p.7-8, §4, Fig.4)
 *
 * @param vertexIds - List of vertex IDs
 * @param edges - List of edges \{ id, from, to \}
 * @param options - Algorithm options
 * @returns The result including final graph, shape, and coordinates
 */
export function runDomus(
  vertexIds: string[],
  edges: { id: string; from: string; to: string }[],
  options: DomusOptions = {}
): DomusResult {
  const opts = {
    ...DEFAULT_OPTIONS,
    ...options,
    maxSatInvocations: options.maxSatInvocations ?? DEFAULT_OPTIONS.maxSatInvocations,
    maxEdgeSplits: options.maxEdgeSplits ?? DEFAULT_OPTIONS.maxEdgeSplits,
    debug: options.debug ?? DEFAULT_OPTIONS.debug,
  };
  if (opts.debug) {
    log.debug(DOMUS_DEBUG, 'domus_start', { vertices: vertexIds.length, edges: edges.length });
  }
  // Initialize state
  const graph = createDomusGraph(vertexIds, edges);

  const cycleSet = computeInitialCycleSet(graph, opts.debug);

  const state: DomusState = {
    graph,
    cycleSet,
    satInvocations: 0,
    cyclesAdded: 0,
    edgeSplits: 0,
    edgeActivity: new Map<string, number>(),
    constraints: opts.constraints,
    nodePadding: opts.nodePadding,
  };

  if (opts.debug) {
    log.debug(DOMUS_DEBUG, 'domus_initialized', {
      vertices: vertexIds.length,
      edges: edges.length,
      initialCycles: cycleSet.cycles.length,
    });
  }

  const startTime = Date.now();
  const GLOBAL_TIME_LIMIT = 5000; // 5 seconds total for the entire algorithm

  // Main loop
  while (state.satInvocations < opts.maxSatInvocations && state.edgeSplits < opts.maxEdgeSplits) {
    if (Date.now() - startTime > GLOBAL_TIME_LIMIT) {
      if (opts.debug) {
        log.debug(DOMUS_DEBUG, 'domus_global_timeout');
      }
      return createFailureResult(state);
    }

    // Shape Construction: solve SAT
    const shapeResult = shapeConstruction(state, opts.debug);
    state.satInvocations++;

    if (!shapeResult.success) {
      // SAT is UNSAT -> need to split an edge
      if (opts.debug) {
        log.debug(DOMUS_DEBUG, 'domus_sat_unsat_refining', {
          invocations: state.satInvocations,
          edges: state.graph.edges.size,
          vertices: state.graph.vertices.size,
        });
      }

      if (!shapeResult.edgeToSplit) {
        // No edge identified -> give up
        if (opts.debug) {
          log.debug(DOMUS_DEBUG, 'domus_fail_no_edge_to_split');
        }
        return createFailureResult(state);
      }

      // Split the edge
      const edge = state.graph.edges.get(shapeResult.edgeToSplit);
      if (!edge) {
        continue;
      }

      const { from, to } = edge;
      const { dummyId, newEdgeIds } = splitEdge(state.graph, shapeResult.edgeToSplit);
      state.edgeSplits++;

      // Update the cycle set to include the new vertex/edges
      // Reference: (DOMUS, p.8, §4.1) - "indirectly alters the cycle set C"
      state.cycleSet.updateForSplit(shapeResult.edgeToSplit, from, to, dummyId, newEdgeIds);

      continue;
    }

    // SAT succeeded -> we have a shape
    const shape = shapeResult.shape!;
    state.shape = shape;

    // Drawing Construction: test rectilinear drawability
    const drawResult = drawingConstruction(state.graph, shape, opts.debug);

    if (drawResult.drawable) {
      // Success!
      // Post-process: expand high-degree vertices into boxes based on the found shape
      // Reference: (DOMUS, p.15, §6, Figure 10)
      const expanded = expandHighDegreeVerticesPostSat(state.graph, shape, opts.debug);

      // We need to re-run the auxiliary graph construction on the expanded graph
      // to get the final coordinates that respect the box spacing.
      const finalDrawResult = drawingConstruction(state.graph, shape, opts.debug);

      if (!finalDrawResult.drawable) {
        // This shouldn't happen if the expansion is correct
        if (opts.debug) {
          log.debug(DOMUS_DEBUG, 'domus_fail_expansion_not_drawable');
        }
        return createFailureResult(state);
      }

      const nodeSizesForCompaction =
        opts.nodeSizes && expanded.hasExpansions
          ? augmentNodeSizesForPostSatExpansion(opts.nodeSizes, expanded.expansions)
          : opts.nodeSizes;

      const fullCoordinates = computeCoordinatesFromShape(
        finalDrawResult.result!,
        state.graph,
        nodeSizesForCompaction,
        true,
        state.nodePadding,
        shape
      );
      let coordinates = fullCoordinates;

      // Collapse expanded vertices back to centroids
      if (expanded.hasExpansions) {
        coordinates = collapseExpandedVertices(fullCoordinates, expanded.expansions);
      }

      return {
        success: true,
        graph: state.graph,
        shape,
        coordinates,
        fullCoordinates,
        expansions: expanded.hasExpansions ? expanded.expansions : undefined,
        stats: {
          satInvocations: state.satInvocations,
          cyclesAdded: state.cyclesAdded,
          edgeSplits: state.edgeSplits,
          dummyVertices: state.graph.dummyVertices.size,
          expandedVertices: expanded.expansions.size,
        },
      };
    }

    // Shape is not drawable -> add witness cycle to C
    if (drawResult.witnessCycle) {
      const prevCount = state.cycleSet.cycles.length;
      state.cycleSet.add(drawResult.witnessCycle);
      const newCount = state.cycleSet.cycles.length;

      if (newCount === prevCount) {
        // No new cycles added -> we might be in a loop
        if (opts.debug) {
          log.debug(DOMUS_DEBUG, 'domus_fail_no_progress_cycle_already_in_set');
        }
        // Force an edge split if we're not making progress with cycles
        const fallbackEdge = pickFallbackEdgeToSplit(state.graph);
        if (fallbackEdge) {
          const edge = state.graph.edges.get(fallbackEdge);
          if (edge) {
            const { from, to } = edge;
            const { dummyId, newEdgeIds } = splitEdge(state.graph, fallbackEdge);
            state.edgeSplits++;
            state.cycleSet.updateForSplit(fallbackEdge, from, to, dummyId, newEdgeIds);
            continue;
          }
        }
        return createFailureResult(state);
      }

      if (opts.debug) {
        log.debug(DOMUS_DEBUG, 'domus_add_witness_cycle', {
          cycleLength: drawResult.witnessCycle.vertices.length,
          totalCycles: newCount,
        });
      }

      state.cyclesAdded++;
    } else {
      // No witness cycle found -> shouldn't happen, give up
      if (opts.debug) {
        log.debug(DOMUS_DEBUG, 'domus_fail_no_witness_cycle');
      }
      return createFailureResult(state);
    }
  }

  // Exceeded limits
  if (opts.debug) {
    log.debug(DOMUS_DEBUG, 'domus_exceeded_limits', {
      satInvocations: state.satInvocations,
      edgeSplits: state.edgeSplits,
    });
  }

  return createFailureResult(state);
}

/**
 * Shape Construction step: solve SAT to find a valid shape.
 *
 * Reference: (DOMUS, p.8-9, §4.1)
 */
function shapeConstruction(
  state: DomusState,
  debug: boolean
): { success: boolean; shape?: Shape; edgeToSplit?: string } {
  // Generate SAT formula
  const { formula, vars } = generateShapeSATFormula(state.graph, state.cycleSet, state.constraints);

  if (debug) {
    log.debug(DOMUS_DEBUG, 'shape_construction', {
      numVars: formula.numVars,
      numClauses: formula.clauses.length,
    });
  }

  // Solve SAT (apply preference bias as a heuristic, not as hard clauses).
  // When UNSAT, pick a single culprit variable to drive edge splitting from the
  // solver's own conflict analysis (paper: "use the solver's proof").
  //
  // We deliberately do NOT ask for a clause core here. `requestUnsatCore` runs
  // deletion-based extraction — one full re-solve per clause, up to 300 of them
  // — and on `domus/mermaid-chart-architecture` that was 1976 ms of a 13.5 s
  // render, more than the whole rest of DOMUS placement and routing combined.
  // The paper asks for nothing that expensive: "we use the solver's proof to
  // determine which edge to subdivide" and "SM identifies an over-constrained
  // edge-label variable and subdivides the corresponding edge" (LIPIcs.GD.2025.35,
  // Abstract and §4.3). It never asks for a minimal core — the terms
  // "unsatisfiable core"/"MUS" do not appear in it — and its termination argument
  // is an existence one that does not mention the proof at all: "The overall
  // process terminates because every graph has an orthogonal drawing" (§4.3). The
  // choice is therefore a heuristic over iteration count and drawing quality, and
  // conflict analysis is exactly the proof output Glucose is credited with in §5.
  // What must be preserved is progress (one edge split per UNSAT round) and
  // determinism — `pickCulpritVarFromConflictVars` tie-breaks on edgeId, then
  // label order L,R,D,U, then variable id, and `identifyEdgeToSplit` /
  // `pickFallbackEdgeToSplit` below still guarantee an edge when conflict
  // analysis hands back no edge-label variable.
  const variableBias = buildPreferenceVariableBias(vars, state.constraints);
  const satResult = solveShapeSAT(
    formula,
    vars,
    debug,
    { requestUnsatCore: false },
    { variableBias }
  );

  if (satResult.satisfiable && satResult.assignment) {
    // Extract shape from assignment (pass graph for canonical direction info)
    const shape = extractShapeFromAssignment(satResult.assignment, vars, state.graph);
    return { success: true, shape };
  }

  // UNSAT -> identify edge to split.
  // Prefer the single culprit variable chosen from the UNSAT core if available.
  let edgeToSplit: string | null = null;
  if (satResult.culpritVar) {
    edgeToSplit = vars.varToEdge.get(satResult.culpritVar)?.edgeId ?? null;
  }
  // Fallback: older conflict-var heuristic or biconnected-component heuristic.
  edgeToSplit ??= satResult.conflictVars
    ? identifyEdgeToSplit(satResult.conflictVars, vars, state.edgeActivity)
    : pickFallbackEdgeToSplit(state.graph);

  return { success: false, edgeToSplit: edgeToSplit ?? undefined };
}

/**
 * Pick a fallback edge to split when conflict analysis doesn't identify one.
 * Uses a simple heuristic: pick an edge in a non-trivial biconnected component.
 */
function pickFallbackEdgeToSplit(graph: DomusGraph): string | null {
  const components = findBiconnectedComponents(graph);

  // Find a non-trivial component
  for (const comp of components) {
    if (!comp.isTrivial) {
      // Pick any edge from this component
      const edgeId = comp.edges.values().next().value;
      if (edgeId) {
        return edgeId;
      }
    }
  }

  // No non-trivial component; pick any edge
  const firstEdge = graph.edges.keys().next().value;
  return firstEdge ?? null;
}

/**
 * Drawing Construction step: test if the shape is rectilinear drawable.
 *
 * Reference: (DOMUS, p.8, §4.2)
 */
function drawingConstruction(
  graph: DomusGraph,
  shape: Shape,
  debug: boolean
): {
  drawable: boolean;
  result?: ReturnType<typeof testRectilinearDrawability>;
  witnessCycle?: SimpleCycle;
} {
  const result = testRectilinearDrawability(graph, shape, debug);

  if (result.drawable) {
    return { drawable: true, result };
  }

  return {
    drawable: false,
    witnessCycle: result.witnessCycle,
  };
}

/**
 * Create a failure result.
 */
function createFailureResult(state: DomusState): DomusResult {
  return {
    success: false,
    graph: state.graph,
    shape: state.shape,
    stats: {
      satInvocations: state.satInvocations,
      cyclesAdded: state.cyclesAdded,
      edgeSplits: state.edgeSplits,
      dummyVertices: state.graph.dummyVertices.size,
    },
  };
}

/**
 * Convert raw grid coordinates from DOMUS to pixel coordinates.
 *
 * The raw coordinates from computeCoordinatesFromShape are in "grid units"
 * based on topological ordering. This function converts them to pixel
 * coordinates with specified spacing.
 *
 * **This is the axis-sign boundary.** Grid space is the paper's space, where the
 * y axis points *up*: DOMUS §2 defines label `U` on (u,v) by `y(u) < y(v)`, and
 * `buildAuxiliaryGraphGy` follows it, giving a U-labelled edge's head the larger
 * Gy coordinate. Pixel space is SVG's, where y points *down*. Emitting grid y
 * unchanged conflated the two and rendered every drawing upside down — a TB
 * flowchart flowed bottom-up. So y is negated here, and only here.
 *
 * Negating (rather than rebuilding Gy against the screen axis) keeps the whole
 * solver — SAT trajectory, drawability test, compaction packing and its
 * overlap-separation tie-breaks — working on exactly the coordinates it always
 * did, so the emitted drawing is the *exact vertical mirror* of the old one:
 * same shape, same bend count, same crossings. Reversing Gy's arcs instead is
 * equally paper-faithful (it is what DOMUS §3 literally says, and the paper
 * contradicts its own §2 here) but it re-runs longest-path compaction on the
 * reversed constraint graph, which is not a reflection of the original packing
 * — measured on the DDLT sweep as +5 crossings and a 120-point loss.
 *
 * @param coordinates - Raw coordinates from DOMUS, y axis pointing up
 * @param nodeSpacing - Spacing between adjacent grid positions
 * @param baseOffset - Base offset for the origin
 * @param yFlipReference - Grid y that the reflection maps onto `baseOffset.y`.
 *   Pass the maximum grid y over *every* coordinate map being converted for the
 *   same drawing to keep the result in positive pixel space; callers converting
 *   several maps (e.g. collapsed node coords and expanded routing coords) MUST
 *   pass the same value, or nodes and their edge endpoints land in frames offset
 *   from each other. Defaults to `0`, i.e. a plain negation about `baseOffset.y`.
 * @returns Pixel coordinates, y axis pointing down (SVG)
 */
export function gridToPixelCoordinates(
  coordinates: Map<string, Point>,
  nodeSpacing = 100,
  baseOffset: Point = { x: 50, y: 50 },
  yFlipReference = 0
): Map<string, Point> {
  const pixelCoords = new Map<string, Point>();

  for (const [vertexId, { x, y }] of coordinates) {
    pixelCoords.set(vertexId, {
      x: baseOffset.x + x * nodeSpacing,
      y: baseOffset.y + (yFlipReference - y) * nodeSpacing,
    });
  }

  return pixelCoords;
}

/**
 * Reconstruct edge paths from the DOMUS result.
 *
 * This converts the shape information back into polyline points for
 * edge rendering, handling dummy vertices (bends) and expanded vertices.
 *
 * @param result - The DOMUS result
 * @param pixelCoords - Pixel coordinates for all vertices (un-collapsed)
 * @param originalEdges - The original edges (before any splitting)
 * @returns Edge paths as polylines
 */
export function reconstructEdgePaths(
  result: DomusResult,
  pixelCoords: Map<string, Point>,
  originalEdges: { id: string; from: string; to: string }[],
  _nodeSizes?: Map<string, { width: number; height: number }>
): Map<string, Point[]> {
  const paths = new Map<string, Point[]>();

  if (!result.success || !result.shape) {
    // Fall back to straight lines
    for (const edge of originalEdges) {
      const fromCoord = pixelCoords.get(edge.from);
      const toCoord = pixelCoords.get(edge.to);
      if (fromCoord && toCoord) {
        paths.set(edge.id, [fromCoord, toCoord]);
      }
    }
    return paths;
  }

  // For each original edge, trace through any dummy vertices and expansion chains
  for (const originalEdge of originalEdges) {
    // Find actual endpoints in the (possibly expanded) graph
    let actualFrom = originalEdge.from;
    const fromExpansion = result.expansions?.get(originalEdge.from);
    if (fromExpansion) {
      actualFrom = fromExpansion.neighborToChainVertex.get(originalEdge.to) ?? actualFrom;
    }

    let actualTo = originalEdge.to;
    const toExpansion = result.expansions?.get(originalEdge.to);
    if (toExpansion) {
      actualTo = toExpansion.neighborToChainVertex.get(originalEdge.from) ?? actualTo;
    }

    const path = traceEdgePath(originalEdge.id, actualFrom, actualTo, result.graph, pixelCoords);

    // Mermaid rendering expects edge endpoints to be expressed in *node-center space*:
    // - edge points start/end at node centroids
    // - the renderer (`insertEdge`) computes the border intersection via `node.intersect`
    //
    // Even for high-degree (expanded) vertices, we keep this convention and let the
    // renderer clip the center→outside ray to the node boundary.
    if (fromExpansion) {
      const centroid = result.coordinates?.get(originalEdge.from);
      if (centroid) {
        path.unshift(centroid);
      }
    }
    if (toExpansion) {
      const centroid = result.coordinates?.get(originalEdge.to);
      if (centroid) {
        path.push(centroid);
      }
    }

    paths.set(originalEdge.id, path);
  }

  return paths;
}

/**
 * Trace the path for an edge that may have been split into multiple segments.
 *
 * Uses the graph structure and originalEdgeId tracking to find the unique
 * sequence of segments that form the orthogonal path between original endpoints.
 *
 * Reference: (DOMUS, p.5, §2) - "replacing certain edges of E(G) with
 * internally vertex-disjoint simple paths"
 *
 * Exported so the `useExistingPositions=true` path (`createEdgePathsFromShape`
 * in `edgePaths.ts`) can reuse the same walk logic that `reconstructEdgePaths`
 * uses for the `useExistingPositions=false` path — this is R1/Phase A1 of the
 * DOMUS plan.
 */
export function traceEdgePath(
  originalEdgeId: string,
  originalFrom: string,
  originalTo: string,
  graph: DomusGraph,
  pixelCoords: Map<string, Point>
): Point[] {
  const pathPoints: Point[] = [];

  // Filter edges that belong to this original edge
  const segments = [...graph.edges.values()].filter((e) => e.originalEdgeId === originalEdgeId);

  if (segments.length === 0) {
    // Should not happen if data is consistent
    const start = pixelCoords.get(originalFrom);
    const end = pixelCoords.get(originalTo);
    return start && end ? [start, end] : [];
  }

  // Build adjacency for just these segments
  const localAdj = new Map<string, string[]>();
  for (const seg of segments) {
    if (!localAdj.has(seg.from)) {
      localAdj.set(seg.from, []);
    }
    if (!localAdj.has(seg.to)) {
      localAdj.set(seg.to, []);
    }
    localAdj.get(seg.from)?.push(seg.to);
    localAdj.get(seg.to)?.push(seg.from);
  }

  // Trace simple path from originalFrom to originalTo
  const visited = new Set<string>();
  const path: string[] = [];

  function dfs(current: string): boolean {
    visited.add(current);
    path.push(current);

    if (current === originalTo) {
      return true;
    }

    for (const neighbor of localAdj.get(current) ?? []) {
      if (!visited.has(neighbor) && dfs(neighbor)) {
        return true;
      }
    }

    path.pop();
    return false;
  }

  if (dfs(originalFrom)) {
    for (const v of path) {
      const coord = pixelCoords.get(v);
      if (coord) {
        pathPoints.push(coord);
      }
    }
  } else {
    // Fallback if path not found
    const start = pixelCoords.get(originalFrom);
    const end = pixelCoords.get(originalTo);
    if (start) {
      pathPoints.push(start);
    }
    if (end) {
      pathPoints.push(end);
    }
  }

  return pathPoints;
}

// Re-export types and utilities for convenience
export * from './types.js';
export * from './graphAnalysis.js';
export * from './drawability.js';
// Note: `./satEncoding.js` also defines a `SATResult` that would collide with
// the canonical `SATResult` from `./types.js`. We re-export everything from
// satEncoding *except* the duplicate `SATResult` to avoid an ambiguous export.
export {
  generateShapeSATFormula,
  extractShapeFromAssignment,
  solveSAT,
  solveShapeSAT,
  identifyEdgeToSplit,
  buildPreferenceVariableBias,
} from './satEncoding.js';
export type { SolveSatOptions, ShapeSatSolveOptions, ShapeSatSolveResult } from './satEncoding.js';
