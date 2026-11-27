import { describe, it, expect } from 'vitest';
import { curveKind, routePath } from './routePath.js';
import type { RoutePoint } from './routePath.js';

const v = (x: number, y: number): RoutePoint => ({ x, y, axis: 'v' });
const h = (x: number, y: number): RoutePoint => ({ x, y, axis: 'h' });

describe('curveKind', () => {
  it('passes linear, the step curves and rounded through', () => {
    for (const name of ['linear', 'step', 'stepBefore', 'stepAfter', 'rounded'] as const) {
      expect(curveKind(name)).toBe(name);
    }
  });

  it('draws every other curve name, and no name, as curved', () => {
    for (const name of ['basis', 'cardinal', 'monotoneX', 'natural', 'bumpY', 'unknown']) {
      expect(curveKind(name)).toBe('curved');
    }
    expect(curveKind(undefined)).toBe('curved');
  });
});

describe('routePath', () => {
  it('draws a linear route as straight lines', () => {
    expect(routePath([v(0, 0), v(0, 100)], 'linear', 0, 0).d).toBe('M0,0L0,100');
  });

  it('draws a linear route between offset points as one diagonal', () => {
    expect(routePath([v(0, 0), v(40, 100)], 'linear', 0, 0).d).toBe('M0,0L40,100');
  });

  it('draws a curved route between offset points as one S along the flow', () => {
    // run 100, across 40: ease = min(0.5, 4 * 100 / 40) = 0.5, so the handles reach 50.
    expect(routePath([v(0, 0), v(40, 100)], 'curved', 0, 0).d).toBe('M0,0C0,50 40,50 40,100');
  });

  it('keeps short wide S-curves flat with the lower ease bound', () => {
    // run 10, across 200: ease = max(0.25, 40 / 200) = 0.25, handles reach 2.5.
    expect(routePath([v(0, 0), v(200, 10)], 'curved', 0, 0).d).toBe('M0,0C0,2.5 200,7.5 200,10');
  });

  it('draws the S across the flow for a horizontal route', () => {
    expect(routePath([h(0, 0), h(100, 40)], 'curved', 0, 0).d).toBe('M0,0C50,0 50,40 100,40');
  });

  it('rounds a right-angle bend of a rounded route with a radius-5 arc', () => {
    expect(routePath([v(0, 0), v(0, 50), h(50, 50)], 'rounded', 0, 0).d).toBe(
      'M0,0L0,45A5,5 0 0,0 5,50L50,50'
    );
  });

  it('sweeps the arc the other way for a bend to the left', () => {
    expect(routePath([v(0, 0), v(0, 50), h(-50, 50)], 'rounded', 0, 0).d).toBe(
      'M0,0L0,45A5,5 0 0,1 -5,50L-50,50'
    );
  });

  it('shrinks the bend radius where a leg is too short for it', () => {
    expect(routePath([v(0, 0), v(0, 3), h(50, 3)], 'rounded', 0, 0).d).toBe(
      'M0,0A3,3 0 0,0 3,3L50,3'
    );
  });

  it('rounds a bend of a curved route with handles along both legs', () => {
    // Leg 50 each, handles at 50 * (1 - 0.62) = 19 from the corner.
    expect(routePath([v(0, 0), v(0, 50), h(50, 50)], 'curved', 0, 0).d).toBe(
      'M0,0C0,31 19,50 50,50'
    );
  });

  it('turns a step route halfway, rounding both corners by up to 12', () => {
    expect(routePath([v(0, 0), v(40, 100)], 'step', 0, 0).d).toBe(
      'M0,0L0,38Q0,50 12,50L28,50Q40,50 40,62L40,100'
    );
  });

  it('turns a stepBefore route at the start and a stepAfter route at the end', () => {
    // stepBefore leaves one corner at (0,0); the move is then a plain bend at (40,0).
    expect(routePath([v(0, 0), v(40, 100)], 'stepBefore', 0, 0).d).toBe(
      'M0,0L28,0Q40,0 40,12L40,100'
    );
    expect(routePath([v(0, 0), v(40, 100)], 'stepAfter', 0, 0).d).toBe(
      'M0,0L0,88Q0,100 12,100L40,100'
    );
  });

  it('skips a point part of the way along one straight run', () => {
    expect(routePath([v(0, 0), v(0, 40), v(0, 100)], 'rounded', 0, 0).d).toBe('M0,0L0,100');
  });

  it('trims both ends along the route and reports the untrimmed tips', () => {
    const path = routePath([v(0, 0), v(0, 100)], 'linear', 4, 6);
    expect(path.d).toBe('M0,4L0,94');
    expect([path.sx, path.sy, path.ex, path.ey]).toEqual([0, 0, 0, 100]);
    // The start marker points back out of the line, the end marker along it.
    expect(path.sdy).toBe(-1);
    expect(path.edy).toBe(1);
  });

  it('runs straight into a trimmed end after a curve', () => {
    // End moves 4 back to y 96; a lead of min(6, 96 / 4) = 6 runs straight before it.
    expect(routePath([v(0, 0), v(40, 100)], 'curved', 0, 4).d).toBe('M0,0C0,45 40,45 40,90L40,96');
  });

  it('runs straight out of a trimmed start before a curve', () => {
    // Start moves 4 to y 4; lead min(6, 96 / 4) = 6 to y 10; the S then covers 90.
    expect(routePath([v(0, 0), v(40, 100)], 'curved', 4, 0).d).toBe('M0,4L0,10C0,55 40,55 40,100');
  });

  it('points the end marker along the flow axis of a curved arrival', () => {
    const path = routePath([v(0, 0), v(40, 100)], 'curved', 0, 4);
    expect([path.ex, path.ey, path.edy]).toEqual([40, 100, 1]);
    expect(Math.abs(path.edx)).toBe(0);
  });
});
