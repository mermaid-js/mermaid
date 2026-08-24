/**
 * Rectilinear Drawability Testing for DOMUS
 *
 * Implements the drawability test via auxiliary graphs Gx and Gy.
 *
 * A shaped graph is rectilinear drawable iff both Gx and Gy are acyclic.
 * If either contains a cycle, we can extract a non-complete witness cycle
 * from the original graph to add to the cycle set C.
 *
 * Reference: (DOMUS, p.6-7, §3, Theorem 2, Theorem 3)
 */

import type {
  DomusGraph,
  Shape,
  AuxiliaryGraph,
  AuxNode,
  DrawabilityResult,
  SimpleCycle,
  EdgeLabel,
  Point,
} from './types.js';
import { log } from '../../../../logger.js';
import { ORTHO_DEBUG } from '../debug.js';
import { longestPathCompaction } from '../compaction.js';
import { extractFaces, faceDirectionForPair } from './faces.js';

const DOMUS_DEBUG = ORTHO_DEBUG;

/**
 * Build the auxiliary graph Gx from a shaped graph.
 *
 * Gx nodes: maximal sets of x-aligned vertices (connected by D or U edges)
 * Gx arcs: from node μ to node ν if there's an R edge from some u∈μ to v∈ν
 *
 * Reference: (DOMUS, p.6-7, §3)
 *
 * @param graph - The DOMUS graph
 * @param shape - The shape (edge labels)
 * @returns The auxiliary graph Gx
 */
export function buildAuxiliaryGraphGx(graph: DomusGraph, shape: Shape): AuxiliaryGraph {
  const gx: AuxiliaryGraph = {
    type: 'Gx',
    nodes: new Map<string, AuxNode>(),
    arcs: [],
    vertexToNode: new Map<string, string>(),
  };

  // Step 1: Find x-aligned vertex classes using Union-Find
  // Two vertices are x-aligned if connected by a path of D/U edges
  const parent = new Map<string, string>();
  const rank = new Map<string, number>();

  function find(v: string): string {
    if (!parent.has(v)) {
      parent.set(v, v);
      rank.set(v, 0);
    }
    if (parent.get(v) !== v) {
      parent.set(v, find(parent.get(v)!));
    }
    return parent.get(v)!;
  }

  function union(u: string, v: string): void {
    const pu = find(u);
    const pv = find(v);
    if (pu === pv) {
      return;
    }

    const ru = rank.get(pu)!;
    const rv = rank.get(pv)!;

    if (ru < rv) {
      parent.set(pu, pv);
    } else if (ru > rv) {
      parent.set(pv, pu);
    } else {
      parent.set(pv, pu);
      rank.set(pu, ru + 1);
    }
  }

  // Initialize all vertices
  for (const v of graph.vertices) {
    find(v);
  }

  // Union vertices connected by D or U edges
  for (const edge of graph.edges.values()) {
    const label = shape.labels.get(edge.id);
    if (label === 'D' || label === 'U') {
      union(edge.from, edge.to);
    }
  }

  // Create Gx nodes from equivalence classes
  const classToNode = new Map<string, AuxNode>();
  let nodeCounter = 0;

  for (const v of graph.vertices) {
    const root = find(v);
    if (!classToNode.has(root)) {
      const nodeId = `gx_${nodeCounter++}`;
      classToNode.set(root, {
        id: nodeId,
        vertices: new Set<string>(),
      });
    }
    const node = classToNode.get(root)!;
    node.vertices.add(v);
    gx.vertexToNode.set(v, node.id);
  }

  // Add nodes to Gx
  for (const node of classToNode.values()) {
    gx.nodes.set(node.id, node);
  }

  // Step 2: Add arcs for L/R edges
  // Arc from μ to ν if there's an edge (u,v) with u∈μ, v∈ν and label R
  // Or equivalently, edge (v,u) with label L
  for (const edge of graph.edges.values()) {
    const label = shape.labels.get(edge.id);
    if (!label) {
      continue;
    }

    const fromNode = gx.vertexToNode.get(edge.from);
    const toNode = gx.vertexToNode.get(edge.to);

    if (!fromNode || !toNode || fromNode === toNode) {
      continue;
    }

    if (label === 'R') {
      // Arc from fromNode to toNode (left to right)
      gx.arcs.push({
        from: fromNode,
        to: toNode,
        inducingEdge: edge,
      });
    } else if (label === 'L') {
      // Arc from toNode to fromNode (right to left means to is left of from)
      gx.arcs.push({
        from: toNode,
        to: fromNode,
        inducingEdge: edge,
      });
    }
  }

  return gx;
}

/**
 * Build the auxiliary graph Gy from a shaped graph.
 *
 * Gy nodes: maximal sets of y-aligned vertices (connected by L or R edges)
 * Gy arcs: from node μ to node ν if there's a U edge from some u∈μ to v∈ν
 *
 * Reference: (DOMUS, p.6-7, §3)
 *
 * @param graph - The DOMUS graph
 * @param shape - The shape (edge labels)
 * @returns The auxiliary graph Gy
 */
