import { describe, it, expect } from 'vitest';
import {
  LABEL_GAP_PADDING,
  MAX_LINKED_GAP_NODE_WIDTHS,
  justifyFrames,
  justifySlots,
  moveInnerEdges,
  neededSize,
  rowsToJustify,
  shareGaps,
  slotsOf,
} from '../rowJustify.js';
import type { ElkEdgeLike } from '../groupPorts.js';

const ACROSS = { pos: 'x', size: 'width', along: 'y', depth: 'height' } as const;
const box = (id: string, x: number, y = 0, width = 50, height = 30, children?: any[]) => ({
  id,
  x,
  y,
  width,
  height,
  ...(children ? { children } : {}),
});

describe('slots and spacing', () => {
  it('puts boxes that overlap across the flow in one slot', () => {
    const slots = slotsOf([box('b', 100), box('a', 0), box('c', 10, 40)], ACROSS);
    expect(slots.map((slot) => slot.map(({ id }) => id))).toEqual([['a', 'c'], ['b']]);
  });

  it('spreads slots with equal gaps inside the padding, and centres a single one', () => {
    const slots = slotsOf([box('a', 10), box('b', 70), box('c', 130)], ACROSS);
    expect([...justifySlots(slots, 400, 20, ACROSS)]).toEqual([
      ['a', 10],
      ['b', 105],
      ['c', 200],
    ]);
    expect([...justifySlots([[box('a', 10)]], 400, 20, ACROSS)]).toEqual([['a', 165]]);
  });

  it('measures the room slots need with a gap between them', () => {
    const slots = slotsOf([box('a', 0), box('b', 60)], ACROSS);
    expect(neededSize(slots, 20, [30], ACROSS)).toBe(170);
  });
});

describe('shareGaps', () => {
  it('gives every gap one size while each least size fits in it', () => {
    expect(shareGaps([0, 50], 200)).toEqual([100, 100]);
  });

  it('keeps a gap that needs more than the common size, and shares the rest', () => {
    expect(shareGaps([0, 150, 0], 300)).toEqual([75, 150, 75]);
    expect(shareGaps([120, 150], 200)).toEqual([120, 150]);
  });
});

describe('moveInnerEdges', () => {
  const edge = (id: string, source: string, target: string, bends = 0): ElkEdgeLike => ({
    id,
    sources: [source],
    targets: [target],
    container: 'row',
    sections: [
      {
        startPoint: { x: 50, y: 15 },
        bendPoints: Array.from({ length: bends }, () => ({ x: 60, y: 15 })),
        endPoint: { x: 70, y: 15 },
      },
    ],
    labels: [{ x: 55, y: 5 }],
  });

  it('stretches a straight link with the nodes it joins', () => {
    const link = edge('e', 'a', 'b');
    expect(moveInnerEdges([link], 'row', new Map([['b', 30]]), ACROSS)).toBe(true);
    expect(link.sections?.[0]).toMatchObject({ startPoint: { x: 50 }, endPoint: { x: 100 } });
    expect(link.labels?.[0].x).toBe(70);
  });

  it('refuses a bent link whose ends move apart, and moves nothing', () => {
    const bent = edge('e', 'a', 'b', 1);
    const straight = edge('f', 'a', 'b');
    expect(moveInnerEdges([straight, bent], 'row', new Map([['b', 30]]), ACROSS)).toBe(false);
    expect(straight.sections?.[0].endPoint.x).toBe(70);
  });
});

/** Two stacked rows: a wide one of three nodes and a narrow one of two. */
const twoRows = (labelWidth = 0) => {
  const wide = box('wide', 0, 0, 400, 70, [box('a', 20, 20), box('b', 90, 20), box('c', 160, 20)]);
  const band = box('band', 0, 100, 200, 100, [
    box('left', 20, 20, 60, 60, [box('l1', 5, 5, 40, 20)]),
    box('right', 100, 20, 60, 60, [box('r1', 5, 5, 40, 20)]),
  ]);
  return {
    children: [wide, band],
    edges: [
      { id: 'x', sources: ['l1'], targets: ['r1'], labels: [{ width: labelWidth }] },
    ] as ElkEdgeLike[],
    separated: new Map([
      ['wide', 'RIGHT' as const],
      ['band', 'RIGHT' as const],
      ['left', 'DOWN' as const],
      ['right', 'DOWN' as const],
    ]),
    groups: [{ frames: ['left', 'right'] }],
    direction: 'DOWN' as const,
    tree: {
      parentById: {
        a: 'wide',
        b: 'wide',
        c: 'wide',
        left: 'band',
        right: 'band',
        l1: 'left',
        r1: 'right',
      },
      childrenById: {},
    },
  };
};

