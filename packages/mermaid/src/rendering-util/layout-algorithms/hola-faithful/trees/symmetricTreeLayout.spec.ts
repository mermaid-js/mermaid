import { describe, expect, it } from 'vitest';
import { addEdge, addNode, createGraph } from '../model.js';
import type { HolaGraph } from '../model.js';
import { layoutTree, transformTreeLayout, treePerimeter } from './symmetricTreeLayout.js';

const options = { rankGap: 60, siblingGap: 40 };

function buildTree(edges: [string, string][], size = { width: 60, height: 40 }): HolaGraph {
  const graph = createGraph();
  const ids = new Set(edges.flat());
  let order = 0;
  for (const id of ids) {
    addNode(graph, { id, x: 0, y: 0, inputOrder: order++, original: undefined, ...size });
  }
  for (const [a, b] of edges) {
    addEdge(graph, {
      id: `${a}${b}`,
      source: a,
      target: b,
      originalEdgeIds: [],
      route: [],
      mandatoryWaypoints: [],
    });
  }
  return graph;
}

describe('symmetric tree layout', () => {
  it('places a single node at the origin', () => {
    const graph = createGraph();
    addNode(graph, {
      id: 'a',
      x: 0,
      y: 0,
      width: 60,
      height: 40,
      inputOrder: 0,
      original: undefined,
    });
    const layout = layoutTree(graph, 'a', options);
    expect(layout.nodes.get('a')).toMatchObject({ x: 0, y: 0 });
    expect(layout.edges).toHaveLength(0);
  });

  it('grows south with one y per rank', () => {
    const graph = buildTree([
      ['r', 'a'],
      ['r', 'b'],
      ['a', 'c'],
      ['b', 'd'],
    ]);
    const layout = layoutTree(graph, 'r', options);

    expect(layout.nodes.get('a')!.y).toBeGreaterThan(layout.nodes.get('r')!.y);
    expect(layout.nodes.get('a')!.y).toBe(layout.nodes.get('b')!.y);
    expect(layout.nodes.get('c')!.y).toBe(layout.nodes.get('d')!.y);
    expect(layout.nodes.get('c')!.y).toBeGreaterThan(layout.nodes.get('a')!.y);
  });

  it('draws a symmetric rooted tree exactly mirror-symmetric', () => {
    // Two isomorphic subtrees under the root.
    const graph = buildTree([
      ['r', 'l'],
      ['r', 'q'],
      ['l', 'l1'],
      ['l', 'l2'],
      ['q', 'q1'],
      ['q', 'q2'],
    ]);
    const layout = layoutTree(graph, 'r', options);

    const root = layout.nodes.get('r')!;
    expect(root.x).toBeCloseTo(0, 9);
    expect(layout.nodes.get('l')!.x).toBeCloseTo(-layout.nodes.get('q')!.x, 9);
    // `q` is drawn as the reflection of `l`, so each of its children lands
    // opposite its counterpart.
    expect(layout.nodes.get('l1')!.x).toBeCloseTo(-layout.nodes.get('q1')!.x, 9);
    expect(layout.nodes.get('l2')!.x).toBeCloseTo(-layout.nodes.get('q2')!.x, 9);

    // …and the drawing as a whole is symmetric: every rank's x multiset is
    // invariant under reflection about the root axis.
    const byRank = new Map<number, number[]>();
    for (const node of layout.nodes.values()) {
      byRank.set(node.depth, [...(byRank.get(node.depth) ?? []), node.x]);
    }
    for (const xs of byRank.values()) {
      const forward = [...xs].sort((a, b) => a - b);
      const reflected = xs.map((x) => -x).sort((a, b) => a - b);
      forward.forEach((x, i) => expect(x).toBeCloseTo(reflected[i], 9));
    }
  });

  it('keeps a lone odd subtree on the axis', () => {
    const graph = buildTree([
      ['r', 'a'],
      ['r', 'b'],
      ['r', 'c'],
    ]);
    const layout = layoutTree(graph, 'r', options);
    const xs = ['a', 'b', 'c'].map((id) => layout.nodes.get(id)!.x).sort((p, q) => p - q);
    expect(xs[1]).toBeCloseTo(0, 9);
    expect(xs[0]).toBeCloseTo(-xs[2], 9);
  });

  it('separates siblings by at least the sibling gap', () => {
    const graph = buildTree([
      ['r', 'a'],
      ['r', 'b'],
    ]);
    const layout = layoutTree(graph, 'r', options);
    const a = layout.nodes.get('a')!;
    const b = layout.nodes.get('b')!;
    const gap = Math.abs(a.x - b.x) - (a.width + b.width) / 2;
    expect(gap).toBeGreaterThanOrEqual(options.siblingGap - 1e-9);
  });

  it('routes every parent-child edge orthogonally between rank-facing sides', () => {
    const graph = buildTree([
      ['r', 'a'],
      ['r', 'b'],
    ]);
    const layout = layoutTree(graph, 'r', options);

    expect(layout.edges).toHaveLength(2);
    for (const edge of layout.edges) {
      expect(edge.route.length).toBeGreaterThanOrEqual(2);
      for (let i = 1; i < edge.route.length; i++) {
        const dx = Math.abs(edge.route[i].x - edge.route[i - 1].x);
        const dy = Math.abs(edge.route[i].y - edge.route[i - 1].y);
        expect(dx < 1e-9 || dy < 1e-9).toBe(true);
      }
      const parent = layout.nodes.get(edge.source)!;
      const child = layout.nodes.get(edge.target)!;
      expect(edge.route[0].y).toBeCloseTo(parent.y + parent.height / 2, 9);
      expect(edge.route[edge.route.length - 1].y).toBeCloseTo(child.y - child.height / 2, 9);
    }
  });

  it('includes routed edge points in the bounding box', () => {
    const graph = buildTree([
      ['r', 'a'],
      ['r', 'b'],
    ]);
    const layout = layoutTree(graph, 'r', options);
    for (const edge of layout.edges) {
      for (const p of edge.route) {
        expect(p.x).toBeGreaterThanOrEqual(layout.bounds.minX - 1e-9);
        expect(p.x).toBeLessThanOrEqual(layout.bounds.maxX + 1e-9);
        expect(p.y).toBeGreaterThanOrEqual(layout.bounds.minY - 1e-9);
        expect(p.y).toBeLessThanOrEqual(layout.bounds.maxY + 1e-9);
      }
    }
  });

  it('is deterministic for the same input', () => {
    const graph = buildTree([
      ['r', 'a'],
      ['r', 'b'],
      ['a', 'c'],
    ]);
    const first = layoutTree(graph, 'r', options);
    const second = layoutTree(graph, 'r', options);
    for (const [id, node] of first.nodes) {
      expect(second.nodes.get(id)!.x).toBe(node.x);
      expect(second.nodes.get(id)!.y).toBe(node.y);
    }
  });
});

