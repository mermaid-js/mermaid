import {
  dedupeConsecutivePoints,
  orthogonalizePolyline,
  pointInsideRect,
  rectFromCenterSize,
  rectOfNodeBounds,
  samePoint,
  sameX,
  sameY,
  simplifyPolyline,
} from './geometry.js';
import type { Point, RectBounds } from './geometry.js';

const EPS = 1e-3;
const INSIDE_EPS = 0.5;
const CORNER_CLEARANCE = 4;

type NodeRect = RectBounds;

type BorderSide = 'top' | 'bottom' | 'left' | 'right';

interface EndpointEdge {
  isLayoutOnly?: boolean;
  points?: Point[];
  start?: string;
  end?: string;
}

interface EndpointNode {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  isGroup?: boolean;
  metadata?: { drawnExtent?: { width?: unknown; height?: unknown } };
}

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

/** The box an edge end meets: what the shape draws when it sets `metadata.drawnExtent`, else the node box. */
function endpointRectOf(node: EndpointNode): RectBounds | undefined {
  const { x, y } = node;
  const { width, height } = node.metadata?.drawnExtent ?? {};
  return isFiniteNumber(width) && isFiniteNumber(height) && isFiniteNumber(x) && isFiniteNumber(y)
    ? rectFromCenterSize(x, y, width, height)
    : rectOfNodeBounds(node);
}

function endpointContextFor(edge: unknown, nodeByIdMap: Map<string, any>, minPoints: number) {
  const candidate = edge as EndpointEdge;
  if (candidate.isLayoutOnly || !candidate.points || candidate.points.length < minPoints) {
    return undefined;
  }
  const src = candidate.start ? nodeByIdMap.get(candidate.start) : undefined;
  const dst = candidate.end ? nodeByIdMap.get(candidate.end) : undefined;
  return {
    edge: candidate,
    points: candidate.points,
    srcRect: src ? rectOfNodeBounds(src) : undefined,
    dstRect: dst ? rectOfNodeBounds(dst) : undefined,
  };
}

// Given an axis-aligned segment from outside a rect to inside it, return the
// point where the segment enters the rect boundary.
function segmentEnterPoint(outside: Point, inside: Point, r: NodeRect): Point {
  if (sameY(outside, inside, EPS)) {
    const x = outside.x < r.left ? r.left : r.right;
    return { x, y: outside.y };
  }
  if (sameX(outside, inside, EPS)) {
    const y = outside.y < r.top ? r.top : r.bottom;
    return { x: outside.x, y };
  }
  return {
    x: Math.min(r.right, Math.max(r.left, outside.x)),
    y: Math.min(r.bottom, Math.max(r.top, outside.y)),
  };
}

function clipEndpoint(points: Point[], rect: NodeRect, atStart: boolean): Point[] {
  const step = atStart ? 1 : -1;
  let outsideIndex = atStart ? 0 : points.length - 1;
  while (
    outsideIndex >= 0 &&
    outsideIndex < points.length &&
    pointInsideRect(points[outsideIndex], rect, INSIDE_EPS)
  ) {
    outsideIndex += step;
  }
  if (outsideIndex < 0 || outsideIndex >= points.length) {
    return points;
  }

  const insideIndex = outsideIndex - step;
  if (insideIndex < 0 || insideIndex >= points.length) {
    return points;
  }

  const entry = segmentEnterPoint(points[outsideIndex], points[insideIndex], rect);
  return atStart
    ? [entry, ...points.slice(outsideIndex)]
    : [...points.slice(0, outsideIndex + 1), entry];
}

export function clipEdgeEndpointsToNodeBoundaries(edges: unknown[], nodeByIdMap: Map<string, any>) {
  for (const edge of edges) {
    const context = endpointContextFor(edge, nodeByIdMap, 2);
    if (!context) {
      continue;
    }

    let next = [...context.points];
    if (context.srcRect) {
      next = clipEndpoint(next, context.srcRect, true);
    }
    if (context.dstRect) {
      next = clipEndpoint(next, context.dstRect, false);
    }
    next = simplifyPolyline(orthogonalizePolyline(next));
    next = clearStraightEndpointCornerConnections(next, context.srcRect, context.dstRect);
    context.edge.points = simplifyPolyline(orthogonalizePolyline(next));
  }
}

