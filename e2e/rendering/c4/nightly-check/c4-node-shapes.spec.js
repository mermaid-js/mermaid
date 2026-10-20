import { expect, test } from '@playwright/test';
import { diagramSvg, renderGraph } from '../../../helpers/util.ts';

// The renders themselves are the fixtures update-element-shape-override.mmd and
// sprite-attribute-not-rendered.mmd under e2e/diagrams/c4/nightly-check/; this
// spec renders the same sources without a second screenshot and asserts per node.
test.describe('C4 node shapes', () => {
  test('update-element-shape-override gives each element its own shape', async ({
    page,
  }, testInfo) => {
    await renderGraph(
      page,
      testInfo,
      `C4Container
title UpdateElementStyle shape override (folder not yet supported)
Container(a, "Default", "Tech", "no override")
Container(b, "As Folder", "Tech", "shape override")
Container(c, "As Cylinder", "Tech", "shape override")
UpdateElementStyle(b, $shape="folder")
UpdateElementStyle(c, $shape="cylinder")
      `,
      { screenshot: false }
    );

    const svg = diagramSvg(page);
    const node = (label) => svg.locator('.node').filter({ hasText: label });
    await expect(node('As Cylinder').locator('path')).toHaveCount(1);
    await expect(node('As Cylinder').locator('> rect')).toHaveCount(0);
    await expect(node('As Folder').locator('path')).toHaveCount(0);
    await expect(node('As Folder').locator('> rect')).toHaveCount(1);
    await expect(node('Default').locator('> rect')).toHaveCount(1);
  });

  test('sprite-attribute-not-rendered draws no sprite on either container', async ({
    page,
  }, testInfo) => {
    await renderGraph(
      page,
      testInfo,
      `C4Container
title Sprite attribute (not shown by current renderer)
Container(a, "Browser", "Tech", "single-page app", $sprite="browser")
Container(b, "Terminal", "Tech", "server-side app", $sprite="terminal")
      `,
      { screenshot: false }
    );

    const svg = diagramSvg(page);
    const node = (label) => svg.locator('.node').filter({ hasText: label });
    await expect(svg.locator('image')).toHaveCount(0);
    await expect(svg.locator('svg')).toHaveCount(0);
    await expect(node('Browser').locator('> rect')).toHaveCount(1);
    await expect(node('Browser').locator('path')).toHaveCount(0);
    await expect(node('Terminal').locator('> rect')).toHaveCount(1);
    await expect(node('Terminal').locator('path')).toHaveCount(0);
  });
});
