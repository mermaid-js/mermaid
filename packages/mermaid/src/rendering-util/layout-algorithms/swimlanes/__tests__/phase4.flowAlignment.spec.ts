import { describe, it, expect } from 'vitest';
import type { Edge, LayoutData, Node } from '../../../types.js';
import { toGraphView } from '../helpers.js';
import { sugiyamaLayout } from '../pipeline.js';

const leaf = (id: string, parentId: string, width = 120, height = 60): Node =>
  ({ id, isGroup: false, parentId, width, height }) as Node;
const container = (id: string, parentId?: string): Node =>
  ({ id, isGroup: true, ...(parentId ? { parentId } : {}) }) as Node;
const flow = (id: string, start: string, end: string): Edge =>
  ({ id, start, end, type: 'normal' }) as Edge;

/** Lays out a single lane holding a chain, and whatever else the caller adds beside it. */
function layOut(extra: Node[] = []) {
  const layout = {
    nodes: [
      container('Lane'),
      leaf('s1', 'Lane', 36, 36),
      container('Group', 'Lane'),
      leaf('t1', 'Group'),
      leaf('t2', 'Group'),
      leaf('e1', 'Lane', 36, 36),
      ...extra,
    ],
    edges: [flow('f1', 's1', 't1'), flow('f2', 't1', 't2'), flow('f3', 't2', 'e1')],
    config: { flowchart: { nodeSpacing: 35, rankSpacing: 40 } },
  } as LayoutData;

  const { ordered, coordinates } = sugiyamaLayout(toGraphView(layout), {
    nodeGap: 35,
    layerGap: 40,
    // The options a diagram laying its branches out side by side is given.
    ignoreCrossLaneEdges: false,
    spreadByOwnExtent: true,
    gapIsRoomBetween: true,
    direction: 'LR',
  });
  return { layers: ordered.layers, x: coordinates.x };
}

const CHAIN = ['s1', 't1', 't2', 'e1'];

describe('a lane keeps its flow on one line', () => {
  it('leaves lanes and groups out of the layers they enclose', () => {
    const { layers } = layOut();
    expect(layers.flat()).not.toContain('Lane');
    expect(layers.flat()).not.toContain('Group');
  });

  it('gives a lane or group no place of its own across a layer', () => {
    const { x } = layOut();
    expect(x.Lane).toBeUndefined();
    expect(x.Group).toBeUndefined();
  });

  it('holds the chain on one line when the lane also holds nodes no edge touches', () => {
    const { x } = layOut([leaf('d1', 'Lane'), leaf('ds1', 'Lane'), leaf('n1', 'Lane')]);
    expect(new Set(CHAIN.map((id) => x[id])).size).toBe(1);
  });

  it('still places the nodes no edge touches, clear of the flow', () => {
    const { x } = layOut([leaf('d1', 'Lane'), leaf('ds1', 'Lane'), leaf('n1', 'Lane')]);
    const loose = ['d1', 'ds1', 'n1'].map((id) => x[id]);
    for (const at of loose) {
      expect(at).toBeTypeOf('number');
      // Clear of the start event, the only node on their layer the flow runs through.
      expect(Math.abs(at - x.s1)).toBeGreaterThan((36 + 120) / 2);
    }
    expect(new Set(loose).size).toBe(loose.length);
  });
});
