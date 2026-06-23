import { test, expect } from '@playwright/test';
import { renderGraph } from '../helpers/util.ts';

test.describe('Gantt diagram', () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.install({ time: new Date('1010-10-10') });
  });

  test('should render a gantt diagram when useMaxWidth is true (default)', async ({
    page,
  }, testInfo) => {
    await renderGraph(
      page,
      testInfo,
      `
    gantt
      dateFormat  YYYY-MM-DD
      axisFormat  %d/%m
      title Adding GANTT diagram to mermaid
      excludes weekdays 2014-01-10

      section A section
      Completed task            :done,    des1, 2014-01-06,2014-01-08
      Active task               :active,  des2, 2014-01-09, 3d
      Future task               :         des3, after des2, 5d
      Future task2               :         des4, after des3, 5d

      section Critical tasks
      Completed task in the critical line :crit, done, 2014-01-06,24h
      Implement parser and jison :crit, done, after des1, 2d
      Create tests for parser             :crit, active, 3d
      Future task in critical line        :crit, 5d
      Create tests for renderer           :2d
      Add to mermaid                      :1d

      section Documentation
      Describe gantt syntax               :active, a1, after des1, 3d
      Add gantt diagram to demo page      :after a1  , 20h
      Add another diagram to demo page    :doc1, after a1  , 48h

      section Last section
      Describe gantt syntax               :after doc1, 3d
      Add gantt diagram to demo page      : 20h
      Add another diagram to demo page    : 48h
      `,
      { gantt: { useMaxWidth: true } }
    );
    const svg = page.locator('svg');
    await expect(svg).toHaveAttribute('width', '100%');
    const style = await svg.getAttribute('style');
    expect(style).toMatch(/^max-width: [\d.]+px;$/);
    const maxWidthValue = parseFloat(style.match(/[\d.]+/g).join(''));
    expect(maxWidthValue).toBeGreaterThanOrEqual(1440 * 0.95);
    expect(maxWidthValue).toBeLessThanOrEqual(1440 * 1.05);
  });

  test('should render a gantt diagram when useMaxWidth is false', async ({ page }, testInfo) => {
    await renderGraph(
      page,
      testInfo,
      `
    gantt
      dateFormat  YYYY-MM-DD
      axisFormat  %d/%m
      title Adding GANTT diagram to mermaid
      excludes weekdays 2014-01-10

      section A section
      Completed task            :done,    des1, 2014-01-06,2014-01-08
      Active task               :active,  des2, 2014-01-09, 3d
      Future task               :         des3, after des2, 5d
      Future task2               :         des4, after des3, 5d

      section Critical tasks
      Completed task in the critical line :crit, done, 2014-01-06,24h
      Implement parser and jison :crit, done, after des1, 2d
      Create tests for parser             :crit, active, 3d
      Future task in critical line        :crit, 5d
      Create tests for renderer           :2d
      Add to mermaid                      :1d

      section Documentation
      Describe gantt syntax               :active, a1, after des1, 3d
      Add gantt diagram to demo page      :after a1  , 20h
      Add another diagram to demo page    :doc1, after a1  , 48h

      section Last section
      Describe gantt syntax               :after doc1, 3d
      Add gantt diagram to demo page      : 20h
      Add another diagram to demo page    : 48h
      `,
      { gantt: { useMaxWidth: false } }
    );
    const svg = page.locator('svg');
    const width = parseFloat((await svg.getAttribute('width')) ?? '0');
    expect(width).toBeGreaterThanOrEqual(1440 * 0.95);
    expect(width).toBeLessThanOrEqual(1440 * 1.05);
    await expect(svg).not.toHaveAttribute('style');
  });

  // TODO: fix it
  //
  // This test is skipped deliberately
  // because it fails and blocks our development pipeline
  // It was added as an attempt to fix gantt performance issues
  //
  // https://github.com/mermaid-js/mermaid/issues/3274
  //
});
