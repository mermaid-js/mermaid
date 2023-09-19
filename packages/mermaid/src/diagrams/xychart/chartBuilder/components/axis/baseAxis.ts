import type {
  BoundingRect,
  Dimension,
  DrawableElem,
  Point,
  XYChartAxisConfig,
  XYChartAxisThemeConfig,
} from '../../interfaces.js';
import type { TextDimensionCalculator } from '../../textDimensionCalculator.js';
import type { Axis, AxisPosition } from './index.js';

const BAR_WIDTH_TO_TICK_WIDTH_RATIO = 0.7;
const MAX_OUTER_PADDING_PERCENT_FOR_WRT_LABEL = 0.2;

export abstract class BaseAxis implements Axis {
  protected boundingRect: BoundingRect = { x: 0, y: 0, width: 0, height: 0 };
  protected axisPosition: AxisPosition = 'left';
  private range: [number, number];
  protected showTitle = false;
  protected showLabel = false;
  protected showTick = false;
  protected showAxisLine = false;
  protected outerPadding = 0;
  protected titleTextHeight = 0;
  protected labelTextHeight = 0;

  constructor(
    protected axisConfig: XYChartAxisConfig,
    protected title: string,
    protected textDimensionCalculator: TextDimensionCalculator,
    protected axisThemeConfig: XYChartAxisThemeConfig
  ) {
    this.range = [0, 10];
    this.boundingRect = { x: 0, y: 0, width: 0, height: 0 };
    this.axisPosition = 'left';
  }

  setRange(range: [number, number]): void {
    this.range = range;
    if (this.axisPosition === 'left' || this.axisPosition === 'right') {
      this.boundingRect.height = range[1] - range[0];
    } else {
      this.boundingRect.width = range[1] - range[0];
    }
    this.recalculateScale();
  }

  getRange(): [number, number] {
    return [this.range[0] + this.outerPadding, this.range[1] - this.outerPadding];
  }

  setAxisPosition(axisPosition: AxisPosition): void {
    this.axisPosition = axisPosition;
    this.setRange(this.range);
  }

  abstract getScaleValue(value: number | string): number;

  abstract recalculateScale(): void;

  abstract getTickValues(): Array<string | number>;

  getTickDistance(): number {
    const range = this.getRange();
    return Math.abs(range[0] - range[1]) / this.getTickValues().length;
  }

  getAxisOuterPadding(): number {
    return this.outerPadding;
  }

  private getLabelDimension(): Dimension {
    return this.textDimensionCalculator.getMaxDimension(
      this.getTickValues().map((tick) => tick.toString()),
      this.axisConfig.labelFontSize
    );
  }

  recalculateOuterPaddingToDrawBar(): void {
    if (BAR_WIDTH_TO_TICK_WIDTH_RATIO * this.getTickDistance() > this.outerPadding * 2) {
      this.outerPadding = Math.floor((BAR_WIDTH_TO_TICK_WIDTH_RATIO * this.getTickDistance()) / 2);
    }
    this.recalculateScale();
  }

  private calculateSpaceIfDrawnHorizontally(availableSpace: Dimension) {
    let availableHeight = availableSpace.height;
    if (this.axisConfig.showAxisLine && availableHeight > this.axisConfig.axisLineWidth) {
      availableHeight -= this.axisConfig.axisLineWidth;
      this.showAxisLine = true;
    }
    if (this.axisConfig.showLabel) {
      const spaceRequired = this.getLabelDimension();
      const maxPadding = MAX_OUTER_PADDING_PERCENT_FOR_WRT_LABEL * availableSpace.width;
      this.outerPadding = Math.min(spaceRequired.width / 2, maxPadding);

      const heightRequired = spaceRequired.height + this.axisConfig.labelPadding * 2;
      this.labelTextHeight = spaceRequired.height;
      if (heightRequired <= availableHeight) {
        availableHeight -= heightRequired;
        this.showLabel = true;
      }
    }
    if (this.axisConfig.showTick && availableHeight >= this.axisConfig.tickLength) {
      this.showTick = true;
      availableHeight -= this.axisConfig.tickLength;
    }
    if (this.axisConfig.showTitle && this.title) {
      const spaceRequired = this.textDimensionCalculator.getMaxDimension(
        [this.title],
        this.axisConfig.titleFontSize
      );
      const heightRequired = spaceRequired.height + this.axisConfig.titlePadding * 2;
      this.titleTextHeight = spaceRequired.height;
      if (heightRequired <= availableHeight) {
        availableHeight -= heightRequired;
        this.showTitle = true;
      }
    }
    this.boundingRect.width = availableSpace.width;
    this.boundingRect.height = availableSpace.height - availableHeight;
  }

