import { describe, expect, it } from 'vitest';
import {
  approachBordersSquarely,
  cropEdgeEndsToShapes,
  meetDiamondsAtTheirVertex,
} from '../direction/endpointClip.js';
import type { Edge, Node } from '../../../types.js';

interface Point {
  x: number;
  y: number;
}

const CENTRE: Point = { x: 100, y: 100 };
const BOX = 40;
const DRAWN = 20;

/** A node that is not from any one diagram: only its metadata says how edges meet it. */
function node(metadata: Record<string, unknown>, height = BOX) {
  return {
    id: 'n',
    shape: 'rect',
    ...CENTRE,
    width: BOX,
    height,
    metadata: { drawnExtent: { width: DRAWN, height: DRAWN }, ...metadata },
  };
}

const arriving = (id: string, ...points: Point[]) => ({ id, start: 's', end: 'n', points });

const lastOf = (edge: { points: Point[] }) => edge.points[edge.points.length - 1];

describe('endpointProfile vertex', () => {
  const run = (metadata: Record<string, unknown>) => {
    const edge = arriving('e', { x: 40, y: 100 }, { x: 60, y: 100 }, CENTRE);
    meetDiamondsAtTheirVertex([edge], new Map([['n', node(metadata)]]));
    return edge;
  };

  it('ends an edge on the drawn vertex of a node that asks for it', () => {
    expect(lastOf(run({ endpointProfile: 'vertex' }))).toEqual({ x: 90, y: 100 });
  });

  it('leaves an edge alone on a node that does not ask for it', () => {
    expect(lastOf(run({}))).toEqual(CENTRE);
  });

  it('ignores a profile it does not know', () => {
    expect(lastOf(run({ endpointProfile: 'rounded' }))).toEqual(CENTRE);
  });
});

describe('endpointProfile oneLinePerVertex', () => {
  const ends = (metadata: Record<string, unknown>) => {
    const first = arriving('e1', { x: 40, y: 100 }, { x: 60, y: 100 }, CENTRE);
    const second = arriving('e2', { x: 40, y: 100 }, { x: 60, y: 100 }, CENTRE);
    meetDiamondsAtTheirVertex([first, second], new Map([['n', node(metadata)]]));
    return [lastOf(first), lastOf(second)];
  };

  it('gives each edge its own vertex when the node asks for it', () => {
    const [first, second] = ends({ endpointProfile: 'vertex', oneLinePerVertex: true });
    expect(first).not.toEqual(second);
  });

  it('lets edges share a vertex otherwise', () => {
    const [first, second] = ends({ endpointProfile: 'vertex' });
    expect(first).toEqual(second);
  });
});

describe('endpointProfile captionBelow', () => {
  const BELOW = 80;
  const endFromBelow = (metadata: Record<string, unknown>) => {
    const edge = arriving('e', { x: 100, y: 200 }, { x: 100, y: 150 }, CENTRE);
    meetDiamondsAtTheirVertex([edge], new Map([['n', node(metadata, BELOW)]]));
    return lastOf(edge);
  };

  it('keeps edges off the bottom vertex of a node that writes below its shape', () => {
    const end = endFromBelow({ endpointProfile: 'vertex', captionBelow: true });
    expect(end).not.toEqual({ x: 100, y: 110 });
  });

  it('uses the bottom vertex of a node that does not', () => {
    expect(endFromBelow({ endpointProfile: 'vertex' })).toEqual({ x: 100, y: 110 });
  });
});

describe('endpointProfile flat', () => {
  const FACE_STUB = 18;
  const FACE = CENTRE.x - DRAWN / 2;
  const run = (metadata: Record<string, unknown>) => {
    const edge = arriving('e', { x: FACE, y: 40 }, { x: FACE, y: 100 });
    approachBordersSquarely([edge], new Map([['n', node(metadata)]]));
    return edge.points;
  };

  it('turns an edge that runs along a face of a flat-sided node out and back square', () => {
    const points = run({ endpointProfile: 'flat' });
    expect(points).toContainEqual({ x: FACE - FACE_STUB, y: 100 });
  });

  it('leaves the edge as it was on a node that does not ask for it', () => {
    expect(run({})).toEqual([
      { x: FACE, y: 40 },
      { x: FACE, y: 100 },
    ]);
  });
});

