/**
 * Parameterized DDLT sweep: every `*.sizes.json` + sibling `.mmd` under
 * `cypress/platform/dev-diagrams/layout-tests` (see `discoverLayoutTestFixtures`).
 *
 * Profile defaults: `swimlanes/` → swimlanes backend; otherwise flowchart DOMUS.
 * Override via `ddlt-manifest.json` in that folder (`allowLevel1Failure`, `profile`).
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { addDiagrams } from '../../../diagram-api/diagram-orchestration.js';
import { log, setLogLevel } from '../../../logger.js';
import { validateLayout, type ValidateLayoutResult } from '../layout-utils/validateLayout.js';
import {
  backendsForProfile,
  combineValidateLayoutResults,
  discoverLayoutTestFixtures,
  parseApplySizesAndLayout,
  type NamedValidateResult,
} from './index.js';

// Regression floor for the swimlanes subset (carried over from the swimlanes-only
// sweep that previously lived here). Adding the domus backend must not change
// swimlanes scoring, so this floor must continue to hold.
const SWIMLANE_TOTAL_SCORE_WITH_10_NODE_PLACEMENT_BASELINE = 11754;

function issueSummary(issues: { type: string }[]): string {
  return issues
    .map((i) => i.type)
    .sort()
    .join(', ');
}

describe('DDLT layout-tests fixture sweep', () => {
  beforeAll(() => {
    setLogLevel(process.env.ORTHO_TEST_DEBUG ? 'debug' : 'fatal');
    addDiagrams();
  });

  const fixtures = discoverLayoutTestFixtures();

  it('discovers at least one fixture pair', () => {
    expect(fixtures.length).toBeGreaterThan(0);
  });

  for (const fx of fixtures) {
    const backendIds = backendsForProfile(fx.profile);
    for (const backendId of backendIds) {
      it(`${fx.id} — ${backendId}`, { timeout: 120_000 }, async () => {
        const layout = await parseApplySizesAndLayout(fx.mmdPath, fx.sizes, backendId);
        const result = validateLayout(layout);
        if (fx.allowLevel1Failure) {
          // Documented in ddlt-manifest.json (e.g. strict Level 1 still tracked in a dedicated spec).
          expect(layout.nodes.length).toBeGreaterThan(0);
          return;
        }
        expect(result.ok, issueSummary(result.issues)).toBe(true);
        expect(result.issues).toEqual([]);
      });
    }
  }

  it('aggregate validateLayout report across all fixtures', { timeout: 600_000 }, async () => {
    const items: NamedValidateResult[] = [];
    const exemptIds = new Set<string>();
    for (const fx of fixtures) {
      if (fx.allowLevel1Failure) {
        exemptIds.add(fx.id);
      }
      const backendIds = backendsForProfile(fx.profile);
      for (const backendId of backendIds) {
        let result: ValidateLayoutResult;
        try {
          const layout = await parseApplySizesAndLayout(fx.mmdPath, fx.sizes, backendId);
          result = validateLayout(layout);
        } catch (err) {
          // Surface backend errors as a synthetic "invalid" entry instead of
          // aborting the sweep — the per-fixture `it()` above already asserts
          // backend health for non-exempt fixtures.
          log.debug(
            `DDLT-AGG: backend error for ${fx.id} — ${backendId}: ${(err as Error).message}`
          );
          result = {
            ok: false,
            issues: [
              { type: 'edge-missing-points', message: `backend error: ${(err as Error).message}` },
            ],
            score: 0,
            breakdown: {
              nodeCount: 0,
              edgeCount: 0,
              crossings: 0,
              totalPoints: 0,
              totalBendPenalty: 0,
              crossingPenalty: 0,
              edges: [],
              pointsHistogram: { '2': 0, '3': 0, '4': 0, '5': 0, '6': 0, '7+': 0 },
            },
          };
        }
        items.push({ id: `${fx.id} — ${backendId}`, result });
      }
    }

    const report = combineValidateLayoutResults(items);

    log.debug('DDLT-AGG: aggregate report', {
      total: report.totalScore,
      avg: report.avgScore,
      min: report.minScore,
      invalid: report.invalidCount,
      cases: report.byCase.length,
    });
    for (const row of report.byCase) {
      log.debug(
        `DDLT-AGG: ${row.id} score=${row.score} valid=${row.valid} issues=${row.issueTypes.join(',') || '-'}`
      );
    }

    expect(report.byCase.length).toBeGreaterThan(0);

    // Non-exempt fixtures must stay valid. Exempt fixtures (per
    // `ddlt-manifest.json`) are tracked in their own dedicated specs; here we
    // just want a hard floor on the rest of the sweep.
    const nonExemptInvalid = report.byCase.filter((row) => {
      const baseId = row.id.split(' — ')[0];
      return !exemptIds.has(baseId) && !row.valid;
    });
    expect(nonExemptInvalid.map((r) => `${r.id}: ${r.issueTypes.join(',')}`)).toEqual([]);

    // Preserve the swimlanes-subset regression floor.
    const swimlanesItems = items.filter((item) => item.id.startsWith('swimlanes/'));
    if (swimlanesItems.length > 0) {
      const swimlanesReport = combineValidateLayoutResults(swimlanesItems);
      expect(swimlanesReport.totalScore).toBeGreaterThanOrEqual(
        SWIMLANE_TOTAL_SCORE_WITH_10_NODE_PLACEMENT_BASELINE
      );
    }
  });
});
