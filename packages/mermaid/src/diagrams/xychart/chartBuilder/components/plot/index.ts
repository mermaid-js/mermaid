import { isBarPlot } from '../../interfaces.js';
import type {
  XYChartData,
  Dimension,
  BoundingRect,
  DrawableElem,
  Point,
  XYChartThemeConfig,
  XYChartConfig,
  ChartComponent,
} from '../../interfaces.js';
import type { Axis } from '../axis/index.js';
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
    private _chartThemeConfig: XYChartThemeConfig
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

    const dataLength = this.chartData.plots.length > 0 ? this.chartData.plots[0].data.length : 0;

    // --- Stacked bar tracking ---
    // Cumulative baselines per category for stacked bars only.
    const stackedCumulativeValues: number[] = new Array(dataLength).fill(0);
    let stackedBarCount = 0;

    // --- Side-by-side (grouped) bar tracking ---
    // Count total non-stacked bar series upfront so we can divide bar width evenly.
    const totalGroupedBars = this.chartData.plots.filter((p) => isBarPlot(p) && !p.stacked).length;
    let groupedBarIndex = 0;

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
            if (isBarPlot(plot) && plot.stacked) {
              // Stacked path: first stacked series uses empty base (original behavior),
              // subsequent stacked series stack on top of previous.
              const stackedBase = stackedBarCount === 0 ? [] : [...stackedCumulativeValues];
              const barPlot = new BarPlot(
                plot,
                this.boundingRect,
                this.xAxis,
                this.yAxis,
                this.chartConfig.chartOrientation,
                i,
                stackedBase,
                0,
                1
              );
              drawableElem.push(...barPlot.getDrawableElement());

              plot.data.forEach((d, idx) => {
                stackedCumulativeValues[idx] += d[1];
              });
              stackedBarCount++;
            } else {
              // Grouped (side-by-side) path: bars share the tick space, each offset by slot.
              const barPlot = new BarPlot(
                plot,
                this.boundingRect,
                this.xAxis,
                this.yAxis,
                this.chartConfig.chartOrientation,
                i,
                [],
                groupedBarIndex,
                totalGroupedBars
              );
              drawableElem.push(...barPlot.getDrawableElement());
              groupedBarIndex++;
            }
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
