import { describe, expect, it } from 'vitest';
import {
  dedupeConsecutivePoints,
  orthogonalSegmentsForPoints,
  orthogonalSegmentsStrictlyCross,
} from '../direction/geometry.js';
import type { Point } from '../direction/geometry.js';
import { buildRouteCrossings, buildCrossingCounter } from '../direction/segmentCrossingIndex.js';
import type { SegmentEnds } from '../direction/segmentCrossingIndex.js';

/** The tolerance the crossing cleanup passes to the predicate and to the index. */
const EPSILON = 1e-3;

/** The walk the index replaces: every pair, through the predicate itself. */
function bruteForceCrossings(queried: SegmentEnds[], indexed: SegmentEnds[]): number {
  let count = 0;
  for (const one of queried) {
    for (const other of indexed) {
      if (orthogonalSegmentsStrictlyCross(one.a, one.b, other.a, other.b, EPSILON)) {
        count++;
      }
    }
  }
  return count;
}

const segment = (ax: number, ay: number, bx: number, by: number): SegmentEnds => ({
  a: { x: ax, y: ay },
  b: { x: bx, y: by },
});

const count = (queried: SegmentEnds[], indexed: SegmentEnds[]): number =>
  buildCrossingCounter(indexed, EPSILON).crossings(queried);

/** Integers below a bound from a 32-bit linear congruential generator, the same for the same seed. */
function seededRandom(seed: number): (below: number) => number {
  let state = seed;
  return (below) => {
    state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
    return Math.floor((state / 2 ** 32) * below);
  };
}

/** Random cases per comparison with the walk; enough that every branch of the index runs. */
const RANDOM_CASES = 300;
/** Of those, how many must find a crossing (115 do), so agreeing on zero cannot pass alone. */
const MIN_CASES_WITH_CROSSINGS = 100;

/** Grid values and small offsets on, inside, at and just past the tolerance. */
const OFFSETS = [0, 0, 0, 0.0004, 0.001, 0.0011, -0.0007, 0.5, 3];

function coordinate(next: (below: number) => number): number {
  return 10 * next(8) + OFFSETS[next(OFFSETS.length)];
}

/** A route of right-angle turns, its corners nudged off the grid now and then. */
function route(next: (below: number) => number): Point[] {
  const points: Point[] = [{ x: coordinate(next), y: coordinate(next) }];
  let horizontal = next(2) === 0;
  for (let turn = 0; turn < 1 + next(5); turn++) {
    const last = points[points.length - 1];
    points.push(
      horizontal
        ? { x: coordinate(next), y: last.y + OFFSETS[next(OFFSETS.length)] / 4 }
        : { x: last.x + OFFSETS[next(OFFSETS.length)] / 4, y: coordinate(next) }
    );
    horizontal = !horizontal;
  }
  return points;
}

/** Raw point-to-point segments, so diagonals and near-points reach the index too. */
function rawSegments(points: Point[]): SegmentEnds[] {
  return points.slice(1).map((b, i) => ({ a: points[i], b }));
}

describe('buildCrossingCounter', () => {
  const horizontal = segment(0, 0, 10, 0);

  it('counts a vertical through the middle of a horizontal, from either side', () => {
    expect(count([horizontal], [segment(5, -5, 5, 5)])).toBe(1);
    expect(count([segment(5, 5, 5, -5)], [segment(10, 0, 0, 0)])).toBe(1);
  });

  it('does not count a segment that ends on the other or at its end', () => {
    expect(count([horizontal], [segment(5, 0, 5, 5)])).toBe(0);
    expect(count([horizontal], [segment(5, -5, 5, 0)])).toBe(0);
    expect(count([horizontal], [segment(0, -5, 0, 5)])).toBe(0);
    expect(count([horizontal], [segment(10, -5, 10, 5)])).toBe(0);
  });

  it('reads the tolerance the way the predicate does', () => {
    expect(count([horizontal], [segment(0.0005, -5, 0.0005, 5)])).toBe(0);
    expect(count([horizontal], [segment(0.002, -5, 0.002, 5)])).toBe(1);
    expect(count([horizontal], [segment(5, 0.0005, 5, 5)])).toBe(0);
    expect(count([horizontal], [segment(5, -0.002, 5, 5)])).toBe(1);
  });

  it('reads a segment off its axis by exactly the tolerance as a diagonal', () => {
    const tiltedAcross = segment(0, 0, 10, 0.001);
    const tiltedDown = segment(0, -5, 0.001, 5);
    expect(bruteForceCrossings([tiltedAcross], [segment(5, -5, 5, 5)])).toBe(0);
    expect(count([tiltedAcross], [segment(5, -5, 5, 5)])).toBe(0);
    expect(count([segment(5, -5, 5, 5)], [tiltedAcross])).toBe(0);
    expect(bruteForceCrossings([tiltedDown], [segment(-10, 0, 10, 0)])).toBe(0);
    expect(count([tiltedDown], [segment(-10, 0, 10, 0)])).toBe(0);
    expect(count([segment(-10, 0, 10, 0)], [tiltedDown])).toBe(0);
  });

  it('never counts a segment only two tolerances long, even through its middle', () => {
    const stub = segment(5, -0.001, 5, 0.001);
    expect(bruteForceCrossings([horizontal], [stub])).toBe(0);
    expect(count([horizontal], [stub])).toBe(0);
    expect(count([stub], [horizontal])).toBe(0);
  });

  it('never counts parallel, collinear, diagonal or zero-length segments', () => {
    expect(count([horizontal], [segment(2, 0, 8, 0), segment(0, 3, 10, 3)])).toBe(0);
    expect(count([horizontal], [segment(2, -2, 8, 2)])).toBe(0);
    expect(count([horizontal], [segment(5, 0, 5, 0), segment(5, -0.0004, 5, 0.0004)])).toBe(0);
    expect(count([segment(5, -5, 5, 5)], [segment(4.9995, 0, 5.0005, 0)])).toBe(0);
  });

  it('counts every crossing of a grid, and nothing against an empty index', () => {
    const rows = [1, 2, 3].map((y) => segment(0, y, 10, y));
    const columns = [4, 5, 6].map((x) => segment(x, 0, x, 10));
    expect(count(rows, columns)).toBe(9);
    expect(count(columns, [...rows, ...columns])).toBe(9);
    expect(count(rows, [])).toBe(0);
    expect(count([], columns)).toBe(0);
  });

  it('counts a segment once per indexed segment it crosses, duplicates included', () => {
    const column = segment(5, -5, 5, 5);
    expect(count([horizontal, horizontal], [column, column])).toBe(4);
  });

  it('agrees with the pair-by-pair walk on random routes that share lines and tolerances', () => {
    let seedsWithCrossings = 0;
    for (let seed = 1; seed <= RANDOM_CASES; seed++) {
      const next = seededRandom(seed);
      const routes = Array.from({ length: 2 + next(12) }, () => route(next));
      const indexed = routes.flatMap((points) =>
        next(2) === 0
          ? rawSegments(points)
          : orthogonalSegmentsForPoints(dedupeConsecutivePoints(points))
      );
      const queried = rawSegments(route(next));
      const expected = bruteForceCrossings(queried, indexed);
      expect({ seed, crossings: count(queried, indexed) }).toEqual({ seed, crossings: expected });
      // The cleanup also relies on the predicate not caring which segment comes first.
      expect(bruteForceCrossings(indexed, queried)).toBe(expected);
      seedsWithCrossings += expected > 0 ? 1 : 0;
    }
    expect(seedsWithCrossings).toBeGreaterThan(MIN_CASES_WITH_CROSSINGS);
  });
});

