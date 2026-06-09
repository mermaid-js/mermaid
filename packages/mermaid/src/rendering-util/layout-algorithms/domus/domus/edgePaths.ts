/**
 * DOMUS Edge Path Utilities
 *
 * This module handles creation and application of edge polylines from
 * DOMUS shape results to Mermaid's LayoutData format.
 */

import type { LayoutData, Node } from '../../../types.js';
import type { Point, PortSide } from '../types.js';
import type { DomusResult, EdgeLabel } from './types.js';
import { buildNodesById } from './conversion.js';
import { traceEdgePath } from './domus.js';
import { rectForNode } from '../core/helpers.js';
import { computeBoundaryPortAtT } from '../core/geometry.js';

/**
 * Port plan entry emitted by A1's shape walk and consumed by C1 port
 * distribution (iter-19 / Phase B). `startSide` / `endSide` are derived
 * from the first / last axis-aligned segment of the walked polyline —
 * DOMUS §3: label λ ∈ \{L,R,U,D\} is the direction the edge travels, so
 * an axis-aligned first segment IS the start-side outward normal.
 *
 * The `t` hints are currently optional and unused — reserved for a
 * future C2 centre-pin step; iter-19 only wires the sides.
 */
export interface PortPlanEntry {
  startSide: PortSide;
  endSide: PortSide;
  startHintT?: number;
  endHintT?: number;
}

export type PortPlan = Map<string, PortPlanEntry>;

/**
 * Get the direction label for an edge based on endpoint positions.
 *
 * @param fromNode - Source node
 * @param toNode - Target node
 * @returns The primary direction from source to target
 */
export function getEdgeDirection(fromNode: Node, toNode: Node): EdgeLabel {
  const dx = (toNode.x ?? 0) - (fromNode.x ?? 0);
  const dy = (toNode.y ?? 0) - (fromNode.y ?? 0);

  // Prefer horizontal/vertical based on which delta is larger
  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0 ? 'R' : 'L';
  } else {
    return dy >= 0 ? 'D' : 'U';
  }
}

/**
 * Create Mermaid-style orthogonal routes:
 * - points are *not* snapped to node borders here
 * - the renderer (`insertEdge`) clips endpoints to box borders via `node.intersect`
 *
 * This avoids "hard-pinning" ports (e.g. always right side) and lets Mermaid's
 * border intersection logic decide the exact attachment points.
 */
function createMermaidStyleOrthogonalPath(fromNode: Node, toNode: Node): Point[] {
  const fromX = fromNode.x ?? 0;
  const fromY = fromNode.y ?? 0;
  const toX = toNode.x ?? 0;
  const toY = toNode.y ?? 0;

  const startCenter: Point = { x: fromX, y: fromY };
  const endCenter: Point = { x: toX, y: toY };

  const dx = toX - fromX;
  const dy = toY - fromY;
  const horizontalFirst = Math.abs(dx) >= Math.abs(dy);

  // Straight cases: for Mermaid's `insertEdge` clipping, we want points[0] to be a
  // point toward the head (so tail.intersect(points[0]) makes sense), and points[1]
  // toward the tail (so head.intersect(points[1]) makes sense).
  if (Math.abs(dx) < 1e-6 || Math.abs(dy) < 1e-6) {
    return [endCenter, startCenter];
  }

  if (horizontalFirst) {
    const midX = (fromX + toX) / 2;
    return [startCenter, { x: midX, y: fromY }, { x: midX, y: toY }, endCenter];
  }
  const midY = (fromY + toY) / 2;
  return [startCenter, { x: fromX, y: midY }, { x: toX, y: midY }, endCenter];
}

