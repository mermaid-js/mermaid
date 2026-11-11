import { describe, expect, it } from 'vitest';
import { compactRoute, reduceRouteBends, routeBends } from '../bendReduction.js';
import { findFrameOverlaps } from '../frameProtection.js';
import { segmentHitsTitle } from '../titleProtection.js';
const frame = { left: 0, right: 100, top: 0, bottom: 100 };
describe('whole-route bend reduction with hard safety gates', () => {
  it('replaces an inward frame notch with a single legal elbow, not another notch', () => {
    const input = [
      { x: 50, y: 50 },
      { x: 100, y: 50 },
      { x: 100, y: 112 },
      { x: 90, y: 112 },
      { x: 90, y: 160 },
      { x: 150, y: 160 },
      { x: 150, y: 200 },
    ];
    const output = reduceRouteBends(input, [frame], []);
    expect(routeBends(input)).toBe(5);
    expect(routeBends(output)).toBe(1);
    expect(output).toEqual([
      { x: 50, y: 50 },
      { x: 150, y: 50 },
      { x: 150, y: 200 },
    ]);
    expect(findFrameOverlaps(output, [frame])).toEqual([]);
    expect(input).toHaveLength(7);
  });
  it('coalesces six independent frame notches into one shared external lane', () => {
    const frames = Array.from({ length: 6 }, (_, i) => ({
      left: i * 200,
      right: i * 200 + 100,
      top: 0,
      bottom: 100,
    }));
    const input = [{ x: -30, y: -1 }];
    for (const f of frames) {
      input.push(
        { x: f.left - 12, y: -1 },
        { x: f.left - 12, y: -10 },
        { x: f.right + 12, y: -10 },
        { x: f.right + 12, y: -1 }
      );
    }
    input.push({ x: 1230, y: -1 });
    const output = reduceRouteBends(input, frames, frames);
    expect(routeBends(output)).toBe(4);
    expect(routeBends(input)).toBe(24);
    expect(findFrameOverlaps(output, frames)).toEqual([]);
    expect(output[0]).toEqual(input[0]);
    expect(output.at(-1)).toEqual(input.at(-1));
  });
  it('does not buy fewer bends by crossing node/text obstacles', () => {
    const box = { left: 40, right: 60, top: -10, bottom: 20 };
    const input = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 30 },
      { x: 90, y: 30 },
      { x: 90, y: 0 },
      { x: 100, y: 0 },
    ];
    const output = reduceRouteBends(input, [], [box]);
    expect(output.some((p, i) => i && segmentHitsTitle(output[i - 1], p, box))).toBe(false);
    expect(routeBends(output)).toBe(4);
  });
  it('rejects shortcuts that introduce even one new point crossing', () => {
    const input = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 30 },
      { x: 90, y: 30 },
      { x: 90, y: 0 },
      { x: 100, y: 0 },
    ];
    const other = [
      { x: 50, y: -5 },
      { x: 50, y: 5 },
    ];
    expect(reduceRouteBends(input, [], [], [other])).toEqual(input);
  });
  it('cannot hide an added crossing at a collinear waypoint of another edge', () => {
    const input = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 30 },
      { x: 90, y: 30 },
      { x: 90, y: 0 },
      { x: 100, y: 0 },
    ];
    const other = [
      { x: 50, y: -5 },
      { x: 50, y: 0 },
      { x: 50, y: 5 },
    ];
    expect(reduceRouteBends(input, [], [], [other])).toEqual(input);
  });
  it('keeps start/end directions even when a shorter L route would change ports', () => {
    const input = [
      { x: 0, y: 0 },
      { x: 0, y: 20 },
      { x: 100, y: 20 },
      { x: 100, y: 100 },
    ];
    const output = reduceRouteBends(input, [], []);
    expect(output[1].x).toBe(0);
    expect(output[1].y).toBeGreaterThan(0);
    expect(output.at(-2)!.x).toBe(100);
    expect(output.at(-2)!.y).toBeLessThan(100);
    expect(routeBends(output)).toBe(2);
  });
  it('does not detach an edge label to obtain a straight shortcut', () => {
    const input = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 30 },
      { x: 90, y: 30 },
      { x: 90, y: 0 },
      { x: 100, y: 0 },
    ];
    const output = reduceRouteBends(input, [], [], [], [{ x: 50, y: 30 }]);
    expect(output).toEqual(input);
  });
  it('never fakes fewer bends by folding back over its own stroke', () => {
    const input = [
      { x: 0, y: 0 },
      { x: 20, y: 0 },
      { x: 20, y: 10 },
      { x: 30, y: 10 },
      { x: 30, y: 30 },
      { x: 80, y: 30 },
      { x: 80, y: 0 },
      { x: 60, y: 0 },
    ];
    expect(routeBends(reduceRouteBends(input, [], []))).toBe(4);
  });
  it('counts genuine direction changes, not duplicated/collinear waypoints', () => {
    const input = [
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 20, y: 0 },
      { x: 20, y: 10 },
    ];
    expect(routeBends(input)).toBe(1);
    expect(compactRoute(input)).toHaveLength(3);
  });
  it('does not convert straight diagonal routes to orthogonal staircases', () => {
    const input = [
      { x: 0, y: 0 },
      { x: 10, y: 20 },
      { x: 20, y: 40 },
    ];
    expect(reduceRouteBends(input, [], [])).toEqual(input);
  });
});
