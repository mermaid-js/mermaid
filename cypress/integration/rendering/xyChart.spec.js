import { imgSnapshotTest, renderGraph } from '../../helpers/util.ts';

describe('XY Chart', () => {
  describe('single dataset', () => {
    it('should render the simplest possible chart', () => {
      imgSnapshotTest(
        `
      xychart-beta
        line [10, 30, 20]
      `,
        {}
      );
      cy.get('svg');
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
      cy.get('svg');
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
      cy.get('svg');
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
      cy.get('svg');
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
      cy.get('svg');
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
      cy.get('svg');
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
      cy.get('svg');
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
      cy.get('svg');
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
      cy.get('svg');
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
      cy.get('svg');
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
      cy.get('svg');
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
      cy.get('svg');
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
      cy.get('svg');
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
      cy.get('svg');
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
      cy.get('svg');
    });
  });

  describe('multiple datasets', () => {
    describe('vertical', () => {
      it('should render bar diagram for 3 datasets', () => {
        imgSnapshotTest(
          `
      xychart-beta
      title "Basic xychart with multiple datasets"
      x-axis "Relevant categories" [category1, "category 2", category3, category4]
      y-axis Animals 0 --> 160
      bar "dogs" [0, 20, 40, 30]
      bar "cats" [20, 40, 0, 30]
      bar "birds" [30, 60, 50, 30]
      `,
          {}
        );
        cy.get('svg');
      });

      it('should render line diagram for 3 datasets', () => {
        imgSnapshotTest(
          `
      xychart-beta
      title "Basic xychart with multiple datasets"
      x-axis "Relevant categories" [category1, "category 2", category3, category4]
      y-axis Animals 0 --> 160
      line "dogs" [0, 20, 40, 30]
      line "cats" [20, 40, 0, 30]
      line "birds" [30, 60, 50, 30]
      `,
          {}
        );
        cy.get('svg');
      });

      it('should render a mix of multiple bar and line plots', () => {
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
        cy.get('svg');
      });
    });

    describe('horizontal', () => {
      it('should render bar diagram for 3 datasets', () => {
        imgSnapshotTest(
          `
      xychart-beta horizontal
      title "Basic xychart with multiple datasets"
      x-axis "Relevant categories" [category1, "category 2", category3, category4]
      y-axis Animals 0 --> 160
      bar "dogs" [0, 20, 40, 30]
      bar "cats" [20, 40, 0, 30]
      bar "birds" [30, 60, 50, 30]
      `,
          {}
        );
        cy.get('svg');
      });

      it('should render line diagram for 3 datasets', () => {
        imgSnapshotTest(
          `
      xychart-beta horizontal
      title "Basic xychart with multiple datasets"
      x-axis "Relevant categories" [category1, "category 2", category3, category4]
      y-axis Animals 0 --> 160
      line "dogs" [0, 20, 40, 30]
      line "cats" [20, 40, 0, 30]
      line "birds" [30, 60, 50, 30]
      `,
          {}
        );
        cy.get('svg');
      });

      it('should render a mix of multiple bar and line plots', () => {
        imgSnapshotTest(
          `
      xychart-beta horizontal
        line [23, 46, 77, 34]
        line [45, 32, 33, 12]
        bar [87, 54, 99, 85]
        line [78, 88, 22, 4]
        line [22, 29, 75, 33]
        bar [52, 96, 35, 10]
      `,
          {}
        );
        cy.get('svg');
      });
    });
  });
});
