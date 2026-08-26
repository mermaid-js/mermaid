/**
 * Parity check: does the DDLT ELK pipeline produce the geometry a real browser does?
 *
 * ## Why this exists
 *
 * DDLT is only worth optimizing against if it grades what the browser renders.
 * It once did not: the harness replaced the measure step with size appliers,
 * which reproduced its numbers but not its side effects, so `node.intersect` was
 * never attached and every edge endpoint fell through to a crude fallback. The
 * sweep reported 251 hard issues where the browser had 36, and an entire
 * 26-variant ELK configuration study was run against that number before anyone
 * compared a single edge to a real render. This spec is that comparison, made
 * cheap and repeatable.
 *
 * ## What it compares
 *
 * Edge ENDPOINTS, not whole polylines. The painted path rounds its corners into
 * quadratic curves, so intermediate anchors legitimately differ from the layout
 * points; the endpoints are the attachment points, and they are what every
 * endpoint-related `validateLayout` rule reads.
 *
 * The browser also insets each end by the arrow marker's height so the stroke
 * does not show through a transparent marker. That happens at PAINT time, after
 * layout, so DDLT points do not have it. Rather than re-deriving the inset here,
 * this applies the same production function the painter would, so the two sides
 * are related by real code rather than by a fudge factor.
 *
 * Which function that is depends on the curve, and there are two that do not
 * agree to the pixel — one uses `Math.atan`, the other `Math.atan2`. A
 * `rounded` edge is painted by `generateRoundedPath(applyMarkerOffsetsToPoints(…))`
 * (`edges.js`), everything else by a d3 line whose accessors come from
 * `getLineFunctionsWithOffset`. `applyElkEdgeLayout` sets `rounded` for every
 * edge ELK routed and `linear` for its straight-line fallback, so both occur.
 *
 * ## Running it
 *
 * Needs the dev server (`pnpm dev`) and is skipped otherwise, so it never blocks
 * a normal unit-test run:
 *
 *   DDLT_PARITY=1 MERMAID_DEV_PORT=9021 vitest run packages/mermaid-layout-elk/src/ddlt/elk-browser-parity.spec.ts
 */
import { chromium, type Browser, type Page } from '@playwright/test';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { addDiagrams } from 'mermaid/src/diagram-api/diagram-orchestration.js';
import { setLogLevel } from 'mermaid/src/logger.js';
import { getLineFunctionsWithOffset } from 'mermaid/src/utils/lineWithOffset.js';
import { applyMarkerOffsetsToPoints } from 'mermaid/src/rendering-util/rendering-elements/edges.js';
import {
  discoverLayoutTestFixtures,
  type LayoutTestFixture,
} from 'mermaid/src/rendering-util/layout-algorithms/ddlt/index.js';
import { parseApplySizesAndRunElk } from './backend.js';

/** Coordinates may differ by this much and still count as the same point. */
const TOLERANCE = 0.75;

/**
 * Fixtures with a known, small, unexplained divergence, and the bound it may not
 * exceed.
 *
 * Both are a ~1-2px difference in ELK's own node placement, not in the endpoint
 * logic: for `requirement-label-alignment` the DDLT edge ends exactly on the
 * target's top border (y=235.99999809) while the browser paints y=237, with the
 * intermediate bend shifted by the same 1px — so the rank gap differs by one
 * pixel. Node sizes match the fixture exactly, so some other ELK input differs
 * slightly; the cause has not been isolated.
 *
 * Recorded as a bound rather than a blanket tolerance so the rest of the corpus
 * stays strict and this cannot quietly grow into a real divergence.
 */
const KNOWN_DIVERGENCE = new Map<string, number>([
  ['elk-edge-cases/requirement-label-alignment', 1.5],
  ['elk-edge-cases/styled-edge-labels', 2.5],
]);

const PORT = process.env.MERMAID_DEV_PORT ?? '9000';
const BASE = `http://localhost:${PORT}`;

interface Point {
  x: number;
  y: number;
}

/**
 * The `M`/`L`/`Q` anchors of a painted path.
 *
 * Only the first and last are used; the rest vary with corner rounding.
 */
function pathEndpoints(d: string): { start: Point; end: Point } | null {
  const numbers = [...d.matchAll(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g)].map((m) => ({
    x: Number(m[1]),
    y: Number(m[2]),
  }));
  if (numbers.length < 2) {
    return null;
  }
  return { start: numbers[0], end: numbers[numbers.length - 1] };
}

/**
 * Apply the paint-time marker inset to a layout polyline, yielding the
 * coordinates the browser is expected to draw. See the note at the top of the
 * file about the two non-identical implementations.
 */
