import {
  orthogonalizePolyline,
  pointInsideRect,
  rectOfNodeBounds,
  samePoint,
  sameX,
  sameY,
  simplifyPolyline,
} from './geometry.js';
import type { Point, RectBounds } from './geometry.js';

const EPS = 1e-3;
const INSIDE_EPS = 0.5;

type NodeRect = RectBounds;

type BorderSide = 'top' | 'bottom' | 'left' | 'right';

interface EndpointEdge {
  isLayoutOnly?: boolean;
  points?: Point[];
  start?: string;
  end?: string;
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

function firstDistinctAdjacent(points: Point[], endpointIndex: number, step: 1 | -1): Point {
  const endpoint = points[endpointIndex];
  for (let index = endpointIndex + step; index >= 0 && index < points.length; index += step) {
    const candidate = points[index];
    if (!samePoint(candidate, endpoint, EPS)) {
      return candidate;
    }
  }
  return points[endpointIndex + step];
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
    const snapped = snapEndpointToBoundary(firstDistinctAdjacent(next, 0, 1), next[0], srcRect);
    if (snapped !== next[0]) {
      next = [snapped, ...next.slice(1)];
    }
    next = collapseOwnBorderStub(next, srcRect, true);
  }
  if (dstRect) {
    const last = next.length - 1;
    const snapped = snapEndpointToBoundary(
      firstDistinctAdjacent(next, last, -1),
      next[last],
      dstRect,
      true
    );
    if (snapped !== next[last]) {
      next = [...next.slice(0, last), snapped];
    }
    next = collapseOwnBorderStub(next, dstRect, false);
  }
  return next;
}

export function prepareEdgeEndpointsForRenderer(edges: unknown[], nodeByIdMap: Map<string, any>) {
  for (const edge of edges) {
    const context = endpointContextFor(edge, nodeByIdMap, 3);
    if (!context) {
      continue;
    }

    const newPts = snapAndCollapseEndpoints(context.points, context.srcRect, context.dstRect);
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
