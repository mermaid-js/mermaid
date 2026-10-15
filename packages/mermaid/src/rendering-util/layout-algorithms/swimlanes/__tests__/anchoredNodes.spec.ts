import { describe, it, expect } from 'vitest';
import {
  anchorFootprints,
  clearAnchoredOverlaps,
  squareAnchoredEdges,
  collectAnchoredIds,
  defaultAnchorSide,
  pinAnchoredNodes,
  readAnchor,
  resolveAnchorHostId,
} from '../anchoredNodes.js';
import type { AnchorPin } from '../anchoredNodes.js';
import type { LayoutData, Node } from '../../../types.js';

const node = (id: string, extra: Partial<Node> = {}): Node => ({ id, ...extra }) as Node;

const anchored = (id: string, anchorTo: unknown, extra: Partial<Node> = {}): Node =>
  node(id, { ...extra, metadata: { anchorTo } } as Partial<Node>);

const host = (id: string): Node =>
  node(id, { x: 100, y: 50, width: 100, height: 80 } as Partial<Node>);

const asLayout = (nodes: Node[]): LayoutData => ({ nodes }) as LayoutData;

describe('readAnchor', () => {
  it('reads a host id', () => {
    expect(readAnchor(anchored('b', { hostId: 't1' }))).toEqual({ hostId: 't1' });
  });

  it('keeps a valid side and slot', () => {
    expect(readAnchor(anchored('b', { hostId: 't1', side: 'left', slot: 2 }))).toEqual({
      hostId: 't1',
      side: 'left',
      slot: 2,
    });
  });

  it('drops a side that is not a border', () => {
    expect(readAnchor(anchored('b', { hostId: 't1', side: 'sideways' }))).toEqual({ hostId: 't1' });
  });

  it('drops a non-finite slot', () => {
    expect(readAnchor(anchored('b', { hostId: 't1', slot: Number.NaN }))).toEqual({ hostId: 't1' });
  });

  it('ignores a node with no metadata', () => {
    expect(readAnchor(node('b'))).toBeUndefined();
  });

  it('ignores a malformed anchor', () => {
    expect(readAnchor(anchored('b', 'not-an-object'))).toBeUndefined();
    expect(readAnchor(anchored('b', { hostId: '' }))).toBeUndefined();
  });

  it('ignores a node anchored to itself', () => {
    expect(readAnchor(anchored('b', { hostId: 'b' }))).toBeUndefined();
  });
});

describe('resolveAnchorHostId', () => {
  const byId = (nodes: Node[]) => new Map(nodes.map((n) => [n.id, n]));

  it('resolves a direct host', () => {
    const nodes = [host('t1'), anchored('b', { hostId: 't1' })];
    expect(resolveAnchorHostId('b', byId(nodes))).toBe('t1');
  });

  it('resolves a chain to the first host that is laid out', () => {
    const nodes = [host('t1'), anchored('b1', { hostId: 't1' }), anchored('b2', { hostId: 'b1' })];
    expect(resolveAnchorHostId('b2', byId(nodes))).toBe('t1');
  });

  it('returns undefined for a host that is not in the graph', () => {
    const nodes = [anchored('b', { hostId: 'missing' })];
    expect(resolveAnchorHostId('b', byId(nodes))).toBeUndefined();
  });

  it('returns undefined for a cycle rather than hanging', () => {
    const nodes = [anchored('x', { hostId: 'y' }), anchored('y', { hostId: 'x' })];
    expect(resolveAnchorHostId('x', byId(nodes))).toBeUndefined();
  });

  it('returns undefined for a node that is not anchored', () => {
    expect(resolveAnchorHostId('t1', byId([host('t1')]))).toBeUndefined();
  });
});

describe('collectAnchoredIds', () => {
  it('collects only nodes the layout can actually skip', () => {
    const nodes = [
      host('t1'),
      anchored('ok', { hostId: 't1' }),
      anchored('dangling', { hostId: 'missing' }),
      anchored('cycleA', { hostId: 'cycleB' }),
      anchored('cycleB', { hostId: 'cycleA' }),
      node('plain'),
    ];
    // A dangling or cyclic anchor keeps its ordinary place instead of vanishing.
    expect(collectAnchoredIds(nodes)).toEqual(new Set(['ok']));
  });
});

