import { describe, it, expect } from 'vitest';
import type { LayoutData, Node, Edge } from '../../../types.js';
import { postProcessDomusOptionBMilestone1 } from './postprocess.js';
import { rectForNode } from '../core/helpers.js';

interface Point {
  x: number;
  y: number;
}

function mkNode(id: string, x: number, y: number, width = 80, height = 60): Node {
  return { id, x, y, width, height, isGroup: false } as Node;
}

function mkEdge(id: string, start: string, end: string, points: Point[]): Edge {
  return { id, start, end, type: 'arrow', points } as Edge;
}

function pointStrictlyInsideRect(p: Point, r: ReturnType<typeof rectForNode>, eps = 1e-6): boolean {
  return p.x > r.left + eps && p.x < r.right - eps && p.y > r.top + eps && p.y < r.bottom - eps;
}

function segmentEntersRectInterior(
  a: Point,
  b: Point,
  r: ReturnType<typeof rectForNode>,
  eps = 1e-6
): boolean {
  // Only check orthogonal segments.
  if (a.x !== b.x && a.y !== b.y) {
    return false;
  }
  if (a.x === b.x) {
    // vertical segment x fixed
    const x = a.x;
    if (!(x > r.left + eps && x < r.right - eps)) {
      return false;
    }
    const y1 = Math.min(a.y, b.y);
    const y2 = Math.max(a.y, b.y);
    return y2 > r.top + eps && y1 < r.bottom - eps;
  }
  // horizontal segment y fixed
  const y = a.y;
  if (!(y > r.top + eps && y < r.bottom - eps)) {
    return false;
  }
  const x1 = Math.min(a.x, b.x);
  const x2 = Math.max(a.x, b.x);
  return x2 > r.left + eps && x1 < r.right - eps;
}

