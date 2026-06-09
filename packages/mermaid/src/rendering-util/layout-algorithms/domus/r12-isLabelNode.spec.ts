// cspell:ignore fdhdfjkfdkjdjd
/**
 * R12 — `config.isLabelNode` never set for the DOMUS browser path.
 *
 * Root cause:
 * - `createGraph.ts:159` gates edge-label dummy-node injection on
 *   `data4Layout.config.isLabelNode`.
 * - `config.schema.yaml` defaults that flag to `false`.
 * - `domus/index.ts:renderPreAdjustLayout` sets `layoutAlgorithm='domus'`
 *   but forgets to set `config.isLabelNode=true`. Consequence: edge-label
 *   dummy nodes are not added to `layout.nodes`, so DOMUS compacts the
 *   flanking primary nodes without reserving space for the edge label's
 *   rendered width.
 * - `finalizeOverlayLabels.ts:32,183` already resets the flag to `false`
 *   after DOMUS — the merge-back half is wired; only the turn-on half is
 *   missing.
 *
 * User-visible symptom: knsv3.html Company-simp — the label
 * "fdhdfjkfdkjdjd" (width 81.72) on the USCompany→HongKongCompany edge
 * overlaps both flanking rectangles because DOMUS left only ~50 px gap
 * between them.
 *
 * Why no DDLT reproduces this today: DDLT specs use
 * `runRP1OrthogonalPipeline` directly, bypassing
 * `createGraphWithElements` and thus bypassing the `isLabelNode` flag
 * check entirely. This spec is source-level on purpose — once the fix
 * lands, a thicker behavioural spec can be added against the full
 * `renderPreAdjustLayout` path (see `company.layout.spec.ts` for the
 * jsdom-measurement pattern).
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('R12 — isLabelNode flag is wired into the DOMUS browser path', () => {
  it('domus/index.ts sets config.isLabelNode=true before EVERY createGraphWithElements call that needs it', () => {
    const src = readFileSync(
      resolve(
        process.cwd(),
        'packages/mermaid/src/rendering-util/layout-algorithms/domus/index.ts'
      ),
      'utf8'
    );

    // The production browser path is `render → measure → layout → paint`.
    // `measure()` calls `createGraphWithElements` with the intent of
    // injecting edge-label dummy nodes; `paint()` calls it with
    // `labelMode: 'overlay'` where labels are overlaid onto edges (dummy
    // nodes already merged). The legacy `renderPreAdjustLayout` is a
    // single-call variant. Both injection-intent call sites must set the
    // flag — the overlay paint call does not.
    //
    // Strategy: find every `createGraphWithElements(...)` call with
    // `labelMode: 'nodes'` and assert the flag is set in the preceding
    // source slice of the enclosing function.
    const flagRe =
      /config(?:\s*as any)?\s*\.\s*isLabelNode\s*=\s*true|config\[["']isLabelNode["']]\s*=\s*true/;

    // Find each call site and scan forward a bounded window for labelMode,
    // bypassing the inner parens problem (e.g. `(measureLayer as any)`).
    const callRe = /createGraphWithElements\s*\(/g;
    let match: RegExpExecArray | null;
    const nodeModeCalls: number[] = [];
    while ((match = callRe.exec(src)) !== null) {
      const window = src.slice(match.index, match.index + 500);
      if (/labelMode:\s*["']nodes["']/.test(window)) {
        nodeModeCalls.push(match.index);
      }
    }
    expect(
      nodeModeCalls.length,
      'expected at least two createGraphWithElements(..., { labelMode: "nodes" }) call sites in domus/index.ts (measure + renderPreAdjustLayout)'
    ).toBeGreaterThanOrEqual(2);

    for (const callIdx of nodeModeCalls) {
      // Look backwards from the call up to ~1200 chars (function body
      // window). This is generous enough to capture the enclosing function's
      // opening brace on realistic sources without sucking in siblings.
      const windowStart = Math.max(0, callIdx - 1200);
      const slice = src.slice(windowStart, callIdx);
      expect(
        flagRe.test(slice),
        `config.isLabelNode=true must be set before createGraphWithElements(..., { labelMode: 'nodes' }) at offset ${callIdx}. Nearby slice: ...${slice.slice(-200)}`
      ).toBe(true);
    }
  });

  it('finalizeOverlayLabels.ts still resets config.isLabelNode=false on exit (safety net)', () => {
    const src = readFileSync(
      resolve(
        process.cwd(),
        'packages/mermaid/src/rendering-util/layout-algorithms/domus/finalizeOverlayLabels.ts'
      ),
      'utf8'
    );
    // Two reset sites existed at baseline. Require at least one.
    const resetRe = /isLabelNode\s*]?\s*=\s*false/;
    expect(resetRe.test(src)).toBe(true);
  });
});
