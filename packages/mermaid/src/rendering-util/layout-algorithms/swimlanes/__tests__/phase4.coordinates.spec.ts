import { describe, it, expect } from 'vitest';
import type { Graph, EdgeRef, NodeId, OrderedLayers } from '../helpers.js';
import { assignCoordinates } from '../phase4.coordinates.js';

interface TestNode {
  id: string;
  isGroup?: boolean;
  isDummy?: boolean;
}

function mkGraph(nodes: string[], edgePairs: [string, string][]): Graph {
  const layout = {
    nodes: nodes.map((id) => ({ id, isGroup: false }) as TestNode) as any,
    edges: [] as any,
  } as any;
  const nodeById = new Map<NodeId, any>();
  for (const id of nodes) {
    nodeById.set(id, { id, isGroup: false });
  }
  const edges: EdgeRef[] = edgePairs.map(([src, dst], i) => ({
    id: `e${i}`,
    src,
    dst,
    ref: { id: `e${i}`, start: src, end: dst } as any,
  }));
  return { nodes: [...nodes], edges, layout, nodeById };
}

describe('Phase 4 — Coordinate Assignment', () => {
  it('Single layer: monotone increasing x with nodeGap; y constant', () => {
    const g = mkGraph(['A', 'B', 'C'], []);
    const ordered: OrderedLayers = { layers: [['A', 'B', 'C']] };
    const coords = assignCoordinates(ordered, g, { nodeGap: 50, layerGap: 80 });
    expect(coords.y.A).toBe(0);
    expect(coords.y.B).toBe(0);
    expect(coords.y.C).toBe(0);
    // Centered placement within single lane: [-50, 0, 50]
    expect(coords.x.A).toBe(-50);
    expect(coords.x.B).toBe(0);
    expect(coords.x.C).toBe(50);
  });
});
