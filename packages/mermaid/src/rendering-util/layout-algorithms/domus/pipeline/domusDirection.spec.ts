import { describe, it, expect } from 'vitest';
import { directionViolationRatioForLayout, mirrorLeafNodesInPlace } from './domusDirection.js';
import type { LayoutData, Node } from '../../../types.js';

describe('domus/pipeline/domusDirection - ', () => {
  it('directionViolationRatioForLayout computes fraction of edges violating direction', () => {
    const data = {
      direction: 'TB',
      nodes: [
        { id: 'A', isGroup: false, x: 0, y: 0 },
        { id: 'B', isGroup: false, x: 0, y: 10 },
        { id: 'C', isGroup: false, x: 0, y: -10 },
      ],
      edges: [
        { id: 'e1', start: 'A', end: 'B' }, // ok for TB
        { id: 'e2', start: 'A', end: 'C' }, // violates TB
      ],
    } as unknown as LayoutData;
    expect(directionViolationRatioForLayout(data, 'TB')).toBeCloseTo(0.5);
  });

  it('mirrorLeafNodesInPlace mirrors only leaf nodes around their extent center', () => {
    const data = {
      nodes: [
        { id: 'A', isGroup: false, x: 0, y: 0 },
        { id: 'B', isGroup: false, x: 10, y: 0 },
        { id: 'G', isGroup: true, x: 999, y: 999 },
      ],
    } as unknown as LayoutData;
    mirrorLeafNodesInPlace(data, 'x');
    // Leaf x coords [0,10] => center 5 => mirrored: A.x=10, B.x=0
    expect(data.nodes.find((n: Node) => n.id === 'A')!.x).toBe(10);
    expect(data.nodes.find((n: Node) => n.id === 'B')!.x).toBe(0);
    // Group unchanged
    expect(data.nodes.find((n: Node) => n.id === 'G')!.x).toBe(999);
  });
});
