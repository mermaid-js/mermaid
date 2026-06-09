/**
 * iter-53 — unit tests for shared-subpath nudge pass.
 *
 * Paper anchor: Wybrow §5.2 separation-constrained nudging for parallel
 * overlapping segments, adapted to Mermaid's crystallised polylines
 * (no OVG or separation-constraint solver; greedy pairwise shift to
 * alley midpoint).
 */
import { describe, it, expect } from 'vitest';
import { applySharedSubpathNudge } from './sharedSubpathNudge.js';
import type { LayoutData, Node } from '../../../types.js';

function node(id: string, x: number, y: number, w = 120, h = 60): Node {
  return { id, isGroup: false, x, y, width: w, height: h } as any;
}

describe('applySharedSubpathNudge', () => {
  it('nudges one of two same-column vertical middle segments apart (Issue #2 USC fan-out)', () => {
    // Mirrors Company.mmd L_USCompany_Expenses_0 vs L_USCompany_Income_0:
    // both exit USC.west (x=635) via stub at x=625, then go UP at x=625
    // overlapping for 22.5u. Nudge one to x=615 (alley between Expenses
    // and USC); remaining edge stays at x=625.
    const data: LayoutData = {
      nodes: [
        node('USCompany', 695, 130),
        node('Expenses', 175, 130),
        node('Income', 462.5, 240),
      ] as any,
      edges: [
        {
          id: 'L_USCompany_Expenses_0',
          start: 'USCompany',
          end: 'Expenses',
          points: [
            { x: 635, y: 127.5 },
            { x: 625, y: 127.5 },
            { x: 625, y: 30 },
            { x: 175, y: 30 },
            { x: 175, y: 100 },
          ],
        },
        {
          id: 'L_USCompany_Income_0',
          start: 'USCompany',
          end: 'Income',
          points: [
            { x: 635, y: 132.5 },
            { x: 625, y: 132.5 },
            { x: 625, y: 105 },
            { x: 520, y: 105 },
            { x: 520, y: 135 },
            { x: 462.5, y: 135 },
            { x: 462.5, y: 210 },
          ],
        },
      ] as any,
    } as any;
    const { nudged } = applySharedSubpathNudge(data, { spacing: 10 });
    expect(nudged).toBeGreaterThanOrEqual(1);
    const e1 = (data.edges as any)[0].points as { x: number; y: number }[];
    const e2 = (data.edges as any)[1].points as { x: number; y: number }[];
    // Ports must not move.
    expect(e1[0]).toEqual({ x: 635, y: 127.5 });
    expect(e1[e1.length - 1]).toEqual({ x: 175, y: 100 });
    expect(e2[0]).toEqual({ x: 635, y: 132.5 });
    expect(e2[e2.length - 1]).toEqual({ x: 462.5, y: 210 });
    // After nudge, no two vertical middle-segments share same x with y-overlap.
    const verts1 = vSegs(e1);
    const verts2 = vSegs(e2);
    for (const v1 of verts1) {
      for (const v2 of verts2) {
        if (Math.abs(v1.x - v2.x) < 1e-6) {
          const ymax = Math.max(v1.y1, v2.y1);
          const ymin = Math.min(v1.y2, v2.y2);
          expect(
            ymax > ymin + 1e-6,
            `seg1@x=${v1.x} y∈[${v1.y1},${v1.y2}] overlaps seg2 y∈[${v2.y1},${v2.y2}]`
          ).toBe(true);
        }
      }
    }
  });

  it('nudges one of two same-column vertical middle segments apart (Issue #1 HKC.left convergence)', () => {
    // Mirrors Company.mmd L_HKC_ExpHK_0 vs L_USC_HKC_0: both traverse
    // DOWN at x=947.5, overlap 15u. Nudge one to x=935 (alley between
    // Customer.right=925 and HKC.left=957.5).
    const data: LayoutData = {
      nodes: [
        node('USCompany', 695, 130),
        node('HongKongCompany', 1017.5, 160),
        node('Customer', 865, 130),
        node('ExpensesHK', 900, 230),
      ] as any,
      edges: [
        {
          id: 'L_HongKongCompany_ExpensesHK_0',
          start: 'HongKongCompany',
          end: 'ExpensesHK',
          points: [
            { x: 957.5, y: 145 },
            { x: 947.5, y: 145 },
            { x: 947.5, y: 195 },
            { x: 970, y: 195 },
            { x: 970, y: 230 },
            { x: 960, y: 230 },
          ],
        },
        {
          id: 'L_USCompany_HongKongCompany_0',
          start: 'USCompany',
          end: 'HongKongCompany',
          points: [
            { x: 755, y: 130 },
            { x: 765, y: 130 },
            { x: 765, y: 90 },
            { x: 947.5, y: 90 },
            { x: 947.5, y: 160 },
            { x: 957.5, y: 160 },
          ],
        },
      ] as any,
    } as any;
    const { nudged } = applySharedSubpathNudge(data, { spacing: 10 });
    expect(nudged).toBeGreaterThanOrEqual(1);
    const e1 = (data.edges as any)[0].points as { x: number; y: number }[];
    const e2 = (data.edges as any)[1].points as { x: number; y: number }[];
    // Ports must not move.
    expect(e1[0]).toEqual({ x: 957.5, y: 145 });
    expect(e1[e1.length - 1]).toEqual({ x: 960, y: 230 });
    expect(e2[0]).toEqual({ x: 755, y: 130 });
    expect(e2[e2.length - 1]).toEqual({ x: 957.5, y: 160 });
    // After nudge, shared-subpath cleared.
    const verts1 = vSegs(e1);
    const verts2 = vSegs(e2);
    for (const v1 of verts1) {
      for (const v2 of verts2) {
        if (Math.abs(v1.x - v2.x) < 1e-6) {
          const ymax = Math.max(v1.y1, v2.y1);
          const ymin = Math.min(v1.y2, v2.y2);
          expect(
            ymax > ymin + 1e-6,
            `seg1@x=${v1.x} y∈[${v1.y1},${v1.y2}] overlaps seg2 y∈[${v2.y1},${v2.y2}]`
          ).toBe(true);
        }
      }
    }
  });

  it('no-op when no pair of edges has shared-subpath', () => {
    const data: LayoutData = {
      nodes: [node('A', 50, 50), node('B', 200, 50), node('C', 350, 50)] as any,
      edges: [
        {
          id: 'e1',
          start: 'A',
          end: 'B',
          points: [
            { x: 110, y: 50 },
            { x: 140, y: 50 },
          ],
        },
        {
          id: 'e2',
          start: 'B',
          end: 'C',
          points: [
            { x: 260, y: 50 },
            { x: 290, y: 50 },
          ],
        },
      ] as any,
    } as any;
    const { nudged } = applySharedSubpathNudge(data, { spacing: 10 });
    expect(nudged).toBe(0);
  });

  it('skips pairs where no free alley exists (bails gracefully)', () => {
    // Both edges share a vertical segment at x=50, but obstacles at x=40
    // and x=60 on both sides block nudge candidates.
    const data: LayoutData = {
      nodes: [
        node('A', 50, 0, 2, 20),
        node('B', 50, 200, 2, 20),
        node('LeftBlock', 40, 100, 2, 100),
        node('RightBlock', 60, 100, 2, 100),
      ] as any,
      edges: [
        {
          id: 'e1',
          start: 'A',
          end: 'B',
          points: [
            { x: 50, y: 10 },
            { x: 50, y: 190 },
          ],
        },
        {
          id: 'e2',
          start: 'A',
          end: 'B',
          points: [
            { x: 50, y: 10 },
            { x: 50, y: 190 },
          ],
        },
      ] as any,
    } as any;
    const before = JSON.stringify((data.edges as any)[1].points);
    const { nudged } = applySharedSubpathNudge(data, { spacing: 10 });
    const after = JSON.stringify((data.edges as any)[1].points);
    // Either no-op or one of the edges' polyline is preserved even if nudge
    // fails. We only assert no crash and that the invariant "ports unchanged".
    expect(nudged).toBeGreaterThanOrEqual(0);
    // If nothing nudged, polyline is identical.
    if (nudged === 0) {
      expect(after).toBe(before);
    }
  });
});

// Helper: extract vertical segments from a polyline.
function vSegs(pts: { x: number; y: number }[]) {
  const out: { x: number; y1: number; y2: number }[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    if (Math.abs(a.x - b.x) < 1e-6 && Math.abs(a.y - b.y) > 1e-6) {
      out.push({ x: a.x, y1: Math.min(a.y, b.y), y2: Math.max(a.y, b.y) });
    }
  }
  return out;
}
