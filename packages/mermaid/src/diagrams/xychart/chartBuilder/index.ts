// @ts-ignore: TODO Fix ts errors
import { defaultConfig } from '../../../config.js';
import { log } from '../../../logger.js';
import {
    ChartPlotEnum,
    DrawableElem,
    OrientationEnum,
    XYChartConfig,
    XYChartData
} from './Interfaces.js';
import { Orchestrator } from './Orchestrator.js';

export class XYChartBuilder {
  private config: XYChartConfig;
  private chartData: XYChartData;

  constructor() {
    this.config = {
      width: 700,
      height: 500,
      fontFamily: defaultConfig.fontFamily || 'Sans',
      titleFontSize: 16,
      titleFill: '#000000',
      titlePadding: 5,
      showtitle: true,
      plotBorderWidth: 2,
      yAxis: {
        showLabel: true,
        labelFontSize: 14,
        lablePadding: 5,
        labelFill: '#000000',
        showTitle: true,
        titleFontSize: 16,
        titlePadding: 5,
        titleFill: '#000000',
        showTick: true,
        tickLength: 5,
        tickWidth: 2,
        tickFill: '#000000',
      },
      xAxis: {
        showLabel: true,
        labelFontSize: 14,
        lablePadding: 5,
        labelFill: '#000000',
        showTitle: true,
        titleFontSize: 16,
        titlePadding: 5,
        titleFill: '#000000',
        showTick: true,
        tickLength: 5,
        tickWidth: 2,
        tickFill: '#000000',
      },
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
          type: ChartPlotEnum.BAR,
          data: [
            ['category1', 23],
            ['category2', 56],
            ['category3', 34],
          ],
        },
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
