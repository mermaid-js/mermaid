import { describe, it, expect } from 'vitest';
import type { LayoutData } from '../../../types.js';
import { validateLayout } from '../validateLayoutProxy.js';

// Group G frame: centre (100, 100), 120×120 → rect [40, 160] × [40, 160].
// Child C belongs to G and sits inside. Foreign node F is positioned per-case.
function layoutWith(foreignX: number, foreignY: number): LayoutData {
  const group = { id: 'G', isGroup: true, label: 'G', x: 100, y: 100, width: 120, height: 120 };
  const child = {
    id: 'C',
    isGroup: false,
    parentId: 'G',
    x: 100,
    y: 110,
    width: 40,
    height: 40,
  };
  const foreign = { id: 'F', isGroup: false, x: foreignX, y: foreignY, width: 40, height: 40 };
  return { nodes: [group, child, foreign], edges: [] } as unknown as LayoutData;
}

describe('foreignNodeGroupOverlapExtension', () => {
  it('flags a foreign node overlapping the group frame from the right side', () => {
    // F centred at x=170 → rect [150,190]; overlaps frame right edge (160) by 10.
    const result = validateLayout(layoutWith(170, 100));
    const hits = result.issues.filter((i) => i.type === 'node-overlaps-foreign-group');
    expect(hits).toHaveLength(1);
    expect(hits[0].nodeIds).toEqual(['F', 'G']);
    expect(result.ok).toBe(false);
  });

  it('flags overlap from the top side too', () => {
    // F centred at y=30 → rect [10,50]; overlaps frame top edge (40) by 10.
    const result = validateLayout(layoutWith(100, 30));
    expect(result.issues.some((i) => i.type === 'node-overlaps-foreign-group')).toBe(true);
  });

  it('does not flag a foreign node placed clear of the frame', () => {
    // F centred at x=210 → rect [190,230]; 30px clear of frame right edge.
    const result = validateLayout(layoutWith(210, 100));
    expect(result.issues.some((i) => i.type === 'node-overlaps-foreign-group')).toBe(false);
  });
});
