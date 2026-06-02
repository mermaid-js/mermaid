import { describe, it, expect } from 'vitest';
import type { Graph, EdgeRef, NodeId } from '../helpers.js';
import { assignLayers_LongestPath } from '../phase2.longestPath.js';

function mkGraphWithLanes(): Graph {
  const layout: any = { nodes: [], edges: [] };
  const nodeById = new Map<NodeId, any>();
  const lane1 = { id: 'lane1', isGroup: true } as any;
  const lane2 = { id: 'lane2', isGroup: true } as any;
  layout.nodes.push(lane1, lane2);
  nodeById.set('lane1', lane1);
  nodeById.set('lane2', lane2);
  const A = { id: 'A', parentId: 'lane1' } as any;
  const B = { id: 'B', parentId: 'lane1' } as any;
  const C = { id: 'C', parentId: 'lane2' } as any;
  for (const n of [A, B, C]) {
    layout.nodes.push(n);
    nodeById.set(n.id, n);
  }
  const edges: EdgeRef[] = [
    { id: 'e0', src: 'A', dst: 'B', ref: { id: 'e0', start: 'A', end: 'B' } as any },
    { id: 'e1', src: 'A', dst: 'C', ref: { id: 'e1', start: 'A', end: 'C' } as any },
  ];
  return { nodes: ['A', 'B', 'C'], edges, layout, nodeById };
}

describe('Compact single-input across lanes', () => {
  it('Only compacts for C (different lane), not for B (same lane)', () => {
    const g = mkGraphWithLanes();
    const layering = assignLayers_LongestPath(g, { compactSingleInput: true });
    const r = layering.rankOf;
    expect(r.A).toBe(0);
    expect(r.B).toBe(1); // same lane as A -> next layer
    expect(r.C).toBe(0); // different lane -> inherit layer
  });
});
