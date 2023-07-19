import { XYChartConfig } from '../../../../config.type.js';
import {
  BoundingRect,
  ChartComponent,
  Dimension,
  DrawableElem,
  Point,
  XYChartData,
  XYChartThemeConfig,
} from '../Interfaces.js';
import {
  ITextDimensionCalculator,
  TextDimensionCalculatorWithFont,
} from '../TextDimensionCalculator.js';

export class ChartTitle implements ChartComponent {
  private boundingRect: BoundingRect;
  private showChartTitle: boolean;
  constructor(
    private textDimensionCalculator: ITextDimensionCalculator,
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
    this.showChartTitle = !!(this.chartData.title && this.chartConfig.showtitle);
  }
  setBoundingBoxXY(point: Point): void {
    this.boundingRect.x = point.x;
    this.boundingRect.y = point.y;
  }
  calculateSpace(availableSpace: Dimension): Dimension {
    const titleDimension = this.textDimensionCalculator.getDimension(
      [this.chartData.title],
      this.chartConfig.titleFontSize
    );
    const widthRequired = Math.max(titleDimension.width, availableSpace.width);
    const heightRequired = titleDimension.height + 2 * this.chartConfig.titlePadding;
    if (
      titleDimension.width <= widthRequired &&
      titleDimension.height <= heightRequired &&
      this.showChartTitle
    ) {
      this.boundingRect.width = widthRequired;
      this.boundingRect.height = heightRequired;
    }

    return {
      width: this.boundingRect.width,
      height: this.boundingRect.height,
    };
  }
  getDrawableElements(): DrawableElem[] {
    const drawableElem: DrawableElem[] = [];
    if (this.boundingRect.height > 0 && this.boundingRect.width > 0) {
      drawableElem.push({
        groupTexts: ['chart-title'],
        type: 'text',
        data: [
          {
            fontSize: this.chartConfig.titleFontSize,
            text: this.chartData.title,
            verticalPos: 'center',
            horizontalPos: 'middle',
            x: this.boundingRect.x + this.boundingRect.width / 2,
            y: this.boundingRect.y + this.boundingRect.height / 2,
            fill: this.chartThemeConfig.xychartTitleColor,
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
  chartThemeConfig: XYChartThemeConfig
): ChartComponent {
  const textDimensionCalculator = new TextDimensionCalculatorWithFont(chartConfig.fontFamily);
  return new ChartTitle(textDimensionCalculator, chartConfig, chartData, chartThemeConfig);
}
