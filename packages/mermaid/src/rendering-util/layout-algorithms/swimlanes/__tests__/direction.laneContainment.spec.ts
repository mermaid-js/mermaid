import { describe, expect, it } from 'vitest';
import { resolveRenderedOrthogonalCrossings } from '../direction/materializedGeometry.js';
import {
  crossingPointsBetween,
  sharedLaneBand,
  staysInsideBand,
} from '../direction/laneContainment.js';
import { buildLaneModel } from '../lanes.js';
import { EDGE_ROUTING } from '../config.js';

interface Point {
  x: number;
  y: number;
}

const node = (id: string, x: number, y: number, parentId = 'L') => ({
  id,
  parentId,
  isGroup: false,
  x,
  y,
  width: 40,
  height: 30,
});
const laneBox = (id: string, x: number, y: number, width: number, height: number) => ({
  id,
  isGroup: true,
  x,
  y,
  width,
  height,
});
const mapOf = (nodes: { id: string }[]) => new Map<string, any>(nodes.map((n) => [n.id, n]));
const pathOf = (points: number[][]): Point[] => points.map(([x, y]) => ({ x, y }));

describe('the lane an edge stays in', () => {
  const nodes = [
    laneBox('L', 200, 0, 400, 200),
    laneBox('M', 200, 300, 400, 200),
    node('A', 50, 0),
    node('B', 350, 0),
    node('C', 50, 300, 'M'),
  ];
  const laneModel = buildLaneModel(nodes as any);

  it('is the box of the lane both ends sit in', () => {
    expect(sharedLaneBand({ start: 'A', end: 'B' }, laneModel, mapOf(nodes))).toEqual({
      left: 0,
      right: 400,
      top: -100,
      bottom: 100,
    });
  });

  it('is none for an edge between two lanes', () => {
    expect(sharedLaneBand({ start: 'A', end: 'C' }, laneModel, mapOf(nodes))).toBeUndefined();
  });

  it.each([
    [
      'touches every border',
      [
        [0, 0],
        [0, -100],
        [400, 100],
      ],
      true,
    ],
    [
      'runs past the top',
      [
        [0, 0],
        [0, -101],
      ],
      false,
    ],
    [
      'runs past the left',
      [
        [0, 0],
        [-1, 0],
      ],
      false,
    ],
    [
      'runs past the right',
      [
        [400, 0],
        [401, 0],
      ],
      false,
    ],
  ])('holds a route that %s: %j', (_, points, inside) => {
    const band = { left: 0, right: 400, top: -100, bottom: 100 };

    expect(staysInsideBand(pathOf(points), band)).toBe(inside);
  });
});

describe('where two routes cross', () => {
  it('is every point where a horizontal and a vertical segment cross away from their ends', () => {
    const across = pathOf([
      [0, 0],
      [100, 0],
      [100, 50],
    ]);
    const down = pathOf([
      [50, -10],
      [50, 60],
    ]);

    expect(crossingPointsBetween(across, down)).toEqual([{ x: 50, y: 0 }]);
    expect(crossingPointsBetween(down, across)).toEqual([{ x: 50, y: 0 }]);
  });

  it('is none where one route only ends on the other', () => {
    const across = pathOf([
      [0, 0],
      [100, 0],
    ]);
    const touching = pathOf([
      [50, -10],
      [50, 0],
    ]);

    expect(crossingPointsBetween(across, touching)).toEqual([]);
  });
});

