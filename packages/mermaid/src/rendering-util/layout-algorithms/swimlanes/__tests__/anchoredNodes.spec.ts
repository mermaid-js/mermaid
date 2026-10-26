import { describe, it, expect } from 'vitest';
import {
  MAX_ANCHOR_GAP,
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

  it('keeps a gap that stands the node off its host', () => {
    expect(readAnchor(anchored('b', { hostId: 't1', gap: 20 }))).toEqual({
      hostId: 't1',
      gap: 20,
    });
  });

  it.each([0, -4, Number.NaN, Number.POSITIVE_INFINITY, '20'])('drops a gap of %s', (gap) => {
    expect(readAnchor(anchored('b', { hostId: 't1', gap }))).toEqual({ hostId: 't1' });
  });

  it('clamps a gap too large to place, so no coordinate turns infinite', () => {
    expect(readAnchor(anchored('b', { hostId: 't1', gap: 1e308 }))?.gap).toBe(MAX_ANCHOR_GAP);

    const layout = asLayout([
      host('t1'),
      anchored('b', { hostId: 't1', gap: 1e308 }, { width: 40, height: 60 }),
    ]);
    pinAnchoredNodes(layout, { space: 'final', direction: 'LR' });
    expect(Number.isFinite(layout.nodes[1].y)).toBe(true);
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
    expect(anchorFootprints(nodes, 'LR').get('h')?.bottom).toEqual({
      before: 20,
      after: 20,
      beyond: 80,
    });
  });

  it('measures the reach along the way the diagram runs', () => {
    const nodes = [host('h'), stood('a', 20, { width: 40, height: 60 })];
    // Downwards it stands to one side instead, so the same node reaches by its width and
    // occupies its height along the border. Measuring the other one reserves too little,
    // and whatever the layout put in the space it was not given is drawn over. The node is
    // also moved clear of the flow through the host's middle, so all of it is reserved
    // before the host's centre: its height plus the 8 it stands clear by.
    expect(anchorFootprints(nodes, 'TB').get('h')?.right).toEqual({
      before: 68,
      after: 0,
      beyond: 60,
    });
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
      const footprint = anchorFootprints(nodes, direction).get('h')![
        defaultAnchorSide('final', direction)
      ]!;
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
    expect(50 - anchorFootprints(nodes, 'TB').get('h')!.right!.before).toBeLessThanOrEqual(-18);
  });
});

