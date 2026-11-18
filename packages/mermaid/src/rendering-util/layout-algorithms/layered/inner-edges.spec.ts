import { describe, expect, it } from 'vitest';
import { layered, MAX_MIN_LEN } from './index.js';
import type { Dir, LayoutGraph, LayoutModel } from './types.js';

const pad = { top: 20, right: 20, bottom: 20, left: 20 };
const label = { width: 26, height: 25 };

// A group `A` that holds `x`, and one edge between the two.
const graphOf = (
  direction: Dir,
  source: string,
  target: string,
  labelled: boolean,
  title?: { width: number; height: number }
): LayoutGraph => ({
  direction,
  nodes: [{ id: 'x', width: 40, height: 40, parent: 'A' }],
  groups: [{ id: 'A', padding: pad, ...(title ? { title } : {}) }],
  edges: [{ id: 'e', source, target, minLen: 1, ...(labelled ? { label } : {}) }],
  spacing: { node: 50, rank: 50, edge: 20 },
  diagramPadding: 0,
  routing: 'stepped',
  headRoom: 7,
});

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}
const overlap = (a: Box, b: Box): boolean =>
  Math.abs(a.x - b.x) < (a.width + b.width) / 2 - 1e-6 &&
  Math.abs(a.y - b.y) < (a.height + b.height) / 2 - 1e-6;
const within = (inner: Box, outer: Box): boolean =>
  Math.abs(inner.x - outer.x) <= (outer.width - inner.width) / 2 + 1e-6 &&
  Math.abs(inner.y - outer.y) <= (outer.height - inner.height) / 2 + 1e-6;

const parts = (model: LayoutModel) => {
  const edge = model.edges.get('e')!;
  const [from, to] = edge.points;
  return {
    edge,
    from: from!,
    to: to!,
    length: Math.hypot(to!.x - from!.x, to!.y - from!.y),
    node: model.nodes.get('x')!,
    group: model.groups.get('A')!,
    labelBox: edge.label ? { ...edge.label, ...label } : undefined,
  };
};

describe('layered: an edge between a group and a node inside it', () => {
  const dirs: Dir[] = ['TB', 'BT', 'LR', 'RL'];
  const ways = [
    ['A', 'x'],
    ['x', 'A'],
  ] as const;

  for (const dir of dirs) {
    for (const [source, target] of ways) {
      it(`keeps the label of ${source} --> ${target} clear of the node in ${dir}`, () => {
        const { labelBox, node, group, length } = parts(
          layered(graphOf(dir, source, target, true))
        );

        expect(labelBox).toBeDefined();
        expect(overlap(labelBox!, node)).toBe(false);
        expect(within(labelBox!, group)).toBe(true);
        // The edge is long enough to show the label and an arrowhead.
        expect(length).toBeGreaterThanOrEqual((dir === 'TB' || dir === 'BT' ? 25 : 26) + 7);
      });

      it(`draws ${source} --> ${target} between the border and the node in ${dir}`, () => {
        const { from, to, node, group, length, edge } = parts(
          layered(graphOf(dir, source, target, false))
        );
        const down = dir === 'TB' || dir === 'BT';

        expect(length).toBeCloseTo(20);
        expect(edge.label).toBeUndefined();
        // Along the flow, in line with the node.
        expect(down ? from.x : from.y).toBeCloseTo(down ? node.x : node.y);
        expect(down ? to.x : to.y).toBeCloseTo(down ? node.x : node.y);
        expect(from.axis).toBe(down ? 'v' : 'h');
        // One end on the group's border, the other on the node's side.
        const border = source === 'A' ? from : to;
        const face = source === 'A' ? to : from;
        const half = (b: Box): number => (down ? b.height : b.width) / 2;
        const along = (p: { x: number; y: number }): number => (down ? p.y : p.x);
        expect(Math.abs(along(border) - along(group))).toBeCloseTo(half(group));
        expect(Math.abs(along(face) - along(node))).toBeCloseTo(half(node));
      });
    }
  }

  it('points the edge with the flow: in from the start border, out to the end border', () => {
    const into = parts(layered(graphOf('TB', 'A', 'x', false)));
    const out = parts(layered(graphOf('TB', 'x', 'A', false)));

    expect(into.from.y).toBeLessThan(into.to.y);
    expect(into.edge.ports).toEqual({ source: 'top', target: 'top' });
    expect(out.from.y).toBeLessThan(out.to.y);
    expect(out.edge.ports).toEqual({ source: 'bottom', target: 'bottom' });
  });

  it('puts the label below the title, not on it', () => {
    const title = { width: 60, height: 18 };
    const { labelBox, group } = parts(layered(graphOf('TB', 'A', 'x', true, title)));
    const titleBox = { ...group.title!, ...title };

    expect(overlap(labelBox!, titleBox)).toBe(false);
  });

  it('starts the edge below a title wider than the node, with room for an arrowhead', () => {
    // No place on the node's 40px side is beside a 60px title, so the edge cannot start on the
    // border without crossing the title.
    const title = { width: 60, height: 18 };
    for (const labelled of [true, false]) {
      const { from, to, group, node } = parts(layered(graphOf('TB', 'A', 'x', labelled, title)));
      const titleBottom = group.title!.y + title.height / 2;

      expect(from.y).toBeCloseTo(titleBottom);
      expect(to.y).toBeCloseTo(node.y - node.height / 2);
      expect(to.y - from.y).toBeGreaterThanOrEqual(7);
    }
  });

  it('runs to the border on the side that has no title', () => {
    const title = { width: 60, height: 18 };
    const { to, group } = parts(layered(graphOf('TB', 'x', 'A', false, title)));

    expect(to.y).toBeCloseTo(group.y + group.height / 2);
  });

  it('leaves a group without such an edge at its own size', () => {
    const plain = layered({ ...graphOf('TB', 'A', 'x', false), edges: [] });
    const unlabelled = layered(graphOf('TB', 'A', 'x', false));

    expect(unlabelled.groups.get('A')).toEqual(plain.groups.get('A'));
  });

  it('reaches a node in a nested group from the outer group', () => {
    const graph = graphOf('TB', 'A', 'x', true);
    graph.nodes[0]!.parent = 'B';
    graph.groups.push({ id: 'B', parent: 'A', padding: pad });
    const model = layered(graph);
    const { labelBox, node, from, to } = parts(model);
    const outer = model.groups.get('A')!;

    expect(from.y).toBeCloseTo(outer.y - outer.height / 2);
    expect(to.y).toBeCloseTo(node.y - node.height / 2);
    expect(overlap(labelBox!, model.groups.get('B')!)).toBe(false);
  });
});

