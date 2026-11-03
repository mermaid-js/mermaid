import { describe, expect, it } from 'vitest';
import type { MermaidConfig } from '../../../config.type.js';
import type { Edge, LayoutData, Node } from '../../types.js';
import intersect from '../../rendering-elements/intersect/index.js';
import { isAxisTaggedRoute } from '../../rendering-elements/routePath.js';
import { runLayeredLayoutCore, toLayoutGraph } from './layoutData.js';

const node = (id: string, width = 80, height = 40, shape = 'squareRect'): Node =>
  ({ id, width, height, shape, isGroup: false, label: id }) as Node;

const edge = (id: string, start: string, end: string, extra: Partial<Edge> = {}): Edge =>
  ({ id, start, end, type: 'arrow_point', arrowTypeEnd: 'arrow_point', ...extra }) as Edge;

const layoutData = (direction: string, nodes: Node[], edges: Edge[]): LayoutData =>
  ({
    nodes,
    edges,
    config: {} as MermaidConfig,
    direction,
    nodeSpacing: 50,
    rankSpacing: 50,
    layoutAlgorithm: 'layered',
  }) as LayoutData;

const chain = (direction: string): LayoutData =>
  layoutData(
    direction,
    [node('A'), node('B', 120, 60), node('C')],
    [edge('e1', 'A', 'B', { label: 'yes', width: 30, height: 18 }), edge('e2', 'B', 'C')]
  );

describe('layered adapter: LayoutData → LayoutGraph', () => {
  it('translates measured nodes, edges, labels, spacing and direction', () => {
    const graph = toLayoutGraph(chain('LR'));
    expect(graph.direction).toBe('LR');
    expect(graph.spacing).toEqual({ node: 50, rank: 50, edge: 20 });
    expect(graph.nodes.map(({ id, width, height }) => ({ id, width, height }))).toEqual([
      { id: 'A', width: 80, height: 40 },
      { id: 'B', width: 120, height: 60 },
      { id: 'C', width: 80, height: 40 },
    ]);
    expect(graph.edges).toEqual([
      // The label gets the same room around it as in v13.
      { id: 'e1', source: 'A', target: 'B', minLen: 1, label: { width: 42, height: 22 } },
      { id: 'e2', source: 'B', target: 'C', minLen: 1 },
    ]);
    expect(graph.groups).toEqual([]);
  });

  it('reads TD as TB and defaults to TB', () => {
    expect(toLayoutGraph(chain('TD')).direction).toBe('TB');
    expect(toLayoutGraph(chain(undefined as unknown as string)).direction).toBe('TB');
  });

  it('carries longer links as minLen and uses the diagram spacing', () => {
    const data = layoutData(
      'TB',
      [node('A'), node('B')],
      [edge('e1', 'A', 'B', { minlen: 3 } as Partial<Edge>)]
    );
    data.nodeSpacing = 30;
    data.rankSpacing = 70;
    const graph = toLayoutGraph(data);
    expect(graph.edges[0].minLen).toBe(3);
    expect(graph.spacing).toEqual({ node: 30, rank: 70, edge: 20 });
  });
});

