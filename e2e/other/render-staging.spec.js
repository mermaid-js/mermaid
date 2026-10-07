import { expect, test } from '@playwright/test';

const setup = async (page, securityLevel, suppressErrorRendering = false) => {
  await page.goto('/empty.html');
  await page.evaluate(
    async ({ securityLevel, suppressErrorRendering }) => {
      const { default: mermaid } = await import('/mermaid.esm.mjs');
      window.mermaid = mermaid;
      document.body.style.cssText =
        'margin:0;display:flex;flex-direction:column;height:100vh;overflow:hidden';
      document.body.innerHTML =
        '<main id="host" style="flex:1;min-height:0;background:#dceaff">Host application</main>';
      mermaid.initialize({ startOnLoad: false, securityLevel, suppressErrorRendering });
      window.drawStarted = new Promise((resolve) => {
        window.onDrawStarted = resolve;
      });
      window.continueDraw = new Promise((resolve) => {
        window.resumeDraw = resolve;
      });
      await mermaid.registerExternalDiagrams([
        {
          id: 'staging-test',
          detector: (text) => text.startsWith('staging-test'),
          loader: () =>
            Promise.resolve({
              id: 'staging-test',
              diagram: {
                db: {},
                parser: { parse: () => true },
                styles: () => '',
                renderer: {
                  draw: async (text, id) => {
                    const doc = document.getElementById(`i${id}`)?.contentDocument ?? document;
                    const svg = doc.getElementById(id);
                    svg.setAttribute('width', '480');
                    svg.setAttribute('height', '180');
                    svg.setAttribute('viewBox', '0 0 480 180');
                    // Explicit visibility must not override the temporary wrapper's hiding.
                    svg.innerHTML +=
                      '<rect width="480" height="180" fill="lime" style="visibility:visible" />';
                    window.onDrawStarted();
                    await window.continueDraw;
                    if (text.includes('fail')) {
                      throw new Error('Test renderer failed');
                    }
                  },
                },
              },
            }),
        },
      ]);
    },
    { securityLevel, suppressErrorRendering }
  );
};

for (const securityLevel of ['strict', 'sandbox']) {
  test.describe(`Temporary render containers (${securityLevel})`, () => {
    for (const hostMotion of ['none', 'transition', 'animation']) {
      test(`does not paint or move the host while rendering with ${hostMotion}`, async ({
        page,
      }) => {
        await setup(page, securityLevel);
        if (hostMotion === 'transition') {
          await page.addStyleTag({
            content: 'div, iframe { transition: opacity 2s linear, visibility 2s linear; }',
          });
        } else if (hostMotion === 'animation') {
          await page.addStyleTag({
            content:
              '@keyframes staging-paint { from, to { opacity:1; visibility:visible; } } div, iframe { animation: staging-paint 2s infinite; }',
          });
        }
        const hostBefore = await page.locator('#host').boundingBox();
        const screenshotBefore = await page.screenshot();

        await page.evaluate(async () => {
          window.renderResult = window.mermaid.render('pending', 'staging-test');
          await window.drawStarted;
          for (let frame = 0; frame < 3; frame++) {
            await new Promise(requestAnimationFrame);
          }
        });

        expect(await page.locator('#host').boundingBox()).toEqual(hostBefore);
        expect(await page.screenshot()).toEqual(screenshotBefore);

        const output = await page.evaluate(async () => {
          window.resumeDraw();
          return (await window.renderResult).svg;
        });
        await expect(page.locator('#dpending, #ipending')).toHaveCount(0);
        await page.locator('#host').evaluate((host, svg) => {
          host.innerHTML = svg;
        }, output);
        const visibleOutput =
          securityLevel === 'sandbox'
            ? page.frameLocator('#host iframe').locator('svg')
            : page.locator('#host svg');
        await expect(visibleOutput).toBeVisible();
        await expect(visibleOutput).toHaveAttribute('viewBox', '0 0 480 180');
      });
    }

    for (const failure of ['parse', 'draw']) {
      for (const suppressErrorRendering of [false, true]) {
        test(`${failure} errors ${suppressErrorRendering ? 'remove' : 'show'} the error diagram`, async ({
          page,
        }) => {
          await setup(page, securityLevel, suppressErrorRendering);
          const error = await page.evaluate(async (failure) => {
            window.resumeDraw();
            try {
              await window.mermaid.render(
                'failure',
                failure === 'parse' ? 'this is not a diagram' : 'staging-test fail'
              );
            } catch (error) {
              return String(error);
            }
          }, failure);
          expect(error).toBeTruthy();
          if (suppressErrorRendering) {
            await expect(page.locator('#dfailure, #ifailure')).toHaveCount(0);
          } else {
            const errorOutput =
              securityLevel === 'sandbox'
                ? page.frameLocator('#ifailure').locator('.error-text').first()
                : page.locator('#dfailure .error-text').first();
            await expect(errorOutput).toBeVisible();
            const wrapper = page.locator(securityLevel === 'sandbox' ? '#ifailure' : '#dfailure');
            await expect(wrapper).not.toHaveCSS('position', 'fixed');
            await expect(wrapper).toHaveCSS('opacity', '1');
          }
        });
      }
    }
  });
}

