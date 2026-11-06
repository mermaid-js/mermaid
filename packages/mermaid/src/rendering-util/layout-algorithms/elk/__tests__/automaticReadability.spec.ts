import { describe, expect, it } from 'vitest';
import { elkAutomaticTrials, isBetterElkScore, elkLayoutScore } from '../layoutQuality.js';
import {
  findTitlePosition,
  titleBlockedIntervals,
  routeAroundTitle,
  segmentHitsTitle,
} from '../titleProtection.js';
import { flattenElkPath, findUnbridgedPaintedCrossings } from '../crossingFallback.js';
import type { LayoutData } from '../../../types.js';

const title = { left: 40, right: 100, top: 40, bottom: 60 };

describe('automatic ELK title protection', () => {
  it('finds the closest safe title position inside its frame', () => {
    const blocked = titleBlockedIntervals(
      [
        { x: 70, y: 0 },
        { x: 70, y: 100 },
      ],
      title
    );
    const left = findTitlePosition(title, { left: 0, right: 220, top: 0, bottom: 120 }, blocked);
    expect(left).toBe(80);
  });
  it('reports no slot in a narrow frame instead of hiding an edge', () => {
    const blocked = titleBlockedIntervals(
      [
        { x: 70, y: 0 },
        { x: 70, y: 100 },
      ],
      title
    );
    expect(
      findTitlePosition(title, { left: 30, right: 110, top: 0, bottom: 120 }, blocked)
    ).toBeNull();
  });
  it.each([
    [
      { x: 70, y: 0 },
      { x: 70, y: 100 },
    ],
    [
      { x: 70, y: 100 },
      { x: 70, y: 0 },
    ],
    [
      { x: 0, y: 50 },
      { x: 140, y: 50 },
    ],
    [
      { x: 140, y: 50 },
      { x: 0, y: 50 },
    ],
  ])('detours in both graph directions, leaving endpoints fixed: %j', (...points) => {
    const routed = routeAroundTitle(points, title);
    expect(routed[0]).toEqual(points[0]);
    expect(routed.at(-1)).toEqual(points.at(-1));
    expect(routed.length).toBeGreaterThan(2);
    expect(routed.some((p, i) => i && segmentHitsTitle(routed[i - 1], p, title))).toBe(false);
    expect(routed.every((p, i) => !i || p.x === routed[i - 1].x || p.y === routed[i - 1].y)).toBe(
      true
    );
  });
  it('never routes through an adjacent node', () => {
    const obstacle = { left: 10, right: 35, top: 0, bottom: 100 };
    const routed = routeAroundTitle(
      [
        { x: 70, y: 0 },
        { x: 70, y: 100 },
      ],
      title,
      [obstacle]
    );
    expect(
      routed.some(
        (p, i) =>
          i &&
          (segmentHitsTitle(routed[i - 1], p, title) ||
            segmentHitsTitle(routed[i - 1], p, obstacle))
      )
    ).toBe(false);
    expect(routed.some((p) => p.x > title.right)).toBe(true);
  });
  it('localizes fallback detours instead of rejecting an unchanged remote shape-bbox corridor', () => {
    const points = [
      { x: 70, y: -100 },
      { x: 70, y: 100 },
    ];
    const conservativeRemoteBounds = { left: 60, right: 80, top: -80, bottom: -30 };
    const routed = routeAroundTitle(points, title, [conservativeRemoteBounds]);
    expect(routed[0]).toEqual(points[0]);
    expect(routed.at(-1)).toEqual(points.at(-1));
    expect(routed.some((p, i) => i && segmentHitsTitle(routed[i - 1], p, title))).toBe(false);
    expect(routed[1]).toEqual({ x: 70, y: 26 });
    expect(points).toHaveLength(2);
  });
  it('does not invent a detour if an endpoint itself is inside the text', () => {
    const points = [
      { x: 70, y: 50 },
      { x: 70, y: 100 },
    ];
    expect(routeAroundTitle(points, title)).toEqual(points);
  });
  it('allows boundary contact without treating it as a collision', () => {
    expect(segmentHitsTitle({ x: 40, y: 0 }, { x: 40, y: 100 }, title)).toBe(false);
    expect(segmentHitsTitle({ x: 70, y: 0 }, { x: 70, y: 100 }, title)).toBe(true);
  });
});

