/**
 * Shape silhouettes, so a route ends on the node it points at.
 *
 * The layout works in rectangles: obstacles are bounding boxes and ports sit on
 * bounding-box sides. That is right for a `rect`, and visibly wrong for a
 * circle, diamond or hexagon — the edge stops on the box and floats in the gap
 * between the box and the shape.
 *
 * Mermaid gives every rendered node an `intersect(point)` function, installed by
 * the shape renderer during measurement, i.e. *before* the layout core runs. It
 * is a ray cast from the node centre towards `point`, so it cannot be asked
 * directly for "where is the boundary on the vertical line x = cx + 40" — every
 * centre ray passes through the centre. So it is used the other way round: cast
 * a fan of rays to recover the boundary as a polygon in node-local coordinates,
 * once per node, and answer every later question from that polygon.
 *
 * Two things are then possible:
 *
 *   - `silhouettePort` moves a port from the bounding-box side inwards along its
 *     own approach axis until it reaches the boundary. Moving along the approach
 *     axis is what keeps the terminal leg orthogonal — clipping with the raw
 *     centre ray would not.
 *   - `silhouetteBand` reports how much of a side is usable at all. A port near
 *     the corner of a circle's "top side" is geometrically on the boundary but
 *     grazes it tangentially, so bands are limited to the offsets where the
 *     shape still reaches close to its box.
 *
 * A node whose probes match its bounding box exactly gets no silhouette, and
 * every code path falls back to the plain rectangle behaviour. That is also what
 * happens on the DOM-free entry point used by DDLT and the unit tests, where
 * `intersect` does not exist.
 */

import type { Point, Rect, Side, Silhouette } from '../model.js';

export type { Silhouette };

/** Node fields this module needs; a subset of the Mermaid node. */
export interface IntersectableNode {
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  intersect?: (point: Point) => Point;
}

/** Rays used to recover the boundary. 5° steps resolve a hexagon's corners. */
const SILHOUETTE_RAYS = 72;

/** Directions probed to decide whether a shape is a plain rectangle. */
const RECT_PROBE_RAYS = 16;

/** A probe this far from the rectangle prediction means the shape is not one. */
const RECT_PROBE_TOLERANCE = 0.75;

/**
 * How far into the node a port may be pulled, as a fraction of the half-extent
 * of the side it sits on. Beyond this the approach grazes the boundary instead
 * of meeting it, so the offset is clamped instead.
 */
export const DEFAULT_MAX_INSET_FRACTION = 0.35;

/**
 * Recover the boundary polygon of a measured Mermaid node, or `undefined` when
 * the node is rectangular, unmeasured, or has no `intersect` function.
 */
export function sampleSilhouette(node: IntersectableNode): Silhouette | undefined {
  const width = node.width ?? 0;
  const height = node.height ?? 0;
  if (typeof node.intersect !== 'function' || width <= 0 || height <= 0) {
    return undefined;
  }

  // `intersect` closes over the node and reads `node.x`/`node.y`, so the fan has
  // to be cast around a known centre. Sample at the origin and restore.
  const savedX = node.x;
  const savedY = node.y;
  node.x = 0;
  node.y = 0;

  try {
    if (matchesRectangle(node, width, height)) {
      return undefined;
    }

    const points: Point[] = [];
    for (let i = 0; i < SILHOUETTE_RAYS; i++) {
      const angle = (2 * Math.PI * i) / SILHOUETTE_RAYS;
      const probe = castRay(node, angle, width, height);
      if (!probe) {
        return undefined;
      }
      points.push(probe);
    }
    return { points };
  } catch {
    // A shape whose intersect function cannot cope with a synthetic centre is
    // treated as rectangular rather than allowed to break the layout.
    return undefined;
  } finally {
    node.x = savedX;
    node.y = savedY;
  }
}

/**
 * Cast one ray from the origin. The target is placed well outside the node so
 * the ray direction, not the target distance, decides the result.
 */
function castRay(
  node: IntersectableNode,
  angle: number,
  width: number,
  height: number
): Point | undefined {
  const reach = 4 * (width + height);
  const target = { x: Math.cos(angle) * reach, y: Math.sin(angle) * reach };
  const hit = node.intersect!(target);
  if (!hit || !isFinite(hit.x) || !isFinite(hit.y)) {
    return undefined;
  }
  // Never trust a shape to stay inside its own measured box.
  return {
    x: clamp(hit.x, -width / 2, width / 2),
    y: clamp(hit.y, -height / 2, height / 2),
  };
}

function matchesRectangle(node: IntersectableNode, width: number, height: number): boolean {
  for (let i = 0; i < RECT_PROBE_RAYS; i++) {
    const angle = (2 * Math.PI * (i + 0.5)) / RECT_PROBE_RAYS;
    const probe = castRay(node, angle, width, height);
    if (!probe) {
      return false;
    }
    const expected = rectangleBoundary(angle, width, height);
    if (
      Math.abs(probe.x - expected.x) > RECT_PROBE_TOLERANCE ||
      Math.abs(probe.y - expected.y) > RECT_PROBE_TOLERANCE
    ) {
      return false;
    }
  }
  return true;
}

