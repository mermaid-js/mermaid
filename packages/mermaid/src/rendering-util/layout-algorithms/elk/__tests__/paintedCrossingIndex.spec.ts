import { describe, expect, it } from 'vitest';
import {
  findUnbridgedPaintedCrossings,
  flattenElkPath,
  type PaintedEdge,
  type PaintedCrossing,
} from '../crossingFallback.js';
import type { Point } from '../../../rendering-elements/lineJump.js';
function referenceCrossings(edges: PaintedEdge[]): PaintedCrossing[] {
  const flattened = edges.map((edge) => ({ ...edge, sections: flattenElkPath(edge.d) }));
  const out: PaintedCrossing[] = [];
  for (let i = 0; i < flattened.length; i++) {
    for (let j = i + 1; j < flattened.length; j++) {
      const a = flattened[i],
        b = flattened[j];
      const points: Point[] = [];
      for (const aa of a.sections) {
        for (const bb of b.sections) {
          for (let k = 1; k < aa.length; k++) {
            for (let l = 1; l < bb.length; l++) {
              const p = aa[k - 1],
                q = aa[k],
                r = bb[l - 1],
                s = bb[l];
              if (
                Math.max(p.x, q.x) < Math.min(r.x, s.x) ||
                Math.max(r.x, s.x) < Math.min(p.x, q.x) ||
                Math.max(p.y, q.y) < Math.min(r.y, s.y) ||
                Math.max(r.y, s.y) < Math.min(p.y, q.y)
              ) {
                continue;
              }
              const dx = q.x - p.x,
                dy = q.y - p.y,
                ex = s.x - r.x,
                ey = s.y - r.y;
              const denominator = dx * ey - dy * ex;
              if (Math.abs(denominator) < 1e-7) {
                continue;
              }
              const t = ((r.x - p.x) * ey - (r.y - p.y) * ex) / denominator;
              const u = ((r.x - p.x) * dy - (r.y - p.y) * dx) / denominator;
              if (t < -1e-6 || t > 1 + 1e-6 || u < -1e-6 || u > 1 + 1e-6) {
                continue;
              }
              const point = { x: p.x + t * dx, y: p.y + t * dy };
              if (
                [aa[0], aa[aa.length - 1], bb[0], bb[bb.length - 1]].some(
                  (endpoint) => Math.hypot(endpoint.x - point.x, endpoint.y - point.y) < 6
                )
              ) {
                continue;
              }
              if (
                a.hops.some(
                  (hop) =>
                    hop.other === b.id &&
                    Math.hypot(hop.x - point.x, hop.y - point.y) <= hop.radius + 1
                ) ||
                b.hops.some(
                  (hop) =>
                    hop.other === a.id &&
                    Math.hypot(hop.x - point.x, hop.y - point.y) <= hop.radius + 1
                )
              ) {
                continue;
              }
              if (points.some((p) => Math.hypot(p.x - point.x, p.y - point.y) < 1)) {
                continue;
              }
              points.push(point);
            }
          }
        }
      }
      for (const point of points) {
        out.push({ a: a.id, b: b.id, point });
      }
    }
  }
  return out;
}

describe('painted crossing spatial index', () => {
  it('matches brute force over deterministic dense, negative and grid-boundary cases', () => {
    let seed = 537;
    const random = () => {
      seed = (1664525 * seed + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    const canonical = (rows: PaintedCrossing[]) =>
      rows.map((r) => `${r.a}/${r.b}/${r.point.x.toFixed(3)}/${r.point.y.toFixed(3)}`).sort();
    for (let test = 0; test < 40; test++) {
      const edges: PaintedEdge[] = Array.from({ length: 24 }, (_, i) => {
        const x = Math.floor(random() * 24 - 12) * 128,
          y = Math.floor(random() * 24 - 12) * 128;
        const dx = Math.floor(random() * 20 - 10) * 128,
          dy = Math.floor(random() * 20 - 10) * 128;
        return { id: String(i), d: `M${x},${y} L${x + dx},${y} L${x + dx},${y + dy}`, hops: [] };
      });
      expect(canonical(findUnbridgedPaintedCrossings(edges))).toEqual(
        canonical(referenceCrossings(edges))
      );
    }
  });
  it('matches brute force for rounded corners, arcs and separate gap subpaths', () => {
    const edges: PaintedEdge[] = [
      { id: 'a', d: 'M-500,50 L40,50 Q50,50 50,60 L50,500', hops: [] },
      { id: 'b', d: 'M45,-500 L45,500', hops: [] },
      {
        id: 'c',
        d: 'M0,60 L44,60 A6,6 0 0 1 56,60 L500,60',
        hops: [{ other: 'd', x: 50, y: 60, radius: 6 }],
      },
      { id: 'd', d: 'M50,-500 L50,500', hops: [] },
      { id: 'e', d: 'M-200,200 L44,200 M56,200 L500,200', hops: [] },
    ];
    const canonical = (rows: PaintedCrossing[]) =>
      rows.map((r) => `${r.a}/${r.b}/${r.point.x.toFixed(3)}/${r.point.y.toFixed(3)}`).sort();
    expect(canonical(findUnbridgedPaintedCrossings(edges))).toEqual(
      canonical(referenceCrossings(edges))
    );
  });
});