describe('defaultAnchorSide', () => {
  it.each(['TB', 'LR', 'BT', 'RL'] as const)('is the right border in canonical space (%s)', (d) => {
    expect(defaultAnchorSide('canonical', d)).toBe('right');
  });

  it.each([
    ['LR', 'bottom'],
    ['RL', 'bottom'],
    ['TB', 'right'],
    ['BT', 'right'],
  ] as const)('resolves %s to the %s border in final space', (direction, side) => {
    expect(defaultAnchorSide('final', direction)).toBe(side);
  });
});

describe('pinAnchoredNodes', () => {
  const build = (anchors: Node[]) => asLayout([host('t1'), ...anchors]);

  it.each([
    ['bottom', 100, 90],
    ['top', 100, 10],
    ['right', 150, 50],
    ['left', 50, 50],
  ] as const)('puts the centre on the %s border', (side, x, y) => {
    const layout = build([anchored('b', { hostId: 't1', side }, { width: 36, height: 36 })]);
    pinAnchoredNodes(layout, { space: 'final', direction: 'TB' });

    const pinned = layout.nodes.find((n) => n.id === 'b')!;
    expect(pinned.x).toBe(x);
    expect(pinned.y).toBe(y);
  });

  it('centres a run of anchors on the border without overlapping them', () => {
    const layout = build([
      anchored('b1', { hostId: 't1', side: 'bottom' }, { width: 36, height: 36 }),
      anchored('b2', { hostId: 't1', side: 'bottom' }, { width: 36, height: 36 }),
    ]);
    pinAnchoredNodes(layout, { space: 'final', direction: 'TB' });

    const [b1, b2] = ['b1', 'b2'].map((id) => layout.nodes.find((n) => n.id === id)!);
    // each slot is its own width plus ANCHOR_GAP: 36 + 8.
    expect(b1.x).toBe(78);
    expect(b2.x).toBe(122);
    expect(b2.x! - b1.x!).toBeGreaterThanOrEqual(36);
    expect(b1.y).toBe(90);
    expect(b2.y).toBe(90);
  });

  it('orders a run by slot ahead of declaration order', () => {
    const layout = build([
      anchored('second', { hostId: 't1', side: 'bottom', slot: 2 }, { width: 36 }),
      anchored('first', { hostId: 't1', side: 'bottom', slot: 1 }, { width: 36 }),
    ]);
    pinAnchoredNodes(layout, { space: 'final', direction: 'TB' });

    const first = layout.nodes.find((n) => n.id === 'first')!;
    const second = layout.nodes.find((n) => n.id === 'second')!;
    expect(first.x!).toBeLessThan(second.x!);
  });

  it('is idempotent, which is what lets it run once per coordinate space', () => {
    const layout = build([
      anchored('b1', { hostId: 't1', side: 'bottom' }, { width: 36, height: 36 }),
      anchored('b2', { hostId: 't1', side: 'bottom' }, { width: 36, height: 36 }),
    ]);

    const first = pinAnchoredNodes(layout, { space: 'final', direction: 'TB' });
    const second = pinAnchoredNodes(layout, { space: 'final', direction: 'TB' });

    expect(second).toEqual(first);
  });

  it('reports the outward normal for the border it used', () => {
    const layout = build([anchored('b', { hostId: 't1', side: 'bottom' }, { width: 36 })]);
    const [pin] = pinAnchoredNodes(layout, { space: 'final', direction: 'TB' });

    expect(pin.outward).toEqual({ x: 0, y: 1 });
    expect(pin.hostId).toBe('t1');
  });

  it('ignores an explicit side in canonical space, where only the pre-image matters', () => {
    const layout = build([
      anchored('b', { hostId: 't1', side: 'left' }, { width: 36, height: 36 }),
    ]);
    pinAnchoredNodes(layout, { space: 'canonical', direction: 'LR' });

    const pinned = layout.nodes.find((n) => n.id === 'b')!;
    expect(pinned.x).toBe(150);
    expect(pinned.y).toBe(50);
  });

  it('leaves a node alone when its host has no geometry', () => {
    const layout = asLayout([node('t1'), anchored('b', { hostId: 't1' }, { width: 36 })]);
    const pins = pinAnchoredNodes(layout, { space: 'final', direction: 'TB' });

    expect(pins).toEqual([]);
    expect(layout.nodes.find((n) => n.id === 'b')!.x).toBeUndefined();
  });

  it('leaves a dangling or cyclic anchor unpinned', () => {
    const layout = asLayout([
      host('t1'),
      anchored('dangling', { hostId: 'missing' }, { width: 36 }),
      anchored('cycleA', { hostId: 'cycleB' }, { width: 36 }),
      anchored('cycleB', { hostId: 'cycleA' }, { width: 36 }),
    ]);
    expect(pinAnchoredNodes(layout, { space: 'final', direction: 'TB' })).toEqual([]);
  });
});

