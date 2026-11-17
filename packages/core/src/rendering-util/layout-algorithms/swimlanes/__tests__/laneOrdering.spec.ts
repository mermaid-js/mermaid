import { describe, expect, it } from 'vitest';
import type { Graph, NodeId } from '../helpers.js';
import {
  buildWeightedLaneEdges,
  laneArrangementCost,
  optimizeTopLaneOrder,
} from '../laneOrdering.js';
import { buildTopLaneOrder } from '../phase2.options.js';

function mkGraph(lanes: string[], edgePairs: [string, string][]): Graph {
  const layout: any = { nodes: [], edges: [] };
  const nodeById = new Map<NodeId, any>();

  for (const laneId of [...lanes].reverse()) {
    const lane = { id: laneId, isGroup: true };
    layout.nodes.push(lane);
    nodeById.set(laneId, lane);
  }

  for (const laneId of lanes) {
    const node = { id: `${laneId}-node`, isGroup: false, parentId: laneId };
    layout.nodes.push(node);
    nodeById.set(node.id, node);
  }

  layout.edges = edgePairs.map(([srcLane, dstLane], index) => ({
    id: `e${index}`,
    start: `${srcLane}-node`,
    end: `${dstLane}-node`,
    type: 'normal',
  }));

  return {
    nodes: [...nodeById.keys()],
    edges: layout.edges.map((edge: any) => ({
      id: edge.id,
      src: edge.start,
      dst: edge.end,
      ref: edge,
    })),
    layout,
    nodeById,
  };
}

describe('automatic swimlane ordering', () => {
  it('counts visible inter-lane edges as undirected weights', () => {
    const g = mkGraph(
      ['lane1', 'lane2', 'lane3'],
      [
        ['lane1', 'lane2'],
        ['lane2', 'lane1'],
        ['lane1', 'lane3'],
        ['lane1', 'lane1'],
      ]
    );
    g.layout.edges.push({
      id: 'layout-only-label',
      start: 'lane1-node',
      end: 'lane2-node',
      isLayoutOnly: true,
    });

    expect(buildWeightedLaneEdges(g)).toEqual([
      { a: 'lane1', b: 'lane2', weight: 2 },
      { a: 'lane1', b: 'lane3', weight: 1 },
    ]);
  });

  it('reduces weighted linear arrangement cost when automatic ordering is enabled', () => {
    const g = mkGraph(
      ['laneA', 'laneB', 'laneC', 'laneD'],
      [
        ['laneA', 'laneD'],
        ['laneA', 'laneD'],
        ['laneA', 'laneD'],
        ['laneA', 'laneD'],
      ]
    );
    const weights = buildWeightedLaneEdges(g);
    const sourceOrder = buildTopLaneOrder(g);
    const optimized = optimizeTopLaneOrder(g, { restarts: 8 });

    expect(laneArrangementCost(optimized, weights)).toBeLessThan(
      laneArrangementCost(sourceOrder, weights)
    );
    expect(optimizeTopLaneOrder(g, { restarts: 8 })).toEqual(optimized);
  });

  it('preserves source order when every lane order has the same cost', () => {
    const g = mkGraph(
      ['laneA', 'laneB', 'laneC'],
      [
        ['laneA', 'laneB'],
        ['laneA', 'laneC'],
        ['laneB', 'laneC'],
      ]
    );

    expect(optimizeTopLaneOrder(g, { restarts: 8 })).toEqual(['laneA', 'laneB', 'laneC']);
  });
});
