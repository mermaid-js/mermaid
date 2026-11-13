import { beforeAll, describe, it, expect } from 'vitest';
import { addDiagrams } from '../../../../diagram-api/diagram-orchestration.js';
import type { LayoutData } from '../../../types.js';
import { fuzzCase, layoutFuzzCase } from './emptyLaneFuzz.js';
import {
  DEFAULT_NODE_SPACING,
  extentOf,
  laneOrderLeftToRight,
  laneSeams,
  layoutFromSource,
  nodeById,
  nodeLanesReordered,
  nodesOutsideTheirLane,
  type LayoutOptions,
} from './emptyLaneHarness.js';

// Below about 20, the lane width solve leaves neighbouring lanes overlapping.
const TIGHT_NODE_SPACING = 10;
const SPACINGS = [TIGHT_NODE_SPACING, 20, 50];
// Each fuzz test lays out this many diagrams, from seeds FUZZ_SEED upwards. A diagram costs 20 to
// 60 ms here and several times that on a CI runner, against a test timeout of five seconds. Seeds
// FUZZ_SEED + 1, + 4 and + 5 failed at nodeSpacing 10 before the fix, and + 0, + 4 and + 7 are
// diagrams in which automatic ordering moves the lanes.
const FUZZ_CASES_PER_CELL = 8;
const FUZZ_SEED = 8754;
// A random diagram whose first lane is empty, and where automatic ordering puts the second lane
// left of the third.
const EMPTY_FIRST_AUTO_ORDER_SEED = 2059;
// Lanes may touch or overlap, but not part: a seam wider than this is a gap.
const SEAM_TOLERANCE = 0.5;
const NARROW_NODE_WIDTH = 30;
const WIDE_LANE_PADDING = 60;

/** The diagram from the review of #8754: Legal has no nodes. The spacing is set by the options. */
const reviewSource = (direction: string, withLegal = true): string =>
  [
    `swimlane-beta ${direction}`,
    '  subgraph L1[Sales]',
    '    A',
    '  end',
    ...(withLegal ? ['  subgraph L2[Legal]', '  end'] : []),
    '  subgraph L3[Warehouse]',
    '    C',
    '  end',
    '  A --> C',
  ].join('\n');

const tight: LayoutOptions = { nodeSpacing: TIGHT_NODE_SPACING };

function expectContained(layout: LayoutData, order: string[]): void {
  expect(nodesOutsideTheirLane(layout)).toEqual([]);
  expect(laneOrderLeftToRight(layout)).toEqual(order);
}

