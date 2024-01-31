import type {
  MatrixChartData,
  Dimension,
  BoundingRect,
  DrawableElem,
  Point,
  MatrixChartThemeConfig,
  MatrixChartConfig,
} from '../../interfaces.js';
import type { Axis } from '../axis/index.js';
import type { ChartComponent } from '../../interfaces.js';
import { BarPlot } from './barPlot.js';

export interface Plot extends ChartComponent {
  setAxes(xAxis: Axis, yAxis: Axis): void;
}

export class BasePlot implements Plot {
  private boundingRect: BoundingRect;
  private xAxis?: Axis;
  private yAxis?: Axis;

  constructor(
    private chartConfig: MatrixChartConfig,
    private chartData: MatrixChartData,
    private chartThemeConfig: MatrixChartThemeConfig
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
  setBoundingBoxMatrix(point: Point): void {
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
    return drawableElem;
  }
}

export function getPlotComponent(
  chartConfig: MatrixChartConfig,
  chartData: MatrixChartData,
  chartThemeConfig: MatrixChartThemeConfig
): Plot {
  return new BasePlot(chartConfig, chartData, chartThemeConfig);
}
