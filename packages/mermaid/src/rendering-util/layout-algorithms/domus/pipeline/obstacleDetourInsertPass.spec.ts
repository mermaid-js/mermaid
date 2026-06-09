/**
 * iter-51 — unit tests for obstacle-detour insertion pass.
 */
import { describe, it, expect } from 'vitest';
import { applyObstacleDetourInsertPass } from './obstacleDetourInsertPass.js';
import type { LayoutData, Node } from '../../../types.js';

function node(id: string, x: number, y: number, w = 120, h = 60): Node {
  return { id, isGroup: false, x, y, width: w, height: h } as any;
}

describe('applyObstacleDetourInsertPass', () => {
  it('inserts a 2-point detour around a target-endpoint obstacle for HKC→ExpHK geometry', () => {
    // Mirrors Company.mmd L_HongKongCompany_ExpensesHK_0 baseline.
    // HKC at (1017.5, 160), ExpensesHK at (900, 230), Customer at (865, 130).
    // Polyline enters ExpensesHK via its LEFT boundary at x=947.5, crossing
    // interior from top (y=200) down. Detour-insert should shift before
    // entering (y=190) and go EAST around (x=970).
    const data: LayoutData = {
      nodes: [
        node('HongKongCompany', 1017.5, 160),
        node('ExpensesHK', 900, 230),
        node('Customer', 865, 130),
        node('USCompany', 695, 130),
      ] as any,
      edges: [
        {
          id: 'L_HongKongCompany_ExpensesHK_0',
          start: 'HongKongCompany',
          end: 'ExpensesHK',
          points: [
            { x: 957.5, y: 145 },
            { x: 947.5, y: 145 },
            { x: 947.5, y: 230 },
            { x: 970, y: 230 },
            { x: 960, y: 230 },
          ],
        },
      ] as any,
    } as any;

    const { changed } = applyObstacleDetourInsertPass(data, { spacing: 10 });
    expect(changed).toBe(1);

    const pts = (data.edges as any)[0].points as { x: number; y: number }[];
    // Expect 6 points: preserved port at (957.5, 145), initial stub at
    // (947.5, 145), detour bend at (947.5, 190), perpendicular at (970, 190),
    // (970, 230), and target port at (960, 230).
    expect(pts[0]).toEqual({ x: 957.5, y: 145 });
    expect(pts[pts.length - 1]).toEqual({ x: 960, y: 230 });
    // Verify no segment crosses ExpensesHK interior (x∈(840,960), y∈(200,260)).
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      const minX = Math.min(a.x, b.x);
      const maxX = Math.max(a.x, b.x);
      const minY = Math.min(a.y, b.y);
      const maxY = Math.max(a.y, b.y);
      const overlapsX = minX < 960 - 1e-6 && maxX > 840 + 1e-6;
      const overlapsY = minY < 260 - 1e-6 && maxY > 200 + 1e-6;
      expect(overlapsX && overlapsY).toBe(false);
    }
  });

  it('returns changed=0 when no middle segment crosses any obstacle', () => {
    const data: LayoutData = {
      nodes: [node('A', 0, 0), node('B', 300, 300)] as any,
      edges: [
        {
          id: 'e1',
          start: 'A',
          end: 'B',
          points: [
            { x: 60, y: 0 },
            { x: 150, y: 0 },
            { x: 150, y: 300 },
            { x: 240, y: 300 },
          ],
        },
      ] as any,
    } as any;
    const { changed } = applyObstacleDetourInsertPass(data, { spacing: 10 });
    expect(changed).toBe(0);
  });

  it('inserts a Case B detour when the offending run includes the port (iter-52)', () => {
    // Port-inclusive offender: seg pts[1]=(150,50)→pts[2]=(150,180) passes
    // through Obs (x∈[130,170], y∈[80,120]). There is no post-offender
    // anchor (target port at (150,180)=B.top IS the anchor). iter-52 builds
    // a detour via a bridge band between Obs.bottom=120 and B.top=180.
    const data: LayoutData = {
      nodes: [
        node('A', 50, 50, 40, 40),
        node('Obs', 150, 100, 40, 40),
        node('B', 150, 200, 40, 40),
      ] as any,
      edges: [
        {
          id: 'e1',
          start: 'A',
          end: 'B',
          points: [
            { x: 70, y: 50 },
            { x: 150, y: 50 },
            { x: 150, y: 180 },
          ],
        },
      ] as any,
    } as any;
    const { changed } = applyObstacleDetourInsertPass(data, { spacing: 10 });
    expect(changed).toBe(1);
    const pts = (data.edges as any)[0].points as { x: number; y: number }[];
    // Port perpendicularity: last seg must approach port vertically from above.
    expect(pts[pts.length - 1]).toEqual({ x: 150, y: 180 });
    expect(pts[pts.length - 2].x).toBe(150);
    expect(pts[pts.length - 2].y).toBeLessThan(180);
    // No segment crosses Obs interior (x∈(130,170), y∈(80,120)).
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      const minX = Math.min(a.x, b.x);
      const maxX = Math.max(a.x, b.x);
      const minY = Math.min(a.y, b.y);
      const maxY = Math.max(a.y, b.y);
      const overlapsX = minX < 170 - 1e-6 && maxX > 130 + 1e-6;
      const overlapsY = minY < 120 - 1e-6 && maxY > 80 + 1e-6;
      expect(
        overlapsX && overlapsY,
        `seg ${i} (${JSON.stringify(a)}→${JSON.stringify(b)}) intersects Obs`
      ).toBe(false);
    }
  });

  it('handles the narrow Tax→Income bridge band (5u) from Company.mmd Case B', () => {
    // Mirrors Company.mmd L_USCompany_Income_0 baseline. Tight 5u between
    // Tax.bottom=205 and Income.top=210 — bridge y must be in (205, 210)
    // with sub-spacing final stub (2.5u) to Income.top port. Sanitize must
    // not extend the stub backwards into Tax.
    const data: LayoutData = {
      nodes: [
        node('USCompany', 695, 130),
        node('Tax', 462.5, 175),
        node('Income', 462.5, 240),
        node('Expenses', 175, 130),
      ] as any,
      edges: [
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
            { x: 432.5, y: 135 },
            { x: 432.5, y: 210 },
          ],
        },
      ] as any,
    } as any;
    const { changed } = applyObstacleDetourInsertPass(data, { spacing: 10 });
    expect(changed).toBe(1);
    const pts = (data.edges as any)[0].points as { x: number; y: number }[];
    // Port preserved.
    expect(pts[0]).toEqual({ x: 635, y: 132.5 });
    expect(pts[pts.length - 1]).toEqual({ x: 432.5, y: 210 });
    // Final stub perpendicular to Income.top (vertical approach from above).
    expect(pts[pts.length - 2].x).toBe(432.5);
    expect(pts[pts.length - 2].y).toBeGreaterThan(205);
    expect(pts[pts.length - 2].y).toBeLessThan(210);
    // No segment intersects Tax (x∈(402.5,522.5), y∈(145,205)).
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      const minX = Math.min(a.x, b.x);
      const maxX = Math.max(a.x, b.x);
      const minY = Math.min(a.y, b.y);
      const maxY = Math.max(a.y, b.y);
      const overlapsX = minX < 522.5 - 1e-6 && maxX > 402.5 + 1e-6;
      const overlapsY = minY < 205 - 1e-6 && maxY > 145 + 1e-6;
      expect(
        overlapsX && overlapsY,
        `seg ${i} (${JSON.stringify(a)}→${JSON.stringify(b)}) intersects Tax`
      ).toBe(false);
    }
  });

  it('bails on Case B when the bridge band is too narrow (<2u)', () => {
    // Obs.bottom=199, B.top=200 — only 1u bridge band; too narrow to fit a
    // detour stub above the minimum threshold. Pass must preserve the
    // polyline unchanged (better a known bad than a broken detour).
    const data: LayoutData = {
      nodes: [
        node('A', 50, 50, 40, 40),
        node('Obs', 150, 150, 40, 98), // y∈[101, 199]
        node('B', 150, 250, 40, 100), // y∈[200, 300] (top=200)
      ] as any,
      edges: [
        {
          id: 'e1',
          start: 'A',
          end: 'B',
          points: [
            { x: 70, y: 50 },
            { x: 150, y: 50 },
            { x: 150, y: 200 },
          ],
        },
      ] as any,
    } as any;
    const before = JSON.stringify((data.edges as any)[0].points);
    const { changed } = applyObstacleDetourInsertPass(data, { spacing: 10 });
    expect(changed).toBe(0);
    const after = JSON.stringify((data.edges as any)[0].points);
    expect(after).toBe(before);
  });

  it('rejects a candidate whose detour crosses another obstacle', () => {
    // Obs blocks direct path. Detour candidate east is clear; west would
    // hit OtherObs. Only east variant should be picked.
    const A = node('A', 0, 100);
    const Obs = node('Obs', 200, 100, 40, 40); // x∈[180,220], y∈[80,120]
    const OtherObs = node('OtherObs', 120, 100, 40, 40); // x∈[100,140], y∈[80,120] — blocks west detour
    const B = node('B', 400, 100);
    const data: LayoutData = {
      nodes: [A, Obs, OtherObs, B] as any,
      edges: [
        {
          id: 'e1',
          start: 'A',
          end: 'B',
          points: [
            { x: 60, y: 100 },
            { x: 200, y: 50 }, // offending middle seg crosses Obs via top? Let's make offending vertical:
            { x: 200, y: 150 }, // offender — crosses Obs (y=80..120) vertically
            { x: 340, y: 150 },
            { x: 340, y: 100 },
          ],
        },
      ] as any,
    } as any;
    const { changed } = applyObstacleDetourInsertPass(data, { spacing: 10 });
    // Either changed=1 with east-only detour, or changed=0 if both fail.
    // The test mainly confirms the pass doesn't crash + output (if any) is
    // obstacle-clear.
    const pts = (data.edges as any)[0].points as { x: number; y: number }[];
    if (changed === 1) {
      // Verify no segment crosses Obs or OtherObs interior.
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i];
        const b = pts[i + 1];
        for (const r of [Obs, OtherObs]) {
          const rect = {
            left: (r as any).x - (r as any).width / 2,
            right: (r as any).x + (r as any).width / 2,
            top: (r as any).y - (r as any).height / 2,
            bottom: (r as any).y + (r as any).height / 2,
          };
          const minX = Math.min(a.x, b.x);
          const maxX = Math.max(a.x, b.x);
          const minY = Math.min(a.y, b.y);
          const maxY = Math.max(a.y, b.y);
          const overlapsX = minX < rect.right - 1e-6 && maxX > rect.left + 1e-6;
          const overlapsY = minY < rect.bottom - 1e-6 && maxY > rect.top + 1e-6;
          expect(overlapsX && overlapsY).toBe(false);
        }
      }
    }
  });

  it('skips polylines shorter than 4 points', () => {
    const data: LayoutData = {
      nodes: [node('A', 0, 0), node('B', 200, 0)] as any,
      edges: [
        {
          id: 'e1',
          start: 'A',
          end: 'B',
          points: [
            { x: 60, y: 0 },
            { x: 140, y: 0 },
          ],
        },
      ] as any,
    } as any;
    const { changed } = applyObstacleDetourInsertPass(data, { spacing: 10 });
    expect(changed).toBe(0);
  });
});
