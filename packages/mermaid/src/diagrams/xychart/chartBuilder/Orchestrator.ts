import { DrawableElem, XYChartConfig, XYChartData } from './Interfaces.js';
import { getChartTitleComponent } from './components/ChartTitle.js';
import { ChartComponent } from './components/Interfaces.js';
import { IAxis, getAxis } from './components/axis/index.js';
import { IPlot, getPlotComponent, isTypeIPlot } from './components/plot/index.js';

export class Orchestrator {
  private componentStore: {
    title: ChartComponent,
    plot: IPlot,
    xAxis: IAxis,
    yAxis: IAxis,
  };
  constructor(private chartConfig: XYChartConfig, chartData: XYChartData) {
    this.componentStore = {
      title: getChartTitleComponent(chartConfig, chartData),
      plot: getPlotComponent(chartConfig, chartData),
      xAxis: getAxis(chartData.xAxis, chartConfig),
      yAxis: getAxis(chartData.yAxis, chartConfig),
    };
  }

  private calculateSpace() {
    let availableWidth = this.chartConfig.width;
    let availableHeight = this.chartConfig.height;
    let chartX = 0;
    let chartY = 0;
    const chartWidth = Math.floor((availableWidth * this.chartConfig.plotReservedSpacePercent) / 100);
    const chartHeight =  Math.floor((availableHeight * this.chartConfig.plotReservedSpacePercent) / 100);

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
    chartY = spaceUsed.height;
    availableWidth -= spaceUsed.width;
    availableHeight -= spaceUsed.height;
    //
    // spaceUsed = this.componentStore.xAxis.calculateSpace({
    //   width: availableWidth,
    //   height: availableHeight,
    // });
    // availableWidth -= spaceUsed.width;
    // availableHeight -= spaceUsed.height;
    this.componentStore.plot.setBoundingBoxXY({x: chartX, y: chartY});
    this.componentStore.xAxis.setRange([chartX, chartX + chartWidth]);
    this.componentStore.yAxis.setRange([chartY, chartY + chartHeight]);
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
