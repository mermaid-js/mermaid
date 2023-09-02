import { log } from '../../../logger.js';
import type { DrawableElem, XYChartData, XYChartThemeConfig, XYChartConfig } from './Interfaces.js';
import { isBarPlot } from './Interfaces.js';
import { getChartTitleComponent } from './components/ChartTitle.js';
import type { ChartComponent } from './Interfaces.js';
import type { Axis } from './components/axis/index.js';
import { getAxis } from './components/axis/index.js';
import type { Plot } from './components/plot/index.js';
import { getPlotComponent } from './components/plot/index.js';
import type { SVGGType } from '../xychartDb.js';

export class Orchestrator {
  private componentStore: {
    title: ChartComponent;
    plot: Plot;
    xAxis: Axis;
    yAxis: Axis;
  };
  constructor(
    private chartConfig: XYChartConfig,
    private chartData: XYChartData,
    chartThemeConfig: XYChartThemeConfig,
    tmpSVGGElem: SVGGType
  ) {
    this.componentStore = {
      title: getChartTitleComponent(chartConfig, chartData, chartThemeConfig, tmpSVGGElem),
      plot: getPlotComponent(chartConfig, chartData, chartThemeConfig),
      xAxis: getAxis(
        chartData.xAxis,
        chartConfig.xAxis,
        {
          titleColor: chartThemeConfig.xAxisTitleColor,
          labelColor: chartThemeConfig.xAxisLableColor,
          tickColor: chartThemeConfig.xAxisTickColor,
        },
        tmpSVGGElem
      ),
      yAxis: getAxis(
        chartData.yAxis,
        chartConfig.yAxis,
        {
          titleColor: chartThemeConfig.yAxisTitleColor,
          labelColor: chartThemeConfig.yAxisLableColor,
          tickColor: chartThemeConfig.yAxisTickColor,
        },
        tmpSVGGElem
      ),
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
    log.trace('space used by title: ', spaceUsed);
    plotY = spaceUsed.height;
    availableHeight -= spaceUsed.height;
    this.componentStore.xAxis.setAxisPosition('bottom');
    spaceUsed = this.componentStore.xAxis.calculateSpace({
      width: availableWidth,
      height: availableHeight,
    });
    log.trace('space used by xaxis: ', spaceUsed);
    availableHeight -= spaceUsed.height;
    this.componentStore.yAxis.setAxisPosition('left');
    spaceUsed = this.componentStore.yAxis.calculateSpace({
      width: availableWidth,
      height: availableHeight,
    });
    log.trace('space used by yaxis: ', spaceUsed);
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
    const plotBorderWidthHalf = this.chartConfig.plotBorderWidth / 2;
    plotX += plotBorderWidthHalf;
    plotY += plotBorderWidthHalf;
    chartWidth -= this.chartConfig.plotBorderWidth;
    chartHeight -= this.chartConfig.plotBorderWidth;
    this.componentStore.plot.calculateSpace({
      width: chartWidth,
      height: chartHeight,
    });

    log.trace(
      `Final chart dimansion: x = ${plotX}, y = ${plotY}, width = ${chartWidth}, height = ${chartHeight}`
    );

    this.componentStore.plot.setBoundingBoxXY({ x: plotX, y: plotY });
    this.componentStore.xAxis.setRange([plotX, plotX + chartWidth]);
    this.componentStore.xAxis.setBoundingBoxXY({ x: plotX, y: plotY + chartHeight });
    this.componentStore.yAxis.setRange([plotY, plotY + chartHeight]);
    this.componentStore.yAxis.setBoundingBoxXY({ x: 0, y: plotY });
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
    log.trace('space used by title: ', spaceUsed);
    titleYEnd = spaceUsed.height;
    availableHeight -= spaceUsed.height;
    this.componentStore.xAxis.setAxisPosition('left');
    spaceUsed = this.componentStore.xAxis.calculateSpace({
      width: availableWidth,
      height: availableHeight,
    });
    availableWidth -= spaceUsed.width;
    plotX = spaceUsed.width;
    log.trace('space used by xaxis: ', spaceUsed);
    this.componentStore.yAxis.setAxisPosition('top');
    spaceUsed = this.componentStore.yAxis.calculateSpace({
      width: availableWidth,
      height: availableHeight,
    });
    log.trace('space used by yaxis: ', spaceUsed);
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
    const plotBorderWidthHalf = this.chartConfig.plotBorderWidth / 2;
    plotX += plotBorderWidthHalf;
    plotY += plotBorderWidthHalf;
    chartWidth -= this.chartConfig.plotBorderWidth;
    chartHeight -= this.chartConfig.plotBorderWidth;
    this.componentStore.plot.calculateSpace({
      width: chartWidth,
      height: chartHeight,
    });

    log.trace(
      `Final chart dimansion: x = ${plotX}, y = ${plotY}, width = ${chartWidth}, height = ${chartHeight}`
    );

    this.componentStore.plot.setBoundingBoxXY({ x: plotX, y: plotY });
    this.componentStore.yAxis.setRange([plotX, plotX + chartWidth]);
    this.componentStore.yAxis.setBoundingBoxXY({ x: plotX, y: titleYEnd });
    this.componentStore.xAxis.setRange([plotY, plotY + chartHeight]);
    this.componentStore.xAxis.setBoundingBoxXY({ x: 0, y: plotY });
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
    for (const component of Object.values(this.componentStore)) {
      drawableElem.push(...component.getDrawableElements());
    }
    return drawableElem;
  }
}
