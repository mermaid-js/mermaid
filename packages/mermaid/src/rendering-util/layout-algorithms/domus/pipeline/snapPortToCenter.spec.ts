/**
 * iter-41 — unit tests for `snapPortsToCenterWhenPaintDiagonal`.
 *
 * The pass detects when an edge endpoint's paint-time clip (ray from node
 * center through firstInner) lands off-port, producing a diagonal rendered
 * first/last segment. It snaps the port + adjacent interior point's
 * perpendicular-axis coord to node center.
 */
import { describe, it, expect } from 'vitest';
import { snapPortsToCenterWhenPaintDiagonal } from './snapPortToCenter.js';
import type { LayoutData, Node } from '../../../types.js';

function makeNode(id: string, x: number, y: number, w = 100, h = 40): Node {
  return { id, isGroup: false, x, y, width: w, height: h } as Node;
}

describe('snapPortsToCenterWhenPaintDiagonal', () => {
  it('is a no-op when port is already on center perpendicular axis', () => {
    // W-side port at center.y — no diagonal.
    const A = makeNode('A', 100, 100, 40, 40); // center (100,100), left=80
    const B = makeNode('B', 300, 100);
    const data = {
      nodes: [A, B],
      edges: [
        {
          id: 'e1',
          start: 'A',
          end: 'B',
          points: [
            { x: 120, y: 100 }, // A.right (center.y — clean)
            { x: 200, y: 100 },
          ],
        },
      ],
    } as unknown as LayoutData;
    const { snapped } = snapPortsToCenterWhenPaintDiagonal(data);
    expect(snapped).toBe(0);
  });

  it('snaps a W-side off-center port (t=0.25) to center.y — reproduces HKC→ExpensesHK case', () => {
    // HKC at (318.87, 135), size 158.1x45 → left=239.83.
    // Port at t=0.25 → y=123.75 (off-center). First seg horizontal west.
    // Paint clip: intersectRect lands at y≈125, rendered first seg diagonal.
    const HKC = makeNode('HongKongCompany', 318.87, 135, 158.1, 45);
    const ExpensesHK = makeNode('ExpensesHK', 50, 175, 112.9, 45);
    const data = {
      nodes: [HKC, ExpensesHK],
      edges: [
        {
          id: 'e1',
          start: 'HongKongCompany',
          end: 'ExpensesHK',
          points: [
            { x: 239.83, y: 123.75 },
            { x: 229.83, y: 123.75 },
            { x: 229.83, y: 175.0 },
            { x: 106.47, y: 175.0 },
          ],
        },
      ],
    } as unknown as LayoutData;
    const { snapped } = snapPortsToCenterWhenPaintDiagonal(data);
    expect(snapped).toBe(1);
    const pts = (data.edges[0] as any).points as { x: number; y: number }[];
    // First two points both at center.y = 135.
    expect(pts[0].y).toBeCloseTo(135, 3);
    expect(pts[1].y).toBeCloseTo(135, 3);
    // x coordinates unchanged.
    expect(pts[0].x).toBeCloseTo(239.83, 3);
    expect(pts[1].x).toBeCloseTo(229.83, 3);
    // Downstream points untouched.
    expect(pts[2]).toEqual({ x: 229.83, y: 175.0 });
    expect(pts[3]).toEqual({ x: 106.47, y: 175.0 });
  });

  it('snaps a W-side off-center last port (t=0.8) to center.y — reproduces USC→HKC case', () => {
    // USC→HKC post iter-40. Last port at HKC.left t=0.8 (y=148.5).
    const USC = makeNode('USCompany', 323.87, 220, 111.37, 45);
    const HKC = makeNode('HongKongCompany', 318.87, 135, 158.1, 45);
    const data = {
      nodes: [USC, HKC],
      edges: [
        {
          id: 'e1',
          start: 'USCompany',
          end: 'HongKongCompany',
          points: [
            { x: 268.19, y: 220 },
            { x: 235.83, y: 220 },
            { x: 235.83, y: 148.5 },
            { x: 239.83, y: 148.5 },
          ],
        },
      ],
    } as unknown as LayoutData;
    const { snapped } = snapPortsToCenterWhenPaintDiagonal(data);
    expect(snapped).toBe(1);
    const pts = (data.edges[0] as any).points as { x: number; y: number }[];
    // Last two points both at HKC center.y = 135.
    expect(pts[pts.length - 1].y).toBeCloseTo(135, 3);
    expect(pts[pts.length - 2].y).toBeCloseTo(135, 3);
    // Upstream unchanged.
    expect(pts[0]).toEqual({ x: 268.19, y: 220 });
    expect(pts[1]).toEqual({ x: 235.83, y: 220 });
  });

  it('does not snap when first segment is not axis-aligned (diagonal polyline — out of scope)', () => {
    // An edge whose first polyline segment is already diagonal is out of
    // scope for this pass (orthogonality violation, a different bug).
    const A = makeNode('A', 100, 100, 40, 40); // left=80
    const B = makeNode('B', 300, 300);
    const data = {
      nodes: [A, B],
      edges: [
        {
          id: 'e1',
          start: 'A',
          end: 'B',
          points: [
            { x: 80, y: 95 }, // W-side port at y=95 (off-center)
            { x: 50, y: 70 }, // Diagonal first seg (both dx and dy)
            { x: 300, y: 300 },
          ],
        },
      ],
    } as unknown as LayoutData;
    const { snapped } = snapPortsToCenterWhenPaintDiagonal(data);
    expect(snapped).toBe(0);
  });

  it('iter-41: redistributes N=2 colliding ports within paint-clean band (avoids edge-same-port-departure)', () => {
    // Two edges both use HKC.west — iter-9 C1 placed them at t=0.25 and
    // t=0.8. Naive "snap to center" would put both at exactly (239.83, 135)
    // and validator would flag edge-same-port-departure (EPS_PORT=2).
    // This pass redistributes within a narrow paint-clean band that keeps
    // pairwise distance > EPS_PORT.
    const HKC = { id: 'HKC', isGroup: false, x: 318.87, y: 135, width: 158.1, height: 45 } as Node;
    const ExpensesHK = {
      id: 'ExpensesHK',
      isGroup: false,
      x: 50,
      y: 175,
      width: 100,
      height: 45,
    } as Node;
    const USC = { id: 'USC', isGroup: false, x: 323.87, y: 220, width: 111.37, height: 45 } as Node;
    const data = {
      nodes: [HKC, ExpensesHK, USC],
      edges: [
        {
          id: 'eStart',
          start: 'HKC',
          end: 'ExpensesHK',
          points: [
            { x: 239.83, y: 123.75 }, // HKC.west t=0.25
            { x: 229.83, y: 123.75 },
            { x: 229.83, y: 175 },
            { x: 106.47, y: 175 },
          ],
        },
        {
          id: 'eEnd',
          start: 'USC',
          end: 'HKC',
          points: [
            { x: 268.19, y: 220 },
            { x: 235.83, y: 220 },
            { x: 235.83, y: 148.5 },
            { x: 239.83, y: 148.5 }, // HKC.west t=0.8
          ],
        },
      ],
    } as unknown as LayoutData;

    const { snapped } = snapPortsToCenterWhenPaintDiagonal(data);
    expect(snapped).toBe(2);

    const e1 = (data.edges[0] as any).points as { x: number; y: number }[];
    const e2 = (data.edges[1] as any).points as { x: number; y: number }[];

    // Both start-port (e1) and end-port (e2) are on HKC.west.
    const p1y = e1[0].y;
    const p2y = e2[e2.length - 1].y;

    // Both in paint-clean band (within ~4u of HKC center.y=135).
    expect(Math.abs(p1y - 135)).toBeLessThanOrEqual(4);
    expect(Math.abs(p2y - 135)).toBeLessThanOrEqual(4);

    // Distinguished from each other (> EPS_PORT=2 so validator won't fire
    // edge-same-port-departure).
    expect(Math.abs(p1y - p2y)).toBeGreaterThan(2);

    // First/last interior points got the same perpendicular-axis update
    // (snap preserves axis-aligned first/last segment).
    expect(e1[1].y).toBeCloseTo(p1y, 6);
    expect(e2[e2.length - 2].y).toBeCloseTo(p2y, 6);
  });

  it('snaps a N-side off-center port to center.x (mirror case for vertical-exit ports)', () => {
    // Node at (100, 100) size 40x40 → top=80. Port at x=110 (t=0.75 on top).
    const A = makeNode('A', 100, 100, 40, 40);
    const B = makeNode('B', 100, 300);
    const data = {
      nodes: [A, B],
      edges: [
        {
          id: 'e1',
          start: 'A',
          end: 'B',
          points: [
            { x: 110, y: 80 }, // N-side port at x=110 (center.x=100), off-center
            { x: 110, y: 50 }, // vertical up first seg
            { x: 100, y: 50 },
            { x: 100, y: 280 },
          ],
        },
      ],
    } as unknown as LayoutData;
    const { snapped } = snapPortsToCenterWhenPaintDiagonal(data);
    expect(snapped).toBe(1);
    const pts = (data.edges[0] as any).points as { x: number; y: number }[];
    // First two points snap x to center.x=100.
    expect(pts[0].x).toBeCloseTo(100, 3);
    expect(pts[1].x).toBeCloseTo(100, 3);
    // y coordinates unchanged.
    expect(pts[0].y).toBeCloseTo(80, 3);
    expect(pts[1].y).toBeCloseTo(50, 3);
  });
});
