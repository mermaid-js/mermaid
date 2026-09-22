import { describe, it, expect } from 'vitest';
import type { Graph, EdgeRef, NodeId } from '../helpers.js';
import { assignLayers_LongestPath } from '../phase2.longestPath.js';
import { makeProperLayering } from '../phase2.dummies.js';

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

function mkSwimlaneGraphForCrossLane(): Graph {
  const layout: any = { nodes: [], edges: [] };
  const nodeById = new Map<NodeId, any>();

  const addNode = (node: any) => {
    layout.nodes.push(node);
    nodeById.set(node.id, node);
  };

  for (const lane of ['Car', 'Sales', 'Constr', 'Legal', 'Fun']) {
    addNode({ id: lane, isGroup: true });
  }

  const nodes: Record<string, any> = {
    A: { id: 'A', parentId: 'Car' },
    B: { id: 'B', parentId: 'Sales' },
    C: { id: 'C', parentId: 'Constr' },
    D: { id: 'D', parentId: 'Constr' },
    E: { id: 'E', parentId: 'Constr' },
    F: { id: 'F', parentId: 'Fun' },
    G: { id: 'G', parentId: 'Fun' },
    H: { id: 'H', parentId: 'Constr' },
    I: { id: 'I', parentId: 'Legal' },
    J: { id: 'J', parentId: 'Legal' },
    K: { id: 'K', parentId: 'Legal' },
    L: { id: 'L', parentId: 'Constr' },
    M: { id: 'M', parentId: 'Sales' },
    N: { id: 'N', parentId: 'Constr' },
  };

  for (const node of Object.values(nodes)) {
    addNode(node);
  }

  const edges: EdgeRef[] = [
    ['A', 'B'],
    ['B', 'C'],
    ['C', 'D'],
    ['D', 'E'],
    ['E', 'F'],
    ['F', 'G'],
    ['D', 'H'],
    ['H', 'I'],
    ['I', 'J'],
    ['J', 'E'],
    ['I', 'K'],
    ['K', 'L'],
    ['L', 'M'],
    ['L', 'N'],
  ].map(([src, dst], i) => ({
    id: `lane-${i}`,
    src,
    dst,
    ref: { id: `lane-${i}`, start: src, end: dst } as any,
  }));

  return {
    nodes: Object.keys(nodes),
    edges,
    layout,
    nodeById,
  };
}

