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

    // Each distinct bar group is a side-by-side slot. Series that share a group
    // stack on top of each other within that slot. Groups are ordered by first
    // appearance so slots follow the order the bars were declared.
    const groupOrder: string[] = [];
    for (const plot of this.chartData.plots) {
      if (isBarPlot(plot) && !groupOrder.includes(plot.group)) {
        groupOrder.push(plot.group);
      }
    }
    const totalGroups = groupOrder.length;

    // Running cumulative baseline per category for each group's stack, plus how
    // many series of the group have been drawn so far.
    const groupBaselines = new Map<string, number[]>();
    const groupSeriesCount = new Map<string, number>();

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
            const { group } = plot;
            const groupSlot = groupOrder.indexOf(group);
            let baseline = groupBaselines.get(group);
            if (!baseline) {
              baseline = new Array(plot.data.length).fill(0);
              groupBaselines.set(group, baseline);
            }
            const seriesDrawn = groupSeriesCount.get(group) ?? 0;
            // The first series of a group draws from the axis floor (non-stacked
            // rendering); later series stack on the running baseline.
            const stackedBase = seriesDrawn === 0 ? [] : [...baseline];
            const barPlot = new BarPlot(
              plot,
              this.boundingRect,
              this.xAxis,
              this.yAxis,
              this.chartConfig.chartOrientation,
              i,
              stackedBase,
              groupSlot,
              totalGroups
            );
            drawableElem.push(...barPlot.getDrawableElement());

            plot.data.forEach((d, idx) => {
              baseline[idx] += d[1];
            });
            groupSeriesCount.set(group, seriesDrawn + 1);
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
