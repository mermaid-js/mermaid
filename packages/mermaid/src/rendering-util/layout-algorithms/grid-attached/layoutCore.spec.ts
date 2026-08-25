import { describe, expect, it } from 'vitest';
import type { Edge, LayoutData, Node } from '../../types.js';
import { runGridAttachedLayoutCore } from './layoutCore.js';
import type { GridAttachedResult } from './layoutCore.js';

const NODE_WIDTH = 80;
const NODE_HEIGHT = 40;

function node(id: string, overrides: Partial<Node> = {}): Node {
  return {
    id,
    label: id,
    isGroup: false,
    shape: 'rect',
    width: NODE_WIDTH,
    height: NODE_HEIGHT,
    ...overrides,
  } as Node;
}

function edge(start: string, end: string, overrides: Partial<Edge> = {}): Edge {
  return { id: `${start}-${end}`, start, end, ...overrides } as Edge;
}

function layoutData(nodes: Node[], edges: Edge[], direction = 'TB'): LayoutData {
  return {
    nodes,
    edges,
    direction,
    config: { flowchart: { nodeSpacing: 50, rankSpacing: 50 } },
  } as unknown as LayoutData;
}

/**
 * A four-cycle core with two trees hanging off it: `t1 → t2` from `A`, and a
 * single pendant `s1` from `C`. Leaf peeling prunes `t2`/`s1`, then `t1`, and
 * leaves `A B C D` as the core.
 */
function coreWithTwoTrees(direction = 'TB'): LayoutData {
  return layoutData(
    ['A', 'B', 'C', 'D', 't1', 't2', 's1'].map((id) => node(id)),
    [
      edge('A', 'B'),
      edge('B', 'C'),
      edge('C', 'D'),
      edge('D', 'A'),
      edge('A', 't1'),
      edge('t1', 't2'),
      edge('C', 's1'),
    ],
    direction
  );
}

/**
 * An eight-cycle with a chord and a wide three-child tree on every node. There is
 * not enough room around the core for eight of those at grid-like's own scale.
 */
function crowdedCore(): LayoutData {
  const ring = ['c0', 'c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7'];
  const nodes = ring.map((id) => node(id, { width: 100 }));
  const edges = ring.map((id, index) => edge(id, ring[(index + 1) % ring.length]));
  edges.push(edge(ring[0], ring[4]));

  ring.forEach((id, index) => {
    const prefix = `t${index}`;
    nodes.push(node(`${prefix}1`, { width: 400 }));
    edges.push(edge(id, `${prefix}1`));
    for (const child of ['a', 'b', 'c']) {
      nodes.push(node(`${prefix}${child}`, { width: 400 }));
      edges.push(edge(`${prefix}1`, `${prefix}${child}`));
    }
  });

  return layoutData(nodes, edges);
}

interface Rect {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

function rectOf(node: Node): Rect {
  const x = node.x ?? 0;
  const y = node.y ?? 0;
  return {
    minX: x - (node.width ?? 0) / 2,
    maxX: x + (node.width ?? 0) / 2,
    minY: y - (node.height ?? 0) / 2,
    maxY: y + (node.height ?? 0) / 2,
  };
}

function overlaps(a: Rect, b: Rect, epsilon = 1e-6): boolean {
  return (
    a.minX < b.maxX - epsilon &&
    b.minX < a.maxX - epsilon &&
    a.minY < b.maxY - epsilon &&
    b.minY < a.maxY - epsilon
  );
}

function nodeById(data: LayoutData): Map<string, Node> {
  return new Map(data.nodes.map((n) => [n.id, n]));
}

function expectEverythingDrawn(data: LayoutData, result: GridAttachedResult): void {
  expect(result.droppedEdgeIds).toEqual([]);
  for (const n of data.nodes) {
    expect(Number.isFinite(n.x), `${n.id} has no x`).toBe(true);
    expect(Number.isFinite(n.y), `${n.id} has no y`).toBe(true);
  }
  for (const e of data.edges) {
    expect((e.points ?? []).length, `${e.id} has no route`).toBeGreaterThanOrEqual(2);
  }
}

function coreNodeIdsOf(result: GridAttachedResult): string[] {
  return result.components.flatMap((component) => component.coreNodeIds);
}

describe('grid-attached layout', () => {
  it('draws a core-plus-trees graph as one connected diagram', () => {
    const data = coreWithTwoTrees();

    const result = runGridAttachedLayoutCore(data);

    expect(result.componentCount).toBe(1);
    expect(result.components[0].kind).toBe('core-with-trees');
    expect(result.components[0].coreNodeIds.sort()).toEqual(['A', 'B', 'C', 'D']);
    // Both trees are attached, not packed beside the core.
    expect(result.components[0].trees).toHaveLength(2);
    expect(result.components[0].trees.map((tree) => tree.coreNodeId).sort()).toEqual(['A', 'C']);
    expectEverythingDrawn(data, result);
    // Nothing is duplicated: the trees hang off the real core nodes.
    expect(data.nodes.map((n) => n.id).sort()).toEqual(['A', 'B', 'C', 'D', 's1', 't1', 't2']);
  });

  it('never overlaps two nodes, whichever part of the decomposition they came from', () => {
    const data = coreWithTwoTrees();

    runGridAttachedLayoutCore(data);

    const nodes = data.nodes;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        expect(
          overlaps(rectOf(nodes[i]), rectOf(nodes[j])),
          `${nodes[i].id} overlaps ${nodes[j].id}`
        ).toBe(false);
      }
    }
  });

