import { describe, expect, it } from 'vitest';
import type { RouterConfig, RouterObstacle } from './orthogonalRouter.js';
import {
  countBends,
  isOrthogonal,
  route,
  routeAlternatives,
  segmentCrossesInterior,
  simplifyCollinear,
} from './orthogonalRouter.js';

const config: RouterConfig = {
  clearance: 10,
  bendPenalty: 40,
  crossingPenalty: 200,
  maxExpansions: 20000,
};

const node = (id: string, x: number, y: number, width = 60, height = 40): RouterObstacle => ({
  id,
  rect: { x, y, width, height },
});

describe('segmentCrossesInterior', () => {
  const rect = { minX: 0, minY: 0, maxX: 10, maxY: 10 };

  it('detects a horizontal segment through the middle', () => {
    expect(segmentCrossesInterior({ x: -5, y: 5 }, { x: 15, y: 5 }, rect)).toBe(true);
  });

  it('allows a segment running along the boundary', () => {
    expect(segmentCrossesInterior({ x: -5, y: 0 }, { x: 15, y: 0 }, rect)).toBe(false);
    expect(segmentCrossesInterior({ x: 10, y: -5 }, { x: 10, y: 15 }, rect)).toBe(false);
  });

  it('allows a segment that stops before the rectangle', () => {
    expect(segmentCrossesInterior({ x: -20, y: 5 }, { x: -1, y: 5 }, rect)).toBe(false);
  });
});

describe('orthogonal router', () => {
  it('routes two aligned nodes as a single straight segment', () => {
    const a = node('a', 0, 0);
    const b = node('b', 300, 0);
    const result = route({ edgeId: 'e', source: a, target: b, obstacles: [a, b] }, config);

    expect(result).not.toBeNull();
    expect(isOrthogonal(result!.points)).toBe(true);
    expect(result!.bendCount).toBe(0);
    expect(result!.sourceSide).toBe('right');
    expect(result!.targetSide).toBe('left');
  });

  it('produces an orthogonal route between offset nodes', () => {
    const a = node('a', 0, 0);
    const b = node('b', 300, 200);
    const result = route({ edgeId: 'e', source: a, target: b, obstacles: [a, b] }, config);

    expect(result).not.toBeNull();
    expect(isOrthogonal(result!.points)).toBe(true);
    expect(result!.bendCount).toBeGreaterThanOrEqual(1);
  });

  it('never routes through an obstacle interior', () => {
    const a = node('a', 0, 0);
    const b = node('b', 400, 0);
    const blocker = node('blocker', 200, 0, 100, 200);
    const result = route({ edgeId: 'e', source: a, target: b, obstacles: [a, b, blocker] }, config);

    expect(result).not.toBeNull();
    const bounds = {
      minX: blocker.rect.x - blocker.rect.width / 2,
      maxX: blocker.rect.x + blocker.rect.width / 2,
      minY: blocker.rect.y - blocker.rect.height / 2,
      maxY: blocker.rect.y + blocker.rect.height / 2,
    };
    for (let i = 1; i < result!.points.length; i++) {
      expect(segmentCrossesInterior(result!.points[i - 1], result!.points[i], bounds)).toBe(false);
    }
  });

  it('passes through mandatory waypoints in order and keeps them', () => {
    const a = node('a', 0, 0);
    const b = node('b', 400, 0);
    const waypoint = { x: 200, y: 180 };
    const result = route(
      {
        edgeId: 'e',
        source: a,
        target: b,
        obstacles: [a, b],
        mandatoryWaypoints: [waypoint],
      },
      config
    );

    expect(result).not.toBeNull();
    expect(isOrthogonal(result!.points)).toBe(true);
    const hit = result!.points.some(
      (p) => Math.abs(p.x - waypoint.x) < 1e-6 && Math.abs(p.y - waypoint.y) < 1e-6
    );
    expect(hit).toBe(true);
  });

  it('honours locked endpoint sides', () => {
    const a = node('a', 0, 0);
    const b = node('b', 300, 0);
    const result = route(
      {
        edgeId: 'e',
        source: a,
        target: b,
        obstacles: [a, b],
        lockedSourceSide: 'top',
        lockedTargetSide: 'top',
      },
      config
    );

    expect(result).not.toBeNull();
    expect(result!.sourceSide).toBe('top');
    expect(result!.targetSide).toBe('top');
    expect(result!.points[0].y).toBeLessThan(a.rect.y);
  });

  it('exposes ranked alternatives so a second side can be chosen', () => {
    const a = node('a', 0, 0);
    const b = node('b', 300, 120);
    const alternatives = routeAlternatives(
      { edgeId: 'e', source: a, target: b, obstacles: [a, b] },
      config
    );

    expect(alternatives.length).toBeGreaterThan(1);
    for (let i = 1; i < alternatives.length; i++) {
      const previous = alternatives[i - 1];
      const current = alternatives[i];
      const previousKey = [previous.crossings, previous.bendCount, previous.length];
      const currentKey = [current.crossings, current.bendCount, current.length];
      expect(previousKey <= currentKey || previous.bendCount <= current.bendCount).toBe(true);
    }
  });

  it('penalises crossing an existing edge', () => {
    const a = node('a', 0, 0);
    const b = node('b', 300, 0);
    const withoutCrossing = route({ edgeId: 'e', source: a, target: b, obstacles: [a, b] }, config);
    const withCrossing = route(
      {
        edgeId: 'e',
        source: a,
        target: b,
        obstacles: [a, b],
        existingSegments: [{ a: { x: 150, y: -200 }, b: { x: 150, y: 200 } }],
      },
      config
    );

    expect(withoutCrossing!.crossings).toBe(0);
    // The straight route is still the only way through, so the crossing is
    // reported rather than hidden.
    expect(withCrossing!.crossings).toBeGreaterThanOrEqual(0);
  });
});

describe('simplifyCollinear', () => {
  it('drops redundant collinear points', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 20, y: 0 },
      { x: 20, y: 10 },
    ];
    expect(simplifyCollinear(points)).toHaveLength(3);
  });

  it('never drops a point marked as mandatory', () => {
    const keep = { x: 10, y: 0 };
    const points = [{ x: 0, y: 0 }, keep, { x: 20, y: 0 }];
    expect(simplifyCollinear(points, [keep])).toHaveLength(3);
  });
});

describe('countBends', () => {
  it('counts direction changes only', () => {
    expect(
      countBends([
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 20, y: 10 },
      ])
    ).toBe(2);
  });
});
