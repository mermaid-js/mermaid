import { describe, it, expect, vi } from 'vitest';
import { inferEdgeLabelParentIds } from './labelParents.js';
import { log } from '../../../../logger.js';
import type { Node, Edge } from '../../../types.js';

describe('domus/pipeline/labelParents - ', () => {
  it('assigns label parentId to deepest geometrically containing neighbor group when possible', () => {
    const nodesById = new Map<string, Node>([
      ['G', { id: 'G', isGroup: true, x: 0, y: 0, width: 200, height: 200 }],
      ['H', { id: 'H', isGroup: true, parentId: 'G', x: 0, y: 0, width: 100, height: 100 }],
      ['A', { id: 'A', isGroup: false, parentId: 'H' }],
      ['B', { id: 'B', isGroup: false, parentId: 'G' }],
      ['edge-label-A-B', { id: 'edge-label-A-B', isGroup: false, isEdgeLabel: true, x: 0, y: 0 }],
    ]);
    const edges: Edge[] = [
      { id: 'e1', start: 'A', end: 'edge-label-A-B' },
      { id: 'e2', start: 'edge-label-A-B', end: 'B' },
    ];

    const spy = vi.spyOn(log, 'debug');
    try {
      inferEdgeLabelParentIds(nodesById, edges);
    } finally {
      spy.mockRestore();
    }

    expect(nodesById.get('edge-label-A-B')!.parentId).toBe('H');
  });

  it('falls back to LCA when label is not geometrically inside any neighbor group', () => {
    const nodesById = new Map<string, Node>([
      ['G', { id: 'G', isGroup: true, x: 0, y: 0, width: 200, height: 200 }],
      ['H', { id: 'H', isGroup: true, parentId: 'G', x: 0, y: 0, width: 100, height: 100 }],
      ['A', { id: 'A', isGroup: false, parentId: 'H' }],
      ['B', { id: 'B', isGroup: false, parentId: 'G' }],
      [
        'edge-label-A-B',
        { id: 'edge-label-A-B', isGroup: false, isEdgeLabel: true, x: 1000, y: 1000 },
      ],
    ]);
    const edges: Edge[] = [
      { id: 'e1', start: 'A', end: 'edge-label-A-B' },
      { id: 'e2', start: 'edge-label-A-B', end: 'B' },
    ];

    inferEdgeLabelParentIds(nodesById, edges);
    expect(nodesById.get('edge-label-A-B')!.parentId).toBe('G');
  });
});