describe('Option B invariants', () => {
  it('does not place any polyline segment through another node interior', () => {
    const A = mkNode('A', 0, 0);
    const B = mkNode('B', 200, 0);
    const C = mkNode('C', 100, 0, 120, 80); // obstacle in the middle

    // Route that goes above C (already orthogonal).
    const e = mkEdge('e', 'A', 'B', [
      { x: A.x!, y: A.y! },
      { x: 0, y: -80 },
      { x: 200, y: -80 },
      { x: B.x!, y: B.y! },
    ]);

    const data: LayoutData = { nodes: [A, B, C], edges: [e], config: {} as any };
    postProcessDomusOptionBMilestone1(data, { spacing: 10, snapEps: 0, segmentKeySnap: 1 });

    const rC = rectForNode(C);
    const pts = e.points as Point[];
    // No vertex strictly inside.
    for (const p of pts) {
      expect(pointStrictlyInsideRect(p, rC)).toBe(false);
    }
    // No segment passes through interior.
    for (let i = 0; i < pts.length - 1; i++) {
      expect(segmentEntersRectInterior(pts[i], pts[i + 1], rC)).toBe(false);
    }
  });

  it('keeps all polylines orthogonal', () => {
    const A = mkNode('A', 0, 0);
    const B = mkNode('B', 200, 0);
    const C = mkNode('C', 100, 120);
    // Two edges with different shapes.
    const e1 = mkEdge('e1', 'A', 'B', [
      { x: A.x!, y: A.y! },
      { x: B.x!, y: B.y! },
    ]);
    const e2 = mkEdge('e2', 'A', 'C', [
      { x: A.x!, y: A.y! },
      { x: 0, y: 80 },
      { x: 100, y: 80 },
      { x: C.x!, y: C.y! },
    ]);
    const data: LayoutData = { nodes: [A, B, C], edges: [e1, e2], config: {} as any };
    postProcessDomusOptionBMilestone1(data, { spacing: 10, snapEps: 1, segmentKeySnap: 1 });
    for (const e of [e1, e2]) {
      const pts = e.points as Point[];
      for (let i = 0; i < pts.length - 1; i++) {
        expect(pts[i].x === pts[i + 1].x || pts[i].y === pts[i + 1].y).toBe(true);
      }
    }
  });

  it('is deterministic even if edge input order differs', () => {
    const spacing = 10;
    const mk = (order: 'forward' | 'reverse') => {
      const A = mkNode('A', 0, 0);
      const B = mkNode('B', 200, 0);
      const e1 = mkEdge('e1', 'A', 'B', [
        { x: A.x!, y: A.y! },
        { x: B.x!, y: B.y! },
      ]);
      const e2 = mkEdge('e2', 'A', 'B', [
        { x: A.x!, y: A.y! },
        { x: B.x!, y: B.y! },
      ]);
      const e3 = mkEdge('e3', 'A', 'B', [
        { x: A.x!, y: A.y! },
        { x: B.x!, y: B.y! },
      ]);
      const edges = order === 'forward' ? [e1, e2, e3] : [e3, e2, e1];
      const data: LayoutData = { nodes: [A, B], edges, config: {} as any };
      postProcessDomusOptionBMilestone1(data, { spacing, snapEps: 1, segmentKeySnap: 1 });
      return { e1, e2, e3 };
    };

    const a = mk('forward');
    const b = mk('reverse');
    expect(JSON.stringify(a.e1.points)).toEqual(JSON.stringify(b.e1.points));
    expect(JSON.stringify(a.e2.points)).toEqual(JSON.stringify(b.e2.points));
    expect(JSON.stringify(a.e3.points)).toEqual(JSON.stringify(b.e3.points));
  });

  it('keeps endpoints on the node border after postprocess', () => {
    const A = mkNode('A', 0, 0, 100, 80);
    const B = mkNode('B', 250, 0, 140, 60);
    const e = mkEdge('e', 'A', 'B', [
      { x: A.x!, y: A.y! },
      { x: B.x!, y: B.y! },
    ]);
    const data: LayoutData = { nodes: [A, B], edges: [e], config: {} as any };
    postProcessDomusOptionBMilestone1(data, { spacing: 10, snapEps: 1, segmentKeySnap: 1 });
    const rA = rectForNode(A);
    const rB = rectForNode(B);
    const pts = e.points as Point[];
    const s = pts[0];
    const t = pts[pts.length - 1];
    const onBorderA =
      Math.abs(s.x - rA.left) < 1e-6 ||
      Math.abs(s.x - rA.right) < 1e-6 ||
      Math.abs(s.y - rA.top) < 1e-6 ||
      Math.abs(s.y - rA.bottom) < 1e-6;
    const onBorderB =
      Math.abs(t.x - rB.left) < 1e-6 ||
      Math.abs(t.x - rB.right) < 1e-6 ||
      Math.abs(t.y - rB.top) < 1e-6 ||
      Math.abs(t.y - rB.bottom) < 1e-6;
    expect(onBorderA).toBe(true);
    expect(onBorderB).toBe(true);
  });

  it('separates lanes by at least spacing for horizontal bundles (multi-edges)', () => {
    const spacing = 10;
    const A = mkNode('A', 0, 0);
    const B = mkNode('B', 200, 0);
    const e1 = mkEdge('e1', 'A', 'B', [
      { x: A.x!, y: A.y! },
      { x: B.x!, y: B.y! },
    ]);
    const e2 = mkEdge('e2', 'A', 'B', [
      { x: A.x!, y: A.y! },
      { x: B.x!, y: B.y! },
    ]);
    const e3 = mkEdge('e3', 'A', 'B', [
      { x: A.x!, y: A.y! },
      { x: B.x!, y: B.y! },
    ]);
    const data: LayoutData = { nodes: [A, B], edges: [e1, e2, e3], config: {} as any };
    postProcessDomusOptionBMilestone1(data, { spacing, snapEps: 0, segmentKeySnap: 1 });

    const tracks = [e1, e2, e3].map((e) => {
      const pts = e.points as Point[];
      // Expect detour: start -> (x0,yTrack) -> (x1,yTrack) -> end
      expect(pts.length).toBeGreaterThanOrEqual(4);
      return pts[1].y;
    });
    const sorted = [...tracks].sort((a, b) => a - b);
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i] - sorted[i - 1]).toBeGreaterThanOrEqual(spacing - 0.5);
    }
  });

  it('separates lanes by at least spacing for vertical bundles (multi-edges)', () => {
    const spacing = 10;
    const A = mkNode('A', 0, 0);
    const B = mkNode('B', 0, 240);
    const e1 = mkEdge('e1', 'A', 'B', [
      { x: A.x!, y: A.y! },
      { x: B.x!, y: B.y! },
    ]);
    const e2 = mkEdge('e2', 'A', 'B', [
      { x: A.x!, y: A.y! },
      { x: B.x!, y: B.y! },
    ]);
    const e3 = mkEdge('e3', 'A', 'B', [
      { x: A.x!, y: A.y! },
      { x: B.x!, y: B.y! },
    ]);
    const data: LayoutData = { nodes: [A, B], edges: [e1, e2, e3], config: {} as any };
    postProcessDomusOptionBMilestone1(data, { spacing, snapEps: 0, segmentKeySnap: 1 });

    const tracks = [e1, e2, e3].map((e) => {
      const pts = e.points as Point[];
      expect(pts.length).toBeGreaterThanOrEqual(4);
      return pts[1].x;
    });
    const sorted = [...tracks].sort((a, b) => a - b);
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i] - sorted[i - 1]).toBeGreaterThanOrEqual(spacing - 0.5);
    }
  });
});