interface Point {
  x: number;
  y: number;
}

// Length of the stretch two segments share when they lie on one line, else 0.
const sharedLength = (a1: Point, a2: Point, b1: Point, b2: Point): number => {
  const dx = a2.x - a1.x;
  const dy = a2.y - a1.y;
  const len = Math.hypot(dx, dy);
  if (len < 1e-6) return 0;
  const ux = dx / len;
  const uy = dy / len;
  const offLine = (p: Point): number => Math.abs((p.x - a1.x) * uy - (p.y - a1.y) * ux);
  if (offLine(b1) > 0.5 || offLine(b2) > 0.5) return 0;
  const along = (p: Point): number => (p.x - a1.x) * ux + (p.y - a1.y) * uy;
  const [lo, hi] = [along(b1), along(b2)].sort((p, q) => p - q);
  return Math.max(0, Math.min(len, hi!) - Math.max(0, lo!));
};

const longestShared = (p: Point[], q: Point[]): number => {
  let worst = 0;
  for (let i = 0; i + 1 < p.length; i++) {
    for (let j = 0; j + 1 < q.length; j++) {
      worst = Math.max(worst, sharedLength(p[i]!, p[i + 1]!, q[j]!, q[j + 1]!));
    }
  }
  return worst;
};

// Issue #8824: `Out --> In` and `Sub --> In`, where `Sub` holds `In`.
describe('layered: an edge between a group and its member beside an edge from outside', () => {
  const graph = (direction: Dir, into: boolean, routing: LayoutGraph['routing']): LayoutGraph => ({
    direction,
    nodes: [
      { id: 'Out', width: 60, height: 54 },
      { id: 'In', width: 60, height: 54, parent: 'Sub' },
    ],
    groups: [{ id: 'Sub', padding: pad }],
    edges: into
      ? [
          { id: 'outside', source: 'Out', target: 'In', minLen: 1 },
          { id: 'inner', source: 'Sub', target: 'In', minLen: 1 },
        ]
      : [
          { id: 'outside', source: 'In', target: 'Out', minLen: 1 },
          { id: 'inner', source: 'In', target: 'Sub', minLen: 1 },
        ],
    spacing: { node: 50, rank: 50, edge: 20 },
    diagramPadding: 0,
    routing,
    headRoom: 7,
  });

  const dirs: Dir[] = ['TB', 'BT', 'LR', 'RL'];
  const routings: LayoutGraph['routing'][] = ['stepped', 'curved', 'straight'];
  for (const routing of routings) {
    for (const dir of dirs) {
      for (const into of [true, false]) {
        const name = into ? 'Out --> In and Sub --> In' : 'In --> Out and In --> Sub';
        it(`does not draw ${name} on top of each other in ${dir} (${routing})`, () => {
          const model = layered(graph(dir, into, routing));
          const outside = model.edges.get('outside')!.points;
          const inner = model.edges.get('inner')!.points;

          expect(longestShared(outside, inner)).toBeLessThan(1);
        });
      }
    }
  }
});

