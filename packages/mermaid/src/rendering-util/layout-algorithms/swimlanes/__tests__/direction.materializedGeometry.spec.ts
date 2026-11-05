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
import type { Edge, Node } from '../../../types.js';

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

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * The layout of a lane holding `Fix issues` (a box 152 wide, 45 high) whose left face meets two
 * rails 10 px apart: `decision --> fix` arrives at its upper end and `fix --> task`, a straight
 * connector through the centre, leaves it.
 */
describe('terminal rail separation on the face of a node', () => {
  const FIX = { x: 717.0944901581604, y: 0, width: 152, height: 45 };
  const FIX_FACE_X = FIX.x - FIX.width / 2;
  const ARRIVING_RAIL_Y = -10;
  const RAIL_STEP = 7;
  const CORNER_INSET = 8;
  const FACE_HALF_HEIGHT = FIX.height / 2;
  const NEAREST_TO_CORNER = FACE_HALF_HEIGHT - CORNER_INSET;

  const node = (id: string, box: Box, metadata?: Record<string, unknown>): Node => ({
    id,
    isGroup: false,
    ...box,
    ...(metadata ? { metadata } : {}),
  });

  const lay = (fixMetadata?: Record<string, unknown>, arrivingRailY = ARRIVING_RAIL_Y) => {
    const nodeById = new Map<string, Node>([
      ['fix', node('fix', FIX, fixMetadata)],
      ['task', node('task', { x: 361.27833762962456, y: 0, width: 160, height: 45 })],
      [
        'decision',
        node('decision', { x: 361.27833762962456, y: 271.11344146728516, width: 171, height: 171 }),
      ],
    ]);
    const arriving: Edge = {
      id: 'decision-fix',
      start: 'decision',
      end: 'fix',
      points: [
        { x: 446.77833762962456, y: 271.11344146728516 },
        { x: 561.8287112628167, y: 271.11344146728516 },
        { x: 561.8287112628167, y: arrivingRailY },
        { x: FIX_FACE_X, y: arrivingRailY },
      ],
    };
    const straight: Edge = {
      id: 'fix-task',
      start: 'fix',
      end: 'task',
      points: [
        { x: FIX_FACE_X, y: 0 },
        { x: 437.27833762962456, y: 0 },
      ],
    };
    separateSharedRenderedTerminalLanes([arriving, straight], nodeById);
    return {
      arrivingY: arriving.points?.at(-1)?.y,
      straightY: straight.points?.[0].y,
    };
  };

  it('moves the arriving rail and keeps a straight connector on the centre of a plain node', () => {
    expect(lay()).toEqual({ arrivingY: ARRIVING_RAIL_Y - RAIL_STEP, straightY: 0 });
  });

  it.each([
    ['upper', -1],
    ['lower', 1],
  ])(
    'lets a rail on a plain node come within a pixel of the %s corner of its face',
    (_corner, sign) => {
      const FIRST_RAIL_THAT_ENDS_ONE_PIXEL_FROM_THE_CORNER = FACE_HALF_HEIGHT - 1 - RAIL_STEP;
      expect(lay(undefined, sign * FIRST_RAIL_THAT_ENDS_ONE_PIXEL_FROM_THE_CORNER)).toEqual({
        arrivingY: sign * (FACE_HALF_HEIGHT - 1),
        straightY: 0,
      });
    }
  );

  it('moves a straight connector on a declaring node as far as the corner band allows', () => {
    const NEAR_THE_CENTRE = -2;
    expect(lay({ endpointProfile: 'flat' }, NEAR_THE_CENTRE)).toEqual({
      arrivingY: NEAR_THE_CENTRE,
      straightY: 2 * RAIL_STEP,
    });
  });

  it.each([
    ['a flat-sided node', { endpointProfile: 'flat' }],
    [
      'a pointed node with a drawn extent',
      { endpointProfile: 'vertex', drawnExtent: { width: FIX.width, height: FIX.height } },
    ],
  ])('keeps every rail on %s out of the corner band of its face', (_name, metadata) => {
    const { arrivingY, straightY } = lay(metadata);
    expect(Math.abs(arrivingY ?? Infinity)).toBeLessThanOrEqual(NEAREST_TO_CORNER);
    expect(Math.abs(straightY ?? Infinity)).toBeLessThanOrEqual(NEAREST_TO_CORNER);
  });
});
