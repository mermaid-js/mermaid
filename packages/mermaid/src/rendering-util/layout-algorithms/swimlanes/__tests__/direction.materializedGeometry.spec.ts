import { describe, expect, it } from 'vitest';
import {
  collapseRedundantRectangularDoglegs,
  liftObstacleHuggingSameSideRails,
  liftTopLaneTitleBandsAboveRails,
  reassignCrossingExternalRailChannels,
  separateSharedRenderedTerminalLanes,
  shiftLeftLaneTitleBandsLeftOfRails,
  shortcutRedundantOrthogonalJogs,
  swapDestinationTerminalTailsToReduceCrossings,
} from '../direction/materializedGeometry.js';
import {
  orthogonalSegmentsForPoints,
  orthogonalSegmentsStrictlyCross,
} from '../direction/geometry.js';

function strictCrossingCount(edges: any[]): number {
  let count = 0;
  for (let i = 0; i < edges.length; i++) {
    const firstSegments = orthogonalSegmentsForPoints(edges[i].points);
    for (let j = i + 1; j < edges.length; j++) {
      const secondSegments = orthogonalSegmentsForPoints(edges[j].points);
      for (const firstSegment of firstSegments) {
        for (const secondSegment of secondSegments) {
          if (
            orthogonalSegmentsStrictlyCross(
              firstSegment.a,
              firstSegment.b,
              secondSegment.a,
              secondSegment.b
            )
          ) {
            count++;
          }
        }
      }
    }
  }
  return count;
}