function snapEndpointToBoundary(
  inner: Point,
  endpoint: Point,
  r: NodeRect,
  useApproachSide = false
): Point {
  if (sameY(inner, endpoint, EPS)) {
    if (endpoint.y < r.top - EPS || endpoint.y > r.bottom + EPS) {
      return endpoint;
    }
    if (useApproachSide) {
      if (inner.x < r.left - EPS) {
        return { x: r.left, y: inner.y };
      }
      if (inner.x > r.right + EPS) {
        return { x: r.right, y: inner.y };
      }
    }
    const toLeft = Math.abs(endpoint.x - r.left) <= Math.abs(endpoint.x - r.right);
    return { x: toLeft ? r.left : r.right, y: inner.y };
  }
  if (sameX(inner, endpoint, EPS)) {
    if (endpoint.x < r.left - EPS || endpoint.x > r.right + EPS) {
      return endpoint;
    }
    if (useApproachSide) {
      if (inner.y < r.top - EPS) {
        return { x: inner.x, y: r.top };
      }
      if (inner.y > r.bottom + EPS) {
        return { x: inner.x, y: r.bottom };
      }
    }
    const toTop = Math.abs(endpoint.y - r.top) <= Math.abs(endpoint.y - r.bottom);
    return { x: inner.x, y: toTop ? r.top : r.bottom };
  }
  return endpoint;
}

function firstDistinctAdjacent(
  points: Point[],
  endpointIndex: number,
  step: 1 | -1
): Point | undefined {
  const endpoint = points[endpointIndex];
  for (let index = endpointIndex + step; index >= 0 && index < points.length; index += step) {
    const candidate = points[index];
    if (!samePoint(candidate, endpoint, EPS)) {
      return candidate;
    }
  }
  return points[endpointIndex + step];
}

function cornerClearanceRange(min: number, max: number): { lo: number; hi: number } {
  const lo = min + CORNER_CLEARANCE;
  const hi = max - CORNER_CLEARANCE;
  return lo <= hi ? { lo, hi } : { lo: (min + max) / 2, hi: (min + max) / 2 };
}

function clampToCornerClearance(value: number, min: number, max: number): number {
  const { lo, hi } = cornerClearanceRange(min, max);
  return Math.min(hi, Math.max(lo, value));
}

function intersectRanges(
  ranges: { lo: number; hi: number }[]
): { lo: number; hi: number } | undefined {
  const lo = Math.max(...ranges.map((range) => range.lo));
  const hi = Math.min(...ranges.map((range) => range.hi));
  if (lo > hi) {
    return undefined;
  }
  return { lo, hi };
}

function clearanceRangeForSide(r: NodeRect, side: BorderSide): { lo: number; hi: number } {
  return side === 'left' || side === 'right'
    ? cornerClearanceRange(r.top, r.bottom)
    : cornerClearanceRange(r.left, r.right);
}

function terminalSideForSegment(
  endpoint: Point,
  adjacent: Point,
  r: NodeRect
): BorderSide | undefined {
  const yWithin = endpoint.y >= r.top - EPS && endpoint.y <= r.bottom + EPS;
  const xWithin = endpoint.x >= r.left - EPS && endpoint.x <= r.right + EPS;
  if (sameY(endpoint, adjacent, EPS) && yWithin) {
    if (Math.abs(endpoint.x - r.left) < EPS) {
      return 'left';
    }
    if (Math.abs(endpoint.x - r.right) < EPS) {
      return 'right';
    }
  }
  if (sameX(endpoint, adjacent, EPS) && xWithin) {
    if (Math.abs(endpoint.y - r.top) < EPS) {
      return 'top';
    }
    if (Math.abs(endpoint.y - r.bottom) < EPS) {
      return 'bottom';
    }
  }
  return undefined;
}

