import { describe, expect, it } from 'vitest';
import type { Node } from '../../types.js';
import { endpointPairLowerBound, validateSameContainerRoute } from './routerConstraint.js';
import type { EndpointCandidate } from './routerPlanning.js';
import type { GridLayoutResult, GridSide } from './types.js';
import { ROOT_CONTAINER_ID } from './types.js';

function endpoint(side: GridSide, x: number, y: number): EndpointCandidate {
  return {
    ownerId: side,
    side,
    port: { x, y },
    connect: { x, y },
    rank: 0,
  };
}

function routingFixture(): {
  source: Node;
  target: Node;
  result: GridLayoutResult;
} {
  const source = {
    id: 'source',
    isGroup: false,
    shape: 'rect',
    x: 0,
    y: 0,
    width: 40,
    height: 40,
  } as Node;
  const target = {
    id: 'target',
    isGroup: false,
    shape: 'rect',
    x: 100,
    y: 0,
    width: 40,
    height: 40,
  } as Node;
  const result = {
    forest: {
      childrenByParent: new Map([[ROOT_CONTAINER_ID, [source, target]]]),
    },
  } as GridLayoutResult;
  return { source, target, result };
}

describe('grid router constraints', () => {
  it.each([
    {
      name: 'coincident horizontal endpoints',
      source: endpoint('right', 0, 0),
      target: endpoint('left', 0, 0),
      expected: [40, 0],
    },
    {
      name: 'coincident vertical endpoints',
      source: endpoint('bottom', 0, 0),
      target: endpoint('top', 0, 0),
      expected: [40, 0],
    },
    {
      name: 'coincident mixed-orientation endpoints',
      source: endpoint('right', 0, 0),
      target: endpoint('top', 0, 0),
      expected: [40, 1],
    },
    {
      name: 'horizontal displacement with horizontal endpoints',
      source: endpoint('right', 0, 0),
      target: endpoint('left', 10, 0),
      expected: [50, 0],
    },
    {
      name: 'vertical displacement with horizontal endpoints',
      source: endpoint('right', 0, 0),
      target: endpoint('left', 0, 10),
      expected: [50, 2],
    },
    {
      name: 'two-axis displacement with matching turn orientations',
      source: endpoint('right', 0, 0),
      target: endpoint('top', 10, 10),
      expected: [60, 1],
    },
  ] as const)('computes an admissible lower bound for $name', ({ source, target, expected }) => {
    expect(endpointPairLowerBound(source, target)).toEqual(expected);
  });

  it('rejects a terminal segment that passes through its destination node', () => {
    const { source, target, result } = routingFixture();

    expect(
      validateSameContainerRoute(
        [
          { x: 20, y: 0 },
          { x: 20, y: -40 },
          { x: 120, y: -40 },
          { x: 120, y: 0 },
          { x: 80, y: 0 },
        ],
        source,
        target,
        ROOT_CONTAINER_ID,
        result
      )
    ).toBe(false);
  });

  it('snaps near-axis interior segments before validating obstacles', () => {
    const { source, target, result } = routingFixture();

    expect(
      validateSameContainerRoute(
        [
          { x: 20, y: 0 },
          { x: 40, y: 0 },
          { x: 40.5, y: -40 },
          { x: 80, y: -39.5 },
          { x: 80, y: 0 },
        ],
        source,
        target,
        ROOT_CONTAINER_ID,
        result
      )
    ).toBe(true);
  });

  it('accepts exact orthogonal segments with fractional coordinates', () => {
    const { source, target, result } = routingFixture();

    expect(
      validateSameContainerRoute(
        [
          { x: 20, y: 0 },
          { x: 40.25, y: 0 },
          { x: 40.25, y: -40.5 },
          { x: 80, y: -40.5 },
          { x: 80, y: 0 },
        ],
        source,
        target,
        ROOT_CONTAINER_ID,
        result
      )
    ).toBe(true);
  });

  it('rejects segments that remain diagonal beyond the pixel tolerance', () => {
    const { source, target, result } = routingFixture();

    expect(
      validateSameContainerRoute(
        [
          { x: 20, y: 0 },
          { x: 40, y: -20 },
          { x: 80, y: -20 },
          { x: 80, y: 0 },
        ],
        source,
        target,
        ROOT_CONTAINER_ID,
        result
      )
    ).toBe(false);
  });

  it('does not snap a route endpoint to make a segment orthogonal', () => {
    const { source, target, result } = routingFixture();

    expect(
      validateSameContainerRoute(
        [
          { x: 20, y: 0 },
          { x: 80, y: 0.5 },
        ],
        source,
        target,
        ROOT_CONTAINER_ID,
        result
      )
    ).toBe(false);
  });

  it('preserves an endpoint when collapsing a trailing near-duplicate', () => {
    const { source, target, result } = routingFixture();

    expect(
      validateSameContainerRoute(
        [
          { x: 20, y: 0 },
          { x: 40, y: 0 },
          { x: 40, y: -40 },
          { x: 80, y: -40 },
          { x: 80, y: -0.5 },
          { x: 80, y: 0 },
        ],
        source,
        target,
        ROOT_CONTAINER_ID,
        result
      )
    ).toBe(true);
  });

  it('rejects accumulated drift beyond the pixel tolerance', () => {
    const { source, target, result } = routingFixture();

    expect(
      validateSameContainerRoute(
        [
          { x: 20, y: 0 },
          { x: 40, y: 0.8 },
          { x: 60, y: 1.6 },
          { x: 80, y: 1.6 },
          { x: 80, y: 0 },
        ],
        source,
        target,
        ROOT_CONTAINER_ID,
        result
      )
    ).toBe(false);
  });
});