describe('buildRouteCrossings', () => {
  const across = [segment(0, 0, 10, 0)];
  const down = [segment(5, -5, 5, 5)];
  const downAgain = [segment(7, -5, 7, 5)];

  it('counts each crossing between two routes once, and each route its own', () => {
    const routes = buildRouteCrossings(
      new Map([
        ['across', across],
        ['down', down],
        ['downAgain', downAgain],
      ]),
      EPSILON
    );
    expect(routes.total).toBe(2);
    expect(routes.of('across')).toBe(2);
    expect(routes.of('down')).toBe(1);
    expect(routes.of('downAgain')).toBe(1);
  });

  it('counts a replacement against every route except the one it replaces', () => {
    const routes = buildRouteCrossings(
      new Map([
        ['across', across],
        ['down', down],
      ]),
      EPSILON
    );
    const elsewhere = [segment(3, -5, 3, 5), segment(3, 5, 8, 5)];
    expect(routes.withOthers('down', elsewhere)).toBe(1);
    expect(routes.withOthers('across', elsewhere)).toBe(0);
    expect(routes.withOthers('down', down)).toBe(routes.of('down'));
  });

  it('counts a route it does not hold against every route', () => {
    const routes = buildRouteCrossings(
      new Map([
        ['down', down],
        ['downAgain', downAgain],
      ]),
      EPSILON
    );
    expect(routes.of('across')).toBe(0);
    expect(routes.withOthers('across', across)).toBe(2);
  });

  it('never counts a route that crosses itself', () => {
    const loop = rawSegments([
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 5 },
      { x: 5, y: 5 },
      { x: 5, y: -5 },
    ]);
    expect(bruteForceCrossings(loop, loop)).toBe(2);
    const routes = buildRouteCrossings(new Map([['loop', loop]]), EPSILON);
    expect(routes.total).toBe(0);
    expect(routes.of('loop')).toBe(0);
  });

  it('agrees with the walk over every pair of routes on random routes', () => {
    for (let seed = 1; seed <= RANDOM_CASES / 2; seed++) {
      const next = seededRandom(seed);
      const segmentsByRoute = new Map(
        Array.from({ length: 2 + next(10) }, (_, i) => [i, rawSegments(route(next))] as const)
      );
      const routes = buildRouteCrossings(segmentsByRoute, EPSILON);
      const others = (except: number): SegmentEnds[] =>
        [...segmentsByRoute].filter(([i]) => i !== except).flatMap(([, segments]) => segments);
      let total = 0;
      for (const [i, segments] of segmentsByRoute) {
        const own = bruteForceCrossings(segments, others(i));
        expect({ seed, route: i, of: routes.of(i) }).toEqual({ seed, route: i, of: own });
        const replacement = rawSegments(route(next));
        expect({ seed, route: i, with: routes.withOthers(i, replacement) }).toEqual({
          seed,
          route: i,
          with: bruteForceCrossings(replacement, others(i)),
        });
        total += own;
      }
      expect({ seed, total: routes.total }).toEqual({ seed, total: total / 2 });
    }
  });
});
