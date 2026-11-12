import { beforeAll, describe, expect, it } from 'vitest';
import { addDiagrams } from '../../../diagram-api/diagram-orchestration.js';
import { setLogLevel } from '../../../logger.js';
import { validateLayout } from '../layout-utils/validateLayout.js';
import {
  combineValidateLayoutResults,
  countIssuesByType,
  type NamedValidateResult,
} from './aggregateValidate.js';
import { DdltUnsupportedFixtureError, parseApplySizesAndLayout } from './backends.js';
import { discoverLayoutTestFixtures } from './discoverFixtures.js';
import { loadDdltFixture } from './loadDdltFixture.js';
import type { LayoutTestBackendId } from './types.js';

const SWIMLANE_TOTAL_SCORE_WITH_10_NODE_PLACEMENT_BASELINE = 11754;

describe('DDLT layout-test fixture sweep', () => {
  it('aggregate validateLayout report — swimlanes', { timeout: 20_000 }, async () => {
    const fixtures = discoverLayoutTestFixtures().filter(
      (fixture) => fixture.profile === 'swimlanes'
    );
    const items = [];

    for (const fixture of fixtures) {
      const layout = await loadDdltFixture(fixture.id, { backendId: 'swimlanes' });
      items.push({ id: fixture.id, result: validateLayout(layout) });
    }

    const report = combineValidateLayoutResults(items);
    console.log('DDLT-AGG:', JSON.stringify(report, null, 2));

    expect(fixtures.map((fixture) => fixture.id)).toContain('swimlanes/10-node-placement');

    // Fixtures flagged `allowLevel1Failure` in ddlt-manifest.json are tracked
    // but tolerated (e.g. a known borderline near-corner edge attachment).
    // Every other swimlane fixture must stay valid.
    const exemptIds = new Set(
      fixtures.filter((fixture) => fixture.allowLevel1Failure).map((fixture) => fixture.id)
    );
    const nonExemptInvalid = report.byCase.filter((row) => !exemptIds.has(row.id) && !row.valid);
    expect(nonExemptInvalid.map((row) => `${row.id}: ${row.issueTypes.join(', ')}`)).toEqual([]);

    expect(report.totalScore).toBeGreaterThanOrEqual(
      SWIMLANE_TOTAL_SCORE_WITH_10_NODE_PLACEMENT_BASELINE
    );
  });
});

/**
 * `layered` and `dagre` side by side on the same fixtures — the flowchart ones plus `layered/*`
 * (class, state, ER, requirement and mindmap, captured under `layout: layered`) — through the same parse and
 * size path. It prints, per run, the hard-constraint violations by kind and the aggregate score
 * (`DDLT-CMP:`), and holds the layered merge gate:
 * - `layered` with default rounded routing or `edgeRouting: stepped` has no hard-constraint violation, and its
 *   aggregate score stays at or above `LAYERED_STEPPED_TOTAL_SCORE_BASELINE`;
 * - `layered` with explicit curved routing scores at least as much as dagre in aggregate,
 *   both over the whole sweep (a fixture dagre cannot lay out counts 0 for it) and over the
 *   fixtures every run could lay out.
 * The curved comparison is a smoke check, not a quality measure: an invalid layout scores 0, and
 * curved routes (like dagre's splines) always trip `edge-non-orthogonal`, so both totals come only
 * from the few fixtures whose routes happen to be orthogonal. The stepped floor is the real gate.
 */
const LAYERED_STEPPED_TOTAL_SCORE_BASELINE = 19396;

const COMPARISON_RUNS: {
  name: string;
  backendId: LayoutTestBackendId;
  config?: Record<string, unknown>;
}[] = [
  { name: 'layered', backendId: 'layered' },
  // `layered.edgeRouting` reaches the engine through `layout.config` (see `toLayoutGraph`).
  {
    name: 'layered-stepped',
    backendId: 'layered',
    config: { layered: { edgeRouting: 'stepped' } },
  },
  {
    name: 'layered-curved',
    backendId: 'layered',
    config: { layered: { edgeRouting: 'curved' } },
  },
  { name: 'dagre', backendId: 'dagre' },
];

describe('DDLT layered vs dagre', () => {
  beforeAll(() => {
    setLogLevel(process.env.ORTHO_TEST_DEBUG ? 'debug' : 'fatal');
    addDiagrams();
  });

  it(
    'meets the merge gate: rounded and stepped have no hard violation, curved scores >= dagre',
    { timeout: 60_000 },
    async () => {
      const fixtures = discoverLayoutTestFixtures().filter((f) => f.profile === 'flowchart-domus');
      expect(fixtures.length).toBeGreaterThan(0);

      const runs: { run: string; items: NamedValidateResult[]; unsupported: string[] }[] = [];
      const errors: string[] = [];
      for (const run of COMPARISON_RUNS) {
        const items: NamedValidateResult[] = [];
        const unsupported: string[] = [];
        for (const fixture of fixtures) {
          try {
            const layout = await parseApplySizesAndLayout(
              fixture.mmdPath,
              fixture.sizes,
              run.backendId,
              { config: run.config }
            );
            items.push({ id: fixture.id, result: validateLayout(layout) });
          } catch (e) {
            if (e instanceof DdltUnsupportedFixtureError) {
              unsupported.push(fixture.id);
            } else {
              errors.push(`${run.name} ${fixture.id}: ${String(e)}`);
            }
          }
        }
        runs.push({ run: run.name, items, unsupported });
      }
      expect(errors).toEqual([]);

      // The fixtures every run could lay out, so the totals compare like with like.
      const common = new Set(
        fixtures
          .map((f) => f.id)
          .filter((id) => runs.every((r) => r.items.some((item) => item.id === id)))
      );
      const report = runs.map(({ run, items, unsupported }) => {
        const shared = items.filter((item) => common.has(item.id));
        const all = combineValidateLayoutResults(items);
        const sharedReport = combineValidateLayoutResults(shared);
        return {
          run,
          fixtures: items.length,
          unsupported,
          invalidCount: all.invalidCount,
          hardViolationsByType: countIssuesByType(items),
          totalScore: all.totalScore,
          avgScore: all.avgScore,
          common: {
            fixtures: common.size,
            invalidCount: sharedReport.invalidCount,
            hardViolationsByType: countIssuesByType(shared),
            totalScore: sharedReport.totalScore,
          },
          byCase: all.byCase,
        };
      });
      console.log('DDLT-CMP:', JSON.stringify(report, null, 2));

      for (const { run, items, unsupported } of runs) {
        expect(items.length + unsupported.length, run).toBe(fixtures.length);
      }

      const byRun = new Map(report.map((r) => [r.run, r]));
      for (const name of ['layered', 'layered-stepped']) {
        const run = runs.find((r) => r.run === name)!;
        expect(run.unsupported).toEqual([]);
        expect(
          run.items
            .filter((item) => !item.result.ok)
            .map((item) => `${item.id}: ${item.result.issues.map((i) => i.message).join('; ')}`)
        ).toEqual([]);
        expect(byRun.get(name)!.totalScore).toBeGreaterThanOrEqual(
          LAYERED_STEPPED_TOTAL_SCORE_BASELINE
        );
      }

      const curved = byRun.get('layered-curved')!;
      const dagre = byRun.get('dagre')!;
      expect(curved.unsupported).toEqual([]);
      expect(curved.totalScore).toBeGreaterThanOrEqual(dagre.totalScore);
      expect(curved.common.totalScore).toBeGreaterThanOrEqual(dagre.common.totalScore);
    }
  );
});
