import { describe, it, expect } from 'vitest';
import type { LayoutData } from '../../../types.js';
import { validateLayout } from '../validateLayoutProxy.js';

// Two nodes far apart so only the edge geometry under test drives the result.
function layoutWithEdgePoints(points: { x: number; y: number }[]): LayoutData {
  const a = { id: 'A', isGroup: false, x: 0, y: 0, width: 40, height: 40 };
  const b = { id: 'B', isGroup: false, x: 400, y: 0, width: 40, height: 40 };
  const e = { id: 'L_A_B_0', start: 'A', end: 'B', type: 'arrow', points };
  return { nodes: [a, b], edges: [e] } as unknown as LayoutData;
}

describe('edgeZeroLengthSegmentExtension', () => {
  it('flags a coincident-point tail (the group→group [start, end, end] degeneracy)', () => {
    const result = validateLayout(
      layoutWithEdgePoints([
        { x: 440, y: 87 },
        { x: 268.9, y: 87 },
        { x: 268.9, y: 87 },
      ])
    );
    const hits = result.issues.filter((i) => i.type === 'edge-zero-length-segment');
    expect(hits).toHaveLength(1);
    expect(result.ok).toBe(false); // hard: the drawn edge would NaN-truncate
    expect(result.score).toBe(0);
  });

  it('flags a coincident pair anywhere in the middle of the polyline', () => {
    const result = validateLayout(
      layoutWithEdgePoints([
        { x: 0, y: 0 },
        { x: 50, y: 0 },
        { x: 50, y: 0 },
        { x: 100, y: 0 },
      ])
    );
    expect(result.issues.some((i) => i.type === 'edge-zero-length-segment')).toBe(true);
  });

  it('does NOT flag a clean straight edge with distinct points', () => {
    const result = validateLayout(
      layoutWithEdgePoints([
        { x: 20, y: 0 },
        { x: 380, y: 0 },
      ])
    );
    expect(result.issues.some((i) => i.type === 'edge-zero-length-segment')).toBe(false);
  });

  it('does NOT flag a legitimately short (but nonzero) segment', () => {
    const result = validateLayout(
      layoutWithEdgePoints([
        { x: 20, y: 0 },
        { x: 200, y: 0 },
        { x: 200, y: 2 }, // 2px segment: short but not degenerate
      ])
    );
    expect(result.issues.some((i) => i.type === 'edge-zero-length-segment')).toBe(false);
  });
});
