import { describe, it, expect } from 'vitest';
import type { Graph, EdgeRef, NodeId } from '../helpers.js';
import { assignLayers_LongestPath } from '../phase2.longestPath.js';

function mkGraph(nodes: string[], edgePairs: [string, string][]): Graph {
  const layout = { nodes: nodes.map((id) => ({ id }) as any) as any, edges: [] as any } as any;
  const nodeById = new Map<NodeId, any>();
  for (const id of nodes) {
    nodeById.set(id, { id });
  }
  const edges: EdgeRef[] = edgePairs.map(([src, dst], i) => ({
    id: `e${i}`,
    src,
    dst,
    ref: { id: `e${i}`, start: src, end: dst } as any,
  }));
  return { nodes: [...nodes], edges, layout, nodeById };
}

describe('Compact single-input layering', () => {
  it('Does not compact chain within same lane (no lane info -> same lane)', () => {
    const g = mkGraph(
      ['A', 'B', 'C'],
      [
        ['A', 'B'],
        ['B', 'C'],
      ]
    );
    const layering = assignLayers_LongestPath(g, { compactSingleInput: true });
    expect(layering.layers.length).toBe(3);
    expect(layering.layers[0]).toEqual(['A']);
    expect(layering.layers[1]).toEqual(['B']);
    expect(layering.layers[2]).toEqual(['C']);
  });
});
