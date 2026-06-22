/**
 * Layout quality scoring function (Level 2 validation).
 *
 * Computes soft quality metrics for a computed layout and returns numeric scores.
 * Independent of validateLayout (Level 1) — they share geometry helpers but
 * neither calls the other.
 */
import type { LayoutData, Node } from '../../types.js';
import { log } from '../../../logger.js';
import { DEBUG_KEY } from './debug.js';
import { rectForNode } from './helpers.js';
import type { Point } from './types.js';
import { normalizePolyline, distance, segmentsCross } from './geometry.js';
import type { Segment } from './geometry.js';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface LayoutScores {
  edgeLengthRatio: number;
  aspectRatio: number;
  avgBendsPerEdge: number;
  totalBends: number;
  crossings: number;
  rankFaithfulness: number;
  neighborhoodPreservation: number;
  /**
   * NOT YET IMPLEMENTED — always `NaN`. Symmetry detection is unfinished, so
   * this is a placeholder. A NaN value fails any threshold a caller sets on it
   * (see `evaluateThresholds`), and no current caller scores against it, so the
   * overall layout assessment is not symmetry-aware. TODO: implement.
   */
  symmetryScore: number;
  boundingBoxArea: number;
  straightEdgeRatio: number;
  /**
   * Count of edges whose first or last RENDERED segment is non-axis-aligned.
   * Mirrors `rendering-elements/edges.js:426-462` — the renderer recomputes
   * endpoint boundary intersections with `intersect.rect(node, inner_point)`,
   * which draws a ray from node center through inner_point; if inner_point
   * is offset from the center in both axes, the boundary snap lands at a
   * different perpendicular offset, producing a diagonal final segment.
   * An edge counts as 1 if its first OR last rendered segment is diagonal;
   * an edge with both first and last diagonal also counts as 1 (per-edge count).
   */
  renderedDiagonalEndpoints: number;
}

export interface ScoreLayoutResult {
  scores: LayoutScores;
  thresholdResults: Record<string, { value: number; threshold: string; pass: boolean }> | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Filter to leaf (non-group) nodes with valid ids */
function getLeafNodes(nodes: Node[]): Node[] {
  return nodes.filter((n) => n?.id != null && !n.isGroup);
}

/** Get node center — node.x/y represent the center per rectForNode convention */
function nodeCenter(node: Node): Point {
  return { x: node.x ?? 0, y: node.y ?? 0 };
}

/** Compute bounding box dimensions for leaf nodes using full node rects */
function leafBoundingBox(leafNodes: Node[]): { width: number; height: number } | null {
  if (leafNodes.length === 0) {
    return null;
  }
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const n of leafNodes) {
    const r = rectForNode(n);
    minX = Math.min(minX, r.left);
    maxX = Math.max(maxX, r.right);
    minY = Math.min(minY, r.top);
    maxY = Math.max(maxY, r.bottom);
  }
  return { width: maxX - minX, height: maxY - minY };
}

/** Compute average ranks for a list of values (ties get average rank) */
function computeAverageRanks(values: number[]): number[] {
  const indexed = values.map((v, i) => ({ v, i }));
  indexed.sort((a, b) => a.v - b.v);
  const ranks = new Array<number>(values.length);
  let i = 0;
  while (i < indexed.length) {
    let j = i;
    while (j < indexed.length && indexed[j].v === indexed[i].v) {
      j++;
    }
    // Average rank for tied group (1-based)
    const avgRank = (i + 1 + j) / 2;
    for (let k = i; k < j; k++) {
      ranks[indexed[k].i] = avgRank;
    }
    i = j;
  }
  return ranks;
}

// ─────────────────────────────────────────────────────────────────────────────
// Metric: edgeLengthRatio
// ─────────────────────────────────────────────────────────────────────────────

