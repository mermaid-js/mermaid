import { describe, it, expect } from 'vitest';
import type { Graph, NodeId, OrderedLayers, Coordinates } from '../helpers.js';
import { writeBackToLayoutData } from '../helpers.js';
import { postProcessSwimlaneLayout as applySwimlaneDirectionTransform } from '../postProcessing.js';

/**
 * Two bands, only one of which holds anything. A participant drawn without its internals
 * is a black box pool in BPMN, so a band with no content is a shape the notation asks
 * for rather than a malformed diagram.
 */
function mkLanesWithAnEmptyOne(): { g: Graph; ordered: OrderedLayers; coords: Coordinates } {
  const layout: any = { nodes: [], edges: [], config: {} };
  const nodeById = new Map<NodeId, any>();

  const filled: any = { id: 'filled', isGroup: true, padding: 20 };
  const empty: any = { id: 'empty', isGroup: true, padding: 20 };
  const a: any = { id: 'a', isGroup: false, parentId: 'filled', width: 80, height: 40 };
  const b: any = { id: 'b', isGroup: false, parentId: 'filled', width: 80, height: 40 };

  for (const node of [filled, empty, a, b]) {
    layout.nodes.push(node);
    nodeById.set(node.id, node);
  }

  const g: Graph = { nodes: ['a', 'b'], edges: [], layout, nodeById } as any;
  const ordered: OrderedLayers = { layers: [['a'], ['b']] };
  const coords: Coordinates = { x: { a: 0, b: 0 }, y: { a: 0, b: 120 } } as any;
  return { g, ordered, coords };
}

const spanY = (node: any) => [node.y - node.height / 2, node.y + node.height / 2];

describe('a band with no content', () => {
  it('is given a real extent instead of collapsing onto the origin (LR)', () => {
    const { g, ordered, coords } = mkLanesWithAnEmptyOne();
    writeBackToLayoutData(g, ordered, coords, { nodeGap: 40, layerGap: 120 });
    applySwimlaneDirectionTransform(g.layout, 'LR');

    const empty = g.nodeById.get('empty') as any;
    const filled = g.nodeById.get('filled') as any;

    expect(empty.height).toBeGreaterThan(0);
    expect(empty.width).toBe(filled.width);
    expect(empty.groupTitleRect).toBeDefined();
  });

  it('does not overlap the band that does have content', () => {
    const { g, ordered, coords } = mkLanesWithAnEmptyOne();
    writeBackToLayoutData(g, ordered, coords, { nodeGap: 40, layerGap: 120 });
    applySwimlaneDirectionTransform(g.layout, 'LR');

    const [emptyTop, emptyBottom] = spanY(g.nodeById.get('empty'));
    const [filledTop, filledBottom] = spanY(g.nodeById.get('filled'));

    const overlap = Math.min(emptyBottom, filledBottom) - Math.max(emptyTop, filledTop);
    expect(overlap).toBeLessThanOrEqual(0.5);
  });
});

describe('a diagram that is bands and nothing else', () => {
  // A collaboration may be drawn as participants alone, each a black box. There is no
  // content to lay the bands out against, and they were left at zero height stacked on
  // the origin with every title written over the next.
  it('gives each band a size of its own', () => {
    const layout = {
      nodes: [
        { id: 'p1', isGroup: true, label: 'Participant 1', metadata: { laneRole: 'pool' } },
        { id: 'p2', isGroup: true, label: 'Participant 2', metadata: { laneRole: 'pool' } },
        { id: 'p3', isGroup: true, label: 'Participant 3', metadata: { laneRole: 'pool' } },
      ],
      edges: [],
      config: { flowchart: {} },
      direction: 'LR',
    } as unknown as Parameters<typeof applySwimlaneDirectionTransform>[0];

    applySwimlaneDirectionTransform(layout, 'LR');

    const bands = (layout.nodes ?? []).filter((n) => n.isGroup);
    for (const band of bands) {
      expect(band.height ?? 0).toBeGreaterThan(0);
      expect(band.width ?? 0).toBeGreaterThan(0);
    }
    const tops = bands.map((b) => (b.y ?? 0) - (b.height ?? 0) / 2).sort((a, b) => a - b);
    const bottoms = bands.map((b) => (b.y ?? 0) + (b.height ?? 0) / 2).sort((a, b) => a - b);
    // Stacked, not piled up: each one starts where the one above it ended.
    for (let i = 1; i < tops.length; i++) {
      expect(tops[i]).toBeGreaterThanOrEqual(bottoms[i - 1] - 1);
    }
  });
});