describe('resolving crossings keeps an edge inside the lane both its ends share', () => {
  const run = (nodes: any[], edges: any[]) => {
    resolveRenderedOrthogonalCrossings(edges, mapOf(nodes));
    return edges[0].points as Point[];
  };
  // Lane L is 400 across and 200 deep; A and B sit at either end of it.
  const lane = laneBox('L', 200, 0, 400, 200);
  const band = { left: 0, right: 400, top: -100, bottom: 100 };
  const outside = () => ({
    id: 'A_B',
    start: 'A',
    end: 'B',
    points: pathOf([
      [50, -15],
      [50, -150],
      [350, -150],
      [350, -15],
    ]),
  });

  it('puts an edge that runs outside its lane back inside it', () => {
    const points = run([lane, node('A', 50, 0), node('B', 350, 0)], [outside()]);

    expect(staysInsideBand(points, band)).toBe(true);
  });

  it('leaves the route of an edge with no route inside its lane', () => {
    // The lane is only as deep as its boxes, and C blocks the row between A and B.
    const shallow = laneBox('L', 200, 0, 400, 30);
    const edge = outside();
    const before = structuredClone(edge.points);

    const points = run([shallow, node('A', 50, 0), node('B', 350, 0), node('C', 200, 0)], [edge]);

    expect(points).toEqual(before);
  });

  it('prefers more crossings to a hop under an arrowhead', () => {
    // C blocks the row. Above it, an edge arrives on C's top face, so a rail over C crosses it
    // just above its arrowhead; below it two edges run far from their ends.
    const nodes = [lane, node('A', 50, 0), node('B', 350, 0), node('C', 200, 0)];
    const intoC = {
      id: 'X_C',
      points: pathOf([
        [200, -95],
        [200, -15],
      ]),
    };
    const farLeft = {
      id: 'P',
      points: pathOf([
        [120, -5],
        [120, 95],
      ]),
    };
    const farRight = {
      id: 'Q',
      points: pathOf([
        [280, -5],
        [280, 95],
      ]),
    };

    const points = run(nodes, [outside(), intoC, farLeft, farRight]);
    // A hop 20 px from the arrowhead's tip runs into it.
    const nearArrowhead = crossingPointsBetween(points, intoC.points).filter(
      (point) => Math.abs(point.y - -15) <= 20
    );

    expect(staysInsideBand(points, band)).toBe(true);
    expect(nearArrowhead).toEqual([]);
  });

  it('prefers a route that crosses nothing to a shorter one that crosses an edge', () => {
    // C sits a little below the row, so the rail over it is the shorter one; an edge runs down
    // through that rail, far from either of its ends.
    const nodes = [lane, node('A', 50, 0), node('B', 350, 0), node('C', 200, 10)];
    const across = {
      id: 'P',
      points: pathOf([
        [120, -98],
        [120, -5],
      ]),
    };

    const points = run(nodes, [outside(), across]);

    expect(staysInsideBand(points, band)).toBe(true);
    expect(crossingPointsBetween(points, across.points)).toEqual([]);
  });

  it('leaves the route of an edge whose lane box holds none of its nodes', () => {
    // A and B belong to lane L but sit outside its box, so L has no tracks of its own.
    const away = laneBox('L', 200, 500, 400, 200);
    const edge = outside();
    const before = structuredClone(edge.points);

    const points = run([away, node('A', 50, 0), node('B', 350, 0)], [edge]);

    expect(points).toEqual(before);
  });

  it('brings an edge back into its lane as it would alone, after one in another lane', () => {
    // Each lane holds an edge that runs out of the diagram. The one in Bottom comes back first;
    // the one in Top must still be built on the diagram's tracks and its own lane's.
    const sized = (id: string, parentId: string, x: number, y: number, w: number, h: number) => ({
      ...node(id, x, y, parentId),
      width: w,
      height: h,
    });
    const nodes = [
      laneBox('Top', 300, 0, 700, 212),
      sized('A', 'Top', 19, 27, 59, 26),
      sized('B', 'Top', -1, -34, 56, 25),
      sized('C', 'Top', 19, -23, 59, 39),
      laneBox('Bottom', 300, 300, 700, 124),
      sized('D', 'Bottom', 65, 323, 73, 28),
      sized('E', 'Bottom', 422, 323, 60, 29),
    ];
    const outOfTop = () => ({
      id: 'A_B',
      start: 'A',
      end: 'B',
      points: pathOf([
        [19, 27],
        [19, 1500],
        [-1, 1500],
        [-1, -34],
      ]),
    });
    const outOfBottom = {
      id: 'D_E',
      start: 'D',
      end: 'E',
      points: pathOf([
        [65, 323],
        [65, 1500],
        [422, 1500],
        [422, 323],
      ]),
    };
    const alone = outOfTop();
    resolveRenderedOrthogonalCrossings([alone], mapOf(nodes));
    const second = outOfTop();

    resolveRenderedOrthogonalCrossings([outOfBottom, second], mapOf(nodes));

    expect(second.points).toEqual(alone.points);
  });
});