function computeEdgeLengthRatio(
  edges: { points: Point[]; startNode: Node | undefined; endNode: Node | undefined }[]
): number {
  if (edges.length === 0) {
    return NaN;
  }

  let totalActual = 0;
  let totalTheoretical = 0;

  for (const edge of edges) {
    // Actual length: sum of Euclidean distances between consecutive points
    for (let i = 0; i < edge.points.length - 1; i++) {
      totalActual += distance(edge.points[i], edge.points[i + 1]);
    }
    // Theoretical minimum: Manhattan distance between source and target centers
    if (edge.startNode && edge.endNode) {
      const sc = nodeCenter(edge.startNode);
      const tc = nodeCenter(edge.endNode);
      totalTheoretical += Math.abs(tc.x - sc.x) + Math.abs(tc.y - sc.y);
    }
  }

  if (totalTheoretical === 0) {
    return NaN;
  }

  return totalActual / totalTheoretical;
}

// ─────────────────────────────────────────────────────────────────────────────
// Metric: renderedDiagonalEndpoints
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Exact mirror of `rendering-util/rendering-elements/intersect/intersect-rect.js`.
 * Given a node rect (via center + half-dims) and an external `point`, return
 * the boundary point where the line from center to point crosses the rect.
 */
function intersectRect(center: Point, halfW: number, halfH: number, point: Point): Point {
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  let w = halfW;
  let h = halfH;
  let sx: number;
  let sy: number;
  if (Math.abs(dy) * w > Math.abs(dx) * h) {
    if (dy < 0) {
      h = -h;
    }
    sx = dy === 0 ? 0 : (h * dx) / dy;
    sy = h;
  } else {
    if (dx < 0) {
      w = -w;
    }
    sx = w;
    sy = dx === 0 ? 0 : (w * dy) / dx;
  }
  return { x: center.x + sx, y: center.y + sy };
}

/**
 * Simulates `rendering-elements/edges.js:426-462` and returns true if the
 * RENDERED (post-intersect) first or last segment of this edge is diagonal.
 * Uses the same TOLERANCE (0.5) as edges.js for the duplicate-endpoint guard.
 */
function hasDiagonalRenderedEndpoint(
  points: Point[],
  startNode: Node | undefined,
  endNode: Node | undefined
): boolean {
  if (points.length < 2) {
    return false;
  }
  const AXIS_EPS = 0.5;
  const DUPLICATE_TOLERANCE = 0.5;

  // For a 2-point polyline, edges.js runs both endpoints through
  // intersect.rect with the OTHER endpoint as the ray target.
  if (points.length === 2) {
    if (!startNode || !endNode) {
      return false;
    }
    const sc = nodeCenter(startNode);
    const ec = nodeCenter(endNode);
    const shw = (startNode.width ?? 40) / 2;
    const shh = (startNode.height ?? 40) / 2;
    const ehw = (endNode.width ?? 40) / 2;
    const ehh = (endNode.height ?? 40) / 2;
    const newFirst = intersectRect(sc, shw, shh, points[0]);
    const newLast = intersectRect(ec, ehw, ehh, points[1]);
    const dx = newLast.x - newFirst.x;
    const dy = newLast.y - newFirst.y;
    return Math.abs(dx) > AXIS_EPS && Math.abs(dy) > AXIS_EPS;
  }

  // Multi-segment: innerPoints = points[1..n-2]; newFirst = tail.intersect(firstInner);
  // newLast = head.intersect(lastInner). Duplicate guard drops newFirst/newLast if
  // they collapse onto firstInner/lastInner.
  const firstInner = points[1];
  const lastInner = points[points.length - 2];

  // First segment analysis.
  let firstDiag = false;
  if (startNode) {
    const sc = nodeCenter(startNode);
    const shw = (startNode.width ?? 40) / 2;
    const shh = (startNode.height ?? 40) / 2;
    const newFirst = intersectRect(sc, shw, shh, firstInner);
    const firstIsDup =
      Math.abs(newFirst.x - firstInner.x) < DUPLICATE_TOLERANCE &&
      Math.abs(newFirst.y - firstInner.y) < DUPLICATE_TOLERANCE;
    // Rendered first segment: either newFirst→firstInner (not dup) or
    // firstInner→points[2] (dup).
    const a = firstIsDup ? firstInner : newFirst;
    const b = firstIsDup ? (points[2] ?? firstInner) : firstInner;
    firstDiag = Math.abs(a.x - b.x) > AXIS_EPS && Math.abs(a.y - b.y) > AXIS_EPS;
  }

  // Last segment analysis.
  let lastDiag = false;
  if (endNode) {
    const ec = nodeCenter(endNode);
    const ehw = (endNode.width ?? 40) / 2;
    const ehh = (endNode.height ?? 40) / 2;
    const newLast = intersectRect(ec, ehw, ehh, lastInner);
    const lastIsDup =
      Math.abs(newLast.x - lastInner.x) < DUPLICATE_TOLERANCE &&
      Math.abs(newLast.y - lastInner.y) < DUPLICATE_TOLERANCE;
    const a = lastIsDup ? (points[points.length - 3] ?? lastInner) : lastInner;
    const b = lastIsDup ? lastInner : newLast;
    lastDiag = Math.abs(a.x - b.x) > AXIS_EPS && Math.abs(a.y - b.y) > AXIS_EPS;
  }

  return firstDiag || lastDiag;
}

