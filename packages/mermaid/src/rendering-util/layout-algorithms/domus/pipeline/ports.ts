import type { Point, Rect, PortSide } from '../types.js';
import { approxEqual, clamp } from '../core/helpers.js';

export function inferPortSideFromPointOnRect(p: Point, r: Rect): PortSide | null {
  // Prefer the "boundary coordinate exact" comparisons first.
  if (approxEqual(p.x, r.left)) {
    return 'W';
  }
  if (approxEqual(p.x, r.right)) {
    return 'E';
  }
  if (approxEqual(p.y, r.top)) {
    return 'N';
  }
  if (approxEqual(p.y, r.bottom)) {
    return 'S';
  }
  return null;
}

export function snapPortForRoutingOnSide(
  rect: Rect,
  side: PortSide,
  port: Point,
  spacing: number
): Point {
  // Keep the boundary coordinate exact and snap only the along-the-side coordinate to the routing grid.
  const snapToGrid = (v: number): number => {
    if (spacing <= 0) {
      return Math.round(v);
    }
    return Math.round(v / spacing) * spacing;
  };
  switch (side) {
    case 'E':
      return { x: rect.right, y: clamp(snapToGrid(port.y), rect.top, rect.bottom) };
    case 'W':
      return { x: rect.left, y: clamp(snapToGrid(port.y), rect.top, rect.bottom) };
    case 'N':
      return { x: clamp(snapToGrid(port.x), rect.left, rect.right), y: rect.top };
    case 'S':
      return { x: clamp(snapToGrid(port.x), rect.left, rect.right), y: rect.bottom };
  }
}
