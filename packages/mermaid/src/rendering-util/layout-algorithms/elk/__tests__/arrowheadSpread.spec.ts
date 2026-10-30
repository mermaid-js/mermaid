import { describe, it, expect } from 'vitest';
import { buildElkGraphFromLayoutData, runElkLayoutCore } from '../render.js';
import { ARROWHEAD_PITCH, ARROWHEAD_WIDTH } from '../spreadArrowheads.js';

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

const buildContext = {
  algorithm: 'elk.layered',
  common: { lineBreakRegex: /<br\s*\/?>/gi },
  getConfig: () => ({ flowchart: { wrappingWidth: 200 } }),
  interpolateToCurve: (curve: unknown) => curve,
  log,
} as any;

// The schema defaults, so ELK orders and aligns the ports as it does in the browser.
const elkConfig = {
  mergeEdges: false,
  preset: 'default',
  straightenEdges: true,
  forceNodeModelOrder: false,
  considerModelOrder: 'NODES_AND_EDGES',
};

const NODE_WIDTH = 152;
const FLOWCHART_NODE_HEIGHT = 48;
const SPREAD_OPTION = 'elk.portAlignment.default';

const box = (id: string, width: number, height: number, extra: object = {}) => {
  const node: any = { id, isGroup: false, width, height, label: id, shape: 'squareRect', ...extra };
  node.intersect = (point: { x: number; y: number }) => {
    const dx = point.x - node.x;
    const dy = point.y - node.y;
    const scale = Math.min(
      dx ? width / 2 / Math.abs(dx) : Infinity,
      dy ? height / 2 / Math.abs(dy) : Infinity
    );
    return { x: node.x + dx * Math.min(scale, 1), y: node.y + dy * Math.min(scale, 1) };
  };
  return node;
};

const link = (start: string, end: string, arrowTypeEnd = 'arrow_point') => ({
  id: `L_${start}_${end}`,
  start,
  end,
  arrowTypeStart: 'none',
  arrowTypeEnd,
  label: '',
});

interface FanInOptions {
  direction?: 'LR' | 'RL' | 'TB' | 'BT';
  inputs: number;
  hubWidth?: number;
  hubHeight?: number;
  arrowTypeEnd?: string;
}

/** `inputs` sources into one hub, and the hub into one sink, as in a queue that feeds a worker. */
const fanIn = ({
  direction = 'LR',
  inputs,
  hubWidth = NODE_WIDTH,
  hubHeight = FLOWCHART_NODE_HEIGHT,
  arrowTypeEnd,
}: FanInOptions) => {
  const sources = Array.from({ length: inputs }, (_, i) => `S${i}`);
  return {
    type: 'flowchart-v2',
    direction,
    config: { elk: elkConfig },
    nodes: [
      ...sources.map((id) => box(id, NODE_WIDTH, FLOWCHART_NODE_HEIGHT)),
      box('Hub', hubWidth, hubHeight),
      box('Sink', NODE_WIDTH, FLOWCHART_NODE_HEIGHT),
    ],
    edges: [...sources.map((id) => link(id, 'Hub', arrowTypeEnd)), link('Hub', 'Sink')],
  } as any;
};

/** Smallest distance between two arrowhead tips on the hub, along the side they share. */
const smallestTipGap = async (data: any, alongX: boolean) => {
  await runElkLayoutCore(data, elkRenderContext);
  const tips: number[] = data.edges
    .filter((edge: any) => edge.end === 'Hub')
    .map((edge: any) => edge.points.at(-1)[alongX ? 'x' : 'y'])
    .sort((a: number, b: number) => a - b);
  return Math.min(...tips.slice(1).map((tip, i) => tip - tips[i]));
};

const spreadsPorts = (data: any, id = 'Hub') =>
  buildElkGraphFromLayoutData(data, buildContext).nodeDb[id].layoutOptions?.[SPREAD_OPTION] ===
  'CENTER';

