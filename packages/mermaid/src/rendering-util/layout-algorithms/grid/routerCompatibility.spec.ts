import { describe, expect, it } from 'vitest';
import type { Node } from '../../types.js';
import {
  areExactlyAxisAligned,
  boundedAlternativePortalCoordinates,
  combinePointChains,
  orderedSelfLoopSides,
  reversePoints,
} from './routerCompatibility.js';
import { ownerSideKey } from './routerPlanning.js';
import type { GridSide } from './types.js';

const point = (x: number, y: number): { x: number; y: number } => ({ x, y });

describe('grid router compatibility', () => {
  it('bounds alternative portal coordinates and prefers nearby routing corridors', () => {
    expect(boundedAlternativePortalCoordinates(50, 10, 90, [80, 20, 60, 50, 100])).toEqual([
      60, 20, 80,
    ]);
    expect(boundedAlternativePortalCoordinates(50, 10, 90, [], 4)).toEqual([10, 90]);
  });

  it('requires exact axis alignment for the direct route shortcut', () => {
    expect(areExactlyAxisAligned({ x: 0, y: 0 }, { x: 0.5, y: 10 })).toBe(false);
    expect(areExactlyAxisAligned({ x: 0, y: 0 }, { x: 0, y: 10 })).toBe(true);
  });

  it.each([
    {
      name: 'empty chains',
      chains: [],
      expected: [],
    },
    {
      name: 'duplicate chain junctions',
      chains: [
        [point(0, 0), point(10, 0)],
        [point(10, 0), point(10, 10)],
      ],
      expected: [point(0, 0), point(10, 0), point(10, 10)],
    },
    {
      name: 'collinear spans across chains',
      chains: [
        [point(0, 0), point(10, 0)],
        [point(10, 0), point(20, 0)],
      ],
      expected: [point(0, 0), point(20, 0)],
    },
  ])('combines $name', ({ chains, expected }) => {
    expect(combinePointChains(chains)).toEqual(expected);
  });

  it.each([
    { name: 'an empty chain', points: [], expected: [] },
    {
      name: 'a populated chain',
      points: [point(0, 0), point(10, 0), point(10, 10)],
      expected: [point(10, 10), point(10, 0), point(0, 0)],
    },
  ])('reverses $name without mutating the input', ({ points, expected }) => {
    const before = structuredClone(points);

    expect(reversePoints(points)).toEqual(expected);
    expect(points).toEqual(before);
  });

  it.each([
    {
      name: 'preserves the default side order when demand is tied',
      titled: false,
      counts: {},
      selfLoopCounts: {},
      expected: ['left', 'right', 'top', 'bottom'],
    },
    {
      name: 'combines ordinary and self-loop demand',
      titled: false,
      counts: { left: 2, top: 4, bottom: 1 },
      selfLoopCounts: { right: 3, bottom: 1 },
      expected: ['left', 'bottom', 'right', 'top'],
    },
    {
      name: 'excludes the title side for titled groups',
      titled: true,
      counts: { left: 2, right: 1, top: 0, bottom: 3 },
      selfLoopCounts: {},
      expected: ['right', 'left', 'bottom'],
    },
  ] as const)(
    '$name',
    ({ titled, counts: countBySide, selfLoopCounts: selfLoopCountBySide, expected }) => {
      const node = {
        id: 'owner:1',
        isGroup: titled,
        groupTitleRect: titled ? { left: -10, right: 10, top: -10, bottom: 0 } : undefined,
      } as Node;
      const counts = new Map(
        Object.entries(countBySide).map(([side, count]) => [
          ownerSideKey(node.id, side as GridSide),
          count,
        ])
      );
      const selfLoopCounts = new Map(
        Object.entries(selfLoopCountBySide).map(([side, count]) => [`${node.id}:${side}`, count])
      );

      expect(orderedSelfLoopSides(node, counts, selfLoopCounts)).toEqual(expected);
    }
  );
});
