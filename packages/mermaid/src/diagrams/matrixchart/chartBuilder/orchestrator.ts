import type {
  ChartComponent,
  DrawableElem,
  MatrixChartConfig,
  MatrixChartData,
  MatrixChartThemeConfig,
} from './interfaces.js';
import { isBarPlot } from './interfaces.js';
import type { Axis } from './components/axis/index.js';
import { getAxis } from './components/axis/index.js';
import { getChartTitleComponent } from './components/chartTitle.js';
import type { Plot } from './components/plot/index.js';
import { getPlotComponent } from './components/plot/index.js';
import type { Group } from '../../../diagram-api/types.js';
import type { BackdropPlot } from './components/backdrop/index.js';
import { getBackdropComponent } from './components/backdrop/index.js';

export class Orchestrator {
  private componentStore: {
    title: ChartComponent;
    plot: Plot;
    xAxis: Axis;
    yAxis: Axis;
    backdrop: BackdropPlot;
  };
  constructor(
    private chartConfig: MatrixChartConfig,
    private chartData: MatrixChartData,
    chartThemeConfig: MatrixChartThemeConfig,
    tmpSVGGroup: Group
  ) {
    const colorConfig: object = {};

    const categoriesArr: string[][] = chartData.xAxis.categories.map((row) =>
      chartData.yAxis.categories.map((column) => {
        return `${row}-${column}`;
      })
    );
    // @ts-ignore: TODO Fix ts errors
    const colorConfigArr: string[] = [...categoriesArr];

    colorConfigArr.forEach((item: string | number, i: number) => {
      // @ts-ignore: TODO Fix ts errors
      colorConfig[item] = chartData.color[i];
    });

    this.componentStore = {
      title: getChartTitleComponent(chartConfig, chartData, chartThemeConfig, tmpSVGGroup),
      plot: getPlotComponent(chartConfig, chartData, chartThemeConfig),
      xAxis: getAxis(
        chartData.xAxis,
        chartConfig.xAxis,
        {
          titleColor: chartThemeConfig.xAxisTitleColor,
          labelColor: chartThemeConfig.xAxisLabelColor,
          tickColor: chartThemeConfig.xAxisTickColor,
          axisLineColor: chartThemeConfig.xAxisLineColor,
        },
        tmpSVGGroup
      ),
      yAxis: getAxis(
        chartData.yAxis,
        chartConfig.yAxis,
        {
          titleColor: chartThemeConfig.yAxisTitleColor,
          labelColor: chartThemeConfig.yAxisLabelColor,
          tickColor: chartThemeConfig.yAxisTickColor,
          axisLineColor: chartThemeConfig.yAxisLineColor,
        },
        tmpSVGGroup
      ),
      backdrop: getBackdropComponent(chartConfig, chartData, chartThemeConfig, colorConfig),
    };
  }

  private calculateVerticalSpace() {
    let availableWidth = this.chartConfig.width;
    let availableHeight = this.chartConfig.height;
    let plotX = 0;
    let plotY = 0;
    let chartWidth = Math.floor((availableWidth * this.chartConfig.plotReservedSpacePercent) / 100);
    let chartHeight = Math.floor(
      (availableHeight * this.chartConfig.plotReservedSpacePercent) / 100
    );
    let spaceUsed = this.componentStore.plot.calculateSpace({
      width: chartWidth,
      height: chartHeight,
    });
    availableWidth -= spaceUsed.width;
    availableHeight -= spaceUsed.height;

    spaceUsed = this.componentStore.title.calculateSpace({
      width: this.chartConfig.width,
      height: availableHeight,
    });
    plotY = spaceUsed.height;
    availableHeight -= spaceUsed.height;
    this.componentStore.xAxis.setAxisPosition('bottom');
    spaceUsed = this.componentStore.xAxis.calculateSpace({
      width: availableWidth,
      height: availableHeight,
    });
    availableHeight -= spaceUsed.height;
    this.componentStore.yAxis.setAxisPosition('left');
    spaceUsed = this.componentStore.yAxis.calculateSpace({
      width: availableWidth,
      height: availableHeight,
    });
    plotX = spaceUsed.width;
    availableWidth -= spaceUsed.width;
    if (availableWidth > 0) {
      chartWidth += availableWidth;
      availableWidth = 0;
    }
    if (availableHeight > 0) {
      chartHeight += availableHeight;
      availableHeight = 0;
    }
    this.componentStore.plot.calculateSpace({
      width: chartWidth,
      height: chartHeight,
    });

    this.componentStore.plot.setBoundingBoxMatrix({ x: plotX, y: plotY });
    this.componentStore.xAxis.setRange([plotX, plotX + chartWidth]);
    this.componentStore.xAxis.setBoundingBoxMatrix({ x: plotX, y: plotY + chartHeight });

    this.componentStore.yAxis.setRange([plotY + chartHeight, plotY]);
    this.componentStore.yAxis.setBoundingBoxMatrix({ x: 0, y: plotY });

    if (this.chartData.plots.some((p) => isBarPlot(p))) {
      this.componentStore.xAxis.recalculateOuterPaddingToDrawBar();
    }
  }

