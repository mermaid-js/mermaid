import { test, expect } from '@playwright/test';
import { imgSnapshotTest, renderGraph } from '../../helpers/util.ts';

test.describe('pie chart', () => {
  test('should render a simple pie diagram', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `pie title Sports in Sweden
        "Bandy": 40
        "Ice-Hockey": 80
        "Football": 90
      `
    );
  });

  test('should render a simple pie diagram with long labels', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `pie title NETFLIX
        "Time spent looking for movie": 90
        "Time spent watching it": 10
      `
    );
  });

  test('should render a simple pie diagram with capital letters for labels', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `pie title What Voldemort doesn't have?
        "FRIENDS": 2
        "FAMILY": 3
        "NOSE": 45
      `
    );
  });

  test('should render a pie diagram when useMaxWidth is true (default)', async ({
    page,
  }, testInfo) => {
    await renderGraph(
      page,
      testInfo,
      `pie title Sports in Sweden
        "Bandy": 40
        "Ice-Hockey": 80
        "Football": 90
      `,
      { pie: { useMaxWidth: true } }
    );
    const svg = page.locator('svg');
    await expect(svg).toHaveAttribute('width', '100%');
    const style = await svg.getAttribute('style');
    expect(style).toMatch(/^max-width: [\d.]+px;$/);
    const maxWidthValue = parseFloat(style.match(/[\d.]+/g).join(''));
    expect(maxWidthValue).toBeGreaterThanOrEqual(590);
    expect(maxWidthValue).toBeLessThanOrEqual(600);
  });

  test('should render a pie diagram when useMaxWidth is false', async ({ page }, testInfo) => {
    await renderGraph(
      page,
      testInfo,
      `pie title Sports in Sweden
        "Bandy": 40
        "Ice-Hockey": 80
        "Football": 90
      `,
      { pie: { useMaxWidth: false } }
    );
    const svg = page.locator('svg');
    const width = parseFloat((await svg.getAttribute('width')) ?? '0');
    expect(width).toBeGreaterThanOrEqual(590);
    expect(width).toBeLessThanOrEqual(600);
    await expect(svg).not.toHaveAttribute('style');
  });

  test('should render a pie diagram when textPosition is set', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `pie
        "Dogs": 50
        "Cats": 25
      `,
      { logLevel: 1, pie: { textPosition: 0.9 } }
    );
  });

  test('should render a pie diagram with showData', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `pie showData
        "Dogs": 50
        "Cats": 25
      `
    );
  });
  test('should render pie slices only for non-zero values but shows all legends', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `   pie title Pets adopted by volunteers
    "Dogs" : 386
    "Cats" : 85
    "Rats" : 1
      `
    );
  });
  test('should render a pie diagram with readable title and legend in dark mode', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `pie title Sports in Sweden
        "Bandy": 40
        "Ice-Hockey": 80
        "Football": 90
      `,
      { theme: 'dark' }
    );
  });

  test('should render a pie diagram with a long title without clipping', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `pie title Weekly Grocery Consumption for a Family of 4
        "Vegetables": 25
        "Fruits": 5
        "Cheese": 5
        "Milk": 15
        "Eggs": 15
        "Meat": 30
        "Bread": 5
      `
    );
  });

  test('should render a donut diagram', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `pie title What Koalas Do In A Day
        "Sleep": 20
        "Eat": 3
        "Roam": 1
      `,
      { pie: { donutHole: 0.4 } }
    );
  });

  test('should render a pie diagram if donutHole parameter is too large', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `pie title Items Sold
        "Speaker": 30
        "Monitor": 8
        "Keyboard": 5
        "Mouse": 12
      `,
      { pie: { donutHole: 1.2 } }
    );
  });

  test('should render a pie diagram if donutHole parameter is negative', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `pie title Owned Pet
        "Dog": 65
        "Cat": 52
        "Fish": 16
      `,
      { pie: { donutHole: -0.3 } }
    );
  });

  test('should render a pie diagram with legend at the bottom of the diagram', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `pie title Football Team Member Position
        "Goalkeeper": 2
        "Back": 8
        "Midfielder": 5
        "Striker": 3
      `,
      { pie: { legendPosition: 'bottom' } }
    );
  });

  test('should render a pie diagram that highlights specific slice', async ({ page }, testInfo) => {
    await renderGraph(
      page,
      testInfo,
      `pie title Budget Allocation
        "Food": 300
        "Entertainment": 80
        "Rent": 500
      `,
      { pie: { highlightSlice: 'Food' } }
    );
    await expect(page.locator('.pieCircle').first()).toHaveClass(/highlighted/);
  });

  test('should render a pie diagram that highlights hovered slice', async ({ page }, testInfo) => {
    await renderGraph(
      page,
      testInfo,
      `pie title Portfolio Holdings
        "Stock": 60
        "Bond": 30
        "Cash": 10
      `,
      { pie: { highlightSlice: 'hover' } }
    );

    const pieCircles = page.locator('.pieCircle');
    const count = await pieCircles.count();
    for (let i = 0; i < count; i++) {
      await expect(pieCircles.nth(i)).toHaveClass(/highlightedOnHover/);
    }
  });
});
