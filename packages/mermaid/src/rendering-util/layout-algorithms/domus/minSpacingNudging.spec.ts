import { describe, it, expect } from 'vitest';
import type { LayoutData, Node } from '../../types.js';
import { rectForNode } from './core/helpers.js';
import { nudgeLeafNodesForMinimumSpacing } from './minSpacingNudging.js';

function mkNode(id: string, x: number, y: number, w: number, h: number): Node {
  return { id, x, y, width: w, height: h, isGroup: false } as any;
}

describe('minimum spacing nudging', () => {
  it('increases horizontal gap when boxes overlap in Y but are too close in X', () => {
    const A = mkNode('A', 0, 0, 100, 40);
    // Place B to the right with gap 2 (too small).
    const rA = rectForNode(A);
    const B = mkNode('B', rA.right + 2 + 50, 0, 100, 40); // x here is center; we’ll recompute below.
    // Fix B center so its left is A.right + 2
    const wB = 100;
    (B as any).x = rA.right + 2 + wB / 2;

    const data: LayoutData = { nodes: [A, B], edges: [], config: {} as any };
    const minGap = 20;
    const res = nudgeLeafNodesForMinimumSpacing(data, { minGap, maxIterations: 10 });
    expect(res.changed).toBe(true);

    const rA2 = rectForNode(A);
    const rB2 = rectForNode(B);
    const gap = rB2.left - rA2.right;
    expect(gap).toBeGreaterThanOrEqual(minGap - 1e-6);
  });
});
