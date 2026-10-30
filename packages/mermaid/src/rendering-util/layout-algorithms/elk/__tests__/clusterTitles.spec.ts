import { describe, it, expect } from 'vitest';
import {
  projectLabelOntoStraightenedRun,
  runElkLayoutCore,
  slideEdgesOffClusterTitles,
} from '../render.js';
import type { P } from '../geometry.js';

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

interface Box {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

const TITLE_HEIGHT = 24;
// The frame painter's own inset when it decides a point is on the title, so grazing is allowed.
const GRAZE = 1;
const SAMPLE_STEP = 1;
// What the slid edge keeps from the title and from its node's corner.
const TITLE_GAP = 4;
const ARROWHEAD_HALF_WIDTH = 7;
const SEPARATION_OF_ARROWHEADS = 2 * ARROWHEAD_HALF_WIDTH;

/** The box `rect` in `clusters.js` paints a frame's title in. */
const titleBoxOf = (frame: any, topMargin = 0): Box => {
  const top = frame.y - frame.height / 2 + topMargin;
  return {
    x1: frame.x - frame.labelBBox.width / 2,
    y1: top,
    x2: frame.x + frame.labelBBox.width / 2,
    y2: top + frame.labelBBox.height,
  };
};

/** Whether a sample every pixel along the route falls inside the box, as the routing gate counts it. */
const crossesTitle = (points: P[], box: Box): boolean =>
  points.slice(1).some((to, i) => {
    const from = points[i];
    const steps = Math.ceil(Math.hypot(to.x - from.x, to.y - from.y) / SAMPLE_STEP);
    return Array.from({ length: steps + 1 }, (_, step) => ({
      x: from.x + ((to.x - from.x) * step) / steps,
      y: from.y + ((to.y - from.y) * step) / steps,
    })).some(
      ({ x, y }) =>
        x > box.x1 + GRAZE && x < box.x2 - GRAZE && y > box.y1 + GRAZE && y < box.y2 - GRAZE
    );
  });

describe('slideEdgesOffClusterTitles', () => {
  const CENTRE = 112;
  const NODE_WIDTH = 152;
  const NODE_LEFT = CENTRE - NODE_WIDTH / 2;
  const NODE_RIGHT = CENTRE + NODE_WIDTH / 2;

  const frame = (titleWidth: number) => ({
    id: 'stock',
    isGroup: true,
    shape: 'rect',
    x: CENTRE,
    y: 356.5,
    width: 200,
    height: 147,
    labelBBox: { width: titleWidth, height: TITLE_HEIGHT },
  });
  const node = (id: string, y: number, shape = 'squareRect', x = CENTRE) => ({
    id,
    isGroup: false,
    shape,
    x,
    y,
    width: NODE_WIDTH,
    height: 72,
  });
  const straight = (): P[] => [
    { x: CENTRE, y: 135 },
    { x: CENTRE, y: 169 },
    { x: CENTRE, y: 273 },
    { x: CENTRE, y: 330 },
  ];
  const labelled = (points: P[]): any => ({
    id: 'L_A_B_0',
    start: 'A',
    end: 'B',
    points,
    label: 'Orders team',
    width: 80,
    height: TITLE_HEIGHT,
    x: CENTRE,
    y: 210,
  });
  const slide = (edges: any[], nodes: any[], topMargin = 0) =>
    slideEdgesOffClusterTitles(edges, nodes, topMargin);

  it.each([101.734375, 123.28125])(
    'slides a straight edge to the right of a %s wide title it runs through',
    (titleWidth) => {
      const stock = frame(titleWidth);
      const edge = labelled(straight());
      expect(crossesTitle(edge.points, titleBoxOf(stock))).toBe(true);

      const changed = slide([edge], [stock, node('A', 99), node('B', 370)]);

      const slidTo = titleBoxOf(stock).x2 + TITLE_GAP;
      expect(slidTo).toBeLessThanOrEqual(NODE_RIGHT - ARROWHEAD_HALF_WIDTH);
      expect(edge.points).toEqual(straight().map(({ y }) => ({ x: slidTo, y })));
      expect(crossesTitle(edge.points, titleBoxOf(stock))).toBe(false);
      expect(changed).toEqual([{ edge, runs: [expect.anything()] }]);
      expect(projectLabelOntoStraightenedRun({ x: CENTRE, y: 210 }, changed[0].runs)).toEqual({
        x: slidTo,
        y: 210,
      });
    }
  );

  it('moves only the run through the title when the route bends before it', () => {
    const stock = frame(101.734375);
    const edge = labelled([
      { x: 300, y: 135 },
      { x: 300, y: 200 },
      { x: CENTRE, y: 200 },
      { x: CENTRE, y: 330 },
    ]);

    slide([edge], [stock, node('A', 99, 'squareRect', 300), node('B', 370)]);

    const slidTo = titleBoxOf(stock).x2 + TITLE_GAP;
    expect(edge.points).toEqual([
      { x: 300, y: 135 },
      { x: 300, y: 200 },
      { x: slidTo, y: 200 },
      { x: slidTo, y: 330 },
    ]);
  });

  it('joins the run beside it when that one already stands clear of the title', () => {
    const stock = frame(101.734375);
    const clear = titleBoxOf(stock).x2 + 2 * TITLE_GAP;
    const edge = labelled([
      { x: clear, y: 135 },
      { x: clear, y: 200 },
      { x: CENTRE, y: 200 },
      { x: CENTRE, y: 330 },
    ]);

    slide([edge], [stock, node('A', 99, 'squareRect', clear), node('B', 370)]);

    expect(edge.points).toEqual([
      { x: clear, y: 135 },
      { x: clear, y: 200 },
      { x: clear, y: 330 },
    ]);
  });

  it('takes the other side rather than leave a jog shorter than a port step', () => {
    const stock = frame(101.734375);
    const title = titleBoxOf(stock);
    const justInsideTheTitle = title.x2 - TITLE_GAP;
    const edge = labelled([
      { x: justInsideTheTitle, y: 135 },
      { x: justInsideTheTitle, y: 200 },
      { x: CENTRE, y: 200 },
      { x: CENTRE, y: 330 },
    ]);

    slide([edge], [stock, node('A', 99, 'squareRect', justInsideTheTitle), node('B', 370)]);

    expect(edge.points.at(-1).x).toBe(title.x1 - TITLE_GAP);
    expect(crossesTitle(edge.points, title)).toBe(false);
  });

  it('leaves an edge that misses the title alone', () => {
    const stock = frame(101.734375);
    const points = straight().map(({ y }) => ({ x: NODE_LEFT + ARROWHEAD_HALF_WIDTH, y }));
    const edge = labelled(points);

    const changed = slide([edge], [stock, node('A', 99), node('B', 370)]);

    expect(changed).toEqual([]);
    expect(edge.points).toBe(points);
  });

  it('leaves an edge alone when the title is as wide as the node it enters', () => {
    const stock = frame(NODE_WIDTH + TITLE_GAP);
    const points = straight();
    const edge = labelled(points);

    const changed = slide([edge], [stock, node('A', 99), node('B', 370)]);

    expect(changed).toEqual([]);
    expect(edge.points).toBe(points);
  });

  it.each(['cyl', 'diam'])('leaves an edge alone when it ends on a %s node', (shape) => {
    const stock = frame(101.734375);
    const points = straight();
    const edge = labelled(points);

    const changed = slide([edge], [stock, node('A', 99), node('B', 370, shape)]);

    expect(changed).toEqual([]);
    expect(edge.points).toBe(points);
  });

  it('takes the free side when another edge already runs down the near one', () => {
    const stock = frame(101.734375);
    const title = titleBoxOf(stock);
    const neighbour = {
      id: 'L_C_B_0',
      start: 'C',
      end: 'B',
      points: [
        { x: title.x2 + TITLE_GAP, y: 150 },
        { x: title.x2 + TITLE_GAP, y: 330 },
      ],
    };
    const edge = labelled(straight());

    slide([edge, neighbour], [stock, node('A', 99), node('B', 370)]);

    expect(edge.points[0].x).toBe(title.x1 - TITLE_GAP);
    expect(crossesTitle(edge.points, title)).toBe(false);
  });

  const stays = (edge: any, nodes: any[]) => {
    const points = edge.points;
    expect(slide([edge], nodes)).toEqual([]);
    expect(edge.points).toBe(points);
  };
  const clearOfTitle = (stock: any) => titleBoxOf(stock).x2 + TITLE_GAP;
  const leftOfTitle = (stock: any) => titleBoxOf(stock).x1 - TITLE_GAP;
  const lane = (x: number, from: number, to: number): any => ({
    id: `lane-${x}-${from}`,
    start: 'P',
    end: 'Q',
    points: [
      { x, y: from },
      { x, y: to },
    ],
  });

  it('takes the side of the title the edge is nearer to', () => {
    const stock = frame(101.734375);
    const nearTheLeft = NODE_LEFT + 2 * ARROWHEAD_HALF_WIDTH + 30;
    const edge = labelled(straight().map(({ y }) => ({ x: nearTheLeft, y })));

    slide([edge], [stock, node('A', 99), node('B', 370)]);

    expect(edge.points[0].x).toBe(leftOfTitle(stock));
  });

  it('joins a neighbouring run on the left of the title as readily as on the right', () => {
    const stock = frame(101.734375);
    const clear = leftOfTitle(stock) - TITLE_GAP;
    const edge = labelled([
      { x: clear, y: 135 },
      { x: clear, y: 200 },
      { x: CENTRE, y: 200 },
      { x: CENTRE, y: 330 },
    ]);

    slide([edge], [stock, node('A', 99, 'squareRect', clear), node('B', 370)]);

    expect(edge.points.map(({ x }: P) => x)).toEqual([clear, clear, clear]);
  });

  it('slides to a column exactly a corner margin inside the node', () => {
    const stock = frame(2 * (NODE_RIGHT - ARROWHEAD_HALF_WIDTH - TITLE_GAP - CENTRE));
    const edge = labelled(straight());

    slide([edge], [stock, node('A', 99), node('B', 370)]);

    expect(edge.points[0].x).toBe(NODE_RIGHT - ARROWHEAD_HALF_WIDTH);
  });

  it.each(['A', 'B'])('leaves an edge alone when its end node %s is not in the layout', (gone) => {
    const stock = frame(101.734375);
    const nodes = [stock, node('A', 99), node('B', 370)].filter(({ id }) => id !== gone);

    stays(labelled(straight()), nodes);
  });

  it('leaves an edge alone when it starts on a node without a flat side', () => {
    const stock = frame(101.734375);

    stays(labelled(straight()), [stock, node('A', 99, 'diam'), node('B', 370)]);
  });

  it.each(['roundedWithTitle', 'divider'])('ignores a %s frame', (shape) => {
    const stock = { ...frame(101.734375), shape };

    stays(labelled(straight()), [stock, node('A', 99), node('B', 370)]);
  });

  it('ignores a node that carries a label size but is not a frame', () => {
    const stock = { ...frame(101.734375), isGroup: false };

    stays(labelled(straight()), [stock, node('A', 99), node('B', 370)]);
  });

  it('leaves an edge alone when a leg beside the run is diagonal', () => {
    const stock = frame(101.734375);
    const edge = labelled([
      { x: 200, y: 150 },
      { x: CENTRE, y: 200 },
      { x: CENTRE, y: 330 },
    ]);

    stays(edge, [stock, node('A', 99, 'squareRect', 200), node('B', 370)]);
  });

  it('asks nothing of the end node when the run through the title is not the last', () => {
    const stock = frame(101.734375);
    const edge = labelled([
      { x: CENTRE, y: 135 },
      { x: CENTRE, y: 340 },
      { x: 250, y: 340 },
      { x: 250, y: 400 },
    ]);

    slide([edge], [stock, node('A', 99), node('B', 450, 'cyl', 250)]);

    expect(edge.points[0].x).toBe(clearOfTitle(stock));
  });

  it('takes the left when the leg after the run would turn back on itself', () => {
    const stock = frame(101.734375);
    const edge = labelled([
      { x: CENTRE, y: 135 },
      { x: CENTRE, y: 340 },
      { x: CENTRE + 8, y: 340 },
      { x: CENTRE + 8, y: 400 },
    ]);

    slide([edge], [stock, node('A', 99), node('B', 450, 'squareRect', CENTRE + 8)]);

    expect(edge.points[0].x).toBe(leftOfTitle(stock));
  });

  it('slides an edge that has no label, next to one that has no route', () => {
    const stock = frame(101.734375);
    const { label, width, height, x, y, ...bare } = labelled(straight());
    const routeless = { id: 'routeless', start: 'P', end: 'Q' };

    slide([bare, routeless as any], [stock, node('A', 99), node('B', 370)]);

    expect(bare.points[0].x).toBe(clearOfTitle(stock));
  });

  it('takes the left when the right would land in another frame title', () => {
    const stock = frame(101.734375);
    const neighbour = {
      ...frame(100),
      id: 'neighbour',
      x: clearOfTitle(stock) + 40,
      width: 300,
    };
    const edge = labelled(straight());

    slide([edge], [stock, neighbour, node('A', 99), node('B', 370)]);

    expect(edge.points[0].x).toBe(leftOfTitle(stock));
  });

  describe('when the near side is taken', () => {
    const takesTheLeft = (others: any[], nodes: any[] = []) => {
      const stock = frame(101.734375);
      const edge = labelled(straight());

      slide([edge, ...others], [stock, node('A', 99), node('B', 370), ...nodes]);

      expect(edge.points[0].x).toBe(leftOfTitle(stock));
    };
    const column = clearOfTitle(frame(101.734375));
    const SIDE_CLEAR = SEPARATION_OF_ARROWHEADS;

    it('because a node stands in its way', () => {
      takesTheLeft([], [{ ...node('Z', 240), x: column, width: 30, height: 30 }]);
    });

    it('because another edge crosses it', () => {
      takesTheLeft([
        {
          id: 'across',
          start: 'P',
          end: 'Q',
          points: [
            { x: column - 40, y: 250 },
            { x: column + 40, y: 250 },
          ],
        },
      ]);
    });

    it('because its label would land on a node', () => {
      takesTheLeft([], [{ ...node('Z', 210), x: 200, width: 40, height: 40 }]);
    });

    it("because it would cover another edge's label", () => {
      takesTheLeft([
        {
          ...lane(300, 0, 10),
          label: 'Packed',
          width: 40,
          height: 20,
          x: column + 5,
          y: 250,
        },
      ]);
    });

    it("because another edge's label would sit on its label", () => {
      takesTheLeft([
        { ...lane(300, 0, 10), label: 'Packed', width: 40, height: 20, x: column + 10, y: 210 },
      ]);
    });

    it("because another edge's route would run through its label", () => {
      takesTheLeft([lane(CENTRE + 90, 190, 230)]);
    });

    it('because another edge already runs down that column', () => {
      takesTheLeft([lane(column + SIDE_CLEAR - 1, 250, 330)]);
    });
  });

  describe('when another edge runs beside the near side', () => {
    const slidesRight = (other: any) => {
      const stock = frame(101.734375);
      const edge = labelled(straight());

      slide([edge, other], [stock, node('A', 99), node('B', 370)]);

      expect(edge.points[0].x).toBe(clearOfTitle(stock));
    };
    const column = clearOfTitle(frame(101.734375));

    it('a full arrowhead pair away', () => {
      slidesRight(lane(column + SEPARATION_OF_ARROWHEADS, 250, 330));
    });

    it('on a stretch of the column the edge does not use', () => {
      slidesRight(lane(column + 1, 0, 100));
    });
  });

  it('keeps the title where it is when the top margin puts it below the edge', () => {
    const stock = frame(101.734375);
    const points = straight().slice(0, 3);
    const edge = labelled(points);
    const belowTheRun = stock.height;

    const changed = slide([edge], [stock, node('A', 99), node('B', 370)], belowTheRun);

    expect(changed).toEqual([]);
    expect(edge.points).toBe(points);
  });
});

describe('an edge into a titled frame', () => {
  const frame = (id: string, title: number) => ({
    id,
    isGroup: true,
    label: id,
    padding: 8,
    shape: 'rect',
    labelBBox: { width: title, height: TITLE_HEIGHT },
  });
  const inside = (id: string, parentId: string) => ({
    id,
    parentId,
    isGroup: false,
    width: 152,
    height: 72,
    label: id,
    shape: 'squareRect',
  });
  const chain = (direction: string, titles: [number, number, number]) =>
    ({
      direction,
      config: { elk: {} },
      nodes: [
        frame('intake', titles[0]),
        inside('A', 'intake'),
        frame('stock', titles[1]),
        inside('B', 'stock'),
        frame('ship', titles[2]),
        inside('C', 'ship'),
      ],
      edges: [
        {
          id: 'L_A_B_0',
          start: 'A',
          end: 'B',
          type: 'arrow_point',
          label: 'Orders',
          width: 60,
          height: 24,
        },
        {
          id: 'L_B_C_0',
          start: 'B',
          end: 'C',
          type: 'arrow_point',
          label: 'Pack',
          width: 40,
          height: 24,
        },
      ],
    }) as any;

  const crossings = (data: any): string[] => {
    const titles = data.nodes.filter((node: any) => node.isGroup);
    return data.edges.flatMap((edge: any) =>
      titles
        .filter((title: any) => crossesTitle(edge.points, titleBoxOf(title)))
        .map((title: any) => `${edge.id} x ${title.id}`)
    );
  };

  it.each([
    ['the title widths a short label gives', [107.859375, 101.734375, 123.28125]],
    ['one-letter titles', [10, 10, 10]],
  ] as const)('does not run through the title of a top-down chain with %s', async (_, titles) => {
    const data = chain('TB', [...titles]);

    await runElkLayoutCore(data, elkRenderContext);

    expect(crossings(data)).toEqual([]);
  });
});
