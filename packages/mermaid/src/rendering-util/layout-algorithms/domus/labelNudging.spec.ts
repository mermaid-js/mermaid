import { describe, it, expect } from 'vitest';
import type { LayoutData, Node } from '../../types.js';
import { nudgeEdgeLabelNodesToAvoidOverlaps } from './labelNudging.js';
import { validateLayout } from './validateLayoutProxy.js';

function mkNode(
  id: string,
  x: number,
  y: number,
  w: number,
  h: number,
  extra: Partial<Node> = {}
): Node {
  return { id, x, y, width: w, height: h, isGroup: false, ...extra } as any;
}

describe('label nudging', () => {
  it('nudges an overlapping edge-label node away from a real node deterministically', () => {
    // Repro based on your log dump:
    // - HongKongCompany: cx=407.75, w=158.0859 => right ~486.79
    // - edge-label node: cx=514.3359, w=81.7188 => left ~473.48
    // X overlap ~13.3, Y overlap full label height.
    const hk = mkNode('HongKongCompany', 407.75, 355, 158.0859375, 45);
    const label = mkNode(
      'edge-label-USCompany-HongKongCompany-L_USCompany_HongKongCompany_0',
      514.3359375,
      355,
      81.71875,
      21,
      { isEdgeLabel: true } as any
    );
    const us = mkNode('USCompany', 641.9375, 699, 111.3671875, 45);

    const data: LayoutData = {
      nodes: [hk, label, us],
      // Only validating overlap behavior here; edges are omitted so validateLayout doesn't fail on missing points.
      edges: [],
      config: {} as any,
    };

    const before = validateLayout(data);
    expect(before.ok).toBe(false);
    expect(typeof before.score).toBe('number');
    expect(before.score).toBeGreaterThanOrEqual(0);
    expect(before.breakdown).toBeDefined();
    const res1 = nudgeEdgeLabelNodesToAvoidOverlaps(data, { padding: 2, maxIterations: 10 });
    expect(res1.changed).toBe(true);
    const after = validateLayout(data);
    expect(after.ok).toBe(true);
    expect(typeof after.score).toBe('number');
    expect(after.score).toBeGreaterThanOrEqual(0);
    expect(after.breakdown).toBeDefined();

    // Determinism: running again should be a no-op.
    const res2 = nudgeEdgeLabelNodesToAvoidOverlaps(data, { padding: 2, maxIterations: 10 });
    expect(res2.changed).toBe(false);
  });
});
