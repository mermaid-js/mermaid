import { describe, expect, it } from 'vitest';
import { validateLayout } from '../layout-utils/validateLayout.js';
import { combineValidateLayoutResults } from './aggregateValidate.js';
import { discoverLayoutTestFixtures } from './discoverFixtures.js';
import { loadDdltFixture } from './loadDdltFixture.js';

const SWIMLANE_TOTAL_SCORE_WITH_10_NODE_PLACEMENT_BASELINE = 11754;
const GRID_TOTAL_SCORE_BASELINE = 9935;

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

  it('aggregate validateLayout report — grid', { timeout: 20_000 }, async () => {
    const fixtures = discoverLayoutTestFixtures().filter((fixture) => fixture.profile === 'grid');
    const items = [];

    expect(fixtures.map((fixture) => fixture.id)).toEqual(
      expect.arrayContaining([
        'grid/simple',
        'grid/group-stack',
        'grid/placement-matrix-tb',
        'grid/placement-matrix-lr',
        'grid/singleton-alignments',
        'grid/stack-default',
        'grid/stack-gap-zero',
        'grid/routing-group-member',
        'grid/routing-outside-member',
        'grid/routing-loops-parallel-lr',
        'grid/routing-cell-aware-empty-cell',
      ])
    );

    for (const fixture of fixtures) {
      const layout = await loadDdltFixture(fixture.id, { backendId: 'grid' });
      items.push({ id: fixture.id, result: validateLayout(layout) });
    }

    const report = combineValidateLayoutResults(items);
    console.log('DDLT-GRID-AGG:', JSON.stringify(report, null, 2));

    const exemptIds = new Set(
      fixtures.filter((fixture) => fixture.allowLevel1Failure).map((fixture) => fixture.id)
    );
    expect([...exemptIds]).toEqual([]);
    const nonExemptInvalid = report.byCase.filter((row) => !exemptIds.has(row.id) && !row.valid);
    expect(nonExemptInvalid.map((row) => `${row.id}: ${row.issueTypes.join(', ')}`)).toEqual([]);
    expect(report.totalScore).toBe(GRID_TOTAL_SCORE_BASELINE);
  });
});