describe('standing a node off its host', () => {
  const stood = (id: string, gap: number, size: Partial<Node>) =>
    anchored(id, { hostId: 'h', gap }, size);

  it('clears the border by the gap and the node own half-extent', () => {
    const layout = asLayout([host('h'), stood('a', 20, { width: 40, height: 60 })]);
    pinAnchoredNodes(layout, { space: 'final', direction: 'LR' });
    // The host spans y 10..90, so its bottom border is 90. A 60-tall node asked to
    // clear it by 20 has its centre 20 + 30 below that.
    expect(layout.nodes?.[1].y).toBe(140);
  });

  it('keeps a node with no gap on the border, which is where a boundary event sits', () => {
    const layout = asLayout([host('h'), anchored('a', { hostId: 'h' }, { width: 40, height: 60 })]);
    pinAnchoredNodes(layout, { space: 'final', direction: 'LR' });
    expect(layout.nodes?.[1].y).toBe(90);
  });

  it('places twice the same as once, so the pass can run again after a transform', () => {
    const layout = asLayout([host('h'), stood('a', 20, { width: 40, height: 60 })]);
    pinAnchoredNodes(layout, { space: 'final', direction: 'LR' });
    const once = { x: layout.nodes?.[1].x, y: layout.nodes?.[1].y };
    pinAnchoredNodes(layout, { space: 'final', direction: 'LR' });
    expect({ x: layout.nodes?.[1].x, y: layout.nodes?.[1].y }).toEqual(once);
  });

  // One wide member used to set the pitch for the whole run, which threw the narrow
  // ones out to either side of a host they belong beside.
  it('gives each place the width of its own node', () => {
    const layout = asLayout([
      host('h'),
      stood('narrow', 20, { width: 40, height: 60 }),
      stood('wide', 20, { width: 200, height: 60 }),
    ]);
    pinAnchoredNodes(layout, { space: 'final', direction: 'LR' });
    const [, narrow, wide] = layout.nodes;
    // 40 + 8 + 200 = 248 wide, centred on the host at x 100: 100 - 124 + 20 = -4.
    expect(narrow.x).toBe(-4);
    expect(wide.x).toBe(124);
  });

  it('reports the room a run needs, so a caller can reserve it', () => {
    const nodes = [host('h'), stood('a', 20, { width: 40, height: 60 })];
    // Across the page a node stands below its host, so it reaches by its height.
    expect(anchorFootprints(nodes, 'LR').get('h')).toEqual({ before: 20, after: 20, beyond: 80 });
  });

  it('measures the reach along the way the diagram runs', () => {
    const nodes = [host('h'), stood('a', 20, { width: 40, height: 60 })];
    // Downwards it stands to one side instead, so the same node reaches by its width and
    // occupies its height along the border. Measuring the other one reserves too little,
    // and whatever the layout put in the space it was not given is drawn over. The node is
    // also moved clear of the flow through the host's middle, so all of it is reserved
    // before the host's centre: its height plus the 8 it stands clear by.
    expect(anchorFootprints(nodes, 'TB').get('h')).toEqual({ before: 68, after: 0, beyond: 60 });
  });

  it('leaves a node sitting on the border out of the reserved room', () => {
    const nodes = [host('h'), anchored('a', { hostId: 'h' }, { width: 40, height: 60 })];
    expect(anchorFootprints(nodes, 'LR').size).toBe(0);
  });
});

