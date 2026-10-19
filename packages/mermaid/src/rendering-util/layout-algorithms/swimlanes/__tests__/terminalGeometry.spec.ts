import { describe, expect, it } from 'vitest';
import type { LayoutData } from '../../../types.js';
import { faceAxis, lastSegmentAxis, type Box } from './faceGeometry.js';
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
    const axis = faceAxis(box, points.at(-1)!);
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
