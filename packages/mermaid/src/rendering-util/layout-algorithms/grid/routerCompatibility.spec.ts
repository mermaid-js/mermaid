import { describe, expect, it } from 'vitest';
import type { Node } from '../../types.js';
import {
  areExactlyAxisAligned,
  boundedAlternativePortalCoordinates,
  combinePointChains,
  labelAwareSelfLoopCandidates,
  orderedSelfLoopSides,
  reversePoints,
} from './routerCompatibility.js';
import { ownerSideKey, TERMINAL_APPROACH_PX } from './routerPlanning.js';
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

  it.each<{ side: GridSide; boundaryX: number; shoulderX: number; outerX: number }>([
    { side: 'left', boundaryX: 0, shoulderX: -20, outerX: -71 },
    { side: 'right', boundaryX: 80, shoulderX: 100, outerX: 151 },
  ])(
    'keeps a labelled $side loop clear of corners and return shoulders',
    ({ side, boundaryX, shoulderX, outerX }) => {
      const owner = {
        id: 'owner',
        isGroup: false,
        x: 40,
        y: 20,
        width: 80,
        height: 40,
      } as Node;

      expect(
        labelAwareSelfLoopCandidates(owner, side, 0, 20, {
          along: 90,
          cross: 20,
          startInset: 12,
          endInset: 12,
          requiredAlongSpan: 116,
        })
      ).toEqual([
        [
          point(boundaryX, 11),
          point(shoulderX, 11),
          point(shoulderX, 3),
          point(outerX, 3),
          point(outerX, 37),
          point(shoulderX, 37),
          point(shoulderX, 29),
          point(boundaryX, 29),
        ],
      ]);
    }
  );

  describe.each<GridSide>(['left', 'right', 'top', 'bottom'])(
    'labelled %s loop corner clearance',
    (side) => {
      it.each([
        { demandCoord: 20, portStart: 11, portEnd: 29, pointCount: 8 },
        { demandCoord: 22, portStart: 13, portEnd: 31, pointCount: 8 },
        { demandCoord: 21, portStart: 4, portEnd: 38, pointCount: 4 },
      ])(
        'uses safe ports for demand coordinate $demandCoord',
        ({ demandCoord, portStart, portEnd, pointCount }) => {
          const verticalSide = side === 'left' || side === 'right';
          const width = verticalSide ? 80 : 42;
          const height = verticalSide ? 42 : 80;
          const owner = {
            id: 'owner',
            isGroup: false,
            x: width / 2,
            y: height / 2,
            width,
            height,
          } as Node;
          const [candidate] = labelAwareSelfLoopCandidates(owner, side, 0, demandCoord, {
            along: 20,
            cross: 20,
            startInset: 12,
            endInset: 12,
            requiredAlongSpan: 46,
          });
          const portPoint = (coordinate: number) =>
            verticalSide
              ? point(side === 'left' ? 0 : width, coordinate)
              : point(coordinate, side === 'top' ? 0 : height);

          expect(candidate).toHaveLength(pointCount);
          expect(candidate[0]).toEqual(portPoint(portStart));
          expect(candidate[candidate.length - 1]).toEqual(portPoint(portEnd));
          for (const [start, end] of [
            [candidate[0], candidate[1]],
            [candidate[candidate.length - 2], candidate[candidate.length - 1]],
          ]) {
            expect(Math.abs(end.x - start.x) + Math.abs(end.y - start.y)).toBeGreaterThanOrEqual(
              TERMINAL_APPROACH_PX
            );
          }
        }
      );
    }
  );

  it.each<{ side: GridSide; boundaryY: number; shoulderY: number; outerY: number }>([
    { side: 'top', boundaryY: 0, shoulderY: -20, outerY: -36 },
    { side: 'bottom', boundaryY: 40, shoulderY: 60, outerY: 76 },
  ])(
    'uses one symmetric $side shoulder with label-placement slack',
    ({ side, boundaryY, shoulderY, outerY }) => {
      const owner = {
        id: 'owner',
        isGroup: false,
        x: 40,
        y: 20,
        width: 80,
        height: 40,
      } as Node;

      const [candidate] = labelAwareSelfLoopCandidates(owner, side, 0, 40, {
        along: 90,
        cross: 20,
        startInset: 12,
        endInset: 12,
        requiredAlongSpan: 116,
      });

      expect(candidate).toEqual([
        point(31, boundaryY),
        point(31, shoulderY),
        point(-12, shoulderY),
        point(-12, outerY),
        point(92, outerY),
        point(92, shoulderY),
        point(49, shoulderY),
        point(49, boundaryY),
      ]);
    }
  );

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
