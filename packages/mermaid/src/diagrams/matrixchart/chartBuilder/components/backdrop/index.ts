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
import { Backdrop } from './backdrop.js';

export interface BackdropPlot extends ChartComponent {
  setAxes(xAxis: Axis, yAxis: Axis): void;
}

export class BaseBackdrop implements BackdropPlot {
  private boundingRect: BoundingRect;
  private xAxis?: Axis;
  private yAxis?: Axis;

  constructor(
    private chartConfig: MatrixChartConfig,
    private chartData: MatrixChartData,
    private chartThemeConfig: MatrixChartThemeConfig,
    private colorConfig: object
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
    this.chartData.plots = [];

    this.chartData.xAxis.categories.forEach((a) => {
      this.chartData.yAxis.categories.forEach((b) => {
        const backdrop = new Backdrop(
          {
            type: 'bar',
            // @ts-ignore: TODO Fix ts errors
            fill: this.colorConfig[`${a}-${b}`],
            data: [[a, b]],
          },
          this.boundingRect,
          this.chartConfig.chartOrientation,
          `${a}-${b}`,
          this.xAxis,
          this.yAxis
        );
        drawableElem.push(...backdrop.getDrawableElement());
      });
    });

    return drawableElem;
  }
}

export function getBackdropComponent(
  chartConfig: MatrixChartConfig,
  chartData: MatrixChartData,
  chartThemeConfig: MatrixChartThemeConfig,
  colorConfig: object
): BaseBackdrop {
  return new BaseBackdrop(chartConfig, chartData, chartThemeConfig, colorConfig);
}
