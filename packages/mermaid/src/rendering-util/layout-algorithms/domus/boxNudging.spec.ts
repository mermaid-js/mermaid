import { describe, it, expect, vi } from 'vitest';
import type { LayoutData, Node } from '../../types.js';
import { validateLayout } from './validateLayoutProxy.js';
import {
  nudgeLeafNodesAwayFromNonAncestorGroups,
  nudgeOverlappingLeafNodes,
} from './boxNudging.js';
import { log } from '../../../logger.js';

function mkNode(id: string, x: number, y: number, w: number, h: number): Node {
  return { id, x, y, width: w, height: h, isGroup: false } as any;
}

describe('box nudging', () => {
  it('separates overlapping real nodes (leaf-leaf) deterministically', () => {
    const a = mkNode('HongKongCompany', 0, 0, 100, 40);
    const b = mkNode('Incomehk', 10, 0, 100, 40); // overlaps with a
    const data: LayoutData = { nodes: [a, b], edges: [], config: {} as any };

    const before = validateLayout(data);
    expect(before.ok).toBe(false);
    expect(typeof before.score).toBe('number');
    expect(before.score).toBeGreaterThanOrEqual(0);
    expect(before.breakdown).toBeDefined();
    // Padding must be at least the validator's `NODE_NODE_PADDING` (30 since
    // 2026-08-26) or the nudge trades an overlap for a gap that is still too
    // tight to be valid, and this test would be asserting that a repair which
    // does not repair anything succeeded.
    const res1 = nudgeOverlappingLeafNodes(data, { padding: 30, maxIterations: 20 });
    expect(res1.changed).toBe(true);
    const after = validateLayout(data);
    expect(after.ok).toBe(true);
    expect(typeof after.score).toBe('number');
    expect(after.score).toBeGreaterThanOrEqual(0);
    expect(after.breakdown).toBeDefined();

    const res2 = nudgeOverlappingLeafNodes(data, { padding: 30, maxIterations: 20 });
    expect(res2.changed).toBe(false);
  });

  it('emits BOX_NUDGE diagnostics when nudging runs (no targeted IDs)', () => {
    const hk = mkNode('HongKongCompany', 0, 0, 100, 40);
    const label = mkNode(
      'edge-label-USCompany-HongKongCompany-L_USCompany_HongKongCompany_0',
      10,
      0,
      100,
      40
    );
    const data: LayoutData = { nodes: [hk, label], edges: [], config: {} as any };

    const spy = vi.spyOn(log, 'debug');
    try {
      const res = nudgeOverlappingLeafNodes(data, {
        padding: 10,
        maxIterations: 5,
        preferAxis: 'x',
      });
      expect(res.changed).toBe(true);
      expect(spy.mock.calls.some((c) => c[1] === 'BOX_NUDGE')).toBe(true);
    } finally {
      spy.mockRestore();
    }
  });

  it('separates external leaves from group borders without moving descendants or edge labels', () => {
    const group = { ...mkNode('G', 0, 0, 100, 100), isGroup: true } as Node;
    const child = { ...mkNode('child', 0, 0, 20, 20), parentId: 'G' } as Node;
    const external = mkNode('external', -55, 0, 40, 40);
    const label = {
      ...mkNode('edge-label-A-B-L_A_B_0', 55, 0, 40, 40),
      isEdgeLabel: true,
    } as Node;
    const data: LayoutData = {
      nodes: [group, child, external, label],
      edges: [],
      config: {} as any,
    };

    const result = nudgeLeafNodesAwayFromNonAncestorGroups(data, {
      padding: 10,
      maxIterations: 10,
      preferAxis: 'x',
    });

    expect(result.changed).toBe(true);
    expect(external.x).toBeLessThan(-55);
    expect(child.x).toBe(0);
    expect(label.x).toBe(55);
  });

  it('pushes edge-label nodes away based on geometry (not id ordering) to avoid shoving the label left', () => {
    // Repro: label starts to the RIGHT of HongKongCompany, but overlaps it.
    // Old behavior (id-based tie-break) can push label left and HK right, increasing overlap and
    // producing "label left of HK" artifacts.
    const hk = mkNode('HongKongCompany', 0, 0, 100, 40);
    const label = mkNode(
      'edge-label-USCompany-HongKongCompany-L_USCompany_HongKongCompany_0',
      50,
      0,
      100,
      40
    );
    const data: LayoutData = { nodes: [hk, label], edges: [], config: {} as any };

    expect(validateLayout(data).ok).toBe(false);
    const res = nudgeOverlappingLeafNodes(data, { padding: 10, maxIterations: 1, preferAxis: 'x' });
    expect(res.changed).toBe(true);

    // Desired: label moves further right, HK moves left (preserves their left/right ordering).
    expect((label as any).x).toBeGreaterThan(50);
    expect((hk as any).x).toBeLessThan(0);
  });
});