// ─────────────────────────────────────────────────────────────────────────────
// Metric: crossings
// ─────────────────────────────────────────────────────────────────────────────

function computeCrossings(edgeSegments: Segment[][]): number {
  let crossings = 0;
  for (let i = 0; i < edgeSegments.length; i++) {
    for (let j = i + 1; j < edgeSegments.length; j++) {
      for (const s1 of edgeSegments[i]) {
        for (const s2 of edgeSegments[j]) {
          if (segmentsCross(s1, s2)) {
            crossings++;
          }
        }
      }
    }
  }
  return crossings;
}

// ─────────────────────────────────────────────────────────────────────────────
// Metric: rankFaithfulness
// ─────────────────────────────────────────────────────────────────────────────

function computeRankFaithfulness(
  leafNodes: Node[],
  edges: { start: string; end: string }[]
): number {
  if (leafNodes.length < 2) {
    return NaN;
  }

  const leafIds = new Set(leafNodes.map((n) => String(n.id)));

  // Build adjacency list (directed) among leaf nodes only
  const adj = new Map<string, string[]>();
  const inDegree = new Map<string, number>();
  for (const id of leafIds) {
    adj.set(id, []);
    inDegree.set(id, 0);
  }
  for (const e of edges) {
    if (leafIds.has(e.start) && leafIds.has(e.end)) {
      adj.get(e.start)!.push(e.end);
      inDegree.set(e.end, (inDegree.get(e.end) ?? 0) + 1);
    }
  }

  // Find roots (in-degree 0)
  const roots: string[] = [];
  for (const [id, deg] of inDegree) {
    if (deg === 0) {
      roots.push(id);
    }
  }

  if (roots.length === 0) {
    return NaN; // Pure cycle — no roots
  }

  // BFS from all roots simultaneously
  const depth = new Map<string, number>();
  const queue: string[] = [];
  for (const r of roots) {
    depth.set(r, 0);
    queue.push(r);
  }

  let head = 0;
  while (head < queue.length) {
    const cur = queue[head++];
    const d = depth.get(cur)!;
    for (const next of adj.get(cur) ?? []) {
      if (!depth.has(next)) {
        depth.set(next, d + 1);
        queue.push(next);
      }
    }
  }

  // Collect nodes with known depth and their Y-centers
  const nodeById = new Map(leafNodes.map((n) => [String(n.id), n]));
  const pairs: { depth: number; yCenter: number }[] = [];
  for (const [id, d] of depth) {
    const node = nodeById.get(id);
    if (node) {
      pairs.push({ depth: d, yCenter: node.y ?? 0 });
    }
  }

  if (pairs.length < 2) {
    return NaN;
  }

  // Spearman rank correlation between depth-rank and Y-position-rank
  const depthRanks = computeAverageRanks(pairs.map((p) => p.depth));
  const yRanks = computeAverageRanks(pairs.map((p) => p.yCenter));
  const n = pairs.length;
  let sumD2 = 0;
  for (let i = 0; i < n; i++) {
    const d = depthRanks[i] - yRanks[i];
    sumD2 += d * d;
  }

  return 1 - (6 * sumD2) / (n * (n * n - 1));
}

// ─────────────────────────────────────────────────────────────────────────────
// Metric: neighborhoodPreservation
// ─────────────────────────────────────────────────────────────────────────────