describe('endpointProfile crop', () => {
  const HALF_WIDTH = 76;
  const HALF_HEIGHT = 22.5;
  const NODE_SIZE = { width: 2 * HALF_WIDTH, height: 2 * HALF_HEIGHT };
  const UPPER = { x: 549.4222222222222, y: 0 };
  const LOWER = { x: 549.4222222222222, y: 252 };
  const ARRIVAL_X = 481.8666666666667;
  const RAIL_Y = 176;

  const placed = (
    id: string,
    at: { x: number; y: number },
    metadata?: Record<string, unknown>
  ): Node => ({
    id,
    isGroup: false,
    ...at,
    ...NODE_SIZE,
    ...(metadata ? { metadata } : {}),
  });

  /** A route that leaves the lower node's top face, climbs, and runs on into the upper node and out of its far face. */
  const throughTheTarget = (): Point[] => [
    { x: LOWER.x, y: LOWER.y - HALF_HEIGHT },
    { x: LOWER.x, y: RAIL_Y },
    { x: ARRIVAL_X, y: RAIL_Y },
    { x: ARRIVAL_X, y: UPPER.y },
    { x: UPPER.x + HALF_WIDTH, y: UPPER.y },
  ];

  type RoutedEdge = Edge & { isLayoutOnly?: boolean };

  const run = (edge: RoutedEdge, ...nodes: Node[]) => {
    cropEdgeEndsToShapes([edge], new Map(nodes.map((node) => [node.id, node])));
    return edge.points;
  };

  const cropped = (lower: Node, upper: Node, points: Point[]) =>
    run({ id: 'e', start: lower.id, end: upper.id, points }, lower, upper);

  it('leaves the points of an edge between plain nodes as the router drew them', () => {
    expect(cropped(placed('lower', LOWER), placed('upper', UPPER), throughTheTarget())).toEqual(
      throughTheTarget()
    );
  });

  it.each([
    ['flat-sided nodes', { endpointProfile: 'flat' }],
    ['pointed nodes with a drawn extent', { endpointProfile: 'vertex', drawnExtent: NODE_SIZE }],
  ])('ends an edge at the border of %s where it first meets them', (_name, metadata) => {
    const points = cropped(
      placed('lower', LOWER, metadata),
      placed('upper', UPPER, metadata),
      throughTheTarget()
    );
    expect(points?.at(-1)).toEqual({ x: ARRIVAL_X, y: UPPER.y + HALF_HEIGHT });
    expect(points).toHaveLength(throughTheTarget().length - 1);
  });

  describe('leaves the points as they are', () => {
    const FLAT = { endpointProfile: 'flat' };
    const lower = placed('lower', LOWER, FLAT);
    const upper = placed('upper', UPPER, FLAT);
    const between = { id: 'e', start: 'lower', end: 'upper', points: throughTheTarget() };

    it('of a layout-only edge', () => {
      expect(run({ ...between, isLayoutOnly: true }, lower, upper)).toEqual(throughTheTarget());
    });

    it('of an edge that starts on a group', () => {
      const group: Node = { id: 'lower', isGroup: true, ...LOWER, ...NODE_SIZE, metadata: FLAT };
      expect(run({ ...between }, group, upper)).toEqual(throughTheTarget());
    });

    it('of an edge that ends on a group', () => {
      const group: Node = { id: 'upper', isGroup: true, ...UPPER, ...NODE_SIZE, metadata: FLAT };
      expect(run({ ...between }, lower, group)).toEqual(throughTheTarget());
    });

    it('of an edge that starts and ends on one node', () => {
      expect(run({ ...between, start: 'upper' }, upper)).toEqual(throughTheTarget());
    });
  });

  it('crops each end by what its own node declares', () => {
    const buriedAtBothEnds: Point[] = [
      { x: LOWER.x, y: LOWER.y },
      { x: LOWER.x, y: RAIL_Y },
      { x: ARRIVAL_X, y: RAIL_Y },
      { x: ARRIVAL_X, y: UPPER.y },
    ];
    const points = cropped(
      placed('lower', LOWER),
      placed('upper', UPPER, { endpointProfile: 'flat' }),
      buriedAtBothEnds
    );
    expect(points?.[0]).toEqual(buriedAtBothEnds[0]);
    expect(points?.at(-1)).toEqual({ x: ARRIVAL_X, y: UPPER.y + HALF_HEIGHT });
  });

  it('crops to the drawn extent of a node that draws smaller than its box', () => {
    const DRAWN = { width: 40, height: 20 };
    const points = cropped(
      placed('lower', LOWER),
      placed('upper', UPPER, { endpointProfile: 'vertex', drawnExtent: DRAWN }),
      [
        { x: UPPER.x, y: RAIL_Y },
        { x: UPPER.x, y: UPPER.y },
      ]
    );
    expect(points?.at(-1)).toEqual({ x: UPPER.x, y: UPPER.y + DRAWN.height / 2 });
  });
});
