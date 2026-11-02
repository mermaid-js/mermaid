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

  it('reads a segment the same whichever end comes first', () => {
    const node = box(0, 0);
    expect(crosses({ x: 40, y: 50 }, { x: 40, y: -10 }, node)).toBe(true);
    expect(crosses({ x: 100, y: 20 }, { x: -10, y: 20 }, node)).toBe(true);
    expect(crosses({ x: 100, y: 20 }, { x: 90, y: 20 }, node)).toBe(false);
    expect(crosses({ x: 40, y: 90 }, { x: 40, y: 50 }, node)).toBe(false);
  });

  it('only lets obstacles that overlap the range block a corridor', () => {
    const above = box(40, -100, 40, 50);
    const found = corridors([0, 100], [above], [], [0, 100]);
    expect(found.map(({ at }) => at)).toEqual([50]);
    const touching = box(40, 100, 40, 50);
    expect(corridors([0, 100], [touching], [], [0, 100]).map(({ at }) => at)).toEqual([50]);
  });

  it('ignores obstacle edges outside the limits, and stretches too narrow to pass', () => {
    expect(corridors([0, 100], [box(500, 0)], [], [0, 300]).map(({ at }) => at)).toEqual([150]);
    const narrow = corridors([0, 100], [box(0, 0, 50), box(51.5, 0, 50)], [], [0, 200]);
    expect(narrow.map(({ at }) => at)).toEqual([150.75]);
    expect(narrow[0]).toEqual({ at: 150.75, low: 101.5, high: 200 });
  });

  it('opens no corridor through an obstacle that spans a wall', () => {
    expect(corridors([0, 100], [box(0, 0, 100)], [50], [0, 100])).toEqual([]);
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

  it('runs straight down at the exit when the target lies a little to one side', () => {
    const route = routeInFlow(plan(box(0, 0), box(20, 120)));
    expect(route?.points).toEqual([
      { x: 40, y: 40 },
      { x: 40, y: 120 },
    ]);
  });

  it('keeps the channel of each middle segment when lanes and corridors join', () => {
    const wall = box(80, 0, 400, 40);
    const route = routeInFlow(plan(box(0, 0), box(200, 120), [wall] as never[]));
    expect(route?.channels).toEqual([undefined, { axis: 'y', low: 60, high: 100 }, undefined]);
    const side = routeInFlow(plan(box(0, 0), box(200, 120)));
    expect(side?.channels).toEqual([undefined, { axis: 'x', low: 80, high: 400 }]);
  });

  it('gives a corridor through an item in between its own channel', () => {
    const route = routeInFlow({
      source: box(0, 0),
      target: box(200, 260),
      gaps: [
        [60, 120],
        [200, 240],
      ],
      obstacles: [box(0, 0), box(200, 260), box(-100, 140, 200), box(200, 140, 200)],
      walls: [],
      limits: [-100, 400],
    });
    expect(route?.points).toEqual([
      { x: 40, y: 40 },
      { x: 40, y: 90 },
      { x: 150, y: 90 },
      { x: 150, y: 220 },
      { x: 240, y: 220 },
      { x: 240, y: 260 },
    ]);
    expect(route?.channels).toEqual([
      undefined,
      { axis: 'y', low: 60, high: 120 },
      { axis: 'x', low: 100, high: 200 },
      { axis: 'y', low: 200, high: 240 },
      undefined,
    ]);
  });

  it('takes no side corridor that leaves too short a run beside the node', () => {
    const route = routeInFlow({
      ...plan(box(0, 0), box(90, 120)),
      walls: [88],
      limits: [0, 400],
      obstacles: [box(0, 0), box(90, 120), box(0, 60, 400, 2)],
    });
    expect(route).toBeUndefined();
  });

  it('gives up when there is no gap to cross', () => {
    expect(routeInFlow({ ...plan(box(0, 0), box(0, 120)), gaps: [] })).toBeUndefined();
  });
});
