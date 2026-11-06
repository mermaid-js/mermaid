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