describe('Phase 2 — Layer Assignment', () => {
  it('Chain A->B->C->D: consecutive layers; no dummies', () => {
    const g = mkGraph(
      ['A', 'B', 'C', 'D'],
      [
        ['A', 'B'],
        ['B', 'C'],
        ['C', 'D'],
      ]
    );
    const layering = assignLayers_LongestPath(g, { compactSingleInput: false });
    expect(layering.layers).toEqual([['A'], ['B'], ['C'], ['D']]);
    expect(layering.dummy?.size ?? 0).toBe(0);
  });

  it('Long edge A->D with chain A->B->C->D introduces two dummies on A->D', () => {
    const g = mkGraph(
      ['A', 'B', 'C', 'D'],
      [
        ['A', 'B'],
        ['B', 'C'],
        ['C', 'D'],
        ['A', 'D'],
      ]
    );
    const layering = assignLayers_LongestPath(g, { compactSingleInput: false });
    const { layering: proper, graphWithDummies } = makeProperLayering(layering, g);
    // Expect there to be exactly 2 dummy nodes between ranks 0 and 3 for the long edge
    const dummies = [...(proper.dummy ?? [])];
    expect(dummies.length).toBe(2);
    // They should sit on layers 1 and 2
    const l1 = proper.layers[1].filter((id) => dummies.includes(id));
    const l2 = proper.layers[2].filter((id) => dummies.includes(id));
    expect(l1.length).toBe(1);
    expect(l2.length).toBe(1);
    // The long edge e3 should be split into a chain of 3 edges
    const chain = graphWithDummies.edges.filter((e) => e.id.startsWith('e3#'));
    expect(chain.length).toBe(3);
  });

  it('Diamond: ranks consistent; minimal height', () => {
    const g = mkGraph(
      ['A', 'B', 'C', 'D'],
      [
        ['A', 'B'],
        ['A', 'C'],
        ['B', 'D'],
        ['C', 'D'],
      ]
    );
    const layering = assignLayers_LongestPath(g, { compactSingleInput: false });
    // Expect 3 layers: A, {B,C}, D
    expect(layering.layers.length).toBe(3);
    expect(layering.layers[0]).toEqual(['A']);
    expect(new Set(layering.layers[1])).toEqual(new Set(['B', 'C']));
    expect(layering.layers[2]).toEqual(['D']);
  });

  it('Disconnected graphs: components layered independently', () => {
    const g = mkGraph(
      ['A', 'B', 'C', 'D'],
      [
        ['A', 'B'],
        ['C', 'D'],
      ]
    );
    const layering = assignLayers_LongestPath(g, { compactSingleInput: false });
    // Both components should start at layer 0
    const r = layering.rankOf;
    expect(r.A).toBe(0);
    expect(r.C).toBe(0);
    expect(r.B).toBe(1);
    expect(r.D).toBe(1);
  });

  it('Orders child subtrees by crossing counts', () => {
    const g = mkGraph(
      ['A', 'B', 'C', 'X'],
      [
        ['A', 'B'],
        ['A', 'C'],
        ['X', 'B'],
      ]
    );
    const layering = assignLayers_LongestPath(g, { compactSingleInput: false });
    expect(layering.layers[0]).toEqual(['A', 'X']);
    // Both B and C have the same crossing count (1), so they are ordered alphabetically
    expect(layering.layers[1]).toEqual(['B', 'C']);
  });

  it('Counts long edges when ordering same-layer children', () => {
    const layout: any = { nodes: [], edges: [] };
    const nodeById = new Map<NodeId, any>();

    const lanes = ['laneA', 'laneB', 'laneC'].map((id) => ({ id, isGroup: true }) as any);
    for (const lane of lanes) {
      layout.nodes.push(lane);
      nodeById.set(lane.id, lane);
    }

    const nodes: Record<string, any> = {
      A: { id: 'A', parentId: 'laneA' },
      B: { id: 'B', parentId: 'laneB' },
      C: { id: 'C', parentId: 'laneC' },
      X: { id: 'X', parentId: 'laneB' },
      Y: { id: 'Y', parentId: 'laneB' },
      Z: { id: 'Z', parentId: 'laneC' },
    };

    for (const n of Object.values(nodes)) {
      layout.nodes.push(n);
      nodeById.set(n.id, n);
    }

    const edgePairs: [string, string][] = [
      ['A', 'B'],
      ['A', 'C'],
      ['B', 'X'],
      ['B', 'Y'], // long edge spanning multiple layers (via X)
      ['X', 'Y'],
      ['C', 'Z'],
    ];
    const edges: EdgeRef[] = edgePairs.map(([src, dst], i) => ({
      id: `eLong${i}`,
      src,
      dst,
      ref: { id: `eLong${i}`, start: src, end: dst } as any,
    }));

    const g: Graph = {
      nodes: Object.keys(nodes),
      edges,
      layout,
      nodeById,
    };

    const layering = assignLayers_LongestPath(g, { compactSingleInput: true });
    expect(layering.rankOf.A).toBe(0);
    expect(layering.rankOf.B).toBe(0);
    expect(layering.rankOf.C).toBe(0);

    const layer0 = layering.layers[0];
    const orderedNonGroups = layer0.filter((id) => !nodeById.get(id)?.isGroup);
    expect(orderedNonGroups[0]).toBe('A');
    expect(orderedNonGroups.slice(1)).toEqual(['C', 'B']);
  });

  it('Respects ignoreCrossLaneEdges when layering', () => {
    const baseline = assignLayers_LongestPath(mkSwimlaneGraphForCrossLane(), {
      compactSingleInput: false,
    });
    const ignore = assignLayers_LongestPath(mkSwimlaneGraphForCrossLane(), {
      compactSingleInput: false,
      ignoreCrossLaneEdges: true,
    });

    expect(baseline.rankOf.E).toBeGreaterThan(ignore.rankOf.E);
    expect(ignore.rankOf.H).toBeGreaterThan(ignore.rankOf.E);
  });
});
