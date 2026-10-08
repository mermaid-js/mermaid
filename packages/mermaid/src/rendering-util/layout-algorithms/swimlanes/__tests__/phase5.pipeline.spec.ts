import { describe, it, expect } from 'vitest';
import type { Graph, EdgeRef, NodeId } from '../helpers.js';
import { sugiyamaLayout } from '../pipeline.js';
import { totalCrossings } from '../phase3.ordering.js';

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

describe('Phase 5 — Pipeline (sugiyamaLayout)', () => {
  it('Chain A->B->C->D yields layered y and no reversed', () => {
    const g = mkGraph(
      ['A', 'B', 'C', 'D'],
      [
        ['A', 'B'],
        ['B', 'C'],
        ['C', 'D'],
      ]
    );
    // This synthetic graph has no swimlanes, so exercise the plain (non
    // lane-aware) layering. `ignoreCrossLaneEdges` now defaults to true, which
    // routes through the lane-aware compactor and would treat this lane-less
    // chain's edges as cross-lane (collapsing it to a single layer).
    const res = sugiyamaLayout(g, { nodeGap: 40, layerGap: 80, ignoreCrossLaneEdges: false });
    expect(res.reversed.length).toBe(0);
    const y = res.coordinates.y;
    expect(y.A).toBe(0);
    expect(y.B).toBe(80);
    expect(y.C).toBe(160);
    expect(y.D).toBe(240);
  });

  it('Two-node cycle A<->B gets one reversed edge', () => {
    const g = mkGraph(
      ['A', 'B'],
      [
        ['A', 'B'],
        ['B', 'A'],
      ]
    );
    const res = sugiyamaLayout(g);
    expect(res.reversed.length).toBe(1);
  });

  it('Two-layer bipartite ordering reaches zero crossings', () => {
    // L0: A,B,C ; L1: X,Y,Z, connect A->X, B->Y, C->Z
    const g = mkGraph(
      ['A', 'B', 'C', 'X', 'Y', 'Z'],
      [
        ['A', 'X'],
        ['B', 'Y'],
        ['C', 'Z'],
      ]
    );
    const res = sugiyamaLayout(g);
    const crossings = totalCrossings(res.ordered.layers, g.edges);
    expect(crossings).toBe(0);
  });
});
