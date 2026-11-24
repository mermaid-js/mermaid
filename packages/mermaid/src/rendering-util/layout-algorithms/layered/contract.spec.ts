// Pins the input checks, the width budget, self-loops, group sizing and the layout-data adapter of
// the layered layout. Expected numbers are worked out in the comments, not copied from the output.
import { describe, expect, it } from 'vitest';
import type { MermaidConfig } from '../../../config.type.js';
import type { Edge, LayoutData, Node } from '../../types.js';
import {
  clipRouteEnds,
  applyLayoutModel,
  runLayeredLayoutCore,
  toLayoutGraph,
} from './layoutData.js';
import { TURN_BREAKPOINT, layered } from './index.js';
import type { Dir, LayoutEdge, LayoutGraph, LayoutNode, LayoutGroup } from './types.js';

const box = (id: string, width = 80, height = 40, parent?: string): LayoutNode => ({
  id,
  width,
  height,
  ...(parent ? { parent } : {}),
});
const link = (
  id: string,
  source: string,
  target: string,
  label?: { width: number; height: number }
): LayoutEdge => ({ id, source, target, minLen: 1, ...(label ? { label } : {}) });
const SPACING = { node: 50, rank: 50, edge: 20 };
const graphOf = (
  direction: Dir,
  nodes: LayoutNode[],
  edges: LayoutEdge[],
  extra: Partial<LayoutGraph> = {}
): LayoutGraph => ({
  direction,
  nodes,
  edges,
  groups: [],
  spacing: SPACING,
  diagramPadding: 0,
  headRoom: 7,
  ...extra,
});

describe('layered: the width budget (availableWidth)', () => {
  // Root over four children: 4 * 80 + 3 * 50 = 470 wide when laid out with room to spare.
  const fan = (extra: Partial<LayoutGraph> = {}): LayoutGraph =>
    graphOf(
      'TB',
      [box('r'), box('a'), box('b'), box('c'), box('d')],
      ['a', 'b', 'c', 'd'].map((t) => link(`r${t}`, 'r', t)),
      extra
    );
  const LOOSE_WIDTH = 470;

  it('lays out with room to spare when the drawing fits the budget exactly', () => {
    expect(layered(fan()).width).toBe(LOOSE_WIDTH);
    expect(layered(fan({ availableWidth: LOOSE_WIDTH }))).toEqual(layered(fan()));
  });

  it('lays out tighter when the drawing is one unit over the budget: nodes at half, ranks at three quarters', () => {
    const tight = layered(fan({ availableWidth: LOOSE_WIDTH - 1 }));

    // 4 * 80 + 3 * 25 = 395.
    expect(tight.width).toBe(395);
    expect(tight).toEqual(layered(fan({ spacing: { node: 25, rank: 37.5, edge: 20 } })));
  });

  it.each([
    ['no budget', undefined],
    ['a budget of zero', 0],
    ['a negative budget', -5],
  ])('ignores %s', (_name, availableWidth) => {
    expect(layered(fan({ availableWidth }))).toEqual(layered(fan()));
  });

  it('keeps the loose layout when the tight one is not narrower', () => {
    // One column: tight spacing shortens the ranks but not the width, so the roomy layout stays.
    const column = graphOf('TB', [box('a'), box('b')], [link('ab', 'a', 'b')]);

    const model = layered({ ...column, availableWidth: 10 });

    expect(model.height).toBe(130);
    expect(model).toEqual(layered(column));
  });

  it('scales group padding by 0.6 in a tight layout, and the title keeps its size', () => {
    const groups: LayoutGroup[] = [
      {
        id: 'g',
        padding: { top: 30, right: 10, bottom: 12, left: 14 },
        title: { width: 200, height: 20 },
      },
    ];
    const grouped = (extra: Partial<LayoutGraph> = {}): LayoutGraph =>
      graphOf('TB', [box('a', 80, 40, 'g'), box('b', 80, 40, 'g')], [link('ab', 'a', 'b')], {
        groups,
        ...extra,
      });

    const loose = layered(grouped()).groups.get('g')!;
    const tight = layered(grouped({ availableWidth: 50 })).groups.get('g')!;

    // Width: title 200 + 2 * the larger side padding (14, or 14 * 0.6 = 8.4).
    expect(loose.width).toBe(228);
    expect(tight.width).toBeCloseTo(216.8, 9);
    // Height: two nodes of 40 + one rank (50, or 37.5) + top 30 + title 20 + bottom 12 (x 0.6).
    expect(loose.height).toBe(192);
    expect(tight.height).toBeCloseTo(80 + 37.5 + 30 * 0.6 + 20 + 12 * 0.6, 9);
    // The title sits half of `padding.top` below the box top, plus half its own height.
    expect(loose.title.y).toBe(loose.y - loose.height / 2 + 30 / 2 + 20 / 2);
    expect(tight.title.y).toBeCloseTo(tight.y - tight.height / 2 + (30 * 0.6) / 2 + 20 / 2, 9);
  });

  describe('turning a drawing that runs across', () => {
    const chain = (direction: Dir, extra: Partial<LayoutGraph> = {}): LayoutGraph =>
      graphOf(
        direction,
        ['a', 'b', 'c', 'd', 'e', 'f'].map((id) => box(id)),
        [
          link('ab', 'a', 'b'),
          link('bc', 'b', 'c'),
          link('cd', 'c', 'd'),
          link('de', 'd', 'e'),
          link('ef', 'e', 'f'),
        ],
        extra
      );

    it('has the turn breakpoint at 640', () => {
      expect(TURN_BREAKPOINT).toBe(640);
    });

    it.each(['LR', 'RL'] as const)(
      'turns %s to TB when the budget is under the breakpoint and TB is narrower',
      (dir) => {
        const model = layered(chain(dir, { availableWidth: TURN_BREAKPOINT - 1 }));

        expect(model.direction).toBe('TB');
        expect(model.width).toBe(80);
      }
    );

    it('does not turn at the breakpoint itself', () => {
      // Six nodes in a row: 6 * 80 + 5 * 37.5 = 667.5 even tight, over the budget of 640.
      const model = layered(chain('LR', { availableWidth: TURN_BREAKPOINT }));

      expect(model.direction).toBe('LR');
      expect(model.width).toBeCloseTo(667.5, 9);
    });

    it.each(['TB', 'BT'] as const)('never turns %s', (dir) => {
      expect(layered(chain(dir, { availableWidth: 100 })).direction).toBe(dir);
    });

    it('keeps the direction when turning would be wider', () => {
      // One source with five targets: 80 + 50 + 80 = 210 across, but 5 * 80 + 4 * 50 = 600 down.
      const star = graphOf(
        'LR',
        ['a', 'b', 'c', 'd', 'e', 'f'].map((id) => box(id)),
        ['b', 'c', 'd', 'e', 'f'].map((t) => link(`a${t}`, 'a', t)),
        { availableWidth: 100 }
      );

      const model = layered(star);

      expect(model.direction).toBe('LR');
      expect(model.width).toBeLessThan(600);
    });
  });
});

