/**
 * Routing logic for the orthogonal pipeline.
 *
 * This module handles RP1 Stage 2/3: path finding between ports using explicit
 * routing graphs (Hanan/visibility-style) and bend-aware shortest-path search.
 */
import type { Node } from '../../../types.js';
import type { Point, Rect, AssignedPorts, PortSide } from '../types.js';
import {
  rectForNode,
  approxEqual,
  manhattanLength,
  bendCount,
  segmentIntersectsRectInterior,
  uniqSorted,
  pointInRectInterior,
  pointInsideAnyRectInterior,
  computeBoundaryPort,
} from './helpers.js';
import { MinHeap } from './minHeap.js';

// ============================================================================
// Simple Geometry Checkers
// ============================================================================

/**
 * Check if a polyline is a straight horizontal line.
 */
export function isStraightHorizontal(points: Point[]): boolean {
  if (points.length < 2) {
    return false;
  }
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    if (!approxEqual(a.y, b.y)) {
      return false;
    }
  }
  return true;
}

/**
 * Check if a polyline is a straight vertical line.
 */
export function isStraightVertical(points: Point[]): boolean {
  if (points.length < 2) {
    return false;
  }
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    if (!approxEqual(a.x, b.x)) {
      return false;
    }
  }
  return true;
}

/**
 * Check if a polyline crosses any node rectangle (except start/end nodes).
 */
