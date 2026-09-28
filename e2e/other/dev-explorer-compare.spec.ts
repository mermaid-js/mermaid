import { expect, test } from '@playwright/test';

// Dev Explorer "Compare" tab (issue #8328). Both panes load the local dev
// bundle, so the test needs no network: every non-localhost request is
// aborted, and the published-version list is stubbed as unavailable.
const FIXTURE = 'layout-tests/simple-graph.mmd';

test.describe('Dev Explorer compare tab', () => {
  // The Dev Explorer is only served by the esbuild dev server (`pnpm dev`).
  // Coverage runs use the Vite server (`pnpm dev:vite`), which has no `/dev/` route.
  test.skip(!!process.env.E2E_COVERAGE, 'Dev Explorer is only served by `pnpm dev`');

  test('renders dev vs dev side by side with an empty pixel diff', async ({ page, context }) => {
    await context.route(
      (url) => !['localhost', '127.0.0.1'].includes(url.hostname),
      (route) => route.abort()
    );
    await context.route('**/dev/api/versions', (route) =>
      route.fulfill({ status: 502, json: { error: 'offline (stubbed by test)' } })
    );

    const params = new URLSearchParams({
      path: 'layout-tests',
      file: FIXTURE,
      tab: 'compare',
      left: 'dev',
      right: 'dev',
      diff: '1',
    });
    await page.goto(`/dev/?${params.toString()}`);

    const panel = page.locator('dev-compare-panel');
    await expect(panel).toBeVisible();

    for (const side of ['left', 'right']) {
      const frame = page.frameLocator(`iframe[data-side="${side}"]`);
      await expect(frame.locator('#stage svg')).toHaveCount(1, { timeout: 30_000 });
      await expect(frame.locator('#stage svg')).toContainText('a');
      await expect(page.locator(`.compare-pane[data-side="${side}"]`)).toHaveAttribute(
        'data-status',
        'rendered'
      );
    }

    const status = page.getByTestId('compare-diff-status');
    await expect(status).toHaveAttribute('data-changed-pixels', '0', { timeout: 30_000 });
    await expect(status).toContainText('0 changed pixels');

    // The offline state is reported without breaking the dev panes.
    await expect(panel).toContainText('Version list unavailable (offline?)');

    // The diff overlay is drawn on the right pane only.
    await expect(page.frameLocator('iframe[data-side="right"]').locator('#overlay')).toHaveCount(1);
    await expect(page.frameLocator('iframe[data-side="left"]').locator('#overlay')).toHaveCount(0);

    // Toggling the diff off (D key) clears it and updates the URL.
    await page.locator('.compare-toolbar').click({ position: { x: 5, y: 5 } });
    await page.keyboard.press('d');
    await expect(page.getByTestId('compare-diff-toggle')).toHaveAttribute('variant', 'default');
    await expect(page).not.toHaveURL(/diff=1/);
    await expect(page.frameLocator('iframe[data-side="right"]').locator('#overlay')).toHaveCount(0);
    await expect(page).toHaveURL(/tab=compare/);

    // → steps to the next fixture in the folder; the compare setup stays put.
    await page.keyboard.press('ArrowRight');
    await expect(page).not.toHaveURL(/simple-graph\.mmd/);
    await expect(page).toHaveURL(/left=dev&right=dev/);
    await expect(page.locator('sl-tab[panel="compare"]')).toHaveAttribute('active', '');
    await expect(page.frameLocator('iframe[data-side="right"]').locator('#stage svg')).toHaveCount(
      1,
      { timeout: 30_000 }
    );
    // ← goes back.
    await page.keyboard.press('ArrowLeft');
    await expect(page).toHaveURL(/simple-graph\.mmd/);
  });

  test('leaves theme, layout and look unset by default', async ({ page }) => {
    await page.goto(`/dev/?path=layout-tests&file=${encodeURIComponent(FIXTURE)}`);
    const selects = page.locator('.viewer-controls sl-select');
    for (const i of [0, 1, 2]) {
      await expect(selects.nth(i)).toHaveJSProperty('value', 'unset');
    }
    await expect(page.locator('.diagram-inner svg')).toHaveCount(1, { timeout: 30_000 });
    expect(page.url()).not.toMatch(/[&?](theme|layout|look)=/);
  });
});
