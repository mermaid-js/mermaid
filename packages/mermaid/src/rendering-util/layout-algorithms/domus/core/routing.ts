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

  const nodes: RouteGraphNode[] = [];
  const indexByKey = new Map<string, number>();

  function key(x: number, y: number): string {
    return `${x},${y}`;
  }

  // Create grid intersection nodes that are not inside any obstacle interior.
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

  // Horizontal connections.
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

  // Vertical connections.
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

export function buildRoutingGraphFromChannels(
  startPort: Point,
  endPort: Point,
  obstacleRects: Rect[],
  spacing: number,
  clearance: number = spacing
): RoutingGraph | null {
  const c = Math.max(0, clearance);
  // Build a loose boundary around everything to ensure outer channels exist.
  const xs = [startPort.x, endPort.x];
  const ys = [startPort.y, endPort.y];
  for (const r of obstacleRects) {
    xs.push(r.left, r.right);
    ys.push(r.top, r.bottom);
  }
  const minX = Math.min(...xs) - c * 5;
  const maxX = Math.max(...xs) + c * 5;
  const minY = Math.min(...ys) - c * 5;
  const maxY = Math.max(...ys) + c * 5;

  interface Channel {
    dir: 'E' | 'W' | 'N' | 'S';
    x0: number;
    x1: number;
    y0: number;
    y1: number;
  }

  const channels: Channel[] = [];
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
    let bestE: Channel | null = null;
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
      const cand: Channel = { dir: 'E', x0, x1, y0: ov.y0, y1: ov.y1 };
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
    let bestW: Channel | null = null;
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
      const cand: Channel = { dir: 'W', x0, x1, y0: ov.y0, y1: ov.y1 };
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
    let bestS: Channel | null = null;
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
      const cand: Channel = { dir: 'S', x0: ov.y0, x1: ov.y1, y0, y1 };
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
    let bestN: Channel | null = null;
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
      const cand: Channel = { dir: 'N', x0: ov.y0, x1: ov.y1, y0, y1 };
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
  const width = (c: Channel) => (c.dir === 'E' || c.dir === 'W' ? c.x1 - c.x0 : c.y1 - c.y0);
  const proj0 = (c: Channel) => (c.dir === 'E' || c.dir === 'W' ? c.y0 : c.x0);
  const proj1 = (c: Channel) => (c.dir === 'E' || c.dir === 'W' ? c.y1 : c.x1);
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
  const prunedChannels = channels.filter((_, idx) => !dominated.has(idx));

  // Representative lines: centerline of each channel + always include ports.
  // Prefer port-aligned lines (paper: prefer reps starting at a port).
  const xLines: number[] = [startPort.x, endPort.x];
  const yLines: number[] = [startPort.y, endPort.y];
  for (const ch of prunedChannels) {
    if (ch.dir === 'E' || ch.dir === 'W') {
      xLines.push((ch.x0 + ch.x1) / 2);
      // Avoid adding both endpoints; it bloats the grid. Keep only midpoint projection anchors.
      yLines.push((ch.y0 + ch.y1) / 2);
    } else {
      yLines.push((ch.y0 + ch.y1) / 2);
      xLines.push((ch.x0 + ch.x1) / 2);
    }
  }

  const xCoords = uniqSorted(xLines);
  const yCoords = uniqSorted(yLines);
  if (xCoords.length === 0 || yCoords.length === 0) {
    return null;
  }

  const nodes: RouteGraphNode[] = [];
  const indexByKey = new Map<string, number>();
  const key = (x: number, y: number) => `${x},${y}`;

  for (const y of yCoords) {
    // Same narrowing as the adjacency loops below: `pointInRectInterior`
    // requires `p.y > rect.top && p.y < rect.bottom`, so only rects strictly
    // spanning this row can contain any point on it.
    const rowRects = obstacleRects.filter((r) => r.top < y && r.bottom > y);
    for (const x of xCoords) {
      if (pointInsideAnyRectInterior({ x, y }, rowRects)) {
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

  for (const y of yCoords) {
    // A horizontal segment at height `y` can only be blocked by a rect whose
    // vertical span contains `y`: `segmentIntersectsRectInterior` requires
    // `y >= rect.top && y <= rect.bottom`. Narrowing the obstacle list once per
    // row is therefore exactly equivalent to scanning every rect per segment,
    // and takes the adjacency build from O(|X|*|Y|*n) to O(|Y|*n + |X|*|Y|*k)
    // where k is the few rects that actually span the row.
    const rowRects = obstacleRects.filter((r) => r.top <= y && r.bottom >= y);
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

  for (const x of xCoords) {
    // Dual of the row filter: a vertical segment at `x` can only be blocked by
    // a rect with `x >= rect.left && x <= rect.right`.
    const colRects = obstacleRects.filter((r) => r.left <= x && r.right >= x);
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
  const distLen = Array.from({ length: N }, () => [Infinity, Infinity, Infinity]);
  const distBends = Array.from({ length: N }, () => [Infinity, Infinity, Infinity]);
  const prevNode = Array.from({ length: N }, () => [-1, -1, -1]);
  const prevDir = Array.from({ length: N }, () => [0, 0, 0]);

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

  distLen[g.startIdx][0] = 0;
  distBends[g.startIdx][0] = 0;
  heap.push(startState);

  // Soft crossing-avoidance cost per graph edge (cached per node pair).
  const avoid = options.avoid;
  const penaltyCache = new Map<number, number>();
  const segsCrossStrict = (a1: Point, a2: Point, b1: Point, b2: Point): boolean => {
    const d = (p: Point, q: Point, r: Point) =>
      (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
    const d1 = d(b1, b2, a1);
    const d2 = d(b1, b2, a2);
    const d3 = d(a1, a2, b1);
    const d4 = d(a1, a2, b2);
    return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
  };
  const crossPenalty = (fromIdx: number, toIdx: number): number => {
    if (!avoid || avoid.segments.length === 0) {
      return 0;
    }
    const key = fromIdx * N + toIdx;
    const cached = penaltyCache.get(key);
    if (cached !== undefined) {
      return cached;
    }
    const a1 = { x: g.nodes[fromIdx].x, y: g.nodes[fromIdx].y };
    const a2 = { x: g.nodes[toIdx].x, y: g.nodes[toIdx].y };
    let crossings = 0;
    for (const poly of avoid.segments) {
      for (let i = 0; i < poly.length - 1; i++) {
        if (segsCrossStrict(a1, a2, poly[i], poly[i + 1])) {
          crossings++;
        }
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

  while (heap.size > 0) {
    const cur = heap.pop()!;
    const di = dirIndex(cur.dir);
    if (cur.len !== distLen[cur.node][di] || cur.bends !== distBends[cur.node][di]) {
      continue;
    }
    if (cur.node === g.endIdx) {
      break;
    }

    const fromNode = g.nodes[cur.node];
    const edges = [...g.adj[cur.node]];
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

    for (const e of edges) {
      const nextDir: Dir = e.dir;
      const nd = dirIndex(nextDir);
      const bendInc = cur.dir === 'n' || cur.dir === nextDir ? 0 : 1;
      const nextLen = cur.len + e.length + crossPenalty(cur.node, e.to);
      const nextBends = cur.bends + bendInc;

      const bestLen = distLen[e.to][nd];
      const bestBends = distBends[e.to][nd];

      if (nextLen < bestLen || (nextLen === bestLen && nextBends < bestBends)) {
        distLen[e.to][nd] = nextLen;
        distBends[e.to][nd] = nextBends;
        prevNode[e.to][nd] = cur.node;
        prevDir[e.to][nd] = di;
        heap.push({ node: e.to, dir: nextDir, len: nextLen, bends: nextBends });
      }
    }
  }

  // Pick best end dir.
  let bestEndDir = 0;
  for (let d = 1; d < 3; d++) {
    if (
      distLen[g.endIdx][d] < distLen[g.endIdx][bestEndDir] ||
      (distLen[g.endIdx][d] === distLen[g.endIdx][bestEndDir] &&
        distBends[g.endIdx][d] < distBends[g.endIdx][bestEndDir])
    ) {
      bestEndDir = d;
    }
  }
  if (!Number.isFinite(distLen[g.endIdx][bestEndDir])) {
    return null;
  }

  // Reconstruct path.
  const pathIdxs: number[] = [];
  let curNode = g.endIdx;
  let curDir = bestEndDir;
  while (curNode !== -1) {
    pathIdxs.push(curNode);
    const pn = prevNode[curNode][curDir];
    const pd = prevDir[curNode][curDir];
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
  } = {}
): Point[] | null {
  const c = Math.max(0, options.clearance ?? spacing);
  const obstacleRects = collectObstacleRects(nodesById, startNodeId, endNodeId, c);
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
