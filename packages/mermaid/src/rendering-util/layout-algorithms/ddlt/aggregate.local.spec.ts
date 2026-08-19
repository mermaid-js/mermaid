/*
 * LOCAL AGGREGATE RULER — not part of the graded suite, never committed.
 *
 * Reproduces `layout-fixtures.ddlt.spec.ts`'s aggregate `it` exactly (same
 * fixtures, same backends, same `validateLayout` + DOMUS extensions, same
 * `combineValidateLayoutResults`, same exemption list and swimlanes floor) but at
 * log level `fatal` and printing one line per fixture through `console.log`.
 *
 * Why: with ORTHO_TEST_DEBUG=1 the real sweep emits ~120 MB of debug output and
 * dies with `FATAL ERROR: invalid table size Allocation failed` before it can
 * print the aggregate — reliably on the slower pre-change tree, which is exactly
 * the tree a perf baseline has to measure. `--max-old-space-size=12288` does not
 * help. This runner produces the same numbers without the flood.
 *
 *   DOMUS_AGG=1 pnpm exec vitest run \
 *     packages/mermaid/src/rendering-util/layout-algorithms/ddlt/aggregate.local.spec.ts \
 *     2>&1 | grep AGG-
 */
import { describe, it, beforeAll } from 'vitest';
import { addDiagrams } from '../../../diagram-api/diagram-orchestration.js';
import { setLogLevel } from '../../../logger.js';
import { validateLayout, type ValidateLayoutResult } from '../layout-utils/validateLayout.js';
import { DOMUS_VALIDATION_EXTENSIONS } from '../domus/validateLayoutProxy.js';
import {
  backendsForProfile,
  combineValidateLayoutResults,
  discoverLayoutTestFixtures,
  parseApplySizesAndLayout,
  type NamedValidateResult,
} from './index.js';

function validateForBackend(layout: Parameters<typeof validateLayout>[0], backendId: string) {
  return backendId === 'domus-orthogonal'
    ? validateLayout(layout, { extensions: DOMUS_VALIDATION_EXTENSIONS })
    : validateLayout(layout);
}

describe.runIf(process.env.DOMUS_AGG)('DDLT aggregate (local runner)', () => {
  beforeAll(() => {
    setLogLevel('fatal');
    addDiagrams();
  });

  it('aggregate validateLayout report across all fixtures', { timeout: 3_600_000 }, async () => {
    const only = process.env.DOMUS_AGG_ONLY;
    const fixtures = discoverLayoutTestFixtures().filter((f) => !only || f.id.includes(only));
    const items: NamedValidateResult[] = [];
    const exemptIds = new Set<string>();
    for (const fx of fixtures) {
      if (fx.allowLevel1Failure) {
        exemptIds.add(fx.id);
      }
      for (const backendId of backendsForProfile(fx.profile)) {
        let result: ValidateLayoutResult;
        const t0 = performance.now();
        try {
          const layout = await parseApplySizesAndLayout(fx.mmdPath, fx.sizes, backendId);
          result = validateForBackend(layout, backendId);
        } catch (err) {
          console.log(`AGG-ERR ${fx.id} — ${backendId}: ${(err as Error).message}`);
          result = {
            ok: false,
            issues: [{ type: 'edge-missing-points', message: `backend error` }],
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
        const ms = performance.now() - t0;
        items.push({ id: `${fx.id} — ${backendId}`, result });
        console.log(
          `AGG-ROW ${fx.id} — ${backendId} score=${result.score} valid=${result.ok} ms=${ms.toFixed(0)} issues=${[...new Set(result.issues.map((i) => i.type))].sort().join(',') || '-'}`
        );
      }
    }

    const report = combineValidateLayoutResults(items);
    const nonExemptInvalid = report.byCase.filter(
      (row) => !exemptIds.has(row.id.split(' — ')[0]) && !row.valid
    );
    const swimlanesItems = items.filter((item) => item.id.startsWith('swimlanes/'));
    const swimlanesTotal =
      swimlanesItems.length > 0 ? combineValidateLayoutResults(swimlanesItems).totalScore : 0;
    const domusItems = items.filter((item) => item.id.startsWith('domus/'));
    const domusTotal = combineValidateLayoutResults(domusItems).totalScore;

    console.log(
      `AGG-TOTAL total=${report.totalScore} avg=${report.avgScore.toFixed(1)} invalid=${report.invalidCount} cases=${report.byCase.length} domusTotal=${domusTotal} swimlanesTotal=${swimlanesTotal}`
    );
    console.log(`AGG-NONEXEMPT-INVALID count=${nonExemptInvalid.length}`);
    for (const row of nonExemptInvalid) {
      console.log(`AGG-NONEXEMPT-INVALID ${row.id}: ${row.issueTypes.join(',')}`);
    }
  });
});
