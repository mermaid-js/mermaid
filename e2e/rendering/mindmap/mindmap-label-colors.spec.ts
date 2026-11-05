import { test, expect } from '@playwright/test';
import { renderGraph } from '../../helpers/util.ts';

for (const theme of ['default', 'dark', 'forest', 'neutral', 'base'] as const) {
  for (const look of ['classic', 'neo'] as const) {
    test(`${theme}/${look}: mindmap label colors survive host color and standalone SVG`, async ({
      page,
    }, testInfo) => {
      await renderGraph(
        page,
        testInfo,
        `mindmap
  root((CV-000-ai-assistant))
    image
    docs
      (Отчёт о настройке Ai агента)
      (Инструкция по использованию CV Assistant)
      (Инструкция по использованию файлов)`,
        { screenshot: false, theme, look }
      );

      const labels = page.locator('svg .mindmap-node foreignObject span.nodeLabel');
      await expect(labels).toHaveCount(6);
      const colors = () => labels.evaluateAll((els) => els.map((el) => getComputedStyle(el).color));
      await page.evaluate(() => {
        document.body.style.color = 'rgb(255, 0, 0)';
      });
      const redHost = await colors();
      await page.evaluate(() => {
        document.body.style.color = 'rgb(0, 0, 255)';
      });
      const blueHost = await colors();
      expect(blueHost).toEqual(redHost);

      const svg = await page
        .locator('svg[aria-roledescription]')
        .first()
        .evaluate((el) => new XMLSerializer().serializeToString(el));
      await page.goto(`data:image/svg+xml,${encodeURIComponent(svg)}`);
      const exported = page.locator('.mindmap-node foreignObject span.nodeLabel');
      await expect(exported).toHaveCount(6);
      const exportedColors = await exported.evaluateAll((els) =>
        els.map((el) => getComputedStyle(el).color)
      );
      expect(exportedColors).toEqual(blueHost);
    });
  }
}
