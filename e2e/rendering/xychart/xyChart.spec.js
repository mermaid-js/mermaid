import { test, expect } from '@playwright/test';
import { imgSnapshotTest } from '../../helpers/util.ts';

const assertBarLabelsWithinBars = async (page, orientation = 'vertical') => {
  await page.locator('g.bar-plot-0').evaluate((plot, barOrientation) => {
    const vertical = barOrientation === 'vertical';

    // Bars are bound to every data point, but a value below the axis floor
    // renders as a degenerate (zero/negative extent) rect with NO label. Keep
    // only real bars so the label↔bar pairing isn't thrown off by them — pairing
    // by index against the unfiltered rect list silently mismatches every label
    // after the first dropped bar.
    const bars = [...plot.querySelectorAll('rect')]
      .map((rect) => ({
        x: parseFloat(rect.getAttribute('x') ?? '0'),
        y: parseFloat(rect.getAttribute('y') ?? '0'),
        width: parseFloat(rect.getAttribute('width') ?? '0'),
        height: parseFloat(rect.getAttribute('height') ?? '0'),
      }))
      .filter((bar) => bar.width > 0 && bar.height > 0);

    const labels = [...plot.querySelectorAll('text')].map((text) => {
      const box = text.getBBox();
      return { x: box.x, y: box.y, width: box.width, height: box.height };
    });

    // A label-less chart would make every check below vacuous, so fail loudly.
    if (labels.length === 0) {
      throw new Error('xychart: showDataLabel is on but no data labels were rendered');
    }

    const center = (box, axis) => (axis === 'x' ? box.x + box.width / 2 : box.y + box.height / 2);
    const shortAxis = vertical ? 'x' : 'y';

    for (const label of labels) {
      // Each label is centered on the short axis of its own bar, so pair it with
      // the nearest bar along that axis (robust to filtered/degenerate bars).
      let bar;
      let best = Infinity;
      for (const candidate of bars) {
        const distance = Math.abs(center(candidate, shortAxis) - center(label, shortAxis));
        if (distance < best) {
          best = distance;
          bar = candidate;
        }
      }
      if (!bar) {
        throw new Error('xychart: a data label has no matching bar');
      }

      // Centered on the short axis, and contained along the long axis.
      if (best > 5) {
        throw new Error('xychart: data label not centered on its bar');
      }
      if (vertical) {
        // Allow 1px tolerance: getBBox() height can be 1.2-1.45x the nominal font size,
        // so the rendered text may marginally overflow the bar edge by a fraction of a pixel.
        if (label.y <= bar.y - 1) {
          throw new Error('xychart: label top above bar');
        }
        if (label.y + label.height >= bar.y + bar.height + 1) {
          throw new Error('xychart: label bottom below bar');
        }
      } else {
        if (label.x <= bar.x) {
          throw new Error('xychart: label left of bar');
        }
        if (label.x + label.width >= bar.x + bar.width) {
          throw new Error('xychart: label right of bar');
        }
      }
    }
  }, orientation);
};

const assertAxisLabelRotation = async (page, expectedRotation) => {
  const transforms = await page
    .locator('g.bottom-axis > g.label > text')
    .evaluateAll((texts) => texts.map((text) => text.getAttribute('transform')));
  for (const transform of transforms) {
    expect(transform).toContain(`rotate(${expectedRotation})`);
  }
};

