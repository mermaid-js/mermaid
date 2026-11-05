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
  spreadKeepsTurns,
  freeRange,
  titleAbove,
  sideOf,
  thinBoxes,
  nearestFree,
  endMarks,
  keepOffDrawnEnds,
  gapsBetween,
  channelFromFlow,
  borderHits,
  markerReach,
  END_MARKERS,
  END_SPACING,
} from '../rowLayout.js';
import type { Terminal } from '../rowLayout.js';
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

  it('aligns the rows with the option unset, as it is by default', async () => {
    const data = shopAndWarehouse('TB', 'LR');
    await runElkLayoutCore(data, elkRenderContext);
    const nodes = byId(data);

    expect(nodes.get('Pick').x).toBe(nodes.get('Order').x);
    expect(nodes.get('wh').width).toBe(nodes.get('shop').width);
  });

  it('leaves the rows to ELK with the option set to ports', async () => {
    const data = shopAndWarehouse('TB', 'LR', 'ports');
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

  it('defaults to aligned and survives a front-matter directive', () => {
    expect(configApi.getConfig().elk?.directedSubgraphs).toBe('aligned');
    configApi.addDirective({ elk: { directedSubgraphs: 'ports' } });
    expect(configApi.getConfig().elk?.directedSubgraphs).toBe('ports');
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

describe('end spacing', () => {
  it('measures how far each end marker reaches across its link', () => {
    expect(markerReach(END_MARKERS.point)).toBeCloseTo(12.78, 2);
    expect(markerReach(END_MARKERS.circle)).toBe(14);
    expect(markerReach(END_MARKERS.cross)).toBe(12);
  });

  it('keeps two link ends the widest marker and a pixel apart', () => {
    expect(END_SPACING).toBe(15);
  });
});

describe('spreadKeepsTurns', () => {
  it('lets a link that turned turn once more when its row is spread', () => {
    expect(spreadKeepsTurns(1, 2)).toBe(true);
    expect(spreadKeepsTurns(1, 3)).toBe(false);
  });

  it('keeps a straight link straight', () => {
    expect(spreadKeepsTurns(0, 0)).toBe(true);
    expect(spreadKeepsTurns(0, 1)).toBe(false);
  });
});

describe('a link between the frames of one group that has no free way through', () => {
  const tree: TreeData = {
    parentById: { r1: 'band', mid: 'band', r2: 'band', A: 'r1', M: 'mid', B: 'r2' },
    childrenById: { band: ['r1', 'mid', 'r2'], r1: ['A'], mid: ['M'], r2: ['B'] },
  };
  const frame = (id: string, y: number, leaf: string) => ({
    id,
    x: 10,
    y,
    width: 380,
    height: 80,
    children: [{ id: leaf, x: 150, y: 20, width: 90, height: 40 }],
  });
  // The frames touch, so no band lies between them for the link to cross.
  const touching = () => ({
    children: [
      {
        id: 'band',
        x: 0,
        y: 0,
        width: 400,
        height: 260,
        children: [frame('r1', 10, 'A'), frame('mid', 90, 'M'), frame('r2', 170, 'B')],
      },
    ],
    edges: [] as any[],
  });
  const withheld = () => ({ id: 'jump', sources: ['A'], targets: ['B'], container: 'band' });

  const align = (graph: ReturnType<typeof touching>, link: any) =>
    alignDirectedSubgraphs({
      graph,
      tree,
      separated: new Map([
        ['band', 'DOWN' as const],
        ...['r1', 'mid', 'r2'].map((id): [string, 'RIGHT'] => [id, 'RIGHT']),
      ]),
      direction: 'DOWN',
      orderOf: () => 0,
      withheld: [link],
      groups: [{ frames: ['r1', 'mid', 'r2'], direction: 'DOWN' }],
    });

  it('is still drawn along the flow, from the side of one frame to the side of the other', () => {
    const link: any = withheld();
    align(touching(), link);
    const [section] = link.sections;
    expect(link.sections).toHaveLength(1);
    const points = [section.startPoint, ...section.bendPoints, section.endPoint];
    expect(
      points.slice(1).every((p: any, i: number) => p.x === points[i].x || p.y === points[i].y)
    ).toBe(true);
    expect(section.startPoint.y).toBeLessThan(section.endPoint.y);
  });

  it('keeps the route ELK drew for a link it did lay out', () => {
    const drawn = { startPoint: { x: 1, y: 2 }, bendPoints: [], endPoint: { x: 3, y: 4 } };
    const link: any = { ...withheld(), sections: [drawn] };
    align(touching(), link);
    expect(link.sections).toEqual([drawn]);
  });

  it('leaves a link between overlapping frames without a route', () => {
    const graph = touching();
    graph.children[0].children[2].y = 60;
    const link: any = withheld();
    align(graph, link);
    expect(link.sections).toBeUndefined();
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

  /**
   * A row of two steps over a row whose bent inner link keeps it from spreading, so it is shifted
   * to keep the link from the row above straight.
   */
  const followingRows = (linked: boolean) => ({
    children: [
      box('top', 0, 0, 400, 80, [box('A', 20, 20, 90, 40), box('B', 130, 20, 90, 40)]),
      box('mid', 0, 150, 300, 80, [box('C', 20, 20, 90, 40), box('D', 190, 20, 90, 40)]),
    ],
    edges: [
      {
        id: 'bent',
        sources: ['C'],
        targets: ['D'],
        container: 'mid',
        sections: [
          {
            startPoint: { x: 110, y: 40 },
            bendPoints: [
              { x: 150, y: 40 },
              { x: 150, y: 50 },
            ],
            endPoint: { x: 190, y: 50 },
          },
        ],
      },
      ...(linked
        ? [
            {
              id: 'down',
              sources: ['top'],
              targets: ['mid'],
              container: 'root',
              proxyOf: { sources: ['B'], targets: ['C'] },
            },
          ]
        : []),
    ],
  });
  const alignRows = (graph: any) =>
    alignDirectedSubgraphs({
      graph,
      tree: {
        parentById: { A: 'top', B: 'top', C: 'mid', D: 'mid' },
        childrenById: { top: ['A', 'B'], mid: ['C', 'D'] },
      },
      separated: new Map([
        ['top', 'RIGHT' as const],
        ['mid', 'RIGHT' as const],
      ]),
      direction: 'DOWN',
      orderOf: () => 0,
    });
  const spanOf = ({ children }: { children: { x: number; width: number }[] }) =>
    Math.max(...children.map(({ x, width }) => x + width)) -
    Math.min(...children.map(({ x }) => x));

  it('spreads a row whose spreading moves no other row', () => {
    const graph = followingRows(false);
    alignRows(graph);
    expect(graph.children[0].children?.map(({ x }) => x)).toEqual([20, 290]);
    expect(spanOf(graph)).toBe(400);
  });

  it('keeps a row together when spreading it would push a row it leads past the span', () => {
    const graph = followingRows(true);
    alignRows(graph);
    expect(graph.children[0].children?.map(({ x }) => x)).toEqual([20, 130]);
    expect(spanOf(graph)).toBeLessThanOrEqual(410);
  });

  it('keeps a routed link end clear of a loop ELK drew on the same side', () => {
    const free = laidOut();
    align(free);
    const wh = free.children[3];
    const straight = (free.edges[4] as any).sections[0].endPoint.x - wh.x;
    const loop = {
      id: 'loop',
      sources: ['Pick'],
      targets: ['Pick'],
      container: 'wh',
      sections: [
        {
          startPoint: { x: straight - 5, y: 20 },
          bendPoints: [
            { x: straight - 5, y: 10 },
            { x: straight + 5, y: 10 },
          ],
          endPoint: { x: straight + 5, y: 20 },
        },
      ],
    };
    const graph = { ...laidOut(), edges: [...laidOut().edges, loop] };
    align(graph);
    const end = (graph.edges[4] as any).sections[0].endPoint;
    const origin = graph.children[3].x;
    expect(end.y).toBe(graph.children[3].y + 20);
    for (const loopEnd of [straight - 5, straight + 5]) {
      expect(Math.abs(end.x - origin - loopEnd)).toBeGreaterThanOrEqual(END_SPACING);
    }
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

/** The least distance between two link ends on one side: the widest end marker and a pixel. */
const ARROWHEAD_APART = END_SPACING;

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

  it('leaves packed points as they are when they are wider than the side', () => {
    const side = { low: 0, high: 7 };
    const packed = packAlong([3, 4], side.low, side.high, END_SPACING);
    expect(packed[1] - packed[0]).toBeGreaterThan(side.high - side.low);
    expect(slideToWishes(packed, [3, 4], side.low, side.high)).toEqual(packed);
  });

  it('pins the points that can run straight and fits the rest between them in order', () => {
    const positions = pinStraight([115, 300, 415, 485], 44, 186, 35.5);
    expect(positions[0]).toBe(115);
    expect(positions.slice(1).map((p) => Math.round(p * 100) / 100)).toEqual([138.67, 162.33, 186]);
  });
});

describe('spreading around pins', () => {
  it('moves a point that does not fit beside a pin to the nearest free spot', () => {
    expect(pinStraight([50, 10], 45, 100, 20)).toEqual([50, 50 + END_SPACING]);
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

  it('leaves the band to ELK with the option set to ports', async () => {
    const data = bands('ports');
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

describe('the room on a node side', () => {
  it('keeps the ends clear of the corners', () => {
    expect(freeRange(0, 100, 2)).toEqual([END_SPACING, 100 - END_SPACING]);
  });

  it('ignores a title that lies beyond the usable side', () => {
    expect(freeRange(0, 100, 2, [0, 10])).toEqual([END_SPACING, 100 - END_SPACING]);
    expect(freeRange(0, 100, 2, [90, 100])).toEqual([END_SPACING, 100 - END_SPACING]);
  });

  it('takes the wider stretch beside a title, the left one on a tie', () => {
    expect(freeRange(0, 100, 2, [40, 60])).toEqual([END_SPACING, 40]);
    expect(freeRange(0, 100, 2, [30, 50])).toEqual([50, 100 - END_SPACING]);
    expect(freeRange(0, 100, 2, [10, 30])).toEqual([30, 100 - END_SPACING]);
  });

  it('uses the whole side when the stretch beside the title cannot hold every end', () => {
    expect(freeRange(0, 100, 3, [40, 60])).toEqual([END_SPACING, 100 - END_SPACING]);
    expect(freeRange(0, 100, 2, [40, 60])).not.toEqual([END_SPACING, 100 - END_SPACING]);
  });

  it('finds the title right above a node, and only that one', () => {
    const node = { x: 0, y: 100, width: 100, height: 40 };
    const title = (x: number, y: number, width = 20) => ({ x, y, width, height: 10 });
    expect(titleAbove(node, [title(40, 80)])).toEqual([40, 60]);
    expect(titleAbove(node, [title(40, 90)])).toEqual([40, 60]);
    expect(titleAbove(node, [title(-10, 80)])).toEqual([-10, 10]);
    expect(titleAbove(node, [title(40, 150)])).toBeUndefined();
    expect(titleAbove(node, [title(100, 80)])).toBeUndefined();
    expect(titleAbove(node, [title(-20, 80)])).toBeUndefined();
    expect(titleAbove(node, [title(40, 95)])).toBeUndefined();
  });
});

describe('end geometry', () => {
  it('names the side a route end leaves by and the axis along it', () => {
    const at = { x: 0, y: 0 };
    expect(sideOf(at, { x: 0, y: 10 })).toEqual({ side: 'bottom', along: 'x' });
    expect(sideOf(at, { x: 0, y: -10 })).toEqual({ side: 'top', along: 'x' });
    expect(sideOf(at, { x: 10, y: 0 })).toEqual({ side: 'right', along: 'y' });
    expect(sideOf(at, { x: -10, y: 0 })).toEqual({ side: 'left', along: 'y' });
  });

  it('wraps each segment of a line in a box as wide as a line', () => {
    expect(
      thinBoxes([
        { x: 10, y: 0 },
        { x: 0, y: 0 },
        { x: 0, y: 20 },
      ])
    ).toEqual([
      { x: -1, y: -1, width: 12, height: 2 },
      { x: -1, y: -1, width: 2, height: 22 },
    ]);
  });

  it('marks the room each end of a drawn link takes along its side', () => {
    expect(
      endMarks([
        { x: 10, y: 0 },
        { x: 10, y: 20 },
        { x: 30, y: 20 },
      ])
    ).toEqual([
      { x: 10 - END_SPACING, y: -1, width: 2 * END_SPACING, height: 2 },
      { x: 29, y: 20 - END_SPACING, width: 2, height: 2 * END_SPACING },
    ]);
    expect(endMarks([{ x: 0, y: 0 }])).toEqual([]);
  });

  it('finds the free spot nearest the wish, apart from the taken ones', () => {
    expect(nearestFree(50, [], [0, 100], 15)).toBe(50);
    expect(nearestFree(50, [50], [0, 100], 15)).toBe(35);
    expect(nearestFree(52, [50], [0, 100], 15)).toBe(65);
    expect(nearestFree(120, [], [0, 100], 15)).toBe(100);
    expect(nearestFree(5, [10], [0, 100], 15)).toBe(25);
    expect(nearestFree(50, [40, 60], [40, 60], 15)).toBe(50);
  });
});

describe('ends beside a drawn link', () => {
  const node = { x: 0, y: 0, width: 100, height: 40 };
  const above = { x: 0, y: -100, width: 100, height: 40 };
  const terminal = (x: number): Terminal => ({
    route: {
      points: [
        { x, y: 0 },
        { x, y: -60 },
      ],
      channels: [undefined],
    },
    index: 0,
    node,
    key: 'n-top',
    along: 'x',
    wish: x,
    ends: [node, above],
  });

  it('moves an end off a drawn link that meets the same side', () => {
    const end = terminal(50);
    keepOffDrawnEnds([end], [{ x: 45, y: 0 }], [], []);
    expect(end.route.points[0]).toEqual({ x: 60, y: 0 });
  });

  it('leaves an end alone when the drawn link meets another side or lies far enough', () => {
    for (const drawn of [
      { x: 45, y: 40 },
      { x: 150, y: 0 },
      { x: 50 - END_SPACING, y: 0 },
    ]) {
      const end = terminal(50);
      keepOffDrawnEnds([end], [drawn], [], []);
      expect(end.route.points[0]).toEqual({ x: 50, y: 0 });
    }
  });

  it('keeps a moved end clear of the other ends on the side too', () => {
    const [moved, other] = [terminal(50), terminal(72)];
    keepOffDrawnEnds([moved, other], [{ x: 50, y: 0 }], [], []);
    const x = moved.route.points[0].x;
    expect(Math.abs(x - 50)).toBeGreaterThanOrEqual(END_SPACING);
    expect(Math.abs(x - 72)).toBeGreaterThanOrEqual(END_SPACING);
  });
});

describe('flow geometry helpers', () => {
  const rect = (y: number, height: number) => ({ x: 0, y, width: 100, height });

  it('finds the free bands between two items, merging the items that overlap between them', () => {
    const between = [rect(100, 40), rect(120, 60), rect(400, 20), rect(20, 40)];
    expect(gapsBetween(rect(0, 40), rect(300, 40), between)).toEqual([
      [40, 100],
      [180, 300],
    ]);
    expect(gapsBetween(rect(0, 40), rect(300, 40), [])).toEqual([[40, 300]]);
  });

  it('gives no bands when an item between leaves no gap before it', () => {
    expect(gapsBetween(rect(0, 40), rect(300, 40), [rect(40, 40)])).toEqual([]);
    expect(gapsBetween(rect(0, 40), rect(300, 40), [rect(100, 200)])).toEqual([]);
  });

  it('turns a channel from flow coordinates back into the diagram', () => {
    const across = { axis: 'x' as const, low: 10, high: 20 };
    const along = { axis: 'y' as const, low: 10, high: 20 };
    expect(channelFromFlow(across, 'DOWN')).toEqual(across);
    expect(channelFromFlow(across, 'RIGHT')).toEqual({ ...across, axis: 'y' });
    expect(channelFromFlow(across, 'LEFT')).toEqual({ ...across, axis: 'y' });
    expect(channelFromFlow(along, 'DOWN')).toEqual(along);
    expect(channelFromFlow(along, 'UP')).toEqual({ axis: 'y', low: -20, high: -10 });
    expect(channelFromFlow(along, 'RIGHT')).toEqual({ axis: 'x', low: 10, high: 20 });
    expect(channelFromFlow(along, 'LEFT')).toEqual({ axis: 'x', low: -20, high: -10 });
  });

  it('finds where a segment passes the border of a frame', () => {
    const frame = { x: 0, y: 50, width: 100, height: 100 };
    expect(borderHits({ x: 50, y: 0 }, { x: 50, y: 200 }, frame)).toEqual([
      { x: 50, y: 50 },
      { x: 50, y: 150 },
    ]);
    expect(borderHits({ x: 50, y: 200 }, { x: 50, y: 100 }, frame)).toEqual([{ x: 50, y: 150 }]);
    expect(borderHits({ x: -20, y: 80 }, { x: 200, y: 80 }, frame)).toEqual([
      { x: 0, y: 80 },
      { x: 100, y: 80 },
    ]);
    expect(borderHits({ x: 0, y: 0 }, { x: 0, y: 200 }, frame)).toEqual([]);
    expect(borderHits({ x: 150, y: 0 }, { x: 150, y: 200 }, frame)).toEqual([]);
    expect(borderHits({ x: -20, y: 30 }, { x: 200, y: 30 }, frame)).toEqual([]);
  });
});
