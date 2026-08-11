import { describe, it, expect } from 'vitest';
import { insertBoundaryWaypointsForCrossBoundaryEdge, normalizePolyline } from './polyline.js';
import type { Node } from '../../../types.js';
import type { Point } from '../types.js';

describe('domus/pipeline/polyline - ', () => {
  it('insertBoundaryWaypointsForCrossBoundaryEdge inserts a group-boundary hit when segment crosses', () => {
    const G: Node = { id: 'G', isGroup: true, x: 0, y: 0, width: 10, height: 10 };
    const A: Node = { id: 'A', isGroup: false, x: -20, y: 0, width: 2, height: 2 };
    const B: Node = { id: 'B', isGroup: false, parentId: 'G', x: 20, y: 0, width: 2, height: 2 };
    const nodesById = new Map<string, Node>([
      ['G', G],
      ['A', A],
      ['B', B],
    ]);
    const pts: Point[] = [
      { x: -20, y: 0 },
      { x: 20, y: 0 },
    ];
    const out = insertBoundaryWaypointsForCrossBoundaryEdge(pts, A, B, nodesById);
    // Group is centered at 0 with width 10 => left boundary at -5 (y=0 on boundary).
    expect(out.some((p) => p.x === -5 && p.y === 0)).toBe(true);
  });

  it('normalizePolyline preserves boundary waypoints for groups', () => {
    const G: Node = { id: 'G', isGroup: true, x: 0, y: 0, width: 10, height: 10 };
    const groupsById = new Map<string, Node>([['G', G]]);
    const pts: Point[] = [
      { x: -10, y: 0 },
      { x: -5, y: 0 }, // boundary
      { x: 10, y: 0 },
    ];
    const out = normalizePolyline(pts, groupsById);
    expect(out).toHaveLength(3);
    expect(out[1]).toEqual({ x: -5, y: 0 });
  });
});
