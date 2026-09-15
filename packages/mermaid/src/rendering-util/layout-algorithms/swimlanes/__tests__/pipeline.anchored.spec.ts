import { describe, it, expect } from 'vitest';
import type { LayoutData, Node } from '../../../types.js';
import { runSwimlaneLayoutCore } from '../layoutCore.js';

const box = (id: string): Node => ({ id, isGroup: false, width: 100, height: 50 }) as Node;

const anchor = (id: string, hostId: string): Node =>
  ({
    id,
    isGroup: false,
    width: 36,
    height: 36,
    metadata: { anchorTo: { hostId } },
  }) as Node;

interface EdgeSpec {
  id: string;
  start: string;
  end: string;
}

function buildLayout(nodes: Node[], edges: EdgeSpec[], direction: string): LayoutData {
  return {
    nodes,
    edges: edges.map((e) => ({ ...e, type: 'normal' })),
    config: { flowchart: { nodeSpacing: 40, rankSpacing: 80 } },
    direction,
  } as unknown as LayoutData;
}

/** A→B→C in one band, with `pin` anchored to B and its own flow out to D. */
function withAnchor(direction: string): LayoutData {
  const layout = buildLayout(
    [box('A'), box('B'), box('C'), box('D'), anchor('pin', 'B')],
    [
      { id: 'eAB', start: 'A', end: 'B' },
      { id: 'eBC', start: 'B', end: 'C' },
      { id: 'ePinD', start: 'pin', end: 'D' },
    ],
    direction
  );
  runSwimlaneLayoutCore(layout);
  return layout;
}

/** The same graph with the flow authored from the host directly and no anchored node. */
function withoutAnchor(direction: string): LayoutData {
  const layout = buildLayout(
    [box('A'), box('B'), box('C'), box('D')],
    [
      { id: 'eAB', start: 'A', end: 'B' },
      { id: 'eBC', start: 'B', end: 'C' },
      { id: 'eBD', start: 'B', end: 'D' },
    ],
    direction
  );
  runSwimlaneLayoutCore(layout);
  return layout;
}

const find = (layout: LayoutData, id: string): Node => layout.nodes.find((n) => n.id === id)!;

describe('anchored nodes in the swimlane pipeline', () => {
  it.each(['TB', 'LR'])('never ranks or orders an anchored node (%s)', (direction) => {
    const pin = find(withAnchor(direction), 'pin');

    expect(pin.layer).toBeUndefined();
    expect(pin.order).toBeUndefined();
  });

  // The load-bearing assertion. The LR case is measured in FINAL coordinates, after
  // applyLrDirectionTransform, which moves a host without transforming its width and
  // height. A pin written only in helpers.ts, before that transform, fails this.
  it.each([
    ['TB', 'right'],
    ['LR', 'bottom'],
  ] as const)('puts the pin on the host border in final space (%s)', (direction, side) => {
    const layout = withAnchor(direction);
    const host = find(layout, 'B');
    const pin = find(layout, 'pin');

    if (side === 'right') {
      expect(pin.x).toBeCloseTo(host.x! + host.width! / 2, 6);
      expect(pin.y).toBeCloseTo(host.y!, 6);
    } else {
      expect(pin.y).toBeCloseTo(host.y! + host.height! / 2, 6);
      expect(pin.x).toBeCloseTo(host.x!, 6);
    }
  });

  // Re-pointing an anchored node's flow at its host has to give exactly the layout you
  // would get by authoring that flow from the host in the first place.
  it.each(['TB', 'LR'])(
    'lays the rest of the graph out as if the flow left the host (%s)',
    (direction) => {
      const anchored = withAnchor(direction);
      const plain = withoutAnchor(direction);

      for (const id of ['A', 'B', 'C', 'D']) {
        const a = find(anchored, id);
        const p = find(plain, id);
        expect({ id, x: a.x, y: a.y, layer: a.layer, order: a.order }).toEqual({
          id,
          x: p.x,
          y: p.y,
          layer: p.layer,
          order: p.order,
        });
      }
    }
  );

  it('leaves an anchored node with a missing host in the ordinary layout', () => {
    const layout = buildLayout(
      [box('A'), box('B'), anchor('orphan', 'nope')],
      [{ id: 'eAB', start: 'A', end: 'B' }],
      'TB'
    );
    runSwimlaneLayoutCore(layout);

    const orphan = find(layout, 'orphan');
    expect(orphan.layer).toBeDefined();
    expect(orphan.x).toBeDefined();
  });
});
