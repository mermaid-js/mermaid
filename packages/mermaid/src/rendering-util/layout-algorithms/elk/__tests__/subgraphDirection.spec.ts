import { describe, it, expect } from 'vitest';
import { buildElkGraphFromLayoutData, runElkLayoutCore } from '../render.js';
import { onBorder } from '../geometry.js';

const log = {
  debug: () => undefined,
  error: () => undefined,
  info: () => undefined,
  warn: () => undefined,
};

const elkRenderContext = {
  helpers: {
    common: { lineBreakRegex: /<br\s*\/?>/gi },
    getConfig: () => ({ flowchart: { wrappingWidth: 200 }, curve: undefined }),
    interpolateToCurve: (curve: unknown) => curve,
    log,
  },
  options: { algorithm: 'elk.layered' },
} as any;

const NODE_WIDTH = 90;
const NODE_HEIGHT = 40;

const group = (id: string, dir?: string, parentId?: string) => ({
  id,
  parentId,
  dir,
  isGroup: true,
  label: id,
  shape: 'rect',
  padding: 8,
  labelData: { width: 60, height: 20 },
});
const node = (id: string, parentId?: string) => ({
  id,
  parentId,
  isGroup: false,
  width: NODE_WIDTH,
  height: NODE_HEIGHT,
  label: id,
  shape: 'rect',
});
const edge = (start: string, end: string, extra: Record<string, unknown> = {}) => ({
  id: `L_${start}_${end}_0`,
  start,
  end,
  type: 'arrow_point',
  ...extra,
});

/** Two groups of three chained nodes, `a` and `b`, in a diagram of the given direction. */
const twoChains = ({
  direction = 'LR',
  groupDir = 'TB',
  edges = [edge('a3', 'b1')],
  elk = {},
}: {
  direction?: string;
  groupDir?: string;
  edges?: ReturnType<typeof edge>[];
  elk?: Record<string, unknown>;
} = {}) =>
  ({
    direction,
    config: { elk },
    nodes: [
      group('intake', groupDir),
      group('dispatch', groupDir),
      ...['a1', 'a2', 'a3'].map((id) => node(id, 'intake')),
      ...['b1', 'b2', 'b3'].map((id) => node(id, 'dispatch')),
    ],
    edges: [
      edge('a1', 'a2'),
      edge('a2', 'a3'),
      edge('b1', 'b2'),
      edge('b2', 'b3'),
      ...edges.map((e) => ({ ...e })),
    ],
  }) as any;

const byId = (data: any) => new Map<string, any>(data.nodes.map((n: any) => [n.id, n]));
const edgeOf = (data: any, start: string, end: string) =>
  data.edges.find((e: any) => e.start === start && e.end === end);

/** A column shares x and runs downwards; a row shares y and runs rightwards. */
const isColumn = (nodes: any[]) =>
  nodes.every((n, i) => n.x === nodes[0].x && (i === 0 || n.y > nodes[i - 1].y));
const isRow = (nodes: any[]) =>
  nodes.every((n, i) => n.y === nodes[0].y && (i === 0 || n.x > nodes[i - 1].x));

