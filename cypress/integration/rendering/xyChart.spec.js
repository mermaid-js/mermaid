import { imgSnapshotTest, renderGraph } from '../../helpers/util.ts';

describe('XY Chart', () => {
  it('should render the simplest possible chart', () => {
    imgSnapshotTest(
      `
      xychart-beta
        line [10, 30, 20]
      `,
      {}
    );
  });
  it('Should render a complete chart', () => {
    imgSnapshotTest(
      `
      xychart-beta
        title "Sales Revenue"
        x-axis Months [jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec]
        y-axis "Revenue (in $)" 4000 --> 11000
        bar [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]
        line [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]
      `,
      {}
    );
  });
  it('Should render a chart without title', () => {
    imgSnapshotTest(
      `
      xychart-beta
        x-axis Months [jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec]
        y-axis "Revenue (in $)" 4000 --> 11000
        bar [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]
        line [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]
      `,
      {}
    );
  });
  it('y-axis title not required', () => {
    imgSnapshotTest(
      `
      xychart-beta
        x-axis Months [jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec]
        y-axis 4000 --> 11000
        bar [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]
        line [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]
      `,
      {}
    );
  });
  it('Should render a chart without y-axis with different range', () => {
    imgSnapshotTest(
      `
      xychart-beta
        x-axis Months [jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec]
        bar [5000, 6000, 7500, 8200, 9500, 10500, 14000, 3200, 9200, 9900, 3400, 6000]
        line [2000, 7000, 6500, 9200, 9500, 7500, 11000, 10200, 3200, 8500, 7000, 8800]
      `,
      {}
    );
  });
  it('x axis title not required', () => {
    imgSnapshotTest(
      `
      xychart-beta
        x-axis [jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec]
        bar [5000, 6000, 7500, 8200, 9500, 10500, 14000, 3200, 9200, 9900, 3400, 6000]
        line [2000, 7000, 6500, 9200, 9500, 7500, 11000, 10200, 3200, 8500, 7000, 8800]
      `,
      {}
    );
  });
  it('Multiple plots can be rendered', () => {
    imgSnapshotTest(
      `
      xychart-beta
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
  it('Decimals and negative numbers are supported', () => {
    imgSnapshotTest(
      `
      xychart-beta
        y-axis -2.4 --> 3.5
        line [+1.3, .6, 2.4, -.34]
      `,
      {}
    );
  });
  it('Render spark line with "plotReservedSpacePercent"', () => {
    imgSnapshotTest(
      `
      ---
      config:
        theme: dark
        xyChart:
          width: 200
          height: 20
          plotReservedSpacePercent: 100
      ---
      xychart-beta
        line [5000, 9000, 7500, 6200, 9500, 5500, 11000, 8200, 9200, 9500, 7000, 8800]
      `,
      {}
    );
  });
  it('Render spark bar without displaying other property', () => {
    imgSnapshotTest(
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
      xychart-beta
        bar [5000, 9000, 7500, 6200, 9500, 5500, 11000, 8200, 9200, 9500, 7000, 8800]
      `,
      {}
    );
  });
  it('Should use all the config from directive', () => {
    imgSnapshotTest(
      `
      %%{init: {"xyChart": {"width": 1000, "height": 600, "titlePadding": 5, "titleFontSize": 10, "xAxis": {"labelFontSize": "20", "labelPadding": 10, "titleFontSize": 30, "titlePadding": 20, "tickLength": 10, "tickWidth": 5},  "yAxis": {"labelFontSize": "20", "labelPadding": 10, "titleFontSize": 30, "titlePadding": 20, "tickLength": 10, "tickWidth": 5}, "plotBorderWidth": 5, "chartOrientation": "horizontal", "plotReservedSpacePercent": 60  }}}%%
      xychart-beta
        title "Sales Revenue"
        x-axis Months [jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec]
        y-axis "Revenue (in $)" 4000 --> 11000
        bar [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]
        line [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]
      `,
      {}
    );
  });
  it('Should use all the config from yaml', () => {
    imgSnapshotTest(
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
      xychart-beta
        title "Sales Revenue"
        x-axis Months [jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec]
        y-axis "Revenue (in $)" 4000 --> 11000
        bar [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]
        line [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]
      `,
      {}
    );
  });
  it('Render with show axis title false', () => {
    imgSnapshotTest(
      `
      ---
      config:
        xyChart:
          xAxis:
            showTitle: false
          yAxis:
            showTitle: false
      ---
      xychart-beta
        title "Sales Revenue"
        x-axis Months [jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec]
        y-axis "Revenue (in $)" 4000 --> 11000
        bar [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]
        line [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]
      `,
      {}
    );
  });
  it('Render with show axis label false', () => {
    imgSnapshotTest(
      `
      ---
      config:
        xyChart:
          xAxis:
            showLabel: false
          yAxis:
            showLabel: false
      ---
      xychart-beta
        title "Sales Revenue"
        x-axis Months [jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec]
        y-axis "Revenue (in $)" 4000 --> 11000
        bar [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]
        line [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]
      `,
      {}
    );
  });
  it('Render with show axis tick false', () => {
    imgSnapshotTest(
      `
      ---
      config:
        xyChart:
          xAxis:
            showTick: false
          yAxis:
            showTick: false
      ---
      xychart-beta
        title "Sales Revenue"
        x-axis Months [jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec]
        y-axis "Revenue (in $)" 4000 --> 11000
        bar [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]
        line [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]
      `,
      {}
    );
  });
  it('Render with show axis line false', () => {
    imgSnapshotTest(
      `
      ---
      config:
        xyChart:
          xAxis:
            showAxisLine: false
          yAxis:
            showAxisLine: false
      ---
      xychart-beta
        title "Sales Revenue"
        x-axis Months [jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec]
        y-axis "Revenue (in $)" 4000 --> 11000
        bar [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]
        line [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]
      `,
      {}
    );
  });
  it('Render all the theme color', () => {
    imgSnapshotTest(
      `
      ---
      config:
        themeVariables:
          xyChart:
            titleColor: "#ff0000"
            backgroundColor: "#f0f8ff"
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
      xychart-beta
        title "Sales Revenue"
        x-axis Months [jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec]
        y-axis "Revenue (in $)" 4000 --> 11000
        bar [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]
        line [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]
      `,
      {}
    );
  });
  it('should use the correct distances between data points', () => {
    imgSnapshotTest(
      `
      xychart-beta
        x-axis 0 --> 2
        line [0, 1, 0, 1]
        bar [1, 0, 1, 0]
      `,
      {}
    );
    cy.get('svg');
  });
  it('should render bar labels when showDataLabel is set to true', () => {
    imgSnapshotTest(
      `
      ---
      config:
        themeVariables:
          xyChart:
            showDataLabel: true
      ---
      xychart-beta
        title "Default Label Chart"
        x-axis Categories [A, B, C]
        y-axis "Values" 0 --> 100
        bar [10, 50, 90]
      `,
      {}
    );
  });

  it('should not render bar labels by default', () => {
    imgSnapshotTest(
      `
      xychart-beta
        title "No Label Chart"
        x-axis Categories [A, B, C]
        y-axis "Values" 0 --> 100
        bar [10, 50, 90]
      `,
      {}
    );
  });

  it('should render horizontal bar chart with labels', () => {
    imgSnapshotTest(
      `
    ---
    config:
      xyChart:
        showDataLabel: true
        chartOrientation: horizontal
    ---
    xychart-beta
      title "Sales Revenue"
      x-axis Months [jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec]
      y-axis "Revenue (in $)" 4000 --> 11000
      bar [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]
    `,
      {}
    );
  });

  it('should render horizontal bar chart without labels', () => {
    imgSnapshotTest(
      `
    ---
    config:
      xyChart:
        chartOrientation: horizontal
    ---
    xychart-beta
      title "Sales Revenue"
      x-axis Months [jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec]
      y-axis "Revenue (in $)" 4000 --> 11000
      bar [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]
    `,
      {}
    );
  });

  it('should render multiple bar plots with labels correctly', () => {
    // In this test, we create two bar plots. The default config should render labels for each.
    imgSnapshotTest(
      `
    ---
    config:
      xyChart:
        showDataLabel: true
    ---
      xychart-beta
        title "Multiple Bar Plots"
        x-axis Categories [A, B, C]
        y-axis "Values" 0 --> 100
        bar [10, 50, 90]
        bar [20, 60, 80]
      `,
      {}
    );
  });

  it('should render a single bar with label', () => {
    imgSnapshotTest(
      `
    ---
    config:
      xyChart:
        showDataLabel: true
    ---
      xychart-beta
        title "Single Bar Chart"
        x-axis Categories [A]
        y-axis "Value" 0 --> 100
        bar [75]
      `,
      {}
    );
  });

  it('should render negative and decimal values with correct labels', () => {
    imgSnapshotTest(
      `
    ---
    config:
      xyChart:
        showDataLabel: true
    ---
      xychart-beta
        title "Decimal and Negative Values"
        x-axis Categories [A, B, C]
        y-axis -10 --> 10
        bar [ -2.5, 0.75, 5.1 ]
      `,
      {}
    );
  });

  it('should render data labels within the bar in the horizontal xy-chart', () => {
    imgSnapshotTest(
      `
      ---
      config:
        xyChart:
          showDataLabel: true
          chartOrientation: horizontal
      ---
      xychart-beta
              title "Sales Revenue"
              x-axis Months [jan,b,c]
              y-axis "Revenue (in $)" 4000 --> 12000
              bar [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000, 3000, 2000, 500, 2000, 3000,11000 ,5000,6000]
      `,
      {}
    );

    let textProps, barProps;

    cy.get('text')
      .contains('5000')
      .then(($el) => {
        const bbox = $el[0].getBBox();
        textProps = {
          x: bbox.x,
          y: bbox.y,
          width: bbox.width,
          height: bbox.height,
        };
        console.log('textProps', textProps);
      });

    cy.get('g.bar-plot-0')
      .find('rect')
      .first()
      .then((rect) => {
        barProps = {
          x: parseFloat(rect.attr('x')),
          y: parseFloat(rect.attr('y')),
          width: parseFloat(rect.attr('width')),
          height: parseFloat(rect.attr('height')),
        };
        console.log('barProps', barProps);
      })
      .then(() => {
        // Ensure that both textProps and barProps are defined before the assertion
        expect(textProps.x).to.be.greaterThan(barProps.x);
        expect(textProps.x + textProps.width).to.be.lessThan(barProps.x + barProps.width);
        expect(textProps.y).to.be.greaterThan(barProps.y);
        expect(textProps.y + textProps.height).to.be.lessThan(barProps.y + barProps.height);
        expect(textProps.y + textProps.height / 2).to.be.closeTo(
          barProps.y + barProps.height / 2,
          1
        );
      });
  });
});