  private calculateSpaceIfDrawnVertical(availableSpace: Dimension) {
    let availableWidth = availableSpace.width;
    if (this.axisConfig.showAxisLine && availableWidth > this.axisConfig.axisLineWidth) {
      availableWidth -= this.axisConfig.axisLineWidth;
      this.showAxisLine = true;
    }
    if (this.axisConfig.showLabel) {
      const spaceRequired = this.getLabelDimension();
      const maxPadding = MAX_OUTER_PADDING_PERCENT_FOR_WRT_LABEL * availableSpace.height;
      this.outerPadding = Math.min(spaceRequired.height / 2, maxPadding);
      const widthRequired = spaceRequired.width + this.axisConfig.labelPadding * 2;
      if (widthRequired <= availableWidth) {
        availableWidth -= widthRequired;
        this.showLabel = true;
      }
    }
    if (this.axisConfig.showTick && availableWidth >= this.axisConfig.tickLength) {
      this.showTick = true;
      availableWidth -= this.axisConfig.tickLength;
    }
    if (this.axisConfig.showTitle && this.title) {
      const spaceRequired = this.textDimensionCalculator.getMaxDimension(
        [this.title],
        this.axisConfig.titleFontSize
      );
      const widthRequired = spaceRequired.height + this.axisConfig.titlePadding * 2;
      this.titleTextHeight = spaceRequired.height;
      if (widthRequired <= availableWidth) {
        availableWidth -= widthRequired;
        this.showTitle = true;
      }
    }
    this.boundingRect.width = availableSpace.width - availableWidth;
    this.boundingRect.height = availableSpace.height;
  }

  calculateSpace(availableSpace: Dimension): Dimension {
    if (this.axisPosition === 'left' || this.axisPosition === 'right') {
      this.calculateSpaceIfDrawnVertical(availableSpace);
    } else {
      this.calculateSpaceIfDrawnHorizontally(availableSpace);
    }
    this.recalculateScale();
    return {
      width: this.boundingRect.width,
      height: this.boundingRect.height,
    };
  }

  setBoundingBoxXY(point: Point): void {
    this.boundingRect.x = point.x;
    this.boundingRect.y = point.y;
  }