function isHorizontalSide(side: BorderSide): boolean {
  return side === 'left' || side === 'right';
}

function straightClearanceRange(
  start: Point,
  end: Point,
  srcRect: NodeRect | undefined,
  dstRect: NodeRect | undefined,
  horizontal: boolean
): { lo: number; hi: number } | undefined {
  const ranges: { lo: number; hi: number }[] = [];
  const srcSide = srcRect ? terminalSideForSegment(start, end, srcRect) : undefined;
  const dstSide = dstRect ? terminalSideForSegment(end, start, dstRect) : undefined;

  if (srcRect && srcSide && isHorizontalSide(srcSide) === horizontal) {
    ranges.push(clearanceRangeForSide(srcRect, srcSide));
  }
  if (dstRect && dstSide && isHorizontalSide(dstSide) === horizontal) {
    ranges.push(clearanceRangeForSide(dstRect, dstSide));
  }

  return ranges.length > 0 ? intersectRanges(ranges) : undefined;
}

function clearStraightEndpointCornerAxis(
  start: Point,
  end: Point,
  srcRect: NodeRect | undefined,
  dstRect: NodeRect | undefined,
  horizontal: boolean
): Point[] | undefined {
  const range = straightClearanceRange(start, end, srcRect, dstRect, horizontal);
  if (!range) {
    return undefined;
  }

  const current = horizontal ? start.y : start.x;
  const next = Math.min(range.hi, Math.max(range.lo, current));
  if (Math.abs(next - current) < EPS) {
    return undefined;
  }

  return horizontal
    ? [
        { x: start.x, y: next },
        { x: end.x, y: next },
      ]
    : [
        { x: next, y: start.y },
        { x: next, y: end.y },
      ];
}

function clearStraightEndpointCornerConnections(
  points: Point[],
  srcRect?: NodeRect,
  dstRect?: NodeRect
): Point[] {
  if (points.length !== 2) {
    return points;
  }

  const [start, end] = points;
  if (sameY(start, end, EPS)) {
    return clearStraightEndpointCornerAxis(start, end, srcRect, dstRect, true) ?? points;
  }

  if (sameX(start, end, EPS)) {
    return clearStraightEndpointCornerAxis(start, end, srcRect, dstRect, false) ?? points;
  }

  return points;
}

function cornerClearedEndpoint(endpoint: Point, r: NodeRect, side: BorderSide): Point {
  return isHorizontalSide(side)
    ? { x: endpoint.x, y: clampToCornerClearance(endpoint.y, r.top, r.bottom) }
    : { x: clampToCornerClearance(endpoint.x, r.left, r.right), y: endpoint.y };
}

function moveCollinearEndpointRun(
  points: Point[],
  endpointIndex: number,
  step: 1 | -1,
  endpoint: Point,
  adjusted: Point,
  horizontalTerminal: boolean
): Point[] {
  const next = points.map((point) => ({ ...point }));
  for (let index = endpointIndex; index >= 0 && index < points.length; index += step) {
    const point = points[index];
    if (horizontalTerminal && !sameY(point, endpoint, EPS)) {
      break;
    }
    if (!horizontalTerminal && !sameX(point, endpoint, EPS)) {
      break;
    }
    if (horizontalTerminal) {
      next[index].y = adjusted.y;
    } else {
      next[index].x = adjusted.x;
    }
  }
  return next;
}

function clearEndpointCornerConnection(points: Point[], r: NodeRect, atStart: boolean): Point[] {
  if (points.length < 2) {
    return points;
  }

  const endpointIndex = atStart ? 0 : points.length - 1;
  const step = atStart ? 1 : -1;
  const endpoint = points[endpointIndex];
  const adjacent = firstDistinctAdjacent(points, endpointIndex, step);
  if (!adjacent) {
    return points;
  }

  const side = terminalSideForSegment(endpoint, adjacent, r);
  if (!side) {
    return points;
  }

  const horizontalTerminal = isHorizontalSide(side);
  const adjusted = cornerClearedEndpoint(endpoint, r, side);
  if (samePoint(endpoint, adjusted, EPS)) {
    return points;
  }

  return moveCollinearEndpointRun(
    points,
    endpointIndex,
    step,
    endpoint,
    adjusted,
    horizontalTerminal
  );
}