describe('layered: input checks name the offending field', () => {
  const valid = (): LayoutGraph =>
    graphOf('TB', [box('a'), box('b')], [link('ab', 'a', 'b')], {
      groups: [{ id: 'g', padding: { top: 1, right: 2, bottom: 3, left: 4 } }],
    });

  it('accepts zero for every size, as a degenerate but finite value', () => {
    const zero = graphOf('TB', [box('a', 0, 0), box('b', 0, 0)], [link('ab', 'a', 'b')], {
      spacing: { node: 0, rank: 0, edge: 0 },
      diagramPadding: 0,
      headRoom: 0,
    });

    expect(() => layered(zero)).not.toThrow();
  });

  it('refuses a node id used twice', () => {
    const graph = { ...valid(), nodes: [box('a'), box('a')] };

    expect(() => layered(graph)).toThrow("layout: duplicate node id 'a'");
  });

  it('refuses a group that reuses a node id', () => {
    const graph = {
      ...valid(),
      groups: [{ id: 'a', padding: { top: 1, right: 1, bottom: 1, left: 1 } }],
    };

    expect(() => layered(graph)).toThrow("layout: duplicate group id 'a'");
  });

  it('refuses an edge id used twice, so the second edge cannot overwrite the first route', () => {
    const graph = { ...valid(), edges: [link('ab', 'a', 'b'), link('ab', 'b', 'a')] };

    expect(() => layered(graph)).toThrow("layout: duplicate edge id 'ab'");
  });

  it('refuses an edge from an unknown node', () => {
    const graph = { ...valid(), edges: [link('e', 'zz', 'b')] };

    expect(() => layered(graph)).toThrow("layout: edge 'e' has unknown source 'zz'");
  });

  it('refuses an edge to an unknown node', () => {
    const graph = { ...valid(), edges: [link('e', 'a', 'zz')] };

    expect(() => layered(graph)).toThrow("layout: edge 'e' has unknown target 'zz'");
  });

  const bad = [Number.NaN, Number.POSITIVE_INFINITY, -1];
  const cases: [string, (v: number) => LayoutGraph][] = [
    ["width of node 'a'", (v) => ({ ...valid(), nodes: [box('a', v), box('b')] })],
    ["height of node 'a'", (v) => ({ ...valid(), nodes: [box('a', 80, v), box('b')] })],
    ["span of node 'a'", (v) => ({ ...valid(), nodes: [{ ...box('a'), span: v }, box('b')] })],
    ...(['top', 'right', 'bottom', 'left'] as const).map(
      (side): [string, (v: number) => LayoutGraph] => [
        "padding of group 'g'",
        (v) => ({
          ...valid(),
          groups: [{ id: 'g', padding: { top: 1, right: 1, bottom: 1, left: 1, [side]: v } }],
        }),
      ]
    ),
    [
      "title width of group 'g'",
      (v) => ({
        ...valid(),
        groups: [
          {
            id: 'g',
            padding: { top: 1, right: 1, bottom: 1, left: 1 },
            title: { width: v, height: 1 },
          },
        ],
      }),
    ],
    [
      "title height of group 'g'",
      (v) => ({
        ...valid(),
        groups: [
          {
            id: 'g',
            padding: { top: 1, right: 1, bottom: 1, left: 1 },
            title: { width: 1, height: v },
          },
        ],
      }),
    ],
    [
      "minLen of edge 'ab'",
      (v) => ({ ...valid(), edges: [{ ...link('ab', 'a', 'b'), minLen: v }] }),
    ],
    [
      "label width of edge 'ab'",
      (v) => ({ ...valid(), edges: [link('ab', 'a', 'b', { width: v, height: 1 })] }),
    ],
    [
      "label height of edge 'ab'",
      (v) => ({ ...valid(), edges: [link('ab', 'a', 'b', { width: 1, height: v })] }),
    ],
    ['spacing.node', (v) => ({ ...valid(), spacing: { ...SPACING, node: v } })],
    ['spacing.rank', (v) => ({ ...valid(), spacing: { ...SPACING, rank: v } })],
    ['spacing.edge', (v) => ({ ...valid(), spacing: { ...SPACING, edge: v } })],
    ['diagramPadding', (v) => ({ ...valid(), diagramPadding: v })],
    ['headRoom', (v) => ({ ...valid(), headRoom: v })],
  ];

  it.each(cases.flatMap(([what, make]) => bad.map((v) => [what, v, make] as const)))(
    'refuses %s when it is %s',
    (what, value, make) => {
      expect(() => layered(make(value))).toThrow(
        `layout: ${what} must be a finite number >= 0, got ${value}`
      );
    }
  );
});