export function polylineIntersectsAnyRect(
  points: Point[],
  nodesById: Map<string, Node>,
  startNodeId: string,
  endNodeId: string
): boolean {
  for (const [id, node] of nodesById) {
    if (id === startNodeId || id === endNodeId) {
      continue;
    }
    const rect = rectForNode(node);
    for (let i = 0; i < points.length - 1; i++) {
      if (segmentIntersectsRectInterior(points[i], points[i + 1], rect)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Check if an axis-aligned segment crosses any rectangle's interior.
 */
function segmentCrossesAnyRectInterior(a: Point, b: Point, rects: Rect[]): boolean {
  for (const r of rects) {
    if (segmentIntersectsRectInterior(a, b, r)) {
      return true;
    }
  }
  return false;
}

// ============================================================================
// Rectangle Utilities
// ============================================================================

/**
 * Inflate a rectangle by a margin on all sides.
 */
export function inflateRect(rect: Rect, margin: number): Rect {
  if (margin <= 0) {
    return rect;
  }
  return {
    cx: rect.cx,
    cy: rect.cy,
    left: rect.left - margin,
    right: rect.right + margin,
    top: rect.top - margin,
    bottom: rect.bottom + margin,
  };
}

/**
 * Collect obstacle rectangles for routing, excluding start and end nodes.
 */
/**
 * Reuse token for repeated routing queries over *frozen* node geometry.
 *
 * `collectObstacleRects` inflates a rectangle for every node on every query, and
 * `buildRoutingGraphFromChannels` then derives its channels from that array. A
 * candidate sweep asks for hundreds of routes between the same pair of nodes, so
 * both were being redone per candidate. Pass a cache and they are computed once.
 *
 * Contract: a cache is only valid while no node moves and the same `nodesById`
 * is used, so create one per candidate sweep and drop it afterwards — never hold
 * one across a pass that repositions nodes.
 */
export interface RoutingQueryCache {
  /** Key `${startNodeId}|${endNodeId}|${margin}`, value the inflated obstacle rects. */
  obstacles: Map<string, Rect[]>;
}

export function createRoutingQueryCache(): RoutingQueryCache {
  return { obstacles: new Map<string, Rect[]>() };
}

function collectObstacleRectsCached(
  nodesById: Map<string, Node>,
  startNodeId: string,
  endNodeId: string,
  margin: number,
  cache?: RoutingQueryCache
): Rect[] {
  if (!cache) {
    return collectObstacleRects(nodesById, startNodeId, endNodeId, margin);
  }
  const cacheKey = `${startNodeId}|${endNodeId}|${margin}`;
  const hit = cache.obstacles.get(cacheKey);
  if (hit) {
    return hit;
  }
  const rects = collectObstacleRects(nodesById, startNodeId, endNodeId, margin);
  cache.obstacles.set(cacheKey, rects);
  return rects;
}

export function collectObstacleRects(
  nodesById: Map<string, Node>,
  startNodeId: string,
  endNodeId: string,
  margin: number
): Rect[] {
  const rects: Rect[] = [];
  for (const [id, node] of nodesById) {
    if (id === startNodeId || id === endNodeId) {
      continue;
    }
    const base = rectForNode(node);
    rects.push(inflateRect(base, margin));
  }
  return rects;
}

/**
 * Remove collinear intermediate points from a polyline.
 */
export function compressCollinear(points: Point[]): Point[] {
  if (points.length <= 2) {
    return points;
  }
  const result: Point[] = [points[0]];
  for (let i = 1; i < points.length - 1; i++) {
    const prev = result[result.length - 1];
    const curr = points[i];
    const next = points[i + 1];
    const prevHoriz = approxEqual(prev.y, curr.y);
    const currHoriz = approxEqual(curr.y, next.y);
    const prevVert = approxEqual(prev.x, curr.x);
    const currVert = approxEqual(curr.x, next.x);
    if ((prevHoriz && currHoriz) || (prevVert && currVert)) {
      // curr is redundant on a straight segment.
      continue;
    }
    result.push(curr);
  }
  result.push(points[points.length - 1]);
  return result;
}

// ============================================================================
// Routing Graph Types
// ============================================================================

interface RouteGraphNode {
  id: string;
  x: number;
  y: number;
}

interface RouteGraphEdge {
  to: number;
  length: number;
  dir: 'h' | 'v';
}

interface RoutingGraph {
  nodes: RouteGraphNode[];
  adj: RouteGraphEdge[][];
  startIdx: number;
  endIdx: number;
}

// ============================================================================
// Routing Graph Construction
// ============================================================================

/**
 * Build a visibility-style routing graph from obstacle rectangles.
 * Creates nodes at grid intersections (Hanan-style) and connects adjacent
 * nodes that don't cross obstacle interiors.
 */
export function buildRoutingGraphFromRects(
  startPort: Point,
  endPort: Point,
  obstacleRects: Rect[],
  spacing: number,
  clearance: number = spacing
): RoutingGraph | null {
  // Add "clearance rails" around obstacles so we can route *beside* rectangles
  const xs: number[] = [startPort.x, endPort.x];
  const ys: number[] = [startPort.y, endPort.y];
  const c = Math.max(0, clearance);

  for (const r of obstacleRects) {
    xs.push(r.left - c, r.left, r.right, r.right + c);
    ys.push(r.top - c, r.top, r.bottom, r.bottom + c);
  }

  const xCoords = uniqSorted(xs);
  const yCoords = uniqSorted(ys);
  if (xCoords.length === 0 || yCoords.length === 0) {
    return null;
  }

  // This is a full Hanan grid — 4 lines per obstacle per axis — so a 100-node
  // diagram is ~400x400 cells. Two things made that quadratic cost worse than it
  // needs to be, both fixed the same way as in `buildRoutingGraphFromChannels`:
  // cells were keyed by a `"x,y"` string in a Map (a string allocation per cell
  // plus two lookups per cell in the adjacency passes), and every point/segment
  // test scanned ALL obstacles instead of the few that can span the row or column
  // being walked. Narrowing is exactly equivalent: `pointInRectInterior` needs
  // `p.y > rect.top && p.y < rect.bottom`, and `segmentIntersectsRectInterior`
  // needs `y >= rect.top && y <= rect.bottom` for a horizontal segment (dually in
  // x for a vertical one), so a rect outside that band can never match.
  const cols = xCoords.length;
  const cellIndex = new Int32Array(cols * yCoords.length).fill(-1);
  const nodes: RouteGraphNode[] = [];

  // Create grid intersection nodes that are not inside any obstacle interior.
  for (const [yi, y] of yCoords.entries()) {
    const rowRects = obstacleRects.filter((r) => r.top < y && r.bottom > y);
    const rowBase = yi * cols;
    for (let xi = 0; xi < cols; xi++) {
      const x = xCoords[xi];
      if (pointInsideAnyRectInterior({ x, y }, rowRects)) {
        continue;
      }
      cellIndex[rowBase + xi] = nodes.length;
      nodes.push({ id: `${x},${y}`, x, y });
    }
  }

  const startXi = xCoords.indexOf(startPort.x);
  const startYi = yCoords.indexOf(startPort.y);
  const endXi = xCoords.indexOf(endPort.x);
  const endYi = yCoords.indexOf(endPort.y);
  if (startXi < 0 || startYi < 0 || endXi < 0 || endYi < 0) {
    return null;
  }
  const startIdx = cellIndex[startYi * cols + startXi];
  const endIdx = cellIndex[endYi * cols + endXi];
  if (startIdx < 0 || endIdx < 0) {
    return null;
  }

  const adj: RouteGraphEdge[][] = Array.from({ length: nodes.length }, () => []);

  // Horizontal connections.
  for (const [yi, y] of yCoords.entries()) {
    const rowRects = obstacleRects.filter((r) => r.top <= y && r.bottom >= y);
    const rowBase = yi * cols;
    let prevIdx = -1;
    let prevX = 0;
    for (let xi = 0; xi < cols; xi++) {
      const idx = cellIndex[rowBase + xi];
      if (idx < 0) {
        prevIdx = -1;
        continue;
      }
      const x = xCoords[xi];
      if (prevIdx >= 0) {
        const a = { x: prevX, y };
        const b = { x, y };
        if (!segmentCrossesAnyRectInterior(a, b, rowRects)) {
          const len = Math.abs(x - prevX);
          adj[prevIdx].push({ to: idx, length: len, dir: 'h' });
          adj[idx].push({ to: prevIdx, length: len, dir: 'h' });
        }
      }
      prevIdx = idx;
      prevX = x;
    }
  }

  // Vertical connections.
  for (let xi = 0; xi < cols; xi++) {
    const x = xCoords[xi];
    const colRects = obstacleRects.filter((r) => r.left <= x && r.right >= x);
    let prevIdx = -1;
    let prevY = 0;
    for (const [yi, y] of yCoords.entries()) {
      const idx = cellIndex[yi * cols + xi];
      if (idx < 0) {
        prevIdx = -1;
        continue;
      }
      if (prevIdx >= 0) {
        const a = { x, y: prevY };
        const b = { x, y };
        if (!segmentCrossesAnyRectInterior(a, b, colRects)) {
          const len = Math.abs(y - prevY);
          adj[prevIdx].push({ to: idx, length: len, dir: 'v' });
          adj[idx].push({ to: prevIdx, length: len, dir: 'v' });
        }
      }
      prevIdx = idx;
      prevY = y;
    }
  }

  return { nodes, adj, startIdx, endIdx };
}

/**
 * Build a representative-lines routing graph from obstacles.
 *
 * This is a sparser alternative to the full Hanan grid:
 * - vertical reps at start/end x and at obstacle left/right +/- clearance
 * - horizontal reps at start/end y and at obstacle top/bottom +/- clearance
 * Nodes are intersections of reps that are not inside obstacle interiors.
 * Edges connect consecutive nodes along each representative line when the segment
 * does not cross obstacle interiors.
 */
export function buildRoutingGraphFromRepresentatives(
  startPort: Point,
  endPort: Point,
  obstacleRects: Rect[],
  spacing: number,
  clearance: number = spacing
): RoutingGraph | null {
  const c = Math.max(0, clearance);
  const xLines: number[] = [startPort.x, endPort.x];
  const yLines: number[] = [startPort.y, endPort.y];
  for (const r of obstacleRects) {
    xLines.push(r.left - c, r.right + c);
    yLines.push(r.top - c, r.bottom + c);
  }
  let xCoords = uniqSorted(xLines);
  let yCoords = uniqSorted(yLines);
  if (xCoords.length === 0 || yCoords.length === 0) {
    return null;
  }

  const isFree = (x: number, y: number) => !pointInsideAnyRectInterior({ x, y }, obstacleRects);

  // Prune representative lines:
  // 1) Remove "dead" lines that don't contribute any free intersections.
  // 2) Dominance pruning: if two lines have identical free-intersection patterns
  //    across the perpendicular set, keep the one closer to the ports.
  //
  // Iterate a few times because removing lines can make other lines dead too.
  for (let iter = 0; iter < 3; iter++) {
    // prune x
    const xKeep: number[] = [];
    for (const x of xCoords) {
      let any = false;
      for (const y of yCoords) {
        if (isFree(x, y)) {
          any = true;
          break;
        }
      }
      if (any) {
        xKeep.push(x);
      }
    }
    xCoords = xKeep.length ? xKeep : xCoords;

    // prune y
    const yKeep: number[] = [];
    for (const y of yCoords) {
      let any = false;
      for (const x of xCoords) {
        if (isFree(x, y)) {
          any = true;
          break;
        }
      }
      if (any) {
        yKeep.push(y);
      }
    }
    yCoords = yKeep.length ? yKeep : yCoords;
  }

  const portDistX = (x: number) => Math.abs(x - startPort.x) + Math.abs(x - endPort.x);
  const portDistY = (y: number) => Math.abs(y - startPort.y) + Math.abs(y - endPort.y);

  const signatureForX = (x: number) => yCoords.map((y) => (isFree(x, y) ? '1' : '0')).join('');
  const signatureForY = (y: number) => xCoords.map((x) => (isFree(x, y) ? '1' : '0')).join('');

  const dedupeBySignature = <T>(
    values: T[],
    sig: (v: T) => string,
    score: (v: T) => number,
    cmp: (a: T, b: T) => number
  ) => {
    const best = new Map<string, T>();
    for (const v of values) {
      const s = sig(v);
      const cur = best.get(s);
      if (!cur) {
        best.set(s, v);
        continue;
      }
      const sv = score(v);
      const sc = score(cur);
      if (sv < sc || (sv === sc && cmp(v, cur) < 0)) {
        best.set(s, v);
      }
    }
    return [...best.values()].sort(cmp);
  };

  // Always keep port-aligned lines even if dominated (determinism and connectivity).
  const mustX = new Set([startPort.x, endPort.x]);
  const mustY = new Set([startPort.y, endPort.y]);

  const xDedupe = dedupeBySignature(xCoords, signatureForX, portDistX, (a, b) => a - b);
  const yDedupe = dedupeBySignature(yCoords, signatureForY, portDistY, (a, b) => a - b);
  xCoords = uniqSorted([...xDedupe, ...[...mustX]]);
  yCoords = uniqSorted([...yDedupe, ...[...mustY]]);

  const nodes: RouteGraphNode[] = [];
  const indexByKey = new Map<string, number>();
  const key = (x: number, y: number) => `${x},${y}`;

  for (const y of yCoords) {
    for (const x of xCoords) {
      const p = { x, y };
      if (pointInsideAnyRectInterior(p, obstacleRects)) {
        continue;
      }
      const id = key(x, y);
      indexByKey.set(id, nodes.length);
      nodes.push({ id, x, y });
    }
  }

  const startKey = key(startPort.x, startPort.y);
  const endKey = key(endPort.x, endPort.y);
  const startIdx = indexByKey.get(startKey);
  const endIdx = indexByKey.get(endKey);
  if (startIdx == null || endIdx == null) {
    return null;
  }

  const adj: RouteGraphEdge[][] = Array.from({ length: nodes.length }, () => []);

  // Horizontal connections along representative y lines.
  for (const y of yCoords) {
    let prevIdx: number | null = null;
    let prevX: number | null = null;
    for (const x of xCoords) {
      const idx = indexByKey.get(key(x, y));
      if (idx == null) {
        prevIdx = null;
        prevX = null;
        continue;
      }
      if (prevIdx != null && prevX != null) {
        const a = { x: prevX, y };
        const b = { x, y };
        if (!segmentCrossesAnyRectInterior(a, b, obstacleRects)) {
          const len = Math.abs(x - prevX);
          adj[prevIdx].push({ to: idx, length: len, dir: 'h' });
          adj[idx].push({ to: prevIdx, length: len, dir: 'h' });
        }
      }
      prevIdx = idx;
      prevX = x;
    }
  }

  // Vertical connections along representative x lines.
  for (const x of xCoords) {
    let prevIdx: number | null = null;
    let prevY: number | null = null;
    for (const y of yCoords) {
      const idx = indexByKey.get(key(x, y));
      if (idx == null) {
        prevIdx = null;
        prevY = null;
        continue;
      }
      if (prevIdx != null && prevY != null) {
        const a = { x, y: prevY };
        const b = { x, y };
        if (!segmentCrossesAnyRectInterior(a, b, obstacleRects)) {
          const len = Math.abs(y - prevY);
          adj[prevIdx].push({ to: idx, length: len, dir: 'v' });
          adj[idx].push({ to: prevIdx, length: len, dir: 'v' });
        }
      }
      prevIdx = idx;
      prevY = y;
    }
  }

  return { nodes, adj, startIdx, endIdx };
}

interface RoutingChannel {
  dir: 'E' | 'W' | 'N' | 'S';
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

/** The port-independent half of a channel routing graph: its representative lines. */
interface ChannelLines {
  xLines: number[];
  yLines: number[];
}

/**
 * Cache for the obstacle-derived half of `buildRoutingGraphFromChannels`.
 *
 * Channel construction is O(R^2) over obstacles plus an O(C^2) dominance prune,
 * and it depends only on the obstacle rectangles, the clearance and the outer
 * bounding box — not on where the two ports sit. `sideRouteCandidates` asks for
 * up to 12 side pairs x 4 start offsets x 4 end offsets = 192 routes for a
 * single flagged edge, all against the same obstacle set, so without this the
 * channels are rebuilt 192 times per edge. On `domus/mermaid-chart-architecture`
 * that was 3039 ms of a 13.5 s render.
 *
 * Keyed on the obstacle array's identity (a `WeakMap`, so nothing is retained
 * once the caller drops it) and then on the bounds, which the ports can widen.
 * Callers that reuse an obstacle array must therefore keep node geometry frozen
 * for its lifetime — `collectObstacleRects` builds a fresh array per call unless
 * a `RoutingQueryCache` is passed in, and that cache is created per remediation
 * edge, where nodes provably do not move.
 */
const channelLinesByObstacles = new WeakMap<Rect[], Map<string, ChannelLines>>();

/**
 * Content-addressed fallback for the identity cache above.
 *
 * `findRoutingGraphPathBetweenPortsWithObstacles` inflates its obstacle array on
 * every call and `findDirectCompoundRoute` then passes prefixes of it, so those
 * callers hand a fresh array identity to every query and the `WeakMap` could
 * never hit for them — measured in Chrome as 270 ms per render of pure channel
 * recomputation on `mermaid-chart-architecture`. Keying on the rounded rectangle
 * extents costs one O(R) pass, against the O(R^2) channel construction plus
 * O(C^2) dominance prune it saves.
 *
 * Bounded and cleared wholesale rather than evicted one by one: entries are only
 * valid while node geometry is unchanged, and a layout run wants a handful of
 * obstacle sets, not hundreds. Clearing on overflow keeps a long session from
 * holding stale geometry alive.
 */
const CHANNEL_LINES_BY_SIGNATURE_MAX = 64;
const channelLinesBySignature = new Map<string, ChannelLines>();

function obstacleSignature(obstacleRects: Rect[]): string {
  // EXACT coordinates, deliberately not rounded. Equal signature has to mean
  // equal inputs, or the cache hands back channels computed for a different
  // drawing. Rounding to whole pixels here made `domus/svelte5-code` invalid in a
  // full-corpus run while it stayed valid when laid out alone — two fixtures'
  // obstacle sets collided on the rounded key.
  const parts: string[] = [String(obstacleRects.length)];
  for (const r of obstacleRects) {
    parts.push(`${r.left},${r.top},${r.right},${r.bottom}`);
  }
  return parts.join(';');
}

function channelRepresentativeLines(
  obstacleRects: Rect[],
  c: number,
  minX: number,
  maxX: number,
  minY: number,
  maxY: number
): ChannelLines {
  let byBounds = channelLinesByObstacles.get(obstacleRects);
  if (!byBounds) {
    byBounds = new Map<string, ChannelLines>();
    channelLinesByObstacles.set(obstacleRects, byBounds);
  }
  const boundsKey = `${c}|${minX}|${maxX}|${minY}|${maxY}`;
  const cached = byBounds.get(boundsKey);
  if (cached) {
    return cached;
  }
  const signatureKey = `${boundsKey}|${obstacleSignature(obstacleRects)}`;
  const bySignature = channelLinesBySignature.get(signatureKey);
  if (bySignature) {
    byBounds.set(boundsKey, bySignature);
    return bySignature;
  }

  const channels: RoutingChannel[] = [];
  const rects = obstacleRects;

  const overlap = (a0: number, a1: number, b0: number, b1: number) =>
    Math.max(a0, b0) < Math.min(a1, b1);
  const overlapRange = (a0: number, a1: number, b0: number, b1: number) => {
    const y0 = Math.max(a0, b0);
    const y1 = Math.min(a1, b1);
    return y1 > y0 ? { y0, y1 } : null;
  };

  // For each obstacle, keep only the minimum-width channel per direction.
  for (const u of rects) {
    // East (rightward) channel: nearest obstacle/boundary to the right with overlapping vertical span.
    let bestE: RoutingChannel | null = null;
    for (const v of rects) {
      if (v.left <= u.right + c) {
        continue;
      }
      const ov = overlapRange(u.top, u.bottom, v.top, v.bottom);
      if (!ov) {
        continue;
      }
      const x0 = u.right + c;
      const x1 = v.left - c;
      if (x1 <= x0) {
        continue;
      }
      const cand: RoutingChannel = { dir: 'E', x0, x1, y0: ov.y0, y1: ov.y1 };
      const w = cand.x1 - cand.x0;
      if (!bestE || w < bestE.x1 - bestE.x0) {
        bestE = cand;
      }
    }
    bestE ??= { dir: 'E', x0: u.right + c, x1: maxX, y0: u.top, y1: u.bottom };
    if (bestE.x1 > bestE.x0 && bestE.y1 > bestE.y0) {
      channels.push(bestE);
    }

    // West channel
    let bestW: RoutingChannel | null = null;
    for (const v of rects) {
      if (v.right >= u.left - c) {
        continue;
      }
      const ov = overlapRange(u.top, u.bottom, v.top, v.bottom);
      if (!ov) {
        continue;
      }
      const x0 = v.right + c;
      const x1 = u.left - c;
      if (x1 <= x0) {
        continue;
      }
      const cand: RoutingChannel = { dir: 'W', x0, x1, y0: ov.y0, y1: ov.y1 };
      const w = cand.x1 - cand.x0;
      if (!bestW || w < bestW.x1 - bestW.x0) {
        bestW = cand;
      }
    }
    bestW ??= { dir: 'W', x0: minX, x1: u.left - c, y0: u.top, y1: u.bottom };
    if (bestW.x1 > bestW.x0 && bestW.y1 > bestW.y0) {
      channels.push(bestW);
    }

    // South channel (downward): nearest obstacle/boundary below with overlapping horizontal span.
    let bestS: RoutingChannel | null = null;
    for (const v of rects) {
      if (v.top <= u.bottom + c) {
        continue;
      }
      if (!overlap(u.left, u.right, v.left, v.right)) {
        continue;
      }
      const ov = overlapRange(u.left, u.right, v.left, v.right);
      if (!ov) {
        continue;
      }
      const y0 = u.bottom + c;
      const y1 = v.top - c;
      if (y1 <= y0) {
        continue;
      }
      const cand: RoutingChannel = { dir: 'S', x0: ov.y0, x1: ov.y1, y0, y1 };
      const h = cand.y1 - cand.y0;
      if (!bestS || h < bestS.y1 - bestS.y0) {
        bestS = cand;
      }
    }
    bestS ??= { dir: 'S', x0: u.left, x1: u.right, y0: u.bottom + c, y1: maxY };
    if (bestS.x1 > bestS.x0 && bestS.y1 > bestS.y0) {
      channels.push(bestS);
    }

    // North channel (upward)
    let bestN: RoutingChannel | null = null;
    for (const v of rects) {
      if (v.bottom >= u.top - c) {
        continue;
      }
      if (!overlap(u.left, u.right, v.left, v.right)) {
        continue;
      }
      const ov = overlapRange(u.left, u.right, v.left, v.right);
      if (!ov) {
        continue;
      }
      const y0 = v.bottom + c;
      const y1 = u.top - c;
      if (y1 <= y0) {
        continue;
      }
      const cand: RoutingChannel = { dir: 'N', x0: ov.y0, x1: ov.y1, y0, y1 };
      const h = cand.y1 - cand.y0;
      if (!bestN || h < bestN.y1 - bestN.y0) {
        bestN = cand;
      }
    }
    bestN ??= { dir: 'N', x0: u.left, x1: u.right, y0: minY, y1: u.top - c };
    if (bestN.x1 > bestN.x0 && bestN.y1 > bestN.y0) {
      channels.push(bestN);
    }
  }

  // Dominance pruning (paper-aligned idea, simplified):
  // For channels with the same direction and overlapping on the orthogonal axis,
  // drop those whose free-space projection is contained in another channel's projection
  // with <= width/height (i.e. "dominated").
  const dominated = new Set<number>();
  const width = (ch: RoutingChannel) =>
    ch.dir === 'E' || ch.dir === 'W' ? ch.x1 - ch.x0 : ch.y1 - ch.y0;
  const proj0 = (ch: RoutingChannel) => (ch.dir === 'E' || ch.dir === 'W' ? ch.y0 : ch.x0);
  const proj1 = (ch: RoutingChannel) => (ch.dir === 'E' || ch.dir === 'W' ? ch.y1 : ch.x1);
  for (let i = 0; i < channels.length; i++) {
    if (dominated.has(i)) {
      continue;
    }
    const a = channels[i];
    for (const [j, b] of channels.entries()) {
      if (i === j || dominated.has(j)) {
        continue;
      }
      if (a.dir !== b.dir) {
        continue;
      }
      const a0 = proj0(a);
      const a1 = proj1(a);
      const b0 = proj0(b);
      const b1 = proj1(b);
      if (!(b0 <= a0 && a1 <= b1)) {
        continue;
      } // a projection inside b projection
      if (width(b) <= width(a) + 1e-9) {
        dominated.add(i);
        break;
      }
    }
  }

  // Representative lines: centerline of each channel. Ports are added by the
  // caller (paper: prefer reps starting at a port) and are what keeps this
  // result reusable across every candidate port pair on the same obstacles.
  const xLines: number[] = [];
  const yLines: number[] = [];
  for (const [idx, ch] of channels.entries()) {
    if (dominated.has(idx)) {
      continue;
    }
    xLines.push((ch.x0 + ch.x1) / 2);
    yLines.push((ch.y0 + ch.y1) / 2);
  }

  const lines: ChannelLines = { xLines, yLines };
  byBounds.set(boundsKey, lines);
  if (channelLinesBySignature.size >= CHANNEL_LINES_BY_SIGNATURE_MAX) {
    channelLinesBySignature.clear();
  }
  channelLinesBySignature.set(signatureKey, lines);
  return lines;
}

export function buildRoutingGraphFromChannels(
  startPort: Point,
  endPort: Point,
  obstacleRects: Rect[],
  spacing: number,
  clearance: number = spacing
): RoutingGraph | null {
  const c = Math.max(0, clearance);
  // Build a loose boundary around everything to ensure outer channels exist.
  let minX = Math.min(startPort.x, endPort.x);
  let maxX = Math.max(startPort.x, endPort.x);
  let minY = Math.min(startPort.y, endPort.y);
  let maxY = Math.max(startPort.y, endPort.y);
  for (const r of obstacleRects) {
    if (r.left < minX) {
      minX = r.left;
    }
    if (r.right > maxX) {
      maxX = r.right;
    }
    if (r.top < minY) {
      minY = r.top;
    }
    if (r.bottom > maxY) {
      maxY = r.bottom;
    }
  }
  minX -= c * 5;
  maxX += c * 5;
  minY -= c * 5;
  maxY += c * 5;

  const lines = channelRepresentativeLines(obstacleRects, c, minX, maxX, minY, maxY);

  // Always include the ports themselves (paper: prefer reps starting at a port).
  const xCoords = uniqSorted([startPort.x, endPort.x, ...lines.xLines]);
  const yCoords = uniqSorted([startPort.y, endPort.y, ...lines.yLines]);
  if (xCoords.length === 0 || yCoords.length === 0) {
    return null;
  }

  // Grid cells are addressed by (row, column) into a flat Int32Array instead of
  // by a `"x,y"` string key in a Map: the adjacency build does two lookups per
  // cell and this graph is rebuilt for every candidate route, so the string keys
  // were a per-candidate allocation of |X|*|Y| strings.
  const cols = xCoords.length;
  const cellIndex = new Int32Array(cols * yCoords.length).fill(-1);
  const nodes: RouteGraphNode[] = [];

  for (const [yi, y] of yCoords.entries()) {
    // Same narrowing as the adjacency loops below: `pointInRectInterior`
    // requires `p.y > rect.top && p.y < rect.bottom`, so only rects strictly
    // spanning this row can contain any point on it.
    const rowRects = obstacleRects.filter((r) => r.top < y && r.bottom > y);
    const rowBase = yi * cols;
    for (let xi = 0; xi < cols; xi++) {
      const x = xCoords[xi];
      if (pointInsideAnyRectInterior({ x, y }, rowRects)) {
        continue;
      }
      cellIndex[rowBase + xi] = nodes.length;
      nodes.push({ id: `${x},${y}`, x, y });
    }
  }

  const startXi = xCoords.indexOf(startPort.x);
  const startYi = yCoords.indexOf(startPort.y);
  const endXi = xCoords.indexOf(endPort.x);
  const endYi = yCoords.indexOf(endPort.y);
  if (startXi < 0 || startYi < 0 || endXi < 0 || endYi < 0) {
    return null;
  }
  const startIdx = cellIndex[startYi * cols + startXi];
  const endIdx = cellIndex[endYi * cols + endXi];
  if (startIdx < 0 || endIdx < 0) {
    return null;
  }

  const adj: RouteGraphEdge[][] = Array.from({ length: nodes.length }, () => []);

  for (const [yi, y] of yCoords.entries()) {
    // A horizontal segment at height `y` can only be blocked by a rect whose
    // vertical span contains `y`: `segmentIntersectsRectInterior` requires
    // `y >= rect.top && y <= rect.bottom`. Narrowing the obstacle list once per
    // row is therefore exactly equivalent to scanning every rect per segment,
    // and takes the adjacency build from O(|X|*|Y|*n) to O(|Y|*n + |X|*|Y|*k)
    // where k is the few rects that actually span the row.
    const rowRects = obstacleRects.filter((r) => r.top <= y && r.bottom >= y);
    const rowBase = yi * cols;
    let prevIdx = -1;
    let prevX = 0;
    for (let xi = 0; xi < cols; xi++) {
      const idx = cellIndex[rowBase + xi];
      if (idx < 0) {
        prevIdx = -1;
        continue;
      }
      const x = xCoords[xi];
      if (prevIdx >= 0) {
        const a = { x: prevX, y };
        const b = { x, y };
        if (!segmentCrossesAnyRectInterior(a, b, rowRects)) {
          const len = Math.abs(x - prevX);
          adj[prevIdx].push({ to: idx, length: len, dir: 'h' });
          adj[idx].push({ to: prevIdx, length: len, dir: 'h' });
        }
      }
      prevIdx = idx;
      prevX = x;
    }
  }

  for (let xi = 0; xi < cols; xi++) {
    const x = xCoords[xi];
    // Dual of the row filter: a vertical segment at `x` can only be blocked by
    // a rect with `x >= rect.left && x <= rect.right`.
    const colRects = obstacleRects.filter((r) => r.left <= x && r.right >= x);
    let prevIdx = -1;
    let prevY = 0;
    for (const [yi, y] of yCoords.entries()) {
      const idx = cellIndex[yi * cols + xi];
      if (idx < 0) {
        prevIdx = -1;
        continue;
      }
      if (prevIdx >= 0) {
        const a = { x, y: prevY };
        const b = { x, y };
        if (!segmentCrossesAnyRectInterior(a, b, colRects)) {
          const len = Math.abs(y - prevY);
          adj[prevIdx].push({ to: idx, length: len, dir: 'v' });
          adj[idx].push({ to: prevIdx, length: len, dir: 'v' });
        }
      }
      prevIdx = idx;
      prevY = y;
    }
  }

  return { nodes, adj, startIdx, endIdx };
}

function segmentsCrossStrict(a1: Point, a2: Point, b1: Point, b2: Point): boolean {
  const aHorizontal = a1.y === a2.y;
  const bHorizontal = b1.y === b2.y;
  if (aHorizontal && b1.x === b2.x) {
    return (
      Math.min(a1.x, a2.x) < b1.x &&
      b1.x < Math.max(a1.x, a2.x) &&
      Math.min(b1.y, b2.y) < a1.y &&
      a1.y < Math.max(b1.y, b2.y)
    );
  }
  if (a1.x === a2.x && bHorizontal) {
    return (
      Math.min(b1.x, b2.x) < a1.x &&
      a1.x < Math.max(b1.x, b2.x) &&
      Math.min(a1.y, a2.y) < b1.y &&
      b1.y < Math.max(a1.y, a2.y)
    );
  }
  const d1 = (b2.x - b1.x) * (a1.y - b1.y) - (b2.y - b1.y) * (a1.x - b1.x);
  const d2 = (b2.x - b1.x) * (a2.y - b1.y) - (b2.y - b1.y) * (a2.x - b1.x);
  const d3 = (a2.x - a1.x) * (b1.y - a1.y) - (a2.y - a1.y) * (b1.x - a1.x);
  const d4 = (a2.x - a1.x) * (b2.y - a1.y) - (a2.y - a1.y) * (b2.x - a1.x);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}
// ============================================================================
// Shortest Path Search
// ============================================================================

/**
 * Find the shortest orthogonal path on a routing graph using bend-aware Dijkstra.
 * Optimizes for (length, bends) lexicographically.
 */
export function findShortestOrthogonalPathOnGraph(
  g: RoutingGraph,
  options: {
    prefer: 'ESWN' | 'ENWS';
    /**
     * Soft crossing avoidance: each crossing between a relaxed graph edge and
     * one of these polylines' segments adds `costPerCrossing` length units to
     * the path cost. Absent = behavior identical to the classic search.
     */
    avoid?: { segments: Point[][]; costPerCrossing: number };
  } = { prefer: 'ESWN' }
): Point[] | null {
  type Dir = 'h' | 'v' | 'n';
  const dirIndex = (d: Dir) => (d === 'n' ? 0 : d === 'h' ? 1 : 2);

  interface State {
    node: number;
    dir: Dir;
    len: number;
    bends: number;
  }

  const N = g.nodes.length;
  // Flat (node * 3 + dir) typed arrays rather than N nested 3-element arrays.
  // This search runs tens of thousands of times per layout, and the nested form
  // allocated 4*N throwaway arrays on every call; the values and comparisons
  // below are unchanged.
  const distLen = new Float64Array(N * 3).fill(Infinity);
  const distBends = new Float64Array(N * 3).fill(Infinity);
  const prevNode = new Int32Array(N * 3).fill(-1);
  const prevDir = new Int32Array(N * 3);

  const startState: State = { node: g.startIdx, dir: 'n', len: 0, bends: 0 };

  const heap = new MinHeap<State>((a, b) => {
    if (a.len !== b.len) {
      return a.len < b.len;
    }
    if (a.bends !== b.bends) {
      return a.bends < b.bends;
    }
    const na = g.nodes[a.node];
    const nb = g.nodes[b.node];
    if (na.x !== nb.x) {
      return na.x < nb.x;
    }
    if (na.y !== nb.y) {
      return na.y < nb.y;
    }
    return dirIndex(a.dir) < dirIndex(b.dir);
  });

  distLen[g.startIdx * 3] = 0;
  distBends[g.startIdx * 3] = 0;
  heap.push(startState);

  // Build immutable segment buckets once per search. Routing-graph edges are
  // orthogonal, so only perpendicular and non-orthogonal avoid segments can
  // cross them. This removes the parallel half of the hot inner-loop scan.
  const avoid = options.avoid;
  const horizontalAvoidSegments: Point[] = [];
  const verticalAvoidSegments: Point[] = [];
  const otherAvoidSegments: Point[] = [];
  if (avoid) {
    for (const poly of avoid.segments) {
      for (let i = 0; i < poly.length - 1; i++) {
        const a = poly[i];
        const b = poly[i + 1];
        const bucket =
          a.y === b.y
            ? horizontalAvoidSegments
            : a.x === b.x
              ? verticalAvoidSegments
              : otherAvoidSegments;
        bucket.push(a, b);
      }
    }
  }

  // Crossing cost is symmetric, so cache both traversal directions under the
  // same canonical node-pair key.
  const penaltyCache = new Map<number, number>();
  const crossPenalty = (fromIdx: number, toIdx: number): number => {
    if (!avoid) {
      return 0;
    }
    const lo = Math.min(fromIdx, toIdx);
    const hi = Math.max(fromIdx, toIdx);
    const key = lo * N + hi;
    const cached = penaltyCache.get(key);
    if (cached !== undefined) {
      return cached;
    }
    const a1 = g.nodes[fromIdx];
    const a2 = g.nodes[toIdx];
    const perpendicularSegments = a1.y === a2.y ? verticalAvoidSegments : horizontalAvoidSegments;
    let crossings = 0;
    for (let i = 0; i < perpendicularSegments.length; i += 2) {
      if (segmentsCrossStrict(a1, a2, perpendicularSegments[i], perpendicularSegments[i + 1])) {
        crossings++;
      }
    }
    for (let i = 0; i < otherAvoidSegments.length; i += 2) {
      if (segmentsCrossStrict(a1, a2, otherAvoidSegments[i], otherAvoidSegments[i + 1])) {
        crossings++;
      }
    }
    const penalty = crossings * avoid.costPerCrossing;
    penaltyCache.set(key, penalty);
    return penalty;
  };

  const neighborOrder = (from: RouteGraphNode, to: RouteGraphNode): number => {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    if (options.prefer === 'ESWN') {
      if (dx > 0) {
        return 0;
      }
      if (dy > 0) {
        return 1;
      }
      if (dx < 0) {
        return 2;
      }
      return 3;
    }
    if (dx > 0) {
      return 0;
    }
    if (dy < 0) {
      return 1;
    }
    if (dx < 0) {
      return 2;
    }
    return 3;
  };

  const sortedAdjacency: (RouteGraphEdge[] | undefined)[] = new Array(N);

  while (heap.size > 0) {
    const cur = heap.pop()!;
    const di = dirIndex(cur.dir);
    if (cur.len !== distLen[cur.node * 3 + di] || cur.bends !== distBends[cur.node * 3 + di]) {
      continue;
    }
    if (cur.node === g.endIdx) {
      break;
    }

    // Relaxation order is a property of the node and `prefer`, not of the search
    // state, but a node is popped once per incoming direction — so copying and
    // sorting its adjacency list inline re-did the same work up to three times
    // per node, on every one of the tens of thousands of searches per layout.
    // Memoized per search; the order itself is unchanged.
    let edges = sortedAdjacency[cur.node];
    if (edges === undefined) {
      const fromNode = g.nodes[cur.node];
      edges = [...g.adj[cur.node]];
      edges.sort((a, b) => {
        const na = g.nodes[a.to];
        const nb = g.nodes[b.to];
        const oa = neighborOrder(fromNode, na);
        const ob = neighborOrder(fromNode, nb);
        if (oa !== ob) {
          return oa - ob;
        }
        if (na.x !== nb.x) {
          return na.x - nb.x;
        }
        return na.y - nb.y;
      });
      sortedAdjacency[cur.node] = edges;
    }

    for (const e of edges) {
      const nextDir: Dir = e.dir;
      const nd = dirIndex(nextDir);
      const bendInc = cur.dir === 'n' || cur.dir === nextDir ? 0 : 1;
      const nextLen = cur.len + e.length + crossPenalty(cur.node, e.to);
      const nextBends = cur.bends + bendInc;

      const ti = e.to * 3 + nd;
      const bestLen = distLen[ti];
      const bestBends = distBends[ti];

      if (nextLen < bestLen || (nextLen === bestLen && nextBends < bestBends)) {
        distLen[ti] = nextLen;
        distBends[ti] = nextBends;
        prevNode[ti] = cur.node;
        prevDir[ti] = di;
        heap.push({ node: e.to, dir: nextDir, len: nextLen, bends: nextBends });
      }
    }
  }

  // Pick best end dir.
  let bestEndDir = 0;
  for (let d = 1; d < 3; d++) {
    if (
      distLen[g.endIdx * 3 + d] < distLen[g.endIdx * 3 + bestEndDir] ||
      (distLen[g.endIdx * 3 + d] === distLen[g.endIdx * 3 + bestEndDir] &&
        distBends[g.endIdx * 3 + d] < distBends[g.endIdx * 3 + bestEndDir])
    ) {
      bestEndDir = d;
    }
  }
  if (!Number.isFinite(distLen[g.endIdx * 3 + bestEndDir])) {
    return null;
  }

  // Reconstruct path.
  const pathIdxs: number[] = [];
  let curNode = g.endIdx;
  let curDir = bestEndDir;
  while (curNode !== -1) {
    pathIdxs.push(curNode);
    const pn = prevNode[curNode * 3 + curDir];
    const pd = prevDir[curNode * 3 + curDir];
    curNode = pn;
    curDir = pd;
  }
  pathIdxs.reverse();

  const pts = pathIdxs.map((i) => ({ x: g.nodes[i].x, y: g.nodes[i].y }));
  return compressCollinear(pts);
}

// ============================================================================
// High-Level Routing Functions
// ============================================================================

/**
 * Find a path through the routing graph between two ports.
 */
export function findRoutingGraphPathBetweenPorts(
  startPort: Point,
  endPort: Point,
  nodesById: Map<string, Node>,
  startNodeId: string,
  endNodeId: string,
  spacing: number,
  options: {
    model?: 'grid' | 'representatives' | 'channels';
    clearance?: number;
    avoid?: { segments: Point[][]; costPerCrossing: number };
    cache?: RoutingQueryCache;
  } = {}
): Point[] | null {
  const c = Math.max(0, options.clearance ?? spacing);
  const obstacleRects = collectObstacleRectsCached(
    nodesById,
    startNodeId,
    endNodeId,
    c,
    options.cache
  );
  if (obstacleRects.length === 0) {
    return null;
  }

  const model = options.model ?? 'grid';
  const graph =
    model === 'channels'
      ? buildRoutingGraphFromChannels(startPort, endPort, obstacleRects, spacing, c)
      : model === 'representatives'
        ? buildRoutingGraphFromRepresentatives(startPort, endPort, obstacleRects, spacing, c)
        : buildRoutingGraphFromRects(startPort, endPort, obstacleRects, spacing, c);
  if (!graph) {
    return null;
  }

  const path = findShortestOrthogonalPathOnGraph(graph, { prefer: 'ESWN', avoid: options.avoid });
  return path;
}

/**
 * Same as findRoutingGraphPathBetweenPorts, but allows passing explicit obstacle rectangles.
 * This is used by cluster/compound routing where start/end are intermediate waypoints rather
 * than actual node IDs.
 */
export function findRoutingGraphPathBetweenPortsWithObstacles(
  startPort: Point,
  endPort: Point,
  obstacleRects: Rect[],
  spacing: number,
  options: {
    model?: 'grid' | 'representatives' | 'channels';
    clearance?: number;
    avoid?: { segments: Point[][]; costPerCrossing: number };
  } = {}
): Point[] | null {
  if (!obstacleRects || obstacleRects.length === 0) {
    return null;
  }
  const c = Math.max(0, options.clearance ?? spacing);
  const inflated = c > 0 ? obstacleRects.map((r) => inflateRect(r, c)) : obstacleRects;
  const model = options.model ?? 'grid';
  const graph =
    model === 'channels'
      ? buildRoutingGraphFromChannels(startPort, endPort, inflated, spacing, c)
      : model === 'representatives'
        ? buildRoutingGraphFromRepresentatives(startPort, endPort, inflated, spacing, c)
        : buildRoutingGraphFromRects(startPort, endPort, inflated, spacing, c);
  if (!graph) {
    return null;
  }
  return findShortestOrthogonalPathOnGraph(graph, { prefer: 'ESWN', avoid: options.avoid });
}

/**
 * Route a straight line between aligned nodes.
 * Returns a 2-point segment if nodes are aligned, null otherwise.
 */
export function routeAligned(startNode: Node, endNode: Node): Point[] | null {
  const rs = rectForNode(startNode);
  const re = rectForNode(endNode);

  // Horizontally aligned centres -> straight horizontal segment.
  if (approxEqual(rs.cy, re.cy)) {
    const leftToRight = rs.cx <= re.cx;
    const startPort: Point = leftToRight ? { x: rs.right, y: rs.cy } : { x: rs.left, y: rs.cy };
    const endPort: Point = leftToRight ? { x: re.left, y: re.cy } : { x: re.right, y: re.cy };
    return [startPort, endPort];
  }

  // Vertically aligned centres -> straight vertical segment.
  if (approxEqual(rs.cx, re.cx)) {
    const topToBottom = rs.cy <= re.cy;
    const startPort: Point = topToBottom ? { x: rs.cx, y: rs.bottom } : { x: rs.cx, y: rs.top };
    const endPort: Point = topToBottom ? { x: re.cx, y: re.top } : { x: re.cx, y: re.bottom };
    return [startPort, endPort];
  }

  return null;
}

/**
 * Simple orthogonal L-shaped fallback for non-aligned nodes.
 */
export function routeLShape(startNode: Node, endNode: Node, ports: AssignedPorts): Point[] {
  const rs = rectForNode(startNode);
  const re = rectForNode(endNode);
  const dx = re.cx - rs.cx;
  const dy = re.cy - rs.cy;

  if (Math.abs(dx) >= Math.abs(dy)) {
    const startPort = ports.startPort;
    const endPort = ports.endPort;
    const via: Point = { x: startPort.x, y: endPort.y };
    return [startPort, via, endPort];
  }

  const startPort = ports.startPort;
  const endPort = ports.endPort;
  const via: Point = { x: endPort.x, y: startPort.y };
  return [startPort, via, endPort];
}

/**
 * Choose a boundary port for a node that lies outside all other nodes' interiors.
 */
export function chooseBoundaryPortOutsideOtherNodes(
  nodeId: string,
  otherEndpointId: string,
  nodesById: Map<string, Node>,
  options: { preferredSide?: PortSide; candidatePort?: Point } = {}
): Point | null {
  const node = nodesById.get(nodeId);
  if (!node) {
    return null;
  }

  const rect = rectForNode(node);
  // If the caller already has a candidate port (typically the stage-1 assigned port),
  // keep it unless it's actually inside another node. This avoids arbitrarily picking
  // a different side and creating needless detours.
  if (options.candidatePort) {
    outerCand: {
      for (const [id, other] of nodesById) {
        if (id === nodeId || id === otherEndpointId) {
          continue;
        }
        if (pointInRectInterior(options.candidatePort, rectForNode(other))) {
          break outerCand;
        }
      }
      return options.candidatePort;
    }
  }

  const baseSides: PortSide[] = ['N', 'S', 'W', 'E'];
  const preferred = options.preferredSide;
  const sides: PortSide[] = preferred
    ? [preferred, ...baseSides.filter((s) => s !== preferred)]
    : baseSides;
  const candidates: Point[] = sides.map((side) => computeBoundaryPort(rect, side));

  outer: for (const candidate of candidates) {
    for (const [id, other] of nodesById) {
      if (id === nodeId || id === otherEndpointId) {
        continue;
      }
      const otherRect = rectForNode(other);
      if (pointInRectInterior(candidate, otherRect)) {
        continue outer;
      }
    }
    return candidate;
  }

  return null;
}

/**
 * If a straight aligned path is blocked, try simple detours around obstacles.
 * Falls back to routing-graph search if simple detours fail.
 */
export function detourAlignedIfBlocked(
  points: Point[],
  nodesById: Map<string, Node>,
  startNodeId: string,
  endNodeId: string,
  spacing: number
): Point[] {
  if (points.length !== 2) {
    return points;
  }
  const [startPort, endPort] = points;
  const isHorizontal = approxEqual(startPort.y, endPort.y);
  const isVertical = approxEqual(startPort.x, endPort.x);
  if (!isHorizontal && !isVertical) {
    return points;
  }

  // Collect rectangles that block the direct aligned segment.
  const blockingRects: Rect[] = [];
  for (const [id, node] of nodesById) {
    if (id === startNodeId || id === endNodeId) {
      continue;
    }
    const rect = rectForNode(node);
    if (segmentIntersectsRectInterior(startPort, endPort, rect)) {
      blockingRects.push(rect);
    }
  }

  if (blockingRects.length === 0) {
    return points;
  }

  const margin = spacing > 0 ? spacing : 10;
  const candidates: Point[][] = [];

  if (isHorizontal) {
    const minTop = Math.min(...blockingRects.map((r) => r.top));
    const maxBottom = Math.max(...blockingRects.map((r) => r.bottom));
    const yAbove = minTop - margin;
    const yBelow = maxBottom + margin;

    const above: Point[] = [
      startPort,
      { x: startPort.x, y: yAbove },
      { x: endPort.x, y: yAbove },
      endPort,
    ];
    const below: Point[] = [
      startPort,
      { x: startPort.x, y: yBelow },
      { x: endPort.x, y: yBelow },
      endPort,
    ];

    if (!polylineIntersectsAnyRect(above, nodesById, startNodeId, endNodeId)) {
      candidates.push(above);
    }
    if (!polylineIntersectsAnyRect(below, nodesById, startNodeId, endNodeId)) {
      candidates.push(below);
    }
  } else if (isVertical) {
    const minLeft = Math.min(...blockingRects.map((r) => r.left));
    const maxRight = Math.max(...blockingRects.map((r) => r.right));
    const xLeft = minLeft - margin;
    const xRight = maxRight + margin;

    const leftPath: Point[] = [
      startPort,
      { x: xLeft, y: startPort.y },
      { x: xLeft, y: endPort.y },
      endPort,
    ];
    const rightPath: Point[] = [
      startPort,
      { x: xRight, y: startPort.y },
      { x: xRight, y: endPort.y },
      endPort,
    ];

    if (!polylineIntersectsAnyRect(leftPath, nodesById, startNodeId, endNodeId)) {
      candidates.push(leftPath);
    }
    if (!polylineIntersectsAnyRect(rightPath, nodesById, startNodeId, endNodeId)) {
      candidates.push(rightPath);
    }
  }

  if (candidates.length === 0) {
    // Fall back to routing-graph search.
    const safeStartPort =
      chooseBoundaryPortOutsideOtherNodes(startNodeId, endNodeId, nodesById, {
        candidatePort: startPort,
      }) ?? startPort;
    const safeEndPort =
      chooseBoundaryPortOutsideOtherNodes(endNodeId, startNodeId, nodesById, {
        candidatePort: endPort,
      }) ?? endPort;
    const routed = findRoutingGraphPathBetweenPorts(
      safeStartPort,
      safeEndPort,
      nodesById,
      startNodeId,
      endNodeId,
      spacing
    );
    if (routed && !polylineIntersectsAnyRect(routed, nodesById, startNodeId, endNodeId)) {
      return routed;
    }
    return points;
  }

  // Choose best candidate by (length, bends).
  let best = candidates[0];
  let bestLen = manhattanLength(best);
  let bestBends = bendCount(best);
  for (let i = 1; i < candidates.length; i++) {
    const candidate = candidates[i];
    const len = manhattanLength(candidate);
    const bends = bendCount(candidate);
    if (len < bestLen || (len === bestLen && bends < bestBends)) {
      best = candidate;
      bestLen = len;
      bestBends = bends;
    }
  }

  return best;
}