  it('keeps two trees on the same core clear of each other', () => {
    // Three trees on one four-cycle: the placement search has to spread them
    // around the core instead of stacking them.
    const data = layoutData(
      ['A', 'B', 'C', 'D', 'p1', 'p2', 'q1', 'q2', 'r1'].map((id) => node(id)),
      [
        edge('A', 'B'),
        edge('B', 'C'),
        edge('C', 'D'),
        edge('D', 'A'),
        edge('A', 'p1'),
        edge('p1', 'p2'),
        edge('B', 'q1'),
        edge('q1', 'q2'),
        edge('D', 'r1'),
      ]
    );

    const result = runGridAttachedLayoutCore(data);
    const trees = result.components[0].trees;

    expect(trees).toHaveLength(3);
    for (let i = 0; i < trees.length; i++) {
      for (let j = i + 1; j < trees.length; j++) {
        expect(
          overlaps(trees[i].footprint, trees[j].footprint),
          `${trees[i].treeId} overlaps ${trees[j].treeId}`
        ).toBe(false);
      }
    }
  });

  /**
   * The contract with `grid-decomposed`: this layout may stretch the core's edges
   * and may do nothing else to it. A uniform scale about the core's centre is
   * exactly that, and it shows up as one common ratio between every pair of core
   * nodes — which is what makes every grid-like alignment survive.
   */
  it('changes the core drawing by nothing but a uniform enlargement', () => {
    const unscaled = coreWithTwoTrees();
    const scaled = coreWithTwoTrees();

    const withoutRoom = runGridAttachedLayoutCore(unscaled, { maxCoreScale: 1 });
    const withRoom = runGridAttachedLayoutCore(scaled, { maxCoreScale: 3 });

    const coreIds = coreNodeIdsOf(withoutRoom);
    expect(coreIds.sort()).toEqual(coreNodeIdsOf(withRoom).sort());
    expect(withoutRoom.components[0].coreScale).toBe(1);

    const before = nodeById(unscaled);
    const after = nodeById(scaled);
    const ratios: number[] = [];
    for (let i = 0; i < coreIds.length; i++) {
      for (let j = i + 1; j < coreIds.length; j++) {
        const a = before.get(coreIds[i])!;
        const b = before.get(coreIds[j])!;
        const p = after.get(coreIds[i])!;
        const q = after.get(coreIds[j])!;
        const was = Math.hypot((a.x ?? 0) - (b.x ?? 0), (a.y ?? 0) - (b.y ?? 0));
        const is = Math.hypot((p.x ?? 0) - (q.x ?? 0), (p.y ?? 0) - (q.y ?? 0));
        if (was > 1e-6) {
          ratios.push(is / was);
        }
      }
    }

    expect(ratios.length).toBeGreaterThan(0);
    for (const ratio of ratios) {
      expect(ratio).toBeCloseTo(withRoom.components[0].coreScale, 5);
    }
  });

  it('keeps every core alignment through an enlargement', () => {
    const unscaled = coreWithTwoTrees();
    const scaled = coreWithTwoTrees();

    const plain = runGridAttachedLayoutCore(unscaled, { maxCoreScale: 1 });
    runGridAttachedLayoutCore(scaled, { maxCoreScale: 3, coreScaleStep: 1 });

    const coreIds = coreNodeIdsOf(plain);
    const before = nodeById(unscaled);
    const after = nodeById(scaled);

    for (let i = 0; i < coreIds.length; i++) {
      for (let j = i + 1; j < coreIds.length; j++) {
        const a = before.get(coreIds[i])!;
        const b = before.get(coreIds[j])!;
        const p = after.get(coreIds[i])!;
        const q = after.get(coreIds[j])!;
        if (Math.abs((a.x ?? 0) - (b.x ?? 0)) < 0.5) {
          expect(Math.abs((p.x ?? 0) - (q.x ?? 0))).toBeLessThan(0.5);
        }
        if (Math.abs((a.y ?? 0) - (b.y ?? 0)) < 0.5) {
          expect(Math.abs((p.y ?? 0) - (q.y ?? 0))).toBeLessThan(0.5);
        }
      }
    }
  });

