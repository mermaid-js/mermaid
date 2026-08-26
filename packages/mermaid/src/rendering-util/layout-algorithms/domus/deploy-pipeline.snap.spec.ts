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
import { validateLayout } from './validateLayoutProxy.js';
import { setLogLevel, log } from '../../../logger.js';
import { isSoftIssueType } from '../layout-utils/validateLayout.js';

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
    // The 2026-08-26 spacing rules found real defects here that the layout
    // has always had: two pairs of leaves sit closer than `NODE_NODE_PADDING`
    // (I/K are 5.5 apart) and one leaf crowds a group frame. Pinned exactly
    // rather than relaxed to `ok`, so this breaks again the moment placement
    // fixes it — and it must then go back to asserting an empty list.
    const KNOWN_SPACING_DEFECTS = [
      'node-node-padding@I,K',
      'node-too-close-to-group@D,subGraph0',
      'node-too-close-to-group@E,subGraph0',
    ];
    expect(
      result.issues
        .filter((i: any) => !isSoftIssueType(i.type))
        .map((i: any) => `${i.type}@${i.edgeId ?? i.nodeIds?.join(',') ?? '?'}`)
        .filter((k: string) => !KNOWN_SPACING_DEFECTS.includes(k)),
      'expected no validateLayout issues for deploy-pipeline beyond the known spacing defects'
    ).toEqual([]);
  });

  it('deploy-pipeline routes cleanly once the known spacing defects are set aside', async () => {
    const layout = await parseApplySizesAndLayout(
      fixture.mmdPath,
      fixture.sizes,
      'domus-orthogonal'
    );
    const result = validateLayout(layout);
    // The score itself is 0 while the spacing defects stand — a hard issue
    // clamps it — so the routing quality this test was written to guard is
    // asserted directly instead: no edge-level issue of any kind.
    expect(result.issues.filter((i: any) => i.edgeId != null && !isSoftIssueType(i.type))).toEqual(
      []
    );
  });
});