  private calculateHorizonatalSpace() {
    let availableWidth = this.chartConfig.width;
    let availableHeight = this.chartConfig.height;
    let titleYEnd = 0;
    let plotX = 0;
    let plotY = 0;
    let chartWidth = Math.floor((availableWidth * this.chartConfig.plotReservedSpacePercent) / 100);
    let chartHeight = Math.floor(
      (availableHeight * this.chartConfig.plotReservedSpacePercent) / 100
    );
    let spaceUsed = this.componentStore.plot.calculateSpace({
      width: chartWidth,
      height: chartHeight,
    });
    availableWidth -= spaceUsed.width;
    availableHeight -= spaceUsed.height;

    spaceUsed = this.componentStore.title.calculateSpace({
      width: this.chartConfig.width,
      height: availableHeight,
    });
    titleYEnd = spaceUsed.height;
    availableHeight -= spaceUsed.height;
    this.componentStore.xAxis.setAxisPosition('left');
    spaceUsed = this.componentStore.xAxis.calculateSpace({
      width: availableWidth,
      height: availableHeight,
    });
    availableWidth -= spaceUsed.width;
    plotX = spaceUsed.width;
    this.componentStore.yAxis.setAxisPosition('top');
    spaceUsed = this.componentStore.yAxis.calculateSpace({
      width: availableWidth,
      height: availableHeight,
    });
    availableHeight -= spaceUsed.height;
    plotY = titleYEnd + spaceUsed.height;
    if (availableWidth > 0) {
      chartWidth += availableWidth;
      availableWidth = 0;
    }
    if (availableHeight > 0) {
      chartHeight += availableHeight;
      availableHeight = 0;
    }
    this.componentStore.plot.calculateSpace({
      width: chartWidth,
      height: chartHeight,
    });

    this.componentStore.plot.setBoundingBoxMatrix({ x: plotX, y: plotY });
    this.componentStore.backdrop.setBoundingBoxMatrix({ x: plotX, y: plotY });

    this.componentStore.yAxis.setRange([plotX, plotX + chartWidth]);
    this.componentStore.yAxis.setBoundingBoxMatrix({ x: plotX, y: titleYEnd });

    this.componentStore.xAxis.setRange([plotY, plotY + chartHeight]);
    this.componentStore.xAxis.setBoundingBoxMatrix({ x: 0, y: plotY });

    if (this.chartData.plots.some((p) => isBarPlot(p))) {
      this.componentStore.xAxis.recalculateOuterPaddingToDrawBar();
    }
  }

  private calculateSpace() {
    if (this.chartConfig.chartOrientation === 'horizontal') {
      this.calculateHorizonatalSpace();
    } else {
      this.calculateVerticalSpace();
    }
  }

  getDrawableElement() {
    this.calculateSpace();
    const drawableElem: DrawableElem[] = [];

    this.componentStore.plot.setAxes(this.componentStore.xAxis, this.componentStore.yAxis);
    this.componentStore.backdrop.setAxes(this.componentStore.xAxis, this.componentStore.yAxis);

    for (const component of Object.values(this.componentStore)) {
      drawableElem.push(...component.getDrawableElements());
    }
    return drawableElem;
  }
}