/**
 * Create edge polylines from DOMUS shape and existing node positions.
 *
 * R1 / Phase A1 of the DOMUS plan: walk `domusResult.graph` from each edge's
 * `start` to `end` via the `originalEdgeId`-tagged segments, emitting one
 * waypoint per traversed vertex. Original vertices use LayoutData positions
 * (so upstream BFS / dagre placement is honoured); dummy (bend) vertices use
 * `domusResult.fullCoordinates`. Collinear waypoints are collapsed (DOMUS §5:
 * a dummy carrying a π angle is a paper-legal pass-through, not a visible
 * bend). Falls back to the previous naive midpoint-L when the shape or graph
 * is unavailable, or when the walk cannot find a start→end path.
 *
 * Paper anchor: DOMUS §4.1–§4.2 + §5 (source `6784b3d1-1828-40e2-9a4f-7876b153ae28`)
 * — the polyline is the chain of segments through u, the inserted dummy
 * vertices w_1..w_k, and v in the subdivision graph G'.
 *
 * `insertEdge` still handles the final boundary clipping at original-vertex
 * endpoints, as it did before.
 *
 * @param layout - The LayoutData with node positions
 * @param domusResult - The DOMUS result with shape and graph
 * @returns Edge paths as polylines
 */
export function createEdgePathsFromShape(
  layout: LayoutData,
  domusResult: DomusResult
): Map<string, Point[]> {
  const paths = new Map<string, Point[]>();
  const nodesById = buildNodesById(layout);

  // Build a merged coordinate map. Originals take LayoutData x/y; dummies
  // (which only exist inside DomusGraph) take fullCoordinates. Falling back
  // to `coordinates` (collapsed) keeps the helper working when a DOMUS run
  // skipped vertex expansion.
  const coords = new Map<string, Point>();
  for (const node of layout.nodes ?? []) {
    if (node?.id == null) {
      continue;
    }
    const x = Number(node.x);
    const y = Number(node.y);
    if (Number.isFinite(x) && Number.isFinite(y)) {
      coords.set(String(node.id), { x, y });
    }
  }
  const domusCoords = domusResult.fullCoordinates ?? domusResult.coordinates;
  if (domusCoords) {
    for (const [id, pt] of domusCoords) {
      if (!coords.has(id)) {
        coords.set(id, pt);
      }
    }
  }

  const canWalkShape = Boolean(domusResult.success && domusResult.shape && domusResult.graph);

  for (const edge of layout.edges ?? []) {
    if (edge?.id == null || edge.start == null || edge.end == null) {
      continue;
    }

    const edgeId = String(edge.id);
    const fromNode = nodesById.get(String(edge.start));
    const toNode = nodesById.get(String(edge.end));
    if (!fromNode || !toNode) {
      continue;
    }

    if (canWalkShape) {
      const walked = traceEdgePath(
        edgeId,
        String(edge.start),
        String(edge.end),
        domusResult.graph,
        coords
      );
      const simplified = collapseCollinearPoints(walked);
      if (simplified.length >= 2) {
        const withBend = bendTwoPointIfMisaligned(
          simplified,
          edgeId,
          String(edge.start),
          String(edge.end),
          domusResult
        );
        paths.set(edgeId, withBend);
        continue;
      }
    }

    // Fallback: naive midpoint-L between centers. Preserves the pre-A1
    // behaviour for edges not represented in the graph (e.g. self-loops,
    // or edges omitted by an early DOMUS failure).
    paths.set(edgeId, createMermaidStyleOrthogonalPath(fromNode, toNode));
  }

  return paths;
}

/**
 * Upgrade a 2-point walked polyline to a 3-point L-shape when its endpoints
 * are not axis-aligned in pixel space. DOMUS's shape may assign a single
 * direction (e.g. `R`) to an edge with no dummy bends, but upstream placement
 * (BFS / dagre / user-fixed positions) can leave the two node centers
 * misaligned on both axes. A 2-point polyline between misaligned centers
 * renders as a diagonal segment after `insertEdge`'s rectangle clipping —
 * counted in `scoreLayout.renderedDiagonalEndpoints`.
 *
 * Mermaid-specific adaptation: the paper treats vertices as points (always
 * drawable from a single-direction edge), whereas Mermaid nodes are
 * rectangles with independent x/y. We honour the shape's direction label
 * for axis preference — `L`/`R` → horizontal-first, `U`/`D` → vertical-first
 * — and insert a single 90° bend. Polylines with three or more waypoints
 * already carry at least one bend from the shape walk and are returned
 * unchanged.
 */