/** Where a ray at `angle` leaves a rectangle centred on the origin. */
function rectangleBoundary(angle: number, width: number, height: number): Point {
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const scale = Math.min(
    Math.abs(dx) < 1e-12 ? Infinity : halfWidth / Math.abs(dx),
    Math.abs(dy) < 1e-12 ? Infinity : halfHeight / Math.abs(dy)
  );
  return { x: dx * scale, y: dy * scale };
}

/** Is this side's offset measured along x? */
function sideIsHorizontal(side: Side): boolean {
  return side === 'top' || side === 'bottom';
}

/**
 * How far inside its bounding box the boundary sits, on the line through
 * `offset` on `side`. `undefined` when the shape does not reach that line at all.
 */
export function silhouetteInset(
  silhouette: Silhouette,
  rect: Rect,
  side: Side,
  offset: number
): number | undefined {
  const horizontal = sideIsHorizontal(side);
  const points = silhouette.points;
  // The far side of the shape along the approach axis, i.e. the first boundary
  // an approach from outside this side meets.
  let extreme: number | undefined;

  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    const from = horizontal ? a.x : a.y;
    const to = horizontal ? b.x : b.y;
    if ((from < offset && to < offset) || (from > offset && to > offset)) {
      continue;
    }
    const span = to - from;
    const t = Math.abs(span) < 1e-12 ? 0 : (offset - from) / span;
    const across = horizontal ? a.y + (b.y - a.y) * t : a.x + (b.x - a.x) * t;
    if (extreme === undefined) {
      extreme = across;
      continue;
    }
    extreme =
      side === 'top' || side === 'left' ? Math.min(extreme, across) : Math.max(extreme, across);
  }

  if (extreme === undefined) {
    return undefined;
  }

  switch (side) {
    case 'top':
      return Math.max(0, extreme + rect.height / 2);
    case 'bottom':
      return Math.max(0, rect.height / 2 - extreme);
    case 'left':
      return Math.max(0, extreme + rect.width / 2);
    case 'right':
      return Math.max(0, rect.width / 2 - extreme);
  }
}

/**
 * The offsets along `side` where a port still meets the boundary squarely, as a
 * signed range about the side's centre. Symmetric shapes give a symmetric band;
 * an asymmetric one is reported as it is.
 */
export function silhouetteBand(
  silhouette: Silhouette,
  rect: Rect,
  side: Side,
  maxInsetFraction = DEFAULT_MAX_INSET_FRACTION
): { min: number; max: number } {
  const halfAlong = sideIsHorizontal(side) ? rect.width / 2 : rect.height / 2;
  const halfAcross = sideIsHorizontal(side) ? rect.height / 2 : rect.width / 2;
  const limit = halfAcross * maxInsetFraction;

  // Walk outwards from the centre in both directions and stop at the first
  // offset whose approach would graze rather than meet.
  const steps = 24;
  let min = 0;
  let max = 0;
  for (let i = 1; i <= steps; i++) {
    const offset = (halfAlong * i) / steps;
    const positive = silhouetteInset(silhouette, rect, side, offset);
    if (positive !== undefined && positive <= limit) {
      max = offset;
    } else {
      break;
    }
  }
  for (let i = 1; i <= steps; i++) {
    const offset = (-halfAlong * i) / steps;
    const negative = silhouetteInset(silhouette, rect, side, offset);
    if (negative !== undefined && negative <= limit) {
      min = offset;
    } else {
      break;
    }
  }
  return { min, max };
}

/**
 * The point an edge should attach to: `offset` along `side`, clamped into the
 * usable band, then moved inwards along the approach axis onto the boundary.
 */
export function silhouettePort(
  silhouette: Silhouette,
  rect: Rect,
  side: Side,
  offset: number,
  maxInsetFraction = DEFAULT_MAX_INSET_FRACTION
): Point {
  const band = silhouetteBand(silhouette, rect, side, maxInsetFraction);
  const clamped = clamp(offset, band.min, band.max);
  const inset = silhouetteInset(silhouette, rect, side, clamped) ?? 0;

  switch (side) {
    case 'top':
      return { x: rect.x + clamped, y: rect.y - rect.height / 2 + inset };
    case 'bottom':
      return { x: rect.x + clamped, y: rect.y + rect.height / 2 - inset };
    case 'left':
      return { x: rect.x - rect.width / 2 + inset, y: rect.y + clamped };
    case 'right':
      return { x: rect.x + rect.width / 2 - inset, y: rect.y + clamped };
  }
}

function clamp(value: number, low: number, high: number): number {
  return Math.max(low, Math.min(high, value));
}
