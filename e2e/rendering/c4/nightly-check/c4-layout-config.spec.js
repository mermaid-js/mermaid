import { expect, test } from '@playwright/test';
import { diagramSvg, renderGraph } from '../../../helpers/util.ts';

test.describe('C4 UpdateLayoutConfig', () => {
  // `UpdateLayoutConfig` is a no-op once the layout is dagre's: the pipeline never reads
  // `$c4ShapeInRow`/`$c4BoundaryInRow`, so the same source lays out identically whatever
  // they say. Asserted as an absence rather than left as two snapshots that happened to
  // match, so that implementing the option - or restoring a grid - fails here loudly.
  // The 2 and 4 shapes-per-row renders are fixtures under e2e/diagrams/c4/visual-check/.
  test('does not change the layout (no longer honoured)', async ({ page }, testInfo) => {
    const diagram = (shapesInRow) => `C4Context
title UpdateLayoutConfig ($c4ShapeInRow=${shapesInRow})
System(a, "A")
System(b, "B")
System(c, "C")
System(d, "D")
UpdateLayoutConfig($c4ShapeInRow="${shapesInRow}", $c4BoundaryInRow="1")
      `;

    const positions = () =>
      diagramSvg(page)
        .locator('.node')
        .evaluateAll((nodes) =>
          nodes.map((node) => {
            const { x, y } = node.getBoundingClientRect();
            return `${Math.round(x)},${Math.round(y)}`;
          })
        );

    await renderGraph(page, testInfo, diagram(2), { screenshot: false });
    const atTwo = await positions();
    expect(atTwo.length).toBe(4);

    await renderGraph(page, testInfo, diagram(4), { screenshot: false });
    expect(await positions()).toEqual(atTwo);
  });
});