function bendTwoPointIfMisaligned(
  pts: Point[],
  edgeId: string,
  fromId: string,
  toId: string,
  domusResult: DomusResult
): Point[] {
  if (pts.length !== 2) {
    return pts;
  }
  const [a, b] = pts;
  const dxZero = Math.abs(b.x - a.x) < 1e-6;
  const dyZero = Math.abs(b.y - a.y) < 1e-6;
  if (dxZero || dyZero) {
    return pts;
  }
  const label = domusResult.shape?.getLabel(fromId, toId, edgeId);
  const horizontalFirst =
    label === 'L' || label === 'R'
      ? true
      : label === 'U' || label === 'D'
        ? false
        : Math.abs(b.x - a.x) >= Math.abs(b.y - a.y);
  const bend: Point = horizontalFirst ? { x: b.x, y: a.y } : { x: a.x, y: b.y };
  return [a, bend, b];
}

/**
 * Collapse collinear consecutive points in an orthogonal polyline.
 *
 * DOMUS §5 permits a dummy vertex to carry a π (straight-through) angle —
 * rendered, this is no visible bend. Emitting that dummy as a waypoint is
 * correct paper-wise but produces a redundant point that downstream code
 * treats as a bend for metrics/sanitize. Collapsing is shape-legal as long
 * as we only remove middle points whose neighbours lie on the same axis line.
 */
