/**
 * Shared utility functions for the orthogonal routing pipeline.
 *
 * This module contains geometry helpers, distance calculations, and other
 * low-level utilities used across the routing stages.
 */
import type { Node } from '../../types.js';
import type { Point, Rect, PortSide } from './types.js';

/**
 * Create a Rect from a Node's x, y, width, height properties.
 * The node's x, y are assumed to be the center coordinates.
 */
export function rectForNode(node: Node): Rect {
  const cx = node.x ?? 0;
  const cy = node.y ?? 0;
  const w = node.width ?? 40;
  const h = node.height ?? 40;
  return {
    cx,
    cy,
    left: cx - w / 2,
    right: cx + w / 2,
    top: cy - h / 2,
    bottom: cy + h / 2,
  };
}

export function terminalMarkerClearanceRect(
  points: Point[],
  terminal: 'start' | 'end',
  length: number,
  halfWidth: number,
  tolerance = 0
): Rect | null {
  if (points.length < 2) {
    return null;
  }

  const tip = terminal === 'end' ? points[points.length - 1] : points[0];
  const inner = terminal === 'end' ? points[points.length - 2] : points[1];
  const dx = inner.x - tip.x;
  const dy = inner.y - tip.y;

  if (Math.abs(dx) <= tolerance && Math.abs(dy) <= tolerance) {
    return null;
  }
  if (Math.abs(dy) <= tolerance) {
    const innerX = tip.x + Math.sign(dx) * length;
    const left = Math.min(tip.x, innerX);
    const right = Math.max(tip.x, innerX);
    return {
      cx: (left + right) / 2,
      cy: tip.y,
      left,
      right,
      top: tip.y - halfWidth,
      bottom: tip.y + halfWidth,
    };
  }
  if (Math.abs(dx) <= tolerance) {
    const innerY = tip.y + Math.sign(dy) * length;
    const top = Math.min(tip.y, innerY);
    const bottom = Math.max(tip.y, innerY);
    return {
      cx: tip.x,
      cy: (top + bottom) / 2,
      left: tip.x - halfWidth,
      right: tip.x + halfWidth,
      top,
      bottom,
    };
  }
  return null;
}

/**
 * Check if a point is strictly inside a rectangle (not on the boundary).
 */
export function pointInRectInterior(p: Point, rect: Rect): boolean {
  return p.x > rect.left && p.x < rect.right && p.y > rect.top && p.y < rect.bottom;
}

/**
 * Approximate floating-point equality check.
 */
export function approxEqual(a: number, b: number, tol = 1e-6): boolean {
  return Math.abs(a - b) <= tol;
}

/**
 * Calculate the total Manhattan length of a polyline.
 */
export function manhattanLength(points: Point[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    total += Math.abs(b.x - a.x) + Math.abs(b.y - a.y);
  }
  return total;
}

/**
 * Calculate the Manhattan distance between two points.
 */
export function manhattanDistance(a: Point, b: Point): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

/**
 * Count the number of bends (direction changes) in a polyline.
 */
export function bendCount(points: Point[]): number {
  let bends = 0;
  for (let i = 2; i < points.length; i++) {
    const a = points[i - 2];
    const b = points[i - 1];
    const c = points[i];
    const dxAB = b.x - a.x;
    const dyAB = b.y - a.y;
    const dxBC = c.x - b.x;
    const dyBC = c.y - b.y;
    const isHorizAB = !approxEqual(dxAB, 0) && approxEqual(dyAB, 0);
    const isVertAB = approxEqual(dxAB, 0) && !approxEqual(dyAB, 0);
    const isHorizBC = !approxEqual(dxBC, 0) && approxEqual(dyBC, 0);
    const isVertBC = approxEqual(dxBC, 0) && !approxEqual(dyBC, 0);
    if ((isHorizAB && isVertBC) || (isVertAB && isHorizBC)) {
      bends++;
    }
  }
  return bends;
}

/**
 * Check if an axis-aligned segment intersects a rectangle's interior.
 * Non-orthogonal segments are ignored (return false).
 */
export function segmentIntersectsRectInterior(a: Point, b: Point, rect: Rect): boolean {
  // We only care about axis-aligned segments; non-orthogonal segments are ignored
  // in this helper since the pipeline only produces orthogonal polylines.
  if (a.x === b.x && a.y === b.y) {
    return false;
  }

  if (a.y === b.y) {
    // Horizontal segment. Treat segments that run exactly along the top/bottom
    // boundary of the rectangle as collisions as well, so that edges do not
    // visually "run under" or "on" other nodes.
    const y = a.y;
    const x1 = Math.min(a.x, b.x);
    const x2 = Math.max(a.x, b.x);
    const crossesVertically = y >= rect.top && y <= rect.bottom;
    const overlapsHorizontally = Math.max(x1, rect.left) < Math.min(x2, rect.right);
    return crossesVertically && overlapsHorizontally;
  }

  if (a.x === b.x) {
    // Vertical segment. Similarly, segments that run exactly along the
    // left/right boundary of the rectangle are treated as collisions.
    const x = a.x;
    const y1 = Math.min(a.y, b.y);
    const y2 = Math.max(a.y, b.y);
    const crossesHorizontally = x >= rect.left && x <= rect.right;
    const overlapsVertically = Math.max(y1, rect.top) < Math.min(y2, rect.bottom);
    return crossesHorizontally && overlapsVertically;
  }

  return false;
}

/**
 * Check if a polyline crosses a single rectangle.
 */
export function polylineIntersectsRect(points: Point[], rect: Rect): boolean {
  for (let i = 1; i < points.length; i++) {
    if (segmentIntersectsRectInterior(points[i - 1], points[i], rect)) {
      return true;
    }
  }
  return false;
}

/**
 * Check if a polyline crosses an array of obstacle rectangles.
 */
export function polylineIntersectsRects(points: Point[], rects: Rect[]): boolean {
  for (const rect of rects) {
    if (polylineIntersectsRect(points, rect)) {
      return true;
    }
  }
  return false;
}

export function pointInsideAnyRectInterior(p: Point, rects: Rect[]): boolean {
  for (const r of rects) {
    if (pointInRectInterior(p, r)) {
      return true;
    }
  }
  return false;
}

export function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/**
 * Remove duplicates from a sorted number array.
 */
export function uniqSorted(numbers: number[]): number[] {
  const s = new Set<number>();
  for (const n of numbers) {
    s.add(n);
  }
  return [...s].sort((a, b) => a - b);
}

/**
 * Compute the boundary port point for a side of a rectangle.
 */
export function computeBoundaryPort(rect: Rect, side: PortSide): Point {
  switch (side) {
    case 'E':
      return { x: rect.right, y: rect.cy };
    case 'W':
      return { x: rect.left, y: rect.cy };
    case 'N':
      return { x: rect.cx, y: rect.top };
    case 'S':
      return { x: rect.cx, y: rect.bottom };
  }
}
