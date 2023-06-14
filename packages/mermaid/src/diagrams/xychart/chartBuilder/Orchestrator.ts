import { log } from '../../../logger.js';
import { DrawableElem, XYChartConfig, XYChartData } from './Interfaces.js';
import { getChartTitleComponent } from './components/ChartTitle.js';
import { ChartComponent } from './Interfaces.js';
import { IAxis, getAxis } from './components/axis/index.js';
import { IPlot, getPlotComponent } from './components/plot/index.js';

export class Orchestrator {
  private componentStore: {
    title: ChartComponent;
    plot: IPlot;
    xAxis: IAxis;
    yAxis: IAxis;
  };
  constructor(private chartConfig: XYChartConfig, chartData: XYChartData) {
    this.componentStore = {
      title: getChartTitleComponent(chartConfig, chartData),
      plot: getPlotComponent(chartConfig, chartData),
      xAxis: getAxis(chartData.xAxis, chartConfig.xAxis),
      yAxis: getAxis(chartData.yAxis, chartConfig.yAxis),
    };
  }

  private calculateSpace() {
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
    const plotBorderWidthHalf = this.chartConfig.plotBorderWidth/2;
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