test.describe('XY Chart', () => {
  test('should render legends for named plots', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      xychart-beta
        title "An Example Chart"
        x-axis ["90d", "60d", "30d", "7d", "1d", "Current"]
        y-axis "Seconds" 0 --> 198.2
        line "avg" [48.1, 41.5, 45.7, 72.8, 67.7, 59.9]
        line "p50" [38.2, 36.8, 39.7, 54.5, 49.0, 38.4]
        bar "p95" [112.2, 75.3, 103.0, 177.0, 180.2, 109.4]
      `,
      {}
    );

    await expect(page.locator('g.legend text')).toHaveCount(3);
    await expect(page.locator('g.legend')).toContainText('avg');
    await expect(page.locator('g.legend')).toContainText('p50');
    await expect(page.locator('g.legend')).toContainText('p95');
    await expect(page.locator('g.legend path')).toHaveCount(2);
    await expect(page.locator('g.legend rect')).toHaveCount(1);
  });

  test('should use the correct distances between data points', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      xychart
        x-axis 0 --> 2
        line [0, 1, 0, 1]
        bar [1, 0, 1, 0]
      `,
      {}
    );
    await expect(page.locator('svg')).toBeVisible();
  });

  test('should render data labels within each bar in the vertical xy-chart', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
    ---
    config:
      xyChart:
        showDataLabel: true
    ---
    xychart
            title "Sales Revenue"
            x-axis Months [jan,b,c]
            y-axis "Revenue (in $)" 4000 --> 12000
            bar [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000, 3000, 2000, 500, 2000, 3000, 11000, 5000, 6000]
    `,
      {}
    );

    await assertBarLabelsWithinBars(page, 'vertical');
  });

  test('should render data labels within each bar in the horizontal xy-chart', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
    ---
    config:
      xyChart:
        showDataLabel: true
        chartOrientation: horizontal
    ---
    xychart
            title "Sales Revenue"
            x-axis Months [jan,b,c]
            y-axis "Revenue (in $)" 4000 --> 12000
            bar [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000, 3000, 2000, 500, 2000, 3000, 11000, 5000, 6000]
    `,
      {}
    );

    await assertBarLabelsWithinBars(page, 'horizontal');
  });

  test('should render data labels within each bar in the vertical xy-chart with a lot of bars of different sizes', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      ---
      config:
        xyChart:
          showDataLabel: true
      ---
      xychart
        title "Sales Revenue"
        x-axis Months [jan,a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s]
        y-axis "Revenue (in $)" 4000 --> 12000
        bar [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000, 8000, 10000, 5000, 7600, 4999,11000 ,5000,6000]
    `,
      {}
    );

    await assertBarLabelsWithinBars(page, 'vertical');
  });

  test('should render data labels within each bar in the horizontal xy-chart with a lot of bars of different sizes', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
    ---
    config:
      xyChart:
        showDataLabel: true
        chartOrientation: horizontal
    ---
    xychart
      title "Sales Revenue"
      x-axis Months [jan,a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s]
      y-axis "Revenue (in $)" 4000 --> 12000
      bar [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000, 8000, 10000, 5000, 7600, 4999,11000 ,5000,6000]
    `,
      {}
    );

    await assertBarLabelsWithinBars(page, 'horizontal');
  });

  test('should render data labels correctly for a bar in the vertical xy-chart', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
    ---
    config:
      xyChart:
        showDataLabel: true
    ---
    xychart
            title "Sales Revenue"
            x-axis Months [jan]
            y-axis "Revenue (in $)" 3000 --> 12000
            bar [4000]
    `,
      {}
    );

    await assertBarLabelsWithinBars(page, 'vertical');
  });

  test('should render data labels correctly for a bar in the horizontal xy-chart', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
    ---
    config:
      xyChart:
        showDataLabel: true
        chartOrientation: horizontal
    ---
    xychart
            title "Sales Revenue"
            x-axis Months [jan]
            y-axis "Revenue (in $)" 3000 --> 12000
            bar [4000]
    `,
      {}
    );

    await assertBarLabelsWithinBars(page, 'horizontal');
  });

  test('should render xy-chart with rotated label on x-axis', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
    ---
    config:
      xyChart:
        xAxis:
          showLabel: true
          labelRotation: 45
    ---
    xychart
      title "Git Commits per Month"
      x-axis "Date" [ 2023-04, 2023-05, 2023-06, 2023-07, 2023-08, 2023-09, 2023-10, 2023-11, 2023-12, 2024-01, 2024-02, 2024-03, 2024-04, 2024-05, 2024-06, 2024-07, 2024-08, 2024-09, 2024-10 ]
      y-axis "Number of Commits"
      bar    [ 344, 523, 81, 7, 3, 3, 5, 17, 5, 2, 7, 6, 4, 2, 9, 31, 79, 70, 50 ]
    `,
      {}
    );

    await assertAxisLabelRotation(page, '45');
  });

  test('should render xy-chart with normal rotation on x-axis when labelRotation value is greater than limit', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
    ---
    config:
      xyChart:
        xAxis:
          showLabel: true
          labelRotation: 120
    ---
    xychart
      title "Items Sold"
      x-axis "Item" [ Monitor, Mouse, Keyboard ]
      y-axis "Number of Sales"
      bar    [ 51, 72, 36 ]
    `,
      {}
    );

    await assertAxisLabelRotation(page, '0');
  });

  test('should render xy-chart with normal rotation on x-axis when labelRotation value is less than limit', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
    ---
    config:
      xyChart:
        xAxis:
          showLabel: true
          labelRotation: -100
    ---
    xychart
      title "Items Sold"
      x-axis "Item" [ Monitor, Mouse, Keyboard ]
      y-axis "Number of Sales"
      bar    [ 51, 72, 36 ]
    `,
      {}
    );

    await assertAxisLabelRotation(page, '0');
  });

  test('x-axis range with same values is supported', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `---
title: Dirac delta function
---
xychart-beta
  x-axis "Only 0 matters" 0 --> 0
  line "dirac" [0, 0.5, 1]
`,
      {}
    );

    // Zero-width vertical line: Playwright's toBeVisible() treats a 0-bbox as hidden.
    await expect(page.locator('g.plot g.line-plot-0 path')).toHaveCount(1);
  });
});
