import { describe, it, expect } from 'vitest';
import type { Graph, NodeId, OrderedLayers, Coordinates } from '../helpers.js';
import { writeBackToLayoutData } from '../helpers.js';
import { postProcessSwimlaneLayout as applySwimlaneDirectionTransform } from '../postProcessing.js';

/**
 * A pool holding one lane, which holds a group, which holds the two nodes. Framing the pool
 * adds a title band and moves everything the band's width; a group has to travel with the
 * nodes it is drawn around.
 */
function mkPoolWithNestedGroup(): { g: Graph; ordered: OrderedLayers; coords: Coordinates } {
  const layout: any = { nodes: [], edges: [], config: {} };
  const nodeById = new Map<NodeId, any>();

  const pool: any = { id: 'pool1', isGroup: true, padding: 20, metadata: { laneRole: 'pool' } };
  const lane: any = {
    id: 'lane1',
    isGroup: true,
    parentId: 'pool1',
    padding: 20,
    metadata: { laneRole: 'lane' },
  };
  const group: any = { id: 'group1', isGroup: true, parentId: 'lane1', padding: 56 };
  const A: any = { id: 'A', isGroup: false, parentId: 'group1', width: 80, height: 40 };
  const B: any = { id: 'B', isGroup: false, parentId: 'group1', width: 80, height: 40 };

  for (const node of [pool, lane, group, A, B]) {
    layout.nodes.push(node);
    nodeById.set(node.id, node);
  }

  const g: Graph = { nodes: ['A', 'B'], edges: [], layout, nodeById } as any;
  const ordered: OrderedLayers = { layers: [['A'], ['B']] };
  const coords: Coordinates = { x: { A: 0, B: 0 }, y: { A: 0, B: 120 } } as any;

  return { g, ordered, coords };
}

const centreOf = (nodes: any[], axis: 'x' | 'y') => {
  const low = Math.min(...nodes.map((n) => n[axis] - (axis === 'x' ? n.width : n.height) / 2));
  const high = Math.max(...nodes.map((n) => n[axis] + (axis === 'x' ? n.width : n.height) / 2));
  return (low + high) / 2;
};

describe('a group inside a pool', () => {
  it('travels with the nodes it is drawn around (LR)', () => {
    const { g, ordered, coords } = mkPoolWithNestedGroup();
    writeBackToLayoutData(g, ordered, coords, { nodeGap: 40, layerGap: 120 });
    applySwimlaneDirectionTransform(g.layout, 'LR');

    const group = g.nodeById.get('group1') as any;
    const members = [g.nodeById.get('A'), g.nodeById.get('B')] as any[];

    expect(group.x).toBeCloseTo(centreOf(members, 'x'), 5);
  });
});