describe('layered: self-loops', () => {
  const LOOP = 26;
  const withLoops = (direction: Dir, loops: LayoutEdge[]): LayoutGraph =>
    graphOf(direction, [box('a'), box('b')], [...loops, link('ab', 'a', 'b')]);
  const LABEL = { width: 30, height: 20 };

  it('draws a loop beside its node across the flow, to the right in TB', () => {
    const model = layered(withLoops('TB', [link('l', 'a', 'a')]));
    const a = model.nodes.get('a')!;
    const { points, ports, label } = model.edges.get('l')!;

    // Out of the right side at a quarter of its height either side of the middle, LOOP out.
    const right = a.x + a.width / 2;
    expect(points).toEqual([
      { x: right, y: a.y - a.height / 4, axis: 'h' },
      { x: right + LOOP, y: a.y - a.height / 4, axis: 'h' },
      { x: right + LOOP, y: a.y + a.height / 4, axis: 'v' },
      { x: right, y: a.y + a.height / 4, axis: 'h' },
    ]);
    expect(ports).toEqual({ source: 'right', target: 'right' });
    expect(label).toBeUndefined();
  });

  it('draws a loop below its node in LR, and makes room for it', () => {
    const model = layered(withLoops('LR', [link('l', 'a', 'a')]));
    const a = model.nodes.get('a')!;
    const { points, ports } = model.edges.get('l')!;

    const bottom = a.y + a.height / 2;
    expect(points).toEqual([
      { x: a.x - a.width / 4, y: bottom, axis: 'v' },
      { x: a.x - a.width / 4, y: bottom + LOOP, axis: 'v' },
      { x: a.x + a.width / 4, y: bottom + LOOP, axis: 'h' },
      { x: a.x + a.width / 4, y: bottom, axis: 'v' },
    ]);
    expect(ports).toEqual({ source: 'bottom', target: 'bottom' });
    expect(model.height).toBe(bottom + LOOP);
  });

  it('puts the label of a loop beyond it with a gap of 6, centred on the node, in TB', () => {
    const model = layered(withLoops('TB', [link('l', 'a', 'a', LABEL)]));
    const a = model.nodes.get('a')!;

    const out = a.x + a.width / 2 + LOOP;
    expect(model.edges.get('l')!.label).toEqual({ x: out + 6 + LABEL.width / 2, y: a.y });
  });

  it('puts the label of a loop beyond it with a gap of 6, centred on the node, in LR', () => {
    const model = layered(withLoops('LR', [link('l', 'a', 'a', LABEL)]));
    const a = model.nodes.get('a')!;

    const out = a.y + a.height / 2 + LOOP;
    expect(model.edges.get('l')!.label).toEqual({ x: a.x, y: out + 6 + LABEL.height / 2 });
  });

  it('nests several loops outward, each starting where the previous one and its label end', () => {
    const model = layered(withLoops('TB', [link('l1', 'a', 'a', LABEL), link('l2', 'a', 'a')]));
    const a = model.nodes.get('a')!;
    const first = model.edges.get('l1')!.points;
    const second = model.edges.get('l2')!.points;
    const right = a.x + a.width / 2;

    // The first loop reaches LOOP out; the second starts after the first and its label
    // (LOOP + label width + gap) and then reaches LOOP further.
    expect(first[1]!.x).toBe(right + LOOP);
    expect(second[1]!.x).toBe(right + (LOOP + LABEL.width + 6) + LOOP);
    // They leave at a third and two thirds of the way along half the side, and return likewise.
    expect(first[0]!.y).toBeCloseTo(a.y - a.height / 6, 9);
    expect(first[3]!.y).toBeCloseTo(a.y + a.height / 6, 9);
    expect(second[0]!.y).toBeCloseTo(a.y - a.height / 3, 9);
    expect(second[3]!.y).toBeCloseTo(a.y + a.height / 3, 9);
  });

  it('adds room for a loop label on the side the loop is on', () => {
    const plain = layered(withLoops('TB', [link('l', 'a', 'a')]));
    const labelled = layered(withLoops('TB', [link('l', 'a', 'a', LABEL)]));

    // The node's box grows by the loop's reach on both sides (to stay centred): the label
    // (30 wide) and its gap (6) are added to each.
    expect(labelled.width - plain.width).toBe(2 * (LABEL.width + 6));
  });
});

describe('layered: ports and labels of ordinary edges', () => {
  const pair = (direction: Dir, label?: { width: number; height: number }): LayoutGraph =>
    graphOf(direction, [box('a'), box('b')], [link('ab', 'a', 'b', label)]);

  it.each([
    ['TB', 'bottom', 'top'],
    ['BT', 'top', 'bottom'],
    ['LR', 'right', 'left'],
    ['RL', 'left', 'right'],
  ] as const)(
    'leaves %s by the %s of the source and arrives at the %s of the target',
    (dir, source, target) => {
      expect(layered(pair(dir)).edges.get('ab')!.ports).toEqual({ source, target });
    }
  );

  it('writes the axis of each route point: vertical in TB, horizontal in LR', () => {
    expect(
      layered(pair('TB'))
        .edges.get('ab')!
        .points.map((p) => p.axis)
    ).toEqual(['v', 'v']);
    expect(
      layered(pair('LR'))
        .edges.get('ab')!
        .points.map((p) => p.axis)
    ).toEqual(['h', 'h']);
  });

  it('places the label of an edge midway along its visible line, leaving the arrowhead room', () => {
    const model = layered(pair('TB', { width: 40, height: 20 }));

    // a ends at y 40; b starts at y 110 (rank gap 50 + label); the route is shortened by the
    // head room (7 -> visible line 40..103); the label (20 high) sits at the middle of it.
    expect(model.edges.get('ab')!.label).toEqual({ x: 40, y: 71.5 });
  });

  it('gives an edge a label position when the label has height but no width', () => {
    const model = layered(pair('TB', { width: 0, height: 20 }));

    expect(model.edges.get('ab')!.label).toBeDefined();
  });

  it('gives an edge a label position when the label has width but no height', () => {
    const model = layered(pair('TB', { width: 20, height: 0 }));

    expect(model.edges.get('ab')!.label).toEqual({ x: 40, y: 61.5 });
  });

  it('adds the diagram padding to every position and to the size', () => {
    const plain = layered(pair('TB'));
    const padded = layered({ ...pair('TB'), diagramPadding: 8 });

    expect(padded.width).toBe(plain.width + 16);
    expect(padded.height).toBe(plain.height + 16);
    expect(padded.nodes.get('a')!.x).toBe(plain.nodes.get('a')!.x + 8);
    expect(padded.nodes.get('a')!.y).toBe(plain.nodes.get('a')!.y + 8);
    const route = padded.edges.get('ab')!.points[0]!;
    expect(route.x).toBe(plain.edges.get('ab')!.points[0]!.x + 8);
    expect(route.y).toBe(plain.edges.get('ab')!.points[0]!.y + 8);
  });

  it('adds the diagram padding to a label and to a group', () => {
    const labelled = pair('TB', { width: 40, height: 20 });
    const plain = layered(labelled).edges.get('ab')!.label!;
    const padded = layered({ ...labelled, diagramPadding: 8 }).edges.get('ab')!.label!;

    expect(padded).toEqual({ x: plain.x + 8, y: plain.y + 8 });
  });
});