  it('grows a tree along the declared direction when the core leaves room for it', () => {
    const down = coreWithTwoTrees('TB');
    const right = coreWithTwoTrees('LR');

    const downResult = runGridAttachedLayoutCore(down);
    const rightResult = runGridAttachedLayoutCore(right);

    expect(downResult.components[0].trees.some((tree) => tree.growth === 'S')).toBe(true);
    expect(rightResult.components[0].trees.some((tree) => tree.growth === 'E')).toBe(true);
  });

  it('lays a tree out rank by rank, growing away from its root', () => {
    const data = layoutData(
      ['A', 'B', 'C', 't1', 't2', 't3'].map((id) => node(id)),
      [
        edge('A', 'B'),
        edge('B', 'C'),
        edge('C', 'A'),
        edge('A', 't1'),
        edge('t1', 't2'),
        edge('t2', 't3'),
      ]
    );

    const result = runGridAttachedLayoutCore(data);
    const tree = result.components[0].trees[0];
    const nodes = nodeById(data);
    const along = (id: string): number => {
      const n = nodes.get(id)!;
      switch (tree.growth) {
        case 'S':
          return n.y ?? 0;
        case 'N':
          return -(n.y ?? 0);
        case 'E':
          return n.x ?? 0;
        default:
          return -(n.x ?? 0);
      }
    };

    expect(along('t1')).toBeLessThan(along('t2'));
    expect(along('t2')).toBeLessThan(along('t3'));
  });

  it('draws an acyclic component as one tree, with no core', () => {
    const data = layoutData(
      ['root', 'a', 'b', 'c', 'd', 'e'].map((id) => node(id)),
      [edge('root', 'a'), edge('root', 'b'), edge('b', 'c'), edge('b', 'd'), edge('a', 'e')],
      'LR'
    );

    const result = runGridAttachedLayoutCore(data);

    expect(result.components).toHaveLength(1);
    expect(result.components[0].kind).toBe('pure-tree');
    expect(result.components[0].coreNodeIds).toEqual([]);
    expectEverythingDrawn(data, result);
  });

  it('packs disconnected components beside each other without overlap', () => {
    const data = layoutData(
      ['A', 'B', 'C', 'p1', 'X', 'Y'].map((id) => node(id)),
      [edge('A', 'B'), edge('B', 'C'), edge('C', 'A'), edge('A', 'p1'), edge('X', 'Y')]
    );

    const result = runGridAttachedLayoutCore(data);

    expect(result.componentCount).toBe(2);
    const [first, second] = result.components;
    expect(overlaps(first.bounds, second.bounds)).toBe(false);
    expectEverythingDrawn(data, result);
  });

  it('routes a self-loop on a tree node and on a core node', () => {
    const data = layoutData(
      ['A', 'B', 'C', 't1'].map((id) => node(id)),
      [
        edge('A', 'B'),
        edge('B', 'C'),
        edge('C', 'A'),
        edge('A', 't1'),
        edge('t1', 't1'),
        edge('B', 'B'),
      ]
    );

    const result = runGridAttachedLayoutCore(data);

    expectEverythingDrawn(data, result);
    const loops = data.edges.filter((e) => e.start === e.end);
    expect(loops).toHaveLength(2);
    for (const loop of loops) {
      expect((loop.points ?? []).length).toBeGreaterThanOrEqual(4);
    }
  });

  /**
   * A tree grown SOUTH uses the top of every node for its parent's connector, so a
   * loop drawn there would sit on top of an arrow. It has to go across the rank
   * axis instead.
   */
  it('keeps a tree node self-loop off the side its rank connector arrives on', () => {
    const data = layoutData(
      ['A', 'B', 'C', 't1'].map((id) => node(id)),
      [edge('A', 'B'), edge('B', 'C'), edge('C', 'A'), edge('A', 't1'), edge('t1', 't1')]
    );

    const result = runGridAttachedLayoutCore(data);
    const growth = result.components[0].trees[0].growth;
    const loop = data.edges.find((e) => e.id === 't1-t1')!;
    const rect = rectOf(nodeById(data).get('t1')!);

    // The loop leaves and re-enters one side, and that side is across the rank axis.
    for (const point of loop.points!) {
      if (growth === 'N' || growth === 'S') {
        expect(point.y).toBeGreaterThan(rect.minY - 1);
        expect(point.y).toBeLessThan(rect.maxY + 1);
      } else {
        expect(point.x).toBeGreaterThan(rect.minX - 1);
        expect(point.x).toBeLessThan(rect.maxX + 1);
      }
    }
  });

