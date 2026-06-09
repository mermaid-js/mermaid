import { describe, it, expect } from 'vitest';
import type { LayoutData, Node, Edge } from '../../../types.js';
import { postProcessDomusOptionBMilestone1 } from './postprocess.js';

interface Point {
  x: number;
  y: number;
}

function mkNode(id: string, x: number, y: number, width = 60, height = 60): Node {
  return { id, x, y, width, height, isGroup: false } as Node;
}

function mkEdge(id: string, start: string, end: string, points: Point[]): Edge {
  return { id, start, end, type: 'arrow', points } as Edge;
}

describe('Option B bundle ordering (Milestone 2)', () => {
  it('orders a shared vertical corridor by local turn geometry (reduces braiding)', () => {
    // Two edges share the same vertical corridor at x=50, but swap left/right turns
    // between top and bottom. A purely edgeId-based ordering is unstable; we want
    // ordering to reflect local entry/exit geometry.
    const A = mkNode('A', 0, 0);
    const B = mkNode('B', 200, 100);
    const C = mkNode('C', 200, 10);
    const D = mkNode('D', 0, 90);

    const e1 = mkEdge('z', 'A', 'B', [
      { x: 0, y: 0 }, // left of corridor
      { x: 50, y: 0 },
      { x: 50, y: 100 },
      { x: 200, y: 100 }, // right of corridor
    ]);
    const e2 = mkEdge('a', 'C', 'D', [
      { x: 200, y: 10 }, // right of corridor
      { x: 50, y: 10 },
      { x: 50, y: 90 },
      { x: 0, y: 90 }, // left of corridor
    ]);

    const data: LayoutData = { nodes: [A, B, C, D], edges: [e1, e2], config: {} as any };
    const { bundleOrder } = postProcessDomusOptionBMilestone1(data, {
      spacing: 10,
      snapEps: 0,
      segmentKeySnap: 1,
    });

    const verticalKeys = [...bundleOrder.keys()].filter((k) => k.startsWith('V:50'));
    expect(verticalKeys.length).toBeGreaterThan(0);
    const key = verticalKeys[0];
    const order = bundleOrder.get(key)!;
    // Expect e1 to come before e2 because its top neighbor x (40) is left of e2's (60).
    expect(order[0]).toBe('z');
    expect(order[1]).toBe('a');
  });
});