describe('a subgraph keeps its own direction when an edge crosses its frame', () => {
  it('lays two TB groups out as columns in an LR diagram with an edge between them', async () => {
    const data = twoChains();
    await runElkLayoutCore(data, elkRenderContext);
    const nodes = byId(data);

    expect(isColumn(['a1', 'a2', 'a3'].map((id) => nodes.get(id)))).toBe(true);
    expect(isColumn(['b1', 'b2', 'b3'].map((id) => nodes.get(id)))).toBe(true);
    expect(nodes.get('b1').x).toBeGreaterThan(nodes.get('a1').x);
  });

  it('routes the crossing edge as one line from the border of its source to the border of its target', async () => {
    const data = twoChains();
    await runElkLayoutCore(data, elkRenderContext);
    const nodes = byId(data);
    const { points } = edgeOf(data, 'a3', 'b1');

    expect(onBorder(nodes.get('a3'), points[0])).toBe(true);
    expect(onBorder(nodes.get('b1'), points.at(-1))).toBe(true);
  });

  it('lays an LR group out as a row in a TB diagram with an edge leaving it', async () => {
    const data = twoChains({ direction: 'TB', groupDir: 'LR' });
    await runElkLayoutCore(data, elkRenderContext);
    const nodes = byId(data);

    expect(isRow(['a1', 'a2', 'a3'].map((id) => nodes.get(id)))).toBe(true);
    expect(isRow(['b1', 'b2', 'b3'].map((id) => nodes.get(id)))).toBe(true);
    expect(onBorder(nodes.get('b1'), edgeOf(data, 'a3', 'b1').points.at(-1))).toBe(true);
  });

  it('keeps the groups in their direction without a crossing edge, as before', async () => {
    const data = twoChains({ edges: [] });
    await runElkLayoutCore(data, elkRenderContext);
    const nodes = byId(data);

    expect(isColumn(['a1', 'a2', 'a3'].map((id) => nodes.get(id)))).toBe(true);
    expect(isColumn(['b1', 'b2', 'b3'].map((id) => nodes.get(id)))).toBe(true);
  });

  it('builds the same ELK graph as before when no edge crosses a directed frame', () => {
    const { elkGraph } = buildElkGraphFromLayoutData(twoChains({ edges: [] }), {
      ...elkRenderContext.helpers,
      algorithm: 'elk.layered',
    });
    for (const child of elkGraph.children) {
      expect(child.ports).toBeUndefined();
      expect(child.layoutOptions['elk.portConstraints']).toBeUndefined();
      expect(child.layoutOptions['elk.hierarchyHandling']).toBe('SEPARATE_CHILDREN');
    }
    expect(elkGraph.edges.map((e: any) => e.id)).toEqual([
      'L_a1_a2_0',
      'L_a2_a3_0',
      'L_b1_b2_0',
      'L_b2_b3_0',
    ]);
  });

  it('leaves a group whose direction matches the diagram to the shared layout', () => {
    const { elkGraph } = buildElkGraphFromLayoutData(twoChains({ groupDir: 'LR' }), {
      ...elkRenderContext.helpers,
      algorithm: 'elk.layered',
    });
    for (const child of elkGraph.children) {
      expect(child.ports).toBeUndefined();
      expect(child.layoutOptions['elk.hierarchyHandling']).toBe('INCLUDE_CHILDREN');
    }
    expect(elkGraph.edges).toHaveLength(5);
  });

  it('treats TD and TB as the same direction', () => {
    const { elkGraph } = buildElkGraphFromLayoutData(
      twoChains({ direction: 'TD', groupDir: 'TB' }),
      { ...elkRenderContext.helpers, algorithm: 'elk.layered' }
    );
    expect(elkGraph.children.every((child: any) => child.ports === undefined)).toBe(true);
  });

  it('keeps the label of a crossing edge between the two groups', async () => {
    const data = twoChains({ edges: [edge('a3', 'b1', { label: 'ship', width: 30, height: 14 })] });
    await runElkLayoutCore(data, elkRenderContext);
    const nodes = byId(data);
    const crossing = edgeOf(data, 'a3', 'b1');
    const frame = (id: string) => nodes.get(id);

    expect(crossing.x).toBeGreaterThan(frame('intake').x + frame('intake').width / 2);
    expect(crossing.x).toBeLessThan(frame('dispatch').x - frame('dispatch').width / 2);
  });

  it('routes two crossing edges into one node and a feedback edge back', async () => {
    const data = twoChains({
      edges: [edge('a3', 'b1'), edge('a2', 'b1'), edge('b3', 'a1')],
      elk: { mergeEdges: true },
    });
    await runElkLayoutCore(data, elkRenderContext);
    const nodes = byId(data);

    const ys = ['a1', 'a2', 'a3'].map((id) => nodes.get(id).y);
    expect(ys).toEqual([...ys].sort((p, q) => p - q));
    for (const [start, end] of [
      ['a3', 'b1'],
      ['a2', 'b1'],
      ['b3', 'a1'],
    ]) {
      const { points } = edgeOf(data, start, end);
      expect(onBorder(nodes.get(start), points[0])).toBe(true);
      expect(onBorder(nodes.get(end), points.at(-1))).toBe(true);
    }
    expect(nodes.get('b1').x).toBeGreaterThan(nodes.get('a3').x);
  });

  it('routes an edge from a node to another group itself', async () => {
    const data = twoChains({ edges: [edge('a3', 'dispatch')] });
    await runElkLayoutCore(data, elkRenderContext);
    const nodes = byId(data);

    expect(isColumn(['a1', 'a2', 'a3'].map((id) => nodes.get(id)))).toBe(true);
    const { points } = edgeOf(data, 'a3', 'dispatch');
    expect(onBorder(nodes.get('a3'), points[0])).toBe(true);
    expect(onBorder(nodes.get('dispatch'), points.at(-1))).toBe(true);
  });

  it('chains ports through a directed group nested in another', async () => {
    const data = {
      direction: 'LR',
      config: { elk: {} },
      nodes: [
        group('outer', 'TB'),
        group('inner', 'LR', 'outer'),
        node('c1', 'inner'),
        node('c2', 'inner'),
        node('o1', 'outer'),
        node('x'),
      ],
      edges: [edge('c1', 'c2'), edge('o1', 'c1'), edge('c2', 'x')],
    } as any;
    await runElkLayoutCore(data, elkRenderContext);
    const nodes = byId(data);

    expect(isRow(['c1', 'c2'].map((id) => nodes.get(id)))).toBe(true);
    expect(nodes.get('c1').y).toBeGreaterThan(nodes.get('o1').y);
    const { points } = edgeOf(data, 'c2', 'x');
    expect(onBorder(nodes.get('c2'), points[0])).toBe(true);
    expect(onBorder(nodes.get('x'), points.at(-1))).toBe(true);
  });
});