describe('layered: groups', () => {
  it('centres the title of a nested group in the band above its own content', () => {
    const pad = { top: 8, right: 8, bottom: 8, left: 8 };
    const model = layered(
      graphOf('TB', [box('a', 80, 40, 'h')], [], {
        groups: [
          { id: 'g', padding: pad },
          { id: 'h', parent: 'g', padding: pad },
        ],
      })
    );

    // g is 8 + 40 + 8 + 8 + 8 = 72 high, from y 0; h starts 8 in. A title with no height sits
    // half of `padding.top` below its group's top edge.
    expect(model.groups.get('g')!).toMatchObject({ width: 112, height: 72, title: { y: 4 } });
    expect(model.groups.get('h')!).toMatchObject({ width: 96, height: 56, title: { y: 12 } });
  });

  it('is as wide as its title when the content is narrower', () => {
    const model = layered(
      graphOf('TB', [box('a', 40, 40, 'g')], [], {
        groups: [
          {
            id: 'g',
            padding: { top: 8, right: 8, bottom: 8, left: 8 },
            title: { width: 200, height: 20 },
          },
        ],
      })
    );

    expect(model.groups.get('g')!.width).toBe(200 + 2 * 8);
  });

  it('adds the title height to the top padding', () => {
    const pad = { top: 8, right: 8, bottom: 8, left: 8 };
    const grouped = (title?: { width: number; height: number }): LayoutGraph =>
      graphOf('TB', [box('a', 80, 40, 'g')], [], {
        groups: [{ id: 'g', padding: pad, ...(title ? { title } : {}) }],
      });

    const bare = layered(grouped()).groups.get('g')!;
    const titled = layered(grouped({ width: 10, height: 20 })).groups.get('g')!;

    expect(titled.height - bare.height).toBe(20);
  });
});

// ---------------------------------------------------------------------------------------------
// The adapter between mermaid's LayoutData and the engine.

// Measured diagram items as the renderers hand them over. The extras are free-form so a case can
// carry a value the types forbid (a string width, a shape the engine has no rule for); the
// single cast is the repo's convention for such fixtures (see layoutData.spec.ts).
const dataNode = (id: string, extra: Record<string, unknown> = {}): Node =>
  ({ id, width: 80, height: 40, isGroup: false, ...extra }) as Node;
const dataEdge = (
  id: string,
  start: string,
  end: string,
  extra: Record<string, unknown> = {}
): Edge => ({ id, start, end, ...extra }) as Edge;
const dataOf = (
  nodes: Node[],
  edges: Edge[],
  extra: Partial<LayoutData> = {},
  config: Record<string, unknown> = {}
): LayoutData => ({ nodes, edges, config: config as MermaidConfig, direction: 'TB', ...extra });

describe('layered adapter: sizes and directions', () => {
  it.each([
    ['a string', '80'],
    ['NaN', Number.NaN],
    ['infinity', Number.POSITIVE_INFINITY],
    ['a negative number', -3],
    ['zero', 0],
    ['nothing', undefined],
  ])('reads %s as a size of 0', (_name, width) => {
    const graph = toLayoutGraph(dataOf([dataNode('a', { width })], []));

    expect(graph.nodes[0]!.width).toBe(0);
  });

  it('reads any case of the direction names, TD as TB', () => {
    const directionOf = (direction: string) =>
      toLayoutGraph(dataOf([], [], { direction })).direction;

    expect(['lr', 'RL', 'bt', 'td', 'Tb', 'sideways'].map(directionOf)).toEqual([
      'LR',
      'RL',
      'BT',
      'TB',
      'TB',
      'TB',
    ]);
  });

  it('takes the spacing of the renderer first, then the flowchart section, then the defaults', () => {
    const spacingOf = (extra: Partial<LayoutData>, config: Record<string, unknown> = {}) =>
      toLayoutGraph(dataOf([], [], extra, config)).spacing;
    const flowchart = { flowchart: { nodeSpacing: 31, rankSpacing: 32 } };

    expect(spacingOf({ nodeSpacing: 11, rankSpacing: 12 }, flowchart)).toEqual({
      node: 11,
      rank: 12,
      edge: 20,
    });
    expect(spacingOf({}, flowchart)).toEqual({ node: 31, rank: 32, edge: 20 });
    expect(spacingOf({ nodeSpacing: 0, rankSpacing: -1 }, flowchart)).toEqual({
      node: 31,
      rank: 32,
      edge: 20,
    });
    expect(spacingOf({})).toEqual({ node: 50, rank: 50, edge: 20 });
  });

  it('translates a diagram with no config at all', () => {
    const data = dataOf([dataNode('a')], []);
    Reflect.deleteProperty(data, 'config');

    expect(toLayoutGraph(data).routing).toBe('stepped');
  });
});

