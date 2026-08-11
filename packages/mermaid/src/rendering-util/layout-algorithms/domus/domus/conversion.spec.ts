import { describe, expect, it } from 'vitest';
import type { LayoutData } from '../../../types.js';
import { layoutDataToDomusInput } from './conversion.js';

describe('layoutDataToDomusInput', () => {
  it('proxies group endpoint edges to descendant leaves', () => {
    const layout = {
      nodes: [
        { id: 'A', isGroup: false },
        { id: 'B', isGroup: false },
        { id: 'G', isGroup: true },
        { id: 'C', parentId: 'G', isGroup: false },
        { id: 'D', parentId: 'G', isGroup: false },
        { id: 'edge-label-G-B-L_G_B_0', isGroup: false, isEdgeLabel: true },
      ],
      edges: [
        { id: 'A_B', start: 'A', end: 'B' },
        { id: 'A_A', start: 'A', end: 'A' },
        { id: 'A_G', start: 'A', end: 'G' },
        { id: 'G_B', start: 'G', end: 'B' },
        { id: 'G_B-to-label', start: 'G', end: 'edge-label-G-B-L_G_B_0', isLabelEdge: true },
        {
          id: 'G_B-from-label',
          start: 'edge-label-G-B-L_G_B_0',
          end: 'B',
          isLabelEdge: true,
        },
      ],
    } as LayoutData;

    expect(layoutDataToDomusInput(layout)).toEqual({
      vertexIds: ['A', 'B', 'C', 'D', 'edge-label-G-B-L_G_B_0'],
      edges: [
        { id: 'A_B', from: 'A', to: 'B' },
        { id: 'A_G', from: 'A', to: 'C' },
        { id: 'G_B', from: 'D', to: 'B' },
        { id: 'G_B-to-label', from: 'D', to: 'edge-label-G-B-L_G_B_0' },
        { id: 'G_B-from-label', from: 'edge-label-G-B-L_G_B_0', to: 'B' },
      ],
    });
  });
});