// Issue #8824: a group's title sits in the middle of its top border. Edges that cross that border
// do so beside the title, and an edge from the group to a member starts on the border, as ELK
// draws it.
describe('layered: edges at the border that holds a group title', () => {
  const title = { width: 30, height: 18 };
  const wide = { width: 150, height: 45 };

  // Whether a polyline passes through a box, checked every half pixel along it.
  const passesThrough = (points: Point[], b: Box): boolean => {
    for (let i = 0; i + 1 < points.length; i++) {
      const p = points[i]!;
      const q = points[i + 1]!;
      const steps = Math.max(1, Math.ceil(Math.hypot(q.x - p.x, q.y - p.y) * 2));
      for (let s = 0; s <= steps; s++) {
        const x = p.x + ((q.x - p.x) * s) / steps;
        const y = p.y + ((q.y - p.y) * s) / steps;
        if (Math.abs(x - b.x) < b.width / 2 && Math.abs(y - b.y) < b.height / 2) return true;
      }
    }
    return false;
  };
  const titleBox = (model: LayoutModel, id = 'Sub'): Box => ({
    ...model.groups.get(id)!.title!,
    ...title,
  });

  const graph = (
    direction: Dir,
    edges: (readonly [string, string])[],
    routing: LayoutGraph['routing'],
    size: { width: number; height: number } = wide,
    inside = ['In']
  ): LayoutGraph => ({
    direction,
    nodes: [
      { id: 'Out', ...size },
      { id: 'Out2', ...size },
      ...inside.map((id) => ({ id, ...size, parent: 'Sub' })),
    ],
    groups: [{ id: 'Sub', padding: pad, title }],
    edges: edges.map(([source, target], i) => ({ id: `e${i}`, source, target, minLen: 1 })),
    spacing: { node: 50, rank: 50, edge: 20 },
    diagramPadding: 0,
    routing,
    headRoom: 7,
  });
  const routings: LayoutGraph['routing'][] = ['stepped', 'curved', 'straight'];

  for (const routing of routings) {
    // TB: the edge comes in through the top border; BT: it goes out through it.
    for (const [dir, edges] of [
      ['TB', [['Out', 'In']]],
      ['BT', [['In', 'Out']]],
    ] as const) {
      it(`runs ${edges[0][0]} --> ${edges[0][1]} beside the title in ${dir} (${routing})`, () => {
        const model = layered(graph(dir, [...edges], routing));

        expect(passesThrough(model.edges.get('e0')!.points, titleBox(model))).toBe(false);
      });

      it(`runs ${edges[0][0]} --> ${edges[0][1]} beside a title wider than the node in ${dir} (${routing})`, () => {
        const model = layered(graph(dir, [...edges], routing, { width: 40, height: 40 }));

        expect(passesThrough(model.edges.get('e0')!.points, titleBox(model))).toBe(false);
      });
    }

    it(`splits the ports under the title to either side of it, apart (${routing})`, () => {
      const model = layered(
        graph(
          'TB',
          [
            ['Out', 'In'],
            ['Out2', 'In'],
          ],
          routing
        )
      );
      const routes = [...model.edges.values()].map((e) => e.points);

      for (const points of routes) expect(passesThrough(points, titleBox(model))).toBe(false);
      for (let i = 0; i < routes.length; i++) {
        for (let j = i + 1; j < routes.length; j++) {
          expect(longestShared(routes[i]!, routes[j]!)).toBeLessThan(1);
        }
      }
    });

    it(`draws Out --> In and Sub --> In from the border, beside the title and apart (${routing})`, () => {
      const model = layered(
        graph(
          'TB',
          [
            ['Out', 'In'],
            ['Sub', 'In'],
          ],
          routing
        )
      );
      const outside = model.edges.get('e0')!.points;
      const inner = model.edges.get('e1')!.points;
      const group = model.groups.get('Sub')!;
      const node = model.nodes.get('In')!;

      expect(inner[0]!.y).toBeCloseTo(group.y - group.height / 2);
      expect(inner.at(-1)!.y).toBeCloseTo(node.y - node.height / 2);
      expect(passesThrough(inner, titleBox(model))).toBe(false);
      expect(passesThrough(outside, titleBox(model))).toBe(false);
      expect(longestShared(outside, inner)).toBeLessThan(1);
    });
  }
});

describe('layered: the ranks one edge may ask for', () => {
  const chain = (minLen: number): LayoutGraph => ({
    direction: 'TB',
    nodes: [
      { id: 'a', width: 40, height: 40 },
      { id: 'b', width: 40, height: 40 },
    ],
    groups: [],
    edges: [{ id: 'ab', source: 'a', target: 'b', minLen }],
    spacing: { node: 50, rank: 50, edge: 20 },
  });

  it(`stops at ${MAX_MIN_LEN}, so a huge value cannot hang the layout`, () => {
    expect(layered(chain(1e9))).toEqual(layered(chain(MAX_MIN_LEN)));
  });

  it('leaves a value under the limit alone', () => {
    expect(layered(chain(3)).height).toBeGreaterThan(layered(chain(2)).height);
  });
});