export function buildAuxiliaryGraphGy(graph: DomusGraph, shape: Shape): AuxiliaryGraph {
  const gy: AuxiliaryGraph = {
    type: 'Gy',
    nodes: new Map<string, AuxNode>(),
    arcs: [],
    vertexToNode: new Map<string, string>(),
  };

  // Step 1: Find y-aligned vertex classes using Union-Find
  // Two vertices are y-aligned if connected by a path of L/R edges
  const parent = new Map<string, string>();
  const rank = new Map<string, number>();

  function find(v: string): string {
    if (!parent.has(v)) {
      parent.set(v, v);
      rank.set(v, 0);
    }
    if (parent.get(v) !== v) {
      parent.set(v, find(parent.get(v)!));
    }
    return parent.get(v)!;
  }

  function union(u: string, v: string): void {
    const pu = find(u);
    const pv = find(v);
    if (pu === pv) {
      return;
    }

    const ru = rank.get(pu)!;
    const rv = rank.get(pv)!;

    if (ru < rv) {
      parent.set(pu, pv);
    } else if (ru > rv) {
      parent.set(pv, pu);
    } else {
      parent.set(pv, pu);
      rank.set(pu, ru + 1);
    }
  }

  // Initialize all vertices
  for (const v of graph.vertices) {
    find(v);
  }

  // Union vertices connected by L or R edges
  for (const edge of graph.edges.values()) {
    const label = shape.labels.get(edge.id);
    if (label === 'L' || label === 'R') {
      union(edge.from, edge.to);
    }
  }

  // Create Gy nodes from equivalence classes
  const classToNode = new Map<string, AuxNode>();
  let nodeCounter = 0;

  for (const v of graph.vertices) {
    const root = find(v);
    if (!classToNode.has(root)) {
      const nodeId = `gy_${nodeCounter++}`;
      classToNode.set(root, {
        id: nodeId,
        vertices: new Set<string>(),
      });
    }
    const node = classToNode.get(root)!;
    node.vertices.add(v);
    gy.vertexToNode.set(v, node.id);
  }

  // Add nodes to Gy
  for (const node of classToNode.values()) {
    gy.nodes.set(node.id, node);
  }

  // Step 2: Add arcs for U/D edges
  // Arc from μ to ν if there's an edge (u,v) with u∈μ, v∈ν and label U
  // Or equivalently, edge (v,u) with label D
  for (const edge of graph.edges.values()) {
    const label = shape.labels.get(edge.id);
    if (!label) {
      continue;
    }

    const fromNode = gy.vertexToNode.get(edge.from);
    const toNode = gy.vertexToNode.get(edge.to);

    if (!fromNode || !toNode || fromNode === toNode) {
      continue;
    }

    if (label === 'U') {
      // Arc from fromNode to toNode (bottom to top)
      gy.arcs.push({
        from: fromNode,
        to: toNode,
        inducingEdge: edge,
      });
    } else if (label === 'D') {
      // Arc from toNode to fromNode (top to bottom means to is above from)
      gy.arcs.push({
        from: toNode,
        to: fromNode,
        inducingEdge: edge,
      });
    }
  }

  return gy;
}

/**
 * Find a cycle in a directed graph using DFS.
 *
 * Handles edge cases:
 * - Self-loops (arc from node to itself)
 * - Multiple arcs between same nodes
 *
 * @param aux - The auxiliary graph
 * @returns A cycle as a list of node IDs, or null if acyclic
 */
function findCycleInAuxGraph(aux: AuxiliaryGraph): string[] | null {
  const WHITE = 0; // Not visited
  const GRAY = 1; // In current DFS path
  const BLACK = 2; // Finished

  const color = new Map<string, number>();
  const parent = new Map<string, string | null>();

  // Build adjacency list
  const adj = new Map<string, string[]>();
  for (const node of aux.nodes.values()) {
    adj.set(node.id, []);
  }
  for (const arc of aux.arcs) {
    // Check for self-loops first - they're trivial cycles
    if (arc.from === arc.to) {
      // Self-loop is a trivial cycle
      return [arc.from, arc.from];
    }
    adj.get(arc.from)?.push(arc.to);
  }

  // Initialize colors
  for (const nodeId of aux.nodes.keys()) {
    color.set(nodeId, WHITE);
  }

  /**
   * DFS that returns a cycle if found.
   */
  function dfs(u: string): string[] | null {
    color.set(u, GRAY);

    for (const v of adj.get(u) ?? []) {
      if (color.get(v) === GRAY) {
        // Found a back edge -> cycle
        const cycle: string[] = [v];
        let current: string | null = u;
        while (current !== null && current !== v) {
          cycle.push(current);
          current = parent.get(current) ?? null;
        }
        cycle.push(v);
        cycle.reverse();
        return cycle;
      } else if (color.get(v) === WHITE) {
        parent.set(v, u);
        const result = dfs(v);
        if (result) {
          return result;
        }
      }
    }

    color.set(u, BLACK);
    return null;
  }

  for (const nodeId of aux.nodes.keys()) {
    if (color.get(nodeId) === WHITE) {
      parent.set(nodeId, null);
      const cycle = dfs(nodeId);
      if (cycle) {
        return cycle;
      }
    }
  }

  return null;
}

