import type { Node } from '../../../types.js';
import type { Point, Rect } from '../types.js';
import { approxEqual, clamp, rectForNode } from '../core/helpers.js';

export function routeLShapeBetweenPorts(a: Point, b: Point): Point[] {
  if (approxEqual(a.x, b.x) || approxEqual(a.y, b.y)) {
    return [a, b];
  }
  // Deterministic: prefer vertical-then-horizontal (keeps x fixed from start).
  return [a, { x: a.x, y: b.y }, b];
}

function pointInRectInclusive(p: Point, r: Rect, eps = 1e-6): boolean {
  return p.x >= r.left - eps && p.x <= r.right + eps && p.y >= r.top - eps && p.y <= r.bottom + eps;
}

function segmentWithinRectInclusive(a: Point, b: Point, r: Rect, eps = 1e-6): boolean {
  if (!approxEqual(a.x, b.x) && !approxEqual(a.y, b.y)) {
    // non-orthogonal segment: reject
    return false;
  }
  if (approxEqual(a.x, b.x)) {
    const x = a.x;
    const y1 = Math.min(a.y, b.y);
    const y2 = Math.max(a.y, b.y);
    return x >= r.left - eps && x <= r.right + eps && y1 >= r.top - eps && y2 <= r.bottom + eps;
  }
  const y = a.y;
  const x1 = Math.min(a.x, b.x);
  const x2 = Math.max(a.x, b.x);
  return y >= r.top - eps && y <= r.bottom + eps && x1 >= r.left - eps && x2 <= r.right + eps;
}

export function polylineWithinRectInclusive(points: Point[], r: Rect, eps = 1e-6): boolean {
  if (!points.length) {
    return true;
  }
  for (const p of points) {
    if (!pointInRectInclusive(p, r, eps)) {
      return false;
    }
  }
  for (let i = 0; i < points.length - 1; i++) {
    if (!segmentWithinRectInclusive(points[i], points[i + 1], r, eps)) {
      return false;
    }
  }
  return true;
}

function intersectRects(a: Rect, b: Rect): Rect | null {
  const left = Math.max(a.left, b.left);
  const right = Math.min(a.right, b.right);
  const top = Math.max(a.top, b.top);
  const bottom = Math.min(a.bottom, b.bottom);
  if (right < left || bottom < top) {
    return null;
  }
  return {
    left,
    right,
    top,
    bottom,
    cx: (left + right) / 2,
    cy: (top + bottom) / 2,
  };
}

export function allowedRectForInsideGroups(
  inside: Set<string>,
  nodesById: Map<string, Node>
): Rect | null {
  let allowed: Rect | null = null;
  // Deterministic: intersect in id order.
  const ids = [...inside].sort((a, b) => a.localeCompare(b));
  for (const gid of ids) {
    const g = nodesById.get(gid);
    if (!g || !(g as any)?.isGroup) {
      continue;
    }
    const r = rectForNode(g);
    allowed = allowed ? intersectRects(allowed, r) : r;
    if (!allowed) {
      return null;
    }
  }
  return allowed;
}

export function lShapeWithinRect(a: Point, b: Point, r: Rect): Point[] {
  // If already aligned, the direct segment must fit (or we clamp).
  const aa: Point = { x: clamp(a.x, r.left, r.right), y: clamp(a.y, r.top, r.bottom) };
  const bb: Point = { x: clamp(b.x, r.left, r.right), y: clamp(b.y, r.top, r.bottom) };
  if (approxEqual(aa.x, bb.x) || approxEqual(aa.y, bb.y)) {
    return [aa, bb];
  }

  // Try vertical-then-horizontal via (aa.x, bb.y).
  const v1: Point = { x: aa.x, y: bb.y };
  const cand1 = [aa, v1, bb];
  if (polylineWithinRectInclusive(cand1, r)) {
    return cand1;
  }

  // Try horizontal-then-vertical via (bb.x, aa.y).
  const v2: Point = { x: bb.x, y: aa.y };
  const cand2 = [aa, v2, bb];
  if (polylineWithinRectInclusive(cand2, r)) {
    return cand2;
  }

  // Final fallback: clamp a via point to rectangle center line.
  const via: Point = { x: aa.x, y: clamp((aa.y + bb.y) / 2, r.top, r.bottom) };
  const cand3 = [aa, via, { x: bb.x, y: via.y }, bb];
  return cand3;
}
