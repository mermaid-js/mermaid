import { describe, it, expect } from 'vitest';
import {
  intersection,
  ensureTrulyOutside,
  makeInsidePoint,
  tryNodeIntersect,
  replaceEndpoint,
  type RectLike,
  type P,
} from '../geometry.js';

const approx = (a: number, b: number, eps = 1e-6) => Math.abs(a - b) < eps;

describe('geometry helpers', () => {
  it('intersection: vertical approach hits bottom border', () => {
    const rect: RectLike = { x: 0, y: 0, width: 100, height: 50 };
    const h = rect.height / 2; // 25
    const outside: P = { x: 0, y: 100 };
    const inside: P = { x: 0, y: 0 };
    const res = intersection(rect, outside, inside);
    expect(approx(res.x, 0)).toBe(true);
    expect(approx(res.y, h)).toBe(true);
  });

  it('ensureTrulyOutside nudges near-boundary point outward', () => {
    const rect: RectLike = { x: 0, y: 0, width: 100, height: 50 };
    // near bottom boundary (y ~ h)
    const near: P = { x: 0, y: rect.height / 2 - 0.2 };
    const out = ensureTrulyOutside(rect, near, 10);
    expect(out.y).toBeGreaterThan(rect.height / 2);
  });

  it('makeInsidePoint keeps x for vertical and y from center', () => {
    const rect: RectLike = { x: 10, y: 5, width: 100, height: 50 };
    const outside: P = { x: 10, y: 40 };
    const center: P = { x: 99, y: -123 }; // center y should be used
    const inside = makeInsidePoint(rect, outside, center);
    expect(inside.x).toBe(outside.x);
    expect(inside.y).toBe(center.y);
  });

  it('tryNodeIntersect returns null for wrong-side intersections', () => {
    const rect: RectLike = { x: 0, y: 0, width: 100, height: 50 };
    const outside: P = { x: -50, y: 0 };
    const node = { intersect: () => ({ x: 10, y: 0 }) } as any; // right side of center
    const res = tryNodeIntersect(node, rect, outside);
    expect(res).toBeNull();
  });

  it('replaceEndpoint dedup removes end/start appropriately', () => {
    const pts: P[] = [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
    ];
    // remove duplicate end
    replaceEndpoint(pts, 'end', { x: 1, y: 1 });
    expect(pts.length).toBe(1);

    const pts2: P[] = [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
    ];
    // remove duplicate start
    replaceEndpoint(pts2, 'start', { x: 0, y: 0 });
    expect(pts2.length).toBe(1);
  });
});