/**
 * Convert a cycle in an auxiliary graph to a non-complete cycle in the original graph.
 *
 * Reference: (DOMUS, p.7, §3, Theorem 3 proof sketch)
 *
 * @param auxCycle - Cycle in the auxiliary graph (node IDs)
 * @param aux - The auxiliary graph
 * @param graph - The original graph
 * @param shape - The shape
 * @returns A non-complete simple cycle in the original graph
 */
function auxCycleToWitnessCycle(
  auxCycle: string[],
  aux: AuxiliaryGraph,
  graph: DomusGraph,
  shape: Shape
): SimpleCycle {
  // The auxiliary cycle μ_0, μ_1, ..., μ_{p-1} corresponds to:
  // - For each i, there's an arc from μ_i to μ_{i+1} induced by an edge
  // - Within each μ_i, vertices are connected by D/U (for Gx) or L/R (for Gy) edges
  //
  // We construct a witness cycle by:
  // 1. For each arc (μ_i, μ_{i+1}), pick the inducing edge (u_i, v_{i+1})
  // 2. Within μ_i, find a path from v_i to u_i using only aligning edges

  const n = auxCycle.length - 1; // auxCycle has repeated start = end
  const cycleVertices: string[] = [];
  const cycleEdgeIds: string[] = [];

  // The aligning labels depend on the auxiliary graph type
  const aligningLabels: Set<EdgeLabel> =
    aux.type === 'Gx' ? new Set(['D', 'U']) : new Set(['L', 'R']);

  // Build adjacency for aligning edges only
  const alignAdj = new Map<string, { neighbor: string; edgeId: string }[]>();
  for (const v of graph.vertices) {
    alignAdj.set(v, []);
  }
  for (const edge of graph.edges.values()) {
    const label = shape.labels.get(edge.id);
    if (label && aligningLabels.has(label)) {
      alignAdj.get(edge.from)?.push({ neighbor: edge.to, edgeId: edge.id });
      alignAdj.get(edge.to)?.push({ neighbor: edge.from, edgeId: edge.id });
    }
  }

  // Find inducing edges for arcs between consecutive auxiliary nodes
  const inducingEdges: { from: string; to: string; edgeId: string }[] = [];

  for (let i = 0; i < n; i++) {
    const fromAuxNode = auxCycle[i];
    const toAuxNode = auxCycle[(i + 1) % n];

    // Find the arc from fromAuxNode to toAuxNode
    const arc = aux.arcs.find((a) => a.from === fromAuxNode && a.to === toAuxNode);

    if (arc) {
      // The inducing edge direction depends on the label
      const label = shape.labels.get(arc.inducingEdge.id);
      if (aux.type === 'Gx') {
        if (label === 'R') {
          inducingEdges.push({
            from: arc.inducingEdge.from,
            to: arc.inducingEdge.to,
            edgeId: arc.inducingEdge.id,
          });
        } else if (label === 'L') {
          inducingEdges.push({
            from: arc.inducingEdge.to,
            to: arc.inducingEdge.from,
            edgeId: arc.inducingEdge.id,
          });
        }
      } else {
        // Gy
        if (label === 'U') {
          inducingEdges.push({
            from: arc.inducingEdge.from,
            to: arc.inducingEdge.to,
            edgeId: arc.inducingEdge.id,
          });
        } else if (label === 'D') {
          inducingEdges.push({
            from: arc.inducingEdge.to,
            to: arc.inducingEdge.from,
            edgeId: arc.inducingEdge.id,
          });
        }
      }
    }
  }

  // Now build the witness cycle
  // For each pair (inducingEdges[i].to, inducingEdges[(i+1)%n].from),
  // find a path within the auxiliary node using aligning edges

  for (let i = 0; i < inducingEdges.length; i++) {
    const currentEnd = inducingEdges[i].to;
    const nextStart = inducingEdges[(i + 1) % inducingEdges.length].from;

    // Add the inducing edge
    cycleVertices.push(inducingEdges[i].from);
    cycleEdgeIds.push(inducingEdges[i].edgeId);

    // If currentEnd != nextStart, find a path using aligning edges
    if (currentEnd !== nextStart) {
      const path = bfsPath(currentEnd, nextStart, alignAdj);
      if (path && path.vertices.length > 1) {
        // Add intermediate vertices and edges
        for (let j = 0; j < path.vertices.length - 1; j++) {
          cycleVertices.push(path.vertices[j]);
          cycleEdgeIds.push(path.edgeIds[j]);
        }
      } else {
        // Fallback: if no path found within auxiliary node, try direct connection
        // This can happen in edge cases with malformed auxiliary graphs
        log.warn(
          DOMUS_DEBUG,
          `${DOMUS_DEBUG} witness_path_not_found from=${currentEnd} to=${nextStart}`
        );
        // Add the currentEnd directly - the cycle may be incomplete but still useful
        cycleVertices.push(currentEnd);
      }
    }
  }

  // Validate cycle: must have at least 3 vertices and matching edges
  if (cycleVertices.length < 3 || cycleVertices.length !== cycleEdgeIds.length) {
    log.warn(
      DOMUS_DEBUG,
      `${DOMUS_DEBUG} invalid_witness_cycle vertices=${cycleVertices.length} edges=${cycleEdgeIds.length}`
    );
  }

  return {
    vertices: cycleVertices,
    edgeIds: cycleEdgeIds,
  };
}

