import { describe, expect, it } from 'vitest';
import { validateLayout } from '../layout-utils/validateLayout.js';
import { combineValidateLayoutResults } from './aggregateValidate.js';
import { discoverLayoutTestFixtures } from './discoverFixtures.js';
import { loadDdltFixture } from './loadDdltFixture.js';

const SWIMLANE_TOTAL_SCORE_WITH_10_NODE_PLACEMENT_BASELINE = 11754;

/**
 * Fixtures whose layout the validator currently rejects.
 *
 * Tracked as an explicit list rather than left as a red assertion, because "the
 * sweep fails on one fixture and that is expected" is not a state a reviewer can
 * check. The gate is exact in BOTH directions: a fixture that newly breaks fails
 * the sweep, and so does one that gets fixed without being removed from here.
 * The list may only shrink.
 *
 * `swimlanes/14-messy-layout` was made invalid by the 2026-08-26 validation
 * rules ported from the domus branch: `edge-reenters-own-group` catches two
 * routes that leave their own lane and come back. That is a real routing defect
 * in this fixture, not a misfire — see `14-messy-layout.ddlt.spec.ts`, which
 * pins the same defect at the individual-fixture level.
 */
const KNOWN_INVALID = new Set(['swimlanes/14-messy-layout']);

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
    const nonExemptInvalid = report.byCase.filter(
      (row) => !exemptIds.has(row.id) && !KNOWN_INVALID.has(row.id) && !row.valid
    );
    expect(nonExemptInvalid.map((row) => `${row.id}: ${row.issueTypes.join(', ')}`)).toEqual([]);

    // The other direction: a fixture that has been fixed must leave the list,
    // or the list quietly stops meaning anything.
    const repaired = report.byCase.filter((row) => KNOWN_INVALID.has(row.id) && row.valid);
    expect(
      repaired.map((row) => row.id),
      'remove these from KNOWN_INVALID — they now pass'
    ).toEqual([]);

    expect(report.totalScore).toBeGreaterThanOrEqual(
      SWIMLANE_TOTAL_SCORE_WITH_10_NODE_PLACEMENT_BASELINE
    );
  });
});
