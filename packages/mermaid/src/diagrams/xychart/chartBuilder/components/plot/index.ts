import type {
  XYChartData,
  Dimension,
  BoundingRect,
  DrawableElem,
  Point,
  XYChartThemeConfig,
  XYChartConfig,
} from '../../interfaces.js';
import type { Axis } from '../axis/index.js';
import type { ChartComponent } from '../../interfaces.js';
import { LinePlot } from './linePlot.js';
import { BarPlot } from './barPlot.js';

export interface Plot extends ChartComponent {
  setAxes(xAxis: Axis, yAxis: Axis): void;
}

export class BasePlot implements Plot {
  private boundingRect: BoundingRect;
  private xAxis?: Axis;
  private yAxis?: Axis;

  constructor(
    private chartConfig: XYChartConfig,
    private chartData: XYChartData,
    private chartThemeConfig: XYChartThemeConfig
  ) {
    this.boundingRect = {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    };
  }
  setAxes(xAxis: Axis, yAxis: Axis) {
    this.xAxis = xAxis;
    this.yAxis = yAxis;
  }
  setBoundingBoxXY(point: Point): void {
    this.boundingRect.x = point.x;
    this.boundingRect.y = point.y;
  }
  calculateSpace(availableSpace: Dimension): Dimension {
    this.boundingRect.width = availableSpace.width;
    this.boundingRect.height = availableSpace.height;

    return {
      width: this.boundingRect.width,
      height: this.boundingRect.height,
    };
  }
  getDrawableElements(): DrawableElem[] {
    if (!(this.xAxis && this.yAxis)) {
      throw Error('Axes must be passed to render Plots');
    }
    const drawableElem: DrawableElem[] = [];
    for (const [i, plot] of this.chartData.plots.entries()) {
      switch (plot.type) {
        case 'line':
          {
            const linePlot = new LinePlot(
              plot,
              this.xAxis,
              this.yAxis,
              this.chartConfig.chartOrientation,
              i
            );
            drawableElem.push(...linePlot.getDrawableElement());
          }
          break;
        case 'bar':
          {
            const barPlot = new BarPlot(
              plot,
              this.boundingRect,
              this.xAxis,
              this.yAxis,
              this.chartConfig.chartOrientation,
              i
            );
            drawableElem.push(...barPlot.getDrawableElement());
          }
          break;
      }
    }
    return drawableElem;
  }
}

export function getPlotComponent(
  chartConfig: XYChartConfig,
  chartData: XYChartData,
  chartThemeConfig: XYChartThemeConfig
): Plot {
  return new BasePlot(chartConfig, chartData, chartThemeConfig);
}