  it('routes a self-loop on a node of a component that is all tree', () => {
    const data = layoutData(
      ['root', 'a', 'b'].map((id) => node(id)),
      [edge('root', 'a'), edge('root', 'b'), edge('a', 'a')]
    );

    const result = runGridAttachedLayoutCore(data);

    expect(result.components[0].kind).toBe('pure-tree');
    expectEverythingDrawn(data, result);
    expect((data.edges.find((e) => e.id === 'a-a')!.points ?? []).length).toBeGreaterThanOrEqual(4);
  });

  it('spreads a fan of connectors leaving one tree node over separate ports', () => {
    // `p1` has three children, so all three connectors leave the same side of it.
    const data = layoutData(
      ['A', 'B', 'C', 'p1', 'c1', 'c2', 'c3'].map((id) => node(id)),
      [
        edge('A', 'B'),
        edge('B', 'C'),
        edge('C', 'A'),
        edge('A', 'p1'),
        edge('p1', 'c1'),
        edge('p1', 'c2'),
        edge('p1', 'c3'),
      ]
    );

    runGridAttachedLayoutCore(data);

    const starts = ['p1-c1', 'p1-c2', 'p1-c3'].map(
      (id) => data.edges.find((e) => e.id === id)!.points![0]
    );
    const ports = new Set(starts.map((p) => `${p.x.toFixed(3)}:${p.y.toFixed(3)}`));
    expect(ports.size).toBe(3);
  });

  it('separates several trees hanging off the very same core node', () => {
    // Six wide pendants on one node: the four sides of `A` cannot hold them, so
    // the search has to use the corners and step them sideways past each other.
    const wide = (id: string): Node => node(id, { width: 260 });
    const pendants = ['k1', 'k2', 'k3', 'k4', 'k5', 'k6'];
    const data = layoutData(
      [node('A'), node('B'), node('C'), ...pendants.map(wide)],
      [edge('A', 'B'), edge('B', 'C'), edge('C', 'A'), ...pendants.map((id) => edge('A', id))]
    );

    const result = runGridAttachedLayoutCore(data);
    const trees = result.components[0].trees;

    expect(trees).toHaveLength(6);
    expect(trees.filter((tree) => tree.relaxed)).toEqual([]);
    for (let i = 0; i < trees.length; i++) {
      for (let j = i + 1; j < trees.length; j++) {
        expect(
          overlaps(trees[i].footprint, trees[j].footprint),
          `${trees[i].treeId} overlaps ${trees[j].treeId}`
        ).toBe(false);
      }
    }
  });

  /**
   * Leaf peeling can hang several trees off one core node, and each is placed on
   * its own — so nothing but a shared fan stops all their connectors leaving
   * through the same point on that node.
   */
  it('gives every connector leaving one core node its own port, across trees', () => {
    // `k1`, `k2` and `k3` are three separate trees, all attached to `A`.
    const data = layoutData(
      ['A', 'B', 'C', 'k1', 'k2', 'k3'].map((id) => node(id)),
      [
        edge('A', 'B'),
        edge('B', 'C'),
        edge('C', 'A'),
        edge('A', 'k1'),
        edge('A', 'k2'),
        edge('A', 'k3'),
      ]
    );

    const result = runGridAttachedLayoutCore(data);
    expect(result.components[0].trees).toHaveLength(3);

    const starts = ['A-k1', 'A-k2', 'A-k3'].map(
      (id) => data.edges.find((e) => e.id === id)!.points![0]
    );
    const ports = new Set(starts.map((p) => `${p.x.toFixed(3)}:${p.y.toFixed(3)}`));
    expect(ports.size).toBe(3);
  });

  /**
   * Antiparallel edges collapse into one topological edge, so without a port at
   * *both* ends the two would be drawn as one line in each direction.
   */
  it('separates a pair of antiparallel edges at both ends', () => {
    const data = layoutData(
      ['A', 'B', 'C', 't1'].map((id) => node(id)),
      [
        edge('A', 'B'),
        edge('B', 'C'),
        edge('C', 'A'),
        edge('A', 't1'),
        { id: 't1-A', start: 't1', end: 'A' } as Edge,
      ]
    );

    runGridAttachedLayoutCore(data);

    const forward = data.edges.find((e) => e.id === 'A-t1')!.points!;
    const backward = data.edges.find((e) => e.id === 't1-A')!.points!;
    const key = (p: { x: number; y: number }) => `${p.x.toFixed(3)}:${p.y.toFixed(3)}`;
    // Both leave `A` and both reach `t1`, but never at the same two points.
    expect(key(forward[0])).not.toBe(key(backward[backward.length - 1]));
    expect(key(forward[forward.length - 1])).not.toBe(key(backward[0]));
  });