function computeNeighborhoodPreservation(
  leafNodes: Node[],
  edges: { start: string; end: string }[]
): number {
  if (leafNodes.length < 2) {
    return NaN;
  }

  const leafIds = new Set(leafNodes.map((n) => String(n.id)));

  // Build set of connected pairs (canonical key: sorted ids)
  const connectedPairs = new Set<string>();
  for (const e of edges) {
    if (leafIds.has(e.start) && leafIds.has(e.end) && e.start !== e.end) {
      const key = e.start < e.end ? `${e.start}|${e.end}` : `${e.end}|${e.start}`;
      connectedPairs.add(key);
    }
  }

  const nodeById = new Map(leafNodes.map((n) => [String(n.id), n]));
  const ids = [...leafIds].sort();

  let connectedSum = 0;
  let connectedCount = 0;
  let unconnectedSum = 0;
  let unconnectedCount = 0;

  // Use full pairwise for small graphs, sampling for large ones
  const useFullPairwise = ids.length <= 500;

  if (useFullPairwise) {
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const a = nodeById.get(ids[i])!;
        const b = nodeById.get(ids[j])!;
        const dist = distance(nodeCenter(a), nodeCenter(b));
        const key = ids[i] < ids[j] ? `${ids[i]}|${ids[j]}` : `${ids[j]}|${ids[i]}`;
        if (connectedPairs.has(key)) {
          connectedSum += dist;
          connectedCount++;
        } else {
          unconnectedSum += dist;
          unconnectedCount++;
        }
      }
    }
  } else {
    // Connected pairs: iterate over unique pairs from the Set
    for (const pairKey of connectedPairs) {
      const [idA, idB] = pairKey.split('|');
      const nodeA = nodeById.get(idA);
      const nodeB = nodeById.get(idB);
      if (nodeA && nodeB) {
        connectedSum += distance(nodeCenter(nodeA), nodeCenter(nodeB));
        connectedCount++;
      }
    }
    // Sample 200 random unconnected pairs
    let sampled = 0;
    const maxAttempts = 2000;
    let attempts = 0;
    while (sampled < 200 && attempts < maxAttempts) {
      attempts++;
      const ai = Math.floor(Math.random() * ids.length);
      const bi = Math.floor(Math.random() * ids.length);
      if (ai === bi) {
        continue;
      }
      const key = ids[ai] < ids[bi] ? `${ids[ai]}|${ids[bi]}` : `${ids[bi]}|${ids[ai]}`;
      if (connectedPairs.has(key)) {
        continue;
      }
      const a = nodeById.get(ids[ai])!;
      const b = nodeById.get(ids[bi])!;
      unconnectedSum += distance(nodeCenter(a), nodeCenter(b));
      unconnectedCount++;
      sampled++;
    }
  }

  if (connectedCount === 0 || unconnectedCount === 0) {
    return NaN;
  }

  const meanConnected = connectedSum / connectedCount;
  const meanUnconnected = unconnectedSum / unconnectedCount;

  if (meanUnconnected === 0) {
    return NaN;
  }

  const raw = 1 - meanConnected / meanUnconnected;
  return Math.max(0, Math.min(1, raw)); // Clamp to [0, 1]
}

// ─────────────────────────────────────────────────────────────────────────────
// Threshold evaluation
// ─────────────────────────────────────────────────────────────────────────────

