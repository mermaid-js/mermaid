import { describe, expect, it } from 'vitest';
import { DiagnosticCollector } from '../diagnostics.js';
import { flattenFlowchart } from '../adapter/flattenFlowchart.js';
import { FIXTURES, buildLayoutData } from '../testFixtures.js';
import { decompose, isPureTree, selectPureTreeRoot } from './peelCoreAndTrees.js';
import type { HolaGraph } from '../model.js';
import { degree } from '../model.js';

function topologyOf(data: ReturnType<typeof buildLayoutData>): HolaGraph {
  return flattenFlowchart(data, new DiagnosticCollector()).graph;
}

describe('pure-tree detection', () => {
  it('treats a path as one tree', () => {
    const graph = topologyOf(FIXTURES.threeNodePath());
    expect(isPureTree(graph)).toBe(true);
    const result = decompose(graph);
    expect(result.core.nodes.size).toBe(0);
    expect(result.pureTree).toBeDefined();
    expect(result.trees).toHaveLength(0);
  });

  it('roots a path at its centre', () => {
    const graph = topologyOf(FIXTURES.threeNodePath());
    expect(selectPureTreeRoot(graph)).toBe('B');
  });

  it('breaks a two-centre tie by input order', () => {
    const graph = topologyOf(
      buildLayoutData([
        ['A', 'B'],
        ['B', 'C'],
        ['C', 'D'],
      ])
    );
    // Centres are B and C; B is declared first.
    expect(selectPureTreeRoot(graph)).toBe('B');
  });

  it('treats a single node as a tree rooted at itself', () => {
    const graph = topologyOf(FIXTURES.singleNode());
    const result = decompose(graph);
    expect(result.pureTree?.rootId).toBe('A');
  });

  it('is not fooled by a cycle', () => {
    expect(isPureTree(topologyOf(FIXTURES.triangleCycle()))).toBe(false);
  });
});

describe('mixed core and tree decomposition', () => {
  it('keeps every node of a cycle in the core', () => {
    const result = decompose(topologyOf(FIXTURES.triangleCycle()));
    expect([...result.core.nodes.keys()].sort()).toEqual(['A', 'B', 'C']);
    expect(result.trees).toHaveLength(0);
  });

  it('splits a lollipop into a cyclic core and one attached tree', () => {
    const result = decompose(topologyOf(FIXTURES.lollipop()));
    expect([...result.core.nodes.keys()].sort()).toEqual(['A', 'B', 'C']);
    expect(result.trees).toHaveLength(1);

    const tree = result.trees[0];
    expect(tree.coreNodeId).toBe('C');
    // Pruned nodes plus exactly one copied root.
    const ids = [...tree.graph.nodes.keys()];
    expect(ids).toContain('D');
    expect(ids).toContain('E');
    expect(ids.filter((id) => id === tree.rootCopyId)).toHaveLength(1);
    expect(ids).toHaveLength(3);
  });

  it('never removes a cycle edge', () => {
    const graph = topologyOf(FIXTURES.triangleCycle());
    const result = decompose(graph);
    expect(result.core.edges.size).toBe(3);
  });

  it('gives every core node undirected degree at least two within the core', () => {
    for (const name of ['lollipop', 'twoCyclesBridge', 'hubDegreeFive'] as const) {
      const result = decompose(topologyOf(FIXTURES[name]()));
      for (const id of result.core.nodes.keys()) {
        expect(degree(result.core, id)).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it('puts every pruned node in exactly one tree and covers the component', () => {
    const graph = topologyOf(FIXTURES.twoCyclesBridge());
    const result = decompose(graph);

    const counts = new Map<string, number>();
    for (const id of result.core.nodes.keys()) {
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    for (const tree of result.trees) {
      for (const id of tree.graph.nodes.keys()) {
        if (id === tree.rootCopyId) {
          continue;
        }
        counts.set(id, (counts.get(id) ?? 0) + 1);
      }
    }

    for (const id of graph.nodes.keys()) {
      expect(counts.get(id)).toBe(1);
    }
  });

  it('is unaffected by edge direction', () => {
    const forward = decompose(
      topologyOf(
        buildLayoutData([
          ['A', 'B'],
          ['B', 'C'],
          ['C', 'A'],
          ['C', 'D'],
        ])
      )
    );
    const reversed = decompose(
      topologyOf(
        buildLayoutData([
          ['B', 'A'],
          ['C', 'B'],
          ['A', 'C'],
          ['D', 'C'],
        ])
      )
    );
    expect([...forward.core.nodes.keys()].sort()).toEqual([...reversed.core.nodes.keys()].sort());
    expect(forward.trees).toHaveLength(reversed.trees.length);
  });

  it('carries the original edge bundle onto the rewired root edge', () => {
    const result = decompose(topologyOf(FIXTURES.lollipop()));
    const tree = result.trees[0];
    const rootEdge = [...tree.graph.edges.values()].find(
      (e) => e.source === tree.rootCopyId || e.target === tree.rootCopyId
    );
    expect(rootEdge).toBeDefined();
    expect(rootEdge!.originalEdgeIds.length).toBeGreaterThan(0);
  });

  it('splits unconnected leaves on one core node into separate trees, as components of H', () => {
    const result = decompose(
      topologyOf(
        buildLayoutData([
          ['A', 'B'],
          ['B', 'C'],
          ['C', 'A'],
          ['A', 'X'],
          ['A', 'Y'],
        ])
      )
    );
    // X and Y are not adjacent, so H has two components and therefore two trees.
    expect(result.trees).toHaveLength(2);
    for (const tree of result.trees) {
      expect(tree.coreNodeId).toBe('A');
      const members = [...tree.graph.nodes.keys()].filter((id) => id !== tree.rootCopyId);
      expect(members).toHaveLength(1);
    }
  });

  it('keeps a multi-round pruned subtree as one tree with one copied root', () => {
    // D is pruned only after its own leaves E and F, so `rho` must have been
    // recorded per round: E and F point at D, and D points at the core.
    const result = decompose(
      topologyOf(
        buildLayoutData([
          ['A', 'B'],
          ['B', 'C'],
          ['C', 'A'],
          ['C', 'D'],
          ['D', 'E'],
          ['D', 'F'],
        ])
      )
    );

    expect([...result.core.nodes.keys()].sort()).toEqual(['A', 'B', 'C']);
    expect(result.trees).toHaveLength(1);
    const tree = result.trees[0];
    expect(tree.coreNodeId).toBe('C');
    const members = [...tree.graph.nodes.keys()].filter((id) => id !== tree.rootCopyId);
    expect(members.sort()).toEqual(['D', 'E', 'F']);
  });
});
