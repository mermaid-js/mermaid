/**
 * The contract that makes the validator split safe.
 *
 * `validateLayout` grades a layout for a human and the DDLT sweep; `checkLayout`
 * is what DOMUS hill-climbs on during a real render. They must never disagree
 * about what a good layout IS — if they did, DOMUS would optimise against one
 * objective while the sweep measured another, and the sweep would stop
 * predicting what ships.
 *
 * So the split is allowed to change only what a result can TELL you: the prose
 * in `Issue.message`. Everything a caller can act on — validity, score, the
 * breakdown, and the identity of every issue — is asserted identical here, over
 * real fixture geometry rather than synthetic cases, because the cheap checks
 * agree trivially and it is the expensive pairwise ones that could drift.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { addDiagrams } from '../../../diagram-api/diagram-orchestration.js';
import { setLogLevel } from '../../../logger.js';
import { checkLayout, validateLayout } from '../domus/validateLayoutProxy.js';
import { discoverLayoutTestFixtures, parseApplySizesAndLayout } from './index.js';

/** Everything about an issue except the prose. */
function identity(issue: {
  type: string;
  edgeId?: string;
  nodeIds?: string[];
  details?: Record<string, unknown>;
}) {
  return {
    type: issue.type,
    edgeId: issue.edgeId ?? null,
    nodeIds: [...(issue.nodeIds ?? [])].sort(),
    details: issue.details ?? null,
  };
}

describe('checkLayout is validateLayout minus the prose', () => {
  beforeAll(() => {
    setLogLevel('fatal');
    addDiagrams();
  });

  const fixtures = discoverLayoutTestFixtures().filter((fx) => fx.profile !== 'swimlanes');

  it('covers the domus corpus', () => {
    expect(fixtures.length).toBeGreaterThan(0);
  });

  for (const fx of fixtures) {
    it(`${fx.id} — same verdict, same score, same issues`, { timeout: 120_000 }, async () => {
      const layout = await parseApplySizesAndLayout(fx.mmdPath, fx.sizes, 'domus-orthogonal');

      const full = validateLayout(layout);
      const lean = checkLayout(layout);

      expect(lean.ok).toBe(full.ok);
      expect(lean.score).toBe(full.score);
      expect(lean.breakdown).toEqual(full.breakdown);
      expect(lean.issues.map(identity)).toEqual(full.issues.map(identity));

      // The one permitted difference, asserted so a future change that quietly
      // starts building messages again on the render path shows up here.
      expect(lean.issues.every((i) => i.message === '')).toBe(true);
      if (full.issues.length > 0) {
        expect(full.issues.some((i) => i.message.length > 0)).toBe(true);
      }
    });
  }
});
