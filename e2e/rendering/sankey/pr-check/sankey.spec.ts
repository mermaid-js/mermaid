import { expect, test } from '@playwright/test';
import sharp from 'sharp';
import { renderGraph } from '../../../helpers/util';

for (const linkColor of ['gradient', 'source', 'target', '#00ff00'] as const) {
  for (const surface of ['page', 'svg'] as const) {
    test(`keeps ${linkColor} links visible over the ${surface} background`, async ({
      page,
    }, testInfo) => {
      await renderGraph(page, testInfo, 'sankey\nA,B,10', {
        theme: 'base',
        sankey: {
          width: 300,
          height: 160,
          showValues: false,
          nodeColors: { A: '#ff0000', B: '#ff0000' },
          linkColor,
        },
        screenshot: false,
      });

      const midpoint = await page.locator('.link path').evaluate((element) => {
        const path = element as SVGPathElement;
        const matrix = path.getScreenCTM();
        if (!matrix) {
          throw new Error('The Sankey link is not attached to an SVG viewport');
        }
        const point = path.getPointAtLength(path.getTotalLength() / 2).matrixTransform(matrix);
        return { x: point.x, y: point.y };
      });
      const ink = linkColor === '#00ff00' ? [0, 255, 0] : [255, 0, 0];

      // Measure the actual pixels: a correct stroke colour or computed blend mode
      // alone does not prove that the flow is visible against its backdrop.
      for (const background of [0, 51, 255]) {
        await page.locator('svg[aria-roledescription]').evaluate(
          (element, { background, surface }) => {
            const color = `rgb(${background}, ${background}, ${background})`;
            document.body.style.backgroundColor = color;
            (element as SVGSVGElement).style.backgroundColor =
              surface === 'svg' ? color : 'transparent';
          },
          { background, surface }
        );
        const screenshot = await page.screenshot({
          clip: { x: Math.floor(midpoint.x), y: Math.floor(midpoint.y), width: 1, height: 1 },
        });
        const { channels } = await sharp(screenshot).stats();
        for (let channel = 0; channel < 3; channel++) {
          const expected = (ink[channel] + background) / 2;
          expect(Math.abs(channels[channel].mean - expected)).toBeLessThanOrEqual(2);
        }
      }
    });
  }
}

test('preserves dark label ink where links overlap labels on a white background', async ({
  page,
}, testInfo) => {
  await renderGraph(page, testInfo, 'sankey\nSourceLabel,TargetLabel,10', {
    theme: 'base',
    themeVariables: { textColor: '#000000' },
    sankey: { width: 300, height: 160, showValues: false, linkColor: '#ff0000' },
    screenshot: false,
  });
  await page.evaluate(() => {
    document.body.style.backgroundColor = '#ffffff';
  });
  const label = page.locator('.node-labels text').filter({ hasText: 'SourceLabel' });
  const clip = await label.evaluate((element) => {
    const { x, y, width, height } = element.getBoundingClientRect();
    return { x, y, width, height };
  });
  const { channels } = await sharp(await page.screenshot({ clip })).stats();
  // Isolating only the links would paint half-opacity red over the label,
  // turning even its darkest glyph pixels red instead of retaining black ink.
  expect(channels[0].min).toBeLessThan(20);
});