/**
 * BFS to find a path between two vertices using only specific edges.
 */
function bfsPath(
  start: string,
  end: string,
  adj: Map<string, { neighbor: string; edgeId: string }[]>
): { vertices: string[]; edgeIds: string[] } | null {
  if (start === end) {
    return { vertices: [start], edgeIds: [] };
  }

  const visited = new Set<string>();
  const parent = new Map<string, { vertex: string; edgeId: string } | null>();
  const queue: string[] = [start];

  visited.add(start);
  parent.set(start, null);

  while (queue.length > 0) {
    const u = queue.shift()!;

    for (const { neighbor, edgeId } of adj.get(u) ?? []) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        parent.set(neighbor, { vertex: u, edgeId });
        queue.push(neighbor);

        if (neighbor === end) {
          // Reconstruct path
          const vertices: string[] = [];
          const edgeIds: string[] = [];
          let current: string | null = end;

          while (current !== null) {
            vertices.unshift(current);
            const p = parent.get(current);
            if (p) {
              edgeIds.unshift(p.edgeId);
              current = p.vertex;
            } else {
              current = null;
            }
          }

          return { vertices, edgeIds };
        }
      }
    }
  }

  return null;
}

/**
 * Test if a shaped graph is rectilinear drawable.
 *
 * A shaped graph is rectilinear drawable iff both Gx and Gy are acyclic.
 *
 * If not drawable, returns a witness non-complete cycle to add to C.
 *
 * Reference: (DOMUS, p.6-7, §3, Theorem 2, Theorem 3)
 *
 * @param graph - The DOMUS graph
 * @param shape - The shape (edge labels)
 * @param debug - Whether to log debug info
 * @returns Drawability result with witness if not drawable
 */
export function testRectilinearDrawability(
  graph: DomusGraph,
  shape: Shape,
  debug = false
): DrawabilityResult {
  // Build auxiliary graphs
  const gx = buildAuxiliaryGraphGx(graph, shape);
  const gy = buildAuxiliaryGraphGy(graph, shape);

  if (debug) {
    log.debug(DOMUS_DEBUG, 'domus_auxiliary_graphs', {
      gx: { nodes: gx.nodes.size, arcs: gx.arcs.length },
      gy: { nodes: gy.nodes.size, arcs: gy.arcs.length },
    });
  }

  // Check Gx for cycles
  const gxCycle = findCycleInAuxGraph(gx);
  if (gxCycle) {
    if (debug) {
      log.debug(DOMUS_DEBUG, 'domus_gx_cycle_found', gxCycle);
    }

    const witnessCycle = auxCycleToWitnessCycle(gxCycle, gx, graph, shape);

    return {
      drawable: false,
      witnessCycle,
      gx,
      gy,
    };
  }

  // Check Gy for cycles
  const gyCycle = findCycleInAuxGraph(gy);
  if (gyCycle) {
    if (debug) {
      log.debug(DOMUS_DEBUG, 'domus_gy_cycle_found', gyCycle);
    }

    const witnessCycle = auxCycleToWitnessCycle(gyCycle, gy, graph, shape);

    return {
      drawable: false,
      witnessCycle,
      gx,
      gy,
    };
  }

  // Both are acyclic -> drawable
  if (debug) {
    log.debug(DOMUS_DEBUG, 'domus_shape_is_drawable');
  }

  return {
    drawable: true,
    gx,
    gy,
  };
}

/**
 * Compute coordinates from a valid shape using the auxiliary graphs.
 *
 * - x-coordinates: topological order of Gx nodes
 * - y-coordinates: topological order of Gy nodes
 *
 * When `useCompaction` is true (the default), coordinates are produced by a
 * two-pass longest-path compaction with **Gauss-Seidel cross-axis coupling**:
 *
 *   pass-1 X  ← independent (no perpCoords)         → `_initialXCoord`
 *   pass-1 Y  ← independent (no perpCoords)         → `initialYCoord`
 *   pass-2 X  ← reads pass-1 Y as perpCoords        → `xCoord`
 *   pass-2 Y  ← reads **pass-2** X as perpCoords    → `yCoord`
 *
 * The asymmetry on pass-2 Y is deliberate (plan R2 / Phase B2). X is the
 * axis we correct first; Y then sees the *corrected* X when deciding where
 * visibility arcs must fire. Feeding pass-1 X into pass-2 Y (a Jacobi-style
 * update) would leave Y with stale perpendicular positions and can flip the
 * overlap decision — see the "Phase B2 two-pass Gauss-Seidel coupling" test
 * in `drawability.compaction.spec.ts` for a fixture where the two modes
 * diverge (pass-2 X compresses node spacing, which in turn *introduces* a
 * Y overlap that Jacobi would miss).
 *
 * Reference: (DOMUS, p.6-7, §3, Theorem 2 proof) — shape-to-coordinate step;
 * the Gauss-Seidel choice is a Mermaid adaptation to the rectangle-node
 * model, not a paper requirement (the paper operates on point vertices).
 *
 * @param result - The drawability result (must be drawable)
 * @param graph - The DOMUS graph
 * @param nodeSizes - Optional mapping from original vertex ID to its \{ width, height \}
 * @param useCompaction - Whether to use longest-path compaction (default: true)
 * @param nodePadding - Separation padding in layout units (default: 40)
 * @param shape - Optional shape for the planar-embedding face oracle (B1 wedge 3)
 * @returns Coordinate assignment for each vertex
 */
