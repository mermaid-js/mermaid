import { expect, test } from '@playwright/test';

import { renderGraph } from '../../../helpers/util.ts';

// These check the markup, not a screenshot. The e2e page loads the FontAwesome stylesheet only
// for a source that uses the `fa:fa-name` label syntax.
test.describe('Test iconShape with an unregistered FontAwesome icon', () => {
  test('draws the FontAwesome glyph instead of the unknown-icon placeholder', async ({
    page,
  }, testInfo) => {
    const flowchartCode = `flowchart TB\n  nA --> nAA@{ icon: 'fab:github', label: 'unregistered prefix' }\n`;
    await renderGraph(page, testInfo, flowchartCode, { screenshot: false });
    await expect(page.locator('.icon-shape foreignObject i.fab.fa-github')).toHaveCount(1);
    await expect(page.locator('.icon-shape text', { hasText: '?' })).toHaveCount(0);
  });

  test('scales a FontAwesome glyph wider than the icon down to fit inside it', async ({
    page,
  }, testInfo) => {
    const flowchartCode = `flowchart LR\n  c[fa:fa-car loads the stylesheet] --> u@{ icon: 'fas:users', label: 'wide' } --> t@{ icon: 'fas:tag', label: 'narrow' }\n`;
    await renderGraph(page, testInfo, flowchartCode, { screenshot: false });

    const glyphBox = (name: string) =>
      page.locator(`.icon-shape foreignObject:has(i.fa-${name})`).evaluate((frame) => {
        const box = frame.querySelector('div');
        const glyph = frame.querySelector('i')!.getBoundingClientRect();
        const outer = frame.getBoundingClientRect();
        return {
          fontSize: box?.style.fontSize,
          height: box?.style.height,
          inside:
            glyph.width > 0 &&
            glyph.left >= outer.left - 0.5 &&
            glyph.right <= outer.right + 0.5 &&
            glyph.top >= outer.top - 0.5 &&
            glyph.bottom <= outer.bottom + 0.5,
        };
      });

    const wide = await glyphBox('users');
    expect(wide.inside).toBe(true);
    expect(Number.parseFloat(wide.fontSize ?? '')).toBeLessThan(
      Number.parseFloat(wide.height ?? '')
    );

    const narrow = await glyphBox('tag');
    expect(narrow.inside).toBe(true);
    expect(narrow.fontSize).toBe(narrow.height);
  });
});
