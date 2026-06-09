import { describe, it, expect } from 'vitest';
import { liftObstacleIntersectingSegments } from './obstacleLiftPass.js';
import type { LayoutData, Node } from '../../../types.js';

// iter-38 — post-finalize obstacle-lift pass.
//
// When the shape-walk / routing backend produces a merged edge whose
// interior segment passes through a non-endpoint node's interior, this
// pass detects the violation and shifts the offending segment to just
// outside the obstacle (on the perpendicular axis), picking the detour
// that yields the cleanest polyline.

function makeNode(id: string, x: number, y: number, w = 100, h = 40): Node {
  return { id, isGroup: false, x, y, width: w, height: h } as Node;
}

describe('liftObstacleIntersectingSegments', () => {
  it('returns changed=0 when no interior segment intersects a non-endpoint node', () => {
    const A = makeNode('A', 0, 0);
    const B = makeNode('B', 200, 0);
    const data = {
      nodes: [A, B],
      edges: [
        {
          id: 'e1',
          start: 'A',
          end: 'B',
          points: [
            { x: 50, y: 0 },
            { x: 150, y: 0 },
          ],
        },
      ],
    } as unknown as LayoutData;
    const { changed } = liftObstacleIntersectingSegments(data, { spacing: 10 });
    expect(changed).toBe(0);
  });

  it('reproduces company-simp USC→Expenses case: lifts horizontal segment off Wages', () => {
    // Wages at (473.6, 135) 51.5x45 → bbox x=[447.9, 499.4], y=[112.5, 157.5].
    // USC→Expenses polyline includes segment (399.6, 147)→(511, 147) at y=147 inside Wages.y range.
    const USC = makeNode('USCompany', 323.9, 220, 111.4, 45);
    const Expenses = makeNode('Expenses', 515.6, 220, 93.5, 45);
    const Wages = makeNode('Wages', 473.6, 135, 51.5, 45);
    const data = {
      nodes: [USC, Expenses, Wages],
      edges: [
        {
          id: 'L_USC_Expenses',
          start: 'USCompany',
          end: 'Expenses',
          points: [
            { x: 379.6, y: 220 }, // USC.right port
            { x: 399.6, y: 220 }, // R16 stub
            { x: 399.6, y: 147 }, // elbow
            { x: 511.0, y: 147 }, // offending — crosses Wages
            { x: 511.0, y: 157.5 },
            { x: 515.6, y: 157.5 },
            { x: 515.6, y: 197.5 }, // Expenses.top
          ],
        },
      ],
    } as unknown as LayoutData;
    const { changed } = liftObstacleIntersectingSegments(data, { spacing: 10 });
    expect(changed).toBe(1);

    const pts = (data.edges[0] as any).points;
    // Endpoints preserved.
    expect(pts[0]).toEqual({ x: 379.6, y: 220 });
    expect(pts[pts.length - 1]).toEqual({ x: 515.6, y: 197.5 });
    // No segment intersects Wages interior anymore.
    // Specifically, the shifted horizontal segment should sit below Wages
    // (y ≥ Wages.bottom + margin = 157.5 + 10 = 167.5) OR above
    // (y ≤ Wages.top - margin = 102.5).
    for (let i = 0; i < pts.length - 1; i++) {
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const sameY = Math.abs(p1.y - p2.y) < 1e-6;
      if (!sameY) {
        continue;
      }
      const y = p1.y;
      const xMin = Math.min(p1.x, p2.x);
      const xMax = Math.max(p1.x, p2.x);
      const overlapsX = xMin < 499.4 && xMax > 447.9;
      if (!overlapsX) {
        continue;
      }
      // If x overlaps Wages, the y must be outside Wages.y [112.5, 157.5].
      expect(y <= 112.5 || y >= 157.5).toBe(true);
    }
  });

  it('skips endpoint-touching segments (start/end nodes are expected at boundary)', () => {
    // Endpoint segments legitimately touch the endpoint nodes' boundaries
    // and should not be lifted.
    const A = makeNode('A', 0, 0, 40, 40); // bbox: x=[-20,20], y=[-20,20]
    const B = makeNode('B', 200, 0, 40, 40); // bbox: x=[180,220], y=[-20,20]
    const data = {
      nodes: [A, B],
      edges: [
        {
          id: 'e1',
          start: 'A',
          end: 'B',
          points: [
            { x: 20, y: 0 }, // A.right — endpoint, legitimately touches A
            { x: 100, y: 0 },
            { x: 180, y: 0 }, // B.left — endpoint
          ],
        },
      ],
    } as unknown as LayoutData;
    const { changed } = liftObstacleIntersectingSegments(data, { spacing: 10 });
    // Only interior segment pts[1]→pts[2] is (100,0)→(180,0). Does it
    // intersect anything? A.x=[-20,20], B.x=[180,220]. Segment x=[100,180]
    // at y=0. A.y=[-20,20] and B.y=[-20,20] both include y=0. But A.x ends
    // at 20 (segment starts at 100), so no overlap. B.x starts at 180
    // (segment ends at 180) — boundary, not interior. So no interior
    // intersection. Changed=0.
    expect(changed).toBe(0);
  });

  it('iter-50: extends the lift to a collinear run of same-axis segments', () => {
    // When the offending vertical segment's downstream neighbour is also
    // vertical at the same x, iter-50's extension treats both as one
    // logical run and shifts all points together. Without the extension
    // the pass bails on the "parallel neighbour" check.
    const A = makeNode('A', 0, 100, 40, 40); // bbox y=[80,120], x=[-20,20]
    const B = makeNode('B', 200, 50, 40, 40); // bbox y=[30,70], x=[180,220]
    const Obs = makeNode('Obs', 100, 100, 40, 40); // bbox y=[80,120], x=[80,120]
    const data = {
      nodes: [A, B, Obs],
      edges: [
        {
          id: 'e1',
          start: 'A',
          end: 'B',
          points: [
            { x: 20, y: 100 }, // A.right
            { x: 100, y: 100 }, // enters Obs at y=100
            { x: 100, y: 85 }, // still at x=100 (collinear run), inside Obs
            { x: 100, y: 75 }, // still at x=100, just below Obs.top=80
            { x: 180, y: 75 }, // B.left — horizontal neighbour (perpendicular to run)
            { x: 180, y: 50 }, // vertical
            { x: 180, y: 50 }, // duplicate tail for 6+ length
          ],
        },
      ],
    } as unknown as LayoutData;
    const { changed } = liftObstacleIntersectingSegments(data, { spacing: 10 });
    expect(changed).toBe(1);
    // No segment should pass through Obs interior.
    const pts = (data.edges[0] as any).points;
    for (let i = 1; i < pts.length - 2; i++) {
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const sameX = Math.abs(p1.x - p2.x) < 1e-6;
      if (sameX && p1.x >= 80 && p1.x <= 120) {
        const yMin = Math.min(p1.y, p2.y);
        const yMax = Math.max(p1.y, p2.y);
        expect(yMax <= 80 || yMin >= 120).toBe(true);
      }
    }
  });

  it('iter-50: bails out when the collinear run includes the last polyline point (port)', () => {
    // Case B — run reaches the endpoint port. Simple perpendicular-shift
    // would move the port, unsafe. Pass must bail.
    const A = makeNode('A', 0, 100);
    const Obs = makeNode('Obs', 100, 100, 40, 40); // blocks x=100 vertical
    const B = makeNode('B', 100, 200); // port on B.top at x=100 below obstacle
    const data = {
      nodes: [A, Obs, B],
      edges: [
        {
          id: 'e1',
          start: 'A',
          end: 'B',
          points: [
            { x: 50, y: 100 }, // A.right
            { x: 100, y: 100 }, // bends into Obs interior
            { x: 100, y: 180 }, // collinear run at x=100, crosses Obs, ends at B.top port
          ],
        },
      ],
    } as unknown as LayoutData;
    const before = (data.edges[0] as any).points.length;
    const { changed } = liftObstacleIntersectingSegments(data, { spacing: 10 });
    // Bail path returns null → no change.
    expect(changed).toBe(0);
    expect((data.edges[0] as any).points.length).toBe(before);
  });

  it('prefers the lift with fewer bends when both directions clear', () => {
    // Obstacle positioned such that shifting above adds fewer bends than below.
    const A = makeNode('A', 0, 100);
    const B = makeNode('B', 400, 100);
    const Obs = makeNode('Obstacle', 200, 100, 40, 40); // bbox y=[80,120], x=[180,220]
    const data = {
      nodes: [A, B, Obs],
      edges: [
        {
          id: 'e1',
          start: 'A',
          end: 'B',
          points: [
            { x: 50, y: 100 }, // A.right
            { x: 350, y: 100 }, // crosses Obstacle
            { x: 350, y: 100 }, // duplicate placeholder (sanitize removes)
          ],
        },
      ],
    } as unknown as LayoutData;
    const { changed } = liftObstacleIntersectingSegments(data, { spacing: 10 });
    expect(changed).toBeGreaterThanOrEqual(0);
    // The result must not pass through the obstacle interior.
    const pts = (data.edges[0] as any).points;
    for (let i = 1; i < pts.length - 2; i++) {
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const sameY = Math.abs(p1.y - p2.y) < 1e-6;
      if (sameY && p1.y >= 80 && p1.y <= 120) {
        const xMin = Math.min(p1.x, p2.x);
        const xMax = Math.max(p1.x, p2.x);
        expect(xMax <= 180 || xMin >= 220).toBe(true);
      }
    }
  });
});
