import { describe, it, expect, afterEach } from 'vitest';
import * as configApi from '../../../../config.js';
import { runElkLayoutCore } from '../render.js';
import {
  type RowItem,
  type RowLink,
  alignDirectedSubgraphs,
  commonSpan,
  labelSpot,
  meetsSquarely,
  fromFlow,
  packAlong,
  pinStraight,
  planRowShifts,
  proxyRowLinks,
  rectToFlow,
  slideToWishes,
  spanAlignedFrames,
  toFlow,
} from '../rowLayout.js';
import type { TreeData } from '../find-common-ancestor.js';

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

const group = (id: string, dir: string) => ({
  id,
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
const chain = (...ids: string[]) =>
  ids.slice(1).map((id, index) => ({
    id: `L_${ids[index]}_${id}_0`,
    start: ids[index],
    end: id,
    type: 'arrow_point',
  }));

/** The shop and warehouse rows: a buyer above, a link from the second shop step down. */
const shopAndWarehouse = (
  direction: string,
  groupDir: string,
  directedSubgraphs?: string
): any => ({
  direction,
  config: { elk: { directedSubgraphs } },
  nodes: [
    node('Buyer'),
    group('shop', groupDir),
    group('wh', groupDir),
    ...['Cart', 'Order', 'Pay', 'Receipt'].map((id) => node(id, 'shop')),
    ...['Pick', 'Pack', 'Ship'].map((id) => node(id, 'wh')),
  ],
  edges: [
    ...chain('Cart', 'Order', 'Pay', 'Receipt'),
    ...chain('Pick', 'Pack', 'Ship'),
    ...chain('Buyer', 'Cart'),
    ...chain('Order', 'Pick'),
  ],
});

/** Three rows that alternate LR and RL, linked end to start. */
const snake = (): any => ({
  direction: 'TB',
  config: { elk: { directedSubgraphs: 'aligned' } },
  nodes: [
    group('r1', 'LR'),
    group('r2', 'RL'),
    group('r3', 'LR'),
    ...['A1', 'A2', 'A3', 'A4'].map((id) => node(id, 'r1')),
    ...['B1', 'B2', 'B3', 'B4'].map((id) => node(id, 'r2')),
    ...['C1', 'C2', 'C3'].map((id) => node(id, 'r3')),
  ],
  edges: [
    ...chain('A1', 'A2', 'A3', 'A4'),
    ...chain('B1', 'B2', 'B3', 'B4'),
    ...chain('C1', 'C2', 'C3'),
    ...chain('A4', 'B1'),
    ...chain('B4', 'C1'),
  ],
});

const byId = (data: any) => new Map<string, any>(data.nodes.map((n: any) => [n.id, n]));
const edgeOf = (data: any, start: string, end: string) =>
  data.edges.find((e: any) => e.start === start && e.end === end);
const isVertical = (points: { x: number }[]) => points.every((p) => p.x === points[0].x);
const isHorizontal = (points: { y: number }[]) => points.every((p) => p.y === points[0].y);

describe('elk.directedSubgraphs: aligned', () => {
  it('puts each row under the link into it, and draws the links as straight lines', async () => {
    const data = shopAndWarehouse('TB', 'LR', 'aligned');
    await runElkLayoutCore(data, elkRenderContext);
    const nodes = byId(data);

    expect(nodes.get('Cart').x).toBe(nodes.get('Buyer').x);
    expect(nodes.get('Pick').x).toBe(nodes.get('Order').x);
    for (const [start, end] of [
      ['Buyer', 'Cart'],
      ['Order', 'Pick'],
    ]) {
      const { points } = edgeOf(data, start, end);
      expect(points).toHaveLength(2);
      expect(isVertical(points)).toBe(true);
      expect(points[0].y).toBe(nodes.get(start).y + NODE_HEIGHT / 2);
      expect(points[1].y).toBe(nodes.get(end).y - NODE_HEIGHT / 2);
    }
  });

  it('gives the rows one common width and left edge', async () => {
    const data = shopAndWarehouse('TB', 'LR', 'aligned');
    await runElkLayoutCore(data, elkRenderContext);
    const nodes = byId(data);
    const [shop, wh] = [nodes.get('shop'), nodes.get('wh')];

    expect(wh.width).toBe(shop.width);
    expect(wh.x).toBe(shop.x);
  });

  it('keeps every link inside a row straight', async () => {
    const data = shopAndWarehouse('TB', 'LR', 'aligned');
    await runElkLayoutCore(data, elkRenderContext);

    for (const [start, end] of [
      ['Cart', 'Order'],
      ['Order', 'Pay'],
      ['Pick', 'Pack'],
    ]) {
      expect(isHorizontal(edgeOf(data, start, end).points)).toBe(true);
    }
  });

  it('leaves the picture as it was with the option unset', async () => {
    const data = shopAndWarehouse('TB', 'LR');
    await runElkLayoutCore(data, elkRenderContext);
    const nodes = byId(data);

    expect(nodes.get('Pick').x).not.toBe(nodes.get('Order').x);
    expect(nodes.get('wh').width).not.toBe(nodes.get('shop').width);
  });

  it('runs a snake of LR and RL rows straight down from row to row', async () => {
    const data = snake();
    await runElkLayoutCore(data, elkRenderContext);
    const nodes = byId(data);

    expect(nodes.get('B1').x).toBe(nodes.get('A4').x);
    expect(nodes.get('C1').x).toBe(nodes.get('B4').x);
    expect(nodes.get('B4').x).toBeLessThan(nodes.get('B1').x);
    expect(isVertical(edgeOf(data, 'A4', 'B1').points)).toBe(true);
    expect(isVertical(edgeOf(data, 'B4', 'C1').points)).toBe(true);
    const widths = ['r1', 'r2', 'r3'].map((id) => nodes.get(id).width);
    expect(new Set(widths).size).toBe(1);
  });

  it('turns rows into columns in an LR diagram', async () => {
    const data = shopAndWarehouse('LR', 'TB', 'aligned');
    await runElkLayoutCore(data, elkRenderContext);
    const nodes = byId(data);

    expect(nodes.get('Cart').y).toBe(nodes.get('Buyer').y);
    expect(nodes.get('Pick').y).toBe(nodes.get('Order').y);
    expect(isHorizontal(edgeOf(data, 'Order', 'Pick').points)).toBe(true);
    expect(nodes.get('wh').height).toBe(nodes.get('shop').height);
    expect(nodes.get('wh').y).toBe(nodes.get('shop').y);
  });

  it('places the label of a link on its route', async () => {
    const data = shopAndWarehouse('TB', 'LR', 'aligned');
    Object.assign(edgeOf(data, 'Order', 'Pick'), { label: 'paid', width: 30, height: 14 });
    await runElkLayoutCore(data, elkRenderContext);
    const link = edgeOf(data, 'Order', 'Pick');

    expect(link.x).toBe(link.points[0].x);
    expect(link.y).toBeGreaterThan(link.points[0].y);
    expect(link.y).toBeLessThan(link.points[1].y);
  });
});

describe('the directedSubgraphs option', () => {
  afterEach(() => configApi.reset());

  it('defaults to default and survives a front-matter directive', () => {
    expect(configApi.getConfig().elk?.directedSubgraphs).toBe('default');
    configApi.addDirective({ elk: { directedSubgraphs: 'aligned' } });
    expect(configApi.getConfig().elk?.directedSubgraphs).toBe('aligned');
  });
});

describe('flow coordinates', () => {
  it.each(['DOWN', 'UP', 'RIGHT', 'LEFT'] as const)('round-trips a point in %s', (direction) => {
    const point = { x: 3, y: 7 };
    expect(fromFlow(toFlow(point, direction), direction)).toEqual(point);
  });

  it('runs the flow down y whatever the direction', () => {
    expect(toFlow({ x: 0, y: 10 }, 'DOWN').y).toBe(10);
    expect(toFlow({ x: 0, y: 10 }, 'UP').y).toBe(-10);
    expect(toFlow({ x: 10, y: 0 }, 'RIGHT').y).toBe(10);
    expect(toFlow({ x: 10, y: 0 }, 'LEFT').y).toBe(-10);
  });

  it('keeps a box a box', () => {
    expect(rectToFlow({ x: 1, y: 2, width: 30, height: 40 }, 'LEFT')).toEqual({
      x: 2,
      y: -31,
      width: 40,
      height: 30,
    });
  });
});

const rect = (x: number, y: number, width = 10, height = 10) => ({ x, y, width, height });
const item = (x: number, y: number, movable = true): RowItem => ({
  rect: rect(x, y, 100, 50),
  movable,
});
const link = (
  order: number,
  sourceItem: string,
  targetItem: string,
  sourceX: number,
  targetX: number
): RowLink => ({
  order,
  sourceItem,
  targetItem,
  id: `${sourceItem}-${targetItem}-${order}`,
  source: rect(sourceX, 20),
  target: rect(targetX, 120),
});

describe('planRowShifts', () => {
  it('lines an item up with its first link in source order', () => {
    const items = new Map([
      ['top', item(0, 0)],
      ['below', item(0, 100)],
    ]);
    const shifts = planRowShifts(items, [
      link(2, 'top', 'below', 40, 0),
      link(1, 'top', 'below', 30, 10),
    ]);
    expect([...shifts]).toEqual([['below', 20]]);
  });

  it('moves an item placed earlier by its own shift', () => {
    const items = new Map([
      ['a', item(0, 0)],
      ['b', item(0, 100)],
      ['c', item(0, 200)],
    ]);
    const shifts = planRowShifts(items, [
      link(1, 'a', 'b', 30, 0),
      { ...link(2, 'b', 'c', 0, 50), source: rect(0, 120), target: rect(50, 220) },
    ]);
    expect([...shifts]).toEqual([
      ['b', 30],
      ['c', -20],
    ]);
  });

  it('leaves nodes, items sharing a band and unlinked items where they are', () => {
    const items = new Map([
      ['node', item(0, 0, false)],
      ['left', item(0, 100)],
      ['right', item(200, 120)],
      ['alone', item(0, 300)],
    ]);
    const shifts = planRowShifts(items, [
      link(1, 'node', 'left', 30, 0),
      link(2, 'node', 'right', 30, 200),
      link(3, 'left', 'node', 0, 30),
    ]);
    expect(shifts.size).toBe(0);
  });
});

describe('labelSpot and commonSpan', () => {
  it('puts a label in the middle of the longest segment it covers nothing on', () => {
    const route = [
      { x: 0, y: 0 },
      { x: 0, y: 10 },
      { x: 40, y: 10 },
      { x: 40, y: 30 },
    ];
    expect(labelSpot(route, { width: 4, height: 4 }, [])).toEqual({ x: 20, y: 10 });
    const blocker = { x: 15, y: 5, width: 10, height: 10 };
    expect(labelSpot(route, { width: 4, height: 4 }, [blocker])).toEqual({ x: 40, y: 20 });
    expect(labelSpot(route, { width: 100, height: 100 }, [blocker])).toEqual({ x: 20, y: 10 });
  });

  it('spans from the leftmost start to the rightmost end', () => {
    expect(commonSpan([rect(10, 0, 50), rect(-5, 100, 20)])).toEqual({ start: -5, size: 65 });
  });
});

describe('spanAlignedFrames', () => {
  const frame = (posX: number, posY: number, width: number, height: number) => ({
    offset: { posX, posY, width, height },
  });

  it('widens stacked frames to one span and keeps where ELK put them', () => {
    const top = frame(10, 0, 50, 30);
    const below = frame(5, 50, 30, 30);
    const painted = {};
    spanAlignedFrames([{ box: top }, { box: below, painted }], 'DOWN');
    expect(top).toMatchObject({ offset: { posX: 5, width: 55 }, x: 32.5, width: 55 });
    expect(below).toMatchObject({ elkOrigin: { posX: 5, posY: 50 }, x: 32.5, y: 65 });
    expect(painted).toEqual({ x: 32.5, y: 65, width: 55, height: 30 });
  });

  it('leaves frames side by side as they are', () => {
    const left = frame(0, 0, 50, 30);
    const right = frame(100, 10, 50, 30);
    spanAlignedFrames([{ box: left }, { box: right }], 'DOWN');
    expect(left.offset.width).toBe(50);
    expect(right.offset.posX).toBe(100);
  });

  it('spans columns along y in an LR diagram', () => {
    const first = frame(0, 10, 50, 30);
    const second = frame(100, 0, 50, 20);
    spanAlignedFrames([{ box: first }, { box: second }], 'RIGHT');
    expect(first.offset).toMatchObject({ posY: 0, height: 40 });
    expect(second.offset).toMatchObject({ posY: 0, height: 40 });
  });
});

describe('proxyRowLinks', () => {
  const tree: TreeData = {
    parentById: { Cart: 'shop', Pick: 'wh', Order: 'shop' },
    childrenById: { shop: ['Cart', 'Order'], wh: ['Pick'] },
  };
  const edge = (id: string, source: string, target: string) => ({
    id,
    sources: [source],
    targets: [target],
  });

  it('links the items instead of nodes in different items, and keeps the rest', () => {
    const edges = [
      edge('a', 'Buyer', 'Cart'),
      edge('b', 'Cart', 'Order'),
      edge('c', 'Buyer', 'Seller'),
    ];
    const graph = { edges };
    proxyRowLinks(graph, tree, new Map([['shop', 'RIGHT' as const]]));
    expect(graph.edges).toEqual([
      { ...edge('a', 'Buyer', 'shop'), proxyOf: { sources: ['Buyer'], targets: ['Cart'] } },
      edge('b', 'Cart', 'Order'),
      edge('c', 'Buyer', 'Seller'),
    ]);
  });
});

describe('alignDirectedSubgraphs', () => {
  const tree: TreeData = {
    parentById: { Cart: 'shop', Order: 'shop', Pick: 'wh' },
    childrenById: { shop: ['Cart', 'Order'], wh: ['Pick'] },
  };
  const box = (
    id: string,
    x: number,
    y: number,
    width: number,
    height: number,
    children?: any[]
  ) => ({
    id,
    x,
    y,
    width,
    height,
    ...(children ? { children } : {}),
  });
  const laidOut = () => ({
    children: [
      box('Buyer', 0, 0, 90, 40),
      box('Seller', 300, 0, 90, 40),
      box('shop', 0, 100, 400, 80, [box('Cart', 20, 20, 90, 40), box('Order', 150, 20, 90, 40)]),
      box('wh', 100, 250, 300, 80, [box('Pick', 60, 20, 90, 40)]),
      box('Track', 0, 400, 90, 40),
    ],
    edges: [
      {
        id: 'buy',
        sources: ['Buyer'],
        targets: ['shop'],
        container: 'root',
        proxyOf: { sources: ['Buyer'], targets: ['Cart'] },
        labels: [{ width: 0, height: 0 }],
      },
      { id: 'inner', sources: ['Cart'], targets: ['Order'], container: 'shop' },
      { id: 'plain', sources: ['Buyer'], targets: ['Seller'], container: 'root' },
      { id: 'across', sources: ['Buyer'], targets: ['Track'], container: 'root' },
      {
        id: 'pick',
        sources: ['shop'],
        targets: ['wh'],
        container: 'root',
        proxyOf: { sources: ['Order'], targets: ['Pick'] },
        labels: [
          { width: 30, height: 14 },
          { x: 5, y: 5, width: 8, height: 8 },
        ],
      },
    ],
  });
  const separated = new Map([
    ['shop', 'RIGHT' as const],
    ['wh', 'RIGHT' as const],
  ]);
  const order = ['buy', 'inner', 'plain', 'across', 'pick'];
  const align = (graph: any, direction: 'DOWN' | 'RIGHT' = 'DOWN') =>
    alignDirectedSubgraphs({
      graph,
      tree,
      separated,
      direction,
      orderOf: (id) => order.indexOf(id),
    });

  it('spreads a row that keeps its links straight, shifts one that would not, and routes the links', () => {
    const graph = laidOut();
    align(graph);
    const [buyer, seller, shop, wh, track] = graph.children;
    expect([buyer.x, seller.x, track.x]).toEqual([0, 300, 0]);
    expect(shop.width).toBeGreaterThanOrEqual(wh.width);
    const [buy, inner, plain, across, pick] = graph.edges as any[];
    expect(buy).toMatchObject({ sources: ['Buyer'], targets: ['Cart'] });
    expect(buy.proxyOf).toBeUndefined();
    expect(buy.sections[0]).toMatchObject({ startPoint: { x: 45, y: 40 }, bendPoints: [] });
    expect(buy.sections[0].endPoint.x).toBe(45);
    expect(pick).toMatchObject({ sources: ['Order'], targets: ['Pick'] });
    const { startPoint, endPoint, bendPoints } = pick.sections[0];
    expect(bendPoints).toEqual([]);
    expect(startPoint.x).toBe(endPoint.x);
    expect(pick.labels[1]).toMatchObject({ x: 0, y: 0 });
    expect(inner).toEqual(laidOut().edges[1]);
    expect(plain).toEqual(laidOut().edges[2]);
    expect(across).toEqual(laidOut().edges[3]);
  });

  it('shifts columns along y in an LR diagram', () => {
    const graph = {
      children: [
        box('Buyer', 0, 0, 40, 90),
        box('shop', 100, 0, 80, 400, [box('Cart', 20, 20, 40, 90)]),
      ],
      edges: [
        {
          id: 'buy',
          sources: ['Buyer'],
          targets: ['shop'],
          container: 'root',
          proxyOf: { sources: ['Buyer'], targets: ['Cart'] },
        },
      ],
    };
    align(graph, 'RIGHT');
    expect(graph.children[1]).toMatchObject({ x: 100, y: -20 });
    expect((graph.edges[0] as any).sections[0]).toEqual({
      startPoint: { x: 40, y: 45 },
      bendPoints: [],
      endPoint: { x: 120, y: 45 },
    });
  });

  it('leaves a graph without a separated subgraph alone', () => {
    const graph = laidOut();
    alignDirectedSubgraphs({
      graph,
      tree,
      separated: new Map(),
      direction: 'DOWN',
      orderOf: () => 0,
    });
    expect(graph).toEqual(laidOut());
  });
});

/** Rows of five, two and three steps, the middle row's first step linked from the row above. */
const sharedEnd = (links: [string, string][]): any => ({
  direction: 'TB',
  config: { elk: { directedSubgraphs: 'aligned' } },
  nodes: [
    group('r1', 'LR'),
    group('r2', 'RL'),
    group('r3', 'LR'),
    ...['A1', 'A2', 'A3', 'A4', 'A5'].map((id) => node(id, 'r1')),
    ...['B1', 'B2'].map((id) => node(id, 'r2')),
    ...['C1', 'C2', 'C3'].map((id) => node(id, 'r3')),
  ],
  edges: [
    ...chain('A1', 'A2', 'A3', 'A4', 'A5'),
    ...chain('B1', 'B2'),
    ...chain('C1', 'C2', 'C3'),
    ...links.flatMap(([start, end]) => chain(start, end)),
  ],
});

/** The minimum arrowhead separation the gate asks for: an arrowhead and a pixel. */
const ARROWHEAD_APART = 9;

describe('links that end on one side of one node', () => {
  const tips = (data: any, links: [string, string][]) =>
    links.map(([start, end]) => edgeOf(data, start, end).points.at(-1));

  it('leaves a single link in the middle of the side', async () => {
    const data = sharedEnd([['A5', 'B1']]);
    await runElkLayoutCore(data, elkRenderContext);
    const [tip] = tips(data, [['A5', 'B1']]);
    expect(tip.x).toBe(byId(data).get('B1').x);
    expect(edgeOf(data, 'A5', 'B1').points).toHaveLength(2);
  });

  it('spreads two arrowheads apart and keeps the lined-up link straight', async () => {
    const links: [string, string][] = [
      ['A5', 'B1'],
      ['A1', 'B1'],
    ];
    const data = sharedEnd(links);
    await runElkLayoutCore(data, elkRenderContext);
    const [a, c] = tips(data, links);
    expect(Math.abs(a.x - c.x)).toBeGreaterThanOrEqual(ARROWHEAD_APART);
    expect(isVertical(edgeOf(data, 'A5', 'B1').points)).toBe(true);
  });

  it('spreads three arrowheads, each pair apart, with every turning link in a lane of its own', async () => {
    const links: [string, string][] = [
      ['A5', 'B1'],
      ['A1', 'B1'],
      ['A3', 'B1'],
    ];
    const data = sharedEnd(links);
    await runElkLayoutCore(data, elkRenderContext);
    const xs = tips(data, links)
      .map((tip: { x: number }) => tip.x)
      .sort((p, q) => p - q);
    expect(xs[1] - xs[0]).toBeGreaterThanOrEqual(ARROWHEAD_APART);
    expect(xs[2] - xs[1]).toBeGreaterThanOrEqual(ARROWHEAD_APART);
    const lanes = links
      .map(([start, end]) => edgeOf(data, start, end).points)
      .filter((points: unknown[]) => points.length > 2)
      .map((points: { y: number }[]) => points[1].y);
    expect(new Set(lanes).size).toBe(lanes.length);
  });
});

describe('spreading link ends', () => {
  it('packs points apart in the order of their wishes', () => {
    expect(packAlong([50, 50], 0, 100, 20)).toEqual([50, 70]);
    expect(packAlong([95, 90], 0, 100, 20)).toEqual([100, 80]);
  });

  it('slides packed points so the most of them sit on their wish', () => {
    expect(slideToWishes([10, 30], [40, 0], 0, 100)).toEqual([40, 60]);
    expect(slideToWishes([10, 30], [95, 0], 0, 100)).toEqual([10, 30]);
  });

  it('pins the points that can run straight and fits the rest between them in order', () => {
    const positions = pinStraight([115, 300, 415, 485], 44, 186, 35.5);
    expect(positions[0]).toBe(115);
    expect(positions.slice(1).map((p) => Math.round(p * 100) / 100)).toEqual([138.67, 162.33, 186]);
  });
});

describe('spreading around pins', () => {
  it('moves a point that does not fit beside a pin to the nearest free spot', () => {
    expect(pinStraight([50, 10], 45, 100, 20)).toEqual([50, 59]);
  });
});

/** A lead row, a band of three columns written A, C, B, and a row under the band. */
const bands = (directedSubgraphs?: string): any => ({
  direction: 'TB',
  config: { elk: { directedSubgraphs } },
  nodes: [
    group('lead', 'LR'),
    ...['P1', 'P2', 'P3', 'P4'].map((id) => node(id, 'lead')),
    group('band', 'LR'),
    ...['colA', 'colC', 'colB'].map((id) => ({ ...group(id, 'TB'), parentId: 'band' })),
    ...['A1', 'A2', 'A3'].map((id) => node(id, 'colA')),
    ...['C1', 'C2', 'C3'].map((id) => node(id, 'colC')),
    ...['B1', 'B2', 'B3'].map((id) => node(id, 'colB')),
    group('ops', 'LR'),
    ...['O1', 'O2'].map((id) => node(id, 'ops')),
  ],
  edges: [
    ...chain('P1', 'P2', 'P3'),
    ...chain('A1', 'A2', 'A3'),
    ...chain('C1', 'C2', 'C3'),
    ...chain('B1', 'B2', 'B3'),
    ...chain('O1', 'O2'),
    ...chain('P3', 'A1'),
    ...chain('P3', 'B1'),
    ...chain('P1', 'C1'),
    ...chain('P3', 'A2'),
    ...chain('C3', 'A2'),
    ...chain('C3', 'B2'),
    ...chain('P4', 'O1'),
  ],
});

const rectOf = (n: any) => ({
  x: n.x - n.width / 2,
  y: n.y - n.height / 2,
  width: n.width,
  height: n.height,
});
const passesThrough = (points: { x: number; y: number }[], n: any) => {
  const { x, y, width, height } = rectOf(n);
  return points.slice(1).some((b, index) => {
    const a = points[index];
    const [x1, x2] = [Math.min(a.x, b.x), Math.max(a.x, b.x)];
    const [y1, y2] = [Math.min(a.y, b.y), Math.max(a.y, b.y)];
    return x1 < x + width - 1 && x2 > x + 1 && y1 < y + height - 1 && y2 > y + 1;
  });
};

describe('a band of columns between two rows', () => {
  it('keeps the rows in the order written, and the columns side by side in it, of one height', async () => {
    const data = bands('aligned');
    await runElkLayoutCore(data, elkRenderContext);
    const nodes = byId(data);
    const [lead, band, ops] = ['lead', 'band', 'ops'].map((id) => nodes.get(id));
    expect(lead.y).toBeLessThan(band.y);
    expect(band.y).toBeLessThan(ops.y);
    const [a, c, b] = ['colA', 'colC', 'colB'].map((id) => nodes.get(id));
    expect(a.x).toBeLessThan(c.x);
    expect(c.x).toBeLessThan(b.x);
    expect(new Set([a, c, b].map(({ height }) => height)).size).toBe(1);
  });

  it('drops a link from the lead row into the top of a column', async () => {
    const data = bands('aligned');
    await runElkLayoutCore(data, elkRenderContext);
    const { points } = edgeOf(data, 'P3', 'A1');
    expect(points.length).toBeLessThanOrEqual(4);
    const [beforeTop, top] = points.slice(-2);
    expect(beforeTop.x).toBe(top.x);
    expect(top.y).toBe(byId(data).get('A1').y - NODE_HEIGHT / 2);
    const enter = edgeOf(data, 'P1', 'C1').points;
    const [beforeEnd, end] = enter.slice(-2);
    expect(beforeEnd.x).toBe(end.x);
    expect(end.y).toBe(byId(data).get('C1').y - NODE_HEIGHT / 2);
  });

  it('takes a link into a later node of a column down a corridor, past the first node', async () => {
    const data = bands('aligned');
    await runElkLayoutCore(data, elkRenderContext);
    const nodes = byId(data);
    const { points } = edgeOf(data, 'P3', 'A2');
    expect(passesThrough(points, nodes.get('A1'))).toBe(false);
    const [beforeEnd, end] = points.slice(-2);
    expect(beforeEnd.y).toBe(end.y);
    const a2 = rectOf(nodes.get('A2'));
    expect(end.y).toBeGreaterThan(a2.y);
    expect(end.y).toBeLessThan(a2.y + a2.height);
  });

  it('runs a link between two columns in the gap between them, side to side', async () => {
    const data = bands('aligned');
    await runElkLayoutCore(data, elkRenderContext);
    const nodes = byId(data);
    const { points } = edgeOf(data, 'C3', 'A2');
    const [a, c] = [rectOf(nodes.get('A2')), rectOf(nodes.get('C3'))];
    expect(points[0].x).toBe(c.x);
    expect(points.at(-1).x).toBe(a.x + a.width);
    for (const point of points.slice(1, -1)) {
      expect(point.x).toBeGreaterThan(a.x + a.width);
      expect(point.x).toBeLessThan(c.x);
    }
  });

  it('leaves the band to ELK with the option unset', async () => {
    const data = bands();
    await runElkLayoutCore(data, elkRenderContext);
    const [a, c, b] = ['colA', 'colC', 'colB'].map((id) => byId(data).get(id));
    expect(a.x < c.x && c.x < b.x).toBe(false);
  });
});

/** A node of a given size: the sizes of the steps of a real four-row pipeline. */
const sized = (id: string, parentId: string, width: number, height: number) => ({
  ...node(id, parentId),
  width,
  height,
});

/** Four rows; the second row's last step and the third row's last step both link into the fourth row's first. */
const stages = (): any => ({
  direction: 'TB',
  config: { elk: { directedSubgraphs: 'aligned' } },
  nodes: [
    group('r0', 'LR'),
    sized('S1', 'r0', 152, 72),
    sized('S2', 'r0', 176, 96),
    group('r1', 'LR'),
    sized('A1', 'r1', 152, 120),
    sized('A2', 'r1', 171, 48),
    sized('A3', 'r1', 152, 48),
    sized('A4', 'r1', 185, 72),
    sized('A5', 'r1', 152, 48),
    group('r2', 'LR'),
    sized('B1', 'r2', 152, 120),
    sized('B2', 'r2', 152, 48),
    sized('B3', 'r2', 180, 120),
    group('r3', 'RL'),
    sized('C1', 'r3', 152, 72),
    sized('C2', 'r3', 152, 48),
    sized('C3', 'r3', 174, 72),
    sized('C4', 'r3', 152, 72),
    sized('C5', 'r3', 152, 72),
  ],
  edges: [
    ...chain('S1', 'S2'),
    ...chain('A1', 'A2', 'A3', 'A4', 'A5'),
    ...chain('B1', 'B2', 'B3'),
    ...chain('C1', 'C2', 'C3', 'C4', 'C5'),
    ...chain('S2', 'A4'),
    ...chain('A5', 'C1'),
    ...chain('B3', 'C1'),
  ],
});

describe('spreading the ends of links that pass a row', () => {
  it('never moves a link that skips a row into a node of that row', async () => {
    const data = stages();
    await runElkLayoutCore(data, elkRenderContext);
    const nodes = byId(data);
    const leaves = data.nodes.filter((n: any) => !n.isGroup);
    for (const [start, end] of [
      ['A5', 'C1'],
      ['B3', 'C1'],
      ['S2', 'A4'],
    ]) {
      const { points } = edgeOf(data, start, end);
      for (const other of leaves.filter((n: any) => n.id !== start && n.id !== end)) {
        expect(passesThrough(points, nodes.get(other.id)), `${start}->${end} x ${other.id}`).toBe(
          false
        );
      }
    }
  });
});

describe('meetsSquarely', () => {
  const from = { x: 0, y: 0, width: 100, height: 40 };
  const to = { x: 0, y: 100, width: 100, height: 40 };

  it('accepts a route that leaves and enters square to the sides it touches', () => {
    expect(
      meetsSquarely(
        [
          { x: 50, y: 40 },
          { x: 50, y: 100 },
        ],
        [from, to]
      )
    ).toBe(true);
    expect(
      meetsSquarely(
        [
          { x: 100, y: 20 },
          { x: 120, y: 20 },
          { x: 120, y: 70 },
          { x: 50, y: 70 },
          { x: 50, y: 100 },
        ],
        [from, to]
      )
    ).toBe(true);
  });

  it('rejects a route that runs along the edge of the node it leaves, or has an empty segment', () => {
    expect(
      meetsSquarely(
        [
          { x: 100, y: 20 },
          { x: 100, y: 100 },
        ],
        [from, { ...to, x: 50 }]
      )
    ).toBe(false);
    expect(
      meetsSquarely(
        [
          { x: 50, y: 40 },
          { x: 50, y: 40 },
          { x: 50, y: 100 },
        ],
        [from, to]
      )
    ).toBe(false);
  });
});
