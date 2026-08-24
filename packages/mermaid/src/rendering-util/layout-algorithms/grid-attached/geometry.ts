/**
 * Straight-line geometry the placement search needs: how far a footprint has to
 * move along one direction to clear an obstacle, and whether a route runs into
 * something it must not.
 *
 * Everything here is exact rather than bounding-box conservative on the obstacle
 * side, because a grid-like core has diagonal edges and a diagonal segment's
 * bounding box can be most of the drawing.
 */

import type { Point } from '../../../types.js';
import type { Bounds, Cardinal, Rect } from '../hola-faithful/model.js';
import { nodeBounds } from '../hola-faithful/model.js';

const EPSILON = 1e-6;

/** A straight obstacle: the part of a core edge that is actually drawn. */
export interface Segment {
  a: Point;
  b: Point;
}

interface AxisView {
  /** Coordinate the direction moves along, signed so that moving is increasing. */
  along: (p: Point) => number;
  /** The other coordinate. */
  across: (p: Point) => number;
  /** Leading and trailing edge of a footprint along the direction. */
  front: (b: Bounds) => number;
  back: (b: Bounds) => number;
  acrossMin: (b: Bounds) => number;
  acrossMax: (b: Bounds) => number;
}

function viewOf(direction: Cardinal): AxisView {
  switch (direction) {
    case 'S':
      return {
        along: (p) => p.y,
        across: (p) => p.x,
        front: (b) => b.minY,
        back: (b) => b.maxY,
        acrossMin: (b) => b.minX,
        acrossMax: (b) => b.maxX,
      };
    case 'N':
      return {
        along: (p) => -p.y,
        across: (p) => p.x,
        front: (b) => -b.maxY,
        back: (b) => -b.minY,
        acrossMin: (b) => b.minX,
        acrossMax: (b) => b.maxX,
      };
    case 'E':
      return {
        along: (p) => p.x,
        across: (p) => p.y,
        front: (b) => b.minX,
        back: (b) => b.maxX,
        acrossMin: (b) => b.minY,
        acrossMax: (b) => b.maxY,
      };
    case 'W':
      return {
        along: (p) => -p.x,
        across: (p) => p.y,
        front: (b) => -b.maxX,
        back: (b) => -b.minX,
        acrossMin: (b) => b.minY,
        acrossMax: (b) => b.maxY,
      };
  }
}

/** Unit step of a cardinal direction, with `y` growing downward. */
export function stepOf(direction: Cardinal): Point {
  switch (direction) {
    case 'S':
      return { x: 0, y: 1 };
    case 'N':
      return { x: 0, y: -1 };
    case 'E':
      return { x: 1, y: 0 };
    case 'W':
      return { x: -1, y: 0 };
  }
}

/**
 * How far `footprint` must move along `direction` to leave `obstacle` behind,
 * with `clearance` to spare. Zero when the two already miss each other — which
 * they do as soon as they are separated across the direction, so a tree beside an
 * obstacle is never pushed past it.
 */
export function pushPastRect(
  footprint: Bounds,
  obstacle: Bounds,
  direction: Cardinal,
  clearance: number
): number {
  const view = viewOf(direction);
  if (
    view.acrossMax(obstacle) + clearance <= view.acrossMin(footprint) + EPSILON ||
    view.acrossMin(obstacle) - clearance >= view.acrossMax(footprint) - EPSILON
  ) {
    return 0;
  }
  return Math.max(0, view.back(obstacle) + clearance - view.front(footprint));
}

/**
 * The same, for a straight segment. Only the part of the segment that lies within
 * the footprint's cross-direction band counts, so a long diagonal edge passing
 * well to one side pushes nothing.
 */
export function pushPastSegment(
  footprint: Bounds,
  segment: Segment,
  direction: Cardinal,
  clearance: number
): number {
  const view = viewOf(direction);
  const band = clipToBand(
    segment,
    view,
    view.acrossMin(footprint) - clearance,
    view.acrossMax(footprint) + clearance
  );
  if (!band) {
    return 0;
  }
  const behind = Math.max(view.along(band.a), view.along(band.b));
  return Math.max(0, behind + clearance - view.front(footprint));
}

