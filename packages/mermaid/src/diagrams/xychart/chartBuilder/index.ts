// @ts-ignore: TODO Fix ts errors
import { defaultConfig } from '../../../config.js';
import { log } from '../../../logger.js';
import {
  ChartPlotEnum,
  DrawableElem,
  XYChartConfig,
  XYChartData,
  OrientationEnum,
  XYChartYAxisPosition,
} from './Interfaces.js';
import { Orchestrator } from './Orchestrator.js';

export class XYChartBuilder {
  private config: XYChartConfig;
  private chartData: XYChartData;

  constructor() {
    this.config = {
      width: 500,
      height: 500,
      fontFamily: defaultConfig.fontFamily || 'Sans',
      titleFontSize: 16,
      titleFill: '#000000',
      titlePadding: 5,
      xAxisFontSize: 14,
      xAxisTitleFontSize: 16,
      yAxisFontSize: 14,
      yAxisTitleFontSize: 16,
      yAxisPosition: XYChartYAxisPosition.LEFT,
      showChartTitle: true,
      showXAxisLable: true,
      showXAxisTitle: true,
      showYAxisLabel: true,
      showYAxisTitle: true,
      chartOrientation: OrientationEnum.HORIZONTAL,
      plotReservedSpacePercent: 50,
    };
    this.chartData = {
      yAxis: {
        title: 'yAxis1',
        min: 0,
        max: 100,
      },
      xAxis: {
        title: 'xAxis',
        categories: ['category1', 'category2', 'category3'],
      },
      title: 'this is a sample task',
      plots: [
        {
          type: ChartPlotEnum.LINE,
          data: [
            ['category1', 33],
            ['category2', 45],
            ['category3', 65],
          ],
        },
      ],
    };
  }

  setWidth(width: number) {
    this.config.width = width;
  }

  setHeight(height: number) {
    this.config.height = height;
  }

  build(): DrawableElem[] {
    log.trace(`Build start with Config: ${JSON.stringify(this.config, null, 2)}`);
    log.trace(`Build start with ChartData: ${JSON.stringify(this.chartData, null, 2)}`);
    const orchestrator = new Orchestrator(this.config, this.chartData);
    return orchestrator.getDrawableElement();
  }
}
