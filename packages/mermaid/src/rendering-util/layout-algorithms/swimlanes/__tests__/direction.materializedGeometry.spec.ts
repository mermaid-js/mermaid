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

describe('separating two close terminal tracks on one face', () => {
  // `fix -> task` is a straight connector between aligned nodes and leaves fix's left face at
  // its centre; `decision -> fix` arrives on the same face 10 px above it, along the same
  // stretch, so the two tracks are close enough to separate.
  const ARRIVAL_Y = -10;
  const FIX_LEFT = -75;
  const layout = (fixHeight: number, taskRight: number, arrivalY = ARRIVAL_Y) => {
    const nodeById = new Map<string, any>([
      ['task', { id: 'task', x: taskRight - 75, y: 0, width: 150, height: 45 }],
      ['fix', { id: 'fix', x: 0, y: 0, width: 150, height: fixHeight }],
      ['decision', { id: 'decision', x: taskRight - 40, y: -130, width: 40, height: 40 }],
    ]);
    const fixToTask = {
      id: 'fix_task',
      start: 'fix',
      end: 'task',
      points: [
        { x: FIX_LEFT, y: 0 },
        { x: taskRight, y: 0 },
      ],
    };
    const decisionToFix = {
      id: 'decision_fix',
      start: 'decision',
      end: 'fix',
      points: [
        { x: taskRight - 40, y: -110 },
        { x: taskRight - 40, y: arrivalY },
        { x: FIX_LEFT, y: arrivalY },
      ],
    };
    separateSharedRenderedTerminalLanes([decisionToFix, fixToTask] as any[], nodeById);
    return { fixToTask, decisionToFix };
  };

  it('keeps the straight connector and moves the other track to the end of the face', () => {
    const { fixToTask, decisionToFix } = layout(45, -125);
    expect(fixToTask.points.map((p) => p.y)).toEqual([0, 0]);
    expect(decisionToFix.points.at(-1)?.y).toBe(-22.5 + 8);
  });

  it('shifts the other track a whole step when the face has room for it', () => {
    const { fixToTask, decisionToFix } = layout(80, -185);
    expect(fixToTask.points.map((p) => p.y)).toEqual([0, 0]);
    expect(decisionToFix.points.at(-1)?.y).toBe(ARRIVAL_Y - 7);
  });

  it('leaves both tracks when the other track cannot move away on the face', () => {
    const { fixToTask, decisionToFix } = layout(24, -110);
    expect(fixToTask.points.map((p) => p.y)).toEqual([0, 0]);
    expect(decisionToFix.points.at(-1)?.y).toBe(ARRIVAL_Y);
  });

  it('keeps a quarter of a small face clear at each corner', () => {
    const { decisionToFix } = layout(24, -110, -4);
    expect(decisionToFix.points.at(-1)?.y).toBe(-12 + 24 / 4);
  });

  it('does not move a track to the end of the face when that brings it closer to a third track', () => {
    // Two straight connectors leave fix's left face at -12 and 12; decision -> fix arrives at 5,
    // close to the one at 12. The end of the face, -14.5, is 2.5 from the one at -12.
    const nodeById = new Map<string, any>([
      ['task', { id: 'task', x: -200, y: 0, width: 150, height: 45 }],
      ['fix', { id: 'fix', x: 0, y: 0, width: 150, height: 45 }],
      ['decision', { id: 'decision', x: -165, y: -130, width: 40, height: 40 }],
    ]);
    const straightAt = (id: string, y: number) => ({
      id,
      start: 'fix',
      end: 'task',
      points: [
        { x: FIX_LEFT, y },
        { x: -125, y },
      ],
    });
    const upper = straightAt('fix_task_1', -12);
    const lower = straightAt('fix_task_2', 12);
    const decisionToFix = {
      id: 'decision_fix',
      start: 'decision',
      end: 'fix',
      points: [
        { x: -165, y: -110 },
        { x: -165, y: 5 },
        { x: FIX_LEFT, y: 5 },
      ],
    };
    separateSharedRenderedTerminalLanes([decisionToFix, upper, lower] as any[], nodeById);
    expect(upper.points.map((p) => p.y)).toEqual([-12, -12]);
    expect(lower.points.map((p) => p.y)).toEqual([12, 12]);
    const arrival = decisionToFix.points.at(-1)?.y ?? 0;
    const closest = Math.min(Math.abs(arrival + 12), Math.abs(arrival - 12));
    expect(closest).toBeGreaterThanOrEqual(12 - 5);
  });

  it('moves a track to the end of the face when its closest track stays as far away', () => {
    // On a face whose usable span is -6..6, the arrival at -4 is 4 from the straight connector
    // at 0 and 6 from the arrival at -10; at -6 it is 6 and 4 away.
    const nodeById = new Map<string, any>([
      ['task', { id: 'task', x: -185, y: 0, width: 150, height: 45 }],
      ['fix', { id: 'fix', x: 0, y: 0, width: 150, height: 24 }],
      ['decision', { id: 'decision', x: -150, y: -130, width: 40, height: 40 }],
      ['other', { id: 'other', x: -160, y: -230, width: 40, height: 40 }],
    ]);
    const arrival = (id: string, start: string, x: number, y: number) => ({
      id,
      start,
      end: 'fix',
      points: [
        { x, y: -110 },
        { x, y },
        { x: FIX_LEFT, y },
      ],
    });
    const moved = arrival('decision_fix', 'decision', -150, -4);
    const fixToTask = {
      id: 'fix_task',
      start: 'fix',
      end: 'task',
      points: [
        { x: FIX_LEFT, y: 0 },
        { x: -110, y: 0 },
      ],
    };
    const third = arrival('other_fix', 'other', -160, -10);
    separateSharedRenderedTerminalLanes([moved, fixToTask, third] as any[], nodeById);
    expect(moved.points.at(-1)?.y).toBe(-12 + 24 / 4);
    expect(third.points.at(-1)?.y).toBe(-10);
  });

  it('moves a track to the end of the face past tracks on another face or another node', () => {
    const nodeById = new Map<string, any>([
      ['task', { id: 'task', x: -200, y: 0, width: 150, height: 45 }],
      ['fix', { id: 'fix', x: 0, y: 0, width: 150, height: 45 }],
      ['decision', { id: 'decision', x: -165, y: -130, width: 40, height: 40 }],
      ['right', { id: 'right', x: 200, y: 0, width: 150, height: 45 }],
      ['above', { id: 'above', x: -90, y: -130, width: 40, height: 40 }],
      ['up', { id: 'up', x: -14, y: -130, width: 40, height: 40 }],
    ]);
    const fixToTask = {
      id: 'fix_task',
      start: 'fix',
      end: 'task',
      points: [
        { x: FIX_LEFT, y: 0 },
        { x: -125, y: 0 },
      ],
    };
    const decisionToFix = {
      id: 'decision_fix',
      start: 'decision',
      end: 'fix',
      points: [
        { x: -165, y: -110 },
        { x: -165, y: ARRIVAL_Y },
        { x: FIX_LEFT, y: ARRIVAL_Y },
      ],
    };
    // fix's right face and task's right face at the height the arrival moves to, and fix's top
    // face at that distance from fix's centre.
    const fixToRight = {
      id: 'fix_right',
      start: 'fix',
      end: 'right',
      points: [
        { x: 75, y: -14 },
        { x: 125, y: -14 },
      ],
    };
    const aboveToTask = {
      id: 'above_task',
      start: 'above',
      end: 'task',
      points: [
        { x: -90, y: -110 },
        { x: -90, y: -14 },
        { x: -125, y: -14 },
      ],
    };
    const fixToUp = {
      id: 'fix_up',
      start: 'fix',
      end: 'up',
      points: [
        { x: -14, y: -22.5 },
        { x: -14, y: -110 },
      ],
    };
    separateSharedRenderedTerminalLanes(
      [decisionToFix, fixToTask, fixToRight, aboveToTask, fixToUp] as any[],
      nodeById
    );
    expect(decisionToFix.points.at(-1)?.y).toBe(-22.5 + 8);
  });

  it('separates a later pair of tracks after a close pair that cannot move', () => {
    // The arrival sits at the end of the face's usable span, -6, 6 from the straight connector.
    const atFaceLimit = -12 + 24 / 4;
    const nodeById = new Map<string, any>([
      ['task', { id: 'task', x: -185, y: 0, width: 150, height: 45 }],
      ['fix', { id: 'fix', x: 0, y: 0, width: 150, height: 24 }],
      ['decision', { id: 'decision', x: -150, y: -130, width: 40, height: 40 }],
      ['A', { id: 'A', x: 300, y: 0, width: 40, height: 80 }],
      ['B', { id: 'B', x: 400, y: 0, width: 40, height: 80 }],
    ]);
    const decisionToFix = {
      id: 'decision_fix',
      start: 'decision',
      end: 'fix',
      points: [
        { x: -150, y: -110 },
        { x: -150, y: atFaceLimit },
        { x: FIX_LEFT, y: atFaceLimit },
      ],
    };
    const fixToTask = {
      id: 'fix_task',
      start: 'fix',
      end: 'task',
      points: [
        { x: FIX_LEFT, y: 0 },
        { x: -110, y: 0 },
      ],
    };
    const straight = (id: string) => ({
      id,
      start: 'A',
      end: 'B',
      points: [
        { x: 320, y: 0 },
        { x: 380, y: 0 },
      ],
    });
    const later = [straight('A_B_1'), straight('A_B_2')];
    separateSharedRenderedTerminalLanes([decisionToFix, fixToTask, ...later] as any[], nodeById);
    expect(decisionToFix.points.at(-1)?.y).toBe(atFaceLimit);
    expect(later[0].points.at(-1)?.y).not.toBe(later[1].points.at(-1)?.y);
  });
});

