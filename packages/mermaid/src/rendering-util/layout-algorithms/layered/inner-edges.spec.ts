import { describe, expect, it } from 'vitest';
import { layered, MAX_MIN_LEN } from './index.js';
import type { Dir, LayoutGraph, LayoutModel } from './types.js';

const pad = { top: 20, right: 20, bottom: 20, left: 20 };
// From index.ts: the room between edge ends on a side, and what each corner of a side keeps clear.
const PORT_SEP = 20;
const CORNER = 12;
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

  it('starts the edge below the title instead of crossing it, with room for an arrowhead', () => {
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
          // Their ends on `In` are `PORT_SEP` apart, or as far as the side's usable half allows.
          const across = runsAcross(dir) ? 'y' : 'x';
          const at = (p: Point[]): number => (into ? p[p.length - 1]! : p[0]!)[across];
          const node = model.nodes.get('In')!;
          const half = (across === 'x' ? node.width : node.height) / 2;
          const usable = half - Math.min(CORNER, half / 2);
          expect(Math.abs(at(outside) - at(inner))).toBeGreaterThanOrEqual(
            Math.min(PORT_SEP, usable) - 1e-6
          );
        });
      }
    }

    // As in the issue's diagram: the group has a title and the nodes are wide.
    it(`does not draw Out --> In and Sub --> In on top of each other under a title (${routing})`, () => {
      const g = graph('TB', true, routing);
      g.nodes = g.nodes.map((n) => ({ ...n, width: 150, height: 45 }));
      g.groups[0]!.title = { width: 30, height: 18 };
      const model = layered(g);
      const outside = model.edges.get('outside')!.points;
      const inner = model.edges.get('inner')!.points;

      expect(longestShared(outside, inner)).toBeLessThan(1);
      // A wide node has room for the full gap.
      expect(
        Math.abs(outside[outside.length - 1]!.x - inner[inner.length - 1]!.x)
      ).toBeGreaterThanOrEqual(PORT_SEP - 1e-6);
    });

    // Moved aside from `Out --> In`, the edge no longer lies under the title, so it starts on the
    // border, as the edge from outside does.
    it(`starts Sub --> In on the border when it runs beside the title (${routing})`, () => {
      const title = { width: 30, height: 18 };
      const g = graph('TB', true, routing);
      g.nodes = g.nodes.map((n) => ({ ...n, width: 150, height: 45 }));
      g.groups[0]!.title = title;
      const model = layered(g);
      const [from, to] = model.edges.get('inner')!.points;
      const group = model.groups.get('Sub')!;
      const node = model.nodes.get('In')!;

      expect(Math.abs(from!.x - group.title!.x)).toBeGreaterThanOrEqual(title.width / 2);
      expect(from!.y).toBeCloseTo(group.y - group.height / 2);
      expect(to!.y).toBeCloseTo(node.y - node.height / 2);
    });
  }

  // The label of `Sub --> In` sits on its own edge, clear of `Out --> In` and inside the group.
  for (const routing of routings) {
    for (const dir of dirs) {
      for (const width of [26, 60]) {
        it(`keeps a ${width}px label of Sub --> In off Out --> In in ${dir} (${routing})`, () => {
          const g = graph(dir, true, routing);
          g.nodes = g.nodes.map((n) => ({ ...n, width: 150, height: 45 }));
          const size = { width, height: 25 };
          g.edges[1]!.label = size;
          const model = layered(g);
          const inner = model.edges.get('inner')!;
          const labelBox = { ...inner.label!, ...size };
          const across = runsAcross(dir) ? 'y' : 'x';
          const [from] = inner.points;

          expect(crossesBox(model.edges.get('outside')!.points, labelBox)).toBe(false);
          expect(within(labelBox, model.groups.get('Sub')!)).toBe(true);
          // The label still covers its own edge.
          const half = (across === 'x' ? size.width : size.height) / 2;
          expect(Math.abs(labelBox[across] - from![across])).toBeLessThan(half);
        });
      }
    }
  }
});

const runsAcross = (dir: Dir): boolean => dir === 'LR' || dir === 'RL';

// Whether a polyline of axis-aligned segments touches the inside of a box.
const crossesBox = (points: Point[], b: Box): boolean =>
  points.some((p, k) => {
    const q = points[k - 1];
    if (!q) return false;
    return (
      Math.max(p.x, q.x) > b.x - b.width / 2 + 1e-6 &&
      Math.min(p.x, q.x) < b.x + b.width / 2 - 1e-6 &&
      Math.max(p.y, q.y) > b.y - b.height / 2 + 1e-6 &&
      Math.min(p.y, q.y) < b.y + b.height / 2 - 1e-6
    );
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
