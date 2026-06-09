import { describe, it, expect } from 'vitest';
import type { LayoutData, Node, Edge } from '../../../types.js';
import { postProcessDomusOptionBMilestone1 } from './postprocess.js';
import { rectForNode } from '../core/helpers.js';

interface Point {
  x: number;
  y: number;
}

function mkNode(id: string, x: number, y: number, width = 80, height = 60): Node {
  return { id, x, y, width, height, isGroup: false } as Node;
}

function mkEdge(id: string, start: string, end: string, points: Point[]): Edge {
  return { id, start, end, type: 'arrow', points } as Edge;
}

describe('Milestone 3 balanced nudging (component δ)', () => {
  it('spreads lanes beyond δ_min when there is extra room between barriers', () => {
    const spacing = 10; // δ_min
    // Two big obstacles create a wide corridor in between.
    const Left = mkNode('L', -200, 0, 120, 400);
    const Right = mkNode('R', 200, 0, 120, 400);
    // Two edges share a vertical corridor inside the gap.
    // Choose node centers so the provided endpoints are already on their borders,
    // preventing endpoint clipping/port distribution from changing the intended corridor geometry.
    const A = mkNode('A', -440, -100);
    const B = mkNode('B', 440, 100);
    const C = mkNode('C', -440, -90);
    const D = mkNode('D', 440, 90);

    const e1 = mkEdge('e1', 'A', 'B', [
      { x: -400, y: -100 }, // A right border
      { x: 0, y: -100 },
      { x: 0, y: 100 },
      { x: 400, y: 100 }, // B left border
    ]);
    const e2 = mkEdge('e2', 'C', 'D', [
      { x: -400, y: -90 }, // C right border
      { x: 0, y: -90 },
      { x: 0, y: 90 },
      { x: 400, y: 90 }, // D left border
    ]);

    const data: LayoutData = {
      nodes: [Left, Right, A, B, C, D],
      edges: [e1, e2],
      config: {} as any,
    };
    postProcessDomusOptionBMilestone1(data, { spacing, snapEps: 0, segmentKeySnap: 1 });

    const rL = rectForNode(Left);
    const rR = rectForNode(Right);
    const corridorX = (e: Edge): number => {
      const pts = e.points as Point[];
      let bestLen = -1;
      let bestX = 0;
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i];
        const b = pts[i + 1];
        if (a.x === b.x) {
          const len = Math.abs(a.y - b.y);
          const inCorridor = a.x > rL.right && a.x < rR.left;
          if (!inCorridor) {
            continue;
          }
          if (len > bestLen || (len === bestLen && Math.abs(a.x) < Math.abs(bestX))) {
            bestLen = len;
            bestX = a.x;
          }
        }
      }
      return bestLen >= 0 ? bestX : 0;
    };

    const x1 = corridorX(e1);
    const x2 = corridorX(e2);
    const dx = Math.abs(x1 - x2);

    // Must be at least δ_min, and in a wide corridor we expect it to be noticeably larger.
    expect(dx).toBeGreaterThanOrEqual(spacing - 0.5);
    expect(dx).toBeGreaterThan(spacing + 2);
  });
});
