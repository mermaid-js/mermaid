import { log } from '../../../logger.js';
import { DrawableElem, XYChartData, XYChartThemeConfig, isBarPlot } from './Interfaces.js';
import { getChartTitleComponent } from './components/ChartTitle.js';
import { ChartComponent } from './Interfaces.js';
import { IAxis, getAxis } from './components/axis/index.js';
import { IPlot, getPlotComponent } from './components/plot/index.js';
import { XYChartConfig } from '../../../config.type.js';

export class Orchestrator {
  private componentStore: {
    title: ChartComponent;
    plot: IPlot;
    xAxis: IAxis;
    yAxis: IAxis;
  };
  constructor(
    private chartConfig: XYChartConfig,
    private chartData: XYChartData,
    private chartThemeConfig: XYChartThemeConfig
  ) {
    this.componentStore = {
      title: getChartTitleComponent(chartConfig, chartData, chartThemeConfig),
      plot: getPlotComponent(chartConfig, chartData, chartThemeConfig),
      xAxis: getAxis(
        chartData.xAxis,
        chartConfig.xAxis,
        {
          titleColor: chartThemeConfig.xychartXAxisTitleColor,
          labelColor: chartThemeConfig.xychartXAxisLableColor,
          tickColor: chartThemeConfig.xychartXAxisTickColor,
        },
        chartConfig.fontFamily
      ),
      yAxis: getAxis(
        chartData.yAxis,
        chartConfig.yAxis,
        {
          titleColor: chartThemeConfig.xychartYAxisTitleColor,
          labelColor: chartThemeConfig.xychartYAxisLableColor,
          tickColor: chartThemeConfig.xychartYAxisTickColor,
        },
        chartConfig.fontFamily
      ),
    };
  }

  private calculateVerticalSpace() {
    let availableWidth = this.chartConfig.width;
    let availableHeight = this.chartConfig.height;
    let chartX = 0;
    let chartY = 0;
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
    chartY = spaceUsed.height;
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
    chartX = spaceUsed.width;
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
    chartX += plotBorderWidthHalf;
    chartY += plotBorderWidthHalf;
    chartWidth -= this.chartConfig.plotBorderWidth;
    chartHeight -= this.chartConfig.plotBorderWidth;
    this.componentStore.plot.calculateSpace({
      width: chartWidth,
      height: chartHeight,
    });

    log.trace(
      `Final chart dimansion: x = ${chartX}, y = ${chartY}, width = ${chartWidth}, height = ${chartHeight}`
    );

    this.componentStore.plot.setBoundingBoxXY({ x: chartX, y: chartY });
    this.componentStore.xAxis.setRange([chartX, chartX + chartWidth]);
    this.componentStore.xAxis.setBoundingBoxXY({ x: chartX, y: chartY + chartHeight });
    this.componentStore.yAxis.setRange([chartY, chartY + chartHeight]);
    this.componentStore.yAxis.setBoundingBoxXY({ x: 0, y: chartY });
    if (this.chartData.plots.some((p) => isBarPlot(p))) {
      this.componentStore.xAxis.recalculateOuterPaddingToDrawBar();
    }
  }

  private calculateHorizonatalSpace() {
    let availableWidth = this.chartConfig.width;
    let availableHeight = this.chartConfig.height;
    let titleYEnd = 0;
    let chartX = 0;
    let chartY = 0;
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
    chartX = spaceUsed.width;
    log.trace('space used by xaxis: ', spaceUsed);
    this.componentStore.yAxis.setAxisPosition('top');
    spaceUsed = this.componentStore.yAxis.calculateSpace({
      width: availableWidth,
      height: availableHeight,
    });
    log.trace('space used by yaxis: ', spaceUsed);
    availableHeight -= spaceUsed.height;
    chartY = titleYEnd + spaceUsed.height;
    if (availableWidth > 0) {
      chartWidth += availableWidth;
      availableWidth = 0;
    }
    if (availableHeight > 0) {
      chartHeight += availableHeight;
      availableHeight = 0;
    }
    const plotBorderWidthHalf = this.chartConfig.plotBorderWidth / 2;
    chartX += plotBorderWidthHalf;
    chartY += plotBorderWidthHalf;
    chartWidth -= this.chartConfig.plotBorderWidth;
    chartHeight -= this.chartConfig.plotBorderWidth;
    this.componentStore.plot.calculateSpace({
      width: chartWidth,
      height: chartHeight,
    });

    log.trace(
      `Final chart dimansion: x = ${chartX}, y = ${chartY}, width = ${chartWidth}, height = ${chartHeight}`
    );

    this.componentStore.plot.setBoundingBoxXY({ x: chartX, y: chartY });
    this.componentStore.yAxis.setRange([chartX, chartX + chartWidth]);
    this.componentStore.yAxis.setBoundingBoxXY({ x: chartX, y: titleYEnd });
    this.componentStore.xAxis.setRange([chartY, chartY + chartHeight]);
    this.componentStore.xAxis.setBoundingBoxXY({ x: 0, y: chartY });
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
