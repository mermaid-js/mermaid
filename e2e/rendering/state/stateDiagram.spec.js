import { test, expect } from '@playwright/test';
import { renderGraph } from '../../helpers/util.ts';

test.describe('State diagram', () => {
  test('should render a state diagram when useMaxWidth is true (default)', async ({
    page,
  }, testInfo) => {
    await renderGraph(
      page,
      testInfo,
      `
    stateDiagram
    [*] --> State1
    State1 --> [*]
      `,
      { state: { useMaxWidth: true } }
    );
    const svg = page.locator('svg');
    await expect(svg).toHaveAttribute('width', '100%');
    const style = await svg.getAttribute('style');
    expect(style).toMatch(/^max-width: [\d.]+px;$/);
    const maxWidthValue = parseFloat(style.match(/[\d.]+/g).join(''));
    expect(maxWidthValue).toBeGreaterThanOrEqual(65);
    expect(maxWidthValue).toBeLessThanOrEqual(85);
  });
  test('should render a state diagram when useMaxWidth is false', async ({ page }, testInfo) => {
    await renderGraph(
      page,
      testInfo,
      `
    stateDiagram
    [*] --> State1
    State1 --> [*]
      `,
      { state: { useMaxWidth: false } }
    );
    const svg = page.locator('svg');
    const width = parseFloat((await svg.getAttribute('width')) ?? '0');
    expect(width).toBeGreaterThanOrEqual(65);
    expect(width).toBeLessThanOrEqual(85);
    await expect(svg).not.toHaveAttribute('style');
  });
});