describe('layered adapter: config reaching the engine', () => {
  const withConfig = (config: Partial<MermaidConfig>, data = chain('TB')): LayoutData => {
    data.config = config as MermaidConfig;
    return data;
  };

  it('routes edges curved unless layered.edgeRouting says otherwise', () => {
    expect(toLayoutGraph(chain('TB')).routing).toBe('curved');
    expect(toLayoutGraph(withConfig({ layered: { edgeRouting: 'stepped' } })).routing).toBe(
      'stepped'
    );
    expect(toLayoutGraph(withConfig({ layered: { edgeRouting: 'straight' } })).routing).toBe(
      'straight'
    );
    expect(
      toLayoutGraph(withConfig({ layered: { edgeRouting: 'wiggly' as 'curved' } })).routing
    ).toBe('curved');
  });

  it('takes spacing from the diagram config when the renderer sets none, with v12 defaults', () => {
    // As dagre does: the renderer's spacing first, then `flowchart` (where ER puts its own).
    const bare = (): LayoutData => {
      const data = chain('TB');
      delete data.nodeSpacing;
      delete data.rankSpacing;
      return data;
    };
    expect(toLayoutGraph(bare()).spacing).toEqual({ node: 50, rank: 50, edge: 20 });
    expect(
      toLayoutGraph(withConfig({ flowchart: { nodeSpacing: 140, rankSpacing: 80 } }, bare()))
        .spacing
    ).toEqual({ node: 140, rank: 80, edge: 20 });
    const set = withConfig({ flowchart: { nodeSpacing: 140, rankSpacing: 80 } });
    set.nodeSpacing = 30;
    set.rankSpacing = 70;
    expect(toLayoutGraph(set).spacing).toEqual({ node: 30, rank: 70, edge: 20 });
  });

  it('leaves the diagram padding to the viewport, so it is not added twice', () => {
    const graph = toLayoutGraph(withConfig({ flowchart: { diagramPadding: 30 } }));
    expect(graph.diagramPadding).toBe(0);
  });

  it('draws stepped routes as steps and straight routes as lines', () => {
    const drawn = (edgeRouting?: 'curved' | 'stepped' | 'straight', curve?: string) => {
      const data = withConfig(edgeRouting ? { layered: { edgeRouting } } : {});
      if (curve) {
        data.edges.forEach((e) => (e.curve = curve));
      }
      runLayeredLayoutCore(data);
      return data.edges.map((e) => e.curve);
    };
    expect(drawn()).toEqual([undefined, undefined]);
    expect(drawn('curved', 'linear')).toEqual(['linear', 'linear']);
    expect(drawn('stepped')).toEqual(['step', 'step']);
    // A step the user chose is kept.
    expect(drawn('stepped', 'stepAfter')).toEqual(['stepAfter', 'stepAfter']);
    expect(drawn('straight', 'basis')).toEqual(['linear', 'linear']);
  });
});

describe('layered adapter: LayoutGraph → LayoutData round trip', () => {
  // Along the flow, where each node of the chain A → B → C lies.
  const along: Record<string, (n: Node) => number> = {
    TB: (n) => n.y!,
    BT: (n) => -n.y!,
    LR: (n) => n.x!,
    RL: (n) => -n.x!,
  };
  // Which box side the edge leaves its source by and enters its target by.
  const exitSide: Record<string, 'top' | 'bottom' | 'left' | 'right'> = {
    TB: 'bottom',
    BT: 'top',
    LR: 'right',
    RL: 'left',
  };
  const sidePoint = (n: Node, side: string) => {
    switch (side) {
      case 'top':
        return { y: n.y! - n.height! / 2 };
      case 'bottom':
        return { y: n.y! + n.height! / 2 };
      case 'left':
        return { x: n.x! - n.width! / 2 };
      default:
        return { x: n.x! + n.width! / 2 };
    }
  };
  const opposite = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' } as const;

  for (const dir of ['TB', 'BT', 'LR', 'RL']) {
    it(`places nodes, routes and labels in ${dir}`, () => {
      const data = chain(dir);
      runLayeredLayoutCore(data);
      const [a, b, c] = data.nodes;
      for (const n of data.nodes) {
        expect(Number.isFinite(n.x)).toBe(true);
        expect(Number.isFinite(n.y)).toBe(true);
      }
      // Sizes are the measured ones, untouched.
      expect([b.width, b.height]).toEqual([120, 60]);
      expect(along[dir](a)).toBeLessThan(along[dir](b));
      expect(along[dir](b)).toBeLessThan(along[dir](c));

      for (const e of data.edges) {
        expect(isAxisTaggedRoute(e.points)).toBe(true);
        const src = data.nodes.find((n) => n.id === e.start)!;
        const dst = data.nodes.find((n) => n.id === e.end)!;
        const first = e.points!.at(0)!;
        const last = e.points!.at(-1)!;
        // Rectangles: the ends sit on the box sides facing along the flow.
        expect(first).toMatchObject(roughly(sidePoint(src, exitSide[dir])));
        expect(last).toMatchObject(roughly(sidePoint(dst, opposite[exitSide[dir]])));
      }

      // The label centre comes from the engine and lies between the two nodes.
      const labelled = data.edges[0];
      expect(Number.isFinite(labelled.x)).toBe(true);
      expect(Number.isFinite(labelled.y)).toBe(true);
      const mid = { x: labelled.x!, y: labelled.y! } as Node;
      expect(along[dir](mid)).toBeGreaterThan(along[dir](a));
      expect(along[dir](mid)).toBeLessThan(along[dir](b));
    });
  }
});

