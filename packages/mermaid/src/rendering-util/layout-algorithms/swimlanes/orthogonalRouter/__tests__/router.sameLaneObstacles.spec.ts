import { describe, expect, it } from 'vitest';
import { routeEdgesOrthogonal } from '../router.js';
import type { LayoutData } from '../../../../types.js';

// The router works in the TB frame: in LR, x is across the lanes and y runs along them. Three
// boxes 152 wide (their LR width) and 45 deep sit in lane Ops, a fourth in lane Qa, and the back
// edge from the last box of Ops to its first has to get round the middle one.
const BOX_WIDTH = 152;
const BOX_HEIGHT = 45;
const OPS_X = -85.5;
const QA_X = 176;
const RANKS = [22.5, 174.5, 359.8];

const box = (id: string, parentId: string, x: number, y: number) => ({
  id,
  parentId,
  isGroup: false,
  x,
  y,
  width: BOX_WIDTH,
  height: BOX_HEIGHT,
});

const lane = (id: string, x: number, width: number) => ({
  id,
  isGroup: true,
  x,
  y: 200,
  width,
  height: 500,
});

const edge = (start: string, end: string) => ({
  id: `L_${start}_${end}_0`,
  start,
  end,
  type: 'normal',
});

/** Routes the back edge `c -> a` with lane Ops `opsWidth` across, and returns its points. */
const backEdgeRoute = (opsWidth: number, direction: string) => {
  const data = {
    nodes: [
      lane('Ops', OPS_X, opsWidth),
      lane('Qa', QA_X, 260),
      box('a', 'Ops', OPS_X, RANKS[0]),
      box('b', 'Ops', OPS_X, RANKS[1]),
      box('c', 'Ops', OPS_X, RANKS[2]),
      box('d', 'Qa', QA_X, RANKS[2]),
    ],
    edges: [edge('a', 'b'), edge('b', 'c'), edge('c', 'd'), edge('c', 'a')],
    config: {},
  } as unknown as LayoutData;
  routeEdgesOrthogonal(data, direction);
  return data.edges.find((e) => e.id === 'L_c_a_0')?.points ?? [];
};

/**
 * Routes `edges` between the boxes of a tight lane Ops, lane Qa when `withQa` is set, and a
 * node `out` outside every lane at `outside`: once as given, and once without the back edge
 * `c -> a`. Returns the points of `edgeId` from both runs.
 */
const withAndWithoutBackEdge = (
  edgeId: string,
  edges: ReturnType<typeof edge>[],
  outside: { x: number; y: number },
  withQa: boolean
) => {
  const routeOf = (withBackEdge: boolean) => {
    const data = {
      nodes: [
        lane('Ops', OPS_X, BOX_WIDTH + 6),
        ...(withQa ? [lane('Qa', QA_X, 260)] : []),
        box('a', 'Ops', OPS_X, RANKS[0]),
        box('b', 'Ops', OPS_X, RANKS[1]),
        box('c', 'Ops', OPS_X, RANKS[2]),
        ...(withQa ? [box('d', 'Qa', QA_X, RANKS[2])] : []),
        { id: 'out', isGroup: false, ...outside, width: BOX_WIDTH, height: BOX_HEIGHT },
      ],
      // Fresh copies: the router writes the points it finds onto the edges it is given.
      edges: edges.filter((e) => withBackEdge || e.id !== 'L_c_a_0').map((e) => ({ ...e })),
      config: {},
    } as unknown as LayoutData;
    routeEdgesOrthogonal(data, 'LR');
    return data.edges.find((e) => e.id === edgeId)?.points;
  };
  return { withBackEdge: routeOf(true), withoutBackEdge: routeOf(false) };
};

const crossRange = (points: { x: number }[]) => ({
  min: Math.min(...points.map((p) => p.x)),
  max: Math.max(...points.map((p) => p.x)),
});