describe('squaring the line to a host', () => {
  const stub = (extra: Partial<Node> = {}, edge: Record<string, unknown> = {}) => {
    const nodes = [
      host('h'),
      anchored('a', { hostId: 'h', gap: 20 }, { width: 40, height: 60, ...extra }),
    ];
    const layout = { nodes, edges: [{ id: 'e', start: 'a', end: 'h', ...edge }] } as LayoutData;
    const pins = pinAnchoredNodes(layout, { space: 'final', direction: 'LR' });
    squareAnchoredEdges(layout, pins);
    return layout.edges?.[0].points ?? [];
  };

  it('replaces the route with a line square to both borders', () => {
    const points = stub();
    expect(points.length).toBeGreaterThanOrEqual(2);
    for (const [index, point] of points.slice(1).entries()) {
      const previous = points[index];
      // Every leg runs along one axis, so the ends cannot arrive at a slant.
      expect(Math.abs(point.x - previous.x) < 1 || Math.abs(point.y - previous.y) < 1).toBe(true);
    }
  });

  it('leaves the host abreast of the node, so two lines do not land together', () => {
    // The host spans x 50..150 and the node sits on its centre, so the line runs straight.
    expect(stub().at(-1)?.x).toBe(100);
  });

  it('steps across when the node is past the end of the host border', () => {
    const points = stub({ width: 40 });
    const layout = {
      nodes: [
        host('h'),
        anchored('far', { hostId: 'h', gap: 20 }, { width: 40, height: 60 }),
        anchored('near', { hostId: 'h', gap: 20 }, { width: 400, height: 60 }),
      ],
      edges: [{ id: 'e', start: 'far', end: 'h' }],
    } as LayoutData;
    const pins = pinAnchoredNodes(layout, { space: 'final', direction: 'LR' });
    squareAnchoredEdges(layout, pins);
    const stepped = layout.edges?.[0].points ?? [];
    // Pushed out past the host by its wide neighbour, it can no longer leave abreast of
    // itself, so it comes in as near as the border allows instead of at a slant.
    expect(stepped.length).toBeGreaterThan(points.length);
    expect(stepped.at(-1)?.x).toBeLessThanOrEqual(150);
    expect(stepped.at(-1)?.x).toBeGreaterThanOrEqual(50);
  });

  it('leaves a line to anywhere but its own host alone', () => {
    const layout = {
      nodes: [
        host('h'),
        host('other'),
        anchored('a', { hostId: 'h', gap: 20 }, { width: 40, height: 60 }),
      ],
      edges: [{ id: 'e', start: 'a', end: 'other', points: [{ x: 1, y: 2 }] }],
    } as LayoutData;
    const pins = pinAnchoredNodes(layout, { space: 'final', direction: 'LR' });
    squareAnchoredEdges(layout, pins);
    expect(layout.edges?.[0].points).toEqual([{ x: 1, y: 2 }]);
  });
});

describe('reserving the room an anchored run is placed in', () => {
  const stood = (id: string, size: Partial<Node>, extra: Record<string, unknown> = {}) =>
    anchored(id, { hostId: 'h', gap: 20, ...extra }, size);

  const fixtures: Record<string, () => Node[]> = {
    'one node': () => [stood('a', { width: 40, height: 60 })],
    'a run of unequal nodes': () => [
      stood('a', { width: 40, height: 60 }),
      stood('b', { width: 120, height: 30 }),
      stood('c', { width: 70, height: 90 }),
    ],
    'a run slotted out of declaration order': () => [
      stood('a', { width: 40, height: 60 }, { slot: 2 }),
      stood('b', { width: 120, height: 30 }, { slot: 1 }),
    ],
    'a node on the border beside a node standing off': () => [
      anchored('a', { hostId: 'h' }, { width: 36, height: 36 }),
      stood('b', { width: 40, height: 60 }),
    ],
  };

  const alongAxis = (direction: string) => (direction === 'LR' || direction === 'RL' ? 'x' : 'y');

  describe.each(['TB', 'BT', 'LR', 'RL'] as const)('running %s', (direction) => {
    it.each(Object.keys(fixtures))('holds %s inside the footprint', (name) => {
      const nodes = [host('h'), ...fixtures[name]()];
      const layout = asLayout(nodes);
      pinAnchoredNodes(layout, { space: 'final', direction });
      const footprint = anchorFootprints(nodes, direction).get('h')!;
      const hostNode = nodes[0];

      const horizontal = alongAxis(direction) === 'x';
      const centre = horizontal ? hostNode.x! : hostNode.y!;
      const border = horizontal
        ? hostNode.y! + hostNode.height! / 2
        : hostNode.x! + hostNode.width! / 2;
      for (const placed of nodes.slice(1)) {
        const half = (horizontal ? placed.width! : placed.height!) / 2;
        const at = horizontal ? placed.x! : placed.y!;
        expect(at - half).toBeGreaterThanOrEqual(centre - footprint.before);
        expect(at + half).toBeLessThanOrEqual(centre + footprint.after);

        const outer = horizontal ? placed.y! + placed.height! / 2 : placed.x! + placed.width! / 2;
        expect(outer - border).toBeLessThanOrEqual(footprint.beyond);
      }
    });
  });

  it('reserves the room above the host for a node stood off its side, where it is shifted', () => {
    // The repro: a host centred on y 50, a 60-tall node standing off by 20. It lands at
    // y -18..42, so the room reserved above the centre must reach down to -18.
    const nodes = [host('h'), stood('a', { width: 40, height: 60 })];
    pinAnchoredNodes(asLayout(nodes), { space: 'final', direction: 'TB' });
    expect(nodes[1].y! - 30).toBe(-18);
    expect(50 - anchorFootprints(nodes, 'TB').get('h')!.before).toBeLessThanOrEqual(-18);
  });
});