function evaluateThresholds(
  scores: LayoutScores,
  thresholds: Partial<Record<keyof LayoutScores, { min?: number; max?: number }>>
): Record<string, { value: number; threshold: string; pass: boolean }> {
  const results: Record<string, { value: number; threshold: string; pass: boolean }> = {};

  for (const [key, bounds] of Object.entries(thresholds)) {
    if (!bounds) {
      continue;
    }
    const value = scores[key as keyof LayoutScores];
    const parts: string[] = [];
    if (bounds.min !== undefined) {
      parts.push(`min: ${bounds.min}`);
    }
    if (bounds.max !== undefined) {
      parts.push(`max: ${bounds.max}`);
    }
    const thresholdStr = parts.join(', ');

    let pass = true;
    if (Number.isNaN(value)) {
      pass = false;
    } else {
      if (bounds.min !== undefined && value < bounds.min) {
        pass = false;
      }
      if (bounds.max !== undefined && value > bounds.max) {
        pass = false;
      }
    }

    results[key] = { value, threshold: thresholdStr, pass };
  }

  return results;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main function
// ─────────────────────────────────────────────────────────────────────────────

export function scoreLayout(
  layout: LayoutData,
  thresholds?: Partial<Record<keyof LayoutScores, { min?: number; max?: number }>>
): ScoreLayoutResult {
  const nodes = layout.nodes ?? [];
  const edges = layout.edges ?? [];
  const leafNodes = getLeafNodes(nodes);
  const byId = new Map<string, Node>();
  for (const n of nodes) {
    if (n?.id != null) {
      byId.set(String(n.id), n);
    }
  }

  // Pre-process edges: normalize polylines and collect metadata
  const edgeData: {
    points: Point[];
    startNode: Node | undefined;
    endNode: Node | undefined;
    start: string;
    end: string;
    segments: Segment[];
    bends: number;
  }[] = [];

  for (const e of edges) {
    const pts = (e as { points?: Point[] }).points;
    if (!Array.isArray(pts) || pts.length < 2) {
      continue;
    }
    const startId = e.start != null ? String(e.start) : '';
    const endId = e.end != null ? String(e.end) : '';
    const normalized = normalizePolyline(pts);
    edgeData.push({
      points: pts,
      startNode: startId ? byId.get(startId) : undefined,
      endNode: endId ? byId.get(endId) : undefined,
      start: startId,
      end: endId,
      segments: normalized.segments,
      bends: normalized.bends,
    });
  }

  // 1. edgeLengthRatio
  const edgeLengthRatio = computeEdgeLengthRatio(edgeData);

  // 2. aspectRatio & 9. boundingBoxArea
  const bb = leafBoundingBox(leafNodes);
  const aspectRatio = bb ? (bb.height === 0 ? Infinity : bb.width / bb.height) : NaN;
  const boundingBoxArea = bb ? bb.width * bb.height : NaN;

  // 3. avgBendsPerEdge, 4. totalBends, 10. straightEdgeRatio
  let totalBends = 0;
  let straightCount = 0;
  for (const ed of edgeData) {
    totalBends += ed.bends;
    if (ed.bends === 0) {
      straightCount++;
    }
  }
  const avgBendsPerEdge = edgeData.length > 0 ? totalBends / edgeData.length : NaN;
  const straightEdgeRatio = edgeData.length > 0 ? straightCount / edgeData.length : NaN;

  // 5. crossings
  const crossings = computeCrossings(edgeData.map((ed) => ed.segments));

  // 5a. renderedDiagonalEndpoints
  let renderedDiagonalEndpoints = 0;
  for (const ed of edgeData) {
    if (hasDiagonalRenderedEndpoint(ed.points, ed.startNode, ed.endNode)) {
      renderedDiagonalEndpoints++;
    }
  }

  // 6. rankFaithfulness
  const edgeRefs = edgeData.map((ed) => ({ start: ed.start, end: ed.end }));
  const rankFaithfulness = computeRankFaithfulness(leafNodes, edgeRefs);

  // 7. neighborhoodPreservation
  const neighborhoodPreservation = computeNeighborhoodPreservation(leafNodes, edgeRefs);

  // 8. symmetryScore — NOT YET IMPLEMENTED.
  // Returns NaN as an explicit "not computed" sentinel. No caller currently sets
  // a symmetryScore threshold, and evaluateThresholds() treats NaN as a failing
  // value, so this never contributes a passing signal and the overall score is
  // not symmetry-aware. TODO: implement symmetry detection.
  const symmetryScore = NaN;

  const scores: LayoutScores = {
    edgeLengthRatio,
    aspectRatio,
    avgBendsPerEdge,
    totalBends,
    crossings,
    rankFaithfulness,
    neighborhoodPreservation,
    symmetryScore,
    boundingBoxArea,
    straightEdgeRatio,
    renderedDiagonalEndpoints,
  };

  const thresholdResults = thresholds ? evaluateThresholds(scores, thresholds) : null;

  log.debug(DEBUG_KEY, 'SCORE_LAYOUT', { scores, thresholdResults });

  return { scores, thresholdResults };
}
