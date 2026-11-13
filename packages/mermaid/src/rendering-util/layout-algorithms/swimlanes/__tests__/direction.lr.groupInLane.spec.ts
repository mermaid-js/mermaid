import { describe, it, expect } from 'vitest';
import type { Graph, NodeId, OrderedLayers, Coordinates } from '../helpers.js';
import { writeBackToLayoutData } from '../helpers.js';
import { postProcessSwimlaneLayout as applySwimlaneDirectionTransform } from '../postProcessing.js';

/**
 * A lane holding a group, which in turn holds the two nodes. The group's padding is much
 * larger than the lane's, so the group's box extends well past the nodes it contains - the
 * case that tells a lane sized from its groups apart from one sized from the leaf nodes.
 */
function mkLaneWithNestedGroup(): { g: Graph; ordered: OrderedLayers; coords: Coordinates } {
  const layout: any = { nodes: [], edges: [], config: {} };
  const nodeById = new Map<NodeId, any>();

  const lane: any = { id: 'lane1', isGroup: true, padding: 20 };
  const group: any = { id: 'group1', isGroup: true, parentId: 'lane1', padding: 56 };
  const A: any = { id: 'A', isGroup: false, parentId: 'group1', width: 80, height: 40 };
  const B: any = { id: 'B', isGroup: false, parentId: 'group1', width: 80, height: 40 };

  for (const node of [lane, group, A, B]) {
    layout.nodes.push(node);
    nodeById.set(node.id, node);
  }

  const g: Graph = { nodes: ['A', 'B'], edges: [], layout, nodeById } as any;
  const ordered: OrderedLayers = { layers: [['A'], ['B']] };
  const coords: Coordinates = { x: { A: 0, B: 0 }, y: { A: 0, B: 120 } } as any;

  return { g, ordered, coords };
}

const spanX = (node: any) => [node.x - node.width / 2, node.x + node.width / 2];
const spanY = (node: any) => [node.y - node.height / 2, node.y + node.height / 2];

describe('a lane containing a group', () => {
  it('reserves room for the group box, not just for the nodes inside it (LR)', () => {
    const { g, ordered, coords } = mkLaneWithNestedGroup();
    writeBackToLayoutData(g, ordered, coords, { nodeGap: 40, layerGap: 120 });
    applySwimlaneDirectionTransform(g.layout, 'LR');

    const lane = g.nodeById.get('lane1') as any;
    const group = g.nodeById.get('group1') as any;

    // In LR the lane's title band is a strip carved out of the left of the lane's width, so
    // the space a group has to fit into is the lane minus that strip.
    const titleBand = lane.groupTitleRect.right - lane.groupTitleRect.left;
    const [laneLeft, laneRight] = spanX(lane);
    const bodyLeft = laneLeft + titleBand;
    const [groupLeft, groupRight] = spanX(group);

    expect(titleBand).toBeGreaterThan(0);
    expect(groupLeft).toBeGreaterThanOrEqual(bodyLeft);
    expect(groupRight).toBeLessThanOrEqual(laneRight);

    const [laneTop, laneBottom] = spanY(lane);
    const [groupTop, groupBottom] = spanY(group);
    expect(groupTop).toBeGreaterThanOrEqual(laneTop);
    expect(groupBottom).toBeLessThanOrEqual(laneBottom);
  });

  it('keeps the group wider than the nodes it contains, so the check above can fail', () => {
    const { g, ordered, coords } = mkLaneWithNestedGroup();
    writeBackToLayoutData(g, ordered, coords, { nodeGap: 40, layerGap: 120 });
    applySwimlaneDirectionTransform(g.layout, 'LR');

    const group = g.nodeById.get('group1') as any;
    const [groupLeft, groupRight] = spanX(group);
    const nodeLeft = Math.min(...['A', 'B'].map((id) => spanX(g.nodeById.get(id))[0]));
    const nodeRight = Math.max(...['A', 'B'].map((id) => spanX(g.nodeById.get(id))[1]));

    expect(groupLeft).toBeLessThan(nodeLeft);
    expect(groupRight).toBeGreaterThan(nodeRight);
  });
});