/**
 * One row of three nodes over a narrow second row, with a labelled link between the last two whose
 * label ELK centred on the gap between them.
 */
const labelledRow = (labelWidth: number) => {
  const row = box('row', 0, 0, 300, 70, [box('a', 20, 20), box('b', 90, 20), box('c', 160, 20)]);
  const other = box('other', 0, 100, 300, 70, [box('d', 20, 20)]);
  const link: ElkEdgeLike = {
    id: 'bc',
    sources: ['b'],
    targets: ['c'],
    container: 'row',
    sections: [{ startPoint: { x: 140, y: 35 }, endPoint: { x: 160, y: 35 } }],
    labels: [{ x: 150 - labelWidth / 2, y: 25, width: labelWidth }],
  };
  return {
    children: [row, other],
    edges: [link],
    separated: new Map([
      ['row', 'RIGHT' as const],
      ['other', 'RIGHT' as const],
    ]),
    groups: [],
    direction: 'DOWN' as const,
    tree: { parentById: { a: 'row', b: 'row', c: 'row', d: 'other' }, childrenById: {} },
  };
};

/** A row of two nodes over a wide row of one, with or without a link between the two. */
const pairRow = (linked: boolean) => ({
  children: [
    box('pair', 0, 0, 200, 70, [box('a', 20, 20), box('b', 90, 20)]),
    box('wide', 0, 100, 1000, 70, [box('w', 20, 20, 960, 30)]),
  ],
  edges: linked
    ? ([
        {
          id: 'ab',
          sources: ['a'],
          targets: ['b'],
          container: 'pair',
          sections: [{ startPoint: { x: 70, y: 35 }, endPoint: { x: 90, y: 35 } }],
        },
      ] as ElkEdgeLike[])
    : [],
  separated: new Map([
    ['pair', 'RIGHT' as const],
    ['wide', 'RIGHT' as const],
  ]),
  groups: [],
  direction: 'DOWN' as const,
  tree: { parentById: { a: 'pair', b: 'pair', w: 'wide' }, childrenById: {} },
});

/**
 * A row of `count` nodes over a band of three columns 100 wide, packed at the left of a 600 wide
 * frame; `links` joins row nodes to columns by place.
 */
const rowOverBand = (count: number, links: [number, number][] = []) => {
  const nodes = Array.from({ length: count }, (_, index) => box(`n${index}`, 20 + 60 * index, 20));
  const columns = [0, 1, 2].map((index) =>
    box(`col${index}`, 20 + 110 * index, 20, 100, 60, [box(`c${index}`, 25, 20)])
  );
  return {
    children: [box('row', 0, 0, 600, 70, nodes), box('band', 0, 100, 600, 100, columns)],
    edges: links.map(([from, to]) => ({
      id: `n${from}-c${to}`,
      sources: [`n${from}`],
      targets: [`c${to}`],
    })) as ElkEdgeLike[],
    separated: new Map([
      ['row', 'RIGHT' as const],
      ['band', 'RIGHT' as const],
      ...columns.map(({ id }) => [id, 'DOWN' as const] as const),
    ]),
    groups: [{ frames: columns.map(({ id }) => id) }],
    direction: 'DOWN' as const,
    tree: {
      parentById: {
        ...Object.fromEntries(nodes.map(({ id }) => [id, 'row'])),
        ...Object.fromEntries(
          columns.flatMap(({ id }, index) => [
            [id, 'band'],
            [`c${index}`, id],
          ])
        ),
      },
      childrenById: {},
    },
  };
};
const centresOf = (frame: { children?: { x?: number; width?: number }[] }) =>
  frame.children?.map(({ x = 0, width = 0 }) => x + width / 2);

describe('justifyFrames over a band', () => {
  it('centres each node of a row over the column of the same place', () => {
    const input = rowOverBand(3);
    justifyFrames(input);
    const [row, band] = input.children;
    expect(centresOf(row)).toEqual(centresOf(band));
  });

  it('centres each node over the one column it links to, when the counts differ', () => {
    const input = rowOverBand(2, [
      [0, 0],
      [1, 2],
    ]);
    justifyFrames(input);
    const [row, band] = input.children;
    const columns = centresOf(band) ?? [];
    expect(centresOf(row)).toEqual([columns[0], columns[2]]);
  });

  it('marks a row it puts over the columns, so its links do not hold it back', () => {
    expect(rowsToJustify(rowOverBand(3))).toEqual([
      { id: 'row', band: false, overBand: true },
      { id: 'band', band: true, overBand: false },
    ]);
    expect(rowsToJustify(rowOverBand(2, [[0, 1]]))[0].overBand).toBe(false);
  });

  it('spreads a row evenly when its nodes do not each link to one column', () => {
    const input = rowOverBand(2, [[0, 1]]);
    justifyFrames(input);
    expect(input.children[0].children?.map(({ x }) => x)).toEqual([20, 530]);
  });
});

