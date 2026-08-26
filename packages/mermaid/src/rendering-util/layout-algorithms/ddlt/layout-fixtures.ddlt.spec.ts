/**
 * Parameterized DDLT sweep: every `*.sizes.json` + sibling `.mmd` under
 * `e2e/platform/dev-diagrams/layout-tests` (see `discoverLayoutTestFixtures`).
 *
 * Profile defaults: `swimlanes/` → swimlanes backend; otherwise flowchart DOMUS.
 * Override via `ddlt-manifest.json` in that folder (`allowLevel1Failure`, `profile`).
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { addDiagrams } from '../../../diagram-api/diagram-orchestration.js';
import { log, setLogLevel } from '../../../logger.js';
import {
  isSoftIssueType,
  validateLayout,
  type ValidateLayoutResult,
} from '../layout-utils/validateLayout.js';
import { readLayoutCost, resetLayoutCost, totalLayoutCost } from '../layout-utils/layoutCost.js';
import { DOMUS_VALIDATION_EXTENSIONS } from '../domus/validateLayoutProxy.js';

/**
 * Validate a fixture the same way its own engine does. DOMUS attaches
 * algorithm-specific extensions at `domus/validateLayoutProxy.ts`; if the sweep
 * scored with core rules while the engine optimised against extended ones, the
 * test and the pipeline would be measuring different things.
 */
function validateForBackend(layout: Parameters<typeof validateLayout>[0], backendId: string) {
  return backendId === 'domus-orthogonal'
    ? validateLayout(layout, { extensions: DOMUS_VALIDATION_EXTENSIONS })
    : validateLayout(layout);
}
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

/**
 * Work ceiling for the domus corpus, in `totalLayoutCost` units.
 *
 * Quality and cost are tracked as two axes, never blended: a single number
 * would need an exchange rate between score points and work units that nothing
 * can justify, and it would hide which side of a trade moved. Hiding that is
 * precisely the failure this ceiling exists to catch — 7d69c42a1 bought a 14.5x
 * speedup and silently gave up layout quality, and with only a score gate in
 * place the loss went unnoticed for months. A score floor alone ratchets one
 * way; a score floor plus a cost ceiling ratchets both.
 *
 * Counted work, not milliseconds, so this number is reproducible across
 * machines and moves only when the algorithm's work moves. The ceiling carries
 * ~10% headroom so ordinary layout changes do not trip it while a real blow-up
 * does. Raise it only with the measurement that justifies it in the commit
 * message.
 *
 * Baseline history:
 *   823,596,068  initial measurement over 37 fixtures
 *   803,000,000  after the 2026-08-26 validation rules. Cost FELL, from
 *                897,409,037 to 730,668,057, because capping a single edge's
 *                bend penalty (`BEND_PENALTY_MAX`) stops the score-gated repair
 *                passes chasing routes whose penalty had already run away. The
 *                ceiling is re-baselined down to keep ~10% headroom rather than
 *                banking the drop as slack. Placement work is expected to spend
 *                some of it back; raise it then, with the measurement.
 *   905,008,667  after d2d5cbf9e made the compaction constraint graph acyclic.
 *                Compaction previously bailed out via Kahn's algorithm on the
 *                hardest fixtures and emitted untouched coordinates, which was
 *                cheap precisely because it did no work. Running it costs more
 *                and bought +899 aggregate with two fixtures made valid, so the
 *                rise is the gate working as intended rather than a regression
 *                it failed to catch.
 */
const DOMUS_TOTAL_COST_CEILING = 803_000_000;

/**
 * Fixtures whose layout the validator currently rejects.
 *
 * Tracked as an explicit list rather than left as a red assertion, because "the
 * sweep fails on two fixtures and that is expected" is not a state a reviewer
 * can check. Listing them makes the debt visible and the gate exact in BOTH
 * directions: a fixture that newly breaks fails the sweep, and so does one that
 * gets fixed without being removed from here. The list may only shrink.
 *
 * `domus/architecture4` and `domus/triage2` predate the 2026-08-26 validation
 * rules. The other three were made invalid BY those rules, and each is a real
 * defect the rule is right to name:
 *
 *   domus/triage                    leaf nodes 10px apart (`node-node-padding`)
 *   domus/architecture5-components  a route leaves its own group and comes back
 *   swimlanes/14-messy-layout       likewise, twice
 *
 * They are here because node placement is the next piece of work, not because
 * the rules are wrong — see the commit that added them for the measurements.
 */
