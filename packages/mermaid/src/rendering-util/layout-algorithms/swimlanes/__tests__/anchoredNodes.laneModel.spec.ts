import { describe, it, expect } from 'vitest';
import { clearAnchoredOverlaps } from '../anchoredNodes.js';
import type { AnchorPin } from '../anchoredNodes.js';
import { isLaneIn } from '../lanes.js';
import type { LayoutData, Node } from '../../../types.js';

const group = (id: string, left: number, right: number, parentId?: string): Node =>
  ({
    id,
    isGroup: true,
    parentId,
    x: (left + right) / 2,
    y: 0,
    width: right - left,
    height: 200,
  }) as Node;

const START = { x: 40, y: 0 };

// A plain swimlane-beta lane (no laneRole) holding a nested subgraph that holds the host.
function clearInLaneEndingAt(laneRight: number) {
  const standing = {
    id: 'note',
    parentId: 'inner',
    ...START,
    width: 20,
    height: 20,
    metadata: { anchorTo: { hostId: 'host', gap: 10 } },
  } as unknown as Node;
  const nodes: Node[] = [
    group('lane', -300, laneRight),
    group('inner', -50, 50, 'lane'),
    { id: 'host', parentId: 'inner', x: 0, y: 0, width: 40, height: 40 } as Node,
    { id: 'wall', parentId: 'lane', x: 60, y: 0, width: 30, height: 40 } as Node,
    standing,
  ];
  const pin: AnchorPin = {
    nodeId: 'note',
    hostId: 'host',
    side: 'right',
    ...START,
    outward: { x: 1, y: 0 },
  };
  const [cleared] = clearAnchoredOverlaps({ nodes } as LayoutData, [pin], isLaneIn(nodes));
  return { cleared, pin, standing };
}

describe('clearing an anchored node inside a nested subgraph of a plain lane', () => {
  it('may step out of the inner group while it stays in the lane', () => {
    const { standing, cleared, pin } = clearInLaneEndingAt(300);

    expect(cleared).not.toBe(pin);
    expect(standing.x!).toBeGreaterThan(50);
  });

  it('is put back when clearing would leave the lane', () => {
    const { standing, cleared, pin } = clearInLaneEndingAt(80);

    expect(cleared).toBe(pin);
    expect({ x: standing.x, y: standing.y }).toEqual(START);
  });
});