function paintedEndpoints(
  points: Point[],
  edge: { arrowTypeStart?: string; arrowTypeEnd?: string; curve?: unknown }
): { start: Point; end: Point } {
  const last = points.length - 1;

  if (edge.curve === 'rounded') {
    const offset = applyMarkerOffsetsToPoints(points, edge) as Point[];
    return { start: offset[0], end: offset[last] };
  }

  const fns = getLineFunctionsWithOffset(
    edge as Parameters<typeof getLineFunctionsWithOffset>[0]
  ) as {
    x: (d: Point, i: number, data: Point[]) => number;
    y: (d: Point, i: number, data: Point[]) => number;
  };
  return {
    start: { x: fns.x(points[0], 0, points), y: fns.y(points[0], 0, points) },
    end: { x: fns.x(points[last], last, points), y: fns.y(points[last], last, points) },
  };
}

function near(a: Point, b: Point, tolerance: number): boolean {
  return Math.abs(a.x - b.x) <= tolerance && Math.abs(a.y - b.y) <= tolerance;
}

function fmt(p: Point): string {
  return `${p.x.toFixed(2)},${p.y.toFixed(2)}`;
}

/**
 * Painted edge paths from a rendered diagram, keyed by the edge id they belong to.
 *
 * Painted ids are `<svgId>-<edgeId>`, and `svgId` itself contains hyphens, so
 * the id is recovered by matching against the edge ids the layout produced
 * rather than by parsing — edge id shapes differ per diagram type (`L_a_b_0`
 * for flowcharts, others for class/requirement diagrams).
 */
async function renderInBrowser(
  page: Page,
  fixture: LayoutTestFixture,
  edgeIds: string[]
): Promise<Map<string, string>> {
  const relative = fixture.mmdPath.split('dev-diagrams/')[1];
  const dir = relative.slice(0, relative.lastIndexOf('/'));
  const theme = fixture.sizes.metadata?.theme ?? 'default';
  const look = fixture.sizes.metadata?.look ?? 'classic';
  const url =
    `${BASE}/dev/?path=${encodeURIComponent(dir)}&file=${encodeURIComponent(relative)}` +
    `&theme=${theme}&look=${look}&layout=elk&logLevel=warn&useMaxWidth=1`;

  await page.goto(url, { waitUntil: 'networkidle' });
  // The dev explorer exposes `window.mermaidReady` for the library, not for an
  // individual render, so wait on the rendered output itself.
  await page.waitForFunction(() => document.querySelectorAll('svg g.nodes > *').length > 0, null, {
    timeout: 30_000,
  });

  const entries = await page.evaluate(() =>
    [...document.querySelectorAll('g.edgePaths path')].map((el) => ({
      id: el.id,
      d: el.getAttribute('d') ?? '',
    }))
  );

  const byEdgeId = new Map<string, string>();
  for (const { id, d } of entries) {
    const match = edgeIds.find((edgeId) => id === edgeId || id.endsWith(`-${edgeId}`));
    if (match) {
      byEdgeId.set(match, d);
    }
  }
  return byEdgeId;
}

describe.skipIf(!process.env.DDLT_PARITY)('DDLT ELK ↔ browser parity', () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    addDiagrams();
    setLogLevel('fatal');
    browser = await chromium.launch();
    page = await browser.newPage({ viewport: { width: 1600, height: 1200 } });
  }, 60_000);

  afterAll(async () => {
    await browser?.close();
  });

  const fixtures = discoverLayoutTestFixtures().filter((fx) => fx.profile === 'flowchart-elk');

  for (const fixture of fixtures) {
    it(`${fixture.id} — edge endpoints match the browser`, { timeout: 120_000 }, async () => {
      const layout = await parseApplySizesAndRunElk(fixture.mmdPath, fixture.sizes);
      const edgeIds = layout.edges.map((edge) => edge.id).filter((id): id is string => Boolean(id));
      if (edgeIds.length === 0) {
        // A diagram with no edges has no endpoints to compare. Nothing to assert
        // rather than a failure — `class-generic-no-html-labels` is a single node.
        return;
      }
      const painted = await renderInBrowser(page, fixture, edgeIds);

      const tolerance = KNOWN_DIVERGENCE.get(fixture.id) ?? TOLERANCE;
      const mismatches: string[] = [];
      let compared = 0;

      for (const edge of layout.edges) {
        const d = painted.get(edge.id);
        const points = (edge as { points?: Point[] }).points;
        if (!d || !points || points.length < 2) {
          continue;
        }
        const browserEnds = pathEndpoints(d);
        if (!browserEnds) {
          continue;
        }
        compared++;

        const expected = paintedEndpoints(
          points,
          edge as { arrowTypeStart?: string; arrowTypeEnd?: string; curve?: unknown }
        );
        if (!near(expected.start, browserEnds.start, tolerance)) {
          mismatches.push(
            `${edge.id} start: browser=${fmt(browserEnds.start)} ddlt=${fmt(expected.start)}`
          );
        }
        if (!near(expected.end, browserEnds.end, tolerance)) {
          mismatches.push(
            `${edge.id} end:   browser=${fmt(browserEnds.end)} ddlt=${fmt(expected.end)}`
          );
        }
      }

      expect(compared, `no edges compared for ${fixture.id}`).toBeGreaterThan(0);
      expect(mismatches).toEqual([]);
    });
  }
});
