import { beforeAll, describe, expect, it } from 'vitest';
import { addDiagrams } from '../../../diagram-api/diagram-orchestration.js';
import { setLogLevel } from '../../../logger.js';
import { discoverLayoutTestFixtures, parseApplySizesAndLayout } from '../ddlt/index.js';
import { validateLayout } from './validateLayoutProxy.js';

interface Point {
  x: number;
  y: number;
}

/**
 * A "rail" wart: two consecutive segments on the same axis that reverse
 * direction, so the path doubles back over ground it just covered. Collinear
 * points continuing the same way are merely unsimplified, not a spur.
 */
function hasBacktrack(points: Point[]): boolean {
  for (let i = 2; i < points.length; i++) {
    const [a, b, c] = [points[i - 2], points[i - 1], points[i]];
    const dx1 = b.x - a.x;
    const dy1 = b.y - a.y;
    const dx2 = c.x - b.x;
    const dy2 = c.y - b.y;
    if (dy1 === 0 && dy2 === 0 && dx1 * dx2 < 0) {
      return true;
    }
    if (dx1 === 0 && dx2 === 0 && dy1 * dy2 < 0) {
      return true;
    }
  }
  return false;
}

function isOrthogonal(points: Point[]): boolean {
  for (let i = 1; i < points.length; i++) {
    if (points[i].x !== points[i - 1].x && points[i].y !== points[i - 1].y) {
      return false;
    }
  }
  return true;
}

describe('Domus DDLT — project-sox2 labelled dogleg cleanup', () => {
  beforeAll(() => {
    setLogLevel(process.env.ORTHO_TEST_DEBUG ? 'debug' : 'fatal');
    addDiagrams();
  });

  // This asserted an exact 6-point polyline until a5c9bf0c2 ("DOMUS local-crossing
  // penalty") re-placed the whole fixture and every coordinate moved. The golden
  // was also self-defeating: its own points 2->3 doubled back along y=819.5, i.e.
  // it froze in the very rail wart the test is named for. Assert the property the
  // fix was about instead — an orthogonal, spur-free L_F_K_0 on a valid layout —
  // so a genuine routing regression still fails while a re-placement does not.
  it(
    'shortcuts the L_F_K_0 label-side rail while preserving validity',
    { timeout: 120_000 },
    async () => {
      const fixture = discoverLayoutTestFixtures().find((fx) => fx.id === 'domus/project-sox2');
      expect(fixture).toBeTruthy();

      const layout = await parseApplySizesAndLayout(
        fixture!.mmdPath,
        fixture!.sizes,
        'domus-orthogonal'
      );
      const result = validateLayout(layout);
      const edge = layout.edges.find((e) => e.id === 'L_F_K_0');

      expect(result.ok, result.issues.map((issue) => issue.type).join(', ')).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(979);

      const points = edge?.points as Point[] | undefined;
      expect(points, 'L_F_K_0 must be routed').toBeTruthy();
      expect(points!.length).toBeGreaterThanOrEqual(2);
      expect(isOrthogonal(points!), 'L_F_K_0 must stay orthogonal').toBe(true);
      expect(hasBacktrack(points!), 'L_F_K_0 must not double back on itself').toBe(false);
    }
  );
});
