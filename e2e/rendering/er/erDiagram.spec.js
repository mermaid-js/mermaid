import { test, expect } from '@playwright/test';
import { imgSnapshotTest, renderGraph } from '../../helpers/util.ts';

test.describe('Entity Relationship Diagram', () => {
  test('should render multiple ER diagrams', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      [
        `
    erDiagram
        CUSTOMER ||--o{ ORDER : places
        ORDER ||--|{ LINE-ITEM : contains
      `,
        `
    erDiagram
        CUSTOMER ||--o{ ORDER : places
        ORDER ||--|{ LINE-ITEM : contains
      `,
      ],
      { logLevel: 1 }
    );
  });

  test('should render an ER diagrams when useMaxWidth is true (default)', async ({
    page,
  }, testInfo) => {
    await renderGraph(
      page,
      testInfo,
      `
    erDiagram
        CUSTOMER ||--o{ ORDER : places
        ORDER ||--|{ LINE-ITEM : contains
      `,
      { er: { useMaxWidth: true } }
    );
    const svg = page.locator('svg');
    await expect(svg).toHaveAttribute('width', '100%');
    const style = await svg.getAttribute('style');
    expect(style).toMatch(/^max-width: [\d.]+px;$/);
    const maxWidthValue = parseFloat(style.match(/[\d.]+/g).join(''));
    // use within because the absolute value can be slightly different depending on the environment ±10%
    expect(maxWidthValue).toBeGreaterThanOrEqual(140 * 0.9);
    expect(maxWidthValue).toBeLessThanOrEqual(140 * 1.1);
  });

  test('should render an ER when useMaxWidth is false', async ({ page }, testInfo) => {
    await renderGraph(
      page,
      testInfo,
      `
    erDiagram
        CUSTOMER ||--o{ ORDER : places
        ORDER ||--|{ LINE-ITEM : contains
      `,
      { er: { useMaxWidth: false } }
    );
    const svg = page.locator('svg');
    const width = parseFloat((await svg.getAttribute('width')) ?? '0');
    // use within because the absolute value can be slightly different depending on the environment ±10%
    expect(width).toBeGreaterThanOrEqual(140 * 0.9);
    expect(width).toBeLessThanOrEqual(140 * 1.1);
    await expect(svg).not.toHaveAttribute('style');
  });
});
