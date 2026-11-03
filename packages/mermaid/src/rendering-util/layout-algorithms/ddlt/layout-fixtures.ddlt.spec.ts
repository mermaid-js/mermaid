import { beforeAll, describe, expect, it } from 'vitest';
import { addDiagrams } from '../../../diagram-api/diagram-orchestration.js';
import { setLogLevel } from '../../../logger.js';
import { validateLayout } from '../layout-utils/validateLayout.js';
import {
  combineValidateLayoutResults,
  countIssuesByType,
  type NamedValidateResult,
} from './aggregateValidate.js';
import {
  backendsForProfile,
  DdltUnsupportedFixtureError,
  parseApplySizesAndLayout,
} from './backends.js';
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
 * size path. Report-only for now: it prints, per run, the hard-constraint violations by kind and
 * the aggregate score (`DDLT-CMP:`), and fails only when a backend throws unexpectedly or a
 * fixture goes unaccounted for. Score floors come once the layered port settles.
 */
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
  { name: 'dagre', backendId: 'dagre' },
];

describe('DDLT layered vs dagre', () => {
  beforeAll(() => {
    setLogLevel(process.env.ORTHO_TEST_DEBUG ? 'debug' : 'fatal');
    addDiagrams();
  });

  it('reports hard violations and aggregate score per backend', { timeout: 60_000 }, async () => {
    const fixtures = discoverLayoutTestFixtures().filter((f) => f.profile === 'flowchart-domus');
    expect(fixtures.length).toBeGreaterThan(0);
    for (const f of fixtures) {
      expect(backendsForProfile(f.profile)).toEqual(['layered', 'dagre']);
    }

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
  });
});