  it('places an edge label on a tree connector', () => {
    const data = layoutData(
      ['A', 'B', 'C', 't1'].map((id) => node(id)),
      [
        edge('A', 'B'),
        edge('B', 'C'),
        edge('C', 'A'),
        edge('A', 't1', { label: 'yes', width: 30, height: 16 }),
      ]
    );

    runGridAttachedLayoutCore(data);

    const labelled = data.edges.find((e) => e.id === 'A-t1')!;
    expect(Number.isFinite(labelled.x)).toBe(true);
    expect(Number.isFinite(labelled.y)).toBe(true);
  });

  /**
   * A crowded core is the case enlargement exists for: at grid-like's own scale
   * one tree has nowhere to go but a long way out, and stretching the core's
   * edges buys back most of that distance.
   */
  it('stretches the core edges when that is what stops a tree being pushed away', () => {
    const crowded = crowdedCore();
    const cramped = crowdedCore();

    const enlarged = runGridAttachedLayoutCore(crowded);
    const asDrawn = runGridAttachedLayoutCore(cramped, { maxCoreScale: 1 });

    expect(asDrawn.components[0].coreScale).toBe(1);
    expect(enlarged.components[0].coreScale).toBeGreaterThan(1);

    const worstEnlarged = Math.max(...enlarged.components[0].trees.map((tree) => tree.slide));
    const worstCramped = Math.max(...asDrawn.components[0].trees.map((tree) => tree.slide));
    expect(worstEnlarged).toBeLessThan(worstCramped);
  });

  it('still produces a complete drawing when the core may not be enlarged', () => {
    const data = crowdedCore();

    const result = runGridAttachedLayoutCore(data, { maxCoreScale: 1 });

    expect(result.components[0].coreScale).toBe(1);
    expect(result.components[0].trees).toHaveLength(8);
    expectEverythingDrawn(data, result);
  });

  /**
   * HOLA's paper graph 8. Its core is a four-cycle, and the obvious drawing of one
   * is the rectangle: two rows, two columns, all four edges straight.
   *
   * grid-like reaches it only for some of its settings — the beautification is
   * greedy, so on a core this small the drawing that comes out flips on sub-pixel
   * changes to the derived grid spacing. Asking it several times and keeping the
   * drawing with the fewest unaligned pairs is what pins it down.
   */
  it('draws a four-cycle core as a rectangle, with no edge left unaligned', () => {
    const data = layoutData(
      ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'L'].map((id) => node(id)),
      [
        edge('A', 'B'),
        edge('B', 'C'),
        edge('C', 'D'),
        edge('D', 'A'),
        edge('D', 'E'),
        edge('E', 'F'),
        edge('E', 'G'),
        edge('E', 'H'),
        edge('G', 'I'),
        edge('G', 'L'),
      ]
    );

    const result = runGridAttachedLayoutCore(data);
    expect(result.components[0].coreNodeIds.sort()).toEqual(['A', 'B', 'C', 'D']);

    const at = nodeById(data);
    const near = (a: number, b: number) => Math.abs(a - b) < 1;
    const corner = (id: string) => ({ x: at.get(id)!.x ?? 0, y: at.get(id)!.y ?? 0 });
    const [a, b, c, d] = ['A', 'B', 'C', 'D'].map(corner);

    // Every core edge joins a pair sharing a row or a column, so none of them has
    // to bend: A—B, B—C, C—D and D—A are all straight.
    for (const [from, to] of [
      [a, b],
      [b, c],
      [c, d],
      [d, a],
    ] as const) {
      expect(
        near(from.x, to.x) || near(from.y, to.y),
        'every edge of the four-cycle should be straight'
      ).toBe(true);
    }
    // Two distinct rows and two distinct columns — a rectangle, not a column of four.
    expect(new Set([a, b, c, d].map((p) => Math.round(p.x))).size).toBe(2);
    expect(new Set([a, b, c, d].map((p) => Math.round(p.y))).size).toBe(2);
  });

  it('handles an empty diagram', () => {
    const data = layoutData([], []);

    const result = runGridAttachedLayoutCore(data);

    expect(result.components).toEqual([]);
    expect(result.componentCount).toBe(0);
  });
});
