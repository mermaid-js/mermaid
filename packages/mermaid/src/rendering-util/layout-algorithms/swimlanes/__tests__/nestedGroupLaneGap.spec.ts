import { beforeAll, describe, it, expect } from 'vitest';
import type { Node } from '../../../types.js';
import { topLaneGap } from '../helpers.js';
import { addDiagrams } from '../../../../diagram-api/diagram-orchestration.js';
import { deepestLaneOverlap, laneSeams, layoutFromSource } from './emptyLaneHarness.js';

const TOLERANCE = 0.5;
const SPACINGS = [10, 20];
const PADDINGS = [8, 20, 40, 60];

/** Lane A holds `b` inside `depth` nested subgraphs, so the group's box reaches the lane edge. */
const nestedAtEdge = (direction: string, depth: number): string => {
  const open = Array.from(
    { length: depth },
    (_, i) => `${'  '.repeat(i + 2)}subgraph G${i}[Inner]`
  );
  const close = Array.from({ length: depth }, (_, i) => `${'  '.repeat(depth - i + 1)}end`);
  return [
    `swimlane-beta ${direction}`,
    '  subgraph L1[A]',
    ...open,
    `${'  '.repeat(depth + 2)}a`,
    ...close,
    '  end',
    '  subgraph L2[B]',
    '    b',
    '  end',
    '  a --> b',
  ].join('\n');
};

describe('Swimlanes: a nested subgraph at a lane edge does not push the lane over its neighbour', () => {
  beforeAll(() => {
    addDiagrams();
  });

  describe.each(['TB', 'BT'])('%s', (direction) => {
    describe.each([1, 2])('nesting depth %d', (depth) => {
      it.each(SPACINGS)('nodeSpacing %d: the lanes do not overlap', async (nodeSpacing) => {
        const layout = await layoutFromSource(nestedAtEdge(direction, depth), { nodeSpacing });
        expect(deepestLaneOverlap(layout)).toBeLessThanOrEqual(TOLERANCE);
        expect(Math.min(...laneSeams(layout))).toBeGreaterThanOrEqual(-TOLERANCE);
      });
    });

    it.each(PADDINGS)('lane padding %d: the lanes do not overlap', async (lanePadding) => {
      const layout = await layoutFromSource(nestedAtEdge(direction, 1), {
        nodeSpacing: 10,
        lanePadding,
      });
      expect(Math.min(...laneSeams(layout))).toBeGreaterThanOrEqual(-TOLERANCE);
    });
  });
});

describe('Swimlanes: topLaneGap on groups whose parents form a cycle', () => {
  it('ends, and counts no inset for a group that never reaches a lane', () => {
    const group = (id: string, parentId: string): Node => ({ id, isGroup: true, parentId }) as Node;
    const lane = { id: 'L1', isGroup: true } as Node;
    expect(topLaneGap([lane, group('X', 'Y'), group('Y', 'X')], 10)).toBe(topLaneGap([lane], 10));
  });
});
