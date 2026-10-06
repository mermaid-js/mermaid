import { describe, expect, it } from 'vitest';
import type { LayoutData } from '../../../types.js';
import { layOutFixture } from './viewerSizedLayout.js';

// What the dev viewer measures for 8-query-process-2.mmd.
const VIEWER_SIZES = {
  A: [150, 51],
  A2: [192, 192],
  E: [171, 171],
  F: [150, 51],
  G: [150, 51],
  F2: [150, 51],
  B: [171, 171],
  C: [150, 51],
} as const;

const ON_BOUNDARY_TOLERANCE = 1;

type Axis = 'horizontal' | 'vertical';

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
  shape?: string;
}

const isDiamond = (node: Box) => node.shape === 'diamond' || node.shape === 'question';

/** The axis an edge must travel along to arrive perpendicular to the face at `p`; undefined off the boundary. */
function arrivalAxis(node: Box, p: { x: number; y: number }): Axis | undefined {
  const dx = Math.abs(p.x - node.x);
  const dy = Math.abs(p.y - node.y);
  const halfW = node.width / 2;
  const halfH = node.height / 2;
  const near = (a: number, b: number) => Math.abs(a - b) <= ON_BOUNDARY_TOLERANCE;
  if (isDiamond(node)) {
    // Each face of a diamond is one vertex; the faces slant, so only the vertices count.
    if (near(dx, halfW) && near(dy, 0)) {
      return 'horizontal';
    }
    return near(dx, 0) && near(dy, halfH) ? 'vertical' : undefined;
  }
  if (near(dx, halfW) && dy <= halfH + ON_BOUNDARY_TOLERANCE) {
    return 'horizontal';
  }
  return near(dy, halfH) && dx <= halfW + ON_BOUNDARY_TOLERANCE ? 'vertical' : undefined;
}

function lastSegmentAxis(points: { x: number; y: number }[]): Axis {
  const end = points.at(-1)!;
  const before = points.findLast((p) => Math.hypot(p.x - end.x, p.y - end.y) > 1e-6)!;
  return Math.abs(end.y - before.y) < Math.abs(end.x - before.x) ? 'horizontal' : 'vertical';
}

function terminalViolations(layout: LayoutData): string[] {
  const byId = new Map(layout.nodes.map((n) => [n.id, n]));
  const problems: string[] = [];
  for (const edge of layout.edges) {
    const node = byId.get(edge.end ?? '');
    const points = edge.points;
    if (!node || !points?.length) {
      continue;
    }
    const box = node as unknown as Box;
    const axis = arrivalAxis(box, points.at(-1)!);
    if (!axis) {
      problems.push(`${edge.id} ends off the boundary of ${edge.end}`);
    } else if (axis !== lastSegmentAxis(points)) {
      problems.push(`${edge.id} arrives along the face of ${edge.end}`);
    }
  }
  return problems;
}

describe('where an edge ends on the node it points at', () => {
  it('8-query-process-2: every edge ends on its target, perpendicular to the face', async () => {
    const layout = await layOutFixture('8-query-process-2', VIEWER_SIZES);
    expect(terminalViolations(layout)).toEqual([]);
  });
});
