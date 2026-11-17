import { describe, it, expect } from 'vitest';
import type { LayoutData } from '../../../types.js';
import { prepareLayoutForSwimlanes } from '../helpers.js';
import { runSwimlaneLayoutCore } from '../layoutCore.js';

const NODE = { width: 100, height: 40, isGroup: false, shape: 'roundedRect', padding: 15 };

// Sales (L1) holds an Intake subgraph (G1: A, B) and C; Warehouse (L2) holds D, E.
function layOut(direction: 'TB' | 'LR') {
  const edge = (start: string, end: string) => ({
    id: `L_${start}_${end}_0`,
    start,
    end,
    type: 'arrow_point',
    arrowTypeEnd: 'arrow_point',
  });
  const data = {
    nodes: [
      { id: 'L2', label: 'Warehouse', isGroup: true, padding: 8 },
      { id: 'L1', label: 'Sales', isGroup: true, padding: 8 },
      { id: 'G1', label: 'Intake', isGroup: true, parentId: 'L1', padding: 8 },
      { id: 'A', label: 'Receive order', parentId: 'G1', ...NODE },
      { id: 'B', label: 'Check stock', parentId: 'G1', ...NODE },
      { id: 'C', label: 'Confirm', parentId: 'L1', ...NODE },
      { id: 'D', label: 'Pick', parentId: 'L2', ...NODE },
      { id: 'E', label: 'Ship', parentId: 'L2', ...NODE },
    ],
    edges: [edge('A', 'B'), edge('D', 'E'), edge('B', 'C'), edge('C', 'D')],
    direction,
    config: { flowchart: { nodeSpacing: 50, rankSpacing: 50 }, swimlane: {} },
    type: 'swimlane',
  } as unknown as LayoutData;
  prepareLayoutForSwimlanes(data);
  runSwimlaneLayoutCore(data);
  return new Map(data.nodes.map((node) => [node.id, node]));
}

const box = (node: { x?: number; y?: number; width?: number; height?: number } | undefined) => ({
  left: node!.x! - node!.width! / 2,
  right: node!.x! + node!.width! / 2,
  top: node!.y! - node!.height! / 2,
  bottom: node!.y! + node!.height! / 2,
});

describe.each(['TB', 'LR'] as const)('%s: a subgraph nested in a lane', (direction) => {
  const nodes = layOut(direction);

  it('is framed around the nodes it holds', () => {
    const group = box(nodes.get('G1'));
    for (const id of ['A', 'B']) {
      const member = box(nodes.get(id));
      expect(group.left).toBeLessThanOrEqual(member.left);
      expect(group.right).toBeGreaterThanOrEqual(member.right);
      expect(group.top).toBeLessThanOrEqual(member.top);
      expect(group.bottom).toBeGreaterThanOrEqual(member.bottom);
    }
  });

  it('sits inside the lane that holds it', () => {
    const group = box(nodes.get('G1'));
    const lane = box(nodes.get('L1'));
    expect(lane.left).toBeLessThanOrEqual(group.left);
    expect(lane.right).toBeGreaterThanOrEqual(group.right);
    expect(lane.top).toBeLessThanOrEqual(group.top);
    expect(lane.bottom).toBeGreaterThanOrEqual(group.bottom);
  });
});
