import { beforeAll, describe, it, expect } from 'vitest';
import { addDiagrams } from '../../../../diagram-api/diagram-orchestration.js';
import {
  deepestLaneOverlap,
  laneOrderLeftToRight,
  laneSeams,
  layoutFromSource,
  smallestLaneInset,
} from './emptyLaneHarness.js';

// The least padding a lane keeps around its nodes.
const MIN_LANE_PADDING = 20;
const WIDE_LANE_PADDING = 60;
const TOLERANCE = 0.5;
const SPACINGS = [0, 5, 10, 19, 20, 40];

/** Hub and Right with no empty lane: the diagram of the #8788 fixture without its first lane. */
const twoLanes = (direction: string): string =>
  [
    `swimlane-beta ${direction}`,
    '  subgraph L1[Hub]',
    '    a',
    '  end',
    '  subgraph L2[Right]',
    '    c',
    '  end',
    '  a --> c',
  ].join('\n');

/** The diagram from the follow-up review of #8754, empty first lane included. */
const emptyFirst = (direction: string): string =>
  [
    `swimlane-beta ${direction}`,
    '  subgraph L0[Empty]',
    '  end',
    '  subgraph L1[Hub]',
    '    a',
    '  end',
    '  subgraph L2[Left]',
    '    b',
    '  end',
    '  subgraph L3[Right]',
    '    c',
    '  end',
    '  b --> a',
    '  a --> c',
  ].join('\n');

describe('Swimlanes: neighbouring lanes keep their padding at a tight node spacing', () => {
  beforeAll(async () => {
    addDiagrams();
    await layoutFromSource(twoLanes('TB'));
  });

  describe.each(['TB', 'BT'])('%s', (direction) => {
    describe.each([false, true])('automaticLaneOrdering %s', (automaticLaneOrdering) => {
      it.each(SPACINGS)(
        'nodeSpacing %d: two populated lanes touch, neither overlaps, and each node keeps its padding',
        async (nodeSpacing) => {
          const layout = await layoutFromSource(twoLanes(direction), {
            nodeSpacing,
            automaticLaneOrdering,
          });
          expect(deepestLaneOverlap(layout)).toBeLessThanOrEqual(TOLERANCE);
          expect(laneSeams(layout)[0]).toBeLessThanOrEqual(TOLERANCE);
          // The gap across the border is twice the larger of the padding and the node spacing,
          // so a roomy spacing is not squeezed down to the padding.
          const inset = Math.max(MIN_LANE_PADDING, nodeSpacing);
          expect(smallestLaneInset(layout)).toBeGreaterThanOrEqual(inset - TOLERANCE);
        }
      );

      it('the diagram with an empty first lane: no two lanes overlap, every node keeps its padding', async () => {
        const layout = await layoutFromSource(emptyFirst(direction), {
          nodeSpacing: 10,
          automaticLaneOrdering,
        });
        expect(deepestLaneOverlap(layout)).toBeLessThanOrEqual(TOLERANCE);
        expect(smallestLaneInset(layout)).toBeGreaterThanOrEqual(MIN_LANE_PADDING - TOLERANCE);
      });
    });

    it('a lane padding wider than half the default node spacing is kept as well', async () => {
      const layout = await layoutFromSource(twoLanes(direction), {
        lanePadding: WIDE_LANE_PADDING,
      });
      expect(deepestLaneOverlap(layout)).toBeLessThanOrEqual(TOLERANCE);
      expect(smallestLaneInset(layout)).toBeGreaterThanOrEqual(WIDE_LANE_PADDING - TOLERANCE);
    });
  });

  describe.each(['LR', 'RL'])('%s', (direction) => {
    it.each(SPACINGS)('nodeSpacing %d: lanes are rows that never overlap', async (nodeSpacing) => {
      const layout = await layoutFromSource(twoLanes(direction), { nodeSpacing });
      const rows = layout.nodes
        .filter((node) => node.isGroup)
        .map((node) => ({
          top: (node.y ?? 0) - (node.height ?? 0) / 2,
          bottom: (node.y ?? 0) + (node.height ?? 0) / 2,
        }))
        .sort((a, b) => a.top - b.top);
      expect(rows[0].bottom).toBeLessThanOrEqual(rows[1].top + TOLERANCE);
      expect(laneOrderLeftToRight(layout).length).toBe(2);
    });
  });
});