describe('layered adapter: the edge routing the diagram asks for', () => {
  const routingOf = (edgeRouting: string | undefined) =>
    toLayoutGraph(dataOf([], [], {}, edgeRouting === undefined ? {} : { layered: { edgeRouting } }))
      .routing;

  it.each([
    ['curved', 'curved'],
    ['stepped', 'stepped'],
    ['straight', 'straight'],
    ['rounded', 'stepped'],
    ['zigzag', 'stepped'],
    [undefined, 'stepped'],
  ])('maps %s to the engine routing %s', (asked, engine) => {
    expect(routingOf(asked)).toBe(engine);
  });
});

describe('layered adapter: how far edges may spread along a side, by shape', () => {
  const spanOf = (shape: string | undefined, direction: string, width = 100, height = 50) =>
    toLayoutGraph(dataOf([dataNode('a', { shape, width, height })], [], { direction })).nodes[0]!
      .span;

  it.each([
    ['circle', 'TB', 60],
    ['circle', 'LR', 30],
    ['stadium', 'TB', 50],
    ['stadium', 'LR', 30],
    ['hexagon', 'TB', 63],
    ['hexagon', 'LR', 25],
  ])('gives a %s in %s a span of %s (width 100, height 50)', (shape, direction, span) => {
    expect(spanOf(shape, direction)).toBe(span);
  });

  it('keeps the engine default for a shape with no rule, and for no shape', () => {
    expect(spanOf('squareRect', 'TB')).toBeUndefined();
    expect(spanOf(undefined, 'TB')).toBeUndefined();
  });

  it('never gives a negative span, for a stadium narrower than it is tall', () => {
    expect(spanOf('stadium', 'TB', 30, 50)).toBe(0);
  });
});

describe('layered adapter: subgraphs as groups', () => {
  const groupOf = (n: Partial<Node>, config: Record<string, unknown> = {}, extra: Node[] = []) =>
    toLayoutGraph(dataOf([dataNode('g', { isGroup: true, ...n }), ...extra], [], {}, config))
      .groups[0]!;
  const margins = { flowchart: { subGraphTitleMargin: { top: 7, bottom: 3 } } };

  it('puts the title margins, the title gap and 0 more above a titled group, and keeps its size', () => {
    const group = groupOf({ labelBBox: { width: 50, height: 20 } }, margins);

    expect(group.padding).toEqual({ top: 7 + 3 + 12, right: 20, bottom: 20, left: 20 });
    expect(group.title).toEqual({ width: 50, height: 20 });
  });

  it('leaves an untitled group the plain padding of 20 and no title', () => {
    const group = groupOf({}, margins);

    expect(group.padding.top).toBe(20);
    expect(group.title).toBeUndefined();
  });

  it.each([
    ['no width', { width: 0, height: 20 }],
    ['no height', { width: 50, height: 0 }],
  ])('treats a label with %s as no title', (_name, labelBBox) => {
    const group = groupOf({ labelBBox }, margins);

    expect(group.title).toBeUndefined();
    expect(group.padding.top).toBe(20);
  });

  it('counts a missing title margin as 0', () => {
    expect(groupOf({ labelBBox: { width: 50, height: 20 } }).padding.top).toBe(12);
  });

  it('names a parent only when it is a group, and reads a direction in any case', () => {
    const inGroup = groupOf({ parentId: 'outer', dir: 'lr' }, {}, [
      dataNode('outer', { isGroup: true }),
    ]);
    const inNode = groupOf({ parentId: 'plain' }, {}, [dataNode('plain')]);

    expect(inGroup.parent).toBe('outer');
    expect(inGroup.direction).toBe('LR');
    expect(inNode.parent).toBeUndefined();
    expect(inNode.direction).toBeUndefined();
  });

  it('puts a node in a group only when its parent is a group', () => {
    const graph = toLayoutGraph(
      dataOf(
        [
          dataNode('g', { isGroup: true }),
          dataNode('in', { parentId: 'g' }),
          dataNode('plain'),
          dataNode('under', { parentId: 'plain' }),
          dataNode('orphan', { parentId: 'missing' }),
        ],
        []
      )
    );

    expect(graph.nodes.map((n) => [n.id, n.parent])).toEqual([
      ['in', 'g'],
      ['plain', undefined],
      ['under', undefined],
      ['orphan', undefined],
    ]);
  });
});

describe('layered adapter: which edges the engine sees', () => {
  const nodes = [dataNode('a'), dataNode('b'), dataNode('g', { isGroup: true })];
  const idsOf = (edges: Edge[]) => toLayoutGraph(dataOf(nodes, edges)).edges.map((e) => e.id);

  it('drops layout-only edges and edges missing an end or naming an unknown one', () => {
    expect(
      idsOf([
        dataEdge('ok', 'a', 'b'),
        dataEdge('hidden', 'a', 'b', { isLayoutOnly: true }),
        dataEdge('nostart', '', 'b'),
        dataEdge('noend', 'a', ''),
        dataEdge('unknownStart', 'zz', 'b'),
        dataEdge('unknownEnd', 'a', 'zz'),
      ])
    ).toEqual(['ok']);
  });

  it('keeps an edge to or from a subgraph', () => {
    expect(idsOf([dataEdge('toGroup', 'a', 'g'), dataEdge('fromGroup', 'g', 'b')])).toEqual([
      'toGroup',
      'fromGroup',
    ]);
  });

  it.each([
    [undefined, 1],
    [0, 1],
    [-2, 1],
    ['3', 1],
    [2.4, 2],
    [2.5, 3],
    [4, 4],
  ])('reads a minlen of %s as %s ranks', (minlen, ranks) => {
    const [edge] = toLayoutGraph(dataOf(nodes, [dataEdge('e', 'a', 'b', { minlen })])).edges;

    expect(edge!.minLen).toBe(ranks);
  });

  it('gives a label the room v13 gives it: 12 wide and 4 high more than measured', () => {
    const [edge] = toLayoutGraph(
      dataOf(nodes, [dataEdge('e', 'a', 'b', { label: 'yes', width: 30, height: 18 })])
    ).edges;

    expect(edge!.label).toEqual({ width: 42, height: 22 });
  });

  it('counts a label of unknown height as 4 high', () => {
    const [edge] = toLayoutGraph(
      dataOf(nodes, [dataEdge('e', 'a', 'b', { label: 'yes', width: 30 })])
    ).edges;

    expect(edge!.label).toEqual({ width: 42, height: 4 });
  });

  it.each([
    ['an empty text', { label: '', width: 30, height: 18 }],
    ['a blank text', { label: '   ', width: 30, height: 18 }],
    ['no text', { width: 30, height: 18 }],
    ['text with no measured width', { label: 'yes', height: 18 }],
  ])('gives %s no label', (_name, extra) => {
    const [edge] = toLayoutGraph(dataOf(nodes, [dataEdge('e', 'a', 'b', extra)])).edges;

    expect(edge!.label).toBeUndefined();
  });

  it('counts a label that is not text (a rendered element) as a label', () => {
    const element = { nodeType: 1 };
    const [edge] = toLayoutGraph(
      dataOf(nodes, [dataEdge('e', 'a', 'b', { label: element, width: 30, height: 18 })])
    ).edges;

    expect(edge!.label).toEqual({ width: 42, height: 22 });
  });
});

