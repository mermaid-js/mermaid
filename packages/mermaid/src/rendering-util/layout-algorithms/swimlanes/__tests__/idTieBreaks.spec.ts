import { describe, expect, it } from 'vitest';
import { buildDrivingTree } from '../driving-tree.js';
import type { EdgeRef, Graph, NodeId } from '../helpers.js';
import {
  buildInDegreeMap,
  buildSortedSuccessorMap,
  sortedZeroInDegreeNodes,
} from '../phase0.helpers.js';
import { removeCycles_DFS } from '../phase1.cycles.js';
import { assignLayers_LaneAwareCompact } from '../phase2.laneAwareCompact.js';
import { compareByRankThenId } from '../phase2.multitree.core.js';

// `B` and `b` sort one way by code unit and the other way in English, and `z` and `t` sort differently in
// Estonian. A pass that breaks a tie between ids must follow the code-unit order: upper case first.

type EdgeSpec = [src: string, dst: string, id?: string];

function mkGraph(
  nodes: string[],
  edgeSpecs: EdgeSpec[],
  laneOf: Record<string, string> = {}
): Graph {
  const lanes = [...new Set(Object.values(laneOf))].map((id) => ({ id, isGroup: true }));
  const layoutNodes = [
    ...lanes,
    ...nodes.map((id) => ({ id, ...(laneOf[id] ? { parentId: laneOf[id] } : {}) })),
  ];
  const edges: EdgeRef[] = edgeSpecs.map(([src, dst, id], index) => ({
    id: id ?? `e${index}`,
    src,
    dst,
    ref: { id: id ?? `e${index}`, start: src, end: dst } as EdgeRef['ref'],
  }));
  return {
    nodes: [...nodes],
    edges,
    layout: { nodes: layoutNodes, edges: [] } as unknown as Graph['layout'],
    nodeById: new Map<NodeId, Graph['layout']['nodes'][number]>(
      layoutNodes.map((node) => [node.id, node as Graph['layout']['nodes'][number]])
    ),
  };
}

describe('Swimlanes: ties between ids break by code unit', () => {
  it('lists the successors of a node in code-unit order', () => {
    const g = mkGraph(
      ['a', 'z', 'b', 't', 'B'],
      [
        ['a', 'z'],
        ['a', 'b'],
        ['a', 't'],
        ['a', 'B'],
      ]
    );
    expect(buildSortedSuccessorMap(g).get('a')).toEqual(['B', 'b', 't', 'z']);
  });

  it('lists the linked nodes with no incoming edge in code-unit order', () => {
    const g = mkGraph(
      ['z', 'b', 't', 'B', 'sink'],
      [
        ['z', 'sink'],
        ['b', 'sink'],
        ['t', 'sink'],
        ['B', 'sink'],
      ]
    );
    expect(sortedZeroInDegreeNodes(g, buildInDegreeMap(g))).toEqual(['B', 'b', 't', 'z']);
  });

  it('removes the cycle at the edge the code-unit order reaches last', () => {
    // v reaches B first, so b -> B closes the cycle; declaration or English order reaches b first, and B -> b does.
    const g = mkGraph(
      ['v', 'b', 'B'],
      [
        ['v', 'b', 'e0'],
        ['v', 'B', 'e1'],
        ['B', 'b', 'e2'],
        ['b', 'B', 'e3'],
      ]
    );
    expect(removeCycles_DFS(g).reversed.map((edge) => edge.id)).toEqual(['e3']);
  });

  it('reverses parallel back edges in the order of their ids', () => {
    const g = mkGraph(
      ['a', 'b'],
      [
        ['a', 'b', 'x'],
        ['b', 'a', 'q2'],
        ['b', 'a', 'Q1'],
      ]
    );
    expect(removeCycles_DFS(g).reversed.map((edge) => edge.id)).toEqual(['Q1', 'q2']);
  });

  it('orders equal ranks by id and keeps lower ranks first', () => {
    const rankOf = { z: 1, t: 1, B: 1, b: 1, a: 0, y: 2 };
    expect(['y', 'z', 'b', 't', 'a', 'B'].sort(compareByRankThenId(rankOf))).toEqual([
      'a',
      'B',
      'b',
      't',
      'z',
      'y',
    ]);
  });

  it('lists the neighbours of a node in the driving tree in code-unit order', () => {
    const g = mkGraph(
      ['a', 'z', 'b', 't', 'B'],
      [
        ['a', 'z'],
        ['a', 'b'],
        ['a', 't'],
        ['a', 'B'],
      ]
    );
    expect(buildDrivingTree(g).adjacency.get('a')).toEqual(['B', 'b', 't', 'z']);
  });

  it('falls back to code-unit order for the traversal order of a graph with a cycle', () => {
    const g = mkGraph(
      ['z', 'b', 't', 'B'],
      [
        ['z', 't'],
        ['t', 'z'],
      ]
    );
    expect(buildDrivingTree(g).topologicalOrder).toEqual(['B', 'b', 't', 'z']);
  });

  it('gives the earlier layer of a lane to the id that sorts first in code units', () => {
    // b and B each wait for their own parent and share a lane, so one of them has to move down a layer.
    const g = mkGraph(
      ['s1', 's2', 'b', 'B'],
      [
        ['s1', 'b'],
        ['s2', 'B'],
      ],
      { s1: 'L', s2: 'L', b: 'L', B: 'L' }
    );
    const { rankOf } = assignLayers_LaneAwareCompact(g, { direction: 'LR' });
    expect(rankOf.B).toBeLessThan(rankOf.b);
  });
});
