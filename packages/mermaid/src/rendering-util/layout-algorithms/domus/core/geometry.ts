import type { Point, PortSide, Rect } from '../types.js';
import { clamp } from './helpers.js';

/**
 * Shared orthogonal-scoped geometry helpers.
 *
 * Keep these in domus/core to avoid impacting other layout algorithms.
 * Only extract helpers that are pure and behavior-stable across call sites.
 */

export function axisCoordForSide(p: Point, side: PortSide): number {
  return side === 'E' || side === 'W' ? p.y : p.x;
}

export function computeBoundaryPortAtT(r: Rect, side: PortSide, t: number): Point {
  const tt = clamp(t, 0, 1);
  switch (side) {
    case 'E':
      return { x: r.right, y: r.top + tt * (r.bottom - r.top) };
    case 'W':
      return { x: r.left, y: r.top + tt * (r.bottom - r.top) };
    case 'N':
      return { x: r.left + tt * (r.right - r.left), y: r.top };
    case 'S':
      return { x: r.left + tt * (r.right - r.left), y: r.bottom };
  }
}

export function sideOutDirUnit(side: PortSide): Point {
  switch (side) {
    case 'E':
      return { x: 1, y: 0 };
    case 'W':
      return { x: -1, y: 0 };
    case 'N':
      return { x: 0, y: -1 };
    case 'S':
      return { x: 0, y: 1 };
  }
}

export function dot(a: Point, b: Point): number {
  return a.x * b.x + a.y * b.y;
}

export function normalizedTForSide(p: Point, r: Rect, side: PortSide): number {
  const w = Math.max(1e-9, r.right - r.left);
  const h = Math.max(1e-9, r.bottom - r.top);
  if (side === 'E' || side === 'W') {
    return clamp((p.y - r.top) / h, 0, 1);
  }
  return clamp((p.x - r.left) / w, 0, 1);
}

export function determineSideOnRect(p: Point, r: Rect): PortSide {
  const dxL = Math.abs(p.x - r.left);
  const dxR = Math.abs(p.x - r.right);
  const dyT = Math.abs(p.y - r.top);
  const dyB = Math.abs(p.y - r.bottom);
  const best = Math.min(dxL, dxR, dyT, dyB);
  if (best === dxL) {
    return 'W';
  }
  if (best === dxR) {
    return 'E';
  }
  if (best === dyT) {
    return 'N';
  }
  return 'S';
}

export function intersectRectBoundary(r: Rect, target: Point): Point {
  const cx = r.cx;
  const cy = r.cy;
  const dx = target.x - cx;
  const dy = target.y - cy;
  if (Math.abs(dx) < 1e-9 && Math.abs(dy) < 1e-9) {
    return { x: cx, y: cy };
  }

  interface Hit {
    t: number;
    x: number;
    y: number;
  }
  const hits: Hit[] = [];
  if (Math.abs(dx) > 1e-9) {
    // left
    let t = (r.left - cx) / dx;
    if (t > 0) {
      const y = cy + t * dy;
      if (y >= r.top - 1e-9 && y <= r.bottom + 1e-9) {
        hits.push({ t, x: r.left, y });
      }
    }
    // right
    t = (r.right - cx) / dx;
    if (t > 0) {
      const y = cy + t * dy;
      if (y >= r.top - 1e-9 && y <= r.bottom + 1e-9) {
        hits.push({ t, x: r.right, y });
      }
    }
  }
  if (Math.abs(dy) > 1e-9) {
    // top
    let t = (r.top - cy) / dy;
    if (t > 0) {
      const x = cx + t * dx;
      if (x >= r.left - 1e-9 && x <= r.right + 1e-9) {
        hits.push({ t, x, y: r.top });
      }
    }
    // bottom
    t = (r.bottom - cy) / dy;
    if (t > 0) {
      const x = cx + t * dx;
      if (x >= r.left - 1e-9 && x <= r.right + 1e-9) {
        hits.push({ t, x, y: r.bottom });
      }
    }
  }
  hits.sort((a, b) => a.t - b.t);
  return hits.length ? { x: hits[0].x, y: hits[0].y } : { x: cx, y: cy };
}

export function projectOtherCenterToSide(r: Rect, otherCenter: Point, side: PortSide): Point {
  if (side === 'E') {
    return { x: r.right, y: clamp(otherCenter.y, r.top, r.bottom) };
  }
  if (side === 'W') {
    return { x: r.left, y: clamp(otherCenter.y, r.top, r.bottom) };
  }
  if (side === 'N') {
    return { x: clamp(otherCenter.x, r.left, r.right), y: r.top };
  }
  return { x: clamp(otherCenter.x, r.left, r.right), y: r.bottom };
}

export function antiZAdjustSide(
  baseSide: PortSide,
  hitOnBaseSide: Point,
  r: Rect,
  baryVec: Point
): PortSide {
  // Paper: if ray hits first/last quarter interval, reassign one endpoint so routing
  // can avoid tight Z-bends. We approximate by switching to a perpendicular side
  // pointing away from the global barycenter.
  const t = normalizedTForSide(hitOnBaseSide, r, baseSide);
  const inCornerQuartile = t <= 0.25 || t >= 0.75;
  if (!inCornerQuartile) {
    return baseSide;
  }

  const candidates: PortSide[] = baseSide === 'E' || baseSide === 'W' ? ['N', 'S'] : ['E', 'W'];
  candidates.sort(
    (a, b) =>
      dot(sideOutDirUnit(b), baryVec) - dot(sideOutDirUnit(a), baryVec) || a.localeCompare(b)
  );
  return candidates[0];
}

export function clipPolylineEndpointsToRects(
  points: Point[],
  startRect: Rect,
  endRect: Rect
): Point[] {
  if (!points || points.length < 2) {
    return points;
  }
  const pts = [...points];
  const startTarget = pts.length > 2 ? pts[1] : { x: endRect.cx, y: endRect.cy };
  const endTarget = pts.length > 2 ? pts[pts.length - 2] : { x: startRect.cx, y: startRect.cy };
  pts[0] = intersectRectBoundary(startRect, startTarget);
  pts[pts.length - 1] = intersectRectBoundary(endRect, endTarget);
  return pts;
}
