import { describe, it, expect, afterEach } from 'vitest';
import * as configApi from '../../../../config.js';
import { runElkLayoutCore } from '../render.js';
import {
  type RowItem,
  type RowLink,
  alignDirectedSubgraphs,
  assignLanes,
  commonSpan,
  fromFlow,
  labelCentre,
  packAlong,
  pinStraight,
  planRowShifts,
  proxyRowLinks,
  rectToFlow,
  routeRowLink,
  slideToWishes,
  spanAlignedFrames,
  spreadSharedEnds,
  titleSpans,
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
  sourceNode: `${sourceItem}-node`,
  targetNode: `${targetItem}-node`,
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

describe('routeRowLink', () => {
  const items = new Map([
    ['top', item(0, 0)],
    ['below', item(0, 100)],
  ]);

  it('draws a straight line between lined-up ends', () => {
    expect(routeRowLink(link(1, 'top', 'below', 30, 30), items, new Map())).toEqual([
      { x: 35, y: 30 },
      { x: 35, y: 120 },
    ]);
  });

  it('turns twice in the middle of the gap otherwise, after the shifts', () => {
    expect(routeRowLink(link(1, 'top', 'below', 30, 30), items, new Map([['below', 20]]))).toEqual([
      { x: 35, y: 30 },
      { x: 35, y: 75 },
      { x: 55, y: 75 },
      { x: 55, y: 120 },
    ]);
  });

  it('runs upwards from the top of the source to a target above it', () => {
    const up = { ...link(1, 'below', 'top', 0, 0), source: rect(30, 120), target: rect(30, 20) };
    expect(routeRowLink(up, items, new Map())).toEqual([
      { x: 35, y: 120 },
      { x: 35, y: 30 },
    ]);
  });

  it('leaves a link between items in one band to ELK', () => {
    const side = new Map([...items, ['beside', item(200, 10)]]);
    expect(routeRowLink(link(1, 'top', 'beside', 30, 230), side, new Map())).toBeUndefined();
  });
});

describe('labelCentre and commonSpan', () => {
  it('puts a label in the middle of the middle segment', () => {
    expect(
      labelCentre([
        { x: 0, y: 0 },
        { x: 0, y: 10 },
        { x: 20, y: 10 },
        { x: 20, y: 30 },
      ])
    ).toEqual({ x: 10, y: 10 });
    expect(
      labelCentre([
        { x: 0, y: 0 },
        { x: 0, y: 10 },
      ])
    ).toEqual({ x: 0, y: 5 });
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
    proxyRowLinks(edges, tree, new Map([['shop', 'RIGHT' as const]]));
    expect(edges).toEqual([
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

  it('shifts each row under its first link and routes the links straight', () => {
    const graph = laidOut();
    align(graph);
    const [buyer, seller, shop, wh, track] = graph.children;
    expect([buyer.x, seller.x, shop.x, wh.x, track.x]).toEqual([0, 300, -20, 70, 0]);
    const [buy, inner, plain, across, pick] = graph.edges as any[];
    expect(buy).toMatchObject({
      sources: ['Buyer'],
      targets: ['Cart'],
      sections: [{ startPoint: { x: 45, y: 40 }, bendPoints: [], endPoint: { x: 45, y: 120 } }],
      crossings: [{ groupId: 'shop', point: { x: 45, y: 100 } }],
    });
    expect(buy.proxyOf).toBeUndefined();
    expect(pick).toMatchObject({
      sources: ['Order'],
      targets: ['Pick'],
      sections: [{ startPoint: { x: 175, y: 160 }, bendPoints: [], endPoint: { x: 175, y: 270 } }],
      crossings: [
        { groupId: 'shop', point: { x: 175, y: 180 } },
        { groupId: 'wh', point: { x: 175, y: 250 } },
      ],
      labels: [
        { x: 160, y: 208 },
        { x: 0, y: 0 },
      ],
    });
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

/** Rows of five, two and three steps; the first and last both link into the middle row's first step. */
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
      ['C3', 'B1'],
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
      ['C3', 'B1'],
      ['C1', 'B1'],
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

  it('gives turning links of one gap their own lanes, the rightmost start lowest when running left', () => {
    const ends = (startX: number, endX: number) => ({
      start: { x: startX, y: 0 },
      end: { x: endX, y: 100 },
      gap: 50,
      gapTop: 20,
      gapBottom: 80,
    });
    const near = ends(100, 10);
    const far = ends(200, 20);
    const straight = ends(30, 30);
    const alone = { ...ends(300, 250), gapTop: 120, gapBottom: 180 };
    assignLanes([far, near, straight, alone]);
    expect([near.gap, far.gap, straight.gap, alone.gap]).toEqual([40, 60, 50, 150]);
  });
});

describe('spreading around pins and titles', () => {
  it('moves a point that does not fit beside a pin to the nearest free spot', () => {
    expect(pinStraight([50, 10], 45, 100, 20)).toEqual([50, 59]);
  });

  it('keeps spread ends off the title above the side when the rest of the side holds them', () => {
    const ends = (wish: number) => ({
      start: { x: wish, y: 0 },
      end: { x: 100, y: 100 },
      gap: 50,
      gapTop: 20,
      gapBottom: 80,
    });
    const node = { x: 0, y: 100, width: 200, height: 40 };
    const [a, b] = [ends(100), ends(110)];
    spreadSharedEnds(
      new Map([
        [
          'n',
          [
            { ends: a, at: 'end' as const, node, title: [80, 120] as const },
            { ends: b, at: 'end' as const, node, title: [80, 120] as const },
          ],
        ],
      ])
    );
    for (const { end } of [a, b]) {
      expect(end.x <= 80 || end.x >= 120).toBe(true);
    }
    expect(Math.abs(a.end.x - b.end.x)).toBeGreaterThanOrEqual(ARROWHEAD_APART);
  });

  it('ignores the title when the rest of the side is too short', () => {
    const node = { x: 0, y: 100, width: 40, height: 40 };
    const one = {
      start: { x: 20, y: 0 },
      end: { x: 20, y: 100 },
      gap: 50,
      gapTop: 20,
      gapBottom: 80,
    };
    const two = { ...one, start: { x: 25, y: 0 }, end: { x: 20, y: 100 } };
    spreadSharedEnds(
      new Map([
        [
          'n',
          [
            { ends: one, at: 'end' as const, node, title: [0, 40] as const },
            { ends: two, at: 'end' as const, node, title: [0, 40] as const },
          ],
        ],
      ])
    );
    expect(Math.abs(one.end.x - two.end.x)).toBeGreaterThanOrEqual(ARROWHEAD_APART);
  });

  it('centres a title on the common span of stacked frames, and on its own frame otherwise', () => {
    const children = [
      { id: 'a', labels: [{ width: 40 }] },
      { id: 'b', labels: [{ width: 20 }] },
      { id: 'c', labels: [{ width: 20 }] },
      { id: 'd', labels: [{ width: 20 }] },
    ];
    const frames = new Map([
      ['a', { x: 0, y: 0, width: 100, height: 50 }],
      ['b', { x: 50, y: 100, width: 150, height: 50 }],
      ['c', { x: 0, y: 200, width: 60, height: 50 }],
      ['d', { x: 100, y: 210, width: 60, height: 50 }],
    ]);
    const titles = titleSpans(children, frames, 'DOWN');
    expect(titles.get('a')).toEqual([79, 121]);
    expect(titles.get('b')).toEqual([89, 111]);
    expect(titles.get('c')).toEqual([19, 41]);
    expect(titleSpans(children, frames, 'RIGHT').size).toBe(0);
  });

  it('orders lanes for links running right, and puts links running left above them', () => {
    const ends = (startX: number, endX: number, down = true) => ({
      start: { x: startX, y: down ? 0 : 100 },
      end: { x: endX, y: down ? 100 : 0 },
      gap: 50,
      gapTop: 20,
      gapBottom: 100,
    });
    const rightNear = ends(10, 100);
    const rightFar = ends(20, 200);
    const leftUp = ends(300, 250, false);
    assignLanes([rightNear, rightFar, leftUp]);
    expect([leftUp.gap, rightFar.gap, rightNear.gap]).toEqual([40, 60, 80]);
  });
});