describe('transformTreeLayout', () => {
  const graph = buildTree([
    ['r', 'a'],
    ['r', 'b'],
  ]);

  it('rotates node centres and route points together', () => {
    const layout = layoutTree(graph, 'r', options);
    const rotated = transformTreeLayout(layout, 90, false, { x: 0, y: 0 });

    for (const [id, node] of layout.nodes) {
      const after = rotated.nodes.get(id)!;
      expect(after.x).toBeCloseTo(node.y, 9);
      expect(after.y).toBeCloseTo(-node.x, 9);
    }
    for (let i = 0; i < layout.edges.length; i++) {
      const before = layout.edges[i].route;
      const after = rotated.edges[i].route;
      expect(after).toHaveLength(before.length);
      for (const [j, element] of before.entries()) {
        expect(after[j].x).toBeCloseTo(element.y, 9);
        expect(after[j].y).toBeCloseTo(-element.x, 9);
      }
    }
  });

  it('never swaps node width and height', () => {
    const layout = layoutTree(graph, 'r', options);
    const rotated = transformTreeLayout(layout, 90, false, { x: 0, y: 0 });
    for (const [id, node] of layout.nodes) {
      expect(rotated.nodes.get(id)!.width).toBe(node.width);
      expect(rotated.nodes.get(id)!.height).toBe(node.height);
    }
  });

  it('flips horizontally about the root axis', () => {
    const layout = layoutTree(graph, 'r', options);
    const flipped = transformTreeLayout(layout, 0, true, { x: 0, y: 0 });
    for (const [id, node] of layout.nodes) {
      expect(flipped.nodes.get(id)!.x).toBeCloseTo(-node.x, 9);
      expect(flipped.nodes.get(id)!.y).toBeCloseTo(node.y, 9);
    }
  });

  it('reports a perimeter that grows with the tree', () => {
    const small = layoutTree(buildTree([['r', 'a']]), 'r', options);
    const large = layoutTree(
      buildTree([
        ['r', 'a'],
        ['r', 'b'],
        ['r', 'c'],
        ['r', 'd'],
      ]),
      'r',
      options
    );
    expect(treePerimeter(large)).toBeGreaterThan(treePerimeter(small));
  });
});