describe('routing an edge whose ends share a lane', () => {
  // A lane laid out for its widest box with a few pixels to spare, as the layout makes it.
  const TIGHT_LANE = BOX_WIDTH + 6;
  const tightLeft = OPS_X - TIGHT_LANE / 2;
  const tightRight = OPS_X + TIGHT_LANE / 2;

  it('in LR keeps the rail round a box inside a lane with no room round the laid-out boxes', () => {
    const { min, max } = crossRange(backEdgeRoute(TIGHT_LANE, 'LR'));

    expect(min).toBeGreaterThanOrEqual(tightLeft);
    expect(max).toBeLessThanOrEqual(tightRight);
  });

  it('in LR treats a lane as tight when it holds the box and its padding but not the rail', () => {
    // 20 px to spare: the box's 8 px padding fits on either side, the 15 px pipe margin does not.
    const paddedOnly = BOX_WIDTH + 20;
    const { min, max } = crossRange(backEdgeRoute(paddedOnly, 'LR'));

    expect(min).toBeGreaterThanOrEqual(OPS_X - paddedOnly / 2);
    expect(max).toBeLessThanOrEqual(OPS_X + paddedOnly / 2);
  });

  it('in LR keeps the other edges off a rail it adds round a drawn box and leaves unused', () => {
    // `c -> a` passes Triage on the rail left of what Triage draws, not on the one right of it.
    // `b -> out` keeps the laid-out boxes, so neither rail is one of its options.
    const { withBackEdge, withoutBackEdge } = withAndWithoutBackEdge(
      'L_b_out_0',
      [edge('c', 'a'), edge('b', 'out')],
      { x: -20, y: 590 },
      false
    );

    expect(withBackEdge).toEqual(withoutBackEdge);
  });

  it('in LR keeps the other edges off the rails its own route takes round drawn boxes', () => {
    // Here `c -> a` runs on both rails it adds beside what the boxes of Ops draw, and `out -> b`
    // searches past them. They stay out of its search, so it takes its route without `c -> a`.
    const { withBackEdge, withoutBackEdge } = withAndWithoutBackEdge(
      'L_out_b_0',
      [edge('a', 'b'), edge('b', 'c'), edge('c', 'd'), edge('c', 'a'), edge('out', 'b')],
      { x: -75, y: 600 },
      true
    );

    expect(withBackEdge).toEqual(withoutBackEdge);
  });

  it('in LR lets an edge round the laid-out boxes take a rail it asks for itself', () => {
    // `out` sits on the rail `c -> a` takes left of what Ops draws, so `out -> b` asks for that
    // rail itself as it leaves `out`, and routes as it does without `c -> a`.
    const { withBackEdge, withoutBackEdge } = withAndWithoutBackEdge(
      'L_out_b_0',
      [edge('c', 'a'), edge('out', 'b')],
      { x: -131, y: 500 },
      false
    );

    expect(withBackEdge).toEqual(withoutBackEdge);
  });

  it('in LR leaves the other edges the rails an earlier edge added round the laid-out boxes', () => {
    // `s -> q` runs between the lanes first, then `r -> s` round what lane Right draws, then
    // `p -> out` to a node outside both lanes. `r -> s` leaves the rails of `s -> q` alone.
    const sized = (
      id: string,
      parentId: string | undefined,
      x: number,
      y: number,
      w: number,
      h: number
    ) => ({
      id,
      ...(parentId ? { parentId } : {}),
      isGroup: false,
      x,
      y,
      width: w,
      height: h,
    });
    const routeOf = (edges: ReturnType<typeof edge>[]) => {
      const data = {
        nodes: [
          { id: 'Left', isGroup: true, x: 104, y: 300, width: 208, height: 800 },
          sized('p', 'Left', 81, 440, 95, 56),
          sized('q', 'Left', 76, 615, 142, 44),
          { id: 'Right', isGroup: true, x: 345, y: 300, width: 274, height: 800 },
          sized('r', 'Right', 363, 440, 191, 58),
          sized('s', 'Right', 383, 305, 176, 36),
          sized('out', undefined, 608, 412, 75, 41),
        ],
        edges,
        config: {},
      } as unknown as LayoutData;
      routeEdgesOrthogonal(data, 'LR');
      return data.edges.find((e) => e.id === 'L_p_out_0')?.points;
    };

    expect(routeOf([edge('p', 'out'), edge('r', 's'), edge('s', 'q')])).toEqual(
      routeOf([edge('p', 'out'), edge('s', 'q')])
    );
  });

  it('in TB keeps the laid-out width, which is what the box draws there', () => {
    const { min, max } = crossRange(backEdgeRoute(TIGHT_LANE, 'TB'));

    expect(min < OPS_X - BOX_WIDTH / 2 || max > OPS_X + BOX_WIDTH / 2).toBe(true);
  });

  it('in LR keeps the laid-out boxes in a lane with room round them', () => {
    const roomy = BOX_WIDTH + 200;
    const { min, max } = crossRange(backEdgeRoute(roomy, 'LR'));

    expect(min < OPS_X - BOX_WIDTH / 2 || max > OPS_X + BOX_WIDTH / 2).toBe(true);
  });
});