describe('Swimlanes: an empty lane in TB and BT keeps every node inside its own lane', () => {
  beforeAll(async () => {
    addDiagrams();
    // The first parse loads the diagram modules; keep that out of the time of the first test.
    await layoutFromSource(reviewSource('TB', false));
  });

  it.each(['TB', 'BT'])(
    '%s with a tight node spacing: the lane after the empty one moves with its nodes',
    async (direction) => {
      const layout = await layoutFromSource(reviewSource(direction), tight);
      expectContained(layout, ['L1', 'L2', 'L3']);

      const control = await layoutFromSource(reviewSource(direction, false), tight);
      const moved = extentOf(nodeById(layout, 'L3')).left - extentOf(nodeById(control, 'L3')).left;
      expect(moved).toBeGreaterThan(0);
      expect(nodeById(layout, 'C').x).toBeCloseTo((nodeById(control, 'C').x ?? 0) + moved, 6);
      expect(nodeById(layout, 'A').x).toBeCloseTo(nodeById(control, 'A').x ?? 0, 6);
    }
  );

  it.each(['TB', 'BT'])(
    '%s with a tight node spacing: the lanes stand in a row, each starting where the last ends',
    async (direction) => {
      const layout = await layoutFromSource(reviewSource(direction), tight);
      const [sales, legal, warehouse] = ['L1', 'L2', 'L3'].map((id) =>
        extentOf(nodeById(layout, id))
      );
      expect(legal.left).toBeCloseTo(sales.right, 6);
      expect(warehouse.left).toBeCloseTo(legal.right, 6);
    }
  );

  describe.each([
    ['TB', TIGHT_NODE_SPACING],
    ['BT', TIGHT_NODE_SPACING],
    ['TB', DEFAULT_NODE_SPACING],
    ['BT', DEFAULT_NODE_SPACING],
  ])('%s with node spacing %d', (direction, nodeSpacing) => {
    it('neighbouring empty lanes stand in a row, one starting where the last ends', async () => {
      const source = [
        `swimlane-beta ${direction}`,
        '  subgraph L1[Sales]',
        '    A',
        '  end',
        '  subgraph L2[Billing]',
        '    B',
        '  end',
        '  subgraph L3[Legal]',
        '  end',
        '  subgraph L4[Finance]',
        '  end',
        '  subgraph L5[Warehouse]',
        '    C',
        '  end',
        '  subgraph L6[Support]',
        '  end',
        '  A --> B --> C',
      ].join('\n');
      const order = ['L1', 'L2', 'L3', 'L4', 'L5', 'L6'];
      const layout = await layoutFromSource(source, { nodeSpacing });
      expectContained(layout, order);
      const spans = order.map((id) => extentOf(nodeById(layout, id)));
      for (const id of ['L3', 'L4', 'L6']) {
        const index = order.indexOf(id);
        expect(spans[index].left).toBeCloseTo(spans[index - 1].right, 6);
      }
      expect(spans[4].left).toBeCloseTo(spans[3].right, 6);
    });
  });

  it('a narrow lane under the edge of its wider neighbour stays after the empty lane', async () => {
    // Wide lane padding and narrow nodes put the centre of Warehouse left of the right edge of Sales.
    const options: LayoutOptions = {
      ...tight,
      nodeWidth: () => NARROW_NODE_WIDTH,
      lanePadding: WIDE_LANE_PADDING,
    };
    const layout = await layoutFromSource(reviewSource('TB'), options);
    expectContained(layout, ['L1', 'L2', 'L3']);
  });

  it.each(['TB', 'BT'])(
    '%s with a tight node spacing: an empty first lane leaves the others around their nodes',
    async (direction) => {
      const source = [
        `swimlane-beta ${direction}`,
        '  subgraph L1[Legal]',
        '  end',
        '  subgraph L2[Sales]',
        '    A',
        '  end',
        '  subgraph L3[Warehouse]',
        '    C',
        '  end',
        '  A --> C',
      ].join('\n');
      expectContained(await layoutFromSource(source, tight), ['L1', 'L2', 'L3']);
    }
  );

  it.each(['TB', 'BT'])(
    '%s with a tight node spacing: an empty last lane leaves the others around their nodes',
    async (direction) => {
      const source = [
        `swimlane-beta ${direction}`,
        '  subgraph L1[Sales]',
        '    A',
        '  end',
        '  subgraph L2[Warehouse]',
        '    C',
        '  end',
        '  subgraph L3[Legal]',
        '  end',
        '  A --> C',
      ].join('\n');
      expectContained(await layoutFromSource(source, tight), ['L1', 'L2', 'L3']);
    }
  );

  describe.each(['TB', 'BT'])('%s, random diagrams with empty lanes', (direction) => {
    for (const nodeSpacing of SPACINGS) {
      it(`nodeSpacing ${nodeSpacing}: every node is inside its lane and the lanes keep their order`, async () => {
        const failures: string[] = [];
        for (let index = 0; index < FUZZ_CASES_PER_CELL; index++) {
          const fuzz = fuzzCase(FUZZ_SEED + index, direction);
          const layout = await layoutFuzzCase(fuzz, nodeSpacing);
          const outside = nodesOutsideTheirLane(layout);
          const lanes = laneOrderLeftToRight(layout);
          if (outside.length > 0 || lanes.join() !== fuzz.order.join()) {
            failures.push(
              `seed ${fuzz.seed}: ${outside.length} outside, lanes ${lanes.join(' ')}\n${fuzz.source}`
            );
          }
        }
        expect(failures.length, failures.slice(0, 2).join('\n\n')).toBe(0);
      });
    }
  });

  it('with automaticLaneOrdering, an empty first lane leaves the lane ordering put left of the first declared lane in place', async () => {
    const fuzz = fuzzCase(EMPTY_FIRST_AUTO_ORDER_SEED, 'TB');
    const options: LayoutOptions = {
      ...tight,
      automaticLaneOrdering: true,
      nodeWidth: (id) => fuzz.widths.get(id) ?? NARROW_NODE_WIDTH,
    };
    const layout = await layoutFromSource(fuzz.source, options);
    const control = await layoutFromSource(
      fuzz.source.replace('  subgraph L0[Lane 0]\n  end\n', ''),
      options
    );
    expect(laneOrderLeftToRight(control).slice(0, 2)).toEqual(['L2', 'L1']);

    expect(nodeById(layout, 'L2').x).toBeCloseTo(nodeById(control, 'L2').x ?? 0, 6);
    const moved = (nodeById(layout, 'L1').x ?? 0) - (nodeById(control, 'L1').x ?? 0);
    expect(moved).toBeGreaterThan(0);
    expect(nodeById(layout, 'L3').x).toBeCloseTo((nodeById(control, 'L3').x ?? 0) + moved, 6);
    expect(extentOf(nodeById(layout, 'L0')).right).toBeCloseTo(
      extentOf(nodeById(layout, 'L1')).left,
      6
    );
  });

  describe.each(['TB', 'BT'])('%s, random diagrams with automaticLaneOrdering on', (direction) => {
    it.each([TIGHT_NODE_SPACING, DEFAULT_NODE_SPACING])(
      'nodeSpacing %d: every node is inside its lane and no gap opens between lanes',
      async (nodeSpacing) => {
        const failures: string[] = [];
        let reordered = 0;
        for (let index = 0; index < FUZZ_CASES_PER_CELL; index++) {
          const fuzz = fuzzCase(FUZZ_SEED + index, direction);
          const layout = await layoutFuzzCase(fuzz, nodeSpacing, { automaticLaneOrdering: true });
          reordered += nodeLanesReordered(layout, fuzz.order) ? 1 : 0;
          const outside = nodesOutsideTheirLane(layout);
          const widest = Math.max(...laneSeams(layout));
          if (outside.length > 0 || widest > SEAM_TOLERANCE) {
            failures.push(
              `seed ${fuzz.seed}: ${outside.length} outside, widest gap ${widest}\n${fuzz.source}`
            );
          }
        }
        // The ordering must have moved some lanes, or this checks nothing the plain fuzz does not.
        expect(reordered).toBeGreaterThan(0);
        expect(failures.length, failures.slice(0, 2).join('\n\n')).toBe(0);
      }
    );
  });
});