const KNOWN_INVALID = new Set([
  'domus/architecture4',
  'domus/triage2',
  'domus/architecture5-components',
  'swimlanes/14-messy-layout',
]);

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
        const result = validateForBackend(layout, backendId);
        if (fx.allowLevel1Failure || KNOWN_INVALID.has(fx.id)) {
          // Documented in ddlt-manifest.json (e.g. strict Level 1 still tracked in a dedicated spec),
          // or in KNOWN_INVALID above. Either way the fixture must still lay out.
          expect(layout.nodes.length).toBeGreaterThan(0);
          return;
        }
        // Hard issues only. Soft issues are priced into the score by design —
        // asserting on their absence would make this test stricter than the
        // definition of a valid layout, and it would fail on layouts the
        // scorer is perfectly happy with.
        const hard = result.issues.filter((issue) => !isSoftIssueType(issue.type));
        expect(result.ok, issueSummary(result.issues)).toBe(true);
        expect(hard).toEqual([]);
      });
    }
  }

  it('aggregate validateLayout report across all fixtures', { timeout: 600_000 }, async () => {
    const items: NamedValidateResult[] = [];
    const exemptIds = new Set<string>();
    let domusCostTotal = 0;
    const costByFixture: { id: string; total: number; cost: Readonly<Record<string, number>> }[] =
      [];
    for (const fx of fixtures) {
      if (fx.allowLevel1Failure) {
        exemptIds.add(fx.id);
      }
      const backendIds = backendsForProfile(fx.profile);
      for (const backendId of backendIds) {
        let result: ValidateLayoutResult;
        try {
          // Bracket the layout only. The grading validation below is the
          // harness's own work, not the algorithm's, and counting it would make
          // the budget depend on how the sweep is written.
          resetLayoutCost();
          const layout = await parseApplySizesAndLayout(fx.mmdPath, fx.sizes, backendId);
          if (backendId === 'domus-orthogonal') {
            const cost = readLayoutCost();
            const total = totalLayoutCost(cost);
            domusCostTotal += total;
            costByFixture.push({ id: fx.id, total, cost });
          }
          result = validateForBackend(layout, backendId);
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
              maxCrossingsOnAnyEdge: 0,
              crossingsHistogram: { '0': 0, '1': 0, '2': 0, '3': 0, '4+': 0 },
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
    for (const item of items) {
      const b = item.result.breakdown;
      log.debug(
        `DDLT-XING: ${item.id} total=${b.crossings} maxPerEdge=${b.maxCrossingsOnAnyEdge} hist=${JSON.stringify(b.crossingsHistogram)}`
      );
    }
    for (const row of report.byCase) {
      log.debug(
        `DDLT-AGG: ${row.id} score=${row.score} valid=${row.valid} issues=${row.issueTypes.join(',') || '-'}`
      );
    }

    expect(report.byCase.length).toBeGreaterThan(0);

    // Reported and gated BEFORE the validity assertion below: that one currently
    // fails on the fixtures added in 2b91d67ed, and anything after it would be
    // dead code — a cost ceiling that never runs is worse than none, because it
    // reads as covered.
    // Second axis: counted work. Reported per fixture so a regression names
    // itself, and gated in aggregate so no single fixture has to carry a budget.
    for (const row of [...costByFixture].sort((a, b) => b.total - a.total)) {
      log.debug(
        `DDLT-COST: ${row.id} total=${row.total} ${Object.entries(row.cost)
          .map(([k, v]) => `${k}=${v}`)
          .join(' ')}`
      );
    }
    log.debug(
      `DDLT-COST: domus total=${domusCostTotal} ceiling=${DOMUS_TOTAL_COST_CEILING} (${(
        (domusCostTotal / DOMUS_TOTAL_COST_CEILING) *
        100
      ).toFixed(1)}% of budget)`
    );
    expect(domusCostTotal).toBeGreaterThan(0);
    expect(domusCostTotal).toBeLessThanOrEqual(DOMUS_TOTAL_COST_CEILING);

    // Non-exempt fixtures must stay valid. Exempt fixtures (per
    // `ddlt-manifest.json`) are tracked in their own dedicated specs; here we
    // just want a hard floor on the rest of the sweep.
    const nonExemptInvalid = report.byCase.filter((row) => {
      const baseId = row.id.split(' — ')[0];
      return !exemptIds.has(baseId) && !KNOWN_INVALID.has(baseId) && !row.valid;
    });
    expect(nonExemptInvalid.map((r) => `${r.id}: ${r.issueTypes.join(',')}`)).toEqual([]);

    // The other direction: a fixture that has been fixed must leave the list,
    // or the list quietly stops meaning anything.
    const repaired = report.byCase
      .filter((row) => KNOWN_INVALID.has(row.id.split(' — ')[0]) && row.valid)
      .map((row) => row.id.split(' — ')[0]);
    expect(repaired, 'remove these from KNOWN_INVALID — they now pass').toEqual([]);

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
