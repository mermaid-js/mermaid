import { describe, expect, it } from 'vitest';
import {
  collapseRedundantRectangularDoglegs,
  separateSharedRenderedTerminalLanes,
} from '../direction/materializedGeometry.js';

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
});
