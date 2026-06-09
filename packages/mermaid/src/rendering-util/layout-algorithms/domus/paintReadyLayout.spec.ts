import { describe, expect, it } from 'vitest';
import type { LayoutData } from '../../types.js';
import {
  assertPaintReadyNodeGeometry,
  findNonFiniteNodeGeometry,
  preparePaintReadyNodeGeometry,
} from './paintReadyLayout.js';

function layoutWithNode(node: Record<string, unknown>): LayoutData {
  return {
    nodes: [
      {
        id: 'a',
        isGroup: false,
        width: 40,
        height: 30,
        ...node,
      } as LayoutData['nodes'][number],
    ],
    edges: [],
    config: {} as LayoutData['config'],
  } as LayoutData;
}

describe('DOMUS paint-ready LayoutData contract', () => {
  it('materializes implicit origin coordinates before paint', () => {
    const layout = layoutWithNode({ x: undefined, y: undefined });

    preparePaintReadyNodeGeometry(layout, 'test');

    expect(layout.nodes[0].x).toBe(0);
    expect(layout.nodes[0].y).toBe(0);
    expect(findNonFiniteNodeGeometry(layout)).toEqual([]);
  });

  it('rejects NaN and Infinity instead of masking them as zero', () => {
    const layout = layoutWithNode({ x: Number.NaN, y: Infinity });

    expect(() => assertPaintReadyNodeGeometry(layout, 'test')).toThrow(/non-finite node geometry/);
  });
});
