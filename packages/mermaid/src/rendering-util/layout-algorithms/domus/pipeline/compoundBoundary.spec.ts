import { describe, it, expect } from 'vitest';
import {
  allocateBoundaryTs,
  buildCompoundBoundarySteps,
  type CompoundBoundaryStep,
} from './compoundBoundary.js';
import type { Node } from '../../../types.js';
import type { Point } from '../types.js';

describe('domus/pipeline/compoundBoundary - ', () => {
  it('allocateBoundaryTs is deterministic and biased by preferredT', () => {
    const stepsByEdgeId = new Map<string, CompoundBoundaryStep[]>([
      [
        'e1',
        [
          { groupId: 'G', side: 'E', requestId: 'e1:leave:G:0', preferredT: 0.2 },
          { groupId: 'G', side: 'E', requestId: 'e1:enter:G:1', preferredT: 0.8 },
        ],
      ],
      ['e2', [{ groupId: 'G', side: 'E', requestId: 'e2:leave:G:0', preferredT: 0.5 }]],
    ]);

    const tBy = allocateBoundaryTs(stepsByEdgeId);
    const a = tBy.get('e1:leave:G:0')!;
    const b = tBy.get('e2:leave:G:0')!;
    const c = tBy.get('e1:enter:G:1')!;
    expect(a).toBeLessThan(b);
    expect(b).toBeLessThan(c);
    expect(a).toBeGreaterThanOrEqual(0.05);
    expect(c).toBeLessThanOrEqual(0.95);
  });

  it('buildCompoundBoundarySteps creates leave then enter steps based on ancestry', () => {
    const nodesById = new Map<string, Node>([
      ['G', { id: 'G', isGroup: true, x: 0, y: 0, width: 100, height: 100 }],
      ['A', { id: 'A', isGroup: false, parentId: 'G', x: -200, y: 0, width: 10, height: 10 }],
      ['B', { id: 'B', isGroup: false, x: 200, y: 0, width: 10, height: 10 }],
    ]);
    const steps = buildCompoundBoundarySteps(
      'e1',
      nodesById.get('A')!,
      nodesById.get('B')!,
      nodesById,
      { x: -195, y: 0 } as Point
    );
    expect(steps.length).toBe(1);
    expect(steps[0].groupId).toBe('G');
  });
});
