import { test, expect, type Page } from '@playwright/test';
import { renderGraph } from '../../helpers/util.ts';

/**
 * The venn fixtures under `e2e/diagrams/venn` give Argos its coverage of the colours.
 * These assert the thing a screenshot cannot state: that the circles are painted from the
 * theme palette and differ from each other, rather than all landing on the single
 * `primaryColor` fallback the renderer uses when a theme defines no `venn*` variables.
 */
const threeSets = `venn-beta
  title Innovation
  set Desirable
  set Feasible
  set Viable
  union Desirable,Feasible,Viable["Innovation"]
`;

const circleFills = (page: Page) =>
  page
    .locator('.venn-circle path')
    .evaluateAll((paths) => paths.map((path) => getComputedStyle(path).fill));

test.describe('Venn - redux colour themes', () => {
  for (const theme of ['redux-color', 'redux-dark-color'] as const) {
    test(`paints each set its own colour under ${theme}`, async ({ page }, testInfo) => {
      await renderGraph(page, testInfo, threeSets, {
        screenshot: false,
        logLevel: 0,
        name: `venn-${theme}`,
        theme,
      });

      const fills = await circleFills(page);
      expect(fills).toHaveLength(3);
      expect(new Set(fills).size).toBe(3);
      expect(fills.filter((fill) => fill === 'none' || fill === '')).toEqual([]);
    });
  }

  test('keeps an explicit set style ahead of the palette', async ({ page }, testInfo) => {
    await renderGraph(
      page,
      testInfo,
      `venn-beta
        set A
        set B
        union A, B
        style A fill:#00ff00
      `,
      { screenshot: false, logLevel: 0, name: 'venn-user-style', theme: 'redux-color' }
    );

    const fills = await circleFills(page);
    expect(fills).toContain('rgb(0, 255, 0)');
  });
});