describe('layered adapter: the curve each routing is drawn with', () => {
  const curveFor = (edgeRouting: string, curve?: string): unknown => {
    const data = dataOf(
      [dataNode('a'), dataNode('b')],
      [dataEdge('e', 'a', 'b', curve ? { curve } : {})],
      {},
      { layered: { edgeRouting } }
    );
    runLayeredLayoutCore(data);
    return data.edges[0]!.curve;
  };

  it.each([
    ['rounded', 'basis', 'rounded'],
    ['straight', 'basis', 'linear'],
    ['stepped', undefined, 'step'],
    ['stepped', 'basis', 'step'],
    ['stepped', 'step', 'step'],
    ['stepped', 'stepBefore', 'stepBefore'],
    ['stepped', 'stepAfter', 'stepAfter'],
    ['curved', 'basis', 'basis'],
    ['curved', undefined, undefined],
  ])('draws %s routing of an edge with curve %s as %s', (routing, curve, drawn) => {
    expect(curveFor(routing, curve)).toBe(drawn);
  });
});

describe('layered adapter: writing the layout back', () => {
  it('sets position, size, route and label of what the engine placed, and nothing else', () => {
    const group = dataNode('g', { isGroup: true, width: 1, height: 1 });
    const inside = dataNode('in', { parentId: 'g' });
    const other = dataNode('o');
    const labelled = dataEdge('e1', 'in', 'o', { label: 'x', width: 20, height: 10 });
    const plain = dataEdge('e2', 'o', 'in');
    const hidden = dataEdge('e3', 'o', 'in', { isLayoutOnly: true });
    const data = dataOf([group, inside, other], [labelled, plain, hidden]);

    runLayeredLayoutCore(data);

    const model = layered(toLayoutGraph(data));
    const placed = model.nodes.get('in')!;
    expect([inside.x, inside.y]).toEqual([placed.x, placed.y]);
    const cluster = model.groups.get('g')!;
    expect([group.x, group.y, group.width, group.height]).toEqual([
      cluster.x,
      cluster.y,
      cluster.width,
      cluster.height,
    ]);
    expect(labelled.points).toEqual(model.edges.get('e1')!.points);
    expect([labelled.x, labelled.y]).toEqual([
      model.edges.get('e1')!.label!.x,
      model.edges.get('e1')!.label!.y,
    ]);
    expect(plain.x).toBeUndefined();
    expect(hidden.points).toBeUndefined();
  });

  it('leaves a node and an edge the model has no entry for where they were', () => {
    const data = dataOf([dataNode('a', { x: 5, y: 6 })], [dataEdge('e', 'a', 'a', { x: 7 })]);
    const elsewhere = layered(toLayoutGraph(dataOf([dataNode('z')], [])));

    applyLayoutModel(data, elsewhere);

    expect([data.nodes[0]!.x, data.nodes[0]!.y, data.nodes[0]!.width]).toEqual([5, 6, 80]);
    expect(data.edges[0]!.points).toBeUndefined();
    expect(data.edges[0]!.x).toBe(7);
  });

  it('copies the route points, so later changes to the data cannot reach the model', () => {
    const data = dataOf([dataNode('a'), dataNode('b')], [dataEdge('e', 'a', 'b')]);
    const model = layered(toLayoutGraph(data));

    applyLayoutModel(data, model);
    data.edges[0]!.points![0] = { x: -1, y: -1 };

    expect(model.edges.get('e')!.points[0]!.x).not.toBe(-1);
  });
});