function roughly(p: { x?: number; y?: number }) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(p)) {
    out[k] = expect.closeTo(v, 3);
  }
  return out;
}

describe('layered adapter: route ends on the shape outline', () => {
  // The intersect functions mermaid's shapes install, without the DOM.
  const withIntersect = (n: Node, fn: (self: Node, p: { x: number; y: number }) => object) => {
    n.intersect = (p: { x: number; y: number }) => fn(n, p) as { x: number; y: number };
    return n;
  };
  const diamond = (id: string, s = 80) =>
    withIntersect(node(id, s, s, 'diamond'), (self, p) =>
      intersect.polygon(
        self,
        [
          { x: s / 2, y: 0 },
          { x: s, y: -s / 2 },
          { x: s / 2, y: -s },
          { x: 0, y: -s / 2 },
        ],
        p
      )
    );
  const circle = (id: string, d = 60) =>
    withIntersect(node(id, d, d, 'circle'), (self, p) => intersect.circle(self, d / 2, p));
  const stadium = (id: string, w = 120, h = 40) =>
    withIntersect(node(id, w, h, 'stadium'), (self, p) => {
      // A pill: straight top and bottom, half-circle caps.
      const r = h / 2;
      const pts = [];
      for (let i = 0; i <= 12; i++) {
        const t = -Math.PI / 2 + (Math.PI * i) / 12;
        pts.push({ x: w - r + r * Math.cos(t), y: -(r + r * Math.sin(t)) });
      }
      for (let i = 0; i <= 12; i++) {
        const t = Math.PI / 2 + (Math.PI * i) / 12;
        pts.push({ x: r + r * Math.cos(t), y: -(r + r * Math.sin(t)) });
      }
      return intersect.polygon(self, pts, p);
    });

  const onOutline = (n: Node, p: { x: number; y: number }) => {
    const out = n.intersect!(p);
    return Math.hypot(out.x - p.x, out.y - p.y);
  };

  for (const dir of ['TB', 'LR']) {
    it(`moves ends onto diamond, circle and stadium outlines, keeping the side (${dir})`, () => {
      // One hub fanning out to three, so ends spread along the hub's side, off its centre.
      const hub = diamond('H', 100);
      const targets = [diamond('D'), circle('C'), stadium('S')];
      const data = layoutData(
        dir,
        [hub, ...targets],
        targets.map((t, i) => edge(`e${i}`, 'H', t.id))
      );
      // The same graph with plain boxes: where the engine put the ends on the bounding boxes.
      const boxes = layoutData(
        dir,
        data.nodes.map((n) => node(n.id, n.width, n.height, n.shape)),
        data.edges.map((e) => ({ ...e }))
      );
      runLayeredLayoutCore(boxes);
      runLayeredLayoutCore(data);
      for (const [i, e] of data.edges.entries()) {
        const box = boxes.edges[i].points!;
        const src = data.nodes.find((n) => n.id === e.start)!;
        const dst = data.nodes.find((n) => n.id === e.end)!;
        const pts = e.points!;
        const first = pts[0];
        const last = pts.at(-1)!;
        // Every inner point is the engine's.
        expect(pts.slice(1, -1)).toEqual(box.slice(1, -1));
        // On the outline, not on the bounding box.
        expect(onOutline(src, first)).toBeLessThan(0.5);
        expect(onOutline(dst, last)).toBeLessThan(0.5);
        // On the side the engine chose: below / right of the source, above / left of the target.
        if (dir === 'TB') {
          expect(first.y).toBeGreaterThan(src.y!);
          expect(last.y).toBeLessThan(dst.y!);
          // Only moved along the flow, so the port and the square departure are kept.
          expect(first.x).toBeCloseTo(box[0].x, 3);
          expect(last.x).toBeCloseTo(box.at(-1)!.x, 3);
        } else {
          expect(first.x).toBeGreaterThan(src.x!);
          expect(last.x).toBeLessThan(dst.x!);
          expect(first.y).toBeCloseTo(box[0].y, 3);
          expect(last.y).toBeCloseTo(box.at(-1)!.y, 3);
        }
        expect(isAxisTaggedRoute(pts)).toBe(true);
      }
    });
  }
});

