import { expect, test } from '@playwright/test';
import { diagramSvg, renderGraph } from '../../../helpers/util.ts';

// The same sources are shown as fixtures under e2e/diagrams/c4/, so these tests render
// without a screenshot and only assert on the anchor a fixture cannot check.
test.describe('C4 $link', () => {
  test('should render $link on an element as a hyperlink', async ({ page }, testInfo) => {
    await renderGraph(
      page,
      testInfo,
      `C4Context
title Link attribute
Person(p, "Person", "desc", $link="https://example.com")
System(s, "System", "desc")
Rel(p, s, "Uses")
      `,
      { screenshot: false }
    );

    // The unified renderer wraps a linked node in an `svg:a`; it sets only
    // `xlink:href`, and no `target` unless one was asked for. The URL is normalised
    // by the same sanitizer a flowchart `click ... href` goes through.
    const link = diagramSvg(page).locator('g.nodes a');
    await expect(link).toHaveAttribute('xlink:href', 'https://example.com/');
    await expect(link).not.toHaveAttribute('target');
  });

  test('should not carry a javascript: $link into the href', async ({ page }, testInfo) => {
    await renderGraph(
      page,
      testInfo,
      `C4Context
title Link attribute with an unsafe scheme
Person(p, "Person", "desc", $link="javascript:alert(1)")
System(s, "System", "desc")
Rel(p, s, "Uses")
      `,
      { screenshot: false }
    );

    const link = diagramSvg(page).locator('g.nodes a');
    await expect(link).not.toHaveAttribute('xlink:href', /^javascript:/);
  });
});