/** The part of a segment whose across-coordinate lies in `[low, high]`. */
function clipToBand(
  segment: Segment,
  view: AxisView,
  low: number,
  high: number
): Segment | undefined {
  const a = view.across(segment.a);
  const b = view.across(segment.b);

  if (Math.abs(b - a) < EPSILON) {
    return a >= low - EPSILON && a <= high + EPSILON ? segment : undefined;
  }

  let tMin = 0;
  let tMax = 1;
  const enter = (low - a) / (b - a);
  const exit = (high - a) / (b - a);
  tMin = Math.max(tMin, Math.min(enter, exit));
  tMax = Math.min(tMax, Math.max(enter, exit));
  if (tMin > tMax + EPSILON) {
    return undefined;
  }

  const at = (t: number): Point => ({
    x: segment.a.x + t * (segment.b.x - segment.a.x),
    y: segment.a.y + t * (segment.b.y - segment.a.y),
  });
  return { a: at(tMin), b: at(tMax) };
}

/** Does a polyline pass through the interior of a rectangle? */
export function polylineHitsRect(points: Point[], rect: Rect, clearance = 0): boolean {
  return polylineHitsBounds(points, inflate(nodeBounds(rect), clearance));
}

export function polylineHitsBounds(points: Point[], bounds: Bounds): boolean {
  for (let i = 1; i < points.length; i++) {
    if (segmentHitsBounds({ a: points[i - 1], b: points[i] }, bounds)) {
      return true;
    }
  }
  return false;
}

/** Do a polyline and a straight segment cross? */
export function polylineCrossesSegment(points: Point[], segment: Segment): boolean {
  for (let i = 1; i < points.length; i++) {
    if (segmentsCross({ a: points[i - 1], b: points[i] }, segment)) {
      return true;
    }
  }
  return false;
}

function inflate(bounds: Bounds, amount: number): Bounds {
  return {
    minX: bounds.minX - amount,
    minY: bounds.minY - amount,
    maxX: bounds.maxX + amount,
    maxY: bounds.maxY + amount,
  };
}

/** Liang–Barsky: does the segment share any interior point with the box? */
function segmentHitsBounds(segment: Segment, bounds: Bounds): boolean {
  let tMin = 0;
  let tMax = 1;
  const dx = segment.b.x - segment.a.x;
  const dy = segment.b.y - segment.a.y;

  const clip = (delta: number, from: number, low: number, high: number): boolean => {
    if (Math.abs(delta) < EPSILON) {
      return from > low + EPSILON && from < high - EPSILON;
    }
    const first = (low - from) / delta;
    const second = (high - from) / delta;
    tMin = Math.max(tMin, Math.min(first, second));
    tMax = Math.min(tMax, Math.max(first, second));
    return tMin < tMax - EPSILON;
  };

  return (
    clip(dx, segment.a.x, bounds.minX, bounds.maxX) &&
    clip(dy, segment.a.y, bounds.minY, bounds.maxY) &&
    tMin < tMax - EPSILON
  );
}

/** Proper crossing: a shared point strictly interior to both segments. */
function segmentsCross(first: Segment, second: Segment): boolean {
  const r = { x: first.b.x - first.a.x, y: first.b.y - first.a.y };
  const s = { x: second.b.x - second.a.x, y: second.b.y - second.a.y };
  const denominator = r.x * s.y - r.y * s.x;
  if (Math.abs(denominator) < EPSILON) {
    return false;
  }
  const d = { x: second.a.x - first.a.x, y: second.a.y - first.a.y };
  const t = (d.x * s.y - d.y * s.x) / denominator;
  const u = (d.x * r.y - d.y * r.x) / denominator;
  return t > EPSILON && t < 1 - EPSILON && u > EPSILON && u < 1 - EPSILON;
}
