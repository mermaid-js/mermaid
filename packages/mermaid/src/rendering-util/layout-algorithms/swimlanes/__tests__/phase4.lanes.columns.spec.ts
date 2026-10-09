import { describe, it, expect } from 'vitest';
import type { Graph, EdgeRef, NodeId, OrderedLayers } from '../helpers.js';
import { assignCoordinates } from '../phase4.coordinates.js';

function mkGraphWithLaneColumns(): { g: Graph; ordered: OrderedLayers } {
  const layout: any = { nodes: [], edges: [] };
  const nodeById = new Map<NodeId, any>();
  // lanes
  const lane1 = { id: 'lane1', isGroup: true } as any;
  const lane2 = { id: 'lane2', isGroup: true } as any;
  // Simulate flowDb reversed order
  layout.nodes.push(lane2, lane1);
  nodeById.set('lane1', lane1);
  nodeById.set('lane2', lane2);
  // nodes with widths and parents
  const A = { id: 'A', isGroup: false, width: 120, height: 50, parentId: 'lane1' } as any;
  const B = { id: 'B', isGroup: false, width: 160, height: 50, parentId: 'lane1' } as any;
  const C = { id: 'C', isGroup: false, width: 200, height: 50, parentId: 'lane2' } as any;
  const D = { id: 'D', isGroup: false, width: 100, height: 50, parentId: 'lane1' } as any;
  for (const n of [A, B, C, D]) {
    layout.nodes.push(n);
    nodeById.set(n.id, n);
  }
  const edges: EdgeRef[] = [];
  const g: Graph = { nodes: ['A', 'B', 'C', 'D'], edges, layout, nodeById };
  // layers: A on 0, B and C on 1, D on 2
  const ordered: OrderedLayers = { layers: [['A'], ['B', 'C'], ['D']] };
  return { g, ordered };
}

describe('Lane columns', () => {
  it('keeps same x for nodes in the same lane across layers', () => {
    const { g, ordered } = mkGraphWithLaneColumns();
    const coords = assignCoordinates(ordered, g, { nodeGap: 40, laneGap: 120, layerGap: 100 });
    expect(coords.x.A).toBe(coords.x.B);
    expect(coords.x.A).toBe(coords.x.D);
    expect(coords.x.C).toBeGreaterThan(coords.x.B);
  });
});
