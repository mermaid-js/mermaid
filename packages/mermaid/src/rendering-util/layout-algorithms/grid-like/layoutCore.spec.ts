import { describe, expect, it } from 'vitest';
import type { Edge, LayoutData, Node } from '../../types.js';
import { runGridLikeLayoutCore } from './layoutCore.js';
import type { GridLikeOptions } from './options.js';

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

function edge(start: string, end: string): Edge {
  return { id: `${start}-${end}`, start, end };
}

function layoutData(nodes: Node[], edges: Edge[], direction = 'TB'): LayoutData {
  return {
    nodes,
    edges,
    direction,
    config: { flowchart: { nodeSpacing: 50, rankSpacing: 50 } },
  } as unknown as LayoutData;
}

function byId(data: LayoutData): Map<string, Node> {
  return new Map(data.nodes.map((n) => [n.id, n]));
}

function expectNoOverlaps(data: LayoutData): void {
  const nodes = data.nodes.filter((n) => !n.isGroup);
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const gapX = (nodes[i].width! + nodes[j].width!) / 2 - Math.abs(nodes[i].x! - nodes[j].x!);
      const gapY = (nodes[i].height! + nodes[j].height!) / 2 - Math.abs(nodes[i].y! - nodes[j].y!);
      expect(
        gapX <= 1e-6 || gapY <= 1e-6,
        `${nodes[i].id} and ${nodes[j].id} overlap by (${gapX.toFixed(2)}, ${gapY.toFixed(2)})`
      ).toBe(true);
    }
  }
}

/**
 * How far the drawing is from a grid of the given spacing: the mean amount by
 * which the separation of a pair of node centres misses a whole number of grid
 * steps.
 *
 * Measured pairwise on purpose — the write-back translates the whole drawing
 * into the positive quadrant, so only the relative geometry is still on the
 * grid the solver snapped to.
 */
function meanGridOffset(data: LayoutData, spacing: number): number {
  const nodes = data.nodes.filter((n) => !n.isGroup);
  const offset = (value: number) => Math.abs(value - Math.round(value / spacing) * spacing);

  let total = 0;
  let pairs = 0;
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++, pairs++) {
      total += offset(nodes[i].x! - nodes[j].x!) + offset(nodes[i].y! - nodes[j].y!);
    }
  }
  return total / Math.max(pairs, 1);
}

/** Edges whose endpoints share a coordinate exactly, i.e. drawn axis-aligned. */
function axisAlignedEdgeCount(data: LayoutData): number {
  const nodes = byId(data);
  return data.edges.filter((e) => {
    const start = nodes.get(e.start!)!;
    const end = nodes.get(e.end!)!;
    return Math.abs(start.x! - end.x!) < 0.5 || Math.abs(start.y! - end.y!) < 0.5;
  }).length;
}

/** A graph whose unconstrained layout leaves most edges oblique. */
function obliqueGraph(direction = 'TB'): LayoutData {
  return layoutData(
    [node('A'), node('B'), node('C'), node('D'), node('E'), node('F')],
    [
      edge('A', 'B'),
      edge('B', 'C'),
      edge('A', 'D'),
      edge('D', 'E'),
      edge('E', 'F'),
      edge('B', 'F'),
    ],
    direction
  );
}