describe('clearing an anchored node off what it overlaps', () => {
  const box = (id: string, x: number, y: number, width: number, height: number, extra = {}) =>
    node(id, { x, y, width, height, ...extra } as Partial<Node>);

  const standing = (id: string, x: number, y: number) =>
    anchored(id, { hostId: 'h', gap: 20 }, { x, y, width: 40, height: 60 });

  const pinFor = (id: string, x: number, y: number): AnchorPin => ({
    nodeId: id,
    hostId: 'h',
    side: 'right',
    x,
    y,
    outward: { x: 1, y: 0 },
  });

  const lane = (right: number) =>
    node('lane', {
      isGroup: true,
      x: right - 200,
      y: 50,
      width: 400,
      height: 200,
      metadata: { laneRole: 'lane' },
    } as Partial<Node>);

  it('steps a stand-off outward until it is clear, and returns the pin where it came to rest', () => {
    const layout = asLayout([host('h'), box('other', 190, 12, 40, 40), standing('a', 190, 12)]);
    const [cleared] = clearAnchoredOverlaps(layout, [pinFor('a', 190, 12)]);

    // The obstacle spans x 170..210; each step is 8, so the first clear place is 230.
    expect(cleared).toEqual({ ...pinFor('a', 230, 12) });
    expect(layout.nodes?.[2].x).toBe(230);
    expect(layout.nodes?.[2].y).toBe(12);
  });

  it('returns the pin it was given when nothing is in the way', () => {
    const layout = asLayout([host('h'), standing('a', 190, 12)]);
    const pin = pinFor('a', 190, 12);

    expect(clearAnchoredOverlaps(layout, [pin])).toEqual([pin]);
    expect(layout.nodes?.[1].x).toBe(190);
  });

  it('does not treat its own host as something to clear', () => {
    const layout = asLayout([host('h'), standing('a', 120, 50)]);
    const pin = pinFor('a', 120, 50);

    expect(clearAnchoredOverlaps(layout, [pin])).toEqual([pin]);
    expect(layout.nodes?.[1].x).toBe(120);
  });

  it('leaves a node where it was if clearing would carry it out of its lane', () => {
    const parented = { ...host('h'), parentId: 'lane' } as Node;
    const layout = asLayout([
      lane(230),
      parented,
      box('other', 190, 12, 40, 40),
      standing('a', 190, 12),
    ]);
    const pin = pinFor('a', 190, 12);

    expect(clearAnchoredOverlaps(layout, [pin])).toEqual([pin]);
    expect(layout.nodes?.[3].x).toBe(190);
    expect(layout.nodes?.[3].y).toBe(12);
  });

  it('keeps stepping when the lane has room for it', () => {
    const parented = { ...host('h'), parentId: 'lane' } as Node;
    const layout = asLayout([
      lane(400),
      parented,
      box('other', 190, 12, 40, 40),
      standing('a', 190, 12),
    ]);

    expect(clearAnchoredOverlaps(layout, [pinFor('a', 190, 12)])[0].x).toBe(230);
  });

  it('passes a node with no gap through, and still clears later nodes off it', () => {
    const onBorder = anchored('e', { hostId: 'h' }, { x: 200, y: 50, width: 36, height: 36 });
    const layout = asLayout([host('h'), onBorder, standing('b', 200, 50)]);
    const edge = pinFor('e', 200, 50);

    const [first, second] = clearAnchoredOverlaps(layout, [edge, pinFor('b', 200, 50)]);

    expect(first).toBe(edge);
    expect(layout.nodes?.[1].x).toBe(200);
    // The border node spans x 182..218, so the first clear place for the 40-wide node is 240.
    expect(second.x).toBe(240);
  });
});