function borderSideForSegment(a: Point, b: Point, r: NodeRect): BorderSide | undefined {
  const xWithin = Math.min(a.x, b.x) >= r.left - EPS && Math.max(a.x, b.x) <= r.right + EPS;
  const yWithin = Math.min(a.y, b.y) >= r.top - EPS && Math.max(a.y, b.y) <= r.bottom + EPS;
  if (Math.abs(a.y - r.top) < EPS && Math.abs(b.y - r.top) < EPS && xWithin) {
    return 'top';
  }
  if (Math.abs(a.y - r.bottom) < EPS && Math.abs(b.y - r.bottom) < EPS && xWithin) {
    return 'bottom';
  }
  if (Math.abs(a.x - r.left) < EPS && Math.abs(b.x - r.left) < EPS && yWithin) {
    return 'left';
  }
  if (Math.abs(a.x - r.right) < EPS && Math.abs(b.x - r.right) < EPS && yWithin) {
    return 'right';
  }
  return undefined;
}

function leavesOutward(side: BorderSide, from: Point, to: Point, r: NodeRect): boolean {
  switch (side) {
    case 'top':
      return sameX(from, to, EPS) && to.y < r.top - EPS;
    case 'bottom':
      return sameX(from, to, EPS) && to.y > r.bottom + EPS;
    case 'left':
      return sameY(from, to, EPS) && to.x < r.left - EPS;
    case 'right':
      return sameY(from, to, EPS) && to.x > r.right + EPS;
  }
}

function collapseOwnBorderStub(points: Point[], r: NodeRect, atStart: boolean): Point[] {
  if (points.length < 3) {
    return points;
  }
  if (atStart) {
    const side = borderSideForSegment(points[0], points[1], r);
    if (side && leavesOutward(side, points[1], points[2], r)) {
      return points.slice(1);
    }
    return points;
  }

  const last = points.length - 1;
  const side = borderSideForSegment(points[last - 1], points[last], r);
  if (side && leavesOutward(side, points[last - 1], points[last - 2], r)) {
    return points.slice(0, last);
  }
  return points;
}

function snapAndCollapseEndpoints(
  points: Point[],
  srcRect?: NodeRect,
  dstRect?: NodeRect
): Point[] {
  let next = points;
  if (srcRect) {
    const adjacent = firstDistinctAdjacent(next, 0, 1);
    if (adjacent) {
      const snapped = snapEndpointToBoundary(adjacent, next[0], srcRect);
      if (snapped !== next[0]) {
        next = [snapped, ...next.slice(1)];
      }
    }
    next = collapseOwnBorderStub(next, srcRect, true);
  }
  if (dstRect) {
    const last = next.length - 1;
    const adjacent = firstDistinctAdjacent(next, last, -1);
    if (adjacent) {
      const snapped = snapEndpointToBoundary(adjacent, next[last], dstRect, true);
      if (snapped !== next[last]) {
        next = [...next.slice(0, last), snapped];
      }
    }
    next = collapseOwnBorderStub(next, dstRect, false);
  }

  const straightCleared = clearStraightEndpointCornerConnections(next, srcRect, dstRect);
  if (straightCleared !== next || next.length === 2) {
    return straightCleared;
  }

  if (srcRect) {
    next = clearEndpointCornerConnection(next, srcRect, true);
  }
  if (dstRect) {
    next = clearEndpointCornerConnection(next, dstRect, false);
  }
  return next;
}

export function prepareEdgeEndpointsForRenderer(edges: unknown[], nodeByIdMap: Map<string, any>) {
  for (const edge of edges) {
    const context = endpointContextFor(edge, nodeByIdMap, 2);
    if (!context) {
      continue;
    }

    const input = dedupeConsecutivePoints(context.points, EPS);
    const newPts = snapAndCollapseEndpoints(input, context.srcRect, context.dstRect);
    if (newPts.length < 3) {
      context.edge.points = newPts;
      continue;
    }
    const duplicated = [
      newPts[0],
      { ...newPts[0] },
      ...newPts.slice(1, -1),
      newPts[newPts.length - 1],
      { ...newPts[newPts.length - 1] },
    ];
    context.edge.points = duplicated;
  }
}

