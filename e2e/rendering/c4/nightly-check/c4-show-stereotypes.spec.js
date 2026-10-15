import { expect, test } from '@playwright/test';
import { diagramSvg, renderGraph } from '../../../helpers/util.ts';

// The same sources are shown as fixtures under e2e/diagrams/c4/nightly-check/, so these
// tests render without a screenshot and only assert the text a fixture cannot check.
test.describe('C4 showStereotypes', () => {
  test('should hide every stereotype when turned off', async ({ page }, testInfo) => {
    await renderGraph(
      page,
      testInfo,
      `C4Context
title Stereotypes hidden
Enterprise_Boundary(b1, "Bank") {
Person(p, "Person", "desc")
System(s, "System", "desc")
}
Rel(p, s, "Uses")
      `,
      { c4: { showStereotypes: false }, screenshot: false }
    );

    const svg = diagramSvg(page);
    await expect(svg).not.toContainText('[Person]');
    await expect(svg).not.toContainText('[Software System]');
    await expect(svg).not.toContainText('[ENTERPRISE]');
    // The names and descriptions still lay out; only the type line goes.
    await expect(svg).toContainText('Person');
    await expect(svg).toContainText('desc');
  });

  test('should let one element opt out', async ({ page }, testInfo) => {
    await renderGraph(
      page,
      testInfo,
      `C4Context
title One element opts out of its stereotype
System(a, "Shown", "desc")
System(b, "Hidden", "desc")
UpdateElementStyle(b, $showStereotype="false")
      `,
      { screenshot: false }
    );

    const svg = diagramSvg(page);
    await expect(svg.locator('.c4-shape .c4-type')).toHaveCount(1);
    await expect(svg).toContainText('[Software System]');
  });
});
