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

describe('Option B segmentKey robustness', () => {
  it('groups overlapping collinear segments into the same bundle corridor key', () => {
    // Two edges that share the same vertical corridor line (same x), but with different spans.
    // With a strict (x,a,b) key they would not bundle; we want them to share a corridor key.
    const A1 = mkNode('A1', 0, 0);
    const B1 = mkNode('B1', 200, 100);
    const A2 = mkNode('A2', 0, 10);
    const B2 = mkNode('B2', 200, 90);

    const e1 = mkEdge('e1', 'A1', 'B1', [
      { x: 0, y: 0 },
      { x: 50, y: 0 },
      { x: 50, y: 100 },
      { x: 200, y: 100 },
    ]);
    const e2 = mkEdge('e2', 'A2', 'B2', [
      { x: 0, y: 10 },
      { x: 50, y: 10 },
      { x: 50, y: 90 },
      { x: 200, y: 90 },
    ]);

    const data: LayoutData = { nodes: [A1, B1, A2, B2], edges: [e1, e2], config: {} as any };
    const { bundleOrder } = postProcessDomusOptionBMilestone1(data, {
      spacing: 10,
      snapEps: 0,
      segmentKeySnap: 1,
    });

    const keysWithBoth = [...bundleOrder.entries()].filter(
      ([k, ids]) => k.startsWith('V:') && ids.includes('e1') && ids.includes('e2')
    );
    expect(keysWithBoth.length).toBeGreaterThan(0);
  });
});