describe('grid-like layout core', () => {
  it('places every node and routes every edge', () => {
    const data = layoutData([node('A'), node('B'), node('C')], [edge('A', 'B'), edge('B', 'C')]);

    const result = runGridLikeLayoutCore(data);

    expect(result.variableCount).toBe(3);
    for (const n of data.nodes) {
      expect(Number.isFinite(n.x)).toBe(true);
      expect(Number.isFinite(n.y)).toBe(true);
    }
    for (const e of data.edges) {
      expect(e.points!.length).toBeGreaterThanOrEqual(2);
      expect(Number.isFinite(e.points![0].x)).toBe(true);
    }
  });

  it('keeps the whole drawing in the positive quadrant', () => {
    const data = layoutData(
      [node('A'), node('B'), node('C'), node('D')],
      [edge('A', 'B'), edge('A', 'C'), edge('B', 'D'), edge('C', 'D')]
    );

    runGridLikeLayoutCore(data);

    for (const n of data.nodes) {
      expect(n.x! - n.width! / 2).toBeGreaterThanOrEqual(0);
      expect(n.y! - n.height! / 2).toBeGreaterThanOrEqual(0);
    }
  });

  it('leaves no node overlaps', () => {
    const data = layoutData(
      [node('A'), node('B'), node('C'), node('D'), node('E'), node('F')],
      [
        edge('A', 'B'),
        edge('A', 'C'),
        edge('A', 'D'),
        edge('B', 'E'),
        edge('C', 'E'),
        edge('D', 'F'),
        edge('E', 'F'),
      ]
    );

    runGridLikeLayoutCore(data);

    expectNoOverlaps(data);
  });

  it('is deterministic across runs', () => {
    const build = () =>
      layoutData(
        [node('A'), node('B'), node('C'), node('D')],
        [edge('A', 'B'), edge('A', 'C'), edge('B', 'D'), edge('C', 'D')]
      );

    const first = build();
    const second = build();
    runGridLikeLayoutCore(first);
    runGridLikeLayoutCore(second);

    expect(first.nodes.map((n) => [n.x, n.y])).toEqual(second.nodes.map((n) => [n.x, n.y]));
  });

  describe('direction constraints', () => {
    it.each([
      ['TB', (a: Node, b: Node) => expect(b.y!).toBeGreaterThan(a.y!)],
      ['BT', (a: Node, b: Node) => expect(b.y!).toBeLessThan(a.y!)],
      ['LR', (a: Node, b: Node) => expect(b.x!).toBeGreaterThan(a.x!)],
      ['RL', (a: Node, b: Node) => expect(b.x!).toBeLessThan(a.x!)],
    ])('orders an edge along %s', (direction, assertOrder) => {
      const data = layoutData(
        [node('A'), node('B'), node('C')],
        [edge('A', 'B'), edge('B', 'C')],
        direction
      );

      runGridLikeLayoutCore(data);
      const nodes = byId(data);

      assertOrder(nodes.get('A')!, nodes.get('B')!);
      assertOrder(nodes.get('B')!, nodes.get('C')!);
    });

    it('still terminates and separates nodes on a cyclic graph', () => {
      const data = layoutData(
        [node('A'), node('B'), node('C')],
        [edge('A', 'B'), edge('B', 'C'), edge('C', 'A')]
      );

      runGridLikeLayoutCore(data);

      expectNoOverlaps(data);
    });
  });

  describe('adaptive constrained alignment (§11)', () => {
    it.each(['TB', 'LR'])(
      'makes edges exactly axis-aligned in %s that the plain layout leaves oblique',
      (direction) => {
        const aligned = obliqueGraph(direction);
        const plain = obliqueGraph(direction);

        const result = runGridLikeLayoutCore(aligned, { mode: 'aca' });
        // Same pipeline without phase 2, so the difference is ACA alone.
        runGridLikeLayoutCore(plain, { mode: 'aca', maxAlignments: 0 });

        expect(result.alignments).toBeGreaterThan(0);
        expect(axisAlignedEdgeCount(aligned)).toBeGreaterThanOrEqual(result.alignments);
        expect(axisAlignedEdgeCount(aligned)).toBeGreaterThan(axisAlignedEdgeCount(plain));
      }
    );

    it('holds every accepted alignment exactly in the finished drawing', () => {
      const data = obliqueGraph();

      const result = runGridLikeLayoutCore(data, { mode: 'aca' });

      // Every alignment survives write-back: none is quietly left approximate.
      expect(axisAlignedEdgeCount(data)).toBeGreaterThanOrEqual(result.alignments);
      expect(result.rejectedAlignments).toBeGreaterThanOrEqual(0);
    });

    it('aligns only one child of a fork, so the siblings do not collide (§17)', () => {
      const data = layoutData(
        [node('A'), node('B'), node('C')],
        [edge('A', 'B'), edge('A', 'C')],
        'TB'
      );

      const result = runGridLikeLayoutCore(data, { mode: 'aca' });
      const nodes = byId(data);

      expect(result.alignments).toBe(1);
      const aligned = ['B', 'C'].filter(
        (id) => Math.abs(nodes.get(id)!.x! - nodes.get('A')!.x!) < 0.5
      );
      expect(aligned).toHaveLength(1);
      expectNoOverlaps(data);
    });

    it('respects the alignment cap', () => {
      const data = layoutData(
        [node('A'), node('B'), node('C'), node('D')],
        [edge('A', 'B'), edge('B', 'C'), edge('C', 'D')]
      );

      const result = runGridLikeLayoutCore(data, { mode: 'aca', maxAlignments: 1 });

      expect(result.alignments).toBe(1);
    });
  });

  describe('grid snap (§6)', () => {
    const build = () =>
      layoutData(
        [node('A'), node('B'), node('C'), node('D'), node('E')],
        [edge('A', 'B'), edge('A', 'C'), edge('B', 'D'), edge('C', 'E')]
      );

    it('pulls node centres closer to grid points than the same run without the term', () => {
      const snapped = build();
      const unsnapped = build();

      const withSnap = runGridLikeLayoutCore(snapped, { mode: 'grid-snap' });
      // Same pipeline, same grid-aware separations, no grid attraction: the
      // only difference is the k_gs term, so the comparison isolates it.
      const withoutSnap = runGridLikeLayoutCore(unsnapped, {
        mode: 'grid-snap',
        gridSnapWeight: 0,
      });

      expect(withSnap.options.gridSpacing).toBe(withoutSnap.options.gridSpacing);
      // Not merely lower: the term has to be worth switching on.
      expect(meanGridOffset(snapped, withSnap.options.gridSpacing)).toBeLessThan(
        meanGridOffset(unsnapped, withoutSnap.options.gridSpacing) / 2
      );
    });

    it('derives a grid coarse enough to hold the largest node', () => {
      const data = layoutData(
        [node('A', { width: 260, height: 120 }), node('B')],
        [edge('A', 'B')]
      );

      const result = runGridLikeLayoutCore(data, { mode: 'grid-snap' });

      expect(result.options.gridSpacing).toBeGreaterThanOrEqual(260 + 50);
      expect(result.options.snapDistance).toBe(result.options.gridSpacing / 2);
      expectNoOverlaps(data);
    });

    it('keeps the alignments ACA established while snapping (§23)', () => {
      const data = obliqueGraph();

      const result = runGridLikeLayoutCore(data, { mode: 'aca-grid-snap' });

      expect(result.alignments).toBeGreaterThan(0);
      // The snap phase projects onto the alignment constraints too, so nothing
      // it does may leave an accepted alignment merely approximate.
      expect(axisAlignedEdgeCount(data)).toBeGreaterThanOrEqual(result.alignments);
    });
  });

  it.each(['node-snap', 'grid-snap', 'node-and-grid-snap', 'aca', 'aca-grid-snap'] as const)(
    'produces a usable layout in mode %s',
    (mode: GridLikeOptions['mode']) => {
      const data = layoutData(
        [node('A'), node('B'), node('C'), node('D'), node('E')],
        [edge('A', 'B'), edge('A', 'C'), edge('B', 'D'), edge('C', 'D'), edge('D', 'E')]
      );

      runGridLikeLayoutCore(data, { mode });

      expectNoOverlaps(data);
      for (const n of data.nodes) {
        expect(Number.isFinite(n.x)).toBe(true);
        expect(Number.isFinite(n.y)).toBe(true);
      }
    }
  );

  it('stays sane on a graph with varied sizes and extra cross edges', () => {
    const ids = Array.from({ length: 30 }, (_, i) => `n${i}`);
    const nodes = ids.map((id, i) =>
      node(id, { width: 60 + ((i * 37) % 140), height: 30 + ((i * 23) % 50) })
    );
    const edges = ids.slice(1).map((id, i) => edge(ids[Math.floor((i + 1) / 3)], id));
    for (let k = 0; k < 8; k++) {
      const a = (k * 7) % ids.length;
      const b = (k * 13 + 5) % ids.length;
      if (a !== b) {
        edges.push(edge(ids[Math.min(a, b)], ids[Math.max(a, b)]));
      }
    }
    const data = layoutData(nodes, edges);

    const result = runGridLikeLayoutCore(data);

    expectNoOverlaps(data);
    expect(result.alignments).toBeGreaterThan(0);
    for (const n of data.nodes) {
      expect(Number.isFinite(n.x)).toBe(true);
      expect(Number.isFinite(n.y)).toBe(true);
    }
  });

  it('keeps disconnected components apart', () => {
    const data = layoutData(
      [node('A'), node('B'), node('X'), node('Y')],
      [edge('A', 'B'), edge('X', 'Y')]
    );

    runGridLikeLayoutCore(data);

    expectNoOverlaps(data);
  });

  it('routes a self loop clear of its node', () => {
    const data = layoutData([node('A'), node('B')], [edge('A', 'B'), edge('A', 'A')]);

    runGridLikeLayoutCore(data);
    const selfLoop = data.edges.find((e) => e.start === e.end)!;
    const a = byId(data).get('A')!;

    expect(selfLoop.points!.length).toBeGreaterThan(2);
    for (const point of selfLoop.points!) {
      expect(point.y).toBeLessThanOrEqual(a.y! - a.height! / 2 + 1e-6);
    }
  });

  it('fits a group frame around its children', () => {
    const data = layoutData(
      [
        node('G', { isGroup: true, width: 0, height: 0 }),
        node('A', { parentId: 'G' }),
        node('B', { parentId: 'G' }),
        node('C'),
      ],
      [edge('A', 'B'), edge('B', 'C')]
    );

    runGridLikeLayoutCore(data);
    const nodes = byId(data);
    const group = nodes.get('G')!;

    for (const child of ['A', 'B']) {
      const c = nodes.get(child)!;
      expect(c.x! - c.width! / 2).toBeGreaterThanOrEqual(group.x! - group.width! / 2);
      expect(c.y! - c.height! / 2).toBeGreaterThanOrEqual(group.y! - group.height! / 2);
      expect(c.x! + c.width! / 2).toBeLessThanOrEqual(group.x! + group.width! / 2);
      expect(c.y! + c.height! / 2).toBeLessThanOrEqual(group.y! + group.height! / 2);
    }
  });

  it('handles an empty graph and a single node', () => {
    const empty = layoutData([], []);
    expect(() => runGridLikeLayoutCore(empty)).not.toThrow();
    expect(runGridLikeLayoutCore(empty).variableCount).toBe(0);

    const single = layoutData([node('A')], []);
    runGridLikeLayoutCore(single);
    expect(Number.isFinite(single.nodes[0].x)).toBe(true);
    expect(Number.isFinite(single.nodes[0].y)).toBe(true);
  });
});