  private getDrawableElementsForLeftAxis(): DrawableElem[] {
    const drawableElement: DrawableElem[] = [];
    if (this.showAxisLine) {
      const x = this.boundingRect.x + this.boundingRect.width - this.axisConfig.axisLineWidth / 2;
      drawableElement.push({
        type: 'path',
        groupTexts: ['left-axis', 'axisl-line'],
        data: [
          {
            path: `M ${x},${this.boundingRect.y} L ${x},${
              this.boundingRect.y + this.boundingRect.height
            } `,
            strokeFill: this.axisThemeConfig.axisLineColor,
            strokeWidth: this.axisConfig.axisLineWidth,
          },
        ],
      });
    }
    if (this.showLabel) {
      drawableElement.push({
        type: 'text',
        groupTexts: ['left-axis', 'label'],
        data: this.getTickValues().map((tick) => ({
          text: tick.toString(),
          x:
            this.boundingRect.x +
            this.boundingRect.width -
            (this.showLabel ? this.axisConfig.labelPadding : 0) -
            (this.showTick ? this.axisConfig.tickLength : 0) -
            (this.showAxisLine ? this.axisConfig.axisLineWidth : 0),
          y: this.getScaleValue(tick),
          fill: this.axisThemeConfig.labelColor,
          fontSize: this.axisConfig.labelFontSize,
          rotation: 0,
          verticalPos: 'middle',
          horizontalPos: 'right',
        })),
      });
    }
    if (this.showTick) {
      const x =
        this.boundingRect.x +
        this.boundingRect.width -
        (this.showAxisLine ? this.axisConfig.axisLineWidth : 0);
      drawableElement.push({
        type: 'path',
        groupTexts: ['left-axis', 'ticks'],
        data: this.getTickValues().map((tick) => ({
          path: `M ${x},${this.getScaleValue(tick)} L ${
            x - this.axisConfig.tickLength
          },${this.getScaleValue(tick)}`,
          strokeFill: this.axisThemeConfig.tickColor,
          strokeWidth: this.axisConfig.tickWidth,
        })),
      });
    }
    if (this.showTitle) {
      drawableElement.push({
        type: 'text',
        groupTexts: ['left-axis', 'title'],
        data: [
          {
            text: this.title,
            x: this.boundingRect.x + this.axisConfig.titlePadding,
            y: this.boundingRect.y + this.boundingRect.height / 2,
            fill: this.axisThemeConfig.titleColor,
            fontSize: this.axisConfig.titleFontSize,
            rotation: 270,
            verticalPos: 'top',
            horizontalPos: 'center',
          },
        ],
      });
    }
    return drawableElement;
  }
  private getDrawableElementsForBottomAxis(): DrawableElem[] {
    const drawableElement: DrawableElem[] = [];
    if (this.showAxisLine) {
      const y = this.boundingRect.y + this.axisConfig.axisLineWidth / 2;
      drawableElement.push({
        type: 'path',
        groupTexts: ['bottom-axis', 'axis-line'],
        data: [
          {
            path: `M ${this.boundingRect.x},${y} L ${
              this.boundingRect.x + this.boundingRect.width
            },${y}`,
            strokeFill: this.axisThemeConfig.axisLineColor,
            strokeWidth: this.axisConfig.axisLineWidth,
          },
        ],
      });
    }
    if (this.showLabel) {
      drawableElement.push({
        type: 'text',
        groupTexts: ['bottom-axis', 'label'],
        data: this.getTickValues().map((tick) => ({
          text: tick.toString(),
          x: this.getScaleValue(tick),
          y:
            this.boundingRect.y +
            this.axisConfig.labelPadding +
            (this.showTick ? this.axisConfig.tickLength : 0) +
            (this.showAxisLine ? this.axisConfig.axisLineWidth : 0),
          fill: this.axisThemeConfig.labelColor,
          fontSize: this.axisConfig.labelFontSize,
          rotation: 0,
          verticalPos: 'top',
          horizontalPos: 'center',
        })),
      });
    }
    if (this.showTick) {
      const y = this.boundingRect.y + (this.showAxisLine ? this.axisConfig.axisLineWidth : 0);
      drawableElement.push({
        type: 'path',
        groupTexts: ['bottom-axis', 'ticks'],
        data: this.getTickValues().map((tick) => ({
          path: `M ${this.getScaleValue(tick)},${y} L ${this.getScaleValue(tick)},${
            y + this.axisConfig.tickLength
          }`,
          strokeFill: this.axisThemeConfig.tickColor,
          strokeWidth: this.axisConfig.tickWidth,
        })),
      });
    }
    if (this.showTitle) {
      drawableElement.push({
        type: 'text',
        groupTexts: ['bottom-axis', 'title'],
        data: [
          {
            text: this.title,
            x: this.range[0] + (this.range[1] - this.range[0]) / 2,
            y:
              this.boundingRect.y +
              this.boundingRect.height -
              this.axisConfig.titlePadding -
              this.titleTextHeight,
            fill: this.axisThemeConfig.titleColor,
            fontSize: this.axisConfig.titleFontSize,
            rotation: 0,
            verticalPos: 'top',
            horizontalPos: 'center',
          },
        ],
      });
    }
    return drawableElement;
  }
  private getDrawableElementsForTopAxis(): DrawableElem[] {
    const drawableElement: DrawableElem[] = [];
    if (this.showAxisLine) {
      const y = this.boundingRect.y + this.boundingRect.height - this.axisConfig.axisLineWidth / 2;
      drawableElement.push({
        type: 'path',
        groupTexts: ['top-axis', 'axis-line'],
        data: [
          {
            path: `M ${this.boundingRect.x},${y} L ${
              this.boundingRect.x + this.boundingRect.width
            },${y}`,
            strokeFill: this.axisThemeConfig.axisLineColor,
            strokeWidth: this.axisConfig.axisLineWidth,
          },
        ],
      });
    }
    if (this.showLabel) {
      drawableElement.push({
        type: 'text',
        groupTexts: ['top-axis', 'label'],
        data: this.getTickValues().map((tick) => ({
          text: tick.toString(),
          x: this.getScaleValue(tick),
          y:
            this.boundingRect.y +
            (this.showTitle ? this.titleTextHeight + this.axisConfig.titlePadding * 2 : 0) +
            this.axisConfig.labelPadding,
          fill: this.axisThemeConfig.labelColor,
          fontSize: this.axisConfig.labelFontSize,
          rotation: 0,
          verticalPos: 'top',
          horizontalPos: 'center',
        })),
      });
    }
    if (this.showTick) {
      const y = this.boundingRect.y;
      drawableElement.push({
        type: 'path',
        groupTexts: ['top-axis', 'ticks'],
        data: this.getTickValues().map((tick) => ({
          path: `M ${this.getScaleValue(tick)},${
            y + this.boundingRect.height - (this.showAxisLine ? this.axisConfig.axisLineWidth : 0)
          } L ${this.getScaleValue(tick)},${
            y +
            this.boundingRect.height -
            this.axisConfig.tickLength -
            (this.showAxisLine ? this.axisConfig.axisLineWidth : 0)
          }`,
          strokeFill: this.axisThemeConfig.tickColor,
          strokeWidth: this.axisConfig.tickWidth,
        })),
      });
    }
    if (this.showTitle) {
      drawableElement.push({
        type: 'text',
        groupTexts: ['top-axis', 'title'],
        data: [
          {
            text: this.title,
            x: this.boundingRect.x + this.boundingRect.width / 2,
            y: this.boundingRect.y + this.axisConfig.titlePadding,
            fill: this.axisThemeConfig.titleColor,
            fontSize: this.axisConfig.titleFontSize,
            rotation: 0,
            verticalPos: 'top',
            horizontalPos: 'center',
          },
        ],
      });
    }
    return drawableElement;
  }

  getDrawableElements(): DrawableElem[] {
    if (this.axisPosition === 'left') {
      return this.getDrawableElementsForLeftAxis();
    }
    if (this.axisPosition === 'right') {
      throw Error('Drawing of right axis is not implemented');
    }
    if (this.axisPosition === 'bottom') {
      return this.getDrawableElementsForBottomAxis();
    }
    if (this.axisPosition === 'top') {
      return this.getDrawableElementsForTopAxis();
    }
    return [];
  }
}