describe('ELK arrowheads on one side of a node', () => {
  // ELK packs the ports of a short node into the middle third of its side, so three or four
  // arrowheads (8px wide) came out 7 and 5.6px apart and drew as one blob.
  it.each([
    ['three inputs into a one-line node', 3, FLOWCHART_NODE_HEIGHT],
    ['four inputs into a two-line node', 4, 64],
    ['five inputs into a two-line node', 5, 64],
    ['six inputs into a three-line node', 6, 80],
  ])('keeps %s an arrowhead apart in a left-to-right flowchart', async (_, inputs, height) => {
    const gap = await smallestTipGap(fanIn({ inputs, hubHeight: height }), false);
    expect(gap).toBeGreaterThanOrEqual(ARROWHEAD_PITCH);
  });

  it('spreads as far as a one-line node allows when four inputs cannot all fit', async () => {
    const gap = await smallestTipGap(fanIn({ inputs: 4 }), false);
    expect(gap).toBeGreaterThan(ARROWHEAD_WIDTH);
  });

  it('spreads four inputs on the narrow side of a top-down node', async () => {
    const gap = await smallestTipGap(fanIn({ direction: 'TB', inputs: 4, hubWidth: 54 }), true);
    expect(gap).toBeGreaterThanOrEqual(ARROWHEAD_PITCH);
  });

  describe('chooses the nodes it spreads', () => {
    it.each([
      ['three inputs on a one-line node', fanIn({ inputs: 3 })],
      [
        'three inputs on a node just too short to keep them apart',
        fanIn({ inputs: 3, hubHeight: 60 }),
      ],
      ['three inputs on a one-line node, right to left', fanIn({ direction: 'RL', inputs: 3 })],
      [
        'four inputs on a narrow node, bottom to top',
        fanIn({ direction: 'BT', inputs: 4, hubWidth: 54 }),
      ],
      [
        'four inputs on a narrow top-down node',
        fanIn({ direction: 'TB', inputs: 4, hubWidth: 54 }),
      ],
      ['six inputs on a three-line node', fanIn({ inputs: 6, hubHeight: 80 })],
    ])('spreads %s', (_, data) => {
      expect(spreadsPorts(data)).toBe(true);
    });

    it.each([
      ['two inputs, which clear each other already', fanIn({ inputs: 2 })],
      ['four inputs on a top-down node, whose side is wide', fanIn({ direction: 'TB', inputs: 4 })],
      [
        'three inputs on a node tall enough to keep them apart',
        fanIn({ inputs: 3, hubHeight: 64 }),
      ],
      ['four inputs that draw no arrowhead', fanIn({ inputs: 4, arrowTypeEnd: 'none' })],
      ['four inputs on a wide node, bottom to top', fanIn({ direction: 'BT', inputs: 4 })],
    ])('leaves %s alone', (_, data) => {
      expect(spreadsPorts(data)).toBe(false);
    });

    it('leaves the source of a fan-out alone, since its edges carry no arrowhead there', () => {
      const data = fanIn({ inputs: 1 });
      const targets = ['T0', 'T1', 'T2', 'T3'];
      data.nodes.push(...targets.map((id) => box(id, NODE_WIDTH, FLOWCHART_NODE_HEIGHT)));
      data.edges.push(...targets.map((id) => link('Hub', id)));
      expect(spreadsPorts(data)).toBe(false);
    });

    it('counts the arrowheads at the start of edges that leave a node', () => {
      const data = fanIn({ inputs: 0 });
      const targets = ['T0', 'T1', 'T2'];
      data.nodes.push(...targets.map((id) => box(id, NODE_WIDTH, FLOWCHART_NODE_HEIGHT)));
      data.edges.push(
        ...targets.map((id) => ({ ...link('Hub', id), arrowTypeStart: 'arrow_point' }))
      );
      expect(spreadsPorts(data)).toBe(true);
    });

    it('does not count a loop on the node as an edge that enters it', () => {
      const data = fanIn({ inputs: 2 });
      data.edges.push(link('Hub', 'Hub'), link('Hub', 'Hub'));
      expect(spreadsPorts(data)).toBe(false);
    });

    it('leaves a node alone when its size is not known', () => {
      const data = fanIn({ inputs: 4 });
      data.nodes.find((node: any) => node.id === 'Hub').height = undefined;
      expect(spreadsPorts(data)).toBe(false);
    });

    it('leaves a subgraph alone, whatever ends on it', () => {
      const data = fanIn({ inputs: 4 });
      data.nodes.find((node: any) => node.id === 'Hub').isGroup = true;
      expect(spreadsPorts(data)).toBe(false);
    });

    it('measures the side by the direction of the subgraph the node sits in', () => {
      const data = fanIn({ direction: 'TB', inputs: 3 });
      data.nodes.forEach((node: any) => {
        node.parentId = 'row';
      });
      data.nodes.push({ id: 'row', isGroup: true, label: 'Row', padding: 8, dir: 'LR' });
      expect(spreadsPorts(data)).toBe(true);
    });
  });
});
