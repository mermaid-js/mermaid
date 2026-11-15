import type { SVGGroup } from '../../../../diagram-api/types.js';
import type {
  BoundingRect,
  ChartComponent,
  Dimension,
  DrawableElem,
  Point,
  XYChartConfig,
  XYChartData,
  XYChartThemeConfig,
} from '../interfaces.js';
import type { TextDimensionCalculator } from '../textDimensionCalculator.js';
import { TextDimensionCalculatorWithFont } from '../textDimensionCalculator.js';

export class ChartTitle implements ChartComponent {
  private boundingRect: BoundingRect;
  private showChartTitle: boolean;
  private titleWidth = 0;
  constructor(
    private textDimensionCalculator: TextDimensionCalculator,
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
    this.showChartTitle = false;
  }
  setBoundingBoxXY(point: Point): void {
    this.boundingRect.x = point.x;
    this.boundingRect.y = point.y;
  }
  calculateSpace(availableSpace: Dimension): Dimension {
    const titleDimension = this.textDimensionCalculator.getMaxDimension(
      [this.chartData.title],
      this.chartConfig.titleFontSize
    );
    const widthRequired = Math.max(titleDimension.width, availableSpace.width);
    const heightRequired = titleDimension.height + 2 * this.chartConfig.titlePadding;
    if (
      heightRequired <= availableSpace.height &&
      this.chartConfig.showTitle &&
      this.chartData.title
    ) {
      this.boundingRect.width = widthRequired;
      this.boundingRect.height = heightRequired;
      this.titleWidth = titleDimension.width;
      this.showChartTitle = true;
    }

    return {
      width: this.boundingRect.width,
      height: this.boundingRect.height,
    };
  }
  /**
   * Centre the title over [start, end], shifted as needed to keep it inside the chart.
   * The title has its own row above the plot and legend, so it may use the full chart width.
   */
  alignTo(start: number, end: number): void {
    const halfWidth = Math.min(this.titleWidth, this.chartConfig.width) / 2;
    const center = Math.min(
      Math.max((start + end) / 2, halfWidth),
      this.chartConfig.width - halfWidth
    );
    this.boundingRect.x = center - halfWidth;
    this.boundingRect.width = halfWidth * 2;
  }
  getDrawableElements(): DrawableElem[] {
    const drawableElem: DrawableElem[] = [];
    if (this.showChartTitle) {
      drawableElem.push({
        groupTexts: ['chart-title'],
        type: 'text',
        data: [
          {
            fontSize: this.chartConfig.titleFontSize,
            text: this.chartData.title,
            verticalPos: 'middle',
            horizontalPos: 'center',
            x: this.boundingRect.x + this.boundingRect.width / 2,
            y: this.boundingRect.y + this.boundingRect.height / 2,
            fill: this.chartThemeConfig.titleColor,
            rotation: 0,
          },
        ],
      });
    }
    return drawableElem;
  }
}

export function getChartTitleComponent(
  chartConfig: XYChartConfig,
  chartData: XYChartData,
  chartThemeConfig: XYChartThemeConfig,
  tmpSVGGroup: SVGGroup
): ChartTitle {
  const textDimensionCalculator = new TextDimensionCalculatorWithFont(tmpSVGGroup);
  return new ChartTitle(textDimensionCalculator, chartConfig, chartData, chartThemeConfig);
}
