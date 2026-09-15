import { describe, it, expect } from 'vitest';
import {
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
