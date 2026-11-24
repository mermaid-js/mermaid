import type { LayoutData } from '../../../types.js';
import { EDGE_ROUTING } from '../config.js';

export interface Pt {
  x: number;
  y: number;
}

/**
 * The gap a reader can see between two strokes: the arrowhead gap plus the stroke width.
 * A bend closer than this to another route reads as touching it.
 */
export const VISIBLE_ROUTE_GAP = EDGE_ROUTING.ARROWHEAD_GAP + EDGE_ROUTING.EDGE_STROKE_WIDTH;

export const distance = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);

export function distanceToSegment(p: Pt, a: Pt, b: Pt): number {
  const lengthSquared = (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
  const along =
    lengthSquared === 0
      ? 0
      : Math.max(
          0,
          Math.min(1, ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / lengthSquared)
        );
  return distance(p, { x: a.x + along * (b.x - a.x), y: a.y + along * (b.y - a.y) });
}

export const distinct = (points: Pt[]) =>
  points.filter((p, i) => i === 0 || distance(p, points[i - 1]) > 0);

/** The points where a route turns. */
export function bends(points: Pt[]): Pt[] {
  const path = distinct(points);
  return path.slice(1, -1).filter((p, i) => {
    const [before, after] = [path[i], path[i + 2]];
    return (p.x - before.x) * (after.y - p.y) !== (p.y - before.y) * (after.x - p.x);
  });
}

/** Every place where the corner of one route lies within the visible gap of another route. */
export function routeTouches(layout: LayoutData): string[] {
  const routed = layout.edges.filter((e) => e.points?.length);
  const touching: string[] = [];
  for (const edge of routed) {
    for (const other of routed.filter((o) => o !== edge)) {
      const path = distinct(other.points!);
      for (const bend of bends(edge.points!)) {
        const near = path
          .slice(1)
          .some((p, i) => distanceToSegment(bend, path[i], p) < VISIBLE_ROUTE_GAP);
        if (near) {
          touching.push(
            `${edge.id} turns at (${bend.x.toFixed(1)}, ${bend.y.toFixed(1)}) on ${other.id}`
          );
        }
      }
    }
  }
  return touching;
}
