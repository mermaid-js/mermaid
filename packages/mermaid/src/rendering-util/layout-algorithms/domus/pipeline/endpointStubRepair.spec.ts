import { describe, expect, it } from 'vitest';
import type { LayoutData, Node } from '../../../types.js';
import { repairShortEndpointStubs } from './endpointStubRepair.js';

describe('repairShortEndpointStubs', () => {
  it('extends a direction-correct final stub that is shorter than the validator threshold', () => {
    const A: Node = { id: 'A', isGroup: false, x: 80, y: 100, width: 40, height: 40 };
    const B: Node = { id: 'B', isGroup: false, x: 200, y: 100, width: 40, height: 40 };
    const data = {
      nodes: [A, B],
      edges: [
        {
          id: 'A_B',
          start: 'A',
          end: 'B',
          points: [
            { x: 100, y: 100 },
            { x: 176, y: 100 },
            { x: 176, y: 70 },
            { x: 176, y: 100 },
            { x: 180, y: 100 },
          ],
        },
      ],
    } as unknown as LayoutData;

    const result = repairShortEndpointStubs(data, { minLength: 10 });

    expect(result.repaired).toBe(1);
    const pts = (data.edges[0] as { points: { x: number; y: number }[] }).points;
    expect(pts.at(-1)).toEqual({ x: 180, y: 100 });
    expect(pts.at(-2)).toEqual({ x: 170, y: 100 });
  });

  it('does not change two-point straight edges', () => {
    const A: Node = { id: 'A', isGroup: false, x: 80, y: 100, width: 40, height: 40 };
    const B: Node = { id: 'B', isGroup: false, x: 200, y: 100, width: 40, height: 40 };
    const data = {
      nodes: [A, B],
      edges: [
        {
          id: 'A_B',
          start: 'A',
          end: 'B',
          points: [
            { x: 100, y: 100 },
            { x: 180, y: 100 },
          ],
        },
      ],
    } as unknown as LayoutData;

    const result = repairShortEndpointStubs(data, { minLength: 10 });

    expect(result.repaired).toBe(0);
    expect((data.edges[0] as { points: unknown[] }).points).toHaveLength(2);
  });

  it('extends the edge-types R2->C start stub without moving the port', () => {
    const R2: Node = {
      id: 'R2',
      isGroup: false,
      x: 406.3046875,
      y: 390,
      width: 49.90625,
      height: 45,
    };
    const C: Node = {
      id: 'C',
      isGroup: false,
      x: 315.625,
      y: 310,
      width: 42.125,
      height: 45,
    };
    const data = {
      nodes: [R2, C],
      edges: [
        {
          id: 'L_R2_C_0',
          start: 'R2',
          end: 'C',
          points: [
            { x: 381.3515625, y: 390 },
            { x: 373.59375, y: 390 },
            { x: 373.59375, y: 317.875 },
            { x: 336.6875, y: 317.875 },
          ],
        },
      ],
    } as unknown as LayoutData;

    const result = repairShortEndpointStubs(data, { minLength: 10 });

    expect(result.repaired).toBe(1);
    const pts = (data.edges[0] as { points: { x: number; y: number }[] }).points;
    expect(pts[0]).toEqual({ x: 381.3515625, y: 390 });
    expect(pts[1]).toEqual({ x: 371.3515625, y: 390 });
  });

  it('slides an end port along its side to remove a short parallel band', () => {
    const B2: Node = {
      id: 'B2',
      isGroup: true,
      x: 88.3671875,
      y: 135,
      width: 158.859375,
      height: 245,
    } as unknown as Node;
    const X: Node = {
      id: 'X',
      isGroup: false,
      x: 213.078125,
      y: 140,
      width: 41.34375,
      height: 45,
    };
    const data = {
      nodes: [B2, X],
      edges: [
        {
          id: 'L_B2_X_0',
          start: 'B2',
          end: 'X',
          points: [
            { x: 167.796875, y: 135 },
            { x: 177.796875, y: 135 },
            { x: 177.796875, y: 140 },
            { x: 192.40625, y: 140 },
          ],
        },
      ],
    } as unknown as LayoutData;

    const result = repairShortEndpointStubs(data, { minLength: 10 });

    expect(result.repaired).toBe(1);
    const pts = (data.edges[0] as { points: { x: number; y: number }[] }).points;
    expect(pts).toEqual([
      { x: 167.796875, y: 135 },
      { x: 192.40625, y: 135 },
    ]);
  });

  it('moves a too-close end-side parallel band outward from the target node', () => {
    const USC: Node = {
      id: 'USCompany',
      isGroup: false,
      x: 323.87109375,
      y: 220,
      width: 111.3671875,
      height: 45,
    };
    const HKC: Node = {
      id: 'HongKongCompany',
      isGroup: false,
      x: 323.87109375,
      y: 135,
      width: 158.0859375,
      height: 45,
    };
    const data = {
      nodes: [USC, HKC],
      edges: [
        {
          id: 'L_USCompany_HongKongCompany_0',
          start: 'USCompany',
          end: 'HongKongCompany',
          points: [
            { x: 268.1875, y: 220 },
            { x: 240.828125, y: 220 },
            { x: 234.828125, y: 220 },
            { x: 234.828125, y: 148.5 },
            { x: 244.828125, y: 148.5 },
          ],
        },
      ],
    } as unknown as LayoutData;

    const result = repairShortEndpointStubs(data, { minLength: 10 });

    expect(result.repaired).toBe(1);
    const pts = (data.edges[0] as { points: { x: number; y: number }[] }).points;
    expect(pts.at(-1)).toEqual({ x: 244.828125, y: 148.5 });
    expect(pts.at(-2)).toEqual({ x: 224.828125, y: 148.5 });
    expect(pts.at(-3)).toEqual({ x: 224.828125, y: 220 });
  });
});
