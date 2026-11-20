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
