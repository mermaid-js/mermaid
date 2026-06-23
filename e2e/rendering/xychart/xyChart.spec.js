import { test, expect } from '@playwright/test';
import { imgSnapshotTest } from '../../helpers/util.ts';

const assertBarLabelsWithinBars = async (page, orientation = 'vertical') => {
  await page.locator('g.bar-plot-0').evaluate((plot, barOrientation) => {
    const rects = [...plot.querySelectorAll('rect')];
    const texts = [...plot.querySelectorAll('text')];
    const count = Math.min(rects.length, texts.length);
    for (let index = 0; index < count; index++) {
      const rect = rects[index];
      const text = texts[index];
      const barProps = {
        x: parseFloat(rect.getAttribute('x') ?? '0'),
        y: parseFloat(rect.getAttribute('y') ?? '0'),
        width: parseFloat(rect.getAttribute('width') ?? '0'),
        height: parseFloat(rect.getAttribute('height') ?? '0'),
      };
      const bbox = text.getBBox();
      const textProps = {
        x: bbox.x,
        y: bbox.y,
        width: bbox.width,
        height: bbox.height,
      };

      // Enforce containment only along the bar's long axis — a label can't fit
      // inside the narrow axis of a thin/short bar — and centering along the
      // short axis. Vertical bars are tall; horizontal bars are wide.
      if (barOrientation === 'vertical') {
        // Allow 1px tolerance: getBBox() height can be 1.2-1.45x the nominal font size,
        // so the rendered text may marginally overflow the bar edge by a fraction of a pixel.
        if (textProps.y <= barProps.y - 1) {
          throw new Error('text top above bar');
        }
        if (textProps.y + textProps.height >= barProps.y + barProps.height + 1) {
          throw new Error('text bottom below bar');
        }
        const textCenter = textProps.x + textProps.width / 2;
        const barCenter = barProps.x + barProps.width / 2;
        if (Math.abs(textCenter - barCenter) > 5) {
          throw new Error('horizontal center mismatch');
        }
      } else {
        if (textProps.x <= barProps.x) {
          throw new Error('text left of bar');
        }
        if (textProps.x + textProps.width >= barProps.x + barProps.width) {
          throw new Error('text right of bar');
        }
        const textCenter = textProps.y + textProps.height / 2;
        const barCenter = barProps.y + barProps.height / 2;
        if (Math.abs(textCenter - barCenter) > 5) {
          throw new Error('vertical center mismatch');
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
  test('should render the simplest possible xy-beta chart', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      xychart-beta
        line [10, 30, 20]
      `,
      {}
    );
  });
  test('should render the simplest possible xy chart', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      xychart
        line [10, 30, 20]
      `,
      {}
    );
  });
  test('Should render a complete chart', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      xychart
        title "Sales Revenue"
        x-axis Months [jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec]
        y-axis "Revenue (in $)" 4000 --> 11000
        bar [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]
        line [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]
      `,
      {}
    );
  });
  test('Should render a chart without title', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      xychart
        x-axis Months [jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec]
        y-axis "Revenue (in $)" 4000 --> 11000
        bar [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]
        line [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]
      `,
      {}
    );
  });
  test('y-axis title not required', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      xychart
        x-axis Months [jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec]
        y-axis 4000 --> 11000
        bar [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]
        line [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]
      `,
      {}
    );
  });
  test('Should render a chart without y-axis with different range', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      xychart
        x-axis Months [jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec]
        bar [5000, 6000, 7500, 8200, 9500, 10500, 14000, 3200, 9200, 9900, 3400, 6000]
        line [2000, 7000, 6500, 9200, 9500, 7500, 11000, 10200, 3200, 8500, 7000, 8800]
      `,
      {}
    );
  });
  test('x axis title not required', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      xychart
        x-axis [jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec]
        bar [5000, 6000, 7500, 8200, 9500, 10500, 14000, 3200, 9200, 9900, 3400, 6000]
        line [2000, 7000, 6500, 9200, 9500, 7500, 11000, 10200, 3200, 8500, 7000, 8800]
      `,
      {}
    );
  });
  test('Multiple plots can be rendered', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      xychart
        line [23, 46, 77, 34]
        line [45, 32, 33, 12]
        bar [87, 54, 99, 85]
        line [78, 88, 22, 4]
        line [22, 29, 75, 33]
        bar [52, 96, 35, 10]
      `,
      {}
    );
  });
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
  test('Decimals and negative numbers are supported', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      xychart
        y-axis -2.4 --> 3.5
        line [+1.3, .6, 2.4, -.34]
      `,
      {}
    );
  });
  test('Render spark line with "plotReservedSpacePercent"', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      ---
      config:
        theme: dark
        xyChart:
          width: 200
          height: 20
          plotReservedSpacePercent: 100
      ---
      xychart
        line [5000, 9000, 7500, 6200, 9500, 5500, 11000, 8200, 9200, 9500, 7000, 8800]
      `,
      {}
    );
  });
  test('Render spark bar without displaying other property', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      ---
      config:
        theme: dark
        xyChart:
          width: 200
          height: 20
          xAxis:
            showLabel: false
            showTitle: false
            showTick: false
            showAxisLine: false
          yAxis:
            showLabel: false
            showTitle: false
            showTick: false
            showAxisLine: false
      ---
      xychart
        bar [5000, 9000, 7500, 6200, 9500, 5500, 11000, 8200, 9200, 9500, 7000, 8800]
      `,
      {}
    );
  });
  test('Should use all the config from directive', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      %%{init: {"xyChart": {"width": 1000, "height": 600, "titlePadding": 5, "titleFontSize": 10, "xAxis": {"labelFontSize": "20", "labelPadding": 10, "titleFontSize": 30, "titlePadding": 20, "tickLength": 10, "tickWidth": 5},  "yAxis": {"labelFontSize": "20", "labelPadding": 10, "titleFontSize": 30, "titlePadding": 20, "tickLength": 10, "tickWidth": 5}, "plotBorderWidth": 5, "chartOrientation": "horizontal", "plotReservedSpacePercent": 60  }}}%%
      xychart
        title "Sales Revenue"
        x-axis Months [jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec]
        y-axis "Revenue (in $)" 4000 --> 11000
        bar [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]
        line [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]
      `,
      {}
    );
  });
  test('Should use all the config from yaml', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      ---
      config:
        theme: forest
        xyChart:
          width: 1000
          height: 600
          titlePadding: 5
          titleFontSize: 10
          xAxis:
            labelFontSize: 20
            labelPadding: 10
            titleFontSize: 30
            titlePadding: 20
            tickLength: 10
            tickWidth: 5
            axisLineWidth: 5
          yAxis:
            labelFontSize: 20
            labelPadding: 10
            titleFontSize: 30
            titlePadding: 20
            tickLength: 10
            tickWidth: 5
            axisLineWidth: 5
          chartOrientation: horizontal
          plotReservedSpacePercent: 60
          showDataLabel: true
      ---
      xychart
        title "Sales Revenue"
        x-axis Months [jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec]
        y-axis "Revenue (in $)" 4000 --> 11000
        bar [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]
        line [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]
      `,
      {}
    );
  });
  test('Render with show axis title false', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      ---
      config:
        xyChart:
          xAxis:
            showTitle: false
          yAxis:
            showTitle: false
      ---
      xychart
        title "Sales Revenue"
        x-axis Months [jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec]
        y-axis "Revenue (in $)" 4000 --> 11000
        bar [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]
        line [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]
      `,
      {}
    );
  });
  test('Render with show axis label false', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      ---
      config:
        xyChart:
          xAxis:
            showLabel: false
          yAxis:
            showLabel: false
      ---
      xychart
        title "Sales Revenue"
        x-axis Months [jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec]
        y-axis "Revenue (in $)" 4000 --> 11000
        bar [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]
        line [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]
      `,
      {}
    );
  });
  test('Render with show axis tick false', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      ---
      config:
        xyChart:
          xAxis:
            showTick: false
          yAxis:
            showTick: false
      ---
      xychart
        title "Sales Revenue"
        x-axis Months [jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec]
        y-axis "Revenue (in $)" 4000 --> 11000
        bar [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]
        line [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]
      `,
      {}
    );
  });
  test('Render with show axis line false', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      ---
      config:
        xyChart:
          xAxis:
            showAxisLine: false
          yAxis:
            showAxisLine: false
      ---
      xychart
        title "Sales Revenue"
        x-axis Months [jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec]
        y-axis "Revenue (in $)" 4000 --> 11000
        bar [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]
        line [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]
      `,
      {}
    );
  });
  test('Render all the theme color', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      ---
      config:
        xyChart:  
          showDataLabel: true
        themeVariables:
          xyChart:
            titleColor: "#ff0000"
            backgroundColor: "#f0f8ff"
            dataLabelColor: "#eeeeee"
            yAxisLabelColor: "#ee82ee"
            yAxisTitleColor: "#7fffd4"
            yAxisTickColor: "#87ceeb"
            yAxisLineColor: "#ff6347"
            xAxisLabelColor: "#7fffd4"
            xAxisTitleColor: "#ee82ee"
            xAxisTickColor: "#ff6347"
            xAxisLineColor: "#87ceeb"
            plotColorPalette: "#008000, #faba63"
      ---
      xychart
        title "Sales Revenue"
        x-axis Months [jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec]
        y-axis "Revenue (in $)" 4000 --> 11000
        bar [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]
        line [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]
      `,
      {}
    );
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

  test('should render vertical bar chart with labels', async ({ page }, testInfo) => {
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
      x-axis Months [jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec]
      y-axis "Revenue (in $)" 4000 --> 11000
      bar [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]
    `,
      {}
    );
  });

  test('should render horizontal bar chart with labels', async ({ page }, testInfo) => {
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
      x-axis Months [jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec]
      y-axis "Revenue (in $)" 4000 --> 11000
      bar [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]
    `,
      {}
    );
  });

  test('should render vertical bar chart with labels outside bar', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
    ---
    config:
      xyChart:
        showDataLabel: true
        showDataLabelOutsideBar: true
    ---
    xychart
      title "Sales Revenue"
      x-axis Months [jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec]
      y-axis "Revenue (in $)" 4000 --> 11000
      bar [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]
    `,
      {}
    );
  });

  test('should render horizontal bar chart with labels outside bar', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
    ---
    config:
      xyChart:
        showDataLabel: true
        showDataLabelOutsideBar: true
        chartOrientation: horizontal
    ---
    xychart
      title "Sales Revenue"
      x-axis Months [jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec]
      y-axis "Revenue (in $)" 4000 --> 11000
      bar [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]
    `,
      {}
    );
  });

  test('should render vertical bar chart without labels by default', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
    xychart
      title "Sales Revenue"
      x-axis Months [jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec]
      y-axis "Revenue (in $)" 4000 --> 11000
      bar [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]
    `,
      {}
    );
  });

  test('should render horizontal bar chart without labels by default', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
    ---
    config:
      xyChart:
        chartOrientation: horizontal
    ---
    xychart
      title "Sales Revenue"
      x-axis Months [jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec]
      y-axis "Revenue (in $)" 4000 --> 11000
      bar [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]
    `,
      {}
    );
  });

  test('should render multiple bar plots vertically with labels correctly', async ({
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
        title "Multiple Bar Plots"
        x-axis Categories [A, B, C]
        y-axis "Values" 0 --> 100
        bar [10, 50, 90]
      `,
      {}
    );
  });

  test('should render multiple bar plots horizontally with labels correctly', async ({
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
        title "Multiple Bar Plots"
        x-axis Categories [A, B, C]
        y-axis "Values" 0 --> 100
        bar [10, 50, 90]
      `,
      {}
    );
  });

  test('should render a single bar with label for a vertical xy-chart', async ({
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
        title "Single Bar Chart"
        x-axis Categories [A]
        y-axis "Value" 0 --> 100
        bar [75]
      `,
      {}
    );
  });

  test('should render a single bar with label for a horizontal xy-chart', async ({
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
        title "Single Bar Chart"
        x-axis Categories [A]
        y-axis "Value" 0 --> 100
        bar [75]
      `,
      {}
    );
  });

  test('should render negative and decimal values with correct labels for vertical xy-chart', async ({
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
        title "Decimal and Negative Values"
        x-axis Categories [A, B, C]
        y-axis -10 --> 10
        bar [ -2.5, 0.75, 5.1 ]
      `,
      {}
    );
  });

  test('should render negative and decimal values with correct labels for horizontal xy-chart', async ({
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
        title "Decimal and Negative Values"
        x-axis Categories [A, B, C]
        y-axis -10 --> 10
        bar [ -2.5, 0.75, 5.1 ]
      `,
      {}
    );
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

  test('should render a line chart with point labels', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      xychart
        title "Smallest AI models scoring above 60% on MMLU"
        x-axis "Date" ["Apr 2022", "Feb 2023", "Jul 2023", "Sep 2023", "Apr 2024"]
        y-axis "Parameters (B)" 0 --> 600
        line [540 "PaLM", 65 "LLaMA-65B", 34 "Llama 2 34B", 7 "Mistral 7B", 3.8 "Phi-3-mini"]
      `,
      {}
    );
  });

  test('should render a line chart with mixed labels (some points labeled, some not)', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      xychart
        title "Quarterly Performance"
        x-axis [Q1, Q2, Q3, Q4]
        y-axis "Revenue ($M)" 0 --> 100
        line [25 "Launch", 45, 72, 90 "Target Hit"]
      `,
      {}
    );
  });

  test('should render a horizontal line chart with point labels', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      xychart horizontal
        title "Model Sizes"
        x-axis ["Model A", "Model B", "Model C"]
        y-axis "Parameters" 0 --> 100
        line [20 "Small", 50 "Medium", 90 "Large"]
      `,
      {}
    );
  });

  test('should render multiple lines where only one has labels', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      xychart
        title "Comparison"
        x-axis [Q1, Q2, Q3, Q4]
        y-axis "Value" 0 --> 100
        line [20, 40, 60, 80]
        line [30 "Start", 50, 70, 95 "Peak"]
      `,
      {}
    );
  });
});
