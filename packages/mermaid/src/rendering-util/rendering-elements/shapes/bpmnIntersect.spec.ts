import { describe, expect, it } from 'vitest';
import type { Node } from '../../types.js';
import { faceCentreIntersect, ringIntersect } from './bpmnShapeCore.js';

const at = (x: number, y: number) => ({ x, y }) as Node;

const DIAMETER = 36;
const RADIUS = DIAMETER / 2;
const SIDE_REACH = RADIUS * 0.85;

const distance = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y);

describe('ringIntersect', () => {
  const centre = { x: 10, y: 20 };
  const node = at(centre.x, centre.y);

  it.each([
    ['below', { x: 10, y: 200 }, { x: 10, y: 20 + RADIUS }],
    ['above', { x: 10, y: -200 }, { x: 10, y: 20 - RADIUS }],
    ['right', { x: 300, y: 20 }, { x: 10 + RADIUS, y: 20 }],
    ['left', { x: -300, y: 20 }, { x: 10 - RADIUS, y: 20 }],
  ])('lands on the ring, straight %s', (_side, point, expected) => {
    const hit = ringIntersect(node, DIAMETER, point);
    expect(hit.x).toBeCloseTo(expected.x);
    expect(hit.y).toBeCloseTo(expected.y);
  });

  it.each([
    ['steeply below to the right', { x: 40, y: 220 }],
    ['steeply below to the left', { x: -20, y: 220 }],
    ['steeply above to the right', { x: 40, y: -180 }],
    ['shallow to the right, below', { x: 310, y: 40 }],
    ['shallow to the right, above', { x: 310, y: 0 }],
    ['shallow to the left, below', { x: -290, y: 40 }],
    ['shallow to the left, above', { x: -290, y: 0 }],
  ])('stays on the ring for a point %s', (_where, point) => {
    expect(distance(ringIntersect(node, DIAMETER, point), centre)).toBeCloseTo(RADIUS);
  });

  it('follows a point that is off-axis but inside the side reach', () => {
    const below = ringIntersect(node, DIAMETER, { x: 10 + 5, y: 220 });
    expect(below.x).toBeCloseTo(15);
    expect(below.y).toBeGreaterThan(20);
    const right = ringIntersect(node, DIAMETER, { x: 310, y: 20 - 5 });
    expect(right.y).toBeCloseTo(15);
    expect(right.x).toBeGreaterThan(10);
  });

  it('stops sliding along the ring at 85% of the radius', () => {
    const below = ringIntersect(node, DIAMETER, { x: 10 + 500, y: 600 });
    expect(below.x).toBeCloseTo(10 + SIDE_REACH);
    expect(below.y).toBeGreaterThan(20);
    const above = ringIntersect(node, DIAMETER, { x: 10 - 500, y: -600 });
    expect(above.x).toBeCloseTo(10 - SIDE_REACH);
    expect(above.y).toBeLessThan(20);
    const right = ringIntersect(node, DIAMETER, { x: 600, y: 20 + 500 });
    expect(right.y).toBeCloseTo(20 + SIDE_REACH);
    expect(right.x).toBeGreaterThan(10);
    const left = ringIntersect(node, DIAMETER, { x: -600, y: 20 - 500 });
    expect(left.y).toBeCloseTo(20 - SIDE_REACH);
    expect(left.x).toBeLessThan(10);
  });

  it('prefers the top or bottom of the ring when the point is exactly diagonal', () => {
    const hit = ringIntersect(node, DIAMETER, { x: 10 + 100, y: 20 + 100 });
    expect(hit.y).toBeGreaterThan(20);
    expect(hit.x).toBeCloseTo(10 + SIDE_REACH);
  });

  it('attaches at the bottom when the point is the centre itself', () => {
    const hit = ringIntersect(node, DIAMETER, centre);
    expect(hit.x).toBeCloseTo(10);
    expect(hit.y).toBeCloseTo(20 + RADIUS);
  });

  it('treats a missing position as the origin', () => {
    const hit = ringIntersect({} as Node, DIAMETER, { x: 0, y: -100 });
    expect(hit.x).toBeCloseTo(0);
    expect(hit.y).toBeCloseTo(-RADIUS);
  });
});

describe('faceCentreIntersect', () => {
  const node = at(10, 20);

  it.each([
    ['right', { x: 200, y: 30 }, { x: 10 + 25, y: 20 }],
    ['left', { x: -200, y: 25 }, { x: 10 - 25, y: 20 }],
    ['bottom', { x: 12, y: 200 }, { x: 10, y: 20 + 25 }],
    ['top', { x: 12, y: -200 }, { x: 10, y: 20 - 25 }],
  ])('lands on the centre of the %s face, whatever the cross offset', (_face, point, expected) => {
    expect(faceCentreIntersect(node, 50, 50, point)).toEqual(expected);
  });

  it('goes vertical when the point is exactly diagonal of a square', () => {
    expect(faceCentreIntersect(node, 50, 50, { x: 110, y: 120 })).toEqual({ x: 10, y: 45 });
    expect(faceCentreIntersect(node, 50, 50, { x: -90, y: -80 })).toEqual({ x: 10, y: -5 });
  });

  it('puts the diagonal where the corner of a wide box is, not at 45 degrees', () => {
    const wide = { width: 100, height: 80 };
    expect(faceCentreIntersect(node, wide.width, wide.height, { x: 100, y: 80 })).toEqual({
      x: 10 + 50,
      y: 20,
    });
    expect(faceCentreIntersect(node, wide.width, wide.height, { x: 60, y: 80 })).toEqual({
      x: 10,
      y: 20 + 40,
    });
  });

  it('attaches at the bottom when the point is the centre itself', () => {
    expect(faceCentreIntersect(node, 50, 50, { x: 10, y: 20 })).toEqual({ x: 10, y: 45 });
  });

  it('treats a missing position as the origin', () => {
    expect(faceCentreIntersect({} as Node, 50, 50, { x: 100, y: 0 })).toEqual({ x: 25, y: 0 });
  });
});
