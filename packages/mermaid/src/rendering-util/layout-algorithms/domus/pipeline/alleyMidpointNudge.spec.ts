import { describe, it, expect } from 'vitest';
import type { LayoutData, Node } from '../../../types.js';
import { nudgeSegmentsOffObstacleBorders } from './alleyMidpointNudge.js';

function mkNode(id: string, x: number, y: number, w = 40, h = 40): Node {
  return {
    id,
    x,
    y,
    width: w,
    height: h,
    isGroup: false,
    shape: 'rect',
    label: id,
    layer: 0,
    order: 0,
    labelStyle: '',
    parentId: undefined,
  } as unknown as Node;
}

function byIdMap(nodes: Node[]): Map<string, Node> {
  const m = new Map<string, Node>();
  for (const n of nodes) {
    m.set(String(n.id), n);
  }
  return m;
}

describe('nudgeSegmentsOffObstacleBorders', () => {
  it('moves a vertical interior segment off the right side of a non-endpoint obstacle', () => {
    // Source at (0, 0), target at (400, 0), obstacle "mid" at (200, 100) w=100 h=200.
    // obstacle.right = 250. A vertical segment at x=250 from y=0 to y=200 hugs mid's right side.
    const source = mkNode('A', 0, 0, 40, 40);
    const target = mkNode('B', 400, 0, 40, 40);
    const mid = mkNode('mid', 200, 100, 100, 200); // left=150, right=250, top=0, bottom=200
    const data: LayoutData = {
      nodes: [source, target, mid],
      edges: [
        {
          id: 'e1',
          start: 'A',
          end: 'B',
          points: [
            { x: 20, y: 0 }, // port
            { x: 250, y: 0 }, // bend — lands on mid.right
            { x: 250, y: 200 }, // vertical segment flush on mid.right
            { x: 380, y: 200 }, // bend
            { x: 400, y: 200 }, // port — target center
          ],
        } as unknown as LayoutData['edges'][number],
      ],
    } as unknown as LayoutData;

    const nudges = nudgeSegmentsOffObstacleBorders(data, byIdMap([source, target, mid]), 10);

    expect(nudges).toBe(1);
    const pts = data.edges[0].points!;
    // The interior vertical segment (index 1→2) should now be at mid.right + margin (spacing/2 = 5).
    expect(pts[1].x).toBeCloseTo(255, 6);
    expect(pts[2].x).toBeCloseTo(255, 6);
    // Neighboring horizontal segments remain orthogonal at the same y.
    expect(pts[0].y).toBeCloseTo(0, 6);
    expect(pts[1].y).toBeCloseTo(0, 6);
    expect(pts[2].y).toBeCloseTo(200, 6);
    expect(pts[3].y).toBeCloseTo(200, 6);
  });

  it('leaves port segments unchanged even if they lie flush on an endpoint border', () => {
    // A simple 3-point L: port on source-right side.
    const source = mkNode('A', 0, 0, 40, 40); // right side at x=20
    const target = mkNode('B', 200, 200, 40, 40);
    const data: LayoutData = {
      nodes: [source, target],
      edges: [
        {
          id: 'e1',
          start: 'A',
          end: 'B',
          points: [
            { x: 20, y: 0 }, // port on source-right
            { x: 200, y: 0 }, // bend
            { x: 200, y: 180 }, // port on target-top
          ],
        } as unknown as LayoutData['edges'][number],
      ],
    } as unknown as LayoutData;

    const nudges = nudgeSegmentsOffObstacleBorders(data, byIdMap([source, target]), 10);
    expect(nudges).toBe(0);
    const pts = data.edges[0].points!;
    // Points unchanged.
    expect(pts[0]).toEqual({ x: 20, y: 0 });
    expect(pts[1]).toEqual({ x: 200, y: 0 });
    expect(pts[2]).toEqual({ x: 200, y: 180 });
  });

  it('skips the nudge when the shifted position would land inside another obstacle', () => {
    // Two obstacles side-by-side with no alley between them.
    const source = mkNode('A', 0, 100, 40, 40);
    const target = mkNode('B', 400, 100, 40, 40);
    const mid1 = mkNode('m1', 200, 100, 100, 200); // left=150, right=250
    const mid2 = mkNode('m2', 260, 100, 20, 200); // left=250, right=270 — touches m1.right
    const data: LayoutData = {
      nodes: [source, target, mid1, mid2],
      edges: [
        {
          id: 'e1',
          start: 'A',
          end: 'B',
          points: [
            { x: 20, y: 100 },
            { x: 250, y: 100 }, // flush on both m1.right and m2.left
            { x: 250, y: 180 },
            { x: 380, y: 180 },
            { x: 400, y: 180 },
          ],
        } as unknown as LayoutData['edges'][number],
      ],
    } as unknown as LayoutData;

    const nudges = nudgeSegmentsOffObstacleBorders(data, byIdMap([source, target, mid1, mid2]), 10);
    // Nudge to m1.right - margin = 245 would land inside m1 (x=245 is in m1 interior [150,250]).
    // Nudge to m2.right + margin = 275 would be outside everything; one of them should succeed.
    // But nudging for m1 checks its right-side → 255, which is inside m2.left..right=[250,270].
    // So the m1-motivated nudge is blocked. Then m2 is considered: x=250 = m2.left, motion to 245 is inside m1. Also blocked.
    // Expect 0 nudges and segment unchanged.
    expect(nudges).toBe(0);
    const pts = data.edges[0].points!;
    expect(pts[1].x).toBe(250);
    expect(pts[2].x).toBe(250);
  });

  it('is idempotent — a second pass does not move anything further', () => {
    const source = mkNode('A', 0, 0, 40, 40);
    const target = mkNode('B', 400, 0, 40, 40);
    const mid = mkNode('mid', 200, 100, 100, 200);
    const data: LayoutData = {
      nodes: [source, target, mid],
      edges: [
        {
          id: 'e1',
          start: 'A',
          end: 'B',
          points: [
            { x: 20, y: 0 },
            { x: 250, y: 0 },
            { x: 250, y: 200 },
            { x: 380, y: 200 },
            { x: 400, y: 200 },
          ],
        } as unknown as LayoutData['edges'][number],
      ],
    } as unknown as LayoutData;

    const map = byIdMap([source, target, mid]);
    expect(nudgeSegmentsOffObstacleBorders(data, map, 10)).toBe(1);
    expect(nudgeSegmentsOffObstacleBorders(data, map, 10)).toBe(0);
  });
});
