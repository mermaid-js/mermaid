import { describe, it, expect } from 'vitest';
import type { Graph, EdgeRef, NodeId } from '../helpers.js';
import {
  normalizeGraph,
  isAcyclic,
  topoSortIfAcyclic,
  incoming,
  outgoing,
} from '../phase0.helpers.js';

// Minimal mermaid node/edge shapes for tests
interface TestNode {
  id: string;
}
interface TestEdge {
  id: string;
  start: string;
  end: string;
}

function mkGraph(nodes: string[], pairs: [string, string][]): Graph {
  const layout = { nodes: nodes.map((id) => ({ id }) as TestNode) as any, edges: [] as any } as any;
  const nodeById = new Map<NodeId, any>();
  for (const id of nodes) {
    nodeById.set(id, { id });
  }
  const edges: EdgeRef[] = pairs.map(([src, dst], i) => ({
    id: `e${i}`,
    src,
    dst,
    ref: { id: `e${i}`, start: src, end: dst } as any,
  }));
  return { nodes: [...nodes], edges, layout, nodeById };
}

describe('Phase 0 helpers', () => {
  it('handles empty graph', () => {
    const g = mkGraph([], []);
    const gn = normalizeGraph(g);
    expect(isAcyclic(gn)).toBe(true);
    expect(topoSortIfAcyclic(gn)).toEqual([]);
  });

  it('handles single node', () => {
    const g = mkGraph(['A'], []);
    const gn = normalizeGraph(g);
    expect(isAcyclic(gn)).toBe(true);
    expect(topoSortIfAcyclic(gn)).toEqual(['A']);
  });

  it('parallel edges remain acyclic', () => {
    const g = mkGraph(
      ['A', 'B'],
      [
        ['A', 'B'],
        ['A', 'B'],
      ]
    );
    const gn = normalizeGraph(g);
    expect(isAcyclic(gn)).toBe(true);
    expect(topoSortIfAcyclic(gn)).toEqual(['A', 'B']);
    expect(incoming(gn, 'B').length).toBe(2);
    expect(outgoing(gn, 'A').length).toBe(2);
  });

  it('detects self-loop as cyclic', () => {
    const g = mkGraph(['A'], [['A', 'A']]);
    const gn = normalizeGraph(g);
    expect(isAcyclic(gn)).toBe(false);
    expect(topoSortIfAcyclic(gn)).toBeNull();
  });

  it('two-node cycle A<->B is cyclic', () => {
    const g = mkGraph(
      ['A', 'B'],
      [
        ['A', 'B'],
        ['B', 'A'],
      ]
    );
    const gn = normalizeGraph(g);
    expect(isAcyclic(gn)).toBe(false);
    expect(topoSortIfAcyclic(gn)).toBeNull();
  });

  it('disconnected DAG topological order includes all nodes', () => {
    const g = mkGraph(
      ['A', 'B', 'C', 'D'],
      [
        ['A', 'B'],
        ['C', 'D'],
      ]
    );
    const gn = normalizeGraph(g);
    const order = topoSortIfAcyclic(gn);
    expect(order).not.toBeNull();
    expect(order!.length).toBe(4);
    // Ensure A before B and C before D
    const pos = Object.fromEntries(order!.map((id, i) => [id, i]));
    expect(pos.A).toBeLessThan(pos.B);
    expect(pos.C).toBeLessThan(pos.D);
  });
});
