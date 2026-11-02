import { describe, it, expect } from 'vitest';
import {
  corridors,
  crosses,
  crossings,
  isFree,
  routeInFlow,
  routeLength,
  simplify,
  turns,
} from '../rowRouter.js';

const box = (x: number, y: number, width = 80, height = 40) => ({ x, y, width, height });

describe('route geometry', () => {
  it('tells a segment through a box from one along its edge', () => {
    const node = box(0, 0);
    expect(crosses({ x: 40, y: -10 }, { x: 40, y: 50 }, node)).toBe(true);
    expect(crosses({ x: 0, y: -10 }, { x: 0, y: 50 }, node)).toBe(false);
    expect(crosses({ x: 40, y: 40 }, { x: 40, y: 90 }, node)).toBe(false);
    expect(
      isFree(
        [
          { x: 90, y: 0 },
          { x: 90, y: 90 },
        ],
        [node]
      )
    ).toBe(true);
  });

  it('drops repeated points and straight joints, and counts turns and length', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 0, y: 10 },
      { x: 0, y: 10 },
      { x: 0, y: 20 },
      { x: 30, y: 20 },
    ];
    expect(simplify(points)).toEqual([
      { x: 0, y: 0 },
      { x: 0, y: 20 },
      { x: 30, y: 20 },
    ]);
    expect(turns(points)).toBe(1);
    expect(routeLength(points)).toBe(50);
  });

  it('finds corridors between obstacles and walls, inside the limits', () => {
    const found = corridors([0, 100], [box(0, 0), box(200, 0)], [150], [-20, 300]);
    expect(found.map(({ at }) => at)).toEqual([-10, 115, 175, 290]);
    expect(corridors([200, 300], [box(0, 0)], [], [0, 100]).map(({ at }) => at)).toEqual([50]);
  });
});

describe('routeInFlow', () => {
  const plan = (source: ReturnType<typeof box>, target: ReturnType<typeof box>, extra = []) => ({
    source,
    target,
    gaps: [[60, 100]] as [number, number][],
    obstacles: [source, target, ...extra],
    walls: [],
    limits: [-100, 400] as [number, number],
  });

  it('runs straight down between lined-up nodes', () => {
    const route = routeInFlow(plan(box(0, 0), box(0, 120)));
    expect(route?.points).toEqual([
      { x: 40, y: 40 },
      { x: 40, y: 120 },
    ]);
  });

  it('leaves by a side when that saves a turn, and still enters from above', () => {
    const route = routeInFlow(plan(box(0, 0), box(200, 120)));
    expect(route?.points).toEqual([
      { x: 80, y: 20 },
      { x: 240, y: 20 },
      { x: 240, y: 120 },
    ]);
  });

  it('turns twice in the lane of the gap when a side exit is blocked', () => {
    const wall = box(80, 0, 400, 40);
    const route = routeInFlow(plan(box(0, 0), box(200, 120), [wall] as never[]));
    expect(route?.points).toEqual([
      { x: 40, y: 40 },
      { x: 40, y: 80 },
      { x: 240, y: 80 },
      { x: 240, y: 120 },
    ]);
    expect(route?.channels[1]).toEqual({ axis: 'y', low: 60, high: 100 });
  });

  it('enters a node from the side when a node above it blocks the top', () => {
    const blocker = box(200, 120);
    const target = box(200, 200);
    const route = routeInFlow(plan(box(0, 0), target, [blocker] as never[]));
    const points = route?.points ?? [];
    expect(isFree(points, [blocker, target])).toBe(true);
    const [beforeEnd, end] = points.slice(-2);
    expect(beforeEnd.y).toBe(end.y);
    expect([target.x, target.x + target.width]).toContain(end.x);
    expect(turns(points)).toBeLessThanOrEqual(3);
  });

  it('crosses an item in between through a corridor, straight when it can', () => {
    const between = [box(0, 140), box(200, 140)];
    const route = routeInFlow({
      source: box(100, 0),
      target: box(100, 260),
      gaps: [
        [60, 120],
        [200, 240],
      ],
      obstacles: [box(100, 0), box(100, 260), ...between],
      walls: [],
      limits: [-100, 400],
    });
    expect(route?.points).toEqual([
      { x: 140, y: 40 },
      { x: 140, y: 260 },
    ]);
  });

  it('crosses a line drawn inside a frame rather than take a long detour round it', () => {
    const line = { x: -100, y: 79, width: 380, height: 2 };
    const route = routeInFlow({ ...plan(box(0, 0), box(0, 120)), crossable: [line] });
    expect(route?.points).toEqual([
      { x: 40, y: 40 },
      { x: 40, y: 120 },
    ]);
    expect(crossings(route?.points ?? [], [line])).toBe(1);
  });

  it('gives up when there is no gap to cross', () => {
    expect(routeInFlow({ ...plan(box(0, 0), box(0, 120)), gaps: [] })).toBeUndefined();
  });
});
