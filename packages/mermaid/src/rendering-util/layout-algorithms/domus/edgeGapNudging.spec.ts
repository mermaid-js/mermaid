import { describe, it, expect } from 'vitest';
import type { LayoutData, Node, Edge } from '../../types.js';
import { rectForNode } from './core/helpers.js';
import { nudgeConnectedPairsForMinGap } from './edgeGapNudging.js';

function mkNode(id: string, x: number, y: number, w: number, h: number): Node {
  return { id, x, y, width: w, height: h, isGroup: false } as any;
}

function mkEdge(id: string, start: string, end: string): Edge {
  return { id, start, end, type: 'arrow' } as any;
}

describe('edge gap nudging', () => {
  it('enforces minimum horizontal gap for directly connected nodes that overlap in Y', () => {
    const A = mkNode('A', 0, 0, 100, 40);
    const rA = rectForNode(A);
    const B = mkNode('B', rA.right + 5 + 50, 0, 100, 40);
    (B as any).x = rA.right + 5 + 100 / 2; // gap=5

    const data: LayoutData = { nodes: [A, B], edges: [mkEdge('e1', 'A', 'B')], config: {} as any };
    nudgeConnectedPairsForMinGap(data, { minGap: 40, preferAxis: 'x' });

    const rA2 = rectForNode(A);
    const rB2 = rectForNode(B);
    const gap = rB2.left - rA2.right;
    expect(gap).toBeGreaterThanOrEqual(40 - 1e-6);
  });

  it('still increases the gap when the endpoints are reversed left/right', () => {
    const A = mkNode('A', 200, 0, 100, 40);
    const B = mkNode('B', 0, 0, 100, 40);
    // Make them too close with B on the left, A on the right.
    const rB = rectForNode(B);
    (A as any).x = rB.right + 5 + 100 / 2; // gap=5

    const data: LayoutData = { nodes: [A, B], edges: [mkEdge('e1', 'A', 'B')], config: {} as any };
    nudgeConnectedPairsForMinGap(data, { minGap: 40, preferAxis: 'x' });

    const rA2 = rectForNode(A);
    const rB2 = rectForNode(B);
    const gap = Math.max(rA2.left - rB2.right, rB2.left - rA2.right);
    expect(gap).toBeGreaterThanOrEqual(40 - 1e-6);
  });
});