const group = (id: string, extra: Partial<Node> = {}): Node =>
  ({
    id,
    label: id,
    shape: 'rect',
    isGroup: true,
    padding: 8,
    labelBBox: { width: 50, height: 20 },
    ...extra,
  }) as Node;

const child = (id: string, parentId: string, width = 80, height = 40): Node =>
  ({ ...node(id, width, height), parentId }) as Node;

describe('layered adapter: subgraphs', () => {
  it('translates clusters to engine groups with parents, directions and titles', () => {
    const data = layoutData(
      'TB',
      [
        group('outer'),
        group('inner', { parentId: 'outer', dir: 'LR', labelBBox: { width: 0, height: 0 } }),
        child('a', 'inner'),
        child('b', 'outer'),
        node('c'),
      ],
      [edge('e1', 'a', 'b'), edge('e2', 'c', 'outer')]
    );
    const graph = toLayoutGraph(data);
    expect(graph.nodes.map((n) => [n.id, n.parent])).toEqual([
      ['a', 'inner'],
      ['b', 'outer'],
      ['c', undefined],
    ]);
    const [outer, inner] = graph.groups;
    expect(outer).toMatchObject({ id: 'outer', title: { width: 50, height: 20 } });
    expect(outer.parent).toBeUndefined();
    expect(outer.direction).toBeUndefined();
    expect(inner).toMatchObject({ id: 'inner', parent: 'outer', direction: 'LR' });
    // An untitled group has no title band.
    expect(inner.title).toBeUndefined();
    // Room on every side of each group's content.
    for (const g of graph.groups) {
      for (const side of ['top', 'right', 'bottom', 'left'] as const) {
        expect(g.padding[side]).toBeGreaterThan(0);
      }
    }
    // Edges may end on a group.
    expect(graph.edges.map((e) => [e.source, e.target])).toEqual([
      ['a', 'b'],
      ['c', 'outer'],
    ]);
  });

  const byId = (data: LayoutData, id: string) => data.nodes.find((n) => n.id === id)!;
  const bounds = (n: Node) => ({
    left: n.x! - n.width! / 2,
    right: n.x! + n.width! / 2,
    top: n.y! - n.height! / 2,
    bottom: n.y! + n.height! / 2,
  });
  const contains = (outer: Node, inner: Node) => {
    const o = bounds(outer);
    const i = bounds(inner);
    return o.left < i.left && o.right > i.right && o.top < i.top && o.bottom > i.bottom;
  };

  it('writes nested cluster geometry back, each cluster holding its content', () => {
    const data = layoutData(
      'TB',
      [
        group('outer'),
        group('inner', { parentId: 'outer' }),
        child('a', 'inner'),
        child('b', 'inner'),
        child('c', 'outer'),
        node('d'),
      ],
      [edge('e1', 'a', 'b'), edge('e2', 'b', 'c'), edge('e3', 'c', 'd')]
    );
    runLayeredLayoutCore(data);
    const outer = byId(data, 'outer');
    const inner = byId(data, 'inner');
    for (const g of [outer, inner]) {
      for (const v of [g.x, g.y, g.width, g.height]) {
        expect(Number.isFinite(v)).toBe(true);
      }
    }
    expect(contains(outer, inner)).toBe(true);
    expect(contains(inner, byId(data, 'a'))).toBe(true);
    expect(contains(inner, byId(data, 'b'))).toBe(true);
    expect(contains(outer, byId(data, 'c'))).toBe(true);
    expect(contains(inner, byId(data, 'c'))).toBe(false);
    expect(contains(outer, byId(data, 'd'))).toBe(false);
    // The title band sits above the content: the title fits between the top border and `a`.
    expect(bounds(byId(data, 'a')).top - bounds(inner).top).toBeGreaterThan(20);
    // Clusters are at least as wide as their titles.
    expect(inner.width).toBeGreaterThanOrEqual(50);
  });

  it('routes an edge to a subgraph onto its border, and one from it off its border', () => {
    const data = layoutData(
      'TB',
      [node('top'), group('g'), child('a', 'g'), child('b', 'g'), node('bottom')],
      [edge('in', 'top', 'g'), edge('e1', 'a', 'b'), edge('out', 'g', 'bottom')]
    );
    runLayeredLayoutCore(data);
    const g = bounds(byId(data, 'g'));
    const into = data.edges.find((e) => e.id === 'in')!.points!;
    const outOf = data.edges.find((e) => e.id === 'out')!.points!;
    expect(isAxisTaggedRoute(into)).toBe(true);
    expect(isAxisTaggedRoute(outOf)).toBe(true);
    // Into the top border, out of the bottom one.
    expect(into.at(-1)!.y).toBeCloseTo(g.top, 3);
    expect(outOf[0].y).toBeCloseTo(g.bottom, 3);
    expect(bounds(byId(data, 'top')).bottom).toBeLessThan(g.top);
    expect(bounds(byId(data, 'bottom')).top).toBeGreaterThan(g.bottom);
  });

  it("lays a subgraph out in its own direction, or its parent's when an edge crosses it", () => {
    const sub = (crossed: boolean) =>
      layoutData(
        'TB',
        [node('x'), group('g', { dir: 'LR' }), child('a', 'g'), child('b', 'g')],
        [edge('e1', 'a', 'b'), crossed ? edge('e2', 'x', 'a') : edge('e2', 'x', 'g')]
      );
    const own = sub(false);
    runLayeredLayoutCore(own);
    expect(byId(own, 'a').y).toBeCloseTo(byId(own, 'b').y!, 3);
    expect(byId(own, 'b').x).toBeGreaterThan(byId(own, 'a').x!);

    const crossed = sub(true);
    runLayeredLayoutCore(crossed);
    expect(byId(crossed, 'a').x).toBeCloseTo(byId(crossed, 'b').x!, 3);
    expect(byId(crossed, 'b').y).toBeGreaterThan(byId(crossed, 'a').y!);
  });

  it('routes a self-loop inside its subgraph, beside the node', () => {
    const data = layoutData(
      'TB',
      [group('g'), child('a', 'g')],
      [edge('loop', 'a', 'a', { label: 'again', width: 40, height: 18 })]
    );
    runLayeredLayoutCore(data);
    const a = byId(data, 'a');
    const loop = data.edges[0];
    expect(isAxisTaggedRoute(loop.points)).toBe(true);
    expect(loop.points!.length).toBeGreaterThan(2);
    // The node keeps its measured size; the loop goes out beside it and stays in the cluster.
    expect([a.width, a.height]).toEqual([80, 40]);
    const reach = Math.max(...loop.points!.map((p) => Math.abs(p.x - a.x!)));
    expect(reach).toBeGreaterThan(a.width! / 2);
    const g = bounds(byId(data, 'g'));
    for (const p of loop.points!) {
      expect(p.x).toBeGreaterThan(g.left);
      expect(p.x).toBeLessThan(g.right);
    }
    expect(loop.x! - a.x!).toBeGreaterThan(a.width! / 2);
    expect(loop.x! + 20).toBeLessThan(g.right);
  });

  it('gives a longer link (minLen) more ranks inside a subgraph', () => {
    const run = (minlen: number) => {
      const data = layoutData(
        'TB',
        [group('g'), child('a', 'g'), child('b', 'g')],
        [edge('e1', 'a', 'b', { minlen } as Partial<Edge>)]
      );
      runLayeredLayoutCore(data);
      return byId(data, 'b').y! - byId(data, 'a').y!;
    };
    expect(run(3)).toBeGreaterThan(run(1) * 2);
  });
});
