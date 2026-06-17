import { describe, it, expect } from 'vitest';
import type { Graph, NodeId, OrderedLayers, Coordinates } from '../helpers.js';
import { writeBackToLayoutData } from '../helpers.js';

interface TestNode {
  id: string;
  isGroup?: boolean;
  parentId?: string;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  padding?: number;
}

function mkGraphWithLanesAndNodes(): { g: Graph; ordered: OrderedLayers; coords: Coordinates } {
  const layout: any = { nodes: [], edges: [] };
  const nodeById = new Map<NodeId, any>();

  // Two top-level lanes with different child spans
  const lane1: TestNode = { id: 'lane1', isGroup: true, padding: 20 };
  const lane2: TestNode = { id: 'lane2', isGroup: true, padding: 20 };
  layout.nodes.push(lane1, lane2);
  nodeById.set('lane1', lane1);
  nodeById.set('lane2', lane2);

  // Children in lane1 span more vertically than lane2
  const A: TestNode = { id: 'A', isGroup: false, parentId: 'lane1', width: 80, height: 40 };
  const B: TestNode = { id: 'B', isGroup: false, parentId: 'lane1', width: 80, height: 40 };
  const C: TestNode = { id: 'C', isGroup: false, parentId: 'lane2', width: 80, height: 40 };
  layout.nodes.push(A, B, C);
  nodeById.set('A', A);
  nodeById.set('B', B);
  nodeById.set('C', C);

  const g: Graph = {
    nodes: ['A', 'B', 'C'],
    edges: [],
    layout,
    nodeById,
  } as any;

  const ordered: OrderedLayers = { layers: [['A', 'C'], ['B']] };

  const coords: Coordinates = {
    x: { A: -100, C: 100, B: -100 },
    y: { A: 0, C: 0, B: 120 },
  } as any;

  return { g, ordered, coords };
}

describe('writeBackToLayoutData lane sizing', () => {
  it('makes all top-level lanes share the same height and vertical center', () => {
    const { g, ordered, coords } = mkGraphWithLanesAndNodes();

    writeBackToLayoutData(g, ordered, coords, { nodeGap: 40, layerGap: 120 });

    const layout = g.layout as any;
    const lane1 = layout.nodes.find((n: TestNode) => n.id === 'lane1') as TestNode;
    const lane2 = layout.nodes.find((n: TestNode) => n.id === 'lane2') as TestNode;

    expect(lane1.height).toBeGreaterThan(0);
    expect(lane2.height).toBeGreaterThan(0);
    expect(lane1.height).toBeCloseTo(lane2.height!, 6);
    expect(lane1.y).toBeCloseTo(lane2.y ?? 0, 6);
  });
});
