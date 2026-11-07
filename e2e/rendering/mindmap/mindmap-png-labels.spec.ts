import { test, expect } from '@playwright/test';
import { renderGraph } from '../../helpers/util.ts';

for (const theme of ['default', 'dark', 'forest', 'neutral', 'base'] as const) {
  for (const look of ['classic', 'neo'] as const) {
    test(`${theme}/${look}: PNG contains each mindmap label independently of the host`, async ({
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

      const result = await page.evaluate(
        async ({ theme }) => {
          const svg = document.querySelector('svg[aria-roledescription]')!;
          const vb = svg.getAttribute('viewBox')!.split(/[ ,]+/).map(Number);
          const width = Math.ceil(vb[2]);
          const height = Math.ceil(vb[3]);
          const bg = theme === 'dark' ? '#333333' : '#ffffff';
          /**
           * Rasterize a standalone copy of the SVG, optionally hiding one label.
           *
           * @param hidden - Index of the label to hide, or null to keep all labels.
           * @returns The canvas pixels and encoded PNG.
           */
          async function raster(hidden: number | null) {
            const clone = svg.cloneNode(true) as SVGElement;
            clone.setAttribute('width', String(width));
            clone.setAttribute('height', String(height));
            const labels = clone.querySelectorAll<HTMLElement>(
              '.mindmap-node foreignObject span.nodeLabel'
            );
            if (labels.length !== 6) throw new Error(`Expected 6 labels, got ${labels.length}`);
            if (hidden !== null) labels[hidden].style.visibility = 'hidden';
            const xml = new XMLSerializer().serializeToString(clone);
            const img = new Image();
            img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`;
            await img.decode();
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d')!;
            ctx.fillStyle = bg;
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
            return {
              pixels: ctx.getImageData(0, 0, width, height).data,
              png: canvas.toDataURL('image/png'),
            };
          }
          document.body.style.color = 'rgb(255, 0, 0)';
          const red = await raster(null);
          document.body.style.color = 'rgb(0, 0, 255)';
          const blue = await raster(null);
          /**
           * Count pixels whose RGBA channels differ between equal-sized exports.
           *
           * @param a - The first export's pixel data.
           * @param b - The second export's pixel data.
           * @returns The number of changed pixels.
           */
          function diff(a: Uint8ClampedArray, b: Uint8ClampedArray) {
            let count = 0;
            for (let i = 0; i < a.length; i += 4)
              if (
                a[i] !== b[i] ||
                a[i + 1] !== b[i + 1] ||
                a[i + 2] !== b[i + 2] ||
                a[i + 3] !== b[i + 3]
              )
                count++;
            return count;
          }
          const hiddenDiffs: number[] = [];
          for (let i = 0; i < 6; i++) hiddenDiffs.push(diff(blue.pixels, (await raster(i)).pixels));
          return { hostDiff: diff(red.pixels, blue.pixels), hiddenDiffs, png: blue.png };
        },
        { theme }
      );

      expect(result.hostDiff).toBe(0);
      for (const changedPixels of result.hiddenDiffs) expect(changedPixels).toBeGreaterThan(0);
      if (theme === 'dark' && look === 'classic') {
        await testInfo.attach('mindmap-dark.png', {
          body: Buffer.from(result.png.split(',')[1], 'base64'),
          contentType: 'image/png',
        });
      }
    });
  }
}
