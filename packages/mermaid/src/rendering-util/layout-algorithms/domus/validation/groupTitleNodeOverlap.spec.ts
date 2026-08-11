import { describe, it, expect } from 'vitest';
import type { LayoutData } from '../../../types.js';
import { validateLayout } from '../validateLayoutProxy.js';

/**
 * The band is `titleBandHeight()` tall at the top of the frame. With default
 * config (fontSize 16) that is round(16 * 1.5) = 24px. These tests pin the
 * *behaviour* (flag vs. clear), not the exact band height.
 */
function layoutWith(childTop: number): LayoutData {
  // Group frame: centre (100, 100), 100×100 → top edge at y = 50, band ≈ [50, 74].
  const group = {
    id: 'G',
    isGroup: true,
    label: 'Title',
    x: 100,
    y: 100,
    width: 100,
    height: 100,
  };
  const childHeight = 40;
  const child = {
    id: 'C',
    isGroup: false,
    parentId: 'G',
    x: 100,
    y: childTop + childHeight / 2,
    width: 40,
    height: childHeight,
  };
  return { nodes: [group, child], edges: [] } as unknown as LayoutData;
}

describe('groupTitleNodeOverlapExtension', () => {
  it('flags a child node that sits inside the subgraph title band', () => {
    // Child top at y = 55 → intrudes into the band [50, 74].
    const result = validateLayout(layoutWith(55));
    const titleOverlaps = result.issues.filter((i) => i.type === 'node-overlaps-group-title');
    expect(titleOverlaps).toHaveLength(1);
    expect(titleOverlaps[0].nodeIds).toEqual(['C', 'G']);
    expect(result.ok).toBe(false);
  });

  it('does not flag a child node placed clear below the title band', () => {
    // Child top at y = 80 → below the band bottom (~74), clear.
    const result = validateLayout(layoutWith(80));
    expect(result.issues.some((i) => i.type === 'node-overlaps-group-title')).toBe(false);
  });
});
