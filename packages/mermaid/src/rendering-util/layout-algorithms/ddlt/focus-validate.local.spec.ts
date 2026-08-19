/*
 * LOCAL DIFFERENTIAL CHECK for `validateLayout({ focusEdgeIds })` — not part of
 * the graded suite, never committed.
 *
 * `remediateFlaggedEdgesWhenMonotone` judges a candidate route from this edge's
 * issues alone. That is only sound if, for any change to ONE edge, the focused
 * view moves exactly the way the full validation does:
 *
 *   full.after - full.before        ==  focus.after - focus.before      (counts)
 *   keys(full.after) \ keys(full.before) == keys(focus.after) \ keys(focus.before)
 *
 * This drives real single-edge mutations through both and asserts both identities.
 *
 *   DOMUS_DIFF=1 pnpm exec vitest run \
 *     packages/mermaid/src/rendering-util/layout-algorithms/ddlt/focus-validate.local.spec.ts
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { addDiagrams } from '../../../diagram-api/diagram-orchestration.js';
import { setLogLevel } from '../../../logger.js';
import type { Issue } from '../layout-utils/validateLayout.js';
import { validateLayout } from '../domus/validateLayoutProxy.js';
import {
  applyFixtureContentSizesStrict,
  applyFixtureLabelSizesStrict,
  discoverLayoutTestFixtures,
  injectDomusEdgeLabelNodes,
  parseMmdFileToLayoutData,
  runDomusOrthogonalDdlt,
} from './index.js';

const SKIP = new Set(
  process.env.DOMUS_DIFF_ALL
    ? []
    : [
        // Slowest fixtures; the property is structural, not fixture-specific.
        'domus/architecture',
        'domus/mermaid-chart-architecture',
        'domus/architecture5-components',
        'domus/architecture4',
      ]
);

function keys(issues: readonly Issue[]): string[] {
  return issues
    .map((i) => `${i.type}|${i.edgeId ?? ''}|${(i.nodeIds ?? []).join(',')}|${i.message}`)
    .sort();
}

function multisetDiff(after: string[], before: string[]): string[] {
  const counts = new Map<string, number>();
  for (const k of before) {
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const out: string[] = [];
  for (const k of after) {
    const n = counts.get(k) ?? 0;
    if (n > 0) {
      counts.set(k, n - 1);
    } else {
      out.push(k);
    }
  }
  return out.sort();
}

describe.runIf(process.env.DOMUS_DIFF)('focused validateLayout matches full validation', () => {
  beforeAll(() => {
    setLogLevel('fatal');
    addDiagrams();
  });

  const fixtures = discoverLayoutTestFixtures().filter(
    (f) => f.profile !== 'swimlanes' && !SKIP.has(f.id)
  );

  for (const fx of fixtures) {
    it(`${fx.id}`, { timeout: 300_000 }, async () => {
      const layout = await parseMmdFileToLayoutData(fx.mmdPath, {
        stampFlowchartRendererFields: true,
      });
      applyFixtureContentSizesStrict(layout, fx.sizes);
      injectDomusEdgeLabelNodes(layout);
      applyFixtureLabelSizesStrict(layout, fx.sizes);
      await runDomusOrthogonalDdlt(layout);

      const edges = (layout.edges ?? []) as {
        id?: string;
        points?: { x: number; y: number }[];
        x?: number;
        y?: number;
      }[];
      let checked = 0;

      for (const e of edges) {
        const id = e?.id != null ? String(e.id) : '';
        const pts = e.points;
        if (!id || !Array.isArray(pts) || pts.length < 2) {
          continue;
        }
        const focusEdgeIds = new Set([id]);
        const fullBefore = keys(validateLayout(layout).issues);
        const focusBefore = keys(validateLayout(layout, { focusEdgeIds }).issues);

        // Mutations in the spirit of the candidates the pass actually tries:
        // a straight two-point route, an offset variant, and a detour.
        const a = pts[0];
        const b = pts[pts.length - 1];
        const variants: { x: number; y: number }[][] = [
          [{ ...a }, { x: b.x, y: a.y }, { ...b }],
          [{ ...a }, { x: a.x, y: b.y }, { ...b }],
          pts.map((p, i) =>
            i === 0 || i === pts.length - 1 ? { ...p } : { x: p.x + 37, y: p.y - 23 }
          ),
        ];
        const oldPts = e.points;
        const oldX = e.x;
        const oldY = e.y;
        for (const variant of variants) {
          e.points = variant;
          if (Number.isFinite(oldX) && Number.isFinite(oldY)) {
            e.x = (variant[0].x + variant[variant.length - 1].x) / 2;
            e.y = (variant[0].y + variant[variant.length - 1].y) / 2;
          }
          const fullAfter = keys(validateLayout(layout).issues);
          const focusAfter = keys(validateLayout(layout, { focusEdgeIds }).issues);

          if (fullAfter.length - fullBefore.length !== focusAfter.length - focusBefore.length) {
            const fullNew = multisetDiff(fullAfter, fullBefore);
            const focusNew = multisetDiff(focusAfter, focusBefore);
            console.log(`DIFF-DEBUG ${fx.id} ${id}`);
            for (const k of multisetDiff(focusNew, fullNew)) {
              console.log(`  ONLY-IN-FOCUS ${k}`);
            }
            for (const k of multisetDiff(fullNew, focusNew)) {
              console.log(`  ONLY-IN-FULL  ${k}`);
            }
            for (const k of multisetDiff(fullBefore, focusBefore).slice(0, 3)) {
              console.log(`  BEFORE-ONLY-IN-FULL ${k}`);
            }
          }
          expect(fullAfter.length - fullBefore.length, `${fx.id} ${id}: count delta mismatch`).toBe(
            focusAfter.length - focusBefore.length
          );
          expect(
            multisetDiff(fullAfter, fullBefore),
            `${fx.id} ${id}: new-issue set mismatch`
          ).toEqual(multisetDiff(focusAfter, focusBefore));
          checked++;
        }
        e.points = oldPts;
        e.x = oldX;
        e.y = oldY;
      }
      console.log(`DOMUS-DIFF ${fx.id}: ${checked} single-edge mutations verified`);
      expect(checked).toBeGreaterThan(0);
    });
  }
});
