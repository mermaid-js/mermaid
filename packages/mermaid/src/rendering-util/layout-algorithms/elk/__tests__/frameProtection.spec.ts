import { describe, expect, it } from 'vitest';
import { findFrameOverlaps, routeAwayFromFrames } from '../frameProtection.js';
import { segmentHitsTitle } from '../titleProtection.js';

const frame = { left: 0, right: 100, top: 0, bottom: 100 };

describe('ELK frame clearance without opaque overlays', () => {
  it.each([
    [
      { x: 0, y: -30 },
      { x: 0, y: 140 },
    ],
    [
      { x: 100, y: 140 },
      { x: 100, y: -30 },
    ],
    [
      { x: -30, y: 0 },
      { x: 140, y: 0 },
    ],
    [
      { x: 140, y: 100 },
      { x: -30, y: 100 },
    ],
  ])('moves a parallel run off each side while keeping endpoints: %j', (...points) => {
    expect(findFrameOverlaps(points, [frame])).toHaveLength(1);
    const output = routeAwayFromFrames(points, [frame], []);
    expect(findFrameOverlaps(output, [frame])).toHaveLength(0);
    expect(output[0]).toEqual(points[0]);
    expect(output.at(-1)).toEqual(points.at(-1));
    expect(points).toHaveLength(2);
  });
  it('distinguishes legal entry/exit crossings from border overlap', () => {
    const points = [
      { x: -20, y: 50 },
      { x: 120, y: 50 },
    ];
    expect(findFrameOverlaps(points, [frame])).toEqual([]);
    expect(routeAwayFromFrames(points, [frame], [])).toEqual(points);
  });
  it('accounts for the stroke-width corridor, not just exact equality', () => {
    const points = [
      { x: 1.5, y: 10 },
      { x: 1.5, y: 90 },
    ];
    expect(findFrameOverlaps(points, [frame])).toHaveLength(1);
    expect(findFrameOverlaps(routeAwayFromFrames(points, [frame], []), [frame])).toHaveLength(0);
  });
  it('rejects a new route through node or invisible title obstacles', () => {
    const obstacle = { left: -35, right: -1, top: -40, bottom: 150 };
    const points = [
      { x: 0, y: -30 },
      { x: 0, y: 140 },
    ];
    const routed = routeAwayFromFrames(points, [frame], [obstacle]);
    expect(findFrameOverlaps(routed, [frame])).toEqual([]);
    expect(routed.some((p, i) => i && segmentHitsTitle(routed[i - 1], p, obstacle))).toBe(false);
    expect(routed.some((p) => p.x > 0)).toBe(true);
  });
  it('checks adjacent and nested frame sides, not only the first frame', () => {
    const second = { left: 10, right: 120, top: 20, bottom: 110 };
    const routed = routeAwayFromFrames(
      [
        { x: 0, y: -30 },
        { x: 0, y: 140 },
      ],
      [frame, second],
      []
    );
    expect(findFrameOverlaps(routed, [frame, second])).toEqual([]);
  });
  it('retains the route and exposes an unresolved overlap when no safe lane exists', () => {
    const points = [
      { x: 0, y: -30 },
      { x: 0, y: 140 },
    ];
    const routed = routeAwayFromFrames(
      points,
      [frame],
      [{ left: -60, right: 60, top: -40, bottom: 150 }]
    );
    expect(routed).toEqual(points);
    expect(findFrameOverlaps(routed, [frame])).toHaveLength(1);
  });
  it('repairs a shallow border crossing with a perpendicular portal', () => {
    const points = [
      { x: -200, y: -10 },
      { x: 300, y: 10 },
    ];
    expect(findFrameOverlaps(points, [frame]).length).toBeGreaterThan(0);
    const routed = routeAwayFromFrames(points, [frame], []);
    expect(findFrameOverlaps(routed, [frame])).toEqual([]);
    expect(routed[0]).toEqual(points[0]);
    expect(routed.at(-1)).toEqual(points.at(-1));
  });
  it('repairs a row of separate frames without rejecting unchanged remote segments', () => {
    const frames = Array.from({ length: 6 }, (_, i) => ({
      left: i * 200,
      right: i * 200 + 100,
      top: 0,
      bottom: 100,
    }));
    const points = [
      { x: -30, y: -1 },
      { x: 1200, y: -1 },
    ];
    const routed = routeAwayFromFrames(points, frames, frames);
    expect(findFrameOverlaps(routed, frames)).toEqual([]);
    expect(routed[0]).toEqual(points[0]);
    expect(routed.at(-1)).toEqual(points.at(-1));
  });
  it('does not treat a short corner touch as running along a frame', () => {
    expect(
      findFrameOverlaps(
        [
          { x: 0, y: -20 },
          { x: 0, y: 4 },
        ],
        [frame]
      )
    ).toEqual([]);
  });
});
