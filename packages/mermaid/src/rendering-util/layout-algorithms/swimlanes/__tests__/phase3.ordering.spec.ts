import { describe, it, expect } from 'vitest';
import type { Graph, EdgeRef, NodeId, Layering } from '../helpers.js';
import { orderLayers, totalCrossings } from '../phase3.ordering.js';

interface TestNode {
  id: string;
}

function mkGraph(nodes: string[], edgePairs: [string, string][]): Graph {
  const layout = { nodes: nodes.map((id) => ({ id }) as TestNode) as any, edges: [] as any } as any;
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

describe('Phase 3 — Vertex Ordering', () => {
  it('Two-layer bipartite zero-crossing order is achieved', () => {
    const nodes = ['U1', 'U2', 'L1', 'L2'];
    const g = mkGraph(nodes, [
      ['U1', 'L1'],
      ['U2', 'L2'],
    ]);
    const layering: Layering = {
      layers: [
        ['U1', 'U2'],
        ['L2', 'L1'],
      ], // deliberately reversed lower layer
      rankOf: { U1: 0, U2: 0, L1: 1, L2: 1 },
      dummy: new Set(),
    };
    const ordered = orderLayers(layering, g);
    expect(ordered.layers[0]).toEqual(['U1', 'U2']);
    expect(ordered.layers[1]).toEqual(['L1', 'L2']);
    expect(totalCrossings(ordered.layers, g.edges)).toBe(0);
  });

  it('Transpose reduces crossings on a crafted case', () => {
    // Upper: A,B,C; Lower: d,e,f with edges that benefit from transpose
    const nodes = ['A', 'B', 'C', 'd', 'e', 'f'];
    const edges: [string, string][] = [
      ['A', 'e'],
      ['B', 'd'],
      ['C', 'f'],
    ];
    const g = mkGraph(nodes, edges);
    const layering: Layering = {
      layers: [
        ['A', 'B', 'C'],
        ['d', 'e', 'f'],
      ],
      rankOf: { A: 0, B: 0, C: 0, d: 1, e: 1, f: 1 },
      dummy: new Set(),
    };
    const before = totalCrossings(layering.layers, g.edges);
    const ordered = orderLayers(layering, g);
    expect(totalCrossings(ordered.layers, g.edges)).toBeLessThanOrEqual(before);
  });

  it('Deterministic results on repeated runs', () => {
    const nodes = ['U1', 'U2', 'U3', 'L1', 'L2', 'L3'];
    const g = mkGraph(nodes, [
      ['U1', 'L2'],
      ['U2', 'L1'],
      ['U3', 'L3'],
    ]);
    const layering: Layering = {
      layers: [
        ['U1', 'U2', 'U3'],
        ['L3', 'L2', 'L1'],
      ],
      rankOf: { U1: 0, U2: 0, U3: 0, L1: 1, L2: 1, L3: 1 },
      dummy: new Set(),
    };
    const a = orderLayers(layering, g);
    const b = orderLayers(layering, g);
    expect(a.layers).toEqual(b.layers);
  });

  it('Transpose considers crossings against next layer', () => {
    const nodes = ['I', 'J', 'K', 'L', 'E'];
    const edges: [string, string][] = [
      ['I', 'J'],
      ['I', 'K'],
      ['J', 'E'],
      ['K', 'L'],
    ];
    const g = mkGraph(nodes, edges);
    const layering: Layering = {
      layers: [
        ['I'],
        ['J', 'K'],
        ['L', 'E'], // targets ordered to induce a crossing with the initial J,K order
      ],
      rankOf: { I: 0, J: 1, K: 1, L: 2, E: 2 },
      dummy: new Set(),
    };

    const before = totalCrossings(layering.layers, g.edges);
    const ordered = orderLayers(layering, g);
    const after = totalCrossings(ordered.layers, g.edges);

    expect(ordered.layers[1]).toEqual(['K', 'J']);
    expect(after).toBeLessThan(before);
  });
});
