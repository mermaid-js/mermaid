import { describe, it, expect } from 'vitest';
import type { LayoutData } from '../../../types.js';
import { prepareLayoutForSwimlanes } from '../helpers.js';
import { runSwimlaneLayoutCore } from '../layoutCore.js';

const NODE = { width: 100, height: 40, isGroup: false, shape: 'roundedRect', padding: 15 };
// The `padding` every group in these sources declares; a lane grows by it around a nested group.
const GROUP_PADDING = 8;

const edge = (start: string, end: string) => ({
  id: `L_${start}_${end}_0`,
  start,
  end,
  type: 'arrow_point',
  arrowTypeEnd: 'arrow_point',
});

function layOut(nodes: object[], edges: object[], direction: 'TB' | 'LR' | 'RL') {
  const data = {
    nodes,
    edges,
    direction,
    config: { flowchart: { nodeSpacing: 50, rankSpacing: 50 }, swimlane: {} },
    type: 'swimlane',
  } as unknown as LayoutData;
  prepareLayoutForSwimlanes(data);
  runSwimlaneLayoutCore(data);
  return new Map(data.nodes.map((node) => [node.id, node]));
}

// Two steps in the Sales lane, either directly in it or inside an Intake subgraph.
function salesLane(direction: 'TB' | 'LR' | 'RL', nested: boolean) {
  const parentId = nested ? 'G1' : 'L1';
  return layOut(
    [
      { id: 'L1', label: 'Sales', isGroup: true, padding: GROUP_PADDING },
      ...(nested
        ? [{ id: 'G1', label: 'Intake', isGroup: true, parentId: 'L1', padding: GROUP_PADDING }]
        : []),
      { id: 'A', label: 'A', parentId, ...NODE },
      { id: 'B', label: 'B', parentId, ...NODE },
    ],
    [edge('A', 'B')],
    direction
  ).get('L1')!;
}

describe.each(['LR', 'RL'] as const)('%s: a lane holding a nested subgraph', (direction) => {
  it('is as much larger than the same lane without it as the group pads', () => {
    const plain = salesLane(direction, false);
    const nested = salesLane(direction, true);

    expect(nested.width! - plain.width!).toBe(GROUP_PADDING);
    expect(nested.height! - plain.height!).toBe(GROUP_PADDING);
  });
});

describe('TB: a pool-shaped group holding two lanes that hold the nodes', () => {
  const nodes = layOut(
    [
      { id: 'P', label: 'Company', isGroup: true, padding: GROUP_PADDING },
      { id: 'L1', label: 'Sales', isGroup: true, parentId: 'P', padding: GROUP_PADDING },
      { id: 'L2', label: 'Ops', isGroup: true, parentId: 'P', padding: GROUP_PADDING },
      { id: 'A', label: 'A', parentId: 'L1', ...NODE },
      { id: 'B', label: 'B', parentId: 'L2', ...NODE },
    ],
    [edge('A', 'B')],
    'TB'
  );

  it('draws the outer group with a size', () => {
    const outer = nodes.get('P')!;
    expect(outer.width).toBeGreaterThan(0);
    expect(outer.height).toBeGreaterThan(0);
  });

  it('draws the outer group around both inner ones', () => {
    const outer = nodes.get('P')!;
    for (const id of ['L1', 'L2']) {
      const inner = nodes.get(id)!;
      expect(outer.y! - outer.height! / 2).toBeLessThanOrEqual(inner.y! - inner.height! / 2);
      expect(outer.y! + outer.height! / 2).toBeGreaterThanOrEqual(inner.y! + inner.height! / 2);
    }
  });
});