export function computeCoordinatesFromShape(
  result: DrawabilityResult,
  graph: DomusGraph,
  nodeSizes?: Map<string, { width: number; height: number }>,
  useCompaction = true,
  nodePadding = 40,
  shape?: Shape
): Map<string, Point> {
  if (!result.drawable || !result.gx || !result.gy) {
    throw new Error('Cannot compute coordinates for non-drawable shape');
  }

  const coordinates = new Map<string, Point>();

  // Log input state for debugging
  log.debug(DOMUS_DEBUG, 'COORD_COMPUTATION_INPUT', {
    vertexCount: graph.vertices.size,
    gxNodes: result.gx.nodes.size,
    gyNodes: result.gy.nodes.size,
    gxArcs: result.gx.arcs.length,
    gyArcs: result.gy.arcs.length,
    nodeSizesCount: nodeSizes?.size ?? 0,
    useCompaction,
  });

  // Use compacted coordinates for minimal layout, or topological order for simple layout
  let xCoord: Map<string, number>;
  let yCoord: Map<string, number>;

  if (useCompaction) {
    // Two-pass compaction with overlap constraints (Gauss-Seidel order —
    // X is corrected first, then Y reads the corrected X). See the
    // function-level docstring above for the coupling rationale.
    //
    // 1. Pass 1: compute initial coordinates independently on each axis
    //    (no cross-graph perpCoords yet).
    // 2. Pass 2 X: add separation constraints using pass-1 Y as perpCoords.
    // 3. Pass 2 Y: add separation constraints using **pass-2 X** (not
    //    pass-1 X) — pass-2 X is the "improved" perpCoords.
    //
    // Pass 1 is required because pass 2's perpendicular-overlap detector
    // needs some perpCoords to look at.

    // Pass 1: Initial compaction (may have overlaps)
    const initialXCoord = computeCompactedCoordinates(result.gx, nodeSizes, 'width', nodePadding);
    const initialYCoord = computeCompactedCoordinates(result.gy, nodeSizes, 'height', nodePadding);

    // B1 wedge 3 / iter-15: extract the planar embedding's faces once so
    // pass-2's overlap-constraint emission can use a face-walk direction
    // oracle instead of sorted-ID. Skipped when shape isn't supplied
    // (legacy callers); pass-2 then falls back to sorted-ID.
    const faces = shape ? extractFaces(graph, shape) : undefined;

    // Pass 2: Add overlap constraints and recompute
    xCoord = computeCompactedCoordinatesWithOverlapConstraints(
      result.gx,
      result.gy,
      initialYCoord,
      nodeSizes,
      'width',
      nodePadding,
      faces,
      initialXCoord
    );
    // Pass-2 Y — Gauss-Seidel coupling (B2): pass `xCoord` (the pass-2 X
    // result), NOT `_initialXCoord`. Reading pass-2 X lets Y's perp-overlap
    // detector see the corrected X positions; reading pass-1 X (Jacobi) would
    // feed stale perpCoords and can flip the overlap decision in either
    // direction. See `drawability.compaction.spec.ts` — "Phase B2 two-pass
    // Gauss-Seidel coupling" for a fixture where the two modes diverge.
    yCoord = computeCompactedCoordinatesWithOverlapConstraints(
      result.gy,
      result.gx,
      xCoord,
      nodeSizes,
      'height',
      nodePadding,
      faces,
      initialYCoord
    );
  } else {
    // Fallback: simple topological ordering
    const xOrder = topologicalSort(result.gx);
    xCoord = new Map<string, number>();
    for (const [i, element] of xOrder.entries()) {
      xCoord.set(element, i);
    }

    const yOrder = topologicalSort(result.gy);
    yCoord = new Map<string, number>();
    for (const [i, element] of yOrder.entries()) {
      yCoord.set(element, i);
    }
  }

  // Assign coordinates to each vertex
  for (const v of graph.vertices) {
    const gxNode = result.gx.vertexToNode.get(v);
    const gyNode = result.gy.vertexToNode.get(v);

    if (gxNode && gyNode) {
      coordinates.set(v, {
        x: xCoord.get(gxNode) ?? 0,
        y: yCoord.get(gyNode) ?? 0,
      });
    }
  }

  // Log computed coordinates with node sizes for overlap analysis
  const coordsWithSizes: {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }[] = [];
  for (const [id, coord] of coordinates) {
    const size = nodeSizes?.get(id);
    coordsWithSizes.push({
      id,
      x: coord.x,
      y: coord.y,
      width: size?.width ?? 0,
      height: size?.height ?? 0,
    });
  }
  log.debug(DOMUS_DEBUG, 'COORD_COMPUTATION_OUTPUT', {
    coordinateCount: coordinates.size,
    coordinates: coordsWithSizes,
  });

  return coordinates;
}

