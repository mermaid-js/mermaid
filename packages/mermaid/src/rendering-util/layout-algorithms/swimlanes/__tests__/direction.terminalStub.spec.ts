import { describe, expect, it } from 'vitest';
import { collapseShortTerminalStub } from '../direction/terminalStub.js';

describe('collapseShortTerminalStub', () => {
  it('retargets a short perpendicular destination stub to the destination face center', () => {
    const nodeById = new Map<string, any>([
      ['B', { id: 'B', x: 100, y: 110, width: 40, height: 40 }],
    ]);
    const edges: any[] = [
      {
        id: 'A_B',
        start: 'A',
        end: 'B',
        points: [
          { x: 0, y: 120 },
          { x: 70, y: 120 },
          { x: 70, y: 100 },
          { x: 78, y: 100 },
        ],
      },
    ];

    collapseShortTerminalStub(edges, nodeById);

    expect(edges[0].points).toEqual([
      { x: 0, y: 120 },
      { x: 100, y: 120 },
      { x: 100, y: 130 },
    ]);
  });
});