/** Below this a segment counts as running along a row or column. */
const SQUARE_EPS = 1e-6;
/** A segment that runs less than this far inside a box only touches it. */
const MIN_CONTACT_LENGTH = 1;

/**
 * Narrows the parameter range of a segment to where one coordinate lies within [low, high].
 * A segment that keeps that coordinate fixed lies within only when it is strictly between the
 * two, so one running along a face of the box does not count.
 */
function clipAxis(
  start: number,
  delta: number,
  [low, high]: [number, number],
  [from, to]: [number, number]
): [number, number] | undefined {
  if (Math.abs(delta) <= SQUARE_EPS) {
    return start > low && start < high ? [from, to] : undefined;
  }
  const a = (low - start) / delta;
  const b = (high - start) / delta;
  const t0 = Math.max(from, Math.min(a, b));
  const t1 = Math.min(to, Math.max(a, b));
  return t0 <= t1 ? [t0, t1] : undefined;
}

/** Where the segment from `a` to `b` first enters `r`, when it runs on inside it. */
function firstContact(a: Point, b: Point, r: RectBounds): Point | undefined {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const alongX = clipAxis(a.x, dx, [r.left, r.right], [0, 1]);
  const inside = alongX && clipAxis(a.y, dy, [r.top, r.bottom], alongX);
  if (!inside || (inside[1] - inside[0]) * Math.hypot(dx, dy) < MIN_CONTACT_LENGTH) {
    return undefined;
  }
  return { x: a.x + inside[0] * dx, y: a.y + inside[0] * dy };
}

/** Cuts a route at the first point where one of its square segments enters `rect`. */
function cropTail(points: Point[], rect: RectBounds): Point[] {
  for (let i = 0; i < points.length - 1; i++) {
    const square =
      sameX(points[i], points[i + 1], SQUARE_EPS) || sameY(points[i], points[i + 1], SQUARE_EPS);
    const contact = square ? firstContact(points[i], points[i + 1], rect) : undefined;
    if (contact) {
      return [...points.slice(0, i + 1), contact];
    }
  }
  return points;
}

/** The nodes at the ends of an edge that is cropped; none for a self-loop or an edge to a group. */
function endsToCrop(edge: EndpointEdge, nodeByIdMap: Map<string, EndpointNode>) {
  const src = edge.start ? nodeByIdMap.get(edge.start) : undefined;
  const dst = edge.end ? nodeByIdMap.get(edge.end) : undefined;
  if (src === dst || src?.isGroup || dst?.isGroup) {
    return undefined;
  }
  return { src, dst };
}

/** Cuts each end of a route where it first meets the box of the node at that end. */
function cropEnds(points: Point[], src?: EndpointNode, dst?: EndpointNode): Point[] {
  const dstRect = dst ? endpointRectOf(dst) : undefined;
  const toEnd = dstRect ? cropTail(points, dstRect) : points;
  const srcRect = src ? endpointRectOf(src) : undefined;
  return srcRect ? cropTail([...toEnd].reverse(), srcRect).reverse() : toEnd;
}

/**
 * Ends every edge between two nodes where it first meets each node's box (its drawn extent
 * when the shape sets one), so an arrowhead is never drawn inside, and hidden by, the box.
 * Self-loops, edges to groups and slanted segments are left as they are.
 */
export function cropEdgeEndsToShapes(
  edges: EndpointEdge[],
  nodeByIdMap: Map<string, EndpointNode>
) {
  for (const candidate of edges) {
    const ends = candidate.isLayoutOnly ? undefined : endsToCrop(candidate, nodeByIdMap);
    const points = ends && candidate.points ? cropEnds(candidate.points, ends.src, ends.dst) : [];
    if (points.length >= 2) {
      candidate.points = points;
    }
  }
}
