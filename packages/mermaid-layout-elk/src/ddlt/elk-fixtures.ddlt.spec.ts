/**
 * Parameterized DDLT sweep over the ELK edge-case fixtures.
 *
 * One `it()` per fixture plus an aggregate row, mirroring the DOMUS/swimlanes
 * sweep in `packages/mermaid/src/rendering-util/layout-algorithms/ddlt/`. The
 * aggregate is the number the ELK configuration work hill-climbs on, so it is
 * reported unconditionally (via `DDLT-ELK-AGG:`) rather than only on failure.
 *
 *   ORTHO_TEST_DEBUG=1 vitest run packages/mermaid-layout-elk/src/ddlt/ | grep DDLT-ELK
 *
 * Re-capture the fixtures with (dev server running):
 *
 *   node scripts/capture-ddlt-sizes.mjs --dir layout-tests/elk-edge-cases --layout elk
 *     --theme redux-color --look neo
 */
import { readdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { addDiagrams } from 'mermaid/src/diagram-api/diagram-orchestration.js';
import { setLogLevel } from 'mermaid/src/logger.js';
import {
  isSoftIssueType,
  validateLayout,
} from 'mermaid/src/rendering-util/layout-algorithms/layout-utils/validateLayout.js';
import {
  combineValidateLayoutResults,
  discoverLayoutTestFixtures,
  type NamedValidateResult,
} from 'mermaid/src/rendering-util/layout-algorithms/ddlt/index.js';
import { parseApplySizesAndRunElk } from './backend.js';

/** Theme and look these fixtures were captured at. */
const EXPECTED_THEME = 'redux-color';
const EXPECTED_LOOK = 'neo';

/**
 * Capture version that first carried per-node `labelBBox`.
 *
 * `measureLayoutWithFixture` re-runs the real shape handlers, and a handler
 * builds its outline from the label box, so an older fixture cannot drive it.
 */
const REQUIRED_CAPTURE_VERSION = 2;

/**
 * Fixtures ELK currently lays out in a way `validateLayout` rejects.
 *
 * Listed rather than left as a red assertion so the debt is reviewable, and
 * gated in BOTH directions: a fixture that newly breaks fails the sweep, and so
 * does one that starts passing without being removed here. The list may only
 * shrink.
 *
 * These are believed to be real. An earlier version of this list had eleven
 * entries and attributed them to a single adapter defect — "ELK returns a
 * polyline whose first bend shares a coordinate with the port, so the opening
 * segment runs along the endpoint node's own border" — reported as 232 of 251
 * hard issues across `edge-port-direction-mismatch`, `edge-intersects-obstacle`,
 * `edge-border-hugging`, `edge-bend-near-endpoint` and
 * `edge-shared-attachment-point`. That diagnosis was wrong, and so was the
 * conclusion drawn from it (that a 26-variant ELK config sweep "could not move
 * the baseline").
 *
 * The real cause was in this harness. DDLT used to replace the measure step with
 * `applyFixture*Sizes`, which reproduced its numbers but not its side effects —
 * in particular `node.intersect`, which every shape assigns inside its draw
 * function. With it undefined, `computeNodeIntersection` in the ELK adapter fell
 * through to `fallbackIntersection`, clipping endpoints along an arbitrary
 * interior line instead of the shape outline. The border-hugging opening segment
 * was that fallback, not ELK: against a real browser render of
 * `many-subgraphs-and-edges`, ELK's own section already left the port
 * perpendicular, and the config sweep was measuring the harness rather than the
 * layout.
 *
 * The measure step now runs for real under JSDOM (`measureLayoutWithFixture`),
 * and all 28 edge start points in that fixture match the browser exactly.
 *
 * What that exposed, in turn, was a half-pixel displacement applied to every
 * result of `intersectLine` — leftover integer-rounding arithmetic from the
 * Graphics Gems original — which is how every non-rectangular shape finds its
 * edge attachment. Removing it cleared `Render-stadium-shape` outright and took
 * the aggregate from 5748.5 to 6738.5.
 *
 * The decision-shape fixtures that followed came from the adapter attaching
 * along the ray from the node CENTRE, which lands on the outline at a different
 * offset than the port ELK chose and so opened every edge with a diagonal
 * segment. `outlineAttachPoint` now attaches along the edge's own departure
 * axis instead, and `edge-endpoint-inside-node` / `edge-intersects-obstacle`
 * no longer treat a correct attachment to a non-rect outline as a defect.
 * Aggregate 6738.5 to 9128.5.
 *
 * What survives has nothing to do with shapes: bends landing too close to an
 * endpoint, and group frames with more empty space than content.
 *
 * `merge-edge-ambiguity` is different from the other two. It is a deliberate
 * counterexample rather than debt, and it must STAY invalid until edge merging
 * is fixed. Its graph is
 *
 * ```
 * A --> B & C & D ;  C --> A ;  F --> A ;  D --> A
 * ```
 *
 * with `elk.mergeEdges` on. There is no edge between B and A, but merging
 * collapses A's whole fan onto one handle carrying a double-headed arrow, so
 * the picture reads as though there is. That is a correctness failure, not an
 * untidy one: the diagram asserts a relationship the source never declared.
 *
 * It also pins the boundary the bundle classification draws. The pairs that
 * fabricate the reading are mixed-role — one edge arriving where another
 * leaves — and stay HARD; the same-role fans in the same diagram are soft
 * bundles. If a future change makes this fixture valid, the ratchet will say
 * so, and that is the signal that merging became safe.
 */
const KNOWN_INVALID = new Set<string>([
  'elk-edge-cases/many-subgraphs-and-edges',
  'elk-edge-cases/right-angles-not-curves',
  // Not debt: a counterexample, pinned on purpose. Its frontmatter turns
  // `elk.mergeEdges` ON, and the graph is built so that merging fabricates a
  // relationship the graph does not contain — see the note below.
  'elk-edge-cases/merge-edge-ambiguity',
]);

function issueSummary(issues: { type: string }[]): string {
  return [...new Set(issues.map((i) => i.type))].sort().join(', ');
}

describe('DDLT ELK fixture sweep', () => {
  beforeAll(() => {
    setLogLevel(process.env.ORTHO_TEST_DEBUG ? 'debug' : 'fatal');
    addDiagrams();
  });

  const fixtures = discoverLayoutTestFixtures().filter((fx) => fx.profile === 'flowchart-elk');

  it('discovers the ELK edge-case fixtures', () => {
    expect(fixtures.length).toBeGreaterThan(0);
  });

  it('every .mmd in the corpus is actually discovered', () => {
    // `discoverLayoutTestFixtures` SKIPS a fixture whose freshness check throws,
    // so an edited `.mmd` silently shrinks the corpus instead of failing — the
    // aggregate just quietly grades fewer diagrams. Comparing against the
    // directory listing turns that into a red test naming the missing fixture.
    expect(fixtures.length).toBeGreaterThan(0);
    const dir = dirname(fixtures[0].mmdPath);
    const onDisk = readdirSync(dir)
      .filter((file) => file.endsWith('.mmd'))
      .map((file) => file.replace(/\.mmd$/, ''))
      .sort();
    const discovered = fixtures.map((fx) => fx.id.slice(fx.id.lastIndexOf('/') + 1)).sort();
    expect(
      onDisk.filter((id) => !discovered.includes(id)),
      're-capture these — their sizes fixture is stale or missing, so the sweep dropped them'
    ).toEqual([]);
  });

  it('fixtures were captured at the configuration this sweep grades', () => {
    // Asserted here rather than in `discoverLayoutTestFixtures`, which SKIPS a
    // fixture whose freshness check throws — a mismatch would silently shrink
    // the corpus instead of failing. Theme and look change both the measured
    // sizes and the shape outlines (`look: 'neo'` pads differently from
    // `'classic'`), so a capture at another configuration grades something else.
    const wrong = fixtures
      .filter(
        (fx) =>
          fx.sizes.metadata?.theme !== EXPECTED_THEME ||
          fx.sizes.metadata?.look !== EXPECTED_LOOK ||
          (fx.sizes.metadata?.captureVersion ?? 0) < REQUIRED_CAPTURE_VERSION
      )
      .map(
        (fx) =>
          `${fx.id}: theme=${fx.sizes.metadata?.theme} look=${fx.sizes.metadata?.look} ` +
          `captureVersion=${fx.sizes.metadata?.captureVersion}`
      );
    expect(
      wrong,
      `expected theme=${EXPECTED_THEME} look=${EXPECTED_LOOK} captureVersion>=${REQUIRED_CAPTURE_VERSION}`
    ).toEqual([]);
  });

  for (const fx of fixtures) {
    it(`${fx.id} — elk`, { timeout: 60_000 }, async () => {
      const layout = await parseApplySizesAndRunElk(fx.mmdPath, fx.sizes);
      expect(layout.nodes.length).toBeGreaterThan(0);

      if (fx.allowLevel1Failure || KNOWN_INVALID.has(fx.id)) {
        return;
      }
      const result = validateLayout(layout);
      // Hard issues only: soft issues are priced into the score by design, so
      // asserting on their absence would be stricter than "valid layout".
      const hard = result.issues.filter((issue) => !isSoftIssueType(issue.type));
      expect(hard.map((issue) => `${issue.type}: ${issue.message}`)).toEqual([]);
      expect(result.ok, issueSummary(result.issues)).toBe(true);
    });
  }

  it('aggregate validateLayout report — elk', { timeout: 300_000 }, async () => {
    const items: NamedValidateResult[] = [];
    for (const fx of fixtures) {
      const layout = await parseApplySizesAndRunElk(fx.mmdPath, fx.sizes);
      items.push({ id: fx.id, result: validateLayout(layout) });
    }

    const report = combineValidateLayoutResults(items);
    console.log(
      `DDLT-ELK-AGG: total=${report.totalScore.toFixed(1)} avg=${report.avgScore.toFixed(1)} ` +
        `min=${report.minScore.toFixed(1)} invalid=${report.invalidCount}/${report.byCase.length}`
    );
    for (const row of [...report.byCase].sort((a, b) => a.score - b.score)) {
      console.log(
        `DDLT-ELK: ${row.id} score=${row.score.toFixed(1)} valid=${row.valid} ` +
          `issues=${row.issueTypes.join(',') || '-'}`
      );
    }

    expect(report.byCase.length).toBe(fixtures.length);

    const unexpectedInvalid = report.byCase.filter(
      (row) => !KNOWN_INVALID.has(row.id) && !row.valid
    );
    expect(unexpectedInvalid.map((row) => `${row.id}: ${row.issueTypes.join(',')}`)).toEqual([]);

    const repaired = report.byCase.filter((row) => KNOWN_INVALID.has(row.id) && row.valid);
    expect(
      repaired.map((row) => row.id),
      'remove these from KNOWN_INVALID — they now pass'
    ).toEqual([]);
  });
});