/**
 * Two columns side by side in an LR diagram, each three nodes under a title: ELK leaves more room
 * above the first node, for the title, than below the last.
 */
const titledColumns = () => {
  const column = (id: string, x: number, prefix: string) =>
    box(id, x, 0, 100, 267, [
      box(`${prefix}1`, 24, 51, 50, 48),
      box(`${prefix}2`, 24, 123, 50, 48),
      box(`${prefix}3`, 24, 195, 50, 48),
    ]);
  const chain = (prefix: string, container: string): ElkEdgeLike[] =>
    [1, 2].map((index) => ({
      id: `${prefix}${index}`,
      sources: [`${prefix}${index}`],
      targets: [`${prefix}${index + 1}`],
      container,
      sections: [{ startPoint: { x: 49, y: 99 }, endPoint: { x: 49, y: 123 } }],
    }));
  return {
    children: [column('left', 0, 'a'), column('right', 200, 'b')],
    edges: [...chain('a', 'left'), ...chain('b', 'right')],
    separated: new Map([
      ['left', 'DOWN' as const],
      ['right', 'DOWN' as const],
    ]),
    groups: [],
    direction: 'RIGHT' as const,
    tree: { parentById: {}, childrenById: {} },
  };
};

describe('justifyFrames', () => {
  it('keeps the gaps of a column whose title leaves more room above it than below', () => {
    const input = titledColumns();
    justifyFrames(input);
    expect(input.children[0].children?.map(({ y }) => y)).toEqual([51, 123, 195]);
  });

  it('spreads two nodes with no link between them to the ends of a wide row', () => {
    const input = pairRow(false);
    justifyFrames(input);
    expect(input.children[0].children?.map(({ x }) => x)).toEqual([20, 930]);
  });

  it('centres two linked nodes rather than stretch their link past the widest gap', () => {
    const input = pairRow(true);
    justifyFrames(input);
    const [a, b] = input.children[0].children ?? [];
    const gap = MAX_LINKED_GAP_NODE_WIDTHS * 50;
    expect(b.x - (a.x + a.width)).toBe(gap);
    expect(a.x).toBe((1000 - 100 - gap) / 2);
    expect(input.edges[0].sections?.[0].endPoint.x).toBe(b.x);
  });

  it('keeps the gaps of a row equal while the label between two nodes fits', () => {
    const input = labelledRow(20);
    justifyFrames(input);
    const [row] = input.children;
    expect(row.width).toBe(300);
    expect(row.children?.map(({ x }) => x)).toEqual([20, 125, 230]);
  });

  it('widens the gap between two nodes of a row to hold the label of the link between them', () => {
    const input = labelledRow(200);
    justifyFrames(input);
    const [row, other] = input.children;
    const [a, b, c] = row.children ?? [];
    expect(c.x - (b.x + b.width)).toBe(200 + 2 * LABEL_GAP_PADDING);
    expect(b.x - (a.x + a.width)).toBe(0);
    expect(row.width).toBe(20 + 3 * 50 + 224 + 20);
    expect(other.width).toBe(row.width);
    const [label] = input.edges[0].labels ?? [];
    expect((label.x ?? 0) + 100).toBe((b.x + b.width + c.x) / 2);
  });

  it('spreads the columns of a narrow band over the width of the widest row', () => {
    const input = twoRows();
    expect([...justifyFrames(input)].sort()).toEqual(['band', 'wide']);
    const [wide, band] = input.children;
    expect(band.width).toBe(400);
    expect(band.children?.map(({ x }) => x)).toEqual([20, 320]);
    expect(wide.children?.map(({ x }) => x)).toEqual([20, 175, 330]);
  });

  it('widens every row so the gap between two columns holds the widest label', () => {
    const narrowLabel = twoRows(100);
    justifyFrames(narrowLabel);
    expect(narrowLabel.children[1].width).toBe(400);
    const wideLabel = twoRows(400);
    justifyFrames(wideLabel);
    const [wide, band] = wideLabel.children;
    const [left, right] = band.children ?? [];
    expect(right.x - (left.x + left.width)).toBe(400 + 2 * LABEL_GAP_PADDING);
    expect(wide.width).toBe(band.width);
  });

  it('spreads only the frames it is told to, and nothing in a reversed flow', () => {
    const input = twoRows();
    expect([...justifyFrames({ ...input, include: (_, band) => band })]).toEqual(['band']);
    expect(input.children[0].children?.map(({ x }) => x)).toEqual([20, 90, 160]);
    expect(justifyFrames({ ...twoRows(), direction: 'UP' }).size).toBe(0);
  });
});
