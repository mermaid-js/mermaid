// cspell:ignore fdhdfjkfdkjdjd
/**
 * R12 — `config.isLabelNode` must be set for the DOMUS measurement graph so
 * `createGraphWithElements` injects edge-label dummy vertices before layout.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('R12 — isLabelNode flag is wired into the DOMUS browser path', () => {
  it('domus/index.ts sets config.isLabelNode=true before createGraphWithElements in measure() and renderPreAdjustLayout()', () => {
    const src = readFileSync(
      resolve(
        process.cwd(),
        'packages/mermaid/src/rendering-util/layout-algorithms/domus/index.ts'
      ),
      'utf8'
    );

    // Matches `(data4Layout as any).config.isLabelNode = true` and `config.isLabelNode = true`.
    const flagRe =
      /\([^)]*\)\s*\.\s*config\.isLabelNode\s*=\s*true|config(?:\s*as any)?\s*\.\s*isLabelNode\s*=\s*true|config\[["']isLabelNode["']]\s*=\s*true/;

    const measureIdx = src.indexOf('export async function measure');
    expect(measureIdx, 'measure() must exist').toBeGreaterThanOrEqual(0);
    const createInMeasure = src.indexOf(
      'await createGraphWithElements(element, data4Layout)',
      measureIdx
    );
    expect(createInMeasure, 'measure() must call createGraphWithElements').toBeGreaterThan(0);
    const measureFlagSlice = src.slice(measureIdx, createInMeasure);
    expect(
      flagRe.test(measureFlagSlice),
      'config.isLabelNode=true must appear before createGraphWithElements in measure()'
    ).toBe(true);

    const preIdx = src.indexOf('export async function renderPreAdjustLayout');
    expect(preIdx, 'renderPreAdjustLayout() must exist').toBeGreaterThanOrEqual(0);
    const createInPre = src.indexOf('await createGraphWithElements(element, data4Layout)', preIdx);
    expect(createInPre, 'renderPreAdjustLayout must call createGraphWithElements').toBeGreaterThan(
      0
    );
    const preFlagSlice = src.slice(preIdx, createInPre);
    expect(
      flagRe.test(preFlagSlice),
      'config.isLabelNode=true must appear before createGraphWithElements in renderPreAdjustLayout()'
    ).toBe(true);
  });

  it('paint() does NOT call createGraphWithElements (single-DOM contract)', () => {
    const src = readFileSync(
      resolve(
        process.cwd(),
        'packages/mermaid/src/rendering-util/layout-algorithms/domus/index.ts'
      ),
      'utf8'
    );

    const paintIdx = src.indexOf('export async function paint');
    expect(paintIdx, 'paint() must exist').toBeGreaterThanOrEqual(0);

    const renderIdx = src.indexOf('export async function render', paintIdx);
    const paintBodyEnd = renderIdx > 0 ? renderIdx : src.length;
    const paintBody = src.slice(paintIdx, paintBodyEnd);

    expect(
      paintBody.includes('createGraphWithElements'),
      'paint() must reuse the DOM created in measure() — no second createGraphWithElements call'
    ).toBe(false);
    for (const clearer of ['clearNodes(', 'clearEdges(', 'clearClusters(', 'clearGraphlib(']) {
      expect(
        paintBody.includes(clearer),
        `paint() must not call ${clearer} — clears live in measure()`
      ).toBe(false);
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
    expect(src).toMatch(/isLabelNode\s*=\s*false/);
  });
});
