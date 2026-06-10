/**
 * Regression spec for the sub-pixel endpoint snap pass landed alongside
 * the cyclic-path placement-failure fallback (iter-57).
 *
 * Background:
 * `deploy-pipeline.mmd` produces 2 residual `validateLayout` issues
 * caused by endpoints that sit at sub-pixel offsets from the obstacle
 * boundary:
 *   - `L_K_L_0` start endpoint (50, 293) is 0.5 px inside K (K.top=292.5).
 *   - `L_D_F_0` last endpoint (200, 784) is 0.44 px below F.bottom=783.56.
 * `pipeline/endpointStubRepair.ts:sideFromBoundaryPoint` uses tolerance
 * 1e-6, so neither endpoint is recognized as on a boundary and the
 * existing repair branches are skipped.
 *
 * This spec pins the fix: a pre-pass `snapEndpointsToBoundaries` in
 * `pipeline/snapEndpointsToBoundaries.ts` snaps near-boundary endpoints
 * onto the boundary, after which the existing endpoint stub repair
 * (specifically `slideEndPortToPreviousRail`) clears the residual
 * issues. Single-prefix log filter: `DEPLOY_SNAP_DBG`.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { addDiagrams } from '../../../diagram-api/diagram-orchestration.js';
import {
  discoverLayoutTestFixtures,
  parseApplySizesAndLayout,
  type LayoutTestFixture,
} from '../ddlt/index.js';
import { validateLayout } from '../layout-utils/validateLayout.js';
import { setLogLevel, log } from '../../../logger.js';

describe('Sub-pixel endpoint snap (deploy-pipeline)', () => {
  let fixture: LayoutTestFixture;

  beforeAll(() => {
    setLogLevel(process.env.ORTHO_TEST_DEBUG ? 'debug' : 'fatal');
    addDiagrams();
    const fx = discoverLayoutTestFixtures().find((f) => f.id === 'domus/deploy-pipeline');
    if (!fx) {
      throw new Error('deploy-pipeline fixture not found in DDLT manifest');
    }
    fixture = fx;
  });

  it('validateLayout reports ok=true for deploy-pipeline', async () => {
    const layout = await parseApplySizesAndLayout(
      fixture.mmdPath,
      fixture.sizes,
      'domus-orthogonal'
    );
    const result = validateLayout(layout);
    log.debug(
      'DEPLOY_SNAP_DBG: result',
      JSON.stringify({
        ok: result.ok,
        score: result.score,
        issueCount: result.issues.length,
        issueTypes: [...new Set(result.issues.map((i: any) => i.type))],
      })
    );
    expect(
      result.issues.map((i: any) => `${i.type}@${i.edgeId ?? i.nodeIds?.join(',') ?? '?'}`),
      'expected zero validateLayout issues for deploy-pipeline'
    ).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it('deploy-pipeline scores at least 800', async () => {
    const layout = await parseApplySizesAndLayout(
      fixture.mmdPath,
      fixture.sizes,
      'domus-orthogonal'
    );
    const result = validateLayout(layout);
    expect(result.score).toBeGreaterThanOrEqual(800);
  });
});