describe('materialized render geometry cleanup', () => {
  it('separates shared visible terminal rails on the same node face', () => {
    const nodeById = new Map<string, any>([
      ['A', { id: 'A', x: -40, y: -30, width: 10, height: 10 }],
      ['B', { id: 'B', x: 0, y: 0, width: 10, height: 80 }],
    ]);
    const edges: any[] = [
      {
        id: 'A_B_1',
        start: 'A',
        end: 'B',
        points: [
          { x: -30, y: 0 },
          { x: -5, y: 0 },
        ],
      },
      {
        id: 'A_B_2',
        start: 'A',
        end: 'B',
        points: [
          { x: -30, y: 0 },
          { x: -5, y: 0 },
        ],
      },
    ];

    separateSharedRenderedTerminalLanes(edges, nodeById);

    const terminalYs = edges.map((edge) => edge.points.at(-1).y).sort((a, b) => a - b);
    expect(terminalYs[0]).not.toBe(terminalYs[1]);
    expect(terminalYs).toContain(0);
  });

  it('separates near-parallel terminal rails on the same node face', () => {
    const nodeById = new Map<string, any>([
      ['A', { id: 'A', x: -40, y: -30, width: 10, height: 10 }],
      ['B', { id: 'B', x: 0, y: 0, width: 10, height: 60 }],
      ['C', { id: 'C', x: -40, y: 30, width: 10, height: 10 }],
    ]);
    const edges: any[] = [
      {
        id: 'A_B',
        start: 'A',
        end: 'B',
        points: [
          { x: -90, y: -4 },
          { x: -5, y: -4 },
        ],
      },
      {
        id: 'B_C',
        start: 'B',
        end: 'C',
        points: [
          { x: -5, y: 4 },
          { x: -90, y: 4 },
        ],
      },
    ];

    separateSharedRenderedTerminalLanes(edges, nodeById);

    const terminalYs = [edges[0].points.at(-1).y, edges[1].points[0].y].sort((a, b) => a - b);
    expect(terminalYs[1] - terminalYs[0]).toBeGreaterThanOrEqual(16);
  });

  it('collapses a provably redundant rectangular dogleg', () => {
    const edges: any[] = [
      {
        id: 'A_B',
        start: 'A',
        end: 'B',
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 10, y: 10 },
          { x: 0, y: 10 },
          { x: 0, y: 20 },
        ],
      },
    ];

    collapseRedundantRectangularDoglegs(edges, new Map());

    expect(edges[0].points).toEqual([
      { x: 0, y: 0 },
      { x: 0, y: 20 },
    ]);
  });

  it('lifts a same-side rail away from an intervening node border', () => {
    const nodeById = new Map<string, any>([
      ['26', { id: '26', x: -166, y: 54, width: 232, height: 66 }],
      ['27', { id: '27', x: 830, y: 54, width: 232, height: 66 }],
      ['28', { id: '28', x: 166, y: 54, width: 232, height: 108 }],
    ]);
    const edges: any[] = [
      {
        id: 'L_26_27_0',
        start: '26',
        end: '27',
        points: [
          { x: -166, y: 21 },
          { x: -166, y: 1 },
          { x: 830, y: 1 },
          { x: 830, y: 21 },
        ],
      },
    ];

    liftObstacleHuggingSameSideRails(edges, nodeById);

    expect(edges[0].points).toEqual([
      { x: -166, y: 21 },
      { x: -166, y: -20 },
      { x: 830, y: -20 },
      { x: 830, y: 21 },
    ]);
  });

  it('raises top lane title bands above a clear same-side rail', () => {
    const nodeById = new Map<string, any>([
      ['26', { id: '26', x: -166, y: 54, width: 232, height: 66 }],
      ['27', { id: '27', x: 830, y: 54, width: 232, height: 66 }],
      ['28', { id: '28', x: 166, y: 54, width: 232, height: 108 }],
      [
        'General_Manager',
        {
          id: 'General_Manager',
          isGroup: true,
          direction: 'TD',
          x: 166,
          y: 54,
          width: 996,
          height: 180,
          groupTitleRect: { left: -332, right: 664, top: -36, bottom: -15 },
        },
      ],
    ]);
    const edges: any[] = [
      {
        id: 'L_26_27_0',
        start: '26',
        end: '27',
        points: [
          { x: -166, y: 21 },
          { x: -166, y: 1 },
          { x: 830, y: 1 },
          { x: 830, y: 21 },
        ],
      },
    ];

    liftObstacleHuggingSameSideRails(edges, nodeById);
    liftTopLaneTitleBandsAboveRails(edges, nodeById);

    expect(edges[0].points).toEqual([
      { x: -166, y: 21 },
      { x: -166, y: -20 },
      { x: 830, y: -20 },
      { x: 830, y: 21 },
    ]);
    expect(nodeById.get('General_Manager')).toMatchObject({
      y: 49.5,
      height: 189,
      groupTitleRect: { left: -332, right: 664, top: -45, bottom: -24 },
    });
  });

  it('shifts LR lane title bands left of a clear left-side rail', () => {
    const nodeById = new Map<string, any>([
      [
        'BOD',
        {
          id: 'BOD',
          isGroup: true,
          direction: 'LR',
          x: 0,
          y: 100,
          width: 200,
          height: 200,
          groupTitleRect: { left: -100, right: -64, top: 0, bottom: 200 },
        },
      ],
      [
        'Finance_Head',
        {
          id: 'Finance_Head',
          isGroup: true,
          direction: 'LR',
          x: 0,
          y: 300,
          width: 200,
          height: 200,
          groupTitleRect: { left: -100, right: -64, top: 200, bottom: 400 },
        },
      ],
    ]);
    const edges: any[] = [
      {
        id: 'L_27_28_0',
        start: '27',
        end: '28',
        points: [
          { x: -80, y: 350 },
          { x: -80, y: 300 },
          { x: -90, y: 300 },
          { x: -90, y: 50 },
          { x: -80, y: 50 },
        ],
      },
    ];

    shiftLeftLaneTitleBandsLeftOfRails(edges, nodeById);

    expect(edges[0].points).toEqual([
      { x: -80, y: 350 },
      { x: -80, y: 300 },
      { x: -90, y: 300 },
      { x: -90, y: 50 },
      { x: -80, y: 50 },
    ]);
    expect(nodeById.get('BOD')).toMatchObject({
      x: -15,
      width: 230,
      groupTitleRect: { left: -130, right: -94, top: 0, bottom: 200 },
    });
    expect(nodeById.get('Finance_Head')).toMatchObject({
      x: -15,
      width: 230,
      groupTitleRect: { left: -130, right: -94, top: 200, bottom: 400 },
    });
  });

  it('swaps shared destination terminal tails when both swaps remove a crossing', () => {
    const cExitTopPort = { x: 297.553125, y: 1171.1287841796875 };
    const dExitRightPort = { x: 318.890625, y: 1196.6287841796875 };
    const nodeById = new Map<string, any>([
      ['C', { id: 'C', x: 292.21875, y: 287.5, width: 150.05624389648438, height: 91 }],
      ['D', { id: 'D', x: 292.21875, y: 570.5, width: 94.11250305175781, height: 91 }],
      ['exit', { id: 'exit', x: 292.21875, y: 1196.6287841796875, width: 53.34375, height: 51 }],
    ]);
    const edges: any[] = [
      {
        id: 'L_C_exit_0',
        start: 'C',
        end: 'exit',
        points: [
          { x: 367.2468719482422, y: 287.5 },
          { x: 387.2468719482422, y: 287.5 },
          { x: 387.2468719482422, y: 1151.1287841796875 },
          { x: 297.553125, y: 1151.1287841796875 },
          cExitTopPort,
        ],
      },
      {
        id: 'L_D_exit_0',
        start: 'D',
        end: 'exit',
        points: [
          { x: 339.2750015258789, y: 570.5 },
          { x: 359.2750015258789, y: 570.5 },
          { x: 359.2750015258789, y: 1196.6287841796875 },
          dExitRightPort,
        ],
      },
    ];

    expect(strictCrossingCount(edges)).toBe(1);

    swapDestinationTerminalTailsToReduceCrossings(edges, nodeById);

    expect(strictCrossingCount(edges)).toBe(0);
    expect(edges[0].points.at(-1)).toEqual(dExitRightPort);
    expect(edges[1].points.at(-1)).toEqual(cExitTopPort);
  });

  it('reassigns overlapping external rail channels as a crossing-minimizing bundle', () => {
    const nodeById = new Map<string, any>([
      ['26', { id: '26', x: -22, y: 664, width: 116, height: 64 }],
      ['27', { id: '27', x: -22, y: 1602, width: 116, height: 116 }],
      ['28', { id: '28', x: -22, y: 1050, width: 116, height: 80 }],
    ]);
    const edges: any[] = [
      {
        id: 'L_26_27_0',
        start: '26',
        end: '27',
        points: [
          { x: -80, y: 664 },
          { x: -100, y: 664 },
          { x: -100, y: 1660 },
          { x: -80, y: 1660 },
        ],
      },
      {
        id: 'L_27_28_0',
        start: '27',
        end: '28',
        points: [
          { x: 36, y: 1544 },
          { x: 65, y: 1544 },
          { x: 65, y: 1467 },
          { x: -126.4, y: 1467 },
          { x: -126.4, y: 1132 },
          { x: 36, y: 1132 },
          { x: 36, y: 1050 },
        ],
      },
    ];

    expect(strictCrossingCount(edges)).toBe(2);

    reassignCrossingExternalRailChannels(edges, nodeById);

    expect(strictCrossingCount(edges)).toBe(0);
    expect(edges[0].points[1].x).toBe(-126.4);
    expect(edges[1].points[3].x).toBe(-100);
  });

  it('shortcuts a dominated orthogonal jog when clearance is preserved', () => {
    const nodeById = new Map<string, any>([
      ['23', { id: '23', x: 36, y: 1328, width: 232, height: 108 }],
      ['27', { id: '27', x: 36, y: 1660, width: 232, height: 66 }],
      ['28', { id: '28', x: 36, y: 996, width: 232, height: 108 }],
    ]);
    const edges: any[] = [
      {
        id: 'L_27_28_0',
        start: '27',
        end: '28',
        points: [
          { x: 36, y: 1544 },
          { x: 65, y: 1544 },
          { x: 65, y: 1467 },
          { x: -100, y: 1467 },
          { x: -100, y: 1132 },
          { x: 36, y: 1132 },
          { x: 36, y: 1050 },
        ],
      },
    ];

    shortcutRedundantOrthogonalJogs(edges, nodeById);

    expect(edges[0].points).toEqual([
      { x: 36, y: 1544 },
      { x: 36, y: 1467 },
      { x: -100, y: 1467 },
      { x: -100, y: 1132 },
      { x: 36, y: 1132 },
      { x: 36, y: 1050 },
    ]);
  });

  it('shortcuts a redundant jog even when endpoint nodes are unavailable', () => {
    const edges: any[] = [
      {
        id: 'missing_endpoint_edge',
        start: 'missing-start',
        end: 'missing-end',
        points: [
          { x: 36, y: 1544 },
          { x: 65, y: 1544 },
          { x: 65, y: 1467 },
          { x: -100, y: 1467 },
          { x: -100, y: 1132 },
          { x: 36, y: 1132 },
          { x: 36, y: 1050 },
        ],
      },
    ];

    shortcutRedundantOrthogonalJogs(edges, new Map());

    expect(edges[0].points).toEqual([
      { x: 36, y: 1544 },
      { x: 65, y: 1544 },
      { x: 65, y: 1132 },
      { x: 36, y: 1132 },
      { x: 36, y: 1050 },
    ]);
  });
});