/**
 * Topological sort of an auxiliary graph (assumed acyclic).
 *
 * Iteration order is stabilized (sorted keys) so the result is deterministic
 * regardless of Map insertion order — R8 of the DOMUS plan.
 *
 * @param aux - The auxiliary graph
 * @returns Nodes in topological order
 */
function topologicalSort(aux: AuxiliaryGraph): string[] {
  const result: string[] = [];
  const visited = new Set<string>();

  // Build adjacency with sorted neighbour lists for deterministic DFS order.
  const adj = new Map<string, string[]>();
  for (const node of aux.nodes.values()) {
    adj.set(node.id, []);
  }
  for (const arc of aux.arcs) {
    adj.get(arc.from)?.push(arc.to);
  }
  for (const list of adj.values()) {
    list.sort();
  }

  function dfs(u: string): void {
    visited.add(u);
    for (const v of adj.get(u) ?? []) {
      if (!visited.has(v)) {
        dfs(v);
      }
    }
    result.push(u);
  }

  const sortedKeys = [...aux.nodes.keys()].sort();
  for (const nodeId of sortedKeys) {
    if (!visited.has(nodeId)) {
      dfs(nodeId);
    }
  }

  result.reverse();
  return result;
}

/**
 * Compute the transitive closure of an auxiliary graph's shape arcs.
 *
 * Returns a Set of `from->to` reachability pairs. Every node reaches itself.
 *
 * Used by `computeCompactedCoordinatesWithOverlapConstraints` to skip
 * redundant visibility arcs between aux-nodes already ordered by shape — the
 * plan's paper-phrased invariant "visibility arcs only between pairs not
 * transitively ordered by shape". Complexity: O(V * (V + E)) via DFS from
 * each node. Fine for the graph sizes DOMUS operates on.
 *
 * @param aux - The auxiliary graph (shape arcs only)
 * @returns Set of `from->to` strings covering reachable pairs (including self)
 */
export function computeTransitiveClosure(aux: AuxiliaryGraph): Set<string> {
  const adj = new Map<string, string[]>();
  for (const node of aux.nodes.values()) {
    adj.set(node.id, []);
  }
  for (const arc of aux.arcs) {
    adj.get(arc.from)?.push(arc.to);
  }

  const reach = new Set<string>();
  for (const start of aux.nodes.keys()) {
    const stack: string[] = [start];
    const seen = new Set<string>([start]);
    while (stack.length > 0) {
      const u = stack.pop()!;
      reach.add(`${start}->${u}`);
      for (const v of adj.get(u) ?? []) {
        if (!seen.has(v)) {
          seen.add(v);
          stack.push(v);
        }
      }
    }
  }
  return reach;
}

/**
 * Compute compacted coordinates using longest path algorithm.
 *
 * For proper compaction, we use longest path from source nodes to each node.
 * This minimizes the coordinate values while respecting all ordering constraints.
 *
 * This version optionally takes node sizes into account to ensure non-overlapping
 * layouts and applies a "slack-centering" pass to improve aesthetics.
 *
 * Reference: (DOMUS, p.7, §3, Theorem 2 proof), (Bekos et al. 2020)
 *
 * @param aux - The auxiliary graph
 * @param nodeSizes - Optional mapping from original vertex ID to its \{ width, height \}
 * @param dimension - Which dimension to use ('width' for Gx, 'height' for Gy)
 * @returns Coordinate for each node (minimal, balanced)
 */
function computeCompactedCoordinates(
  aux: AuxiliaryGraph,
  nodeSizes?: Map<string, { width: number; height: number }>,
  dimension?: 'width' | 'height',
  nodePadding = 40
): Map<string, number> {
  const auxNodeSizes = new Map<string, number>();
  for (const node of aux.nodes.values()) {
    let maxS = 0;
    if (nodeSizes && dimension) {
      for (const v of node.vertices) {
        const size = nodeSizes.get(v);
        if (size) {
          maxS = Math.max(maxS, size[dimension]);
        }
      }
    }
    auxNodeSizes.set(node.id, maxS);
  }

  const nodeIds = [...aux.nodes.keys()];
  const arcs = aux.arcs.map((arc) => {
    const fromSize = auxNodeSizes.get(arc.from) ?? 0;
    const toSize = auxNodeSizes.get(arc.to) ?? 0;
    let distance = 1;
    if (nodeSizes && dimension) {
      distance = nodePadding + fromSize / 2 + toSize / 2;
    }
    return { from: arc.from, to: arc.to, distance };
  });

  // Use shared compaction backend (balanced by default).
  return longestPathCompaction(nodeIds, arcs, {
    objective: 'balanced',
    componentGap: nodePadding + 50,
  });
}

/**
 * Check if two 1D intervals [a1, a2] and [b1, b2] overlap.
 */
function intervalsOverlap(a1: number, a2: number, b1: number, b2: number): boolean {
  return Math.max(a1, b1) < Math.min(a2, b2);
}

