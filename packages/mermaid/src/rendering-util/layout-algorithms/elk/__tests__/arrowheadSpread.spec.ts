import { select } from 'd3';
import { describe, it, expect } from 'vitest';
import {
  PORTS_SURROUNDING_MARGIN,
  buildElkGraphFromLayoutData,
  runElkLayoutCore,
} from '../render.js';
import { elkPortGap, markerExtent } from '../spreadArrowheads.js';
import insertMarkers from '../../../rendering-elements/markers.js';

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
const TWO_LINE_NODE_HEIGHT = 72;
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

const link = (start: string, end: string, arrowTypeEnd = 'arrow_point', look = 'neo') => ({
  id: `L_${start}_${end}`,
  start,
  end,
  arrowTypeStart: 'none',
  arrowTypeEnd,
  look,
  label: '',
});

interface FanInOptions {
  direction?: 'LR' | 'RL' | 'TB' | 'BT';
  inputs: number;
  /** Inputs that draw no arrowhead, as `---` does, after the `inputs` that draw `arrowTypeEnd`. */
  openInputs?: number;
  hubWidth?: number;
  hubHeight?: number;
  arrowTypeEnd?: string;
  look?: string;
}

/** `inputs` sources into one hub, and the hub into one sink, as in a queue that feeds a worker. */
const fanIn = ({
  direction = 'LR',
  inputs,
  openInputs = 0,
  hubWidth = NODE_WIDTH,
  hubHeight = FLOWCHART_NODE_HEIGHT,
  arrowTypeEnd,
  look,
}: FanInOptions) => {
  const sources = Array.from({ length: inputs }, (_, i) => `S${i}`);
  const open = Array.from({ length: openInputs }, (_, i) => `O${i}`);
  return {
    type: 'flowchart-v2',
    direction,
    config: { elk: elkConfig },
    nodes: [
      ...[...sources, ...open].map((id) => box(id, NODE_WIDTH, FLOWCHART_NODE_HEIGHT)),
      box('Hub', hubWidth, hubHeight),
      box('Sink', NODE_WIDTH, FLOWCHART_NODE_HEIGHT),
    ],
    edges: [
      ...sources.map((id) => link(id, 'Hub', arrowTypeEnd, look)),
      ...open.map((id) => link(id, 'Hub', 'none', look)),
      link('Hub', 'Sink', undefined, look),
    ],
  } as any;
};