describe('reserving the room on the side a node is anchored to', () => {
  const stoodOn = (side: string) =>
    anchored('a', { hostId: 'h', gap: 20, side }, { width: 40, height: 60 });

  const ALONG_X = new Set<string>(['top', 'bottom']);

  const OUTWARD_SIGN = { top: -1, bottom: 1, left: -1, right: 1 } as const;

  describe.each([
    ['TB', 'left', { before: 68, after: 0, beyond: 60 }],
    ['TB', 'top', { before: 20, after: 20, beyond: 80 }],
    ['LR', 'left', { before: 68, after: 0, beyond: 60 }],
    ['LR', 'top', { before: 20, after: 20, beyond: 80 }],
  ] as const)('running %s with side %s', (direction, side, expected) => {
    it('reserves the room on that side, and on no other', () => {
      const nodes = [host('h'), stoodOn(side)];
      const reserved = anchorFootprints(nodes, direction).get('h');
      expect(reserved?.[side]).toEqual(expected);
      expect(Object.keys(reserved ?? {})).toEqual([side]);
    });

    it('holds the placed node inside the room reserved on that side', () => {
      const nodes = [host('h'), stoodOn(side)];
      pinAnchoredNodes(asLayout(nodes), { space: 'final', direction });
      const footprint = anchorFootprints(nodes, direction).get('h')![side]!;
      const [hostNode, placed] = nodes;

      const horizontal = ALONG_X.has(side);
      const centre = horizontal ? hostNode.x! : hostNode.y!;
      const half = (horizontal ? placed.width! : placed.height!) / 2;
      const at = horizontal ? placed.x! : placed.y!;
      expect(at - half).toBeGreaterThanOrEqual(centre - footprint.before);
      expect(at + half).toBeLessThanOrEqual(centre + footprint.after);

      const hostEdge = horizontal ? hostNode.height! / 2 : hostNode.width! / 2;
      const hostCentre = horizontal ? hostNode.y! : hostNode.x!;
      const reach = (horizontal ? placed.height! : placed.width!) / 2;
      const placedCentre = horizontal ? placed.y! : placed.x!;
      const sign = OUTWARD_SIGN[side];
      const outer = (placedCentre + sign * reach - (hostCentre + sign * hostEdge)) * sign;
      expect(outer).toBeGreaterThanOrEqual(0);
      expect(outer).toBeLessThanOrEqual(footprint.beyond);
    });
  });

  it('reserves each side of a host as a run of its own', () => {
    const nodes = [
      host('h'),
      anchored('a', { hostId: 'h', gap: 20, side: 'left' }, { width: 40, height: 60 }),
      anchored('b', { hostId: 'h', gap: 20, side: 'top' }, { width: 120, height: 30 }),
    ];
    const reserved = anchorFootprints(nodes, 'TB').get('h');
    expect(reserved?.left).toEqual({ before: 68, after: 0, beyond: 60 });
    expect(reserved?.top).toEqual({ before: 60, after: 60, beyond: 50 });
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

describe('reading an anchor strictly', () => {
  const read = (anchorTo: unknown) => readAnchor(anchored('b', anchorTo));

  it.each(['top', 'right', 'bottom', 'left'] as const)('keeps the %s border as a side', (side) => {
    expect(read({ hostId: 't1', side })).toStrictEqual({ hostId: 't1', side });
  });

  it.each([5, null, '', 'TOP', 'diagonal', ['top']])(
    'leaves the side out when it is %j, rather than carrying an undefined key',
    (side) => {
      expect(read({ hostId: 't1', side })).toStrictEqual({ hostId: 't1' });
    }
  );

  it.each([Number.NaN, Number.POSITIVE_INFINITY, '2', null])(
    'leaves the slot out when it is %j, rather than carrying an undefined key',
    (slot) => {
      expect(read({ hostId: 't1', slot })).toStrictEqual({ hostId: 't1' });
    }
  );

  it('keeps a slot of zero and a negative slot, which are valid places in a run', () => {
    expect(read({ hostId: 't1', slot: 0 })).toStrictEqual({ hostId: 't1', slot: 0 });
    expect(read({ hostId: 't1', slot: -3 })).toStrictEqual({ hostId: 't1', slot: -3 });
  });

  it.each([0, -4, Number.NaN, Number.POSITIVE_INFINITY, '20', null])(
    'leaves the gap out when it is %j, rather than carrying an undefined key',
    (gap) => {
      expect(read({ hostId: 't1', gap })).toStrictEqual({ hostId: 't1' });
    }
  );

  it('keeps a gap exactly at the ceiling and clamps one beyond it', () => {
    expect(read({ hostId: 't1', gap: MAX_ANCHOR_GAP })?.gap).toBe(MAX_ANCHOR_GAP);
    expect(read({ hostId: 't1', gap: MAX_ANCHOR_GAP + 1 })?.gap).toBe(MAX_ANCHOR_GAP);
  });

  it.each([null, undefined, 0, false, '', 'hostId', 7, true])(
    'ignores an anchorTo of %j',
    (anchorTo) => {
      expect(read(anchorTo)).toBeUndefined();
    }
  );

  it('ignores a missing node', () => {
    expect(readAnchor(undefined)).toBeUndefined();
  });

  it.each([5, null, true, {}, ['t1']])('ignores a host id of %j that is not a string', (hostId) => {
    expect(read({ hostId })).toBeUndefined();
  });

  it('ignores an anchor that names no host', () => {
    expect(read({ side: 'left' })).toBeUndefined();
  });

  it('tells a self-anchor from an anchor to another node by id', () => {
    expect(readAnchor(anchored('b', { hostId: 'a' }))).toStrictEqual({ hostId: 'a' });
    expect(readAnchor(anchored('a', { hostId: 'a' }))).toBeUndefined();
  });
});

describe('resolving a host through a chain that ends in a cycle', () => {
  const byId = (nodes: Node[]) => new Map(nodes.map((n) => [n.id, n]));

  it('returns undefined when the chain runs into a cycle that does not include the start', () => {
    const nodes = [
      anchored('a', { hostId: 'b' }),
      anchored('b', { hostId: 'c' }),
      anchored('c', { hostId: 'b' }),
    ];
    expect(resolveAnchorHostId('a', byId(nodes))).toBeUndefined();
  });

  it('returns undefined for an id that is not in the graph at all', () => {
    expect(resolveAnchorHostId('ghost', byId([host('t1')]))).toBeUndefined();
  });

  it('stops at the first node that is not itself anchored, however long the chain', () => {
    const nodes = [
      host('t1'),
      anchored('b1', { hostId: 't1' }),
      anchored('b2', { hostId: 'b1' }),
      anchored('b3', { hostId: 'b2' }),
    ];
    expect(resolveAnchorHostId('b3', byId(nodes))).toBe('t1');
  });
});

describe('ordering a run along the border', () => {
  const sized = { width: 36, height: 36 };

  const runOf = (anchors: { id: string; slot?: number }[]) => {
    const layout = asLayout([
      host('t1'),
      ...anchors.map(({ id, slot }) =>
        anchored(
          id,
          { hostId: 't1', side: 'bottom', ...(slot === undefined ? {} : { slot }) },
          sized
        )
      ),
    ]);
    pinAnchoredNodes(layout, { space: 'final', direction: 'TB' });
    const xOf = (id: string) => layout.nodes.find((n) => n.id === id)!.x!;
    return anchors.map(({ id }) => id).sort((a, b) => xOf(a) - xOf(b));
  };

  it('keeps declaration order when no node has a slot', () => {
    expect(runOf([{ id: 'p' }, { id: 'q' }, { id: 'r' }])).toEqual(['p', 'q', 'r']);
  });

  it('keeps declaration order between nodes that share a slot', () => {
    expect(
      runOf([
        { id: 'p', slot: 1 },
        { id: 'q', slot: 1 },
        { id: 'r', slot: 1 },
      ])
    ).toEqual(['p', 'q', 'r']);
  });

  it('puts a slotted node ahead of an unslotted one declared before it', () => {
    expect(runOf([{ id: 'plain' }, { id: 'slotted', slot: 5 }])).toEqual(['slotted', 'plain']);
  });

  it('puts a slotted node ahead of an unslotted one declared after it', () => {
    expect(runOf([{ id: 'slotted', slot: 5 }, { id: 'plain' }])).toEqual(['slotted', 'plain']);
  });

  it('treats a slot of zero as a place, not as no slot', () => {
    expect(runOf([{ id: 'plain' }, { id: 'zero', slot: 0 }])).toEqual(['zero', 'plain']);
  });

  it('orders slotted nodes by slot and leaves the unslotted ones after them in declaration order', () => {
    expect(
      runOf([{ id: 'u1' }, { id: 's3', slot: 3 }, { id: 'u2' }, { id: 's1', slot: 1 }])
    ).toEqual(['s1', 's3', 'u1', 'u2']);
  });
});

describe('keeping the runs of different hosts and borders apart', () => {
  const sized = { width: 36, height: 36 };

  it('packs each host and each border as a run of its own', () => {
    const second = { ...host('t2'), x: 400 } as Node;
    const layout = asLayout([
      host('t1'),
      second,
      anchored('a1', { hostId: 't1', side: 'bottom' }, sized),
      anchored('a2', { hostId: 't2', side: 'bottom' }, sized),
      anchored('a3', { hostId: 't1', side: 'top' }, sized),
    ]);
    pinAnchoredNodes(layout, { space: 'final', direction: 'TB' });

    const at = (id: string) => {
      const found = layout.nodes.find((n) => n.id === id)!;
      return { x: found.x, y: found.y };
    };
    // Each is alone in its run, so each is centred on its own host's border.
    expect(at('a1')).toEqual({ x: 100, y: 90 });
    expect(at('a2')).toEqual({ x: 400, y: 90 });
    expect(at('a3')).toEqual({ x: 100, y: 10 });
  });

  it('reserves room for a dangling stand-off nowhere', () => {
    const nodes = [anchored('a', { hostId: 'missing', gap: 20 }, { width: 40, height: 60 })];
    expect(anchorFootprints(nodes, 'LR').size).toBe(0);
  });

  it('reserves the room of a host that is laid out, keyed by that host', () => {
    const nodes = [host('h'), anchored('a', { hostId: 'h', gap: 20 }, { width: 40, height: 60 })];
    expect([...anchorFootprints(nodes, 'LR').keys()]).toEqual(['h']);
  });

  it('reaches no further for a node on the border than the nodes standing off it need', () => {
    const nodes = [
      host('h'),
      anchored('a', { hostId: 'h', gap: 20 }, { width: 40, height: 60 }),
      anchored('tall', { hostId: 'h' }, { width: 36, height: 200 }),
    ];
    // Across the page, the node stood off needs 20 + 60 beyond the border. The one sitting
    // on the border stands no gap off, so its own 200 is not room it asks for.
    expect(anchorFootprints(nodes, 'LR').get('h')?.bottom?.beyond).toBe(80);
  });
});

describe('pinning only against a host that has a finite box', () => {
  const pinAgainst = (hostBox: Partial<Node>) => {
    const layout = asLayout([
      node('h', { x: 100, y: 50, width: 100, height: 80, ...hostBox } as Partial<Node>),
      anchored('a', { hostId: 'h', side: 'bottom' }, { width: 36, height: 36 }),
    ]);
    const pins = pinAnchoredNodes(layout, { space: 'final', direction: 'TB' });
    return { pins, placed: layout.nodes[1] };
  };

  it.each(['x', 'y', 'width', 'height'] as const)('pins against a host with a finite %s', (key) => {
    expect(pinAgainst({ [key]: 10 }).pins).toHaveLength(1);
  });

  it.each(['x', 'y', 'width', 'height'] as const)(
    'leaves the node unplaced when the host %s is missing',
    (key) => {
      const { pins, placed } = pinAgainst({ [key]: undefined });
      expect(pins).toEqual([]);
      expect(placed.x).toBeUndefined();
      expect(placed.y).toBeUndefined();
    }
  );

  it.each([
    ['NaN', Number.NaN],
    ['Infinity', Number.POSITIVE_INFINITY],
    ['-Infinity', Number.NEGATIVE_INFINITY],
  ])('leaves the node unplaced when a host measure is %s', (_label, value) => {
    for (const key of ['x', 'y', 'width', 'height'] as const) {
      const { pins, placed } = pinAgainst({ [key]: value });
      expect(pins, key).toEqual([]);
      expect(placed.x, key).toBeUndefined();
      expect(placed.y, key).toBeUndefined();
    }
  });

  it('leaves the node unplaced when a host measure is a string', () => {
    expect(pinAgainst({ x: '100' as unknown as number }).pins).toEqual([]);
  });

  it('still pins the nodes of a host that has a box when another host has none', () => {
    const layout = asLayout([
      host('good'),
      node('bad', { x: Number.NaN, y: 0, width: 10, height: 10 } as Partial<Node>),
      anchored('onBad', { hostId: 'bad', side: 'bottom' }, { width: 36, height: 36 }),
      anchored('onGood', { hostId: 'good', side: 'bottom' }, { width: 36, height: 36 }),
    ]);
    const pins = pinAnchoredNodes(layout, { space: 'final', direction: 'TB' });

    expect(pins.map((pin) => pin.nodeId)).toEqual(['onGood']);
  });
});

describe('placing only a node that has a finite size', () => {
  const sizes = [
    ['width', Number.NaN],
    ['height', Number.NaN],
    ['width', Number.POSITIVE_INFINITY],
    ['height', Number.NEGATIVE_INFINITY],
  ] as const;

  const withBadNode = (key: 'width' | 'height', value: number) => {
    const bad = anchored('bad', { hostId: 'h', side: 'bottom' }, {
      width: 36,
      height: 36,
      [key]: value,
    } as Partial<Node>);
    const good = anchored('good', { hostId: 'h', side: 'bottom' }, { width: 36, height: 36 });
    const nodes = [host('h'), bad, good];
    return { nodes, bad, good };
  };

  it.each(sizes)('leaves a node unplaced when its %s is %s', (key, value) => {
    const { nodes, bad } = withBadNode(key, value);
    const pins = pinAnchoredNodes(asLayout(nodes), { space: 'final', direction: 'TB' });
    expect(pins.map((pin) => pin.nodeId)).toEqual(['good']);
    expect(bad.x).toBeUndefined();
    expect(bad.y).toBeUndefined();
  });

  it.each(sizes)('packs the rest as if a node with a %s of %s were not there', (key, value) => {
    const { nodes, good } = withBadNode(key, value);
    pinAnchoredNodes(asLayout(nodes), { space: 'final', direction: 'TB' });
    expect({ x: good.x, y: good.y }).toEqual({ x: 100, y: 90 });
  });

  it.each(sizes)('reserves no room for a node with a %s of %s', (key, value) => {
    const { nodes } = withBadNode(key, value);
    nodes[1].metadata = { anchorTo: { hostId: 'h', side: 'bottom', gap: 20 } };
    nodes[2].metadata = { anchorTo: { hostId: 'h', side: 'bottom', gap: 20 } };
    expect(anchorFootprints(nodes, 'TB').get('h')?.bottom).toEqual({
      before: 18,
      after: 18,
      beyond: 56,
    });
  });

  it.each(sizes)('leaves a line alone when the node %s is %s', (key, value) => {
    const placed = node('a', {
      x: 100,
      y: 200,
      width: 36,
      height: 36,
      [key]: value,
    } as Partial<Node>);
    const layout = {
      nodes: [host('h'), placed],
      edges: [{ id: 'e', start: 'a', end: 'h', points: [{ x: 1, y: 2 }] }],
    } as unknown as LayoutData;
    const pin: AnchorPin = {
      nodeId: 'a',
      hostId: 'h',
      side: 'bottom',
      x: 100,
      y: 200,
      outward: { x: 0, y: 1 },
    };
    squareAnchoredEdges(layout, [pin]);
    expect(layout.edges?.[0].points).toEqual([{ x: 1, y: 2 }]);
  });
});

describe('standing off each border of a host', () => {
  const standOff = (side: string) => {
    const layout = asLayout([
      host('h'),
      anchored('a', { hostId: 'h', side, gap: 20 }, { width: 40, height: 60 }),
    ]);
    const [pin] = pinAnchoredNodes(layout, { space: 'final', direction: 'TB' });
    return { x: layout.nodes[1].x, y: layout.nodes[1].y, outward: pin.outward };
  };

  // The host spans x 50..150 and y 10..90. A 40x60 node clears its border by 20 plus its
  // own half-extent across the border; down the left and right it is also moved clear of
  // the flow through the host's middle by half its height plus 8.
  it.each([
    ['top', { x: 100, y: -40, outward: { x: 0, y: -1 } }],
    ['bottom', { x: 100, y: 140, outward: { x: 0, y: 1 } }],
    ['left', { x: 10, y: 12, outward: { x: -1, y: 0 } }],
    ['right', { x: 190, y: 12, outward: { x: 1, y: 0 } }],
  ])('places a node stood off the %s border and reports the way out', (side, expected) => {
    expect(standOff(side)).toEqual(expected);
  });

  it.each([
    ['top', { x: 0, y: -1 }],
    ['bottom', { x: 0, y: 1 }],
    ['left', { x: -1, y: 0 }],
    ['right', { x: 1, y: 0 }],
  ])('reports the outward normal of the %s border for a node sitting on it', (side, outward) => {
    const layout = asLayout([
      host('h'),
      anchored('a', { hostId: 'h', side }, { width: 36, height: 36 }),
    ]);
    expect(pinAnchoredNodes(layout, { space: 'final', direction: 'TB' })[0].outward).toEqual(
      outward
    );
  });
});

describe('routing the line from an anchored node to its host', () => {
  interface Point {
    x: number;
    y: number;
  }

  const route = (
    side: AnchorPin['side'],
    at: Partial<Node>,
    options: { hostBox?: Partial<Node>; face?: unknown; edge?: Record<string, unknown> } = {}
  ) => {
    const nodes = [
      node('h', { x: 100, y: 50, width: 100, height: 80, ...options.hostBox } as Partial<Node>),
      node('a', {
        width: 40,
        height: 60,
        ...at,
        ...(options.face === undefined ? {} : { metadata: { attachFace: options.face } }),
      } as Partial<Node>),
    ];
    const edge = { id: 'e', start: 'a', end: 'h', points: [{ x: -1, y: -1 }], ...options.edge };
    const layout = { nodes, edges: [edge] } as unknown as LayoutData;
    const pin: AnchorPin = {
      nodeId: 'a',
      hostId: 'h',
      side,
      x: 0,
      y: 0,
      outward: { x: 0, y: 1 },
    };
    squareAnchoredEdges(layout, [pin]);
    return layout.edges?.[0].points as Point[];
  };

  const pts = (...pairs: [number, number][]): Point[] => pairs.map(([x, y]) => ({ x, y }));

  // The host spans x 50..150 and y 10..90. A line may land 8 inside either end of the
  // border it meets, so on the top and bottom it lands within x 58..142 and on the left and
  // right within y 18..82.
  describe('on the way across the border', () => {
    it.each([
      ['bottom', { x: 200, y: 140 }, pts([200, 140], [200, 95], [142, 95], [142, 50])],
      ['top', { x: 200, y: -40 }, pts([200, -40], [200, 5], [142, 5], [142, 50])],
      ['right', { x: 190, y: 150 }, pts([190, 150], [145, 150], [145, 82], [100, 82])],
      ['left', { x: 10, y: 150 }, pts([10, 150], [55, 150], [55, 82], [100, 82])],
    ] as const)('steps in to the nearest landing on the %s border', (side, at, expected) => {
      expect(route(side, at)).toEqual(expected);
    });

    it.each([
      ['bottom', { x: 100, y: 140 }, pts([100, 140], [100, 50])],
      ['top', { x: 100, y: -40 }, pts([100, -40], [100, 50])],
      ['right', { x: 190, y: 50 }, pts([190, 50], [100, 50])],
      ['left', { x: 10, y: 50 }, pts([10, 50], [100, 50])],
    ] as const)(
      'runs straight at a host abreast of the node on the %s border',
      (side, at, expected) => {
        expect(route(side, at)).toEqual(expected);
      }
    );

    it('steps across for a landing one unit away, and not for one closer than that', () => {
      expect(route('bottom', { x: 143, y: 140 })).toEqual(
        pts([143, 140], [143, 95], [142, 95], [142, 50])
      );
      expect(route('bottom', { x: 142.5, y: 140 })).toEqual(pts([142.5, 140], [142, 50]));
    });

    it('lands on the host centre when the border is too short to leave an inset', () => {
      expect(route('bottom', { x: 100, y: 140 }, { hostBox: { width: 10 } })).toEqual(
        pts([100, 140], [100, 50])
      );
      expect(route('bottom', { x: 130, y: 140 }, { hostBox: { width: 10 } })).toEqual(
        pts([130, 140], [130, 95], [100, 95], [100, 50])
      );
    });

    it('lands on the host centre when the host has no extent', () => {
      expect(route('bottom', { x: 200, y: 140 }, { hostBox: { width: undefined } })).toEqual(
        pts([200, 140], [200, 95], [100, 95], [100, 50])
      );
    });
  });

  describe('leaving the node by a face', () => {
    it.each([
      ['right', pts([100, 140], [136, 140], [136, 50])],
      ['left', pts([100, 140], [64, 140], [64, 50])],
    ] as const)(
      'leaves a node on the bottom border by its %s face before turning',
      (face, expected) => {
        expect(route('bottom', { x: 100, y: 140 }, { face })).toEqual(expected);
      }
    );

    it.each([
      ['top', pts([190, 150], [190, 104], [145, 104], [145, 82], [100, 82])],
      ['bottom', pts([190, 150], [190, 196], [145, 196], [145, 82], [100, 82])],
    ] as const)(
      'leaves a node on the right border by its %s face before turning',
      (face, expected) => {
        expect(route('right', { x: 190, y: 150 }, { face })).toEqual(expected);
      }
    );

    it('turns at the stub and then steps across when the stub lands past the border', () => {
      expect(route('bottom', { x: 130, y: 140 }, { face: 'right' })).toEqual(
        pts([130, 140], [166, 140], [166, 95], [142, 95], [142, 50])
      );
    });

    it.each([
      ['bottom', 'top'],
      ['bottom', 'bottom'],
      ['right', 'left'],
      ['right', 'right'],
    ] as const)('ignores a face along the way out: the %s border, face %s', (side, face) => {
      const at = side === 'bottom' ? { x: 100, y: 140 } : { x: 190, y: 50 };
      expect(route(side, at, { face })).toEqual(route(side, at));
    });

    it.each(['diagonal', '', 5, null, ['left']])('ignores an attach face of %j', (face) => {
      expect(route('bottom', { x: 100, y: 140 }, { face })).toEqual(
        route('bottom', { x: 100, y: 140 })
      );
    });

    it('measures the stub from the node own half-extent, which is nothing without a size', () => {
      expect(route('bottom', { x: 100, y: 140, width: undefined }, { face: 'right' })).toEqual(
        pts([100, 140], [116, 140], [116, 50])
      );
    });
  });

  describe('which line it squares', () => {
    it('squares a line that runs from the host to the node, reading the points back to front', () => {
      const out = route('bottom', { x: 200, y: 140 });
      const back = route('bottom', { x: 200, y: 140 }, { edge: { start: 'h', end: 'a' } });
      expect(back).toEqual([...out].reverse());
    });

    it('leaves a line between two nodes that are not pinned alone', () => {
      const layout = {
        nodes: [host('h'), node('p', { x: 0, y: 0 }), node('q', { x: 5, y: 5 })],
        edges: [{ id: 'e', start: 'p', end: 'q', points: pts([1, 1]) }],
      } as unknown as LayoutData;
      squareAnchoredEdges(layout, []);
      expect(layout.edges?.[0].points).toEqual(pts([1, 1]));
    });

    it('leaves a line with a missing end alone', () => {
      expect(route('bottom', { x: 200, y: 140 }, { edge: { end: undefined } })).toEqual(
        pts([-1, -1])
      );
      expect(route('bottom', { x: 200, y: 140 }, { edge: { start: undefined } })).toEqual(
        pts([-1, -1])
      );
    });

    it('copes with a layout that has no nodes or no edges', () => {
      expect(() => {
        squareAnchoredEdges({} as LayoutData, []);
        squareAnchoredEdges({ nodes: [host('h')] } as LayoutData, []);
      }).not.toThrow();
    });

    it('leaves a line alone when the pinned node is not in the layout', () => {
      const layout = {
        nodes: [host('h')],
        edges: [{ id: 'e', start: 'ghost', end: 'h', points: pts([1, 1]) }],
      } as unknown as LayoutData;
      const pin: AnchorPin = {
        nodeId: 'ghost',
        hostId: 'h',
        side: 'bottom',
        x: 0,
        y: 0,
        outward: { x: 0, y: 1 },
      };
      squareAnchoredEdges(layout, [pin]);
      expect(layout.edges?.[0].points).toEqual(pts([1, 1]));
    });

    it('leaves a line alone when the host is not in the layout', () => {
      const layout = {
        nodes: [node('a', { x: 0, y: 0, width: 4, height: 4 })],
        edges: [{ id: 'e', start: 'a', end: 'ghost', points: pts([1, 1]) }],
      } as unknown as LayoutData;
      const pin: AnchorPin = {
        nodeId: 'a',
        hostId: 'ghost',
        side: 'bottom',
        x: 0,
        y: 0,
        outward: { x: 0, y: 1 },
      };
      squareAnchoredEdges(layout, [pin]);
      expect(layout.edges?.[0].points).toEqual(pts([1, 1]));
    });
  });

  describe('when a position is not a finite number', () => {
    const bad = [
      ['undefined', undefined],
      ['NaN', Number.NaN],
      ['Infinity', Number.POSITIVE_INFINITY],
    ] as const;

    it.each(bad)('keeps the route it had when the node x is %s', (_label, value) => {
      expect(route('bottom', { x: value, y: 140 })).toEqual(pts([-1, -1]));
    });

    it.each(bad)('keeps the route it had when the node y is %s', (_label, value) => {
      expect(route('bottom', { x: 100, y: value })).toEqual(pts([-1, -1]));
    });

    it.each(bad)('keeps the route it had when the host x is %s', (_label, value) => {
      expect(route('bottom', { x: 100, y: 140 }, { hostBox: { x: value } })).toEqual(pts([-1, -1]));
    });

    it.each(bad)('keeps the route it had when the host y is %s', (_label, value) => {
      expect(route('bottom', { x: 100, y: 140 }, { hostBox: { y: value } })).toEqual(pts([-1, -1]));
    });

    it('keeps the route it had, for a line drawn from the host, too', () => {
      expect(
        route('bottom', { x: Number.NaN, y: 140 }, { edge: { start: 'h', end: 'a' } })
      ).toEqual(pts([-1, -1]));
    });
  });
});

describe('how far a stand-off is cleared, and what stops it', () => {
  // A 40x60 stand-off sits at (200, 200): x 180..220, y 170..230. It is cleared off
  // whatever lies on the inward side of it, by steps of 8 along the way out.
  const START = { x: 200, y: 200 };

  const way = {
    right: { outward: { x: 1, y: 0 }, step: { x: 1, y: 0 } },
    left: { outward: { x: -1, y: 0 }, step: { x: -1, y: 0 } },
    bottom: { outward: { x: 0, y: 1 }, step: { x: 0, y: 1 } },
    top: { outward: { x: 0, y: -1 }, step: { x: 0, y: -1 } },
  } as const;
  type Way = keyof typeof way;
  const ways = Object.keys(way) as Way[];

  const standing = (extra: Partial<Node> = {}) =>
    anchored('a', { hostId: 'h', gap: 20 }, { ...START, width: 40, height: 60, ...extra });

  const pinTowards = (direction: Way, at = START): AnchorPin => ({
    nodeId: 'a',
    hostId: 'h',
    side: direction,
    x: at.x,
    y: at.y,
    outward: way[direction].outward,
  });

  // A 40x40 obstacle on the inward side of the stand-off, `into` pixels inside it when
  // positive and `into` pixels short of it when negative.
  const obstacle = (direction: Way, into: number): Node => {
    const spot = {
      right: { x: START.x - 40 + into, y: START.y },
      left: { x: START.x + 40 - into, y: START.y },
      bottom: { x: START.x, y: START.y - 50 + into },
      top: { x: START.x, y: START.y + 50 - into },
    }[direction];
    return node('o', { ...spot, width: 40, height: 40 } as Partial<Node>);
  };

  const clear = (direction: Way, others: Node[], extra: Partial<Node> = {}) => {
    const a = standing(extra);
    const layout = asLayout([host('h'), ...others, a]);
    const pin = pinTowards(direction);
    const [cleared] = clearAnchoredOverlaps(layout, [pin]);
    return { cleared, pin, a };
  };

  const stepped = (direction: Way, steps: number) => ({
    x: START.x + way[direction].step.x * 8 * steps,
    y: START.y + way[direction].step.y * 8 * steps,
  });

  describe.each(ways)('on a stand-off going %s', (direction) => {
    it('moves one step to clear an obstacle that reaches 5px into it', () => {
      const { cleared, a } = clear(direction, [obstacle(direction, 5)]);
      expect({ x: a.x, y: a.y }).toEqual(stepped(direction, 1));
      expect({ x: cleared.x, y: cleared.y }).toEqual(stepped(direction, 1));
    });

    it('moves for an obstacle that reaches 2px into it', () => {
      const { a } = clear(direction, [obstacle(direction, 2)]);
      expect({ x: a.x, y: a.y }).toEqual(stepped(direction, 1));
    });

    it('lets an obstacle reach 1px into it, which is the tolerance', () => {
      const { cleared, pin, a } = clear(direction, [obstacle(direction, 1)]);
      expect(cleared).toBe(pin);
      expect({ x: a.x, y: a.y }).toEqual(START);
    });

    it.each([0, -3])('does not move for an obstacle %ipx short of it', (into) => {
      const { cleared, pin, a } = clear(direction, [obstacle(direction, into)]);
      expect(cleared).toBe(pin);
      expect({ x: a.x, y: a.y }).toEqual(START);
    });

    it('is stopped by a lane edge it just reaches, and put back by one it would cross', () => {
      const edges = { l: -1000, r: 1000, t: -1000, b: 1000 };
      const reach = { right: 'r', left: 'l', bottom: 'b', top: 't' } as const;
      const landing = {
        right: START.x + 20 + 8,
        left: START.x - 20 - 8,
        bottom: START.y + 30 + 8,
        top: START.y - 30 - 8,
      }[direction];
      const inLane = (edge: number, laneRole = 'lane') => {
        const box = { ...edges, [reach[direction]]: edge };
        const parented = { ...host('h'), parentId: 'lane' } as Node;
        const lane = node('lane', {
          isGroup: true,
          x: (box.l + box.r) / 2,
          y: (box.t + box.b) / 2,
          width: box.r - box.l,
          height: box.b - box.t,
          metadata: { laneRole },
        } as Partial<Node>);
        const a = standing();
        const pin = pinTowards(direction);
        const [cleared] = clearAnchoredOverlaps(
          asLayout([lane, parented, obstacle(direction, 5), a]),
          [pin]
        );
        return { cleared, pin, a };
      };

      const fits = inLane(landing);
      expect({ x: fits.a.x, y: fits.a.y }).toEqual(stepped(direction, 1));

      const crosses = inLane(landing + (direction === 'right' || direction === 'bottom' ? -1 : 1));
      expect(crosses.cleared).toBe(crosses.pin);
      expect({ x: crosses.a.x, y: crosses.a.y }).toEqual(START);
    });
  });

  describe('on the extent of what it measures', () => {
    // The obstacle stands 3px clear of the stand-off on each side, so it only overlaps if
    // its extent or the stand-off's is miscomputed.
    it.each([
      ['left of it', { x: START.x - 43, y: START.y }],
      ['right of it', { x: START.x + 43, y: START.y }],
      ['above it', { x: START.x, y: START.y - 53 }],
      ['below it', { x: START.x, y: START.y + 53 }],
    ])('leaves an obstacle 3px clear %s', (_where, spot) => {
      const wide = node('o', { ...spot, width: 40, height: 40 } as Partial<Node>);
      const { cleared, pin, a } = clear('right', [wide]);
      expect(cleared).toBe(pin);
      expect({ x: a.x, y: a.y }).toEqual(START);
    });

    it.each([
      ['far above', { x: START.x, y: -300 }],
      ['far below', { x: START.x, y: 700 }],
      ['far to the left', { x: -300, y: START.y }],
      ['far to the right', { x: 700, y: START.y }],
    ])('leaves an obstacle %s', (_where, spot) => {
      const far = node('o', { ...spot, width: 40, height: 40 } as Partial<Node>);
      const { cleared, pin } = clear('right', [far]);
      expect(cleared).toBe(pin);
    });

    it('takes an obstacle with no position or size as occupying nothing', () => {
      const { cleared, pin } = clear('right', [node('o')]);
      expect(cleared).toBe(pin);
    });

    it('takes a stand-off with no size as a point, which clears the obstacle edge by 1px', () => {
      const bare = node('o', { x: START.x, y: START.y, width: 40, height: 40 } as Partial<Node>);
      const { a } = clear('right', [bare], { width: undefined, height: undefined });
      // The obstacle ends at x 220, so a point is clear from 219 on: the first step of 8 past it.
      expect(a.x).toBe(224);
    });
  });

  describe('on how long it keeps stepping', () => {
    it('gives up after 24 steps against something it cannot clear, and rests there', () => {
      const wall = node('wall', { ...START, width: 10_000, height: 10_000 } as Partial<Node>);
      const { cleared, a } = clear('right', [wall]);
      expect(a.x).toBe(START.x + 24 * 8);
      expect(cleared.x).toBe(START.x + 24 * 8);
      expect(cleared.y).toBe(START.y);
    });
  });

  describe('on what it reports', () => {
    it('reports the place the node rests at, not the place the pin was handed in', () => {
      const stale = pinTowards('right', { x: 999, y: 999 });
      const layout = asLayout([host('h'), obstacle('right', 5), standing()]);
      const [cleared] = clearAnchoredOverlaps(layout, [stale]);
      expect({ x: cleared.x, y: cleared.y }).toEqual(stepped('right', 1));
    });

    it('hands back the pin it was given, whatever its position says, when nothing moved', () => {
      const stale = pinTowards('right', { x: 999, y: 999 });
      const layout = asLayout([host('h'), standing()]);
      expect(clearAnchoredOverlaps(layout, [stale])[0]).toBe(stale);
    });

    it('does not take a node at the origin to be in the way of a stand-off', () => {
      const a = standing({ x: 0, y: 0 });
      const pin = pinTowards('right', { x: 0, y: 0 });
      const [cleared] = clearAnchoredOverlaps(asLayout([host('h'), a]), [pin]);
      expect(cleared).toBe(pin);
      expect({ x: a.x, y: a.y }).toEqual({ x: 0, y: 0 });
    });
  });

  describe('on the other nodes it clears', () => {
    it('clears a later stand-off off an earlier one that stands off too', () => {
      const first = anchored(
        'first',
        { hostId: 'h', gap: 20 },
        { ...START, width: 40, height: 60 }
      );
      const second = anchored(
        'second',
        { hostId: 'h', gap: 20 },
        { ...START, width: 40, height: 60 }
      );
      const layout = asLayout([host('h'), first, second]);
      const pins = [
        { ...pinTowards('right'), nodeId: 'first' },
        { ...pinTowards('right'), nodeId: 'second' },
      ];
      const [one, two] = clearAnchoredOverlaps(layout, pins);

      expect(one).toBe(pins[0]);
      expect(first.x).toBe(START.x);
      expect(second.x).toBe(START.x + 5 * 8);
      expect(two.x).toBe(START.x + 5 * 8);
    });

    it('leaves a node with no gap where it is, even on top of something', () => {
      const onBorder = anchored('a', { hostId: 'h' }, { ...START, width: 40, height: 60 });
      const pin = pinTowards('right');
      const layout = asLayout([host('h'), obstacle('right', 5), onBorder]);

      expect(clearAnchoredOverlaps(layout, [pin])[0]).toBe(pin);
      expect({ x: onBorder.x, y: onBorder.y }).toEqual(START);
    });

    it('leaves a pinned node that carries no anchor where it is', () => {
      const plain = node('a', { ...START, width: 40, height: 60 } as Partial<Node>);
      const pin = pinTowards('right');
      const layout = asLayout([host('h'), obstacle('right', 5), plain]);

      expect(clearAnchoredOverlaps(layout, [pin])[0]).toBe(pin);
      expect({ x: plain.x, y: plain.y }).toEqual(START);
    });

    it('passes a pin through for a node that is not in the layout, and goes on to the next', () => {
      const ghost: AnchorPin = { ...pinTowards('right'), nodeId: 'ghost' };
      const real = pinTowards('right');
      const a = standing();
      const layout = asLayout([host('h'), obstacle('right', 5), a]);

      const [first, second] = clearAnchoredOverlaps(layout, [ghost, real]);

      expect(first).toBe(ghost);
      expect(second.x).toBe(START.x + 8);
      expect(a.x).toBe(START.x + 8);
    });
  });

  describe('on the lane it must stay inside', () => {
    const laneAround = (extra: Record<string, unknown>) =>
      node('lane', {
        isGroup: true,
        x: START.x,
        y: START.y,
        width: 100,
        height: 400,
        ...extra,
      } as Partial<Node>);

    // The lane spans x 150..250. The wall covers x 170..230, so the stand-off has to be
    // carried out to x 249 to clear it, which is past the lane's right edge.
    const runInto = (hostParent: Partial<Node>, ...groups: Node[]) =>
      runWith(undefined, hostParent, ...groups);

    const runWith = (
      isLane: ((group: Node) => boolean) | undefined,
      hostParent: Partial<Node>,
      ...groups: Node[]
    ) => {
      const parented = { ...host('h'), ...hostParent } as Node;
      const a = standing();
      const pin = pinTowards('right');
      const wall = node('wall', { ...START, width: 60, height: 60 } as Partial<Node>);
      const [cleared] = clearAnchoredOverlaps(
        asLayout([...groups, parented, wall, a]),
        [pin],
        isLane
      );
      return { cleared, pin, a };
    };

    it('stays in a pool as it does in a lane', () => {
      const { cleared, pin, a } = runInto(
        { parentId: 'lane' },
        laneAround({ id: 'lane', metadata: { laneRole: 'pool' } })
      );
      expect(cleared).toBe(pin);
      expect({ x: a.x, y: a.y }).toEqual(START);
    });

    it('walks up past a parent that is no lane to the lane above it', () => {
      const { cleared, pin, a } = runInto(
        { parentId: 'group' },
        laneAround({ id: 'lane', metadata: { laneRole: 'lane' } }),
        node('group', { isGroup: true, parentId: 'lane', metadata: {} } as Partial<Node>)
      );
      expect(cleared).toBe(pin);
      expect({ x: a.x, y: a.y }).toEqual(START);
    });

    it('walks up past a parent that has no metadata at all', () => {
      const { cleared, pin } = runInto(
        { parentId: 'group' },
        laneAround({ id: 'lane', metadata: { laneRole: 'lane' } }),
        node('group', { isGroup: true, parentId: 'lane' } as Partial<Node>)
      );
      expect(cleared).toBe(pin);
    });

    it('is not held in by a group that is neither a lane nor a pool', () => {
      const { a } = runInto(
        { parentId: 'group' },
        laneAround({ id: 'group', metadata: { laneRole: 'cluster' } })
      );
      expect(a.x).toBeGreaterThan(START.x);
    });

    it('is not held in by a group with no role', () => {
      const { a } = runInto({ parentId: 'group' }, laneAround({ id: 'group' }));
      expect(a.x).toBeGreaterThan(START.x);
    });

    it('holds a node in the group a custom resolver calls a lane', () => {
      const { cleared, pin, a } = runWith(
        (group) => group.id === 'lane',
        { parentId: 'lane' },
        laneAround({ id: 'lane' })
      );
      expect(cleared).toBe(pin);
      expect({ x: a.x, y: a.y }).toEqual(START);
    });

    it('lets a custom resolver release a group that carries a lane role', () => {
      const { a } = runWith(
        () => false,
        { parentId: 'lane' },
        laneAround({ id: 'lane', metadata: { laneRole: 'lane' } })
      );
      expect(a.x).toBeGreaterThan(START.x);
    });

    it('clears a host whose parent is not in the layout as if it had no lane', () => {
      const { a } = runInto({ parentId: 'ghost' });
      expect(a.x).toBeGreaterThan(START.x);
    });

    it('stops climbing when the parents loop back on themselves', () => {
      const { a } = runInto(
        { parentId: 'one' },
        node('one', { isGroup: true, parentId: 'two' } as Partial<Node>),
        node('two', { isGroup: true, parentId: 'one' } as Partial<Node>)
      );
      expect(a.x).toBeGreaterThan(START.x);
    });
  });
});
