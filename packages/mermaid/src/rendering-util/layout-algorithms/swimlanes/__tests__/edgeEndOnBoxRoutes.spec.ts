import { describe, expect, it } from 'vitest';
import type { Box } from './faceGeometry.js';
import type { Pt } from './routeTouches.js';
import { VIEWER_SIZES_EDGE_END_ON_BOX } from './viewerMeasuredSizes.js';
import { layOutMeasured } from './viewerSizedLayout.js';

/** A segment that runs less than this far inside a box only touches it. */
const TOUCH_LENGTH = 1;
/** The time to parse and lay out the whole diagram, as the other whole-layout specs allow. */
const LAYOUT_TIMEOUT_MS = 20_000;

/** How far the square segment from `a` to `b` runs strictly inside `box`; 0 for a slanted one. */
function lengthInside(a: Pt, b: Pt, box: Box): number {
  const [left, right] = [box.x - box.width / 2, box.x + box.width / 2];
  const [top, bottom] = [box.y - box.height / 2, box.y + box.height / 2];
  const overlap = (from: number, to: number, low: number, high: number) =>
    Math.max(0, Math.min(Math.max(from, to), high) - Math.max(Math.min(from, to), low));
  if (a.x === b.x) {
    return a.x > left && a.x < right ? overlap(a.y, b.y, top, bottom) : 0;
  }
  if (a.y === b.y) {
    return a.y > top && a.y < bottom ? overlap(a.x, b.x, left, right) : 0;
  }
  return 0;
}

describe('edge-end-on-box, laid out as the dev viewer measures it', () => {
  it(
    'runs no route on inside the box at either of its ends',
    { timeout: LAYOUT_TIMEOUT_MS },
    async () => {
      const layout = await layOutMeasured(
        'regressions/edge-end-on-box',
        VIEWER_SIZES_EDGE_END_ON_BOX
      );
      const boxById = new Map<string, Box>(
        layout.nodes.map(({ id, x = 0, y = 0, width = 0, height = 0 }) => [
          id,
          { x, y, width, height },
        ])
      );
      const runsInside: string[] = [];
      for (const edge of layout.edges) {
        const points = edge.points ?? [];
        for (const end of [edge.start, edge.end]) {
          const box = end ? boxById.get(end) : undefined;
          const deepest = box
            ? Math.max(0, ...points.slice(1).map((p, i) => lengthInside(points[i], p, box)))
            : 0;
          if (deepest >= TOUCH_LENGTH) {
            runsInside.push(`${edge.id} runs ${deepest.toFixed(1)} px inside ${end}`);
          }
        }
      }

      expect(layout.edges.length).toBeGreaterThan(0);
      expect(runsInside).toEqual([]);
    }
  );
});
