import type { SVGGroup } from '../../../../diagram-api/types.js';
import type {
  ChartComponent,
  Dimension,
  DrawableElem,
  PathElem,
  PlotData,
  Point,
  RectElem,
  XYChartConfig,
  XYChartData,
  XYChartThemeConfig,
} from '../interfaces.js';
import { isBarPlot } from '../interfaces.js';
import type { TextDimensionCalculator } from '../textDimensionCalculator.js';
import { TextDimensionCalculatorWithFont } from '../textDimensionCalculator.js';

const LEGEND_MARKER_TO_FONT_RATIO = 0.75;
const LEGEND_ITEM_SPACING_TO_FONT_RATIO = 0.5;
const LEGEND_MARKER_SPACING_TO_FONT_RATIO = 0.35;

interface LegendLayout {
  fontSize: number;
  markerSize: number;
  markerSpacing: number;
  itemSpacing: number;
}

function getLegendLayout(fontSize: number): LegendLayout {
  return {
    fontSize,
    markerSize: fontSize * LEGEND_MARKER_TO_FONT_RATIO,
    markerSpacing: fontSize * LEGEND_MARKER_SPACING_TO_FONT_RATIO,
    itemSpacing: fontSize * LEGEND_ITEM_SPACING_TO_FONT_RATIO,
  };
}

export class ChartLegend implements ChartComponent {
  private boundingRect = { x: 0, y: 0, width: 0, height: 0 };
  private visiblePlots: PlotData[] = [];

  constructor(
    private textDimensionCalculator: TextDimensionCalculator,
    private chartConfig: XYChartConfig,
    private chartData: XYChartData,
    private chartThemeConfig: XYChartThemeConfig
  ) {}

  setBoundingBoxXY(point: Point): void {
    this.boundingRect.x = point.x;
    this.boundingRect.y = point.y;
  }

  calculateSpace(availableSpace: Dimension): Dimension {
    this.visiblePlots = this.chartConfig.showLegend
      ? this.chartData.plots.filter((plot) => plot.title)
      : [];

    if (this.visiblePlots.length === 0) {
      this.boundingRect.width = 0;
      this.boundingRect.height = 0;
      return { width: 0, height: 0 };
    }

    const { fontSize, markerSize, markerSpacing, itemSpacing } = getLegendLayout(
      this.chartConfig.legendFontSize
    );
    const textDimension = this.textDimensionCalculator.getMaxDimension(
      this.visiblePlots.map((plot) => plot.title),
      fontSize
    );

    const widthRequired =
      this.chartConfig.legendPadding * 2 + markerSize + markerSpacing + textDimension.width;
    const heightRequired =
      this.chartConfig.legendPadding * 2 +
      this.visiblePlots.length * fontSize +
      (this.visiblePlots.length - 1) * itemSpacing;

    if (widthRequired <= availableSpace.width && heightRequired <= availableSpace.height) {
      this.boundingRect.width = widthRequired;
      this.boundingRect.height = heightRequired;
    } else {
      this.visiblePlots = [];
      this.boundingRect.width = 0;
      this.boundingRect.height = 0;
    }

    return {
      width: this.boundingRect.width,
      height: this.boundingRect.height,
    };
  }

  getDrawableElements(): DrawableElem[] {
    if (this.visiblePlots.length === 0) {
      return [];
    }

    const { fontSize, markerSize, markerSpacing, itemSpacing } = getLegendLayout(
      this.chartConfig.legendFontSize
    );
    const rowHeight = fontSize + itemSpacing;
    const startX = this.boundingRect.x + this.chartConfig.legendPadding;
    const startY = this.boundingRect.y + this.chartConfig.legendPadding;
    const barMarkers: RectElem[] = [];
    const lineMarkers: PathElem[] = [];

    for (const [index, plot] of this.visiblePlots.entries()) {
      if (isBarPlot(plot)) {
        barMarkers.push({
          x: startX,
          y: startY + index * rowHeight,
          width: markerSize,
          height: markerSize,
          fill: plot.fill,
          strokeFill: plot.fill,
          strokeWidth: 0,
        });
      } else {
        const markerY = startY + index * rowHeight + markerSize / 2;
        lineMarkers.push({
          path: `M ${startX},${markerY} L ${startX + markerSize},${markerY}`,
          strokeFill: plot.strokeFill,
          strokeWidth: plot.strokeWidth,
        });
      }
    }

    return [
      {
        groupTexts: ['legend', 'markers'],
        type: 'rect',
        data: barMarkers,
      },
      {
        groupTexts: ['legend', 'markers'],
        type: 'path',
        data: lineMarkers,
      },
      {
        groupTexts: ['legend', 'label'],
        type: 'text',
        data: this.visiblePlots.map((plot, index) => ({
          text: plot.title,
          x: startX + markerSize + markerSpacing,
          y: startY + index * rowHeight + markerSize / 2,
          fill: this.chartThemeConfig.legendTextColor,
          fontSize,
          rotation: 0,
          verticalPos: 'middle',
          horizontalPos: 'left',
        })),
      },
    ];
  }
}

export function getChartLegendComponent(
  chartConfig: XYChartConfig,
  chartData: XYChartData,
  chartThemeConfig: XYChartThemeConfig,
  tmpSVGGroup: SVGGroup
): ChartComponent {
  const textDimensionCalculator = new TextDimensionCalculatorWithFont(tmpSVGGroup);
  return new ChartLegend(textDimensionCalculator, chartConfig, chartData, chartThemeConfig);
}
