import { describe, it, expect } from 'vitest';
import { relocateLabelsForSimplification } from './labelRelocationPass.js';
import type { LayoutData, Node } from '../../../types.js';

// iter-39 — post-finalize label relocation pass.
//
// When DOMUS compaction places a label far from the natural USC→HKC
// L-path, the merged polyline takes a large detour just to visit the
// label anchor. If a much simpler polyline exists that preserves port
// entry/exit directions AND is obstacle-clear, replace it and relocate
// the label to a clean midpoint on the new polyline.

function makeNode(id: string, x: number, y: number, w = 100, h = 40): Node {
  return { id, isGroup: false, x, y, width: w, height: h } as Node;
}

describe('relocateLabelsForSimplification', () => {
  it('returns changed=0 for edges with no label anchor (edge.x/edge.y undefined)', () => {
    const A = makeNode('A', 0, 0);
    const B = makeNode('B', 200, 200);
    const data = {
      nodes: [A, B],
      edges: [
        {
          id: 'e1',
          start: 'A',
          end: 'B',
          points: [
            { x: 50, y: 0 },
            { x: 50, y: 200 },
            { x: 150, y: 200 },
          ],
        },
      ],
    } as unknown as LayoutData;
    const { changed } = relocateLabelsForSimplification(data, { ratioThreshold: 1.5 });
    expect(changed).toBe(0);
  });

  it('returns changed=0 when current ratio is already good (<= threshold)', () => {
    const A = makeNode('A', 0, 0);
    const B = makeNode('B', 200, 200);
    const data = {
      nodes: [A, B],
      edges: [
        {
          id: 'e1',
          start: 'A',
          end: 'B',
          x: 50,
          y: 100,
          points: [
            { x: 50, y: 20 },
            { x: 50, y: 180 },
            { x: 150, y: 180 },
          ],
        },
      ],
    } as unknown as LayoutData;
    const { changed } = relocateLabelsForSimplification(data, { ratioThreshold: 2.0 });
    expect(changed).toBe(0);
  });

  it('reproduces company-simp USC→HKC case: label relocates to clean middle segment', () => {
    // USC at (323.9, 220) 111.4x45 → left=268.2, top=197.5, bot=242.5.
    // HKC at (318.9, 135) 158.1x45 → left=239.8, top=112.5, bot=157.5.
    // Current: polyline curls LEFT 80u to label at (187.3, 220), UP, RIGHT to HKC.left.
    // Ratio 2.66. Target: simpler L (268.2,220)→(229.8,220)→(229.8,148.5)→(239.8,148.5)
    // with label on middle segment midpoint (229.8, 184.25).
    const USC = makeNode('USCompany', 323.9, 220, 111.4, 45);
    const HKC = makeNode('HongKongCompany', 318.9, 135, 158.1, 45);
    // Other nodes at positions the full fixture has, so label-bbox check is realistic.
    const ExpensesHK = makeNode('ExpensesHK', 50, 175, 112.9, 45);
    const Incomehk = makeNode('Incomehk', 135, 220, 92.7, 45);

    const data = {
      nodes: [USC, HKC, ExpensesHK, Incomehk],
      edges: [
        {
          id: 'L_USC_HKC',
          start: 'USCompany',
          end: 'HongKongCompany',
          x: 187.3, // current label x
          y: 220, // current label y
          width: 81.7,
          height: 21,
          points: [
            { x: 268.2, y: 220 }, // USC.left port
            { x: 187.3, y: 220 }, // L detour to label
            { x: 187.3, y: 148.5 }, // U
            { x: 239.8, y: 148.5 }, // R to HKC.left
          ],
        },
      ],
    } as unknown as LayoutData;

    const { changed } = relocateLabelsForSimplification(data, { ratioThreshold: 2.0, spacing: 10 });
    expect(changed).toBe(1);

    const e = data.edges[0] as any;
    // Endpoints preserved.
    expect(e.points[0]).toEqual({ x: 268.2, y: 220 });
    expect(e.points[e.points.length - 1]).toEqual({ x: 239.8, y: 148.5 });
    // First segment direction preserved (L = leftward).
    expect(e.points[1].x).toBeLessThan(e.points[0].x);
    // Last segment direction preserved (R = rightward into HKC.left).
    expect(e.points[e.points.length - 2].x).toBeLessThan(e.points[e.points.length - 1].x);
    // New polyline should be significantly shorter — ratio < 2.0.
    let mLen = 0;
    for (let i = 0; i < e.points.length - 1; i++) {
      mLen +=
        Math.abs(e.points[i].x - e.points[i + 1].x) + Math.abs(e.points[i].y - e.points[i + 1].y);
    }
    const sLen = Math.sqrt((268.2 - 239.8) ** 2 + (220 - 148.5) ** 2);
    const newRatio = mLen / sLen;
    expect(newRatio).toBeLessThan(2.0);
    // Label relocated off the original (187.3, 220).
    expect(e.x).not.toBeCloseTo(187.3, 1);
    // Label y now somewhere in the middle of USC-HKC vertical range (roughly 180-185).
    expect(e.y).toBeGreaterThan(160);
    expect(e.y).toBeLessThan(210);
  });

  it('iter-40: mixed-axis ports (first=east, last=south) simplify a 5-bend detour to 3 bends', () => {
    // Mirrors company-simp USC→Expenses: first segment exits east, last
    // segment enters from north (down into target). 5-bend polyline with
    // post-iter-38 obstacle-lift residual zigzag. Ratio 1.73 < 2.0, so
    // the ratio gate must allow bend-count as an alternate trigger.
    //
    // USCompany at (323.9, 220) 111.4x45 → right=379.6
    // Expenses at (515.6, 220) 93.5x45 → top=197.5
    // HongKongCompany + Wages in middle row (y=135 ± 22.5) — obstacles.
    const USC = makeNode('USCompany', 323.9, 220, 111.4, 45);
    const HKC = makeNode('HongKongCompany', 318.9, 135, 158.1, 45);
    const Wages = makeNode('Wages', 473.6, 135, 51.4, 45);
    const Expenses = makeNode('Expenses', 515.6, 220, 93.5, 45);

    const data = {
      nodes: [USC, HKC, Wages, Expenses],
      edges: [
        {
          id: 'L_USC_Expenses',
          start: 'USCompany',
          end: 'Expenses',
          x: 515.6,
          y: 147,
          width: 10,
          height: 21,
          points: [
            { x: 379.6, y: 220 },
            { x: 399.6, y: 220 },
            { x: 399.6, y: 167.5 },
            { x: 511, y: 167.5 },
            { x: 511, y: 157.5 },
            { x: 515.6, y: 157.5 },
            { x: 515.6, y: 197.5 },
          ],
        },
      ],
    } as unknown as LayoutData;

    const { changed } = relocateLabelsForSimplification(data, {
      ratioThreshold: 2.0,
      bendThreshold: 3,
      spacing: 10,
    });
    expect(changed).toBe(1);

    const e = data.edges[0] as any;
    // Endpoints preserved.
    expect(e.points[0]).toEqual({ x: 379.6, y: 220 });
    expect(e.points[e.points.length - 1]).toEqual({ x: 515.6, y: 197.5 });
    // First segment direction preserved (east: x increasing).
    expect(e.points[1].x).toBeGreaterThan(e.points[0].x);
    expect(e.points[1].y).toBeCloseTo(e.points[0].y, 3);
    // Last segment direction preserved (south: y increasing, x held).
    expect(e.points[e.points.length - 1].y).toBeGreaterThan(e.points[e.points.length - 2].y);
    expect(e.points[e.points.length - 2].x).toBeCloseTo(e.points[e.points.length - 1].x, 3);
    // Bend count reduced to <=3.
    let bends = 0;
    for (let i = 1; i < e.points.length - 1; i++) {
      const d1x = e.points[i].x - e.points[i - 1].x;
      const d1y = e.points[i].y - e.points[i - 1].y;
      const d2x = e.points[i + 1].x - e.points[i].x;
      const d2y = e.points[i + 1].y - e.points[i].y;
      if (Math.abs(d1x * d2y - d1y * d2x) > 1e-6) {
        bends++;
      }
    }
    expect(bends).toBeLessThanOrEqual(3);
  });

  it('iter-40: triggers on bends > bendThreshold even when ratio <= ratioThreshold', () => {
    // 5-bend edge with ratio just under 2.0. Without bend trigger, no change.
    // With bend trigger (bendThreshold=3), relocate.
    const A = makeNode('A', 0, 0, 40, 40);
    const B = makeNode('B', 200, 100, 40, 40);
    // A far-right then far-up detour — no obstacle blocks the natural L.
    const pts = [
      { x: 20, y: 0 }, // A.right-ish
      { x: 40, y: 0 },
      { x: 40, y: 30 },
      { x: 90, y: 30 },
      { x: 90, y: 60 },
      { x: 180, y: 60 },
      { x: 180, y: 100 }, // B.top
    ];
    const data = {
      nodes: [A, B],
      edges: [
        { id: 'e1', start: 'A', end: 'B', x: 100, y: 50, width: 10, height: 10, points: pts },
      ],
    } as unknown as LayoutData;
    const { changed } = relocateLabelsForSimplification(data, {
      ratioThreshold: 5.0, // effectively disable ratio trigger
      bendThreshold: 3,
      spacing: 10,
    });
    expect(changed).toBe(1);
    const e = data.edges[0] as any;
    let bends = 0;
    for (let i = 1; i < e.points.length - 1; i++) {
      const d1x = e.points[i].x - e.points[i - 1].x;
      const d1y = e.points[i].y - e.points[i - 1].y;
      const d2x = e.points[i + 1].x - e.points[i].x;
      const d2y = e.points[i + 1].y - e.points[i].y;
      if (Math.abs(d1x * d2y - d1y * d2x) > 1e-6) {
        bends++;
      }
    }
    expect(bends).toBeLessThanOrEqual(3);
  });

  it('rejects relocation when label bbox would overlap a non-endpoint node', () => {
    // Construct a case where the natural L-shape midpoint falls inside another node.
    const A = makeNode('A', 0, 0);
    const B = makeNode('B', 200, 200);
    const Blocker = makeNode('Blocker', 100, 100, 80, 40); // right in the middle
    const data = {
      nodes: [A, B, Blocker],
      edges: [
        {
          id: 'e1',
          start: 'A',
          end: 'B',
          x: 300,
          y: 100, // far-away label (forces big detour)
          width: 60,
          height: 21,
          points: [
            { x: 50, y: 0 },
            { x: 300, y: 0 },
            { x: 300, y: 200 },
            { x: 150, y: 200 },
          ],
        },
      ],
    } as unknown as LayoutData;
    const { changed } = relocateLabelsForSimplification(data, { ratioThreshold: 1.5 });
    // May change or not depending on whether simpler polyline is obstacle+label clear.
    // Main assertion: if it changes, the label doesn't overlap Blocker.
    if (changed === 1) {
      const e = data.edges[0] as any;
      const lx = e.x;
      const ly = e.y;
      const lhw = (e.width ?? 0) / 2;
      const lhh = (e.height ?? 0) / 2;
      const overlapsBlocker = lx + lhw > 60 && lx - lhw < 140 && ly + lhh > 80 && ly - lhh < 120;
      expect(overlapsBlocker).toBe(false);
    }
  });
});
