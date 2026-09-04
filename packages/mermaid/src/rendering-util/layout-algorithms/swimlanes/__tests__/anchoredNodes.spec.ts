import { describe, it, expect } from 'vitest';
import {
  anchorFootprints,
  squareAnchoredEdges,
  collectAnchoredIds,
  defaultAnchorSide,
  pinAnchoredNodes,
  readAnchor,
  resolveAnchorHostId,
} from '../anchoredNodes.js';
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
    // pitch is the widest anchor plus the router's clearance: 36 + 8.
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
    expect(anchorFootprints(nodes).get('h')).toEqual({ across: 20, beyond: 80 });
  });

  it('leaves a node sitting on the border out of the reserved room', () => {
    const nodes = [host('h'), anchored('a', { hostId: 'h' }, { width: 40, height: 60 })];
    expect(anchorFootprints(nodes).size).toBe(0);
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
