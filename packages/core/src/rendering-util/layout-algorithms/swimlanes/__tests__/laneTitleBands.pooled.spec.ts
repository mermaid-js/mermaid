import { describe, it, expect } from 'vitest';
import {
  liftTopLaneTitleBandsAboveRails,
  shiftLeftLaneTitleBandsLeftOfRails,
} from '../direction/materializedGeometry.js';

const pooled = (direction: 'TB' | 'LR') => {
  const titleRect =
    direction === 'TB'
      ? { left: -100, right: 100, top: -100, bottom: -79 }
      : { left: -100, right: -64, top: -100, bottom: 100 };
  return new Map<string, any>([
    [
      'pool',
      {
        id: 'pool',
        isGroup: true,
        direction,
        x: 0,
        y: 0,
        width: 220,
        height: 220,
        metadata: { laneRole: 'pool' },
        groupTitleRect: { ...titleRect },
      },
    ],
    [
      'lane',
      {
        id: 'lane',
        isGroup: true,
        parentId: 'pool',
        direction,
        x: 0,
        y: 0,
        width: 200,
        height: 200,
        groupTitleRect: { ...titleRect },
      },
    ],
    ['other', { id: 'other', isGroup: true, parentId: 'pool', direction, x: 0, y: 300 }],
  ]);
};

describe('lane title bands inside a pool', () => {
  it('lifts the title band of a lane in a pool above a rail across it (TB)', () => {
    const nodes = pooled('TB');
    const edges: any[] = [
      {
        id: 'e',
        points: [
          { x: -50, y: -90 },
          { x: 50, y: -90 },
        ],
      },
    ];

    liftTopLaneTitleBandsAboveRails(edges, nodes);

    expect(nodes.get('lane').groupTitleRect.bottom).toBeLessThan(-90);
    expect(nodes.get('pool').groupTitleRect.bottom).toBe(-79);
  });

  it('shifts the title band of a lane in a pool left of a rail across it (LR)', () => {
    const nodes = pooled('LR');
    const edges: any[] = [
      {
        id: 'e',
        points: [
          { x: -80, y: -50 },
          { x: -80, y: 50 },
        ],
      },
    ];

    shiftLeftLaneTitleBandsLeftOfRails(edges, nodes);

    expect(nodes.get('lane').groupTitleRect.right).toBeLessThan(-80);
    expect(nodes.get('pool').groupTitleRect.right).toBe(-64);
  });
});