describe('automatic deterministic layout selection', () => {
  it('keeps the incumbent on ties and cannot replace it with a worse score', () => {
    expect(isBetterElkScore([0, 10, 0, 80, 1000], [0, 12, 0, 40, 900])).toBe(true);
    expect(isBetterElkScore([1, 8, 0, 40, 900], [0, 12, 0, 40, 900])).toBe(false);
    expect(isBetterElkScore([0, 12, 0, 40, 900], [0, 12, 0, 40, 900])).toBe(false);
  });
  it('bounds work by graph size, not machine speed', () => {
    expect(elkAutomaticTrials(14, 24)).toBe(4);
    expect(elkAutomaticTrials(120, 200)).toBe(2);
    expect(elkAutomaticTrials(500, 800)).toBe(1);
  });
  it('scoring never mutates the candidate geometry', () => {
    const data = {
      nodes: [],
      edges: [
        {
          id: 'a',
          start: 'x',
          end: 'y',
          curve: 'rounded',
          points: [
            { x: 0, y: 50 },
            { x: 100, y: 50 },
          ],
        },
        {
          id: 'b',
          start: 'z',
          end: 'w',
          curve: 'rounded',
          points: [
            { x: 50, y: 0 },
            { x: 50, y: 100 },
          ],
        },
      ],
      config: {},
    } as LayoutData;
    const before = JSON.stringify(data);
    expect(elkLayoutScore(data)[2]).toBe(1);
    expect(JSON.stringify(data)).toBe(before);
  });
});

describe('final painted-geometry fallback', () => {
  it('keeps gap subpaths separate and preserves exact long straight runs', () => {
    expect(flattenElkPath('M0,0 L10000,0 M10010,0 L20000,0')).toEqual([
      [
        { x: 0, y: 0 },
        { x: 10000, y: 0 },
      ],
      [
        { x: 10010, y: 0 },
        { x: 20000, y: 0 },
      ],
    ]);
  });
  it('handles rounded Q corners and scientific notation', () => {
    const points = flattenElkPath('M0,0 L4e1,0 Q50,0 50,10 L50,100')[0];
    expect(points.length).toBeGreaterThan(4);
    expect(points.at(-1)).toEqual({ x: 50, y: 100 });
  });
  it('does not mistake unsupported smoothing curves for straight lines', () => {
    expect(flattenElkPath('M0,0 C10,20 30,40 50,60')).toEqual([]);
  });
  it('finds a crossing on a rounded corner that the polyline detector omits', () => {
    const found = findUnbridgedPaintedCrossings([
      { id: 'a', d: 'M0,50 L40,50 Q50,50 50,60 L50,100', hops: [] },
      { id: 'b', d: 'M45,0 L45,100', hops: [] },
    ]);
    expect(found).toHaveLength(1);
    expect(found[0].point.x).toBe(45);
    expect(found[0].point.y).toBeGreaterThan(50);
    expect(found[0].point.y).toBeLessThan(60);
  });
  it('recognizes an actual bridge rather than masking its arc apex', () => {
    const found = findUnbridgedPaintedCrossings([
      {
        id: 'a',
        d: 'M0,50 L44,50 A6,6 0 0 1 56,50 L100,50',
        hops: [{ other: 'b', x: 50, y: 50, radius: 6 }],
      },
      { id: 'b', d: 'M50,0 L50,100', hops: [] },
    ]);
    expect(found).toEqual([]);
  });
  it('does not reinterpret a real gap as an unmarked crossing', () => {
    expect(
      findUnbridgedPaintedCrossings([
        { id: 'a', d: 'M0,50 L44,50 M56,50 L100,50', hops: [] },
        { id: 'b', d: 'M50,0 L50,100', hops: [] },
      ])
    ).toEqual([]);
  });
  it('does not gap an intended shared endpoint', () => {
    expect(
      findUnbridgedPaintedCrossings([
        { id: 'a', d: 'M0,0 L50,50', hops: [] },
        { id: 'b', d: 'M100,0 L50,50', hops: [] },
      ])
    ).toEqual([]);
  });
});
