/**
 * Paint-path smoke test for the DOMUS layout.
 *
 * The DDLT fixture sweep (`ddlt/layout-fixtures.ddlt.spec.ts`) is DOM-free by
 * design — it validates the geometry produced by `layout()` and never runs
 * `paint()`. That makes it blind to crashes in the render/paint path, e.g. the
 * `insertEdge` 2-point clipping crash ("Cannot read properties of undefined
 * (reading 'x')") that users hit in the browser.
 *
 * This spec closes that gap: for every DOMUS fixture it runs the FULL render
 * path (`measure` -\> `layout` -\> `paint`) under jsdom and asserts it does not
 * throw. We deliberately assert only "does not crash" — not pixel geometry —
 * because jsdom cannot measure real SVG text metrics, but a crash like the
 * intersect bug throws regardless of measurement fidelity.
 *
 * Fixtures are parsed with the DDLT loader (`preprocessDiagram` -\>
 * `Diagram.fromText`), the same path the fixture sweep uses. Parsing them with
 * the flowchart JISON parser directly would skip frontmatter extraction and
 * comment stripping and assume every fixture is a flowchart, which throws a
 * parse error on the `---`/`%%`/`erDiagram`/`mindmap` fixtures in this corpus
 * long before `paint()` is ever reached — the harness would fail where the
 * renderer is fine.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { select } from 'd3';
import type { LayoutData } from '../../types.js';
import { addDiagrams } from '../../../diagram-api/diagram-orchestration.js';
import { parseMmdFileToLayoutData } from '../ddlt/parseToLayoutData.js';
import { render } from './index.js';
import { setLogLevel } from '../../../logger.js';

const FIXTURE_DIR = resolve(process.cwd(), 'e2e/platform/dev-diagrams/layout-tests/domus');

function domusFixtureNames(): string[] {
  return readdirSync(FIXTURE_DIR)
    .filter((f) => f.endsWith('.mmd'))
    .map((f) => f.replace(/\.mmd$/, ''))
    .sort();
}

/** Parse a fixture the way the DDLT sweep does, then tag it for the paint pass. */
async function loadFixture(name: string, diagramId: string): Promise<LayoutData> {
  const layoutData = await parseMmdFileToLayoutData(join(FIXTURE_DIR, `${name}.mmd`), {
    stampFlowchartRendererFields: true,
  });
  (layoutData as LayoutData & { diagramId?: string }).diagramId = diagramId;
  return layoutData;
}

describe('DOMUS paint-path smoke (render does not crash)', () => {
  let proto: any;
  let originalGetBBox: any;
  let originalCapture: any;

  beforeAll(() => {
    setLogLevel('fatal');
    // Diagram.fromText() detects the fixture's type; without registration the
    // non-flowchart fixtures in this corpus cannot resolve a parser.
    addDiagrams();
    // Hard-disable DDLT size capture for this spec. render() goes through
    // createGraphWithElements, whose capture guard reads globalThis.
    // mermaidCaptureSizes; a leaked truthy flag (e.g. from a dev page) must
    // never let this smoke test mutate the real .sizes.json fixtures.
    originalCapture = (globalThis as any).mermaidCaptureSizes;
    (globalThis as any).mermaidCaptureSizes = false;
    proto = (globalThis as any).SVGElement?.prototype;
    originalGetBBox = proto?.getBBox;
    if (proto) {
      // jsdom has no SVG text metrics; provide a stable non-zero bbox so the
      // measure() stage takes a realistic path instead of zero-sizing.
      proto.getBBox = () => ({ x: 0, y: 0, width: 120, height: 60 });
    }
  });

  afterAll(() => {
    if (proto) {
      proto.getBBox = originalGetBBox;
    }
    (globalThis as any).mermaidCaptureSizes = originalCapture;
  });

  const fixtures = domusFixtureNames();

  it('discovers domus fixtures', () => {
    expect(fixtures.length).toBeGreaterThan(0);
  });

  for (const name of fixtures) {
    it(`renders ${name} without throwing`, async () => {
      const layoutData = await loadFixture(name, `paint-smoke-${name}`);

      document.body.innerHTML = '<svg><g></g></svg>';
      const svg = select('svg') as any;

      await expect(render(layoutData, svg)).resolves.not.toThrow();
    });
  }

  // Painted labels must land at the validated anchor (edge.x/edge.y), not the
  // path midpoint — otherwise validateLayout's checks (e.g. edge-label-overlaps-
  // node) score a position the browser never draws. With label-dummy injection
  // (A), DOMUS produces a finite anchor and paint must honor it.
  it('paints each edge label at its validated edge.x/edge.y anchor', async () => {
    const layoutData = await loadFixture('Company-simp', 'paint-anchor-company-simp');

    document.body.innerHTML = '<svg><g></g></svg>';
    const svg = select('svg') as any;
    await render(layoutData, svg);

    const labelled = (layoutData.edges as any[]).filter(
      (e) => e.label && Number.isFinite(e.x) && Number.isFinite(e.y)
    );
    expect(labelled.length).toBeGreaterThan(0);
    let checked = 0;
    for (const e of labelled) {
      // insertEdgeLabel builds `g.edgeLabel > g.label[data-id=<edgeId>]`; the
      // outer g.edgeLabel carries the translate. Multiple matches can exist
      // (measure + paint groups); pick the one that actually has a transform.
      const candidates = [...document.querySelectorAll(`g.label[data-id="${e.id}"]`)]
        .map((inner) => inner.parentElement?.getAttribute('transform'))
        .filter((t): t is string => Boolean(t?.includes('translate(')));
      if (candidates.length === 0) {
        continue;
      }
      const m = /translate\(([\d.-]+),\s*([\d.-]+)\)/.exec(candidates[candidates.length - 1]);
      if (!m) {
        continue;
      }
      checked++;
      expect(Math.abs(Number(m[1]) - e.x)).toBeLessThan(1);
      // y may carry a subgraph-title half-margin (0 for this flat fixture).
      expect(Math.abs(Number(m[2]) - e.y)).toBeLessThan(2);
    }
    expect(checked).toBeGreaterThan(0);
  });
});
