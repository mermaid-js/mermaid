import { describe, expect, it } from 'vitest';
import { approachBordersSquarely, meetDiamondsAtTheirVertex } from '../direction/endpointClip.js';

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
