import { describe, expect, it } from 'vitest';
import type { LayoutData, Node } from '../../../types.js';
import { snapEndpointsToBoundaries } from './snapEndpointsToBoundaries.js';

describe('snapEndpointsToBoundaries', () => {
  it('snaps both endpoints of a vertical edge whose ports sit 0.5 px inside their obstacles, then collapses redundant mid-bends (L_K_L_0 shape)', () => {
    const K: Node = {
      id: 'K',
      isGroup: false,
      x: 50,
      y: 315,
      width: 161.96875,
      height: 45,
    };
    const L: Node = {
      id: 'L',
      isGroup: false,
      x: 50,
      y: 77,
      width: 92.921875,
      height: 45,
    };
    const data = {
      nodes: [K, L],
      edges: [
        {
          id: 'L_K_L_0',
          start: 'K',
          end: 'L',
          points: [
            { x: 50, y: 293 }, // 0.5 inside K (K.top = 292.5)
            { x: 50, y: 159.5 }, // redundant mid-bend, all collinear
            { x: 50, y: 100 }, // 0.5 inside L (L.bottom = 99.5)
          ],
        },
      ],
    } as unknown as LayoutData;

    const result = snapEndpointsToBoundaries(data, { tolerance: 1.5 });

    expect(result.snapped).toBe(2);
    const pts = (data.edges[0] as { points: { x: number; y: number }[] }).points;
    expect(pts).toEqual([
      { x: 50, y: 292.5 },
      { x: 50, y: 99.5 },
    ]);
  });

  it('snaps an end endpoint that is 0.44 px below a south side and co-snaps the adjacent bend so the last segment stays horizontal (L_D_F_0 shape)', () => {
    const D: Node = {
      id: 'D',
      isGroup: false,
      x: 383.53125,
      y: 834.0625,
      width: 151.0625,
      height: 151.0625,
    };
    const F: Node = {
      id: 'F',
      isGroup: false,
      x: 201.875,
      y: 761.0625,
      width: 154.171875,
      height: 45,
    };
    const data = {
      nodes: [D, F],
      edges: [
        {
          id: 'L_D_F_0',
          start: 'D',
          end: 'F',
          points: [
            { x: 308, y: 834.0625 }, // already on D.left
            { x: 201.875, y: 834.0625 },
            { x: 201.875, y: 784 }, // 0.44 below F.bottom = 783.5625
            { x: 200, y: 784 }, // 0.44 below F.bottom
          ],
        },
      ],
    } as unknown as LayoutData;

    const result = snapEndpointsToBoundaries(data, { tolerance: 1.5 });

    // Only the end endpoint moves (start was already on D.left). Adjacent
    // bend's y is co-snapped so the last segment stays horizontal.
    expect(result.snapped).toBe(1);
    const pts = (data.edges[0] as { points: { x: number; y: number }[] }).points;
    expect(pts.at(-1)).toEqual({ x: 200, y: 783.5625 });
    expect(pts.at(-2)).toEqual({ x: 201.875, y: 783.5625 });
  });

  it('does nothing when an endpoint already sits exactly on the boundary', () => {
    const A: Node = {
      id: 'A',
      isGroup: false,
      x: 100,
      y: 100,
      width: 80,
      height: 60,
    };
    const B: Node = {
      id: 'B',
      isGroup: false,
      x: 300,
      y: 100,
      width: 80,
      height: 60,
    };
    const data = {
      nodes: [A, B],
      edges: [
        {
          id: 'L_A_B_0',
          start: 'A',
          end: 'B',
          points: [
            { x: 140, y: 100 }, // exactly on A.right
            { x: 260, y: 100 }, // exactly on B.left
          ],
        },
      ],
    } as unknown as LayoutData;

    const result = snapEndpointsToBoundaries(data, { tolerance: 1.5 });

    expect(result.snapped).toBe(0);
    const pts = (data.edges[0] as { points: { x: number; y: number }[] }).points;
    expect(pts).toEqual([
      { x: 140, y: 100 },
      { x: 260, y: 100 },
    ]);
  });

  it('does nothing when the perpendicular distance exceeds the snap tolerance', () => {
    const A: Node = {
      id: 'A',
      isGroup: false,
      x: 100,
      y: 100,
      width: 80,
      height: 60,
    };
    const B: Node = {
      id: 'B',
      isGroup: false,
      x: 300,
      y: 100,
      width: 80,
      height: 60,
    };
    const data = {
      nodes: [A, B],
      edges: [
        {
          id: 'L_A_B_0',
          start: 'A',
          end: 'B',
          points: [
            { x: 145, y: 100 }, // 5 px past A.right (A.right = 140)
            { x: 260, y: 100 },
          ],
        },
      ],
    } as unknown as LayoutData;

    const result = snapEndpointsToBoundaries(data, { tolerance: 1.5 });

    expect(result.snapped).toBe(0);
    const pts = (data.edges[0] as { points: { x: number; y: number }[] }).points;
    expect(pts[0]).toEqual({ x: 145, y: 100 });
  });

  it('skips edges with fewer than 2 points (no-op)', () => {
    const A: Node = {
      id: 'A',
      isGroup: false,
      x: 100,
      y: 100,
      width: 80,
      height: 60,
    };
    const data = {
      nodes: [A],
      edges: [
        {
          id: 'self',
          start: 'A',
          end: 'A',
          points: [{ x: 140, y: 100 }],
        },
      ],
    } as unknown as LayoutData;

    const result = snapEndpointsToBoundaries(data, { tolerance: 1.5 });

    expect(result.snapped).toBe(0);
  });
});
