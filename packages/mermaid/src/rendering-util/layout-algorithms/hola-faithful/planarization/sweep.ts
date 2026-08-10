/**
 * Axis-aligned crossing detection by sweep (guide §16.3).
 *
 * A vertical sweep line moves left to right. Horizontal segments are inserted
 * when the line reaches their left end and removed at their right end; each
 * vertical segment queries the active set for horizontals whose y lies inside
 * its span. Only *proper* crossings are reported — two segments that merely
 * share an endpoint, or that touch at a T-junction, are not crossings.
 */

import type { Point } from '../model.js';

export interface AxisSegment {
  id: string;
  a: Point;
  b: Point;
}

export interface Crossing {
  horizontalId: string;
  verticalId: string;
  point: Point;
}

const EPSILON = 1e-7;

export function isHorizontalSegment(segment: AxisSegment): boolean {
  return Math.abs(segment.a.y - segment.b.y) < EPSILON;
}

export function isVerticalSegment(segment: AxisSegment): boolean {
  return Math.abs(segment.a.x - segment.b.x) < EPSILON;
}

interface Event {
  x: number;
  kind: 'insert' | 'query' | 'remove';
  segment: AxisSegment;
}

export function findCrossings(segments: AxisSegment[]): Crossing[] {
  const horizontals: AxisSegment[] = [];
  const verticals: AxisSegment[] = [];
  for (const segment of segments) {
    if (isHorizontalSegment(segment) && !isVerticalSegment(segment)) {
      horizontals.push(segment);
    } else if (isVerticalSegment(segment)) {
      verticals.push(segment);
    }
  }

  const events: Event[] = [];
  for (const h of horizontals) {
    events.push({ x: Math.min(h.a.x, h.b.x), kind: 'insert', segment: h });
    events.push({ x: Math.max(h.a.x, h.b.x), kind: 'remove', segment: h });
  }
  for (const v of verticals) {
    events.push({ x: v.a.x, kind: 'query', segment: v });
  }

  // Insert before query before remove at the same x, so a vertical touching a
  // horizontal's endpoint is still examined (and then rejected as improper).
  const order = { insert: 0, query: 1, remove: 2 };
  events.sort((p, q) => (p.x !== q.x ? p.x - q.x : order[p.kind] - order[q.kind]));

  const active = new Set<AxisSegment>();
  const crossings: Crossing[] = [];

  for (const event of events) {
    if (event.kind === 'insert') {
      active.add(event.segment);
      continue;
    }
    if (event.kind === 'remove') {
      active.delete(event.segment);
      continue;
    }

    const v = event.segment;
    const vLow = Math.min(v.a.y, v.b.y);
    const vHigh = Math.max(v.a.y, v.b.y);
    const x = v.a.x;

    for (const h of active) {
      const y = h.a.y;
      const hLow = Math.min(h.a.x, h.b.x);
      const hHigh = Math.max(h.a.x, h.b.x);
      const properOnHorizontal = x > hLow + EPSILON && x < hHigh - EPSILON;
      const properOnVertical = y > vLow + EPSILON && y < vHigh - EPSILON;
      if (properOnHorizontal && properOnVertical) {
        crossings.push({ horizontalId: h.id, verticalId: v.id, point: { x, y } });
      }
    }
  }

  return crossings.sort((a, b) =>
    a.point.x !== b.point.x ? a.point.x - b.point.x : a.point.y - b.point.y
  );
}
