import { test, expect } from '@playwright/test';
import { renderGraph } from '../../helpers/util.ts';

test.describe('State diagram', () => {
  test('v2 should render click directive tooltips on linked states', async ({ page }, testInfo) => {
    await renderGraph(
      page,
      testInfo,
      `
    stateDiagram-v2
    A: Google
    click A "https://google.com" "Visit Google"
      `,
      { securityLevel: 'loose', screenshot: false }
    );

    await expect(page.locator('svg a')).toHaveCount(1);
    const link = page
      .locator('svg a')
      .filter({ has: page.locator('g.node[title="Visit Google"]') });
    await expect(link).toHaveCount(1);
    await expect(link).toHaveAttribute('xlink:href', 'https://google.com');
  });

  test('v2 should render a state diagram when useMaxWidth is true (default)', async ({
    page,
  }, testInfo) => {
    await renderGraph(
      page,
      testInfo,
      `
    stateDiagram-v2

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
    expect(maxWidthValue).toBeGreaterThanOrEqual(132);
    expect(maxWidthValue).toBeLessThanOrEqual(172);
  });
  test('v2 should render a state diagram when useMaxWidth is false', async ({ page }, testInfo) => {
    await renderGraph(
      page,
      testInfo,
      `
    stateDiagram-v2

    [*] --> State1
    State1 --> [*]
      `,
      { state: { useMaxWidth: false } }
    );
    const svg = page.locator('svg');
    const width = parseFloat((await svg.getAttribute('width')) ?? '0');
    expect(width).toBeGreaterThanOrEqual(132);
    expect(width).toBeLessThanOrEqual(172);
    await expect(svg).not.toHaveAttribute('style');
  });

  for (const { look, nodeSelector } of [
    { look: 'classic', nodeSelector: 'g.node' },
    { look: 'handDrawn', nodeSelector: 'g.rough-node' },
  ]) {
    test(`v2 should render clickable state nodes with a tooltip title for ${look} look`, async ({
      page,
    }, testInfo) => {
      await renderGraph(
        page,
        testInfo,
        `
      stateDiagram-v2
        A: Google
        click A "https://google.com" "Visit Google"
        `,
        { look, securityLevel: 'loose', screenshot: false }
      );

      await page.locator('svg a').evaluateAll((links, nodeSelector) => {
        const clickableLink = links.find(
          (link) => link.getAttribute('xlink:href') === 'https://google.com'
        );
        if (!clickableLink) {
          throw new Error('clickable state link not found');
        }
        if (clickableLink.getAttribute('title') !== 'Visit Google') {
          throw new Error('unexpected link title');
        }
        const stateNode = clickableLink.querySelector(`${nodeSelector}[title="Visit Google"]`);
        if (!stateNode) {
          throw new Error('clickable state node not found');
        }
        if (!stateNode.textContent?.includes('Google')) {
          throw new Error('state node text mismatch');
        }
      }, nodeSelector);
    });
  }
});
