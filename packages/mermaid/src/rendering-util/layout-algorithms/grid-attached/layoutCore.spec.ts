import { describe, expect, it } from 'vitest';
import type { Point } from '../../../types.js';
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

  /**
   * Six pendants on one node are six components of the pruned forest, so HOLA's
   * decomposition returns six trees. Placing them separately means six independent
   * decisions competing for the same wedges at the same node, each committing a
   * footprint the next has to avoid; gathered into one tree they are laid out as one
   * balanced fan and placed once.
   */
  it('gathers everything hanging off one core node into a single fanned-out tree', () => {
    const wide = (id: string): Node => node(id, { width: 260 });
    const pendants = ['k1', 'k2', 'k3', 'k4', 'k5', 'k6'];
    const data = layoutData(
      [node('A'), node('B'), node('C'), ...pendants.map(wide)],
      [edge('A', 'B'), edge('B', 'C'), edge('C', 'A'), ...pendants.map((id) => edge('A', id))]
    );

    const result = runGridAttachedLayoutCore(data);
    const trees = result.components[0].trees;

    expect(trees).toHaveLength(1);
    expect(trees[0].coreNodeId).toBe('A');
    expect([...trees[0].nodeIds].sort()).toEqual(pendants);
    expect(trees.filter((tree) => tree.relaxed)).toEqual([]);

    // And the six leaves are still drawn clear of each other.
    const at = nodeById(data);
    for (let i = 0; i < pendants.length; i++) {
      for (let j = i + 1; j < pendants.length; j++) {
        expect(
          overlaps(rectOf(at.get(pendants[i])!), rectOf(at.get(pendants[j])!)),
          `${pendants[i]} overlaps ${pendants[j]}`
        ).toBe(false);
      }
    }
  });

  /**
   * Everything hanging off one core node is one tree, so its connectors are one fan
   * and all leave the same side of that node. Each still needs its own attachment
   * point, or they are drawn as one thick stem.
   */
  it('gives every connector leaving one core node its own port', () => {
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
    expect(result.components[0].trees).toHaveLength(1);

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
   * Enlargement is a trade, not a rule: the room it spends is priced against the dead
   * stubs and crossings it removes, so whether a given drawing grows depends on which
   * side is cheaper. What must hold is that the room *works* — given it for free, the
   * ladder spends it and the trees sit closer to their roots.
   *
   * The default trade is asserted elsewhere, on a graph where enlarging removes a
   * crossing; here every scale is already crossing-free, so only the stubs move.
   */
  it('shortens the worst dead stub when the room to do it is free', () => {
    const free = crowdedCore();
    const priced = crowdedCore();

    const freely = runGridAttachedLayoutCore(free, { enlargementPenaltyWeight: 0 });
    const asPriced = runGridAttachedLayoutCore(priced, { maxCoreScale: 1 });

    const worst = (result: ReturnType<typeof runGridAttachedLayoutCore>): number =>
      Math.max(0, ...result.components[0].trees.map((tree) => tree.slide));

    expect(asPriced.components[0].coreScale).toBe(1);
    expect(freely.components[0].coreScale).toBeGreaterThan(1);
    expect(worst(freely)).toBeLessThan(worst(asPriced));
    expectEverythingDrawn(free, freely);
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

  /**
   * A label is drawn centred on its connector, so the gap between two ranks has to
   * hold the label *and* clearance at both ends. Without the reservation a tall
   * label fills the gap and ends up touching both nodes, with no room left for the
   * arrowhead.
   */
  it('widens a tree rank gap to hold a big edge label', () => {
    const tall = { label: 'Differential Gene Expression Analysis', width: 200, height: 44 };
    const data = layoutData(
      ['A', 'B', 'C', 't1', 't2'].map((id) => node(id)),
      [edge('A', 'B'), edge('B', 'C'), edge('C', 'A'), edge('A', 't1'), edge('t1', 't2', tall)]
    );

    const result = runGridAttachedLayoutCore(data);
    const at = nodeById(data);
    const first = at.get('t1')!;
    const second = at.get('t2')!;
    const growth = result.components[0].trees[0].growth;

    // Boundary to boundary along the rank axis: the label plus clearance at each end.
    const gap =
      growth === 'N' || growth === 'S'
        ? Math.abs((second.y ?? 0) - (first.y ?? 0)) -
          (first.height ?? 0) / 2 -
          (second.height ?? 0) / 2
        : Math.abs((second.x ?? 0) - (first.x ?? 0)) -
          (first.width ?? 0) / 2 -
          (second.width ?? 0) / 2;
    const along = growth === 'N' || growth === 'S' ? tall.height : tall.width;
    expect(gap).toBeGreaterThanOrEqual(along + 2 * result.options.labelClearance - 0.5);

    // And the label really does clear both nodes it sits between.
    const labelled = data.edges.find((e) => e.id === 't1-t2')!;
    for (const box of [first, second]) {
      const overlaps =
        Math.abs(labelled.x! - (box.x ?? 0)) < (tall.width + (box.width ?? 0)) / 2 - 0.5 &&
        Math.abs(labelled.y! - (box.y ?? 0)) < (tall.height + (box.height ?? 0)) / 2 - 0.5;
      expect(overlaps, `the label overlaps ${box.id}`).toBe(false);
    }
  });

  /**
   * Two edges crossing under a label make it ambiguous: a reader cannot tell which
   * of them it names. Sliding it along its own route costs nothing else, so the
   * crossing is avoided outright.
   */
  it('slides a label away from a crossing rather than sitting on it', () => {
    // `A` reaches both `t2` and `t3`, and one of those connectors crosses the other,
    // so the naive midpoint of at least one route lands near the crossing.
    const data = layoutData(
      ['A', 'B', 'C', 't1', 't2', 't3'].map((id) => node(id)),
      [
        edge('A', 'B'),
        edge('B', 'C'),
        edge('C', 'A'),
        edge('A', 't1'),
        edge('t1', 't2'),
        edge('t1', 't3', { label: 'assay', width: 60, height: 20 }),
        edge('t2', 't3', { label: 'sequencing', width: 90, height: 20 }),
      ]
    );

    runGridAttachedLayoutCore(data);

    const segments: { id: string; a: Point; b: Point }[] = [];
    for (const e of data.edges) {
      const points = e.points ?? [];
      for (let i = 1; i < points.length; i++) {
        segments.push({ id: e.id, a: points[i - 1], b: points[i] });
      }
    }
    const crossings: Point[] = [];
    for (let i = 0; i < segments.length; i++) {
      for (let j = i + 1; j < segments.length; j++) {
        if (segments[i].id === segments[j].id) {
          continue;
        }
        const p = segments[i];
        const q = segments[j];
        const r = { x: p.b.x - p.a.x, y: p.b.y - p.a.y };
        const t2 = { x: q.b.x - q.a.x, y: q.b.y - q.a.y };
        const den = r.x * t2.y - r.y * t2.x;
        if (Math.abs(den) < 1e-9) {
          continue;
        }
        const d = { x: q.a.x - p.a.x, y: q.a.y - p.a.y };
        const t = (d.x * t2.y - d.y * t2.x) / den;
        const u = (d.x * r.y - d.y * r.x) / den;
        if (t <= 1e-6 || t >= 1 - 1e-6 || u <= 1e-6 || u >= 1 - 1e-6) {
          continue;
        }
        crossings.push({ x: p.a.x + t * r.x, y: p.a.y + t * r.y });
      }
    }

    for (const id of ['t1-t3', 't2-t3']) {
      const labelled = data.edges.find((e) => e.id === id)!;
      for (const crossing of crossings) {
        const inside =
          Math.abs(crossing.x - labelled.x!) < (labelled.width ?? 0) / 2 &&
          Math.abs(crossing.y - labelled.y!) < (labelled.height ?? 0) / 2;
        expect(inside, `${id}'s label sits on a crossing`).toBe(false);
      }
      // It stayed on its own edge: the label centre lies on one of the route's runs.
      const onOwnRoute = (labelled.points ?? []).some((point, index, all) => {
        if (index === 0) {
          return false;
        }
        const previous = all[index - 1];
        const withinX =
          labelled.x! >= Math.min(previous.x, point.x) - 0.5 &&
          labelled.x! <= Math.max(previous.x, point.x) + 0.5;
        const withinY =
          labelled.y! >= Math.min(previous.y, point.y) - 0.5 &&
          labelled.y! <= Math.max(previous.y, point.y) + 0.5;
        return withinX && withinY;
      });
      expect(onOwnRoute, `${id}'s label drifted off its own route`).toBe(true);
    }
  });

  /**
   * A diamond does not reach the corners of its own bounding box, so a connector
   * given a port out along a bounding-box side starts in the empty gap between the
   * box and the shape — the arrow appears to come from nowhere. This is the case a
   * fan makes unavoidable: two children means two ports, and neither can be at the
   * centre.
   *
   * Silhouettes come from the shape's rendered `intersect` function, which only
   * exists once a node has been measured, so the test installs a real diamond one.
   */
  it('starts a tree connector on a diamond, not on its bounding box', () => {
    const halfWidth = 90;
    const halfHeight = 45;
    // |dx| / a + |dy| / b = 1 is the diamond; a ray from the centre meets it once.
    const diamond = (node: Node) => (target: { x: number; y: number }) => {
      const dx = target.x - (node.x ?? 0);
      const dy = target.y - (node.y ?? 0);
      const denominator = Math.abs(dx) / halfWidth + Math.abs(dy) / halfHeight;
      if (denominator === 0) {
        return { x: node.x ?? 0, y: node.y ?? 0 };
      }
      return { x: (node.x ?? 0) + dx / denominator, y: (node.y ?? 0) + dy / denominator };
    };

    const gate = node('gate', { width: halfWidth * 2, height: halfHeight * 2 });
    (gate as Node & { intersect?: unknown }).intersect = diamond(gate);

    const data = layoutData(
      [node('A'), node('B'), node('C'), gate, node('yes'), node('no')],
      [
        edge('A', 'B'),
        edge('B', 'C'),
        edge('C', 'A'),
        edge('A', 'gate'),
        edge('gate', 'yes'),
        edge('gate', 'no'),
      ]
    );

    runGridAttachedLayoutCore(data);

    const at = nodeById(data);
    const placed = at.get('gate')!;
    const onDiamond = (point: Point): number =>
      Math.abs(point.x - (placed.x ?? 0)) / halfWidth +
      Math.abs(point.y - (placed.y ?? 0)) / halfHeight;

    let offCentrePorts = 0;
    for (const id of ['gate-yes', 'gate-no']) {
      const route = data.edges.find((e) => e.id === id)!.points!;
      const start = route[0];
      // On the diamond's boundary, not merely inside its box.
      expect(onDiamond(start), `${id} does not start on the diamond`).toBeCloseTo(1, 1);
      if (Math.abs(start.x - (placed.x ?? 0)) > 1 && Math.abs(start.y - (placed.y ?? 0)) > 1) {
        offCentrePorts++;
      }
    }
    // Both ports are off the diamond's vertices — which is exactly the case that
    // used to leave the connector hanging in the corner of the bounding box.
    expect(offCentrePorts).toBeGreaterThan(0);
  });

  /**
   * A core node's sides are already in use by the core's own edges, and this layout
   * may not move those. So a tree hanging off it has to attach *beside* them — and
   * the awkward case is a lone connector, which otherwise keeps the centre of its
   * side and lands exactly where a lone core edge already is.
   *
   * This is HOLA's paper graph 5: two cycles meeting at `E`, so `E` carries a core
   * edge on each of its four sides, and one tree hanging off it.
   */
  it('attaches a tree beside the core edges already on that side, not on top of them', () => {
    const data = layoutData(
      ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'L', 'M', 'N', 'O'].map((id) => node(id)),
      [
        edge('A', 'C'),
        edge('B', 'C'),
        edge('C', 'D'),
        edge('D', 'E'),
        edge('E', 'F'),
        edge('F', 'G'),
        edge('G', 'H'),
        edge('H', 'E'),
        edge('E', 'I'),
        edge('I', 'L'),
        edge('L', 'M'),
        edge('M', 'N'),
        edge('N', 'O'),
        edge('O', 'E'),
      ]
    );

    const result = runGridAttachedLayoutCore(data);
    const coreIds = new Set(result.components.flatMap((component) => component.coreNodeIds));
    // `E` is in the core with a tree hanging off it — the situation under test.
    expect(coreIds.has('E')).toBe(true);
    expect(coreIds.has('D')).toBe(false);

    const ends = new Map<string, { edgeId: string; core: boolean; point: Point }[]>();
    for (const e of data.edges) {
      const points = e.points ?? [];
      if (points.length < 2) {
        continue;
      }
      const core = coreIds.has(e.start!) && coreIds.has(e.end!);
      for (const [id, point] of [
        [e.start, points[0]],
        [e.end, points[points.length - 1]],
      ] as const) {
        const list = ends.get(id!) ?? [];
        list.push({ edgeId: e.id, core, point });
        ends.set(id!, list);
      }
    }

    let treeVersusCore = 0;
    for (const [nodeId, list] of ends) {
      for (let i = 0; i < list.length; i++) {
        for (let j = i + 1; j < list.length; j++) {
          if (list[i].core === list[j].core) {
            continue;
          }
          treeVersusCore++;
          const apart =
            Math.abs(list[i].point.x - list[j].point.x) +
            Math.abs(list[i].point.y - list[j].point.y);
          expect(
            apart,
            `${list[i].edgeId} and ${list[j].edgeId} attach at the same point on ${nodeId}`
          ).toBeGreaterThan(0.5);
        }
      }
    }
    // The situation the test is about really did arise.
    expect(treeVersusCore).toBeGreaterThan(0);
  });

  /**
   * A four-node loop with a big tree on one corner and a small one on the next. At
   * grid-like's own scale the two corners are close enough that the two trees'
   * connectors cross; the room to separate them is exactly what stretching the loop's
   * edges buys, so the ladder should spend it rather than leave the crossing.
   */
  it('stretches the core rather than leave two trees crossing each other', () => {
    // HOLA's four-node loop with trees, node for node: a big deep tree on `C4` and a
    // small one on the neighbouring `C3`, whose two corners of the loop sit close
    // together with both trees wanting the space between them.
    const loop = (): LayoutData =>
      layoutData(
        [
          'C1',
          'C2',
          'C3',
          'C4',
          'C1_1',
          'C1_2',
          'C1_11',
          'C1_12',
          'C1_13',
          'C1_111',
          'C1_21',
          'C2_1',
          'C2_2',
          'C2_11',
          'C2_12',
          'C3_1',
          'C3_11',
          'C3_12',
          'C4_1',
          'C4_2',
          'C4_11',
          'C4_12',
          'C4_21',
          'C4_22',
          'C4_111',
          'C4_112',
          'C4_121',
          'C4_122',
          'C4_211',
          'C4_221',
          'C4_1111',
          'C4_1121',
        ].map((id) => node(id, { width: 100, height: 54 })),
        [
          edge('C1', 'C2'),
          edge('C2', 'C3'),
          edge('C3', 'C4'),
          edge('C4', 'C1'),
          edge('C1', 'C1_1'),
          edge('C1', 'C1_2'),
          edge('C1_1', 'C1_11'),
          edge('C1_1', 'C1_12'),
          edge('C1_1', 'C1_13'),
          edge('C1_11', 'C1_111'),
          edge('C1_2', 'C1_21'),
          edge('C2', 'C2_1'),
          edge('C2', 'C2_2'),
          edge('C2_1', 'C2_11'),
          edge('C2_1', 'C2_12'),
          edge('C3', 'C3_1'),
          edge('C3_1', 'C3_11'),
          edge('C3_1', 'C3_12'),
          edge('C4', 'C4_1'),
          edge('C4', 'C4_2'),
          edge('C4_1', 'C4_11'),
          edge('C4_1', 'C4_12'),
          edge('C4_2', 'C4_21'),
          edge('C4_2', 'C4_22'),
          edge('C4_11', 'C4_111'),
          edge('C4_11', 'C4_112'),
          edge('C4_12', 'C4_121'),
          edge('C4_12', 'C4_122'),
          edge('C4_21', 'C4_211'),
          edge('C4_22', 'C4_221'),
          edge('C4_111', 'C4_1111'),
          edge('C4_112', 'C4_1121'),
        ]
      );

    const crossings = (data: LayoutData): number => {
      const segments: { id: string; a: Point; b: Point }[] = [];
      for (const e of data.edges) {
        const points = e.points ?? [];
        for (let i = 1; i < points.length; i++) {
          segments.push({ id: e.id, a: points[i - 1], b: points[i] });
        }
      }
      let count = 0;
      for (let i = 0; i < segments.length; i++) {
        for (let j = i + 1; j < segments.length; j++) {
          const p = segments[i];
          const q = segments[j];
          if (p.id === q.id) {
            continue;
          }
          const r = { x: p.b.x - p.a.x, y: p.b.y - p.a.y };
          const s2 = { x: q.b.x - q.a.x, y: q.b.y - q.a.y };
          const den = r.x * s2.y - r.y * s2.x;
          if (Math.abs(den) < 1e-9) {
            continue;
          }
          const d = { x: q.a.x - p.a.x, y: q.a.y - p.a.y };
          const t = (d.x * s2.y - d.y * s2.x) / den;
          const u = (d.x * r.y - d.y * r.x) / den;
          if (t <= 1e-6 || t >= 1 - 1e-6 || u <= 1e-6 || u >= 1 - 1e-6) {
            continue;
          }
          count++;
        }
      }
      return count;
    };

    const cramped = loop();
    const crampedResult = runGridAttachedLayoutCore(cramped, { maxCoreScale: 1 });
    const stretched = loop();
    const stretchedResult = runGridAttachedLayoutCore(stretched);

    // Denied the room, the drawing has crossings; given it, the ladder spends it.
    expect(crampedResult.components[0].coreScale).toBe(1);
    expect(crossings(cramped)).toBeGreaterThan(0);
    expect(stretchedResult.components[0].coreScale).toBeGreaterThan(1);
    expect(crossings(stretched)).toBeLessThan(crossings(cramped));

    // And it really is the core's own edges that got longer, by one common factor.
    const before = nodeById(cramped);
    const after = nodeById(stretched);
    const core = ['C1', 'C2', 'C3', 'C4'];
    for (let i = 0; i < core.length; i++) {
      for (let j = i + 1; j < core.length; j++) {
        const a = before.get(core[i])!;
        const b = before.get(core[j])!;
        const p = after.get(core[i])!;
        const q = after.get(core[j])!;
        const was = Math.hypot((a.x ?? 0) - (b.x ?? 0), (a.y ?? 0) - (b.y ?? 0));
        const is = Math.hypot((p.x ?? 0) - (q.x ?? 0), (p.y ?? 0) - (q.y ?? 0));
        if (was > 1e-6) {
          expect(is / was).toBeCloseTo(stretchedResult.components[0].coreScale, 5);
        }
      }
    }
  });

  it('handles an empty diagram', () => {
    const data = layoutData([], []);

    const result = runGridAttachedLayoutCore(data);

    expect(result.components).toEqual([]);
    expect(result.componentCount).toBe(0);
  });
});