for (const bodyStyle of [
  '',
  'width:680px;margin:20px auto;',
  'box-sizing:border-box;width:740px;padding:24px;border:4px solid black;margin:20px auto;',
]) {
  for (const securityLevel of ['strict', 'sandbox']) {
    test(`preserves diagram measurements (${securityLevel}, ${bodyStyle || 'default margins'})`, async ({
      page,
    }) => {
      await page.goto('/empty.html');
      const results = await page.evaluate(
        async ({ bodyStyle, securityLevel }) => {
          const { default: mermaid } = await import('/mermaid.esm.mjs');
          document.body.style.cssText = bodyStyle;
          const results = [];
          for (const code of [
            'flowchart TD\n A["A longer HTML label that must stay measurable"] --> B["<b>Rich text</b><br/>Second line"]',
            'gantt\n dateFormat YYYY-MM-DD\n section Work\n First task :a1, 2026-01-01, 4d\n Second task :after a1, 3d',
          ]) {
            mermaid.initialize({ startOnLoad: false, securityLevel, layout: 'elk' });
            const readGeometry = (output) => {
              let html = output;
              if (securityLevel === 'sandbox') {
                const frame = new DOMParser()
                  .parseFromString(output, 'text/html')
                  .querySelector('iframe');
                html = atob(frame.getAttribute('src').split(',')[1]);
              }
              const svg = new DOMParser().parseFromString(html, 'text/html').querySelector('svg');
              return {
                viewBox: svg.getAttribute('viewBox'),
                labels: [...svg.querySelectorAll('foreignObject')].map((label) => ({
                  width: label.getAttribute('width'),
                  height: label.getAttribute('height'),
                })),
              };
            };
            const automatic = readGeometry((await mermaid.render('automatic', code)).svg);
            const container = document.createElement('div');
            document.body.appendChild(container);
            const supplied = readGeometry((await mermaid.render('supplied', code, container)).svg);
            container.remove();
            results.push({ automatic, supplied });
          }
          return results;
        },
        { bodyStyle, securityLevel }
      );
      for (const { automatic, supplied } of results) {
        expect(automatic).toEqual(supplied);
        const [, , width, height] = automatic.viewBox.split(/\s+/).map(Number);
        expect(width).toBeGreaterThan(0);
        expect(height).toBeGreaterThan(0);
      }
      expect(results[0].automatic.labels.length).toBeGreaterThan(0);
      for (const label of results[0].automatic.labels) {
        expect(Number(label.width)).toBeGreaterThan(0);
        expect(Number(label.height)).toBeGreaterThan(0);
      }
    });
  }
}
