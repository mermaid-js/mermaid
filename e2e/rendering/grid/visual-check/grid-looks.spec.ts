import { test } from '@playwright/test';
import { renderGraph } from '../../../helpers/util.ts';
import { assertFiniteEdgePaths, assertFiniteViewBox } from '../../../helpers/grid-assertions.ts';

test.describe('grid layout rendering', () => {
  for (const look of ['classic', 'handDrawn', 'neo'] as const) {
    test(`grid renders with the ${look} look`, async ({ page }, testInfo) => {
      await renderGraph(
        page,
        testInfo,
        `---
config:
  layout: grid
  theme: forest
  grid:
    columns: 1
---
flowchart TB
  A --> B
  B --> C`,
        { look, screenshot: true, name: `grid-look-${look}` }
      );
      await assertFiniteViewBox(page);
      await assertFiniteEdgePaths(page);
    });
  }
});