describe('separating two terminal tracks drawn on top of each other', () => {
  it('moves one of two identical straight connectors, even though both are straight', () => {
    const nodeById = new Map<string, any>([
      ['A', { id: 'A', x: -100, y: 0, width: 40, height: 80 }],
      ['B', { id: 'B', x: 0, y: 0, width: 40, height: 80 }],
    ]);
    const straight = () => ({
      start: 'A',
      end: 'B',
      points: [
        { x: -80, y: 0 },
        { x: -20, y: 0 },
      ],
    });
    const edges = [
      { id: 'A_B_1', ...straight() },
      { id: 'A_B_2', ...straight() },
    ];
    separateSharedRenderedTerminalLanes(edges as any[], nodeById);
    expect(edges[0].points.at(-1)?.y).not.toBe(edges[1].points.at(-1)?.y);
  });

  it('separates two tracks on a face too narrow for a whole step, inside its corners', () => {
    const nodeById = new Map<string, any>([
      ['A', { id: 'A', x: 0, y: -100, width: 20, height: 40 }],
      ['B', { id: 'B', x: 0, y: 0, width: 20, height: 40 }],
    ]);
    const down = (id: string) => ({
      id,
      start: 'A',
      end: 'B',
      points: [
        { x: 0, y: -80 },
        { x: 0, y: -20 },
      ],
    });
    const edges = [down('A_B_1'), down('A_B_2')];
    separateSharedRenderedTerminalLanes(edges as any[], nodeById);
    const ends = edges.map((edge) => edge.points.at(-1)?.x ?? 0);
    expect(ends[0]).not.toBe(ends[1]);
    for (const end of ends) {
      expect(Math.abs(end)).toBeLessThanOrEqual(10 - 20 / 4);
    }
  });
});