describe('layered adapter: putting route ends on the drawn shape', () => {
  interface Pt {
    x: number;
    y: number;
  }
  const RADIUS = 30;
  // A circle of radius 30 about the node's centre.
  const circleAbout = (x: number, y: number) => (p: Pt) => {
    const d = Math.hypot(p.x - x, p.y - y) || 1;
    return { x: x + ((p.x - x) * RADIUS) / d, y: y + ((p.y - y) * RADIUS) / d };
  };
  const shaped = (id: string, x: number, y: number, intersect?: (p: Pt) => Pt): Node =>
    dataNode(id, { x, y, ...(intersect ? { intersect } : {}) });
  const routed = (a: Node, b: Node, points: unknown): Edge => {
    const e = dataEdge('e', a.id, b.id, { points });
    return e;
  };
  // Boxes are 80 x 40: a source about (0, 0) and a target about (0, 200). Ends at x = 25 on the
  // bottom side of the source (20 below its centre) are 32 from the centre: outside the circle.
  const clip = (a: Node, b: Node, points: unknown) => {
    const e = routed(a, b, points);
    clipRouteEnds(dataOf([a, b], [e]));
    return e.points;
  };

  it('moves an end that sits on the box side but outside the shape onto the outline, square to the side', () => {
    const a = shaped('a', 0, 0, circleAbout(0, 0));
    const b = shaped('b', 0, 200);
    const points = [
      { x: 25, y: 20, axis: 'v' },
      { x: 25, y: 180, axis: 'v' },
    ];

    const clipped = clip(a, b, points)!;

    // Along x = 25 the circle of radius 30 is at y = sqrt(900 - 625).
    expect(clipped[0]!.x).toBeCloseTo(25, 5);
    expect(clipped[0]!.y).toBeCloseTo(Math.sqrt(275), 5);
    expect(clipped[0]).toMatchObject({ axis: 'v' });
    expect(clipped[1]).toEqual(points[1]);
  });

  it('moves the end at the target too, and leaves the points between alone', () => {
    const a = shaped('a', 0, 0);
    const b = shaped('b', 0, 200, circleAbout(0, 200));
    const points = [
      { x: 25, y: 20, axis: 'v' },
      { x: 55, y: 100, axis: 'v' },
      { x: 25, y: 180, axis: 'v' },
    ];

    const clipped = clip(a, b, points)!;

    expect(clipped[0]).toEqual(points[0]);
    expect(clipped[1]).toEqual(points[1]);
    expect(clipped[2]!.x).toBeCloseTo(25, 5);
    expect(clipped[2]!.y).toBeCloseTo(200 - Math.sqrt(275), 5);
  });

  it('leaves an end that is already inside the shape', () => {
    const a = shaped('a', 0, 0, circleAbout(0, 0));
    const points = [
      { x: 10, y: 20, axis: 'v' },
      { x: 10, y: 180, axis: 'v' },
    ];

    expect(clip(a, shaped('b', 0, 200), points)).toEqual(points);
  });

  it('leaves an end that is not on a side of the box', () => {
    const a = shaped('a', 0, 0, circleAbout(0, 0));
    const points = [
      { x: 25, y: 5, axis: 'v' },
      { x: 25, y: 180, axis: 'v' },
    ];

    expect(clip(a, shaped('b', 0, 200), points)).toEqual(points);
  });

  it('counts an end within half a unit of a side as on it, and one 0.6 away as off it', () => {
    const near = [
      { x: 25, y: 20.4, axis: 'v' },
      { x: 25, y: 180, axis: 'v' },
    ];
    const far = [
      { x: 25, y: 20.6, axis: 'v' },
      { x: 25, y: 180, axis: 'v' },
    ];

    expect(
      clip(shaped('a', 0, 0, circleAbout(0, 0)), shaped('b', 0, 200), near)![0]!.y
    ).toBeLessThan(20.4);
    expect(clip(shaped('a', 0, 0, circleAbout(0, 0)), shaped('b', 0, 200), far)![0]).toEqual(
      far[0]
    );
  });

  it('meets the outline on the way to the centre when the whole centre line is outside the shape', () => {
    // A tiny shape (radius 10) about the centre: the port (25, 20) and the point (25, 0) beside
    // it on the way to the centre line are both outside it.
    const tiny = (p: Pt) => {
      const d = Math.hypot(p.x, p.y) || 1;
      return { x: (p.x * 10) / d, y: (p.y * 10) / d };
    };
    const points = [
      { x: 25, y: 20, axis: 'v' },
      { x: 25, y: 180, axis: 'v' },
    ];

    const clipped = clip(shaped('a', 0, 0, tiny), shaped('b', 0, 200), points)!;

    const d = Math.hypot(25, 20);
    expect(clipped[0]!.x).toBeCloseTo((25 * 10) / d, 9);
    expect(clipped[0]!.y).toBeCloseTo((20 * 10) / d, 9);
  });

  it('keeps an end whose outline cannot be found', () => {
    const lost = () => ({ x: Number.NaN, y: Number.NaN });
    const points = [
      { x: 25, y: 20, axis: 'v' },
      { x: 25, y: 180, axis: 'v' },
    ];

    expect(clip(shaped('a', 0, 0, lost), shaped('b', 0, 200), points)).toEqual(points);
  });

  it('keeps an end whose outline has one finite coordinate', () => {
    const half = () => ({ x: 1, y: Number.NaN });
    const points = [
      { x: 25, y: 20, axis: 'v' },
      { x: 25, y: 180, axis: 'v' },
    ];

    expect(clip(shaped('a', 0, 0, half), shaped('b', 0, 200), points)).toEqual(points);
  });

  it('leaves nodes with no outline, no position or no shape alone', () => {
    const points = [
      { x: 25, y: 20, axis: 'v' },
      { x: 25, y: 180, axis: 'v' },
    ];
    const group = dataNode('g', { isGroup: true, x: 0, y: 0, intersect: circleAbout(0, 0) });
    const unplaced = dataNode('u', { intersect: circleAbout(0, 0) });
    const nan = dataNode('n', { x: Number.NaN, y: 0, intersect: circleAbout(0, 0) });

    for (const start of [group, unplaced, nan]) {
      expect(clip(start, shaped('b', 0, 200), points)).toEqual(points);
    }
  });

  it('leaves untagged routes and edges whose nodes are unknown alone', () => {
    const a = shaped('a', 0, 0, circleAbout(0, 0));
    const untagged = [
      { x: 30, y: 20 },
      { x: 30, y: 180 },
    ];
    const tagged = [
      { x: 25, y: 20, axis: 'v' },
      { x: 25, y: 180, axis: 'v' },
    ];
    const unknown = dataEdge('x', 'nope', 'nada', { points: tagged });
    const same = [...tagged];

    clipRouteEnds(dataOf([a], [unknown]));

    expect(clip(a, shaped('b', 0, 200), untagged)).toEqual(untagged);
    expect(unknown.points).toEqual(same);
  });

  it('has a bisection fine enough to put the end on the outline', () => {
    const a = shaped('a', 0, 0, circleAbout(0, 0));
    const clipped = clip(a, shaped('b', 0, 200), [
      { x: 29, y: 20, axis: 'v' },
      { x: 29, y: 180, axis: 'v' },
    ])![0]!;

    expect(Math.hypot(clipped.x, clipped.y)).toBeCloseTo(RADIUS, 5);
  });
});

