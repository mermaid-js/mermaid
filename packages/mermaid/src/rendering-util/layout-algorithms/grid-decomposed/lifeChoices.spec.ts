/**
 * The crossing reported on `life-choices.mmd`: the edge from "Happy co-workers"
 * (`nr`) to the better-work-environment node (`nh`) ran down a column straight
 * across the edge from "Risk for stress decreases" (`n5`) to "Happy life" (`ne`),
 * which ran along the row between them.
 *
 * It was the drawing's only crossing, and plain grid-like on the same graph has
 * none — the layout introduced it. Cause: laying a cyclic core out without the flow
 * ordering frees ACA to align on both axes, and the paper's candidate filter
 * rejects only coincident edges (§12), not crossings, so two of those extra
 * alignments produced one. See `drawCyclicPart` in `layoutCore.ts`.
 *
 * Driven through the real parser and the browser-captured sizes, so what is
 * asserted here is what the browser draws.
 */

import { beforeAll, describe, expect, it } from 'vitest';
import { addDiagrams } from '../../../diagram-api/diagram-orchestration.js';
import type { LayoutData } from '../../types.js';
import { applyFixtureContentSizesStrict, loadSizesFixture } from '../ddlt/fixtureSizes.js';
import { parseMmdFileToLayoutData } from '../ddlt/parseToLayoutData.js';
import { runGridDecomposedLayoutCore } from './layoutCore.js';
import { countEdgeCrossings, countEdgesThroughForeignNodes } from './partQuality.js';

const FIXTURE_DIR = 'cypress/platform/dev-diagrams/layout-tests/hola-faithful';
const FIXTURE = 'life-choices';

async function layoutLifeChoices(): Promise<LayoutData> {
  const layout = await parseMmdFileToLayoutData(`${FIXTURE_DIR}/${FIXTURE}.mmd`, {
    stampFlowchartRendererFields: true,
  });
  applyFixtureContentSizesStrict(layout, loadSizesFixture(`${FIXTURE_DIR}/${FIXTURE}.sizes.json`));
  runGridDecomposedLayoutCore(layout);

  return layout;
}

describe('grid-decomposed on life-choices', () => {
  beforeAll(() => {
    addDiagrams();
  });

  it('draws the whole diagram without a single crossing', async () => {
    const layout = await layoutLifeChoices();

    expect(countEdgeCrossings(layout)).toBe(0);
    expect(countEdgesThroughForeignNodes(layout)).toBe(0);
  });

  it('keeps the reported pair of edges apart', async () => {
    const layout = await layoutLifeChoices();
    const at = (id: string) => layout.nodes.find((node) => node.id === id)!;

    // `nr → nh` and `n5 → ne`. The bug had `nh` below the `ne`/`n5` row while `nr`
    // sat above it, so the column edge had to cross the row edge to get there.
    const [nr, nh, ne, n5] = ['nr', 'nh', 'ne', 'n5'].map(at);
    const rowY = (ne.y! + n5.y!) / 2;
    const straddlesRow = nr.y! < rowY !== nh.y! < rowY;
    const columnBetween =
      nr.x! > Math.min(ne.x!, n5.x!) - 1e-6 && nr.x! < Math.max(ne.x!, n5.x!) + 1e-6;

    expect(
      straddlesRow && columnBetween,
      'nr→nh should not span the ne/n5 row from inside its span'
    ).toBe(false);
  });

  it('peels the tree hanging off the question node and duplicates its root', async () => {
    const layout = await layoutLifeChoices();
    const result = runGridDecomposedLayoutCore(layout);

    // Re-running is a no-op, so the parts reported here are the drawn ones.
    expect(result.parts.map((part) => part.kind).sort()).toEqual(['core', 'tree']);
    expect(result.parts.find((part) => part.kind === 'tree')!.rootCopyOf).toBe('B');
    expect(result.droppedEdgeIds).toEqual([]);
  });
});
