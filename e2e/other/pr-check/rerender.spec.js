import { test, expect } from '@playwright/test';

test.describe('Rerendering', () => {
  test('should be able to render after an error has occurred', async ({ page }) => {
    const url = '/render-after-error.html';
    await page.goto(url);
    await expect(page.locator('#graphDiv')).toHaveCount(1);
  });

  test('should be able to render and rerender a graph via API', async ({ page }) => {
    const url = '/rerender.html';
    await page.goto(url);
    await expect(page.locator('#graph [id*=flowchart-A]')).toHaveText('XMas');

    await page.locator('body #rerender').click({ force: true });

    await expect(page.locator('#graph [id*=flowchart-A]')).toHaveText('Saturday');
  });
});
