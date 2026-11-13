import { describe, it, expect } from 'vitest';
import type { Graph, EdgeRef, NodeId, OrderedLayers } from '../helpers.js';
import { assignCoordinates } from '../phase4.coordinates.js';

function mkGraphWithLanes(): { g: Graph; ordered: OrderedLayers } {
  const layout: any = { nodes: [], edges: [] };
  const nodeById = new Map<NodeId, any>();
  // groups (lanes)
  const lane1 = { id: 'lane1', isGroup: true } as any;
  const lane2 = { id: 'lane2', isGroup: true } as any;
  // Simulate flowDb reversed order
  layout.nodes.push(lane2, lane1);
  nodeById.set('lane1', lane1);
  nodeById.set('lane2', lane2);
  // nodes with widths
  const A = { id: 'A', isGroup: false, width: 100, height: 50 } as any;
  const B = { id: 'B', isGroup: false, width: 120, height: 50, parentId: 'lane1' } as any;
  const C = { id: 'C', isGroup: false, width: 180, height: 50, parentId: 'lane2' } as any;
  const D = { id: 'D', isGroup: false, width: 80, height: 50 } as any;
  for (const n of [A, B, C, D]) {
    layout.nodes.push(n);
    nodeById.set(n.id, n);
  }
  const edges: EdgeRef[] = [];
  const g: Graph = { nodes: ['A', 'B', 'C', 'D'], edges, layout, nodeById };
  const ordered: OrderedLayers = { layers: [['B', 'C']] };
  return { g, ordered };
}

describe('Lane-aware placement', () => {
  it('separates nodes of different lanes with laneGap', () => {
    const { g, ordered } = mkGraphWithLanes();
    const nodeGap = 40;
    const laneGap = 100;
    const coords = assignCoordinates(ordered, g, { nodeGap, laneGap, layerGap: 80 });
    const xB = coords.x.B;
    const xC = coords.x.C;
    // Expected gap between centers >= laneGap + (B.width + C.width)/2
    const expectedMin = laneGap + (120 + 180) / 2;
    expect(xC - xB).toBeGreaterThanOrEqual(expectedMin);
  });
});