/**
 * Compute compacted coordinates with additional separation constraints for
 * auxiliary nodes whose vertices would overlap in the perpendicular dimension.
 *
 * This is the key fix for the node overlap problem: the basic DOMUS compaction
 * only adds separation constraints for nodes connected by shape arcs. But two
 * auxiliary nodes with no arc between them can end up at the same coordinate,
 * causing their vertices to overlap if their perpendicular ranges intersect.
 *
 * Reference: (DOMUS, p.10, §4.3) cites [6,7,29,35] for compaction algorithms
 * that handle non-overlapping box layouts.
 *
 * @param aux - The auxiliary graph to compact (Gx for x-coords, Gy for y-coords)
 * @param perpAux - The perpendicular auxiliary graph (Gy for x-coords, Gx for y-coords)
 * @param perpCoords - Coordinates from the perpendicular graph (used to detect overlap)
 * @param nodeSizes - Mapping from vertex ID to its \{ width, height \}
 * @param dimension - Which dimension to use ('width' for Gx, 'height' for Gy)
 * @returns Coordinate for each auxiliary node (minimal, balanced)
 */
export function computeCompactedCoordinatesWithOverlapConstraints(
  aux: AuxiliaryGraph,
  perpAux: AuxiliaryGraph,
  perpCoords: Map<string, number>,
  nodeSizes?: Map<string, { width: number; height: number }>,
  dimension?: 'width' | 'height',
  nodePadding = 40,
  faces?: SimpleCycle[],
  /**
   * Coordinates on THIS axis from the previous pass, used only to orient the
   * separation arcs added below. Supplying it is what keeps the constraint
   * graph acyclic — see the direction rule for why that is not optional.
   */
  parallelOrder?: Map<string, number>
): Map<string, number> {
  const perpDimension = dimension === 'width' ? 'height' : 'width';

  // B3 / iter-17: per-vertex bounds. Each aux-node contributes a list of
  // {vertexId, size, perpMin, perpMax}. Arc distance is computed by iterating
  // vertex pairs (v_a, v_b) that actually perp-overlap and taking the max of
  // `pad + v_a.size/2 + v_b.size/2`. When an aux-node contains mixed-width
  // siblings that don't all perp-overlap the other class, this tightens
  // separation vs the old class-max sizing (plan R2 — "Pair sizes use max
  // over class, not per-pair"). Missing `nodeSizes` entry → treat as
  // point vertex (size 0, perp range = perpCenter).
  interface VertexBound {
    vertexId: string;
    size: number;
    perpMin: number;
    perpMax: number;
  }
  const auxNodeVertexBounds = new Map<string, VertexBound[]>();

  for (const node of aux.nodes.values()) {
    const list: VertexBound[] = [];
    for (const v of node.vertices) {
      const size = nodeSizes?.get(v);
      const perpNodeId = perpAux.vertexToNode.get(v);
      const perpCenter = perpNodeId ? (perpCoords.get(perpNodeId) ?? 0) : 0;
      const dim = size && dimension ? (size[dimension] ?? 0) : 0;
      const perpSize = size ? (size[perpDimension] ?? 0) : 0;
      list.push({
        vertexId: v,
        size: dim,
        perpMin: perpCenter - perpSize / 2,
        perpMax: perpCenter + perpSize / 2,
      });
    }
    // Sort vertices for deterministic pair iteration (R8 alignment).
    list.sort((a, b) => a.vertexId.localeCompare(b.vertexId));
    auxNodeVertexBounds.set(node.id, list);
  }

  // B3 pair analyser: max separation over (v_a, v_b) pairs that actually
  // perp-overlap. Returns `hasOverlap = false` when no pair overlaps — the
  // caller then decides whether to emit a minimal-pad shape arc or skip
  // the visibility arc entirely.
  function pairArcDistance(
    aList: VertexBound[],
    bList: VertexBound[]
  ): { distance: number; hasOverlap: boolean } {
    let maxDist = 0;
    let hasOverlap = false;
    for (const va of aList) {
      for (const vb of bList) {
        if (intervalsOverlap(va.perpMin, va.perpMax, vb.perpMin, vb.perpMax)) {
          hasOverlap = true;
          const d = nodePadding + va.size / 2 + vb.size / 2;
          if (d > maxDist) {
            maxDist = d;
          }
        }
      }
    }
    return { distance: maxDist, hasOverlap };
  }

  // Reachability via shape arcs. Transitive closure lets us skip visibility
  // arcs that are already ordered by the shape (plan R2 / Phase B1 invariant:
  // "visibility arcs only between pairs not transitively ordered by shape").
  const reach = computeTransitiveClosure(aux);

  // Build arcs from shape (B3 — per-pair distances). Shape arcs always emit
  // (shape dictates order). When no vertex pair perp-overlaps, the arc
  // carries the minimal `nodePadding` — just enough to keep the classes'
  // centres apart — because no actual rectangle-rectangle separation is
  // required.
  const arcs: { from: string; to: string; distance: number }[] = [];

  for (const arc of aux.arcs) {
    const fromList = auxNodeVertexBounds.get(arc.from) ?? [];
    const toList = auxNodeVertexBounds.get(arc.to) ?? [];
    let distance = 1;
    if (nodeSizes && dimension) {
      const { distance: d, hasOverlap } = pairArcDistance(fromList, toList);
      distance = hasOverlap ? d : nodePadding;
    }
    arcs.push({ from: arc.from, to: arc.to, distance });
  }

  // Add separation constraints for auxiliary node pairs with overlapping
  // perpendicular ranges that aren't already ordered by shape (direct OR
  // transitive). Iteration uses sorted keys for R8 determinism. B3: the
  // overlap check runs per (v_a, v_b) pair — if the class-level union
  // overlaps but no actual pair does, the visibility arc is skipped.
  const nodeIds = [...aux.nodes.keys()].sort();
  let overlapConstraintsAdded = 0;
  const overlapConstraintDetails: {
    a: string;
    b: string;
    separation: number;
  }[] = [];

  for (let i = 0; i < nodeIds.length; i++) {
    for (let j = i + 1; j < nodeIds.length; j++) {
      const a = nodeIds[i];
      const b = nodeIds[j];

      // Skip if either direction is already reachable via shape arcs
      // (self-edges are excluded by j > i). This replaces the old direct-arc
      // check with a transitive one.
      if (reach.has(`${a}->${b}`) || reach.has(`${b}->${a}`)) {
        continue;
      }

      const aList = auxNodeVertexBounds.get(a) ?? [];
      const bList = auxNodeVertexBounds.get(b) ?? [];

      // B3: per-pair perp-overlap check. Union-based class-level overlap
      // can false-positive (two disjoint y-strips in a single class can
      // span a range that falsely overlaps another class's strip).
      const { distance: separation, hasOverlap } = pairArcDistance(aList, bList);
      if (!hasOverlap) {
        continue;
      }

      overlapConstraintsAdded++;
      overlapConstraintDetails.push({ a, b, separation });

      // Direction rule: prefer the planar embedding's face oracle
      // (B1 wedge 3 / iter-15) — find a face shared by some vertex in
      // class `a` and class `b`, use the CCW order on the smallest such
      // face. Falls back to the iter-4 sorted-ID rule when no shared face
      // gives a signal (e.g. disconnected components, degenerate shape).
      // Sorted-ID is `a < b` lexicographically because `i < j` in the
      // sorted-keys outer loop — keeps determinism as a backstop.
      let direction: 'a-to-b' | 'b-to-a' = 'a-to-b';
      if (parallelOrder) {
        // Orient by this axis's previous coordinates, id as the tie-break.
        //
        // This has to be a TOTAL ORDER, and that is the whole point. The
        // previous rule asked a face oracle per pair and fell back to
        // lexicographic id, neither of which is globally consistent: pair by
        // pair it can answer a<b, b<c and c<a. With hundreds of these arcs the
        // result is a cyclic constraint graph, and `longestPathCompaction`
        // solves by Kahn's algorithm — nodes inside a cycle never reach
        // in-degree zero, never enter the topological order, and are silently
        // skipped by the longest-path relaxation. They keep a default
        // coordinate and land on top of each other.
        //
        // That is not a corner case. On `domus/triage` it dropped 24 of 24
        // classes in Gx and 35 of 36 in Gy — compaction did not run AT ALL, and
        // the 98 overlapping pairs in that fixture are those untouched defaults.
        // It is also exactly the condition Eiglsperger and Kaufmann prove is
        // decisive: the compaction LP is feasible iff no cycle in the constraint
        // graphs has positive length (3-540-45848-4_11, §5.2).
        //
        // Ordering every added arc by one coordinate makes cycles impossible
        // among them, and the shape arcs already agree with that coordinate
        // because the previous pass's solution satisfied them — so the union
        // stays acyclic and every class gets relaxed.
        const oa = parallelOrder.get(a);
        const ob = parallelOrder.get(b);
        if (oa !== undefined && ob !== undefined && Math.abs(oa - ob) > 1e-9) {
          direction = oa < ob ? 'a-to-b' : 'b-to-a';
        }
      } else if (faces && faces.length > 0) {
        const auxNodeA = aux.nodes.get(a);
        const auxNodeB = aux.nodes.get(b);
        if (auxNodeA && auxNodeB) {
          const oracle = faceDirectionForPair(
            faces,
            new Set(auxNodeA.vertices),
            new Set(auxNodeB.vertices)
          );
          if (oracle !== null) {
            direction = oracle;
          }
        }
      }
      if (direction === 'a-to-b') {
        arcs.push({ from: a, to: b, distance: separation });
      } else {
        arcs.push({ from: b, to: a, distance: separation });
      }
    }
  }

  log.debug(DOMUS_DEBUG, 'OVERLAP_CONSTRAINTS', {
    auxType: aux.type,
    dimension,
    existingArcsUnique: aux.arcs.length,
    overlapConstraintsAdded,
    totalArcs: arcs.length,
    overlapConstraintDetails:
      overlapConstraintDetails.length <= 20
        ? overlapConstraintDetails
        : `(${overlapConstraintDetails.length} items)`,
  });

  // Use shared compaction backend
  return longestPathCompaction(nodeIds, arcs, {
    objective: 'balanced',
    componentGap: nodePadding + 50,
  });
}
