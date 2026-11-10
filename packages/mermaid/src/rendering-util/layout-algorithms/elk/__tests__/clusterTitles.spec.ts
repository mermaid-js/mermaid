import { describe, it, expect } from 'vitest';
import {
  carryLabelsAlong,
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
  const slide = (edges: any[], nodes: any[], topMargin = 0, cornerRadius?: number) =>
    slideEdgesOffClusterTitles(edges, nodes, topMargin, cornerRadius);

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

    const x = clearOfTitle(stock);
    expect(edge.points).toEqual([
      { x, y: 135 },
      { x, y: 340 },
      { x: 250, y: 340 },
      { x: 250, y: 400 },
    ]);
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

  it.each(['rect', 'squareRect', 'rounded', 'roundedRect'])(
    'slides an edge that ends on a %s node',
    (shape) => {
      const stock = frame(101.734375);
      const edge = labelled(straight());

      slide([edge], [stock, node('A', 99), node('B', 370, shape)]);

      expect(edge.points[0].x).toBe(clearOfTitle(stock));
    }
  );

  it('treats an end node without a shape as a rectangle', () => {
    const stock = frame(101.734375);
    const edge = labelled(straight());

    slide([edge], [stock, node('A', 99), { ...node('B', 370), shape: undefined }]);

    expect(edge.points[0].x).toBe(clearOfTitle(stock));
  });

  it('treats a frame without a shape as a plain rectangle', () => {
    const stock = { ...frame(101.734375), shape: undefined };
    const edge = labelled(straight());

    slide([edge], [stock, node('A', 99), node('B', 370)]);

    expect(edge.points[0].x).toBe(clearOfTitle(stock));
  });

  it.each([0.3, 0.5])(
    'takes the right side when the sides are within a pixel of equally near, %s left of centre',
    (offset) => {
      const stock = frame(101.734375);
      const edge = labelled(straight().map(({ y }) => ({ x: CENTRE - offset, y })));

      slide([edge], [stock, node('A', 99), node('B', 370)]);

      expect(edge.points[0].x).toBe(clearOfTitle(stock));
    }
  );

  it('takes the left side when it is more than a pixel nearer', () => {
    const stock = frame(101.734375);
    const edge = labelled(straight().map(({ y }) => ({ x: CENTRE - 2, y })));

    slide([edge], [stock, node('A', 99), node('B', 370)]);

    expect(edge.points[0].x).toBe(leftOfTitle(stock));
  });

  it.each([
    [40, 170, 170],
    [54, 190, 54],
  ])(
    'joins the nearer of the columns either side of the run, %s and %s',
    (before, after, joins) => {
      const stock = frame(101.734375);
      const edge = labelled([
        { x: before, y: 135 },
        { x: before, y: 200 },
        { x: CENTRE, y: 200 },
        { x: CENTRE, y: 340 },
        { x: after, y: 340 },
        { x: after, y: 400 },
      ]);

      slide(
        [edge],
        [stock, node('A', 99, 'squareRect', before), node('B', 450, 'squareRect', after)]
      );

      expect(edge.points[2].x).toBe(joins);
      expect(edge.points).toHaveLength(5);
    }
  );

  it('joins the column after the run when nothing leads into it', () => {
    const stock = frame(101.734375);
    const column = clearOfTitle(stock) + 3;
    const edge = labelled([
      { x: CENTRE, y: 135 },
      { x: CENTRE, y: 340 },
      { x: column, y: 340 },
      { x: column, y: 400 },
    ]);

    slide([edge], [stock, node('A', 99), node('B', 450, 'squareRect', column)]);

    expect(edge.points).toEqual([
      { x: column, y: 135 },
      { x: column, y: 340 },
      { x: column, y: 400 },
    ]);
  });

  it('leaves a route alone when only an end point falls inside the title', () => {
    const stock = frame(101.734375);

    stays(
      labelled([
        { x: 40, y: 295 },
        { x: 100, y: 295 },
      ]),
      [stock, node('A', 99), node('B', 370)]
    );
  });

  describe('a leg beside the run that the slide would shorten', () => {
    const stock = frame(101.734375);
    const crowdedRight = lane(clearOfTitle(stock) + 5, 250, 330);
    const withLeg = (length: number) =>
      labelled([
        { x: leftOfTitle(stock) - length, y: 135 },
        { x: leftOfTitle(stock) - length, y: 200 },
        { x: CENTRE, y: 200 },
        { x: CENTRE, y: 330 },
      ]);
    const nodes = (length: number) => [
      stock,
      node('A', 99, 'squareRect', leftOfTitle(stock) - length),
      node('B', 370, 'squareRect', 125),
    ];

    it('leaves the edge alone when the leg would be only two arrowheads long', () => {
      const edge = withLeg(SEPARATION_OF_ARROWHEADS);
      const points = edge.points;

      expect(slide([edge, crowdedRight], nodes(SEPARATION_OF_ARROWHEADS))).toEqual([]);
      expect(edge.points).toBe(points);
    });

    it('slides the edge when the leg stays longer than two arrowheads', () => {
      const edge = withLeg(SEPARATION_OF_ARROWHEADS + 1);

      slide([edge, crowdedRight], nodes(SEPARATION_OF_ARROWHEADS + 1));

      expect(edge.points.at(-1).x).toBe(leftOfTitle(stock));
    });
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
      takesTheLeft([], [{ ...node('Z', 240), x: column + 10, width: 30, height: 30 }]);
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

    it('because another edge already runs down that column from above the run', () => {
      takesTheLeft([lane(column + 5, 100, 180)]);
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

    it('which only starts where the run stops', () => {
      slidesRight(lane(column + 5, 330, 400));
    });

    it('which only stops where the run starts', () => {
      slidesRight(lane(column + 5, 60, 135));
    });

    it.each([
      ['no text', { label: '', width: 40, height: 20 }],
      ['no width', { label: 'Packed', width: 0, height: 20 }],
      ['no height', { label: 'Packed', width: 40, height: 0 }],
    ])('and has a label with %s', (_, label) => {
      slidesRight({ ...lane(300, 0, 10), ...label, x: column, y: 210 });
    });
  });

  describe('a label that rides another run of the edge and is carried to the moved one', () => {
    const TALL_LABEL = 120;
    const withBendAt = (bend: number) => {
      const stock = frame(101.734375);
      const edge = {
        ...labelled([
          { x: 40, y: 135 },
          { x: 40, y: bend },
          { x: CENTRE, y: bend },
          { x: CENTRE, y: 330 },
        ]),
        x: 40,
        y: 160,
        height: TALL_LABEL,
      };
      const nodes = [stock, node('A', 99, 'squareRect', -200), node('B', 370)];
      return { stock, edge, nodes };
    };
    const titleTop = titleBoxOf(frame(101.734375)).y1;

    it('slides the edge when the carried label stays well clear of the title', () => {
      const { stock, edge, nodes } = withBendAt(titleTop - TALL_LABEL);

      slide([edge], nodes);

      expect(edge.points.at(-1).x).toBe(clearOfTitle(stock));
    });

    it('slides the edge when the carried label only touches the title', () => {
      const { stock, edge, nodes } = withBendAt(titleTop - TALL_LABEL / 2);

      slide([edge], nodes);

      expect(edge.points.at(-1).x).toBe(clearOfTitle(stock));
    });

    it('leaves the edge alone when the carried label would cover the title', () => {
      const { edge, nodes } = withBendAt(titleTop - TALL_LABEL / 2 + 1);

      stays(edge, nodes);
    });
  });

  describe('two edges that slide off titles one after the other', () => {
    const second = (frameX: number, edgeX: number) => {
      const ship = { ...frame(100), id: 'ship', x: frameX, y: 800 };
      const edge = {
        ...labelled([
          { x: edgeX, y: 135 },
          { x: edgeX, y: 500 },
          { x: edgeX, y: 830 },
        ]),
        id: 'L_A2_B2_0',
        start: 'A2',
        end: 'B2',
        x: edgeX,
        y: 210,
      };
      const nodes = [
        node('A2', 99, 'squareRect', edgeX),
        node('B2', 870, 'squareRect', edgeX),
        ship,
      ];
      return { ship, edge, nodes };
    };
    const slideBoth = (frameX: number, edgeX: number) => {
      const stock = frame(101.734375);
      const first = labelled(straight());
      const { ship, edge, nodes } = second(frameX, edgeX);

      slide([first, edge], [stock, node('A', 99), node('B', 370), ...nodes]);

      return { stock, ship, first, edge };
    };

    it('carries the label of a slid edge before the next edge is looked at', () => {
      const { stock, first } = slideBoth(262 + 300, 259 + 300);

      expect(first).toMatchObject({ x: clearOfTitle(stock), y: 210 });
    });

    it('keeps the second edge off the label the first one carried to the right', () => {
      const { ship, edge } = slideBoth(262, 259);

      expect(edge.points[0].x).toBe(clearOfTitle(ship));
    });

    it('lets the second edge take the near side when the first edge label is far from it', () => {
      const { ship, edge } = slideBoth(262 + 300, 259 + 300);

      expect(edge.points[0].x).toBe(leftOfTitle(ship));
    });
  });

  describe('an edge that ends on a rounded node', () => {
    const NARROW_CORNER = 5;
    const WIDE_CORNER = 12;
    // Puts the slid column between the arrowhead margin and a wide corner.
    const beyondTheWideCorner = 2 * (NODE_RIGHT - ARROWHEAD_HALF_WIDTH - 2 - TITLE_GAP - CENTRE);

    it('slides onto the flat of its side while the corner is narrower than an arrowhead', () => {
      const stock = frame(beyondTheWideCorner);
      const edge = labelled(straight());

      slide([edge], [stock, node('A', 99), node('B', 370, 'rounded')], 0, NARROW_CORNER);

      expect(edge.points[0].x).toBe(clearOfTitle(stock));
    });

    it.each(['rounded', 'roundedRect'])(
      'leaves a %s node end where it is rather than slide it onto a corner wider than the arrowhead margin',
      (shape) => {
        const stock = frame(beyondTheWideCorner);
        const edge = labelled(straight());

        slide([edge], [stock, node('A', 99), node('B', 370, shape)], 0, WIDE_CORNER);

        expect(edge.points[0].x).toBe(CENTRE);
      }
    );

    it('lets a square node end take the same column under a wide corner radius', () => {
      const stock = frame(beyondTheWideCorner);
      const edge = labelled(straight());

      slide([edge], [stock, node('A', 99), node('B', 370)], 0, WIDE_CORNER);

      expect(edge.points[0].x).toBe(clearOfTitle(stock));
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

  describe('whose end node is rounded', () => {
    const WIDE_CORNER = 24;
    const roundedChain = (themeVariables?: Record<string, unknown>) => {
      const data = chain('TB', [107.859375, 101.734375, 123.28125]);
      data.nodes.find(({ id }: any) => id === 'B').shape = 'rounded';
      data.config.themeVariables = themeVariables;
      return data;
    };

    it.each([
      ['no theme radius', undefined],
      ['a radius that is not a number', { radius: String(WIDE_CORNER) }],
    ])('steps past the title with %s', async (_, themeVariables) => {
      const data = roundedChain(themeVariables);

      await runElkLayoutCore(data, elkRenderContext);

      expect(crossings(data)).toEqual([]);
    });

    it('stays on the title rather than end on a corner of the theme radius', async () => {
      const data = roundedChain({ radius: WIDE_CORNER });

      await runElkLayoutCore(data, elkRenderContext);

      expect(crossings(data)).toContain('L_A_B_0 x stock');
    });
  });

  it.each([
    ['the title widths a short label gives', [107.859375, 101.734375, 123.28125]],
    ['one-letter titles', [10, 10, 10]],
  ] as const)('does not run through the title of a top-down chain with %s', async (_, titles) => {
    const data = chain('TB', [...titles]);

    await runElkLayoutCore(data, elkRenderContext);

    expect(crossings(data)).toEqual([]);
  });
});

describe('carryLabelsAlong', () => {
  const run = {
    old: { a: { x: 112, y: 135 }, b: { x: 112, y: 330 } },
    new: { a: { x: 167, y: 135 }, b: { x: 167, y: 330 } },
  };

  it('puts the label of a moved edge on the run it moved along', () => {
    const edge: any = { id: 'e', x: 112, y: 210 };

    carryLabelsAlong([{ edge, runs: [run] }]);

    expect(edge).toMatchObject({ x: 167, y: 210 });
  });

  it.each([[{ x: 112 }], [{ y: 210 }], [{}]])(
    'leaves an edge whose label position is only %j alone',
    (position) => {
      const edge: any = { id: 'e', ...position };

      carryLabelsAlong([{ edge, runs: [run] }]);

      expect(edge).toEqual({ id: 'e', ...position });
    }
  );

  it('leaves a label where it is when no run moved', () => {
    const edge: any = { id: 'e', x: 112, y: 210 };

    carryLabelsAlong([{ edge, runs: [] }]);

    expect(edge).toMatchObject({ x: 112, y: 210 });
  });
});
