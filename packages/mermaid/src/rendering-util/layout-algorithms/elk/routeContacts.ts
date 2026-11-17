import type { P } from './geometry.js';

/** Two coordinates closer than this are one point. */
const SAME_POINT = 0.01;

const cross = (o: P, p: P, q: P) => (p.x - o.x) * (q.y - o.y) - (p.y - o.y) * (q.x - o.x);
const samePoint = (a: P, b: P) =>
  Math.abs(a.x - b.x) <= SAME_POINT && Math.abs(a.y - b.y) <= SAME_POINT;

/** Where `p` lies along `a`-`b`, as a share of its length; meaningful for `p` on its line. */
function along(a: P, b: P, p: P): number {
  const [dx, dy] = [b.x - a.x, b.y - a.y];
  return Math.abs(dx) >= Math.abs(dy) ? (p.x - a.x) / dx : (p.y - a.y) / dy;
}

/**
 * Where two segments touch, their ends included: one point where they meet or cross, or both
 * ends of the stretch they share when they run along one line.
 */
export function segmentContacts(a1: P, a2: P, b1: P, b2: P): P[] {
  const [d1, d2] = [cross(a1, a2, b1), cross(a1, a2, b2)];
  const [d3, d4] = [cross(b1, b2, a1), cross(b1, b2, a2)];
  if (d1 === 0 && d2 === 0) {
    if (samePoint(a1, a2)) {
      return [];
    }
    const ts = [along(a1, a2, b1), along(a1, a2, b2)];
    const [from, to] = [Math.max(0, Math.min(...ts)), Math.min(1, Math.max(...ts))];
    if (from > to) {
      return [];
    }
    const at = (t: number) => ({ x: a1.x + (a2.x - a1.x) * t, y: a1.y + (a2.y - a1.y) * t });
    return from === to ? [at(from)] : [at(from), at(to)];
  }
  if (Math.sign(d1) * Math.sign(d2) > 0 || Math.sign(d3) * Math.sign(d4) > 0) {
    return [];
  }
  const t = d3 / (d3 - d4);
  return [{ x: a1.x + (a2.x - a1.x) * t, y: a1.y + (a2.y - a1.y) * t }];
}

function distinct(points: P[]): P[] {
  return points.filter((point, i) => points.findIndex((other) => samePoint(point, other)) === i);
}

const ends = (route: readonly P[]) => [route[0], route[route.length - 1]];

/**
 * The distinct points where two routes touch, cross or run along each other. A point where both
 * routes end is left out: two edges meeting at the node they share do not collide.
 */
export function routeContacts(a: readonly P[], b: readonly P[]): P[] {
  const contacts: P[] = [];
  for (let i = 0; i < a.length - 1; i++) {
    for (let j = 0; j < b.length - 1; j++) {
      contacts.push(...segmentContacts(a[i], a[i + 1], b[j], b[j + 1]));
    }
  }
  const shared = ends(a).filter((end) => ends(b).some((other) => samePoint(end, other)));
  return distinct(contacts).filter((point) => !shared.some((end) => samePoint(point, end)));
}

/**
 * How often a route runs into itself: each point where two of its segments that do not follow
 * one another touch, and each turn by which it doubles back along the segment it came by.
 */
export function selfContacts(route: readonly P[]): number {
  let contacts = 0;
  for (let i = 0; i < route.length - 1; i++) {
    const next = route[i + 2];
    if (next && cross(route[i], route[i + 1], next) === 0) {
      const back =
        (route[i + 1].x - route[i].x) * (next.x - route[i + 1].x) +
        (route[i + 1].y - route[i].y) * (next.y - route[i + 1].y);
      contacts += back < 0 ? 1 : 0;
    }
    for (let j = i + 2; j < route.length - 1; j++) {
      contacts += distinct(segmentContacts(route[i], route[i + 1], route[j], route[j + 1])).length;
    }
  }
  return contacts;
}