function collapseCollinearPoints(pts: readonly Point[]): Point[] {
  if (pts.length < 3) {
    return [...pts];
  }
  const out: Point[] = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++) {
    const prev = out[out.length - 1];
    const cur = pts[i];
    const next = pts[i + 1];
    const collinearX = prev.x === cur.x && cur.x === next.x;
    const collinearY = prev.y === cur.y && cur.y === next.y;
    if (!(collinearX || collinearY)) {
      out.push(cur);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

/**
 * Derive a port plan from walked polylines (iter-19 / Phase B).
 *
 * For each edge with a walked polyline, inspect the FIRST segment's
 * axis-aligned direction to derive `startSide`, and the LAST segment's
 * direction (inverted — the edge enters the end vertex from the opposite
 * side) to derive `endSide`. Skips self-loops (separate router in
 * `runner.ts:applySelfLoopRoutes`), edges whose first or last segment is
 * diagonal (no inferable side), and edges with fewer than 2 points.
 *
 * Paper anchor: DOMUS §3 (`6784b3d1`) — λ labels ARE segment directions.
 * A post-`bendTwoPointIfMisaligned` + `collapseCollinearPoints` polyline
 * is guaranteed axis-aligned on every segment, so the geometric read
 * is equivalent to the paper label read.
 */
export function derivePortPlanFromPaths(paths: Map<string, Point[]>, data: LayoutData): PortPlan {
  const selfLoopIds = new Set<string>();
  for (const edge of data.edges ?? []) {
    if (edge?.id == null) {
      continue;
    }
    const startId = edge.start == null ? null : String(edge.start);
    const endId = edge.end == null ? null : String(edge.end);
    if (startId != null && endId != null && startId === endId) {
      selfLoopIds.add(String(edge.id));
    }
  }

  const plan: PortPlan = new Map();
  for (const [edgeId, pts] of paths) {
    if (selfLoopIds.has(edgeId)) {
      continue;
    }
    if (pts.length < 2) {
      continue;
    }
    const startSide = portSideFromFirstSegment(pts);
    const endSide = portSideFromLastSegment(pts);
    if (startSide === null || endSide === null) {
      continue;
    }
    plan.set(edgeId, { startSide, endSide });
  }
  return plan;
}

/**
 * Map a DOMUS label to the outward port side on the `from` vertex of
 * that segment. Label IS the direction the edge travels out of `from`,
 * so the side equals the label's direction (R→E, L→W, U→N, D→S).
 */
function labelToStartSide(label: EdgeLabel): PortSide {
  switch (label) {
    case 'R':
      return 'E';
    case 'L':
      return 'W';
    case 'U':
      return 'N';
    case 'D':
      return 'S';
  }
}

/**
 * Map a DOMUS label to the outward port side on the `to` vertex of
 * that segment. The edge enters `to` from the opposite side of its
 * travel direction (R-travelling edge enters from W, etc).
 */
function labelToEndSide(label: EdgeLabel): PortSide {
  switch (label) {
    case 'R':
      return 'W';
    case 'L':
      return 'E';
    case 'U':
      return 'S';
    case 'D':
      return 'N';
  }
}

/**
 * iter-21 / R15 — derive portPlan from the DOMUS shape's labels, not
 * from the walked polyline's geometry. This is the paper-faithful
 * formulation (DOMUS §3: each edge is a sequence of labels; the first
 * / last label IS the outward direction on the start / end vertex).
 *
 * For each original edge, locate the segments in `domusResult.graph`
 * whose `originalEdgeId` matches. The segment incident to the edge's
 * `start` node gives the start side (`shape.getLabel` on that segment);
 * the segment incident to the `end` node gives the end side. When a
 * vertex participates in more than one segment of the same original
 * edge (should not happen in a simple walk), the entry is skipped and
 * callers fall back to `derivePortPlanFromPaths`.
 */
export function derivePortPlanFromShape(
  domusResult: DomusResult,
  edges: readonly { id: string; start?: string; end?: string }[]
): PortPlan {
  const plan: PortPlan = new Map();
  const shape = domusResult.shape;
  const graph = domusResult.graph;
  if (!shape) {
    return plan;
  }
  for (const edge of edges) {
    if (edge?.id == null || edge.start == null || edge.end == null) {
      continue;
    }
    const edgeId = String(edge.id);
    const startId = String(edge.start);
    const endId = String(edge.end);
    if (startId === endId) {
      continue;
    }
    const segments = [...graph.edges.values()].filter((e) => e.originalEdgeId === edgeId);
    if (segments.length === 0) {
      continue;
    }
    // iter-22: when the start/end vertex was expanded into a port/core chain,
    // resolve its graph-side anchor via `expansions.neighborToChainVertex`.
    // Falls back to the logical ID when no expansion info is available, so
    // non-expanded edges behave exactly as before.
    const resolvedStartId = resolveExpandedEndpoint(startId, endId, domusResult.expansions);
    const resolvedEndId = resolveExpandedEndpoint(endId, startId, domusResult.expansions);
    const startSegmentsOnVertex = segments.filter(
      (seg) => seg.from === resolvedStartId || seg.to === resolvedStartId
    );
    const endSegmentsOnVertex = segments.filter(
      (seg) => seg.from === resolvedEndId || seg.to === resolvedEndId
    );
    if (startSegmentsOnVertex.length !== 1 || endSegmentsOnVertex.length !== 1) {
      continue;
    }
    const startSeg = startSegmentsOnVertex[0];
    const endSeg = endSegmentsOnVertex[0];
    const otherOfStart = startSeg.from === resolvedStartId ? startSeg.to : startSeg.from;
    const otherOfEnd = endSeg.from === resolvedEndId ? endSeg.to : endSeg.from;
    const startLabel = shape.getLabel(resolvedStartId, otherOfStart, startSeg.id);
    const endLabel = shape.getLabel(otherOfEnd, resolvedEndId, endSeg.id);
    if (!startLabel || !endLabel) {
      continue;
    }
    plan.set(edgeId, {
      startSide: labelToStartSide(startLabel),
      endSide: labelToEndSide(endLabel),
    });
  }
  return plan;
}

/**
 * iter-22 — resolve a logical (LayoutData) vertex ID to its DomusGraph-side
 * anchor when the vertex was expanded into a port/core chain in
 * `vertexExpansion.ts:expandHighDegreeVerticesPostSat`.
 *
 * For a non-expanded vertex (or missing expansions), returns the ID unchanged.
 * For an expanded vertex, consults `neighborToChainVertex` with the OTHER edge
 * endpoint (the pre-expansion neighbor) and returns either the `_core` or the
 * `_port_*` chain vertex bound to that side. The `neighborToChainVertex` map
 * is populated in `vertexExpansion.ts:158,186` and is the canonical source of
 * truth for "which port of vId connects to which neighbor".
 */
function resolveExpandedEndpoint(
  layoutVertexId: string,
  otherLayoutVertexId: string,
  expansions: DomusResult['expansions']
): string {
  if (!expansions) {
    return layoutVertexId;
  }
  const info = expansions.get(layoutVertexId);
  if (!info) {
    return layoutVertexId;
  }
  const chainVertex = info.neighborToChainVertex.get(otherLayoutVertexId);
  return chainVertex ?? layoutVertexId;
}

/**
 * iter-21 / R15 — build edge polylines anchored at actual port positions
 * (not node centres), using a portPlan (shape-derived sides) and an
 * allocator-computed `tByEdgeEndpointKey` map. This is the "full R15"
 * reorder: the allocator runs BEFORE A1, so the walked polyline can be
 * stitched directly into the per-edge reserved port slot.
 *
 * Flow per edge:
 *  1. Walk the DOMUS graph from start to end via `traceEdgePath`
 *     (existing helper; returns interior coordinates).
 *  2. Replace the walked polyline's first and last points with port
 *     coordinates computed via `computeBoundaryPortAtT(rect, side, t)`.
 *  3. If the resulting first segment (`port0 → pts[1]`) is diagonal,
 *     insert an elbow anchored to the port's outward axis so the first
 *     sub-segment is axis-aligned along the port normal. Same for end.
 *  4. Collapse any resulting collinear triples.
 *
 * Fallback: if portPlan / t-values lack an entry for the edge (e.g.
 * self-loops, group endpoints, edges outside the DOMUS graph), delegate
 * to the pre-R15 `createEdgePathsFromShape`.
 */
export function createEdgePathsFromShapeAtPorts(
  layout: LayoutData,
  domusResult: DomusResult,
  portPlan: PortPlan,
  tByEdgeEndpointKey: Map<string, number>
): Map<string, Point[]> {
  const paths = new Map<string, Point[]>();
  const nodesById = buildNodesById(layout);

  // Merged coordinate map: LayoutData for originals; fullCoordinates for dummies.
  const coords = new Map<string, Point>();
  for (const node of layout.nodes ?? []) {
    if (node?.id == null) {
      continue;
    }
    const x = Number(node.x);
    const y = Number(node.y);
    if (Number.isFinite(x) && Number.isFinite(y)) {
      coords.set(String(node.id), { x, y });
    }
  }
  const domusCoords = domusResult.fullCoordinates ?? domusResult.coordinates;
  if (domusCoords) {
    for (const [id, pt] of domusCoords) {
      if (!coords.has(id)) {
        coords.set(id, pt);
      }
    }
  }

  const canWalkShape = Boolean(domusResult.success && domusResult.shape && domusResult.graph);

  for (const edge of layout.edges ?? []) {
    if (edge?.id == null || edge.start == null || edge.end == null) {
      continue;
    }
    const edgeId = String(edge.id);
    const startId = String(edge.start);
    const endId = String(edge.end);
    const fromNode = nodesById.get(startId);
    const toNode = nodesById.get(endId);
    if (!fromNode || !toNode) {
      continue;
    }

    const planEntry = portPlan.get(edgeId);
    const tStart = tByEdgeEndpointKey.get(`${edgeId}|start`);
    const tEnd = tByEdgeEndpointKey.get(`${edgeId}|end`);
    const haveAllocation =
      planEntry != null && typeof tStart === 'number' && typeof tEnd === 'number';

    // Fallback for edges without a full allocation (self-loops, group endpoints,
    // edges DOMUS never touched).
    if (!haveAllocation || !canWalkShape || startId === endId) {
      paths.set(edgeId, createMermaidStyleOrthogonalPath(fromNode, toNode));
      continue;
    }

    // iter-22: walk the graph from the chain vertex, not the LayoutData ID,
    // when the vertex was expanded. `traceEdgePath` would otherwise fail to
    // find a path (the graph has no segment incident on the unresolved ID)
    // and fall back to a 2-point placeholder, dropping any DOMUS-placed
    // dummy bends.
    const tracedStartId = resolveExpandedEndpoint(startId, endId, domusResult.expansions);
    const tracedEndId = resolveExpandedEndpoint(endId, startId, domusResult.expansions);
    const walked = traceEdgePath(edgeId, tracedStartId, tracedEndId, domusResult.graph, coords);
    if (walked.length < 2) {
      paths.set(edgeId, createMermaidStyleOrthogonalPath(fromNode, toNode));
      continue;
    }

    const rs = rectForNode(fromNode);
    const re = rectForNode(toNode);
    const port0 = computeBoundaryPortAtT(rs, planEntry.startSide, tStart);
    const port1 = computeBoundaryPortAtT(re, planEntry.endSide, tEnd);

    // Start from the walked polyline but replace first / last point with port
    // coordinates. Interior dummies preserved.
    const stitched: Point[] = [port0, ...walked.slice(1, -1), port1];

    // Insert elbow after port0 if the next point is off-axis relative to the
    // port's outward normal. Similarly before port1. The elbow sits on the
    // port's outward axis so the first/last sub-segment is axis-aligned.
    const withStartElbow = ensureAxisAlignedPortExit(stitched, planEntry.startSide, 'start');
    const withBothElbows = ensureAxisAlignedPortExit(withStartElbow, planEntry.endSide, 'end');

    const simplified = collapseCollinearPoints(withBothElbows);
    paths.set(edgeId, simplified.length >= 2 ? simplified : withBothElbows);
  }

  return paths;
}

/**
 * Ensure the first (or last) sub-segment of a polyline exits (or enters)
 * the port in an axis-aligned direction matching the port's outward
 * normal. When the adjacent interior point is off-axis, insert an elbow
 * so that:
 *   - E/W ports emit/receive a horizontal segment at port.y
 *   - N/S ports emit/receive a vertical segment at port.x
 */
function ensureAxisAlignedPortExit(
  pts: readonly Point[],
  side: PortSide,
  which: 'start' | 'end'
): Point[] {
  if (pts.length < 2) {
    return [...pts];
  }
  const idxPort = which === 'start' ? 0 : pts.length - 1;
  const idxNeighbor = which === 'start' ? 1 : pts.length - 2;
  const port = pts[idxPort];
  const neighbor = pts[idxNeighbor];
  const isHorizontalSide = side === 'E' || side === 'W';
  const axisEqual = isHorizontalSide
    ? Math.abs(port.y - neighbor.y) < 1e-6
    : Math.abs(port.x - neighbor.x) < 1e-6;
  if (axisEqual) {
    return [...pts];
  }
  const elbow: Point = isHorizontalSide
    ? { x: neighbor.x, y: port.y }
    : { x: port.x, y: neighbor.y };
  const result = [...pts];
  if (which === 'start') {
    result.splice(1, 0, elbow);
  } else {
    result.splice(-1, 0, elbow);
  }
  return result;
}

/**
 * Outward port side on the `start` vertex, derived from the first
 * axis-aligned segment. Returns null for diagonal segments.
 */
function portSideFromFirstSegment(pts: readonly Point[]): PortSide | null {
  const a = pts[0];
  const b = pts[1];
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  if (Math.abs(dx) < 1e-6 && Math.abs(dy) < 1e-6) {
    return null;
  }
  if (Math.abs(dy) < 1e-6 && Math.abs(dx) >= 1e-6) {
    return dx > 0 ? 'E' : 'W';
  }
  if (Math.abs(dx) < 1e-6 && Math.abs(dy) >= 1e-6) {
    return dy > 0 ? 'S' : 'N';
  }
  return null;
}

/**
 * Outward port side on the `end` vertex, derived from the last
 * axis-aligned segment. The edge arrives from the opposite side of its
 * travel direction, so `E`-ward travel enters via `W`, etc. Returns
 * null for diagonal segments.
 */
function portSideFromLastSegment(pts: readonly Point[]): PortSide | null {
  const n = pts.length;
  const a = pts[n - 2];
  const b = pts[n - 1];
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  if (Math.abs(dx) < 1e-6 && Math.abs(dy) < 1e-6) {
    return null;
  }
  if (Math.abs(dy) < 1e-6 && Math.abs(dx) >= 1e-6) {
    return dx > 0 ? 'W' : 'E';
  }
  if (Math.abs(dx) < 1e-6 && Math.abs(dy) >= 1e-6) {
    return dy > 0 ? 'N' : 'S';
  }
  return null;
}

/**
 * Apply DOMUS edge paths to LayoutData edges.
 *
 * @param layout - The LayoutData to update
 * @param paths - The edge paths from DOMUS
 */
export function applyEdgePathsToLayout(layout: LayoutData, paths: Map<string, Point[]>): void {
  for (const edge of layout.edges ?? []) {
    if (edge?.id == null) {
      continue;
    }

    const edgeId = String(edge.id);
    const path = paths.get(edgeId);

    if (path && path.length > 0) {
      edge.points = path;
    }
  }
}