/** Smallest distance between two edge ends on the hub, along the side they share. */
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
  // ELK packs the ports of a short node into the middle of its side, so three or four arrowheads
  // came out 7 and 5.6px apart where the neo look draws each one 12.8px across.
  it.each([
    ['three inputs into a one-line node', 3, FLOWCHART_NODE_HEIGHT],
    ['four inputs into a node 64px tall', 4, 64],
    ['four inputs into a two-line node', 4, TWO_LINE_NODE_HEIGHT],
    ['five inputs into a two-line node', 5, TWO_LINE_NODE_HEIGHT],
  ])('keeps %s an arrowhead apart in a left-to-right flowchart', async (_, inputs, height) => {
    const gap = await smallestTipGap(fanIn({ inputs, hubHeight: height }), false);
    expect(gap).toBeGreaterThanOrEqual(markerExtent('arrow_point', 'end', true));
  });

  it('spreads as far as a one-line node allows when four inputs cannot all fit', async () => {
    const gap = await smallestTipGap(fanIn({ inputs: 4 }), false);
    expect(gap).toBeGreaterThan(elkPortGap(FLOWCHART_NODE_HEIGHT, 4, PORTS_SURROUNDING_MARGIN));
  });

  it('spreads four inputs on the narrow side of a top-down node', async () => {
    const gap = await smallestTipGap(fanIn({ direction: 'TB', inputs: 4, hubWidth: 60 }), true);
    expect(gap).toBeGreaterThanOrEqual(markerExtent('arrow_point', 'end', true));
  });

  // ELK keeps three ports on a node 64px tall 11px apart; a circle is 14px across, a point 12.8px
  // and a cross 12px.
  it.each(['arrow_point', 'arrow_circle', 'arrow_cross'])(
    'keeps three %s inputs apart by the width of that marker',
    async (arrowTypeEnd) => {
      const gap = await smallestTipGap(fanIn({ inputs: 3, hubHeight: 64, arrowTypeEnd }), false);
      expect(gap).toBeGreaterThanOrEqual(markerExtent(arrowTypeEnd, 'end', true));
    }
  );

  // ELK gives the open link its own port, so the three arrowheads lose the room it takes.
  it('keeps three arrowheads apart when an open link ends on the same side', async () => {
    const data = fanIn({ inputs: 3, openInputs: 1, hubHeight: TWO_LINE_NODE_HEIGHT });
    const gap = await smallestTipGap(data, false);
    expect(gap).toBeGreaterThanOrEqual(markerExtent('arrow_point', 'end', true));
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
        fanIn({ direction: 'BT', inputs: 4, hubWidth: 60 }),
      ],
      [
        'four inputs on a narrow top-down node',
        fanIn({ direction: 'TB', inputs: 4, hubWidth: 60 }),
      ],
      ['six inputs on a three-line node', fanIn({ inputs: 6, hubHeight: 96 })],
      [
        'three circle inputs on a two-line node, where a circle is wider than ELK leaves',
        fanIn({ inputs: 3, hubHeight: TWO_LINE_NODE_HEIGHT, arrowTypeEnd: 'arrow_circle' }),
      ],
      [
        'three inputs and an open link on a two-line node',
        fanIn({ inputs: 3, openInputs: 1, hubHeight: TWO_LINE_NODE_HEIGHT }),
      ],
      [
        'three inputs on a node 64px tall, drawn with the neo look',
        fanIn({ inputs: 3, hubHeight: 64 }),
      ],
      [
        'three inputs of a marker it has not measured on a one-line node',
        fanIn({ inputs: 3, arrowTypeEnd: 'extension' }),
      ],
    ])('spreads %s', (_, data) => {
      expect(spreadsPorts(data)).toBe(true);
    });

    it.each([
      ['two inputs, which are left to ELK', fanIn({ inputs: 2 })],
      ['four inputs on a top-down node, whose side is wide', fanIn({ direction: 'TB', inputs: 4 })],
      ['four inputs on a wide node, bottom to top', fanIn({ direction: 'BT', inputs: 4 })],
      [
        'three point inputs on a two-line node, which ELK keeps 13px apart',
        fanIn({ inputs: 3, hubHeight: TWO_LINE_NODE_HEIGHT }),
      ],
      [
        'three inputs on a node 64px tall, drawn with the classic look',
        fanIn({ inputs: 3, hubHeight: 64, look: 'classic' }),
      ],
      ['four inputs that draw no arrowhead', fanIn({ inputs: 4, arrowTypeEnd: 'none' })],
      [
        'three circle inputs on a node where ELK leaves exactly the width of a circle',
        fanIn({ inputs: 3, hubHeight: 76, arrowTypeEnd: 'arrow_circle' }),
      ],
      [
        'three inputs of a marker it has not measured on a node 64px tall',
        fanIn({ inputs: 3, hubHeight: 64, arrowTypeEnd: 'extension' }),
      ],
      [
        'three point inputs on a two-line node, when the open link is on its other side',
        (() => {
          const data = fanIn({ inputs: 3, hubHeight: TWO_LINE_NODE_HEIGHT });
          data.nodes.push(box('Other', NODE_WIDTH, FLOWCHART_NODE_HEIGHT));
          data.edges.push(link('Hub', 'Other', 'none'));
          return data;
        })(),
      ],
    ])('leaves %s alone', (_, data) => {
      expect(spreadsPorts(data)).toBe(false);
    });

    it('draws an animated edge with the plain marker, which is narrower', () => {
      const data = fanIn({ inputs: 3, hubHeight: 64 });
      data.edges.forEach((edge: any) => {
        edge.animate = true;
      });
      expect(spreadsPorts(data)).toBe(false);
    });

    // The renderer draws the plain marker on an edge whose class styles mention an animation, as
    // it does on one that sets `animate`; the plain circle is 11px, so ELK's 13px is enough.
    it.each([
      [
        'animates it, so the edge draws the plain circle',
        ['animation: dash 25s linear infinite'],
        false,
      ],
      ['only colours it, so the edge draws the margin circle', ['stroke: red'], true],
    ])('when the class of an edge %s', (_, cssCompiledStyles, spreads) => {
      const data = fanIn({
        inputs: 3,
        hubHeight: TWO_LINE_NODE_HEIGHT,
        arrowTypeEnd: 'arrow_circle',
      });
      data.edges.forEach((edge: any) => {
        edge.cssCompiledStyles = cssCompiledStyles;
      });
      expect(spreadsPorts(data)).toBe(spreads);
    });

    it('leaves the source of a fan-out alone, since its edges carry no arrowhead there', () => {
      const data = fanIn({ inputs: 1 });
      const targets = ['T0', 'T1', 'T2', 'T3'];
      data.nodes.push(...targets.map((id) => box(id, NODE_WIDTH, FLOWCHART_NODE_HEIGHT)));
      data.edges.push(...targets.map((id) => link('Hub', id)));
      expect(spreadsPorts(data)).toBe(false);
    });

    // A start marker is drawn at its own scale: 14px across where the end marker is 12.8px, so on a
    // two-line node ELK's 13px between three ports is enough for one and not the other.
    it('counts the arrowheads at the start of edges that leave a node', () => {
      const data = fanIn({ inputs: 0, hubHeight: TWO_LINE_NODE_HEIGHT });
      data.edges = data.edges.filter((edge: any) => edge.end !== 'Sink');
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

describe('what the spread is measured against', () => {
  // `elkPortGap` stands in for ELK's own placement, so it is held to what ELK does.
  it.each([48, TWO_LINE_NODE_HEIGHT, 96])(
    'predicts the gap ELK leaves between ports on a node %ipx tall',
    async (height) => {
      for (const inputs of [2, 3, 4, 5, 6]) {
        const data = fanIn({ inputs, hubHeight: height, arrowTypeEnd: 'none' });
        const gap = await smallestTipGap(data, false);
        expect(gap).toBeCloseTo(elkPortGap(height, inputs, PORTS_SURROUNDING_MARGIN), 1);
      }
    }
  );

  // `markers.js` draws each marker in a box of its own; the shape fills the height of its viewBox.
  const drawn = (id: string) => {
    const marker = document.getElementById(id)!;
    const [, , viewWidth, viewHeight] = marker.getAttribute('viewBox')!.split(' ').map(Number);
    const scale = Math.min(
      Number(marker.getAttribute('markerWidth')) / viewWidth,
      Number(marker.getAttribute('markerHeight')) / viewHeight
    );
    return viewHeight * scale;
  };

  it.each([
    ['arrow_point', 'point'],
    ['arrow_circle', 'circle'],
    ['arrow_cross', 'cross'],
  ])('matches the height `markers.js` draws for %s', (arrowType, name) => {
    document.body.replaceChildren();
    insertMarkers(select(document.body).append('svg'), [name], 'flowchart-v2', 'guard');
    for (const position of ['start', 'end'] as const) {
      const suffix = position === 'start' ? 'Start' : 'End';
      expect(markerExtent(arrowType, position, false)).toBeCloseTo(
        drawn(`guard_flowchart-v2-${name}${suffix}`),
        0
      );
      expect(markerExtent(arrowType, position, true)).toBeCloseTo(
        drawn(`guard_flowchart-v2-${name}${suffix}-margin`),
        0
      );
    }
  });
});
