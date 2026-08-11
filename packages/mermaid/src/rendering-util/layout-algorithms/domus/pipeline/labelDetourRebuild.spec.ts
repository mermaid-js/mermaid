/**
 * iter-42 — unit tests for `rebuildPathologicalLabelEdges`.
 *
 * When a merged labelled edge has a large bend count AND both port sides are
 * the same (W/W or E/E or N/N or S/S) AND the label anchor sits on the
 * opposite side of the source node's center, the path is a pathological
 * wraparound — iter-39/40's label-relocation returns null because the
 * mixed-sign same-axis geometry has no valid shared-coord L. This pass
 * rebuilds the polyline using opposing ports (e.g. W/W → E/E when the nodes
 * are horizontally separated) and relocates the label onto the new path.
 */
import { describe, it, expect } from 'vitest';
import { rebuildPathologicalLabelEdges } from './labelDetourRebuild.js';
import type { LayoutData, Node } from '../../../types.js';

function makeNode(id: string, x: number, y: number, w = 120, h = 60): Node {
  return { id, isGroup: false, x, y, width: w, height: h } as Node;
}

describe('rebuildPathologicalLabelEdges', () => {
  it('no-op when bend count is below threshold', () => {
    const USC = makeNode('USCompany', 695, 130);
    const HKC = makeNode('HongKongCompany', 1015, 160);
    const data = {
      nodes: [USC, HKC],
      edges: [
        {
          id: 'e1',
          start: 'USCompany',
          end: 'HongKongCompany',
          x: 800,
          y: 145,
          width: 50,
          height: 20,
          points: [
            { x: 635, y: 145 },
            { x: 615, y: 145 },
            { x: 615, y: 55 },
            { x: 955, y: 55 },
            { x: 955, y: 175 },
          ],
        },
      ],
    } as unknown as LayoutData;
    const { rebuilt } = rebuildPathologicalLabelEdges(data, { bendThresholdHigh: 8 });
    expect(rebuilt).toBe(0);
  });

  it('iter-42: rebuilds W/W pathological wraparound with label far west (company.mmd case)', () => {
    // Company.mmd layout at jsdom-stubbed 120x60.
    const USC = makeNode('USCompany', 695, 130);
    const HKC = makeNode('HongKongCompany', 1015, 160);
    // No obstacles between USC.east=755 and HKC.west=955 at y in [100, 190].
    const data = {
      nodes: [USC, HKC],
      edges: [
        {
          id: 'L_USC_HKC',
          start: 'USCompany',
          end: 'HongKongCompany',
          x: 140, // label far west
          y: 230,
          width: 100,
          height: 20,
          points: [
            { x: 635, y: 145 }, // USC.west (off-center t=0.75)
            { x: 615, y: 145 },
            { x: 615, y: 55 },
            { x: 317.5, y: 55 },
            { x: 317.5, y: 180 },
            { x: 220, y: 180 },
            { x: 220, y: 215 },
            { x: 200, y: 215 },
            { x: 200, y: 245 },
            { x: 220, y: 245 },
            { x: 220, y: 172.5 },
            { x: 380, y: 172.5 },
            { x: 380, y: 55 },
            { x: 780, y: 55 },
            { x: 780, y: 175 },
            { x: 955, y: 175 }, // HKC.west
          ],
        },
      ],
    } as unknown as LayoutData;
    const { rebuilt } = rebuildPathologicalLabelEdges(data, { bendThresholdHigh: 8 });
    expect(rebuilt).toBe(1);
    const e = data.edges[0] as any;
    // New polyline: USC.east → HKC.west direct L (or straight).
    const pts = e.points as { x: number; y: number }[];
    expect(pts.length).toBeLessThanOrEqual(4);
    // First point on USC.east (x=755).
    expect(pts[0].x).toBeCloseTo(755, 1);
    // Last point on HKC.west (x=955).
    expect(pts[pts.length - 1].x).toBeCloseTo(955, 1);
    // Bend count <= 2.
    let bends = 0;
    for (let i = 1; i < pts.length - 1; i++) {
      const d1x = pts[i].x - pts[i - 1].x;
      const d1y = pts[i].y - pts[i - 1].y;
      const d2x = pts[i + 1].x - pts[i].x;
      const d2y = pts[i + 1].y - pts[i].y;
      if (Math.abs(d1x * d2y - d1y * d2x) > 1e-6) {
        bends++;
      }
    }
    expect(bends).toBeLessThanOrEqual(2);
    // Label relocated to somewhere near the midpoint of the new path.
    expect(e.x).toBeGreaterThan(750);
    expect(e.x).toBeLessThan(960);
  });

  it('no-op when obstacle blocks all direct and detour rebuilds', () => {
    // Same USC and HKC, but a FULL-HEIGHT blocker that covers every
    // possible detour y in the USC↔HKC horizontal channel.
    const USC = makeNode('USCompany', 695, 130);
    const HKC = makeNode('HongKongCompany', 1015, 160);
    // Blocker height 400 → y=[-55, 345] spans all reasonable detour y values.
    const Blocker = makeNode('Blocker', 855, 145, 80, 400);
    const data = {
      nodes: [USC, HKC, Blocker],
      edges: [
        {
          id: 'e1',
          start: 'USCompany',
          end: 'HongKongCompany',
          x: 140,
          y: 230,
          width: 100,
          height: 20,
          points: Array.from({ length: 16 }, (_, i) => ({
            x: 635 + i * 20,
            y: 145 + (i % 2) * 30,
          })),
        },
      ],
    } as unknown as LayoutData;
    // Force pts[0] and pts[n-1] to W-side ports.
    (data.edges[0] as any).points[0] = { x: 635, y: 145 };
    (data.edges[0] as any).points[(data.edges[0] as any).points.length - 1] = { x: 955, y: 175 };
    const { rebuilt } = rebuildPathologicalLabelEdges(data, { bendThresholdHigh: 8 });
    expect(rebuilt).toBe(0);
  });

  it('iter-44: rebuilt polyline preserves Kandinsky bend-or-end at both ports (horizontal E/W case)', () => {
    // USC at (695,100)-(755,160); HKC at (955,120)-(1075,200). W/W ports trigger rebuild → newStart='E', end='W'.
    // Blocker at (815,120)-(895,175) blocks L candidate 1 at y=130 AND L candidate 2 at y=160, forcing a detour.
    const USC = makeNode('USCompany', 695, 130);
    const HKC = makeNode('HongKongCompany', 1015, 160);
    const Blocker = makeNode('Blocker', 855, 147.5, 80, 55); // y=[120,175]
    const data = {
      nodes: [USC, HKC, Blocker],
      edges: [
        {
          id: 'L_USC_HKC',
          start: 'USCompany',
          end: 'HongKongCompany',
          x: 140,
          y: 230,
          width: 100,
          height: 20,
          points: [
            { x: 635, y: 130 }, // USC.west (W port)
            ...Array.from({ length: 14 }, (_, i) => ({
              x: 635 + i * 20,
              y: 130 + (i % 2) * 30,
            })),
            { x: 955, y: 160 }, // HKC.west (W port)
          ],
        },
      ],
    } as unknown as LayoutData;
    const { rebuilt } = rebuildPathologicalLabelEdges(data, { bendThresholdHigh: 8 });
    expect(rebuilt).toBe(1);
    const e = data.edges[0] as any;
    const pts = e.points as { x: number; y: number }[];

    // First port (USC.east) is horizontal → first segment MUST be horizontal (Kandinsky bend-or-end).
    expect(pts[0].x).toBeCloseTo(755, 1);
    expect(pts[0].y).toBeCloseTo(130, 1);
    const firstSegDx = pts[1].x - pts[0].x;
    const firstSegDy = pts[1].y - pts[0].y;
    expect(Math.abs(firstSegDy)).toBeLessThan(1e-6); // horizontal
    expect(firstSegDx).toBeGreaterThan(0); // outward from E port = +X

    // Last port (HKC.west) is horizontal → last segment MUST be horizontal (Kandinsky bend-or-end).
    const n = pts.length;
    expect(pts[n - 1].x).toBeCloseTo(955, 1);
    expect(pts[n - 1].y).toBeCloseTo(160, 1);
    const lastSegDx = pts[n - 1].x - pts[n - 2].x;
    const lastSegDy = pts[n - 1].y - pts[n - 2].y;
    expect(Math.abs(lastSegDy)).toBeLessThan(1e-6); // horizontal
    expect(lastSegDx).toBeGreaterThan(0); // entering W port from -X side = +X segment direction

    // No vertical segment should hug source or target east/west border (stub moves columns outward).
    for (let i = 0; i < pts.length - 1; i++) {
      const dx = pts[i + 1].x - pts[i].x;
      const dy = pts[i + 1].y - pts[i].y;
      if (Math.abs(dx) < 1e-6 && Math.abs(dy) > 1e-6) {
        // vertical segment
        expect(pts[i].x).not.toBeCloseTo(755, 1); // not on USC.east
        expect(pts[i].x).not.toBeCloseTo(955, 1); // not on HKC.west
      }
    }
  });

  it('no-op when label anchor is NOT on the opposite side', () => {
    // Same wraparound but label between the two nodes — genuine same-side
    // preference, not a pathological mis-placement.
    const USC = makeNode('USCompany', 695, 130);
    const HKC = makeNode('HongKongCompany', 1015, 160);
    const data = {
      nodes: [USC, HKC],
      edges: [
        {
          id: 'e1',
          start: 'USCompany',
          end: 'HongKongCompany',
          x: 850, // between USC and HKC
          y: 145,
          width: 50,
          height: 20,
          points: Array.from({ length: 16 }, (_, i) => ({
            x: 635 + i * 20,
            y: 145,
          })),
        },
      ],
    } as unknown as LayoutData;
    (data.edges[0] as any).points[0] = { x: 635, y: 145 };
    (data.edges[0] as any).points[(data.edges[0] as any).points.length - 1] = { x: 955, y: 175 };
    const { rebuilt } = rebuildPathologicalLabelEdges(data, { bendThresholdHigh: 8 });
    expect(rebuilt).toBe(0);
  });
});
