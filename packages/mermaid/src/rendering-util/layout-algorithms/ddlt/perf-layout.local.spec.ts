/*
 * LOCAL PERF RULER — not part of the graded suite, never committed.
 *
 * Times `domus/index.ts:layout()` (the entry point the browser calls) per DOMUS
 * fixture, with parse + size application excluded. Inert unless DOMUS_PERF is set.
 *
 *   DOMUS_PERF=1 DOMUS_PERF_ONLY=architecture pnpm exec vitest run \
 *     packages/mermaid/src/rendering-util/layout-algorithms/ddlt/perf-layout.local.spec.ts \
 *     2>&1 | grep DOMUS-PERF
 */
import { describe, it, beforeAll } from 'vitest';
import { addDiagrams } from '../../../diagram-api/diagram-orchestration.js';
import { setLogLevel } from '../../../logger.js';
import {
  applyFixtureContentSizesStrict,
  applyFixtureLabelSizesStrict,
  discoverLayoutTestFixtures,
  injectDomusEdgeLabelNodes,
  parseMmdFileToLayoutData,
  runDomusOrthogonalDdlt,
} from './index.js';

const RUNS = Number(process.env.DOMUS_PERF_RUNS ?? 3);
const ONLY = process.env.DOMUS_PERF_ONLY;

describe.runIf(process.env.DOMUS_PERF)('DOMUS layout perf', () => {
  beforeAll(() => {
    setLogLevel('fatal');
    addDiagrams();
  });

  it('times layout() per domus fixture', { timeout: 1_800_000 }, async () => {
    const fixtures = discoverLayoutTestFixtures().filter(
      (f) => f.profile !== 'swimlanes' && (!ONLY || f.id.includes(ONLY))
    );
    const rows: { id: string; min: number; med: number }[] = [];
    for (const fx of fixtures) {
      const times: number[] = [];
      for (let i = 0; i < RUNS; i++) {
        const layout = await parseMmdFileToLayoutData(fx.mmdPath, {
          stampFlowchartRendererFields: true,
        });
        applyFixtureContentSizesStrict(layout, fx.sizes);
        injectDomusEdgeLabelNodes(layout);
        applyFixtureLabelSizesStrict(layout, fx.sizes);
        const t0 = performance.now();
        await runDomusOrthogonalDdlt(layout);
        times.push(performance.now() - t0);
      }
      times.sort((a, b) => a - b);
      rows.push({ id: fx.id, min: times[0], med: times[Math.floor(times.length / 2)] });
    }
    rows.sort((a, b) => b.med - a.med);
    let total = 0;
    for (const r of rows) {
      total += r.med;
      console.log(
        `DOMUS-PERF ${r.med.toFixed(0).padStart(7)} ms med ${r.min.toFixed(0).padStart(7)} ms min  ${r.id}`
      );
    }
    console.log(
      `DOMUS-PERF-TOTAL median-sum ${total.toFixed(0)} ms over ${rows.length} fixtures (runs=${RUNS})`
    );
  });
});
