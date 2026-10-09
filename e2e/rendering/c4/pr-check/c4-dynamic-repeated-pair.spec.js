import { expect, test } from '@playwright/test';
import { diagramSvg, renderGraph } from '../../../helpers/util.ts';

// The render is the fixture dynamic-repeated-pair.mmd under
// e2e/diagrams/c4/pr-check/; a fixture cannot assert on the SVG text, so this
// spec renders the same source without a second screenshot and checks it.
test('dynamic-repeated-pair draws and numbers every interaction between one pair', async ({
  page,
}, testInfo) => {
  await renderGraph(
    page,
    testInfo,
    `C4Dynamic
title Repeated interactions between the same pair
System(a, "A")
System(b, "B")
Rel(a, b, "Interaction 1")
Rel(a, b, "Interaction 2")
    `,
    { screenshot: false }
  );

  // Both relationships are placed by the same grid rule and so share a position.
  // This asserts that both are drawn and numbered, not where they sit.
  const svg = diagramSvg(page);
  await expect(svg).toContainText('1: Interaction 1');
  await expect(svg).toContainText('2: Interaction 2');
});