describe('layered: a budget that does not apply, and one that fits exactly', () => {
  const row = (extra: Partial<LayoutGraph> = {}): LayoutGraph =>
    graphOf('LR', [box('a'), box('b')], [link('ab', 'a', 'b')], extra);

  it.each([
    ['no budget', undefined],
    ['a budget of zero', 0],
    ['a negative budget', -5],
  ])('does not turn a drawing that runs across for %s', (_name, availableWidth) => {
    const model = layered(row({ availableWidth }));

    expect(model.direction).toBe('LR');
    expect(model).toEqual(layered(row()));
  });

  it('does not turn a drawing that fits the budget exactly', () => {
    // 80 + 50 + 80 = 210 across, or 80 + 37.5 + 80 = 197.5 tight, and 80 down. The drawing is
    // turned only when even the tight one is over the budget.
    expect(layered(row({ availableWidth: 210 })).direction).toBe('LR');
    expect(layered(row({ availableWidth: 197.5 })).direction).toBe('LR');
    expect(layered(row({ availableWidth: 197 })).direction).toBe('TB');
  });

  it('keeps the direction when turning is exactly as wide', () => {
    // One box is as wide laid out either way; the drawing is not turned for nothing.
    const single = graphOf('LR', [box('a')], [], { availableWidth: 50 });

    expect(layered(single).direction).toBe('LR');
  });
});

describe('layered: which direction a node is laid out in', () => {
  const pad = { top: 8, right: 8, bottom: 8, left: 8 };
  const loopPortOf = (
    direction: Dir,
    groups: LayoutGroup[],
    parent: string | undefined
  ): string | undefined =>
    layered(
      graphOf('TB', [box('a', 80, 40, parent)], [link('l', 'a', 'a')], { direction, groups })
    ).edges.get('l')?.ports.source;

  it('lays a loop below a node whose group runs across, in a drawing that runs down', () => {
    expect(loopPortOf('TB', [{ id: 'g', padding: pad, direction: 'LR' }], 'g')).toBe('bottom');
  });

  it('lets a group without a direction of its own take the one of the group around it', () => {
    const groups: LayoutGroup[] = [
      { id: 'g', padding: pad, direction: 'LR' },
      { id: 'h', parent: 'g', padding: pad },
    ];

    expect(loopPortOf('TB', groups, 'h')).toBe('bottom');
  });

  it('lets the nearest group that has a direction decide', () => {
    const groups: LayoutGroup[] = [
      { id: 'g', padding: pad, direction: 'LR' },
      { id: 'h', parent: 'g', padding: pad, direction: 'TB' },
    ];

    expect(loopPortOf('LR', groups, 'h')).toBe('right');
  });

  it('finishes when groups name each other as parents, with the node in neither direction', () => {
    const groups: LayoutGroup[] = [
      { id: 'g', parent: 'h', padding: pad },
      { id: 'h', parent: 'g', padding: pad },
    ];

    expect(loopPortOf('TB', groups, 'g')).toBe('right');
  });

  it('ignores a parent that is a node, or that does not exist', () => {
    const loose = layered(graphOf('TB', [box('a'), box('b')], [link('ab', 'a', 'b')]));
    const underNode = layered(
      graphOf('TB', [box('a'), box('b', 80, 40, 'a')], [link('ab', 'a', 'b')])
    );
    const underNothing = layered(graphOf('TB', [box('a', 80, 40, 'zz')], []));

    expect(underNode).toEqual(loose);
    expect([...underNothing.nodes.keys()]).toEqual(['a']);
  });
});

describe('layered: loops and ports in corner cases', () => {
  it('nests a second loop below the first in LR, beyond the first loop and its label', () => {
    const labelled = { width: 30, height: 20 };
    const model = layered(
      graphOf('LR', [box('a')], [link('l1', 'a', 'a', labelled), link('l2', 'a', 'a')])
    );
    const a = model.nodes.get('a')!;
    const bottom = a.y + a.height / 2;

    // In LR the label sits below, so the first loop takes LOOP (26) + label height (20) + gap (6).
    expect(model.edges.get('l1')!.points[1]!.y).toBe(bottom + 26);
    expect(model.edges.get('l2')!.points[1]!.y).toBe(bottom + (26 + 20 + 6) + 26);
  });

  it('leaves a zero-size node by the side the flow leaves it', () => {
    const model = layered(graphOf('TB', [box('a', 0, 0), box('b', 0, 0)], [link('ab', 'a', 'b')]));

    expect(model.edges.get('ab')!.ports).toEqual({ source: 'bottom', target: 'top' });
  });

  it('sends a back edge up: it leaves by the top of its source and arrives at the bottom', () => {
    const model = layered(
      graphOf('TB', [box('a'), box('b')], [link('ab', 'a', 'b'), link('ba', 'b', 'a')])
    );

    expect(model.edges.get('ab')!.ports).toEqual({ source: 'bottom', target: 'top' });
    expect(model.edges.get('ba')!.ports).toEqual({ source: 'top', target: 'bottom' });
  });
});

describe('layered: the room kept between a rank and the tracks that leave it', () => {
  // The root over three children; the outer two need a bend, the middle one does not.
  const fan = (routing: 'stepped', rank: number): LayoutGraph =>
    graphOf(
      'TB',
      [box('a'), box('b'), box('c'), box('d')],
      [link('ab', 'a', 'b'), link('ac', 'a', 'c'), link('ad', 'a', 'd')],
      { routing, spacing: { node: 50, rank, edge: 20 }, headRoom: 0 }
    );
  const TRACK_MARGIN = 20;

  it('keeps a stepped track 20 from the ranks either side, however small the rank spacing is', () => {
    const model = layered(fan('stepped', 0));
    const a = model.nodes.get('a')!;
    const bend = model.edges.get('ab')!.points[1]!;

    // Two margins make the gap between the ranks (40); the track runs along its middle.
    expect(bend.y).toBe(a.y + a.height / 2 + TRACK_MARGIN);
    expect(model.height).toBe(3 * 40);
  });

  it('keeps the gap at its roomy spacing when that is more than the margins ask for', () => {
    expect(layered(fan('stepped', 50)).height).toBe(130);
  });
});
