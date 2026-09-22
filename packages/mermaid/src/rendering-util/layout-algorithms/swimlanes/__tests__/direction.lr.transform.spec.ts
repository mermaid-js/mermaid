import { describe, it, expect } from 'vitest';
import type { LayoutData } from '../../../types.js';
import type { Graph, NodeId, OrderedLayers, Coordinates } from '../helpers.js';
import { writeBackToLayoutData } from '../helpers.js';
import { postProcessSwimlaneLayout as applySwimlaneDirectionTransform } from '../postProcessing.js';

function makeTestLayout(): LayoutData {
  // Minimal layout with two nodes in the same lane but different layers (vertical positions)
  // and one node in another lane.
  return {
    nodes: [
      { id: 'A', isGroup: false, x: 0, y: 0 } as any,
      { id: 'B', isGroup: false, x: 0, y: 100 } as any,
      { id: 'C', isGroup: false, x: 50, y: 0 } as any,
    ],
    edges: [],
    // Other LayoutData fields are not used by the transform helper in this spec.
    config: {} as any,
  };
}

function mkGraphWithLanesAndNodes(): { g: Graph; ordered: OrderedLayers; coords: Coordinates } {
  const layout: any = { nodes: [], edges: [], config: {} };
  const nodeById = new Map<NodeId, any>();

  // Two top-level lanes with different child spans
  const lane1: any = { id: 'lane1', isGroup: true, padding: 20 };
  const lane2: any = { id: 'lane2', isGroup: true, padding: 20 };
  layout.nodes.push(lane1, lane2);
  nodeById.set('lane1', lane1);
  nodeById.set('lane2', lane2);

  // Children in lane1 span more vertically than lane2
  const A: any = { id: 'A', isGroup: false, parentId: 'lane1', width: 80, height: 40 };
  const B: any = { id: 'B', isGroup: false, parentId: 'lane1', width: 80, height: 40 };
  const C: any = { id: 'C', isGroup: false, parentId: 'lane2', width: 80, height: 40 };
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

describe('applySwimlaneDirectionTransform', () => {
  it('leaves layout unchanged for TB direction', () => {
    const layout = makeTestLayout();
    const snapshot = layout.nodes.map((n) => ({ id: n.id, x: n.x, y: n.y }));

    applySwimlaneDirectionTransform(layout, 'TB');

    for (const node of layout.nodes) {
      const before = snapshot.find((s) => s.id === node.id)!;
      expect(node.x).toBe(before.x);
      expect(node.y).toBe(before.y);
    }
  });

  it('maps vertical layering to horizontal progression for LR', () => {
    const layout = makeTestLayout();

    applySwimlaneDirectionTransform(layout, 'LR');

    const A = layout.nodes.find((n) => n.id === 'A')!;
    const B = layout.nodes.find((n) => n.id === 'B')!;
    const C = layout.nodes.find((n) => n.id === 'C')!;

    // A and B started in the same lane (same x) but different layers (y).
    // After transform for LR, they should share the same y (same horizontal lane)
    // but B should be to the right of A (larger x).
    expect(A.y).toBe(B.y);
    expect(B.x!).toBeGreaterThan(A.x!);

    // C started in a different lane (different x) on the same layer as A.
    // After transform, it should share the same x as A (same horizontal progression)
    // but be on a different y (different horizontal lane).
    expect(C.x).toBe(A.x);
    expect(C.y).not.toBe(A.y);
  });

  it('maps vertical layering to reverse vertical progression for BT', () => {
    const layout = makeTestLayout();

    applySwimlaneDirectionTransform(layout, 'BT');

    const A = layout.nodes.find((n) => n.id === 'A')!;
    const B = layout.nodes.find((n) => n.id === 'B')!;
    const C = layout.nodes.find((n) => n.id === 'C')!;

    expect(B.y!).toBeLessThan(A.y!);
    expect(A.x).toBe(B.x);
    expect(C.y).toBe(A.y);
  });

  it('maps vertical layering to reverse horizontal progression for RL', () => {
    const layout = makeTestLayout();

    applySwimlaneDirectionTransform(layout, 'RL');

    const A = layout.nodes.find((n) => n.id === 'A')!;
    const B = layout.nodes.find((n) => n.id === 'B')!;
    const C = layout.nodes.find((n) => n.id === 'C')!;

    expect(A.y).toBe(B.y);
    expect(B.x!).toBeLessThan(A.x!);
    expect(C.x).toBe(A.x);
    expect(C.y).not.toBe(A.y);
  });

  it('positions lanes as horizontal strips for LR (lanes separated by y, shared x span)', () => {
    const { g, ordered, coords } = mkGraphWithLanesAndNodes();

    // First, compute canonical TB coordinates and lane sizing.
    writeBackToLayoutData(g, ordered, coords, { nodeGap: 40, layerGap: 120 });

    const layout = g.layout;
    const allNodes = layout.nodes ?? [];
    const lanes = allNodes.filter((n: any) => n.isGroup);

    // Sanity: we need at least two lanes to reason about their relative placement.
    expect(lanes.length).toBeGreaterThanOrEqual(2);

    // Capture initial lane positions in canonical TB orientation.
    const lanesBefore = [...(lanes as any[])].sort((a, b) =>
      String(a.id).localeCompare(String(b.id))
    );
    const lane1Before: any = lanesBefore[0];
    const lane2Before: any = lanesBefore[1];

    // In TB we expect lanes to be arranged as vertical columns:
    // same vertical center (y), different horizontal centers (x).
    expect(lane1Before.y).toBeCloseTo(lane2Before.y as number, 6);
    expect(lane1Before.x).not.toBeCloseTo(lane2Before.x as number, 6);

    applySwimlaneDirectionTransform(layout, 'LR');

    const lanesAfter = (layout.nodes ?? []).filter((n: any) => n.isGroup);
    lanesAfter.sort((a: any, b: any) => String(a.id).localeCompare(String(b.id)));
    const lane1After: any = lanesAfter[0];
    const lane2After: any = lanesAfter[1];

    // After LR transform, lanes should behave like horizontal strips:
    // they should be stacked by y and share (approximately) the same x center.
    expect(lane1After.y).not.toBeCloseTo(lane2After.y as number, 6);
    const deltaX = Math.abs((lane1After.x as number) - (lane2After.x as number));
    expect(deltaX).toBeLessThan(1e-6);
  });

  it('keeps lane children inside their lane bounds after LR transform', () => {
    const { g, ordered, coords } = mkGraphWithLanesAndNodes();

    // First, write back TB coordinates and lane sizing.
    writeBackToLayoutData(g, ordered, coords, { nodeGap: 40, layerGap: 120 });

    const layout = g.layout;
    const allNodes = layout.nodes ?? [];
    const lanes = allNodes.filter((n: any) => n.isGroup);
    const contentNodes = allNodes.filter((n: any) => !n.isGroup);

    // Sanity check: we actually have lanes and content nodes.
    expect(lanes.length).toBeGreaterThan(0);
    expect(contentNodes.length).toBeGreaterThan(0);

    applySwimlaneDirectionTransform(layout, 'LR');

    for (const lane of lanes as any[]) {
      const laneTop = (lane.y ?? 0) - (lane.height ?? 0) / 2;
      const laneBottom = (lane.y ?? 0) + (lane.height ?? 0) / 2;
      const children = contentNodes.filter((n: any) => n.parentId === lane.id);
      for (const child of children) {
        const childTop = (child.y ?? 0) - (child.height ?? 0) / 2;
        const childBottom = (child.y ?? 0) + (child.height ?? 0) / 2;
        expect(childTop).toBeGreaterThanOrEqual(laneTop - 1e-6);
        expect(childBottom).toBeLessThanOrEqual(laneBottom + 1e-6);
      }
    }
  });

  it('keeps nested groups as child clusters inside top-level LR lanes', () => {
    const layout: LayoutData = {
      nodes: [
        { id: 'lane1', isGroup: true, padding: 20 } as any,
        { id: 'lane2', isGroup: true, padding: 20 } as any,
        { id: 'nested', isGroup: true, parentId: 'lane1', padding: 12, shape: 'rect' } as any,
        { id: 'A', isGroup: false, parentId: 'nested', x: 0, y: 0, width: 80, height: 40 } as any,
        { id: 'B', isGroup: false, parentId: 'lane2', x: 120, y: 0, width: 80, height: 40 } as any,
      ],
      edges: [],
      config: {} as any,
    };

    applySwimlaneDirectionTransform(layout, 'LR');

    const lane1 = layout.nodes.find((n) => n.id === 'lane1') as any;
    const lane2 = layout.nodes.find((n) => n.id === 'lane2') as any;
    const nested = layout.nodes.find((n) => n.id === 'nested') as any;
    const child = layout.nodes.find((n) => n.id === 'A') as any;

    expect(nested.parentId).toBe('lane1');
    expect(nested.shape).toBe('rect');
    expect(nested.x).toBeCloseTo(child.x, 6);
    expect(nested.width).toBeLessThan(lane1.width);
    expect(lane1.x).toBeCloseTo(lane2.x, 6);

    const nestedLeft = nested.x - nested.width / 2;
    const nestedRight = nested.x + nested.width / 2;
    expect(child.x - child.width / 2).toBeGreaterThanOrEqual(nestedLeft - 1e-6);
    expect(child.x + child.width / 2).toBeLessThanOrEqual(nestedRight + 1e-6);
  });
});
